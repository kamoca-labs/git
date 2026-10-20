import { deny, readInput } from '../lib.ts'

readInput()
deny('no-api-commit', 'Commit pela API da forja não passa pelas regras de commit. Use /git:commit e git push.')
