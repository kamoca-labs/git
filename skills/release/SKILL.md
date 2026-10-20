---
name: release
description: Gera a próxima versão a partir dos commits semânticos desde a última tag (semver), escreve o changelog, cria a tag anotada e a release no GitHub ou no GitLab.
argument-hint: "[major|minor|patch|vX.Y.Z] [rc]"
disable-model-invocation: true
---

# git:release

## Passos

1. Esteja na branch padrão, atualizada e limpa: `git switch <padrão> && git pull --ff-only`, com `git status` vazio.
2. Última tag: `git describe --tags --abbrev=0`. Sem tag nenhuma, a primeira versão é `v0.1.0` e o changelog cobre todo o histórico.
3. Commits desde a tag: `git log --format='%h%x09%s%x09%b%x1e' <tag>..HEAD`. Sem commits, pare: não há o que lançar.
4. Versão (o argumento, se vier, manda):
   - **major**: `!` depois do tipo ou do escopo (`feat!:`), ou `BREAKING CHANGE:` no body;
   - **minor**: algum `feat`;
   - **patch**: o resto.
   Antes da `1.0.0`, a quebra de compatibilidade sobe o minor. Com `rc`, use o sufixo `-rc.<n>`, contando as rc que já existem da mesma versão.
5. Escreva o changelog na língua do projeto, agrupado, com o efeito para quem usa. Não copie o título do commit:

```markdown
## vX.Y.Z (AAAA-MM-DD)

### ⚠️ Quebra compatibilidade
- o que muda e o que fazer para migrar

### Novidades
- ... (`feat`)

### Correções
- ... (`fix`)

### Melhorias
- ... (`perf`, `refactor` com efeito visível)
```

   Omita o grupo vazio. `chore`, `docs`, `style`, `test`, `ci` e `build` ficam de fora, a não ser que mudem algo para quem usa. Cite o chamado ou a issue quando o escopo é um número.
6. Mostre a versão e o changelog, e espere a confirmação.
7. Crie a tag anotada com o changelog e faça o push **só da tag**. O hook `protected-branch-push` libera `refs/tags/`:
   ```bash
   git tag -a vX.Y.Z -F - <<'EOF'
   <changelog>
   EOF
   git push origin refs/tags/vX.Y.Z
   ```
8. Crie a release na forja. Carregue a skill `git:forge` (Skill tool) para achar a forja e a ferramenta:
   - GitHub: `gh release create vX.Y.Z --notes-file <changelog>` (com `--prerelease` para rc);
   - GitLab: `create_release` pelo MCP, ou `glab release create vX.Y.Z --notes-file <changelog>`;
   - sem ferramenta: passe o link para criar a release à mão (`<url do repo>/releases/new?tag=vX.Y.Z` no GitHub, `<url do projeto>/-/releases/new?tag_name=vX.Y.Z` no GitLab) e o changelog para colar.
9. Devolva a versão e o link da release (ou da tag).

Se o repo tem `CHANGELOG.md`, a atualização dele vai **antes**, num PR/MR comum (`/git:commit /git:mr`). A tag sai depois do merge.
