---
name: forge
description: Como achar a forja (GitHub ou GitLab) e o PR/MR, o pipeline ou o projeto a partir de um link, um número ou do origin, e qual ferramenta usar (MCP da forja, CLI gh/glab ou pedido ao usuário). Usada por git:mr, git:review, git:ci, git:daily e git:release; carregue antes de falar com a forja.
user-invocable: false
---

# git:forge

## Forja

A forja sai, nesta ordem, de:

1. um link nos argumentos ou na conversa: `github.com` é GitHub; um host com `/-/merge_requests/`, `/-/pipelines/` ou `/-/jobs/` no caminho é GitLab, mesmo em instância própria;
2. a URL de `git remote get-url origin`, quando não há link.

Um link pode apontar para outro repo, diferente do clone atual. Nesse caso, leia tudo pela forja e não suponha nada do clone.

## Projeto e número

- **GitHub**: `owner/repo` do caminho (`github.com/<owner>/<repo>/pull/<n>`, `/actions/runs/<id>`).
- **GitLab**: o caminho até o `/-/`, sem o subpath da instância (`/gitlab`), por exemplo `devel/protocolos`. O número vem depois (`/-/merge_requests/<iid>`, `/-/pipelines/<id>`, `/-/jobs/<id>`).
- Sem link: o projeto é o caminho do `origin`, sem o host, sem o subpath da instância e sem o `.git`.
- Número sem link (`12`, `!12`, `#12`): é do projeto do `origin`.

## Ferramenta

1. Se a sessão tem um servidor MCP dessa forja, use o MCP. O nome da ferramenta tem a forma `mcp__<servidor>__<ferramenta>`, por exemplo `mcp__github__get_pull_request` ou `mcp__plugin_gitlab_gitlab__get_merge_request`. Se há mais de um servidor da mesma forja, use o do usuário, sem o prefixo `plugin_`.
2. Se não há MCP, use a CLI: `gh` no GitHub, `glab` no GitLab. Para uma instância própria do GitLab, passe `GITLAB_HOST=<host>` ou `-R <host>/<projeto>`.
3. Se a CLI também não serve para o que falta, use a API da forja pela CLI (`gh api`, `glab api`).
4. Se o MCP pede autenticação, peça ao usuário para autenticar no `/mcp`. Se a CLI falta ou não tem login, mostre o comando para o usuário rodar com `!` (`! gh auth login`, `! glab auth login --hostname <host>`).

Escolha a ferramenta por operação: uma operação que o MCP não tem pode ir pela CLI, e o resto continua no MCP.

## Nunca

- Commit pela API da forja (`create_or_update_file`, `push_files`, `delete_file`, `add_commit`). O hook `no-api-commit` nega. Use `/git:commit` e `git push`.
- Squash, nem na criação nem no merge do PR/MR. O hook `mr-no-squash` nega.
- Menção a IA, `Co-Authored-By` ou "Generated with" em texto publicado na forja (PR/MR, comentário, review, release).
