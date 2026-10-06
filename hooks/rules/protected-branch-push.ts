import { deny, isMainAllowed, isProtectedBranch, readInput, runsGit } from '../lib.ts'

const input = readInput()
const command = input.tool_input.command || ''
const targetsMain = /\bgit\s+push\b[^\n;&|]*[\s:](main|master)\b/.test(command)
const refspecs = (command.match(/\bgit\s+push\b([^\n;&|]*)/)?.[1] || '').split(/\s+/).filter((arg) => arg && !arg.startsWith('-')).slice(1)
const onlyTags = refspecs.length > 0 && refspecs.every((refspec) => refspec.startsWith('refs/tags/'))

if (runsGit(command, 'push') && !onlyTags && (targetsMain || isProtectedBranch(input.cwd)) && !isMainAllowed(input)) {
  deny('protected-branch-push', 'Push na main só com /git:main no seu prompt. Use uma branch e /gitlab:mr.')
}
