# Handoff de continuidade — NFT Marketplace

Atualizado em 31/10/2026. Este registro preserva decisões, evidências e próximos passos para continuar o desafio sem repetir trabalho nem tratar amostras antigas como resultados finais.

## 1. Projeto e requisitos de origem

- Repositório do desafio em desenvolvimento: <https://github.com/dasilva-thiago/nft-marketplace>
- Repositório normativo: <https://github.com/junglegaming/frontend-challenge>
- README oficial: <https://github.com/junglegaming/frontend-challenge/blob/main/README.md>
- Referência visual Figma: <https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1>
- Checkout local: `/tmp/nft-marketplace`; branch de trabalho: `feat/complete-challenge-gaps`.
- Stack: React 19, TypeScript, Vite, TanStack Router/Query, Axios, REST, Socket.IO, Tailwind/shadcn, MSW, Playwright e Lighthouse.
- O README normativo exige três medições Lighthouse por rota/perfil; metas Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90; reportar mediana, LCP/CLS/TBT, ambiente, versões e justificativa para todo déficit. Início e detalhe devem ser medidos em mobile e desktop.
- O deploy público é obrigatório, mas o usuário informou que depende de autorização/acesso à conta do provedor.

## 2. Instruções e autorizações do usuário

O usuário pediu aderência estrita ao README do desafio, conclusão das etapas e aviso quando as etapas autorizadas estiverem finalizadas para então fazer uma revisão. O usuário autorizou commit/push para `main` nas mensagens anteriores e reiterou que o push pode ocorrer após finalizar a atividade atual.

Identidade Git obrigatória: `THIAGO DA SILVA <35014215+dasilva-thiago@users.noreply.github.com>`. Não publicar o projeto até o usuário autorizar/acessar o provedor. A configuração de Vercel/fallback SPA foi preparada; nenhuma publicação foi realizada.

## 3. Implementação consolidada

A aplicação simula catálogo, autenticação/sessão, favoritos, carrinho, perfil, carteiras, cotações, pedidos e recibos por MSW. Mantém estado de demonstração em `sessionStorage`, separa dados por usuário, oferece reset/scenarios e valida cotação/estoque ao criar pedidos. A criação de pedido é idempotente; consumo do carrinho é vinculado ao pedido confirmado. `nft.updated` e `order.updated` passam pelo binding Socket.IO/MSW e reconciliam com REST. Login/cadastro desktop usam modal e mobile usa tela dedicada; checkout/payment foi adaptado ao viewport mobile.

Mudanças e decisões recentes:

- O hero da home mobile foi compactado para cerca de 184 px conforme referência. Substituições de assets locais e decisões responsivas estão documentadas em `ARCHITECTURE.md`.
- Formulários de auth ganharam confirmação de senha, toggle de visibilidade e estados de erro/validação.
- `GET /api/session` usa `200 null` para visitante anônimo e `401` para sessão inválida/expirada, com API/contratos/testes/documentação alinhados.
- `src/main.tsx` monta React imediatamente, inicia MSW por importação assíncrona e publica `window.__KURIO_MSW_READY__` apenas em builds com mocks. Axios espera a promise real de readiness.
- O setup Playwright inicialmente falhava por corrida entre controller/Service Worker e os requests de reset. A solução usa a promise real de `worker.start()`, health/controller e reset confirmado antes do teste; `e2e/fixtures.ts` centraliza o handshake e evita o reset duplicado do spec visual.
- Correções de E2E alinharam seletores de senha, fixtures de carteiras, componentes de navegação mobile, baseline de home e estado inicial de cada teste.
- `scripts/prepare-responsive-images.py` deriva WebP 320/480/640/1200 dos quatro originais, preservando o aspect ratio; `responsive-nft-image.ts` emite esses tamanhos no `srcset`. Os originais não foram alterados. Uma variante 480 px foi conferida visualmente.
- Um experimento para adiar a inicialização do worker até depois do primeiro paint foi medido e revertido: o smoke de uma rodada não mostrou melhoria consistente em FCP/LCP e apresentou variação negativa em alguns cenários. O bootstrap atual mantém importação assíncrona imediata e a barreira de readiness para testes/API.

## 4. Evidências finais de Playwright e baselines

A suíte integral executada após as últimas mudanças terminou com **110 testes, 104 aprovados, 6 skips intencionais por viewport, 0 falhas**, em Chromium desktop/mobile. Comando: `pnpm test:e2e`. A execução direcionada anterior de visual/auth-api também passou em 14/14.

Há **8 baselines versionadas** em `e2e/visual-regression.spec.ts-snapshots/`: início, detalhe, carrinho e pagamento em desktop e mobile. O relatório HTML `playwright-report/index.html` é transitório/ignorado pelo Git; traces e screenshots de falha ficam nos diretórios de resultado temporários.

## 5. Matriz Lighthouse final

A execução final ocorreu em 31/10/2026, build otimizado com MSW default, três rodadas em cada uma das quatro combinações, sem PSI remoto. Existem 12 pares HTML/JSON (3 por rota/perfil) e manifests em `reports/lighthouse/`; a configuração está em `lighthouserc.json` e `lighthouserc.desktop.json`, e o executor é `pnpm audit:lighthouse`.

