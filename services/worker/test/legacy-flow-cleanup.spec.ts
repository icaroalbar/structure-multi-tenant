import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

describe('Worker legacy flow cleanup', () => {
  const workerSrcDir = path.resolve(__dirname, '..', 'src');
  const legacyAppModulePath = path.join(workerSrcDir, 'app.module.ts');
  const legacyConsumerPath = path.join(
    workerSrcDir,
    'modules',
    'billing',
    'infrastructure',
    'consumers',
    'billing.consumer.ts'
  );
  const mainFilePath = path.join(workerSrcDir, 'main.ts');

  it('does not keep legacy AppModule bootstrap path', () => {
    expect(existsSync(legacyAppModulePath)).toBe(false);
  });

  it('does not keep legacy billing consumer path', () => {
    expect(existsSync(legacyConsumerPath)).toBe(false);
  });

  it('bootstraps WorkerModule in worker main entrypoint', () => {
    const mainSource = readFileSync(mainFilePath, 'utf8');

    expect(mainSource).toContain("import { WorkerModule } from './worker.module';");
    expect(mainSource).not.toContain('AppModule');
  });
});
