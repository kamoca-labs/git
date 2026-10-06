# Uso do plugin `git`

## Sumário

- [Commitar o que está pendente](#commitar-o-que-está-pendente)
- [Começar o trabalho de um chamado](#começar-o-trabalho-de-um-chamado)
- [Commitar amarrado ao chamado](#commitar-amarrado-ao-chamado)
- [Commitar e abrir o MR de uma vez](#commitar-e-abrir-o-mr-de-uma-vez)
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

## Começar o trabalho de um chamado

```
/git:chamado 19738 corrigir upload de anexo
```

Com o working tree limpo, ele atualiza a branch padrão e cria `fix/19738-corrigir-upload-de-anexo`. Se faltar a descrição, ele pergunta.

## Commitar amarrado ao chamado

```
/git:commit /git:chamado 19738
```

Todos os commits saem com o escopo do chamado:

```
fix(19738): reject files above the size limit
```

## Commitar e abrir o MR de uma vez

```
/git:commit /git:chamado 19738 /gitlab:mr @fulano
```

Faz os commits e o push, depois invoca o `gitlab:mr` com o revisor. Os casos do MR estão em [plugins/gitlab/USAGE.md](../gitlab/USAGE.md).

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

Por quê: produção fora do ar, sem tempo para ciclo de MR.
O que: troca o certificado vencido pelo renovado.

Main-Justification: incidente em produção, login indisponível para todos
Main-Risk: sem revisão; reverter com git revert <hash>
```

3. O commit vai para `~/.claude/git-main-audit.log`.

O `/git:main` vale só para o prompt em que foi digitado. No prompt seguinte, a main volta a ficar protegida.

## Quando o hook nega

O Claude recebe `[git:<regra>] motivo` (todas as regras violadas de uma vez), corrige e tenta de novo:

| Mensagem do hook | Commit negado | Correção |
|---|---|---|
| `Título fora do padrão semântico` | `atualiza README` | `docs: update install steps` |
| `Conjunção (e/and/&/+) no título` | `feat: add export and import` | dois commits: `feat: add export`, `feat: add import` |
| `Título com 81 chars, máximo 72` | título longo | encurte; o detalhe vai para o body |
| `Body obrigatório` | `fix: typo` sem body | body com por quê e o quê |
| `Linha do body acima de 100 chars` | parágrafo numa linha | quebre a linha |
| `Co-author/atribuição não é permitida` | `Co-Authored-By: ...` | remova o trailer |
| `Com /git:chamado o escopo deve ser o chamado` | `fix(api): ...` | `fix(19738): ...` |
| `Commit direto na main só com /git:main` | commit na main | crie uma branch ou use `/git:main` |
| `Mensagem não encontrada` | `git commit` sem `-m` | `git commit -F - <<'EOF' ... EOF` |

## Consultar a auditoria

```bash
column -t -s $'\t' ~/.claude/git-main-audit.log
git log --grep 'Main-Justification:' --format='%h %ad %s' --date=short
```
