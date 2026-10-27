import { commitMessage, deny, isCommit, isNoEdit, readInput } from '../lib.ts'

const input = readInput()

if (isCommit(input) && !isNoEdit(input) && commitMessage(input) === null) {
  deny('commit-message-readable', "Message not found. Use: git commit -F - <<'EOF' ... EOF")
}
