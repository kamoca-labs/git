# Uso do plugin `git`

## Sumário

- [Commitar o que está pendente](#commitar-o-que-está-pendente)
- [Commitar e encadear outro comando](#commitar-e-encadear-outro-comando)
- [Abrir o PR/MR](#abrir-o-prmr)
- [Dar instruções extras](#dar-instruções-extras)
- [Hotfix direto na main](#hotfix-direto-na-main)
- [Quando o hook nega](#quando-o-hook-nega)
- [Consultar a auditoria](#consultar-a-auditoria)

## Commitar o que está pendente

```
/git:commit
```

O Claude lê `git status`, o diff e a conversa, separa as mudanças por assunto e gera um commit por assunto:

```
fix(upload): reject files above the size limit

Por quê: anexos acima de 10 MB travavam a fila de processamento.
O que: valida o tamanho antes de enfileirar e devolve 422 com a mensagem.
```

Se você estiver na main, ele cria uma branch (`fix/rejeitar-anexo-grande`) antes de commitar.

## Commitar e encadear outro comando

```
/git:commit /<plugin>:<comando> @fulano
```

Faz os commits e o push, depois invoca o comando do outro plugin com o resto dos argumentos (abrir o PR/MR com revisor, por exemplo). O `git` não depende de nenhum plugin: qualquer um instalado serve.

## Abrir o PR/MR

```
/git:mr
/git:mr @fulano @ciclano
/git:mr @auto draft
/git:mr target:feat/upload-1
/git:commit /git:mr @auto
```

O Claude abre o PR/MR da branch no GitHub ou no GitLab, conforme o `origin`. Se a sessão tem o MCP da forja, ele usa o MCP. Se não tem, ele usa a CLI (`gh` ou `glab`).

O título segue o commit. A descrição tem duas seções obrigatórias e duas opcionais:

```markdown
## Por quê

Anexos acima de 10 MB travavam a fila de processamento.

## O que muda

- Valida o tamanho antes de enfileirar e devolve 422.

## Como testar

Envie um anexo de 11 MB e confira a resposta 422.
```

- `@fulano`: adiciona o revisor pelo username.
- `@auto`: adiciona os dois autores mais frequentes dos arquivos alterados, sem você.
- `draft`: abre como rascunho (`--draft` ou `Draft: ` no título do GitLab).
- `target:<branch>`: troca a branch de destino. O `/git:split` usa este argumento em cada parte.

O PR/MR nunca usa squash, nem na criação nem no merge. No GitLab, o MR sai com a opção de apagar a branch de origem no merge.

## Dar instruções extras

Tudo que não é modificador vira instrução:

```
/git:commit só os arquivos do backend, deixa o frontend para depois
/git:commit separa a migration do resto
```

## Hotfix direto na main

```
/git:commit /git:main
```

1. O Claude escreve a justificativa e o risco no body e commita sem pedir confirmação (o `/git:main` já é a autorização).
2. O commit sai com os trailers:

```
fix: restore login after expired certificate

Por quê: produção fora do ar, sem tempo para ciclo de PR/MR.
O que: troca o certificado vencido pelo renovado.

Main-Justification: incidente em produção, login indisponível para todos
Main-Risk: sem revisão; reverter com git revert <hash>
```

3. O commit vai para `~/.claude/git-main-audit.log`.

O `/git:main` vale só para o prompt em que foi digitado. No prompt seguinte, a main volta a ficar protegida.

## Quando o hook nega

O Claude recebe `[git:<regra>] motivo` (todas as regras violadas de uma vez), corrige e tenta de novo:

| Mensagem do hook | Chamada negada | Correção |
|---|---|---|
| `Título fora do padrão semântico` | `atualiza README` | `docs: update install steps` |
| `Conjunção (e/and/&/+) no título` | `feat: add export and import` | dois commits: `feat: add export`, `feat: add import` |
| `Título com 81 chars, máximo 72` | título longo | encurte; o detalhe vai para o body |
| `Body obrigatório` | `fix: typo` sem body | body com por quê e o quê |
| `Linha do body acima de 100 chars` | parágrafo numa linha | quebre a linha |
| `Co-author/atribuição não é permitida` | `Co-Authored-By: ...` | remova o trailer |
| `Commit direto na main só com /git:main` | commit na main | crie uma branch ou use `/git:main` |
| `Mensagem não encontrada` | `git commit` sem `-m` | `git commit -F - <<'EOF' ... EOF` |
| `PR/MR sem menção a IA` | descrição com `Generated with [Claude Code]` | remova a linha |
| `Título do PR/MR fora do padrão semântico` | `ajusta upload` | `fix(upload): reject large files` |
| `Descrição do PR/MR sem as seções obrigatórias: ## O que muda` | descrição só com o porquê | adicione a seção |
| `Squash nunca` | `gh pr merge --squash` | `gh pr merge --merge` |
| `Passe squash: false ao criar o MR` | `save_merge_request` sem `squash` | adicione `squash: false` |
| `Commit pela API da forja` | `create_or_update_file` no MCP do GitHub | `/git:commit` e `git push` |

## Consultar a auditoria

```bash
column -t -s $'\t' ~/.claude/git-main-audit.log
git log --grep 'Main-Justification:' --format='%h %ad %s' --date=short
```
