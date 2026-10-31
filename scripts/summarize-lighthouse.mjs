import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const reportRoot = join(root, 'reports/lighthouse');
const routes = ['/', '/nft/emerald-ape-042'];
const profiles = ['mobile', 'desktop'];
const categoryIds = ['performance', 'accessibility', 'best-practices', 'seo'];
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const formatScore = (value) => `${(value * 100).toFixed(1)}%`;
const formatMetric = (value, digits = 0) => (value == null ? 'n/a' : Number(value).toFixed(digits));
const pnpmStore = join(root, 'node_modules/.pnpm');
const lhciDirectory = readdirSync(pnpmStore).find((name) => name.startsWith('@lhci+cli@'));
if (!lhciDirectory)
  throw new Error('Não foi possível localizar o pacote Lighthouse CI no pnpm store.');
const lighthousePackage = JSON.parse(
  readFileSync(join(pnpmStore, lhciDirectory, 'node_modules/lighthouse/package.json'), 'utf8'),
);

const runsByGroup = new Map();
for (const profile of profiles) {
  const directory = join(reportRoot, profile);
  const files = readdirSync(directory).filter(
    (name) => name.endsWith('.json') && name !== 'manifest.json',
  );
  for (const filename of files) {
    const lhr = JSON.parse(readFileSync(join(directory, filename), 'utf8'));
    const pathname = new URL(lhr.requestedUrl).pathname;
    const key = `${profile}|${pathname}`;
    if (!runsByGroup.has(key)) runsByGroup.set(key, []);
    runsByGroup.get(key).push({ filename, lhr });
  }
}

const lines = [
  '# Relatório Lighthouse — matriz de referência',
  '',
  `Execução: ${new Date().toISOString()}`,
  `Node.js: ${process.version}; plataforma: ${process.platform}/${process.arch}`,
  `pnpm: ${execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim()}`,
  `Lighthouse CI: ${execFileSync('pnpm', ['exec', 'lhci', '--version'], { encoding: 'utf8' }).trim()}`,
  `Lighthouse engine: ${lighthousePackage.version}`,
  `Chromium: ${execFileSync('chromium', ['--version'], { encoding: 'utf8' }).trim()}`,
  'Cenário: MSW default; mocks ativados no build de produção. Três execuções por rota/perfil; sem PSI remoto.',
  'Configurações: `lighthouserc.json` (mobile 390×844, DPR 2) e `lighthouserc.desktop.json` (desktop 1440×1000, DPR 1).',
  'As tabelas mostram mediana de três valores. LCP e TBT em milissegundos; CLS sem unidade. Relatórios HTML/JSON individuais estão nas pastas do perfil.',
  '',
  '| Perfil | Rota | Performance | Accessibility | Best Practices | SEO | LCP ms | CLS | TBT ms |',
  '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
];

for (const profile of profiles) {
  for (const route of routes) {
    const runs = runsByGroup.get(`${profile}|${route}`) ?? [];
    if (runs.length !== 3) {
      throw new Error(
        `Esperadas 3 execuções para ${profile} ${route}; encontradas ${runs.length}.`,
      );
    }
    const categoryMedian = Object.fromEntries(
      categoryIds.map((id) => [id, median(runs.map(({ lhr }) => lhr.categories[id]?.score ?? 0))]),
    );
    const lcp = median(runs.map(({ lhr }) => lhr.audits['largest-contentful-paint']?.numericValue));
    const cls = median(runs.map(({ lhr }) => lhr.audits['cumulative-layout-shift']?.numericValue));
    const tbt = median(runs.map(({ lhr }) => lhr.audits['total-blocking-time']?.numericValue));
    lines.push(
      `| ${profile} | ${route} | ${formatScore(categoryMedian.performance)} | ${formatScore(categoryMedian.accessibility)} | ${formatScore(categoryMedian['best-practices'])} | ${formatScore(categoryMedian.seo)} | ${formatMetric(lcp)} | ${formatMetric(cls, 3)} | ${formatMetric(tbt)} |`,
    );
    lines.push(
      `|  | Runs | ${runs.map(({ lhr }) => formatScore(lhr.categories.performance?.score ?? 0)).join(' / ')} | ${runs.map(({ lhr }) => formatScore(lhr.categories.accessibility?.score ?? 0)).join(' / ')} | ${runs.map(({ lhr }) => formatScore(lhr.categories['best-practices']?.score ?? 0)).join(' / ')} | ${runs.map(({ lhr }) => formatScore(lhr.categories.seo?.score ?? 0)).join(' / ')} | ${runs.map(({ lhr }) => formatMetric(lhr.audits['largest-contentful-paint']?.numericValue)).join(' / ')} | ${runs.map(({ lhr }) => formatMetric(lhr.audits['cumulative-layout-shift']?.numericValue, 3)).join(' / ')} | ${runs.map(({ lhr }) => formatMetric(lhr.audits['total-blocking-time']?.numericValue)).join(' / ')} |`,
    );
  }
}

lines.push('', '## Arquivos', '');
for (const profile of profiles) {
  lines.push(`- ${profile}/: relatórios HTML/JSON e manifest.json emitidos pelo Lighthouse CI.`);
}
lines.push(
  '',
  'Os relatórios são evidência de uma execução local específica; variações de hardware, navegador e execução podem alterar as pontuações. Confira abaixo das metas do desafio qualquer categoria que não as atinja.',
  '',
);
writeFileSync(join(reportRoot, 'summary.md'), lines.join('\n'));
console.log(`Resumo Lighthouse gravado em ${join(reportRoot, 'summary.md')}`);
