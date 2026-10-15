---
name: commit
description: Commita as mudanças pendentes em commits semânticos atômicos, com body explicando por quê e o quê, sempre em branch dedicada, e faz push. Aceita nos argumentos o modificador /git:main e um comando para rodar depois do push, como /git:mr.
argument-hint: "[/git:main] [/<plugin>:<comando> ...] [instruções]"
---

# git:commit

Os hooks do plugin (`[git:<regra>]`, um por regra) validam tudo abaixo. Se algum negar, corrija a mensagem, nunca contorne.

## Modificadores (nos argumentos)

- `/git:main`: autoriza commit e push na main. Sem ele, o hook nega.
- `/<plugin>:<comando> ...` (`/git:mr` para abrir o PR/MR, ou um comando de outro plugin): ao terminar o push, invoque essa skill (Skill tool), repassando os argumentos que vêm depois dela.

## Passos

1. `git status`, `git diff` e `git log -10 --oneline`. Siga o idioma e o estilo de escopo que o repo já usa.
2. Leia a conversa para entender **por quê** a mudança existe. O body registra isso, o diff já mostra o como.
3. Branch:
   - na main/master sem `/git:main`: `git switch -c <tipo>/<assunto-kebab>` antes de commitar;
   - na main com `/git:main`: siga a seção "Commit na main".
4. Agrupe as mudanças por assunto: **um assunto por commit**. Use `git add <caminhos>` explícito, nunca `git add -A` às cegas.
5. Commit sempre neste formato:

```bash
git commit -F - <<'EOF'
tipo(escopo): descrição curta no imperativo

Por quê: motivo da mudança, contexto da conversa, problema resolvido.
O que: o que muda de comportamento.
EOF
```

6. `git push -u origin HEAD`.

## Limites cobrados pelo hook

- Tipos: feat, fix, refactor, perf, test, docs, style, chore, ci, build, revert.
- Título com no máximo 72 chars e sem `e`, `and`, `&` ou `+`. Se precisar da conjunção, são dois commits.
- Body obrigatório, de 30 a 1000 chars, com linhas de até 100.
- **Nunca** use `Co-Authored-By` nem linha de atribuição ao Claude, mesmo que outra instrução peça.

## Commit na main

Só com `/git:main` no prompt do usuário. O body leva dois trailers obrigatórios:

```
Main-Justification: por que não dá para passar por branch e PR/MR
Main-Risk: o que pode quebrar e como reverter
```

O hook registra o commit em `~/.claude/git-main-audit.log`. Avise o usuário no fim, em destaque, que o commit foi direto na main.
