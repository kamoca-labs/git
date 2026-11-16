import { deny, gitArguments, readInput } from '../lib.ts'

const input = readInput()

function forcesDelete(args: string[]): boolean {
  const letters = args.filter((arg) => /^-[^-]/.test(arg)).join('').replaceAll('-', '')
  const deletes = letters.includes('d') || args.includes('--delete')
  const forces = letters.includes('f') || args.includes('--force')
  return letters.includes('D') || (deletes && forces)
}

if (gitArguments(input.tool_input.command || '', 'branch').some(forcesDelete)) {
  deny('no-force-branch-delete', 'Delete a branch with -d, never -D or -d -f: git refuses a branch that has a commit outside the default branch. If git refuses, stop and show the commits (git log origin/<default>..<branch> --oneline).')
}
