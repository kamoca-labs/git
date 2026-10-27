import { test } from 'node:test'
import { allowed, denied, sandbox } from './helpers.ts'

const RULE = 'protected-branch-push'

test('a push of a regular branch passes', () => {
  allowed(sandbox().run(RULE, 'git push -u origin HEAD'))
})

test('ignores a command that is not a push', () => {
  allowed(sandbox('main').run(RULE, 'b=main; echo $b'))
})

test('denies a push to main without /git:main', () => {
  denied(sandbox().run(RULE, 'git push origin HEAD:main'), /git:main/)
  denied(sandbox('main').run(RULE, 'git push origin HEAD'), /git:main/)
})

test('with /git:main, a push to main passes', () => {
  const { run, prompt } = sandbox('main')
  prompt('/git:commit /git:main')
  allowed(run(RULE, 'git push origin HEAD'))
})

test('a tag-only push passes, even on main', () => {
  allowed(sandbox('main').run(RULE, 'git push origin refs/tags/v1.2.0'))
})

test('a tag together with a branch on main is still denied', () => {
  denied(sandbox('main').run(RULE, 'git push origin refs/tags/v1.2.0 HEAD'), /git:main/)
  denied(sandbox('main').run(RULE, 'git push --follow-tags origin refs/tags/v1.2.0 main'), /git:main/)
})
