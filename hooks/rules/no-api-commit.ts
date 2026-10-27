import { deny, readInput } from '../lib.ts'

readInput()
deny('no-api-commit', 'A commit through the forge API skips the commit rules. Use /git:commit, which also pushes the branch.')
