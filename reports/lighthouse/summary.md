# Relatório Lighthouse — matriz de referência

Execução: 2026-10-31T23:46:57.392Z
Node.js: v22.23.4; plataforma: linux/arm64
pnpm: 11.25.0
Lighthouse CI: 0.15.1
Lighthouse engine: 12.6.1
Chromium: Chromium 156.0.8078.47 built on Ubuntu 24.04.5 LTS
Cenário: MSW default; mocks ativados no build de produção. Três execuções por rota/perfil; sem PSI remoto.
Configurações: `lighthouserc.json` (mobile 390×844, DPR 2) e `lighthouserc.desktop.json` (desktop 1440×1000, DPR 1).
As tabelas mostram mediana de três valores. LCP e TBT em milissegundos; CLS sem unidade. Relatórios HTML/JSON individuais estão nas pastas do perfil.

| Perfil | Rota | Performance | Accessibility | Best Practices | SEO | LCP ms | CLS | TBT ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| mobile | / | 84.0% | 100.0% | 96.0% | 100.0% | 3576 | 0.000 | 195 |
|  | Runs | 84.0% / 85.0% / 84.0% | 100.0% / 100.0% / 100.0% | 96.0% / 96.0% / 96.0% | 100.0% / 100.0% / 100.0% | 3576 / 3456 / 3642 | 0.001 / 0.000 / 0.000 | 199 / 195 / 193 |
| mobile | /nft/emerald-ape-042 | 83.0% | 100.0% | 96.0% | 100.0% | 3777 | 0.013 | 162 |
|  | Runs | 83.0% / 83.0% / 85.0% | 100.0% / 100.0% / 100.0% | 96.0% / 96.0% / 96.0% | 100.0% / 100.0% / 100.0% | 3826 / 3777 / 3674 | 0.013 / 0.013 / 0.013 | 149 / 183 / 162 |
| desktop | / | 61.0% | 100.0% | 100.0% | 100.0% | 3352 | 0.006 | 203 |
|  | Runs | 61.0% / 61.0% / 60.0% | 100.0% / 100.0% / 100.0% | 100.0% / 100.0% / 100.0% | 100.0% / 100.0% / 100.0% | 3365 / 3342 / 3352 | 0.007 / 0.006 / 0.005 | 203 / 196 / 210 |
| desktop | /nft/emerald-ape-042 | 64.0% | 100.0% | 100.0% | 100.0% | 3338 | 0.009 | 170 |
|  | Runs | 65.0% / 63.0% / 64.0% | 100.0% / 100.0% / 100.0% | 100.0% / 100.0% / 100.0% | 100.0% / 100.0% / 100.0% | 3338 / 3389 / 3247 | 0.009 / 0.009 / 0.018 | 158 / 170 / 175 |

## Arquivos

- mobile/: relatórios HTML/JSON e manifest.json emitidos pelo Lighthouse CI.
- desktop/: relatórios HTML/JSON e manifest.json emitidos pelo Lighthouse CI.

Os relatórios são evidência de uma execução local específica; variações de hardware, navegador e execução podem alterar as pontuações. Confira abaixo das metas do desafio qualquer categoria que não as atinja.
