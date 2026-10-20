---
name: daily
description: Junta o que você fez desde o último dia útil (commits em todos os repos locais e PR/MR abertos, mergeados e revisados no GitHub e no GitLab) e escreve os tópicos curtos para falar na daily, no formato ontem, hoje e bloqueios.
argument-hint: "[since:yesterday|AAAA-MM-DD] [pasta dos repos]"
---

# git:daily

## Período

Desde o último dia útil: a segunda-feira olha desde a sexta, e os outros dias olham desde ontem. O argumento `since:` substitui o período. Calcule com `date -d 'last friday' +%F` ou `date -d yesterday +%F`.

## Coleta

1. **Commits locais** em todos os repos da pasta (padrão `~/Development`), de todas as branches, inclusive as que não têm push. Filtre pelo **nome**, não pelo e-mail: o mesmo autor costuma commitar com mais de um e-mail (o do git local e o da conta da forja, usado nos merges pela interface):
   ```bash
   name=$(git config --global user.name)
   for repo in $(find ~/Development -maxdepth 3 -name .git -type d -prune | xargs -n1 dirname); do
     log=$(git -C "$repo" log --all --no-merges --author="$name" --since="<desde> 00:00" --format='%ad %s%n%b' --date=format:'%a %H:%M')
     [ -n "$log" ] && printf '## %s (%s)\n%s\n\n' "${repo##*/}" "$(git -C "$repo" remote get-url origin 2>/dev/null)" "$log"
   done
   ```
   Leia também o body (`%b`): o título sozinho esconde o efeito. Commits de hoje são trabalho em andamento: vão para "Hoje", não para "Ontem".
2. **Forjas**: separe os remotes do passo 1 por forja e consulte cada uma. Carregue a skill `git:forge` (Skill tool) para escolher a ferramenta. Se uma forja não tem MCP nem CLI com login, siga só com os commits e avise.
   - **GitHub**: `search_pull_requests` (ou `gh search prs`) com `author:@me` e com `reviewed-by:@me`, os dois com `updated:>=<desde>`, e `review-requested:@me is:open` para as pendências. A busca já traz as datas;
   - **GitLab**:
     - seu usuário: `get_user` com `me: true`;
     - grupos: os namespaces dos remotes (o caminho sem host, sem `/gitlab` e sem `.git`, até a última `/`, por exemplo `devel`). Consulte **por grupo** (`group_id`): a consulta pega também os projetos que você não tem clonados. O namespace pessoal (o seu username) não é grupo: consulte por `project_id`;
     - MRs seus: `list_merge_requests` com `group_id`, `scope: created_by_me` e `state: all`;
     - MRs em que você é revisor: a mesma consulta com `scope: review_requested`, uma vez com `state: all` e outra com `state: opened`, porque os parados há tempo não aparecem entre os recentes;
     - **a listagem do GitLab não traz datas.** Ela vem do mais novo para o mais antigo, por **criação**. Para cada MR, `get_merge_request` dá o `updatedAt` e o `mergedAt`. Fique com os atualizados no período. Um MR criado dias antes pode ter o merge no período: só pare quando o `createdAt` for 14 dias anterior ao início do período.
   - **O que você fez em cada PR/MR do período**: leia as notas e os reviews (`get_merge_request_notes` com `last: 100`, `get_pull_request_reviews`, `gh pr view <n> --json reviews,comments`). Conte só os seus, criados no período:
     - comentário comum ou em linha do diff: "revisei", com o número de comentários;
     - aprovação: "aprovei";
     - pedido de mudança: "pedi mudanças";
     - merge seu num PR/MR de outra pessoa: "mergeei";
     - num PR/MR seu, as respostas e as threads resolvidas entram no tópico do próprio PR/MR.
     PR/MR aberto em que você é revisor e não tem nota sua no período vira pendência em "Hoje". Se está aberto há mais de 2 semanas, cite a idade.
   - **CI dos seus PR/MR abertos**: o último pipeline ou workflow run (`get_merge_request_pipelines`, `gh pr checks`). Falha é bloqueio.
3. **Branch atual e trabalho sem commit** do repo em que o Claude está: `git status --short` e `git branch --show-current`. Isso é o "hoje" mais provável.

## Escrita

Um tópico por **projeto**, com uma linha por entrega dentro dele. Nunca junte projetos diferentes no mesmo tópico. Dentro do projeto, agrupe os commits do mesmo assunto (cinco commits de `fix(upload)` são uma linha) e fale do efeito, não do código.

```
Ontem
- billing-api
  - fotos dos usuários servidas de cópia local, revalidada no alfa
  - MCP para gerenciar clientes OAuth (!19)
- claude-plugins
  - /git:mr pelo MCP da forja (#5)
- revisei o MR de exportação do @ciclano (2 sugestões)

Hoje
- terminar os testes do upload e tirar o MR do draft
- revisar o MR !412

Bloqueios
- pipeline do !398 quebrando no job de integração (ambiente de testes fora)
```

- **Não omita entrega**: todo `feat`, `fix`, `perf` e `revert` do período aparece, numa linha própria ou junto com outros do mesmo assunto. Não há limite de tópicos. A concisão vem de cada linha ser curta (até cerca de 15 palavras), não de cortar trabalho.
- Projeto que não está clonado (só apareceu na forja): descreva pelos commits do PR/MR (`get_merge_request` com `include: ["commits"]`, `gh pr view <n> --json commits`).
- `chore`, `style`, `docs`, `test`, `ci` e `build` entram agrupados numa linha do projeto (por exemplo, "CI e deploy: ...") quando têm efeito visível. Senão, ficam de fora.
- Commit local e PR/MR do mesmo trabalho são uma linha só. Cite o número (`!iid` no GitLab, `#n` no GitHub).
- "Hoje" sai do que ficou em andamento: commits de hoje, PR/MR em draft, branch com commits sem PR/MR, review pendente com você e mudança sem commit.
- "Bloqueios" só com fato concreto: CI quebrado, PR/MR parado há mais de 2 dias esperando alguém, dependência citada na conversa. Sem nada, escreva `Sem bloqueios`.

Responda só com o texto da daily. Depois, escreva uma linha com o número de repos e de PR/MR que entraram, para conferir se faltou algo.
