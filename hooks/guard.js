#!/usr/bin/env node
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const SUBJECT_MAX = 72
const BODY_MIN = 30
const BODY_MAX = 1000
const BODY_LINE_MAX = 100
const MAIN_TRAILERS = ['Main-Justification:', 'Main-Risk:']
const PROTECTED_BRANCH = /^(main|master)$/
const SEMANTIC = /^(feat|fix|refactor|perf|test|docs|style|chore|ci|build|revert)(?:\(([^()\s]+)\))?!?: (\S.*)$/
const CONJUNCTION = /(^|\s)(and|e)(\s|$)|[&+]/i
const ATTRIBUTION = /co-authored-by|generated with \[?claude/i
const HEREDOC = /<<-?\s*['"]?(\w+)['"]?\n([\s\S]*?)\n\s*\1\b/
const AUDIT_LOG = process.env.GIT_GUARD_AUDIT_LOG || path.join(os.homedir(), '.claude', 'git-main-audit.log')

function deny(reason) {
  process.stderr.write(`[git-guard] ${reason}\n`)
  process.exit(2)
}

function git(cwd, ...args) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

function lastUserPrompt(transcriptPath) {
  let prompt = ''
  let lines = []
  try {
    lines = fs.readFileSync(transcriptPath, 'utf8').split('\n')
  } catch {
    return prompt
  }
  for (const line of lines) {
    if (!line.includes('"user"')) continue
    try {
      const entry = JSON.parse(line)
      const content = entry.message?.content
      if (entry.type === 'user' && !entry.isMeta && typeof content === 'string') prompt = content
    } catch {}
  }
  return prompt
}

function modifiers(transcriptPath) {
  const prompt = lastUserPrompt(transcriptPath).replace(/<[^>]+>/g, ' ')
  return {
    isMainAllowed: /(^|\s)\/git:main\b/.test(prompt),
    ticket: prompt.match(/(^|\s)\/git:chamado\s+(\d+)/)?.[2] ?? null,
  }
}

function runsGit(command, subcommand) {
  const withoutHeredoc = command.replace(new RegExp(HEREDOC.source, 'g'), '')
  return new RegExp(`\\bgit\\s+(-\\S+\\s+)*${subcommand}\\b`).test(withoutHeredoc)
}

function commitMessage(command, cwd) {
  const heredoc = command.match(HEREDOC)
  if (heredoc) return heredoc[2]

  const file = command.match(/(?:^|\s)(?:-F|--file)(?:=|\s+)(['"]?)([^\s'"]+)\1/)
  if (file && file[2] !== '-') {
    try {
      return fs.readFileSync(path.resolve(cwd, file[2]), 'utf8')
    } catch {
      return null
    }
  }

  const parts = [...command.matchAll(/(?:^|\s)(?:-[a-zA-Z]*m|--message)(?:=|\s+)(?:"((?:[^"\\]|\\.)*)"|'([^']*)')/g)]
    .map((match) => match[1] ?? match[2])
  return parts.length ? parts.join('\n\n') : null
}

function checkSubject(subject, ticket) {
  const semantic = subject.match(SEMANTIC)
  if (!semantic) deny(`Título fora do padrão semântico (tipo(escopo): descrição). Recebido: "${subject}"`)
  if (subject.length > SUBJECT_MAX) deny(`Título com ${subject.length} chars, máximo ${SUBJECT_MAX}: "${subject}"`)
  if (CONJUNCTION.test(semantic[3].replace(/`[^`]*`/g, ''))) {
    deny(`Conjunção (e/and/&/+) no título: um assunto por commit, separe em commits. "${subject}"`)
  }
  if (ticket && semantic[2] !== ticket) deny(`Com /git:chamado o escopo deve ser o chamado: tipo(${ticket}): ...`)
}

function checkBody(body) {
  if (body.length < BODY_MIN) deny(`Body obrigatório (mín ${BODY_MIN} chars) explicando por quê e o que muda.`)
  if (body.length > BODY_MAX) deny(`Body com ${body.length} chars, máximo ${BODY_MAX}.`)
  const longLine = body.split('\n').find((line) => line.length > BODY_LINE_MAX)
  if (longLine) deny(`Linha do body acima de ${BODY_LINE_MAX} chars, quebre: "${longLine.slice(0, 40)}..."`)
}

function checkMainCommit(body, mods) {
  if (!mods.isMainAllowed) deny('Commit direto na main só com /git:main no seu prompt. Crie uma branch.')
  const missing = MAIN_TRAILERS.filter((trailer) => !body.includes(trailer))
  if (missing.length) deny(`Commit na main exige no body: ${missing.join(' e ')} (motivo e riscos).`)
}

function checkCommit({ tool_input: { command }, cwd }, mods) {
  if (!runsGit(command, 'commit')) return
  const branch = git(cwd, 'rev-parse', '--abbrev-ref', 'HEAD')
  if (/--no-edit\b/.test(command)) {
    if (PROTECTED_BRANCH.test(branch) && !mods.isMainAllowed) deny('Commit direto na main só com /git:main.')
    return
  }
  const message = commitMessage(command, cwd)
  if (message === null) deny("Mensagem não encontrada. Use: git commit -F - <<'EOF' ... EOF")
  if (ATTRIBUTION.test(message)) deny('Co-author/atribuição não é permitida. Remova a linha.')
  const [subject, ...rest] = message.trim().split('\n')
  const body = rest.join('\n').trim()
  checkSubject(subject.trim(), mods.ticket)
  checkBody(body)
  if (PROTECTED_BRANCH.test(branch)) checkMainCommit(body, mods)
}

function checkPush({ tool_input: { command }, cwd }, mods) {
  if (!runsGit(command, 'push')) return
  const branch = git(cwd, 'rev-parse', '--abbrev-ref', 'HEAD')
  const targetsMain = /\bgit\s+push\b[^\n;&|]*[\s:](main|master)\b/.test(command)
  if ((PROTECTED_BRANCH.test(branch) || targetsMain) && !mods.isMainAllowed) {
    deny('Push na main só com /git:main no seu prompt. Use uma branch e abra MR (/gitlab:mr).')
  }
}

function audit({ tool_input: { command }, cwd }) {
  if (!runsGit(command, 'commit')) return
  if (!PROTECTED_BRANCH.test(git(cwd, 'rev-parse', '--abbrev-ref', 'HEAD'))) return
  const row = [new Date().toISOString(), git(cwd, 'rev-parse', '--show-toplevel'), git(cwd, 'log', '-1', '--format=%h\t%s')]
  fs.appendFileSync(AUDIT_LOG, `${row.join('\t')}\n`)
}

const input = JSON.parse(fs.readFileSync(0, 'utf8'))
input.cwd = input.cwd || process.cwd()
const checks = { commit: checkCommit, push: checkPush, audit }
checks[process.argv[2]]?.(input, modifiers(input.transcript_path))
