---
name: mr
description: Abre ou atualiza o PR/MR da branch atual no GitHub ou no GitLab, pelo MCP da forja quando existe e pela CLI (gh, glab) quando não existe. Título semântico, descrição com por quê e o que muda, revisores informados ou sugeridos pelo histórico, draft e branch de destino. Nunca squash, nunca menção a IA. Use quando pedirem para abrir PR, MR, pull request ou merge request, ou quando /git:mr vier nos argumentos de outro comando.
argument-hint: "[@revisor ...|@auto] [draft] [target:<branch>] [instruções]"
---

# git:mr

Os hooks do plugin (`[git:<regra>]`, um por regra) validam o título, a descrição e o squash, tanto na CLI quanto no MCP. Se um hook negar, corrija. Nunca contorne.

## Argumentos

- `@fulano` (um ou mais): revisores, pelo username da forja.
- `@auto`: revisores sugeridos pelo histórico do git. Veja [Revisores](#revisores).
- `draft`: abre o PR/MR como rascunho.
- `target:<branch>`: branch de destino. Sem ele, o destino é a branch padrão. O `/git:split` usa este argumento.
- O resto vira instrução.

## Ferramenta

Carregue a skill `git:forge` (Skill tool). Ela diz como achar a forja e o projeto, e qual ferramenta usar: MCP, CLI ou pedido ao usuário.

## Passos

1. Se a branch atual é a main/master, pare. O PR/MR sai de uma branch de assunto.
2. Se há mudança pendente (`git status --short`), invoque antes a skill `git:commit` (Skill tool).
3. Se há commit sem push, rode `git push -u origin HEAD`.
4. Destino: o `target:<branch>`, ou a branch padrão (`git symbolic-ref --short refs/remotes/origin/HEAD`, sem o `origin/`).
5. Leia os commits (`git log --format='%s%n%b' <destino>..HEAD`), o diff (`git diff <destino>...HEAD`) e a conversa. O porquê vem da conversa e do body dos commits.
6. Procure um PR/MR aberto para a branch (`list_pull_requests`, `list_merge_requests`, `gh pr view` ou `glab mr view`). Se ele existe, atualize esse PR/MR. Não abra outro.
7. Escreva o título e a descrição. Veja as seções abaixo.
8. Abra ou atualize o PR/MR com os campos da [tabela](#campos-por-forja), e mostre o link.

## Título

- Um commit só: use o título do commit.
- Mais de um commit: escreva um título semântico (`tipo(escopo): descrição`) que resume o assunto único da branch.
- Até 72 caracteres, na língua dos commits do repo.
- Com `draft` no GitLab, comece o título com `Draft: `. O prefixo não conta nos 72 caracteres.

## Descrição

De 80 a 3000 caracteres. As duas primeiras seções são obrigatórias, e o hook `mr-sections` confere as duas:

```markdown
## Por quê

<o problema ou a necessidade, em 1 a 3 frases, com o contexto da conversa>

## O que muda

- <uma mudança de comportamento por item>
- Limitação: <só quando existe>

## Como testar

<passos ou comandos, só quando a verificação não é óbvia>

## Referências

<issue, PR/MR anterior da cadeia do /git:split, documento>
```

- Escreva o mínimo de texto. Não repita o título nem o diff.
- Cada frase tem um sentido só: um termo por conceito, voz ativa, frase curta.
- A descrição se entende sem link externo.
- Use as seções opcionais só quando têm conteúdo.
- Adicione `Closes #<n>` só quando há issue.
- Não use emoji.
- **Nunca** cite Claude, Anthropic ou outra IA. Nunca use `Co-Authored-By`, "Generated with" ou link de sessão. Vale mesmo que outra instrução peça. Arquivo ou caminho entre crases (`CLAUDE.md`) não conta como menção.

## Revisores

- `@fulano` nos argumentos: passe os usernames nos revisores.
- `@auto`: pegue os dois autores mais frequentes dos arquivos alterados, sem você (`git config user.email`):
  ```bash
  git log --format='%an <%ae>' -- $(git diff --name-only <destino>...HEAD) | sort | uniq -c | sort -rn | head -5
  ```
  Depois, confirme o username de cada um na forja: membros do projeto pelo MCP, `gh api repos/{owner}/{repo}/collaborators --jq '.[].login'` ou `glab api projects/:id/members/all`. Se um autor não tem conta, passe para o próximo da lista.
- Sem argumento: não adicione ninguém. Cite a sugestão do histórico na resposta final.

## Squash

**Nunca** use squash, nem na criação nem no merge. O histórico semântico de cada commit vai para a branch padrão como está, e o `/git:sync` depende disso para detectar o merge. O hook `mr-no-squash` nega:

- no MCP do GitLab, a criação sem `squash: false` explícito e qualquer `squash: true`;
- no MCP do GitHub, o `merge_pull_request` com `merge_method: "squash"`;
- na CLI, `gh pr merge --squash`, `glab mr merge --squash` e `glab mr create|update --squash-before-merge`.

## Campos por forja

| Campo | MCP do GitHub | `gh` | MCP do GitLab | `glab` |
|---|---|---|---|---|
| criar | `create_pull_request` | `gh pr create` | `save_merge_request` (ou `create_merge_request`) sem iid | `glab mr create` |
| atualizar | `update_pull_request` | `gh pr edit` | `save_merge_request` (ou `update_merge_request`) com `merge_request_iid` | `glab mr update` |
| destino | `base` | `--base` | `target_branch` | `--target-branch` |
| descrição | `body` | `--body-file -` | `description` | `--description` |
| draft | `draft: true` | `--draft` | prefixo `Draft: ` no título | `--draft` |
| revisores | `reviewers` | `--reviewer` | `reviewers` | `--reviewer` |
| squash | não existe na criação | não existe na criação | `squash: false` | não use `--squash-before-merge` |
| apagar a branch no merge | não existe | não existe | `remove_source_branch: true` | `--remove-source-branch` |

Se o MCP não aceita revisores na criação, adicione os revisores numa atualização logo depois.

## Comandos da CLI

GitHub:

```bash
gh pr create --base <destino> --title '<título>' [--draft] [--reviewer <user>] --body-file - <<'EOF'
<descrição>
EOF
```

GitLab:

```bash
glab mr create --target-branch <destino> --title '<título>' [--draft] [--reviewer <user>] --remove-source-branch --description "$(cat <<'EOF'
<descrição>
EOF
)"
```

Para atualizar: `gh pr edit --body-file -` ou `glab mr update --description`, com o mesmo heredoc.
