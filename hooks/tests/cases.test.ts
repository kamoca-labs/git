import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

type Case = {
  description: string
  origin: string
  branch: string
  prompt: string
  tool_name: string
  tool_input: { command: string }
  deny: string[]
}

type HookGroup = { matcher: string, hooks: { command: string }[] }

const HOOKS_DIR = path.join(import.meta.dirname, '..')
const hooks = JSON.parse(fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf8')).hooks
const cases: Case[] = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'cases.json'), 'utf8'))

function preToolRules(toolName: string): string[] {
  return (hooks.PreToolUse as HookGroup[])
    .filter((group) => new RegExp(`^(${group.matcher})$`).test(toolName))
    .flatMap((group) => group.hooks.map((hook) => hook.command.match(/rules\/([\w-]+)\.ts/)![1]))
}

for (const useCase of cases) {
  test(`[${useCase.origin}] ${useCase.description}`, () => {
    const box = sandbox(useCase.branch)
    box.prompt(useCase.prompt)
    const denied = preToolRules(useCase.tool_name)
      .filter((rule) => box.run(rule, useCase.tool_input.command).status === 2)
    assert.deepStrictEqual(denied.sort(), [...useCase.deny].sort())
  })
}
