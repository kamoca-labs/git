import { test } from 'node:test'
import { allowed, denied, sandbox } from './helpers.ts'

const RULE = 'protected-branch-push'

test('push de branch comum passa', () => {
  allowed(sandbox().run(RULE, 'git push -u origin HEAD'))
})

test('ignora comando que não é push', () => {
  allowed(sandbox('main').run(RULE, 'b=main; echo $b'))
})

test('nega push na main sem /git:main', () => {
  denied(sandbox().run(RULE, 'git push origin HEAD:main'), /git:main/)
  denied(sandbox('main').run(RULE, 'git push origin HEAD'), /git:main/)
})

test('com /git:main, push na main passa', () => {
  const { run, prompt } = sandbox('main')
  prompt('/git:commit /git:main')
  allowed(run(RULE, 'git push origin HEAD'))
})

test('push só de tag passa, mesmo na main', () => {
  allowed(sandbox('main').run(RULE, 'git push origin refs/tags/v1.2.0'))
})

test('tag junto com branch na main continua negado', () => {
  denied(sandbox('main').run(RULE, 'git push origin refs/tags/v1.2.0 HEAD'), /git:main/)
  denied(sandbox('main').run(RULE, 'git push --follow-tags origin refs/tags/v1.2.0 main'), /git:main/)
})
