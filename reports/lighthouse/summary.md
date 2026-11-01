# Relatório Lighthouse — matriz de referência

Execução: 2026-11-01T00:52:00.000Z
Node.js: v24.14.0; plataforma: win32/x64
pnpm: 10.x
Lighthouse CI: 0.15.1
Lighthouse engine: 12.x
Chromium: Chromium (bundled com LHCI)
Cenário: MSW default; mocks ativados no build de produção. Três execuções por rota/perfil; sem PSI remoto.
Configurações: `lighthouserc.json` (mobile 390×844, DPR 2) e `lighthouserc.desktop.json` (desktop 1440×1000, DPR 1).
As tabelas mostram mediana de três valores. LCP e TBT em milissegundos; CLS sem unidade. Relatórios HTML/JSON individuais estão nas pastas do perfil.

| Perfil | Rota | Performance | Accessibility | Best Practices | SEO | LCP ms | CLS | TBT ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| mobile | / | 87% | 100% | 96% | 100% | 3780 | 0.001 | 89 |
| mobile | /nft/emerald-ape-042 | 87% | 100% | 96% | 100% | 3846 | 0.013 | 38 |
| desktop | / | 68% | 100% | 100% | 100% | 3676 | 0.015 | 70 |
| desktop | /nft/emerald-ape-042 | 68% | 100% | 100% | 100% | 3701 | 0.020 | 48 |

## Comparação com linha de base (antes das otimizações)

| Perfil | Rota | Baseline | Otimizado | Δ Performance | Δ TBT |
| --- | --- | ---: | ---: | ---: | ---: |
| mobile | / | 84% | 87% | +3% | −106ms |
| mobile | /nft/emerald-ape-042 | 83% | 87% | +4% | −124ms |
| desktop | / | 61% | 68% | +7% | −133ms |
| desktop | /nft/emerald-ape-042 | 64% | 68% | +4% | −122ms |

## Otimizações aplicadas

1. **Code splitting via manualChunks**: vendor-react, vendor-tanstack, vendor-zod, vendor-axios, vendor-lucide em chunks separados com modulepreload — permite download paralelo e reduz o custo de avaliação inicial.
2. **CSS assíncrono + critical CSS inline**: CSS principal carregado via preload/onload trick; background, cor e fonte críticos inlinados no `<head>` para que a página nunca exiba fundo branco.
3. **Skeleton loader HTML com texto e imagem real**: inline `<script>` injeta esqueleto de UI (nav + grid/detalhe) no `#root` antes do JS de módulo carregar, trazendo FCP de ~2,7s para ~2,1s. A primeira card exibe a imagem LCP real (`/assets/monkey4-480.webp`) com `fetchpriority="high"`.
4. **MSW e tldts fora do caminho crítico**: chunks de MSW/socket.io (~340KB) permanecem completamente lazy; não aparecem em nenhum modulepreload.

## Déficit de Performance e justificativa

A meta de Performance ≥ 90 não foi atingida em nenhum dos quatro cenários. A causa é estrutural:

- **LCP**: o elemento LCP é a primeira imagem de NFT carregada após o ciclo React render → MSW inicializar (~700ms lazy) → chamada de API → dados chegam → `<img>` aparece no DOM. Esse ciclo resulta em LCP ≥ 3,6s, muito acima do limiar "bom" de 2,5s.
- **FCP**: 2,1s; o skeleton traz FCP para antes dos módulos JS carregarem, mas o skeleton é substituído pelo React, que registra uma nova candidata de LCP à ~3,6s.
- **Impossibilidade sem SSR**: sem renderização no servidor ou pre-rendering estático, o FCP/LCP mínimo real é limitado pelo tempo de bootstrap do JS (vendor-react ~275ms de avaliação) + tempo de hidratação do React + inicialização do MSW. Não é possível atingir LCP < 2,5s com essa arquitetura SPA.

Accessibility (100%), Best Practices (96–100%) e SEO (100%) atendem ou superam as metas do desafio em todos os cenários.

## Arquivos

- mobile/: relatórios HTML/JSON e manifest.json emitidos pelo Lighthouse CI.
- desktop/: relatórios HTML/JSON e manifest.json emitidos pelo Lighthouse CI.

Os relatórios são evidência de uma execução local específica; variações de hardware, navegador e execução podem alterar as pontuações. Confira abaixo das metas do desafio qualquer categoria que não as atinja.
