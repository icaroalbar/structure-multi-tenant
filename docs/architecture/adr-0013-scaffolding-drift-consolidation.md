# ADR-0013: Consolidar Drift de Scaffolding Manual e Caminhos Legados

- Status: Aceito
- Data: 2026-03-02
- Issue: #13

## Contexto

Foi identificado drift local manual em dois blocos:
1. Configuração de agentes Codex.
2. Estruturas legadas de código fora do fluxo principal de API/Worker.

## Decisões

| Grupo | Decisão | Justificativa |
| --- | --- | --- |
| `.codex/config.toml`, `.codex/manager.toml`, `.codex/platform-architect.toml`, `.codex/worker.toml`, `.codex/qa.toml`, `.codex/issue-generator.toml` | **Manter** | Representam a configuração canônica atual dos agentes. |
| `.codex/agents/*.toml` | **Remover** | Estrutura duplicada/legada, substituída por `.codex/*.toml`. |
| `services/worker/src/app.module.ts`, `services/worker/src/modules/**`, `services/worker/src/shared/**`, `services/api/src/shared/**` | **Remover** | Caminhos legados fora da arquitetura vigente (`worker.module.ts`, `application/domain/infrastructure/interfaces`, `services/shared`). |
| `services/api/package.json`, `services/worker/package.json` | **Remover** | O monorepo usa `package.json` raiz como fonte única de scripts e dependências. |
| `services/*/tsconfig.json`, `services/*/tsconfig.build.json`, `services/*/tsconfig.spec.json` | **Manter** | Estrutura vigente por serviço para separar app/build e testes com tipagem explícita. |

## Consequências

- Qualquer reintrodução de caminhos legados passa a ser tratada como regressão.
- A validação de drift é automatizada no CI para impedir duplicidade de configuração e scaffolding fora do padrão.

