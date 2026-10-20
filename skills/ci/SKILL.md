---
name: ci
description: Diagnostica o CI da branch atual, de um PR/MR ou de um link de pipeline, no GitHub Actions ou no GitLab CI. Lê o log dos jobs que falharam, aponta a causa e propõe a correção. Com retry, roda de novo os jobs quando a falha é intermitente.
argument-hint: "[<link|número do PR/MR|id do pipeline>] [retry] [contexto]"
---

# git:ci

## Ferramenta

Carregue a skill `git:forge` (Skill tool). Ela diz como achar a forja e o projeto a partir do link ou do origin, e qual ferramenta usar.

No GitHub, o pipeline é o **workflow run** do Actions. No GitLab, é o **pipeline**. O texto abaixo usa "pipeline" para os dois.

## Passos

1. Ache o pipeline:
   - link ou id do pipeline: use direto;
   - PR/MR (link ou número): o pipeline mais recente do commit de topo (`list_workflow_runs` com `head_sha`, `gh pr checks <n>`, `get_merge_request_pipelines`, `glab ci list --mr <iid>`);
   - sem argumento: o mais recente da branch atual (`git branch --show-current`): `list_workflow_runs` com `branch`, `gh run list --branch <b>`, `list_pipelines` com `ref`, `glab ci list --ref <b>`.
2. Se o pipeline ainda está rodando, diga isso e quais jobs faltam. Não espere.
3. Liste os jobs e pegue os que falharam, sem os que podem falhar (`continue-on-error`, `allow_failure`): `list_workflow_jobs`, `gh run view <id>`, `get_pipeline_jobs`, `glab ci view`.
4. Leia o log de cada job que falhou. O erro costuma estar no fim do log:
   - GitHub: `get_job_logs` com `failed_only` e `tail_lines`, ou `gh run view <id> --log-failed`;
   - GitLab: `get_job` com `include: ["log"]`, a partir dos últimos 50 KB (`byte_offset` = tamanho − 51200), ou `glab ci trace <job>`.
   Se a causa não está no trecho, volte no log.
5. Classifique cada falha:
   - **código**: teste, lint, build ou tipo quebrado pela mudança. Ache o arquivo e a linha no repo local e proponha a correção;
   - **intermitente**: timeout, rede, runner sem espaço, registry fora, teste que passa na branch de destino. Sugira `retry`;
   - **configuração**: workflow (`.github/workflows/*.yml`) ou `.gitlab-ci.yml`, variável ou secret que falta, imagem que não existe. Aponte a linha do arquivo.
   Para saber se a falha é nova, compare com o último pipeline da branch de destino.
6. Responda com uma linha por job: `job (stage)`, a causa em uma frase, o trecho do log que prova a causa (até 10 linhas) e a correção.
7. Se há `retry` nos argumentos e todas as falhas são intermitentes, rode de novo só os jobs que falharam: `rerun_failed_jobs` ou `gh run rerun <id> --failed` no GitHub, `retry_pipeline` ou `glab ci retry <job>` no GitLab. Falha de código não se resolve com retry: diga isso e não rode.

Não corrija o código sem o pedido do usuário. Se ele pedir, depois da correção invoque a skill `git:commit` (Skill tool).