| Perfil  | Rota                   | Performance | Accessibility | Best Practices |  SEO |     LCP |   CLS |    TBT |
| ------- | ---------------------- | ----------: | ------------: | -------------: | ---: | ------: | ----: | -----: |
| mobile  | `/`                    |         84% |          100% |            96% | 100% | 3576 ms | 0.000 | 195 ms |
| mobile  | `/nft/emerald-ape-042` |         83% |          100% |            96% | 100% | 3777 ms | 0.013 | 162 ms |
| desktop | `/`                    |         61% |          100% |           100% | 100% | 3352 ms | 0.006 | 203 ms |
| desktop | `/nft/emerald-ape-042` |         64% |          100% |           100% | 100% | 3338 ms | 0.009 | 170 ms |

Accessibility, Best Practices e SEO cumprem as respectivas metas; **Performance não alcança 90 em nenhum dos quatro cenários** e precisa permanecer identificada como pendência, sem baixar thresholds. O resumo em `reports/lighthouse/summary.md` contém os três valores de cada medição e o ambiente: Node 22.23.4, Linux/arm64, pnpm 11.25.0, LHCI 0.15.1, Lighthouse 12.6.1 e Chromium 156.0.8078.47.

Causas medidas nos LHR finais: FCP aproximadamente 2,3–2,5 s; elemento LCP não descoberto no HTML inicial (primeiro card Pixel Cat #014/`monkey4` na home mobile; imagem Emerald Ape/`monkey3` no detalhe); chunk inicial `index-*.js` ~508 KB / 162 KB gzip; chunk MSW `browser-*.js` ~340 KB / 111 KB gzip; custo de script evaluation/layout. Oportunidades reportadas incluem cerca de 116–119 KiB de JavaScript não usado, 10–13 KiB de CSS não usado, CSS bloqueante (150–300 ms estimados) e imagens fora do tamanho ideal (45–196 KiB conforme rota/perfil). Foram adicionados tamanhos WebP menores, mas isso não eliminou o custo dominante de FCP/LCP. A síntese e valores detalhados estão em `ARCHITECTURE.md` e `reports/lighthouse/summary.md`.

## 6. Documentação no repositório

- `README.md`: setup, cenário/reset, variáveis, credenciais fictícias, comandos, estado e resultados Lighthouse.
- `ARCHITECTURE.md`: camadas, estado, contratos, mocks, realtime, decisões de responsividade/acessibilidade e auditoria final.
- `TODO.md`: checklist verificável, com Performance, revisão manual e deploy ainda abertos.
- `docs/api-contracts.md`: contratos REST, schemas, erros e eventos Socket.IO.
- `docs/visual-reference-inventory.md`: frames/referências e inventário visual.
- `docs/challenge-completion-plan.md`: estado consolidado, scores e pendências.
- `reports/lighthouse/summary.md`: medianas/ambiente; os HTML/JSON individuais estão nas pastas `mobile/` e `desktop/`.

## 7. Pendências verdadeiras

1. Otimizar a carga inicial e tentar atingir Performance ≥90. A matriz real ficou abaixo; preservar thresholds e mocks funcionais. Qualquer nova otimização deve ser medida novamente com três runs por rota/perfil e não pode simplificar a funcionalidade da demo.
2. Revisão visual fina dos frames Figma em 390/768/1440 px; as quatro rotas principais têm baselines, mas tipografia/proporções/espaçamentos ainda precisam de comparação manual detalhada.
3. Revisão manual global de zoom/reflow, contraste adicional e feedback de eventos em todas as telas. Playwright cobre navegação/foco/teclado, diálogos desktop, labels, landmarks e erros associados; contrastes representativos estão registrados.
4. Integração Git: a autorização para commit, merge em `main` e push ao remoto original está explícita. Esta sessão conclui a operação após validar tudo; ao retomar, confira `git log`, `git status` e `origin/main` primeiro. Se o commit já estiver no remoto, não repetir; caso contrário, concluir com a identidade exigida.
5. Deploy e validação de URL pública continuam bloqueados por autorização/acesso à conta. Só depois de obtidos, publicar build demo com MSW e validar acesso direto/refresh, mocks e realtime.
6. Depois das etapas autorizadas nesta sessão, avisar o usuário para a revisão final e declarar explicitamente se o deploy permaneceu como bloqueio externo.

## 8. Comandos para retomar

```bash
cd /tmp/nft-marketplace
pnpm format:check
pnpm typecheck
pnpm lint
pnpm test:e2e
pnpm audit:lighthouse
pnpm build
pnpm preview
```

Antes de commitar, verificar `git status --short --branch`, `git diff --check`, `git remote -v`, `git config user.name`, `git config user.email` e autenticação existente. Não usar `gh auth login` nem substituir credenciais/configuração global do usuário. Excluir artefatos transitórios como `playwright-report/`, `playwright-results*/`, `dist/`, `.lighthouseci/` e `node_modules/` do commit.
