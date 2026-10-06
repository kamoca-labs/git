import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { git, isCommit, isProtectedBranch, readInput } from '../lib.ts'

const AUDIT_LOG = process.env.GIT_GUARD_AUDIT_LOG || path.join(os.homedir(), '.claude', 'git-main-audit.log')

const input = readInput()

if (isCommit(input) && isProtectedBranch(input.cwd)) {
  const { cwd } = input
  const row = [new Date().toISOString(), git(cwd, 'rev-parse', '--show-toplevel'), git(cwd, 'log', '-1', '--format=%h\t%s')]
  fs.appendFileSync(AUDIT_LOG, `${row.join('\t')}\n`)
}
