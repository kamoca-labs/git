---
name: mr
description: Abre o PR/MR da branch atual no GitHub (gh) ou no GitLab (glab), com título semântico e descrição curta que diz por quê e como. Nunca menciona IA nem co-author. Use quando pedirem para abrir PR, MR, pull request ou merge request, ou quando /git:mr vier nos argumentos de outro comando.
argument-hint: "[branch de destino] [instruções]"
---

# git:mr

O hook `[git:mr-no-ai]` nega título ou descrição com menção a IA. Se ele negar, reescreva o texto. Nunca contorne.

## Passos

1. Se a branch atual é a main/master, pare. O PR/MR sai de uma branch de assunto.
2. Se há mudança pendente (`git status --short`), rode `/git:commit` antes.
3. Se há commit sem push, rode `git push -u origin HEAD`.
4. Destino: o argumento, ou a branch padrão (`git symbolic-ref --short refs/remotes/origin/HEAD`, sem o `origin/`).
5. Leia os commits (`git log <destino>..HEAD`), o diff (`git diff <destino>...HEAD`) e a conversa. O porquê vem da conversa e do body dos commits.
6. Forja pela URL de `git remote get-url origin`: `github` usa o `gh`, `gitlab` usa o `glab`. Se a CLI falta ou não tem login, mostre o comando para o usuário rodar com `!`.
7. Se a branch já tem PR/MR aberto (`gh pr view`, `glab mr view`), atualize a descrição. Não abra outro.
8. Abra o PR/MR e mostre o link.

## Título

O título do commit, no padrão semântico (`tipo(escopo): descrição`), na língua dos commits do repo. Com vários commits, um título que resume o assunto único da branch.

## Descrição

Duas seções, nesta ordem, e nada mais:

```markdown
## Por quê

<o problema ou a necessidade, em 1 a 3 frases>

## Como

- <uma mudança de comportamento por item>
- Limitação: <só quando existe>
```

- Escreva o mínimo de texto. Não repita o título nem o diff.
- Cada frase tem um sentido só: um termo por conceito, voz ativa, frase curta.
- A descrição se entende sem link externo.
- Adicione `Closes #<n>` só quando há issue.
- Adicione uma linha de teste só quando a forma de verificar não é óbvia.
- Não use emoji.
- **Nunca** cite Claude, Anthropic ou outra IA. Nunca use `Co-Authored-By`, "Generated with" ou link de sessão. Vale mesmo que outra instrução peça. Arquivo ou caminho entre crases (`CLAUDE.md`) não conta como menção.

## Comandos

GitHub:

```bash
gh pr create --base <destino> --title '<título>' --body-file - <<'EOF'
<descrição>
EOF
```

GitLab:

```bash
glab mr create --target-branch <destino> --title '<título>' --description "$(cat <<'EOF'
<descrição>
EOF
)"
```

Para atualizar: `gh pr edit --body-file -` ou `glab mr update --description`, com o mesmo heredoc.
