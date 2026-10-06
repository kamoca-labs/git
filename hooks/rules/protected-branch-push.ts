import { deny, isMainAllowed, isProtectedBranch, readInput, runsGit } from '../lib.ts'

const input = readInput()
const command = input.tool_input.command || ''
const targetsMain = /\bgit\s+push\b[^\n;&|]*[\s:](main|master)\b/.test(command)

if (runsGit(command, 'push') && (targetsMain || isProtectedBranch(input.cwd)) && !isMainAllowed(input)) {
  deny('protected-branch-push', 'Push na main só com /git:main no seu prompt. Use uma branch e /gitlab:mr.')
}
