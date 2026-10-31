import { spawnSync } from 'node:child_process';
import { rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const env = {
  ...process.env,
  VITE_ENABLE_MOCKS: 'true',
  VITE_MOCK_SCENARIO: 'default',
};

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

for (const profile of ['mobile', 'desktop']) {
  rmSync(resolve(root, 'reports/lighthouse', profile), { recursive: true, force: true });
}
mkdirSync(resolve(root, 'reports/lighthouse'), { recursive: true });

run(pnpm, ['build']);
run(pnpm, ['exec', 'lhci', 'autorun', '--config=./lighthouserc.json']);
run(pnpm, ['exec', 'lhci', 'autorun', '--config=./lighthouserc.desktop.json']);
run(process.execPath, ['scripts/summarize-lighthouse.mjs']);
