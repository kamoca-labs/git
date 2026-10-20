import { deny, mergeRequest, readInput, withoutHeredoc } from '../lib.ts'

const GITLAB_MERGE_REQUEST = /^mcp__.*gitlab.*__\w+_merge_request$/
const GITHUB_MERGE = /^mcp__.*github.*__merge_pull_request$/
const CLI_SQUASH_MERGE = /\b(?:gh\s+pr|glab\s+mr)\s+merge\b[^\n]*\s(?:--squash|-s)(?=\s|$)/
const CLI_SQUASH_BEFORE_MERGE = /\bglab\s+mr\s+(?:create|update)\b[^\n]*\s--squash-before-merge(?!=false)(?=[\s=]|$)/

const input = readInput()
const { tool_name = '', tool_input } = input
const command = withoutHeredoc(tool_input.command || '')
const isGitlab = GITLAB_MERGE_REQUEST.test(tool_name)

const asksSquash = CLI_SQUASH_MERGE.test(command)
  || CLI_SQUASH_BEFORE_MERGE.test(command)
  || (isGitlab && tool_input.squash === true)
  || (GITHUB_MERGE.test(tool_name) && tool_input.merge_method === 'squash')

if (asksSquash) {
  deny('mr-no-squash', 'Squash nunca: o histórico semântico de cada commit vai para a branch padrão como está.')
}
if (isGitlab && mergeRequest(input)?.isCreate && tool_input.squash !== false) {
  deny('mr-no-squash', 'Passe squash: false ao criar o MR, para não herdar o squash padrão do projeto.')
}
