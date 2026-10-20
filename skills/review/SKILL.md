---
name: review
description: Revisa o PR/MR de outra pessoa no GitHub ou no GitLab, a partir de um link, de um número ou dos PR/MR em que você é revisor. Lê o diff, as discussões e o contexto que o usuário passa, aponta bugs e problemas de design (com o craft), mostra os achados para confirmação e só então publica como comentários em linha num único review.
argument-hint: "[<link|número do PR/MR>] [approve] [contexto]"
---

# git:review

## Ferramenta

Carregue a skill `git:forge` (Skill tool). Ela diz como achar a forja e o PR/MR a partir do link ou do número, e qual ferramenta usar.

## Passos

1. Identifique o PR/MR:
   - link ou número: use direto, pela `git:forge`;
   - sem argumento: procure os PR/MR abertos em que você é revisor (`search_pull_requests` com `review-requested:@me`, `list_merge_requests` com `scope: review_requested`, `gh search prs --review-requested=@me --state=open`, `glab mr list --reviewer=@me`). Se há mais de um, pergunte qual.
2. Leia o contexto: título, descrição, commit de topo (`head.sha`, `diff_head_sha`) e discussões abertas. O texto que o usuário passa junto com o link também é contexto: siga o foco que ele pede.
3. Leia o diff até o fim, paginando:
   - GitHub: `get_pull_request_files` ou `gh pr diff <n>`;
   - GitLab: `get_merge_request_diffs` ou `glab mr diff <iid>`.
4. Para entender o código em volta da mudança, leia os arquivos inteiros. Se o repo está clonado, use `git fetch origin <branch>` e leia localmente. Se não está, leia pela forja (`get_file_contents`, `get_repository_file`, `gh api`, `glab api`), com a ref da branch de origem.
5. Revise nesta ordem de peso:
   - **bugs**: lógica errada, caso de borda, erro engolido, concorrência, dado perdido;
   - **segurança**: entrada sem validação, segredo no código, permissão que falta;
   - **descrição × código**: o PR/MR faz o que diz o `## O que muda`? Falta teste para o `## Como testar`?
   - **design**: invoque a skill `craft:craft` (Skill tool) sobre os arquivos alterados, se o plugin está instalado.
   Não repita o que já está nas discussões abertas. Não comente estilo que um linter pega.
6. Mostre os achados ao usuário antes de publicar, um por linha: `arquivo:linha`, gravidade (`bloqueante`, `sugestão`, `nit`) e o comentário. Espere a confirmação. O usuário pode cortar ou reescrever qualquer achado.
7. Publique tudo num único review:
   - **GitHub (MCP)**: crie o review pendente (`pull_request_review_write` com `method: create`), adicione um comentário por achado (`add_comment_to_pending_review`, com `path`, `line` e `side`) e envie com `method: submit_pending`, `event: COMMENT` ou `REQUEST_CHANGES`;
   - **GitHub (CLI)**: `gh api repos/{owner}/{repo}/pulls/<n>/reviews` com `commit_id`, `event`, `body` e `comments[]` (`path`, `line`, `side`, `body`);
   - **GitLab (MCP)**: `save_merge_request_review` com `method: submit_review`, `comments` (`file`, `new_line` ou `old_line`, `body`), `summary` e `verdict`. No máximo 20 comentários por chamada. Acima disso, divida, e mande o `summary` só na última;
   - **GitLab (CLI)**: uma discussão por achado (`glab api projects/:id/merge_requests/<iid>/discussions` com `position`), depois o resumo com `glab mr note`.
   Quando a correção é óbvia e cabe na linha, use o bloco de sugestão da forja (` ```suggestion `). O resumo tem duas ou três linhas, com a visão geral e o veredito: `Aprovado`, `Aprovado com sugestões` ou `Mudanças necessárias`.
8. Se há `approve` nos argumentos e nenhum achado `bloqueante`, aprove: `event: APPROVE` no GitHub, `method: approve` com o `sha` do passo 2 no GitLab (ou `gh pr review --approve`, `glab mr approve`).
9. Devolva o link do PR/MR e o número de comentários publicados.

## Tom dos comentários

- Na língua do projeto, direto, com o porquê: "isso estoura com lista vazia porque...", e não "talvez rever isso".
- Gravidade no início do comentário: `**bloqueante:**`, `**sugestão:**` ou `**nit:**`.
- No GitLab, nenhuma linha começa com `/`. O GitLab trata a linha como quick action.

**Nunca** publique sem a confirmação do passo 6. **Nunca** cite IA nem use `Co-Authored-By` ou "Generated with" nos comentários.
