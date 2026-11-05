import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const HOOKS_DIR = path.join(import.meta.dirname, '..')
const rules = fs.readdirSync(path.join(HOOKS_DIR, 'rules')).map((file) => path.basename(file, '.ts'))
const hooksJson = fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf8')
const wired = [...hooksJson.matchAll(/rules\/([\w-]+)\.ts/g)].map((match) => match[1])

test('every rule has a dedicated hook in hooks.json', () => {
  assert.deepStrictEqual(rules.filter((rule) => !wired.includes(rule)), [])
})

test('every hook in hooks.json points to a rule that exists', () => {
  assert.deepStrictEqual(wired.filter((rule) => !rules.includes(rule)), [])
})

test('each rule appears only once in hooks.json', () => {
  assert.strictEqual(new Set(wired).size, wired.length)
})

test('every rule has its own test', () => {
  const missing = rules.filter((rule) => !fs.existsSync(path.join(import.meta.dirname, `${rule}.test.ts`)))
  assert.deepStrictEqual(missing, [])
})

const PLUGIN_DIR = path.join(HOOKS_DIR, '..')
const SKILLS_DIR = path.join(PLUGIN_DIR, 'skills')
const ENTRY = ['ci', 'ci-cd', 'commit', 'daily', 'mr', 'review', 'split', 'sync', 'undo']
const DESCRIPTION_LIMIT = 300
const skills = fs.readdirSync(SKILLS_DIR).sort()
const skillText = (skill: string) => fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf8')
const references = skills.flatMap((skill) => {
  const dir = path.join(SKILLS_DIR, skill, 'references')
  return fs.existsSync(dir) ? fs.readdirSync(dir).map((file) => ({ skill, file, text: fs.readFileSync(path.join(dir, file), 'utf8') })) : []
})

test('only the entry skills are visible to Claude', () => {
  const visible = skills.filter((skill) => !/^disable-model-invocation: true$/m.test(skillText(skill)))
  assert.deepStrictEqual(visible, ENTRY)
})

test('no skill uses user-invocable: false without disable-model-invocation: true', () => {
  const wrong = skills.filter((skill) => /^user-invocable: false$/m.test(skillText(skill)) && !/^disable-model-invocation: true$/m.test(skillText(skill)))
  assert.deepStrictEqual(wrong, [])
})

test('every description has 300 characters or fewer', () => {
  for (const skill of skills) {
    const description = skillText(skill).match(/^description: (.*)$/m)?.[1] ?? ''
    assert.ok(description.length <= DESCRIPTION_LIMIT, `${skill}: ${description.length}`)
  }
})

test('every reference is linked from a SKILL.md and links no other reference', () => {
  const skillFiles = skills.map(skillText).join('\n')
  for (const reference of references) {
    assert.ok(skillFiles.includes(`references/${reference.file}`), `${reference.skill}/${reference.file} is not linked`)
    assert.doesNotMatch(reference.text, /\]\([^)]*references\/[\w-]+\.md/, `${reference.skill}/${reference.file} links a reference`)
  }
})

test('a reference with more than 100 lines starts with a table of contents', () => {
  for (const reference of references.filter((item) => item.text.split('\n').length > 100)) {
    assert.match(reference.text.slice(0, 600), /^## Contents$/m, `${reference.skill}/${reference.file}`)
  }
})

test('no file names the git:forge skill, which is now a reference', () => {
  const files = [
    ...skills.map(skillText),
    ...references.map((reference) => reference.text),
    ...rules.map((rule) => fs.readFileSync(path.join(HOOKS_DIR, 'rules', `${rule}.ts`), 'utf8')),
    fs.readFileSync(path.join(HOOKS_DIR, 'lib.ts'), 'utf8'),
    fs.readFileSync(path.join(PLUGIN_DIR, 'README.md'), 'utf8'),
    fs.readFileSync(path.join(PLUGIN_DIR, 'USAGE.md'), 'utf8'),
  ]
  for (const text of files) assert.doesNotMatch(text, /git:forge\b/)
})
