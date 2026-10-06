import { commitMessage, deny, isCommit, isMainAllowed, isProtectedBranch, readInput } from '../lib.ts'

const TRAILERS = ['Main-Justification:', 'Main-Risk:']

const input = readInput()

if (isCommit(input) && isProtectedBranch(input.cwd)) {
  if (!isMainAllowed(input)) deny('protected-branch-commit', 'Commit na main só com /git:main no seu prompt. Crie uma branch.')
  const body = commitMessage(input)?.body
  const missing = body === undefined ? [] : TRAILERS.filter((trailer) => !body.includes(trailer))
  if (missing.length) deny('protected-branch-commit', `Commit na main exige no body: ${missing.join(' e ')}.`)
}
