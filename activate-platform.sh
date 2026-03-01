#!/bin/bash
set -e

echo "🚀 Configurando Git..."

git init 2>/dev/null || true
git checkout -B develop

echo "📦 Criando commit inicial..."
git add .
git commit -m ":tada: chore: estrutura inicial da plataforma" || true

echo "🌍 Criando repositório no GitHub..."
gh repo create structure-multi-tenant --private --source=. --remote=origin --push || true

echo "🧠 Criando Manager Agent..."

mkdir -p .codex/agents

cat <<EOT > .codex/agents/manager.toml
model = "gpt-5.3-codex"
model_reasoning_effort = "high"
sandbox_mode = "read-only"

developer_instructions = """
Você é o manager da plataforma.

Fluxo:
1. Verificar se há PR aberto.
2. Se houver CHANGES_REQUESTED → entrar modo correção.
3. Se houver PR aberto → bloquear nova execução.
4. Se não houver → selecionar próxima issue aberta.
5. Criar branch seguindo GitFlow:
   feature/<issue>-<slug>
6. Spawn platform_architect.
7. Spawn worker.
8. Criar PR.
9. Parar execução.
"""
EOT

echo "📝 Criando ISSUE TEMPLATE..."

mkdir -p .github/ISSUE_TEMPLATE

cat <<EOT > .github/ISSUE_TEMPLATE/feature.yml
name: Feature
description: Nova funcionalidade
title: "[FEATURE] "
labels: []
body:
  - type: textarea
    id: contexto
    attributes:
      label: Contexto
  - type: textarea
    id: objetivo
    attributes:
      label: Objetivo
  - type: textarea
    id: aceite
    attributes:
      label: Critérios de Aceite
EOT

echo "🧩 Criando primeira issue multi-tenant..."

gh issue create \
  --title "[FEATURE] Base multi-tenant platform" \
  --body "
## Contexto
Criar base backend multi-tenant com:
- NestJS API
- NestJS Worker
- Postgres
- Redis idempotência
- RabbitMQ + DLQ
- Extração tenant_id via JWT

## Critérios de Aceite
- [ ] Estrutura DDD criada
- [ ] API inicial funcionando
- [ ] Worker conectado
- [ ] Redis funcionando
- [ ] DLQ configurada
- [ ] Tenant extraído do token
" || true

echo "🔄 Fazendo push da branch develop..."
git push -u origin develop || true

echo ""
echo "✅ Plataforma ativada com sucesso!"
echo ""
echo "👉 Agora abra o Codex nesta pasta e execute:"
echo ""
echo "Spawn manager e execute a issue inicial."
echo ""
