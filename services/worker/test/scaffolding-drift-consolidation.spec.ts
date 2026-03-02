import { existsSync } from 'node:fs';
import path from 'node:path';

describe('Scaffolding drift consolidation guard', () => {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');

  const requiredCodexFiles = [
    '.codex/config.toml',
    '.codex/manager.toml',
    '.codex/platform-architect.toml',
    '.codex/worker.toml',
    '.codex/qa.toml',
    '.codex/issue-generator.toml'
  ];

  const forbiddenLegacyPaths = [
    '.codex/agents',
    'services/worker/src/app.module.ts',
    'services/worker/src/modules',
    'services/worker/src/shared',
    'services/api/src/shared',
    'services/api/package.json',
    'services/worker/package.json'
  ];

  const requiredServiceTsConfigs = [
    'services/api/tsconfig.json',
    'services/api/tsconfig.build.json',
    'services/api/tsconfig.spec.json',
    'services/worker/tsconfig.json',
    'services/worker/tsconfig.build.json',
    'services/worker/tsconfig.spec.json'
  ];

  it('keeps only canonical Codex config file locations', () => {
    for (const relativePath of requiredCodexFiles) {
      expect(existsSync(path.join(repoRoot, relativePath))).toBe(true);
    }
  });

  it('does not reintroduce forbidden legacy paths', () => {
    for (const relativePath of forbiddenLegacyPaths) {
      expect(existsSync(path.join(repoRoot, relativePath))).toBe(false);
    }
  });

  it('keeps tsconfig segmentation by service', () => {
    for (const relativePath of requiredServiceTsConfigs) {
      expect(existsSync(path.join(repoRoot, relativePath))).toBe(true);
    }
  });
});
