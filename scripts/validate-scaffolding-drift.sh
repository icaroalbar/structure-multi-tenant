#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_codex_files=(
  ".codex/config.toml"
  ".codex/manager.toml"
  ".codex/platform-architect.toml"
  ".codex/worker.toml"
  ".codex/qa.toml"
  ".codex/issue-generator.toml"
)

for file in "${required_codex_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required Codex config: $file"
    exit 1
  fi
done

if [[ -d ".codex/agents" ]]; then
  echo "Legacy Codex path must not exist: .codex/agents"
  exit 1
fi

forbidden_paths=(
  "services/worker/src/app.module.ts"
  "services/worker/src/modules"
  "services/worker/src/shared"
  "services/api/src/shared"
  "services/api/package.json"
  "services/worker/package.json"
)

for path in "${forbidden_paths[@]}"; do
  if [[ -e "$path" ]]; then
    echo "Forbidden legacy path detected: $path"
    exit 1
  fi
done

required_service_tsconfigs=(
  "services/api/tsconfig.json"
  "services/api/tsconfig.build.json"
  "services/api/tsconfig.spec.json"
  "services/worker/tsconfig.json"
  "services/worker/tsconfig.build.json"
  "services/worker/tsconfig.spec.json"
)

for file in "${required_service_tsconfigs[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required service tsconfig: $file"
    exit 1
  fi
done

echo "Scaffolding drift validation passed."
