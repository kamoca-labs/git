import { commitMessage, deny, isCommit, isMainAllowed, isProtectedBranch, readInput } from '../lib.ts'

const TRAILERS = ['Main-Justification:', 'Main-Risk:']

const input = readInput()

if (isCommit(input) && isProtectedBranch(input.cwd)) {
  if (!isMainAllowed(input)) deny('protected-branch-commit', 'A commit on main needs /git:main in your prompt. Create a branch.')
  const body = commitMessage(input)?.body
  const missing = body === undefined ? [] : TRAILERS.filter((trailer) => !body.includes(trailer))
  if (missing.length) deny('protected-branch-commit', `A commit on main needs these trailers in the body: ${missing.join(' and ')}.`)
}
