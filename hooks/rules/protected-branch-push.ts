import { deny, isMainAllowed, isProtectedBranch, readInput, runsGit } from '../lib.ts'

const input = readInput()
const command = input.tool_input.command || ''
const targetsMain = /\bgit\s+push\b[^\n;&|]*[\s:](main|master)\b/.test(command)
const refspecs = (command.match(/\bgit\s+push\b([^\n;&|]*)/)?.[1] || '').split(/\s+/).filter((arg) => arg && !arg.startsWith('-')).slice(1)
const onlyTags = refspecs.length > 0 && refspecs.every((refspec) => refspec.startsWith('refs/tags/'))

if (runsGit(command, 'push') && !onlyTags && (targetsMain || isProtectedBranch(input.cwd)) && !isMainAllowed(input)) {
  deny('protected-branch-push', 'A push to main needs /git:main in your prompt. Use a branch and open a PR/MR.')
}
