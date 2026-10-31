# Arquitetura do NFT Marketplace

## Escopo e limites

Esta aplicação é uma SPA React + TypeScript para descoberta, compra simulada e gestão de conta de colecionador. O Figma é a referência de composição visual; o README oficial do desafio determina os comportamentos e os critérios de aceite. As telas previstas são início, detalhe do NFT, carrinho, pagamento, confirmação do pedido, login, cadastro, perfil e carteiras.

Sessões, catálogo, favoritos, carrinho, perfil, carteiras, cotações, pedidos, conexão de carteira e pagamento são simulados. Não há conexão com blockchain, extensões de carteira, gateway de pagamento ou conteúdo privado de backend. Páginas independentes de editorial, suporte, atividade, ofertas e downloads ficam fora do escopo; controles auxiliares não devem aparentar concluir ações que não existem.

## Camadas e direção das dependências

```text
src/app (bootstrap, providers, rotas)
        ↓
src/features/* (UI e regras por domínio)
        ↓
src/shared (contratos, schemas, APIs, queries, UI e utilitários)

src/mocks intercepta HTTP/WebSocket no limite de transporte
src/realtime encapsula o cliente socket.io-client e sincroniza o cache
```

`src/app/router.tsx` compõe rotas TanStack Router e proteções; `src/app/providers` configura TanStack Query. As páginas usam `lazyRouteComponent` e só são carregadas ao abrir/precarregar a rota. Cada feature possui páginas, componentes, schemas, API, queries e mutations do domínio. `src/shared/contracts` mantém contratos e validação Zod; `src/shared/api` configura Axios; `src/shared/query` define o cache; `src/shared/lib` contém utilitários puros, inclusive aritmética decimal de ETH; `src/shared/ui` reúne componentes reutilizáveis.

Features não importam handlers ou estado interno de `src/mocks`; componentes e APIs de domínio não contêm respostas fictícias. As chamadas REST usam Axios e os handlers MSW interceptam o transporte. Consultas recebem `AbortSignal` do TanStack Query e as chaves incluem parâmetros da consulta; recursos privados também incluem a identidade do usuário.

## Contratos, sessão e estado

Os contratos REST de sessão/conta, NFTs, favoritos, carrinho, cotação, pedidos, perfil e carteiras, seus schemas e erros tipados estão em `src/shared/contracts/` e `docs/api-contracts.md`. Valores ETH permanecem como strings decimais de ponta a ponta; `big.js` é usado para cálculos e quantidades são inteiras.

O mock usa dois usuários fictícios documentados no README. Senhas são validadas no cadastro/login, mas não são retornadas nem persistidas. Um handle opaco identifica a sessão e permite recuperá-la após refresh. Logout, expiração e troca de identidade limpam o cache privado e as subscriptions da conta anterior. Checkout, favoritos, perfil, carteiras e pedidos exigem sessão.

O carrinho visitante é persistido no armazenamento local e, após autenticação, é mesclado com o carrinho da conta; a limpeza do carrinho visitante só ocorre após o merge bem-sucedido. O carrinho autenticado, favoritos, perfil, carteiras, cotações e pedidos são isolados por usuário. O estado do mock é serializado em `sessionStorage` para sobreviver ao refresh na sessão de demonstração; o reset restaura o cenário `default`, limpa armazenamento local/sessão e invalida o QueryClient.

A política de cache limita retries a consultas seguras e falhas transitórias; mutations não são repetidas automaticamente. Mutations otimistas guardam snapshot e fazem rollback em erro. Após mutation REST, somente recursos relacionados são invalidados/atualizados. Erros de validação, sessão inválida, autorização, recurso ausente, conflito de disponibilidade, indisponibilidade e timeout são representados por contratos tipados.

## Compra idempotente e recibo

A cotação da API é a referência para finalizar a compra. Ela é vinculada aos itens, cupom, carteira e rede; o servidor simulado revalida preço, disponibilidade, desconto e taxas no envio. Uma diferença exige nova revisão explícita. A criação do pedido usa chave de idempotência: replay com o mesmo conteúdo recupera o mesmo pedido e reutilização com conteúdo diferente produz conflito. Após timeout, a recuperação consulta a tentativa original pela mesma chave.

Cada pedido preserva um snapshot imutável de itens, imagens, preços, taxas, total e referência simulada. O recibo não muda se o catálogo for atualizado. `pending` pode ser reconciliado após refresh/reconexão; `confirmed` e `rejected` são estados terminais. Só um pedido efetivamente `confirmed` mostra confirmação, e somente então o backend simulado consome as quantidades compradas, preservando o restante do carrinho. Falhas de pagamento preservam os itens.

## MSW e tempo real

`VITE_ENABLE_MOCKS=true` ativa o worker MSW durante desenvolvimento e build de demonstração. Cenários configuráveis cobrem sucesso, resultado vazio, lentidão, respostas fora de ordem, limites/falhas HTTP, sessão expirada, falhas de favorito, timeout, alteração de preço/estoque e estados de pagamento. `/api/__mock/scenario` e `/api/__mock/reset` são controles exclusivos do ambiente simulado, não APIs de produção.

O bootstrap renderiza o React sem aguardar o registro do Service Worker e inicia MSW por importação assíncrona. O cliente Axios aguarda a promise real de prontidão antes de emitir qualquer request; dados de negócio continuam vindo exclusivamente dos handlers. A aplicação expõe essa promise apenas em builds com mocks para a fixture Playwright validar o handshake. A conexão realtime é iniciada somente depois de uma sessão mock validada.

`nft.updated` e `order.updated` carregam identificador de evento/recurso, versão, instante e payload. Os eventos são disparados pela integração `@mswjs/socket.io-binding` e recebidos pelo `socket.io-client`; não atualizam a UI por setters ou atalhos diretos. Eventos duplicados ou com versão antiga são ignorados. Atualizações de NFT refletem no catálogo/detalhe/carrinho e invalidam cotações; alterações de pedido atualizam o snapshot consultado. Após reconexão, recursos ativos são reconciliados por REST; listeners são liberados ao encerrar o ciclo de vida ou trocar de sessão.

Limitação: o binding MSW opera sobre WebSocket e não reproduz todo o comportamento de um servidor Socket.IO, como rooms e broadcasting completo. O transporte e os cenários cobertos são adequados à simulação local do desafio, não constituem serviço realtime de produção.

## Decisões visuais, responsivas e acessibilidade

Os frames disponíveis são avaliados nas larguras 390, 768 e 1440 px. A home mobile usa hero compacto de 184 px, preservando título, chamada e arte na mesma composição; grids e breakpoints são mantidos sem criar páginas fora do escopo. Os quatro assets locais `public/assets/monkey1.webp` a `monkey4.webp` são reutilizados deterministicamente nas fixtures, pois os assets individuais de produto do Figma não estão disponíveis. A arte local padrão aparece como placeholder visual no primeiro render do hero e do skeleton de detalhe; nenhum dado de negócio é exibido sem a API. Cards, hero e galeria recebem `srcSet` com derivados 320/480/640/1200 px gerados por `scripts/prepare-responsive-images.py`, preservando originais e proporções, e a primeira imagem de catálogo tem prioridade de fetch. Não se utiliza uma captura integral do Figma como imagem de produto. Fontes exportadas adicionais também não estão presentes.

Login e cadastro desktop são diálogos modais sobre uma cena de catálogo; em mobile são telas dedicadas. O diálogo desktop informa `role=dialog`/`aria-modal`, associa o título, contém o foco, fecha com Escape e devolve o foco ao elemento anterior. Em telas móveis, checkout prioriza seleção de carteira/rede, total e CTA, mantendo revisão e dados exigidos pelo fluxo. Perfil, carteiras e confirmação não possuem frames mobile específicos; suas versões mobile adaptam a composição desktop com navegação em grade e formulários em uma coluna.

Formulários têm labels, estados inválidos e erros ligados por `aria-describedby`; navegação, links e botões recebem foco visível; feedbacks de mutations e eventos usam regiões live. O CSS respeita `prefers-reduced-motion` e estados não dependem apenas de cor. Contrastes representativos foram verificados contra WCAG: texto base `#f2eee8` sobre `#100d0c` (16,75:1), navegação `#c9bdb2` sobre `#15100f` (10,25:1), botão âmbar `#1b110c` sobre `#e99a45` (8,10:1), indicador de foco `#e99a45` sobre `#100d0c` (8,45:1), placeholder `#a08c7f` sobre `#171210` (5,80:1) e links/toggles da autenticação `#c18d58` sobre `#2a1812` (5,83:1). A auditoria automática confirmou Accessibility 100% nos quatro cenários; a revisão manual global de zoom/reflow e feedback de eventos continua pendente.

## Validação e resultados Lighthouse

A suíte Playwright final lista 110 execuções Chromium desktop/mobile: 104 aprovadas e 6 skips intencionais por viewport, sem falhas. A fixture aguarda a promise real de `worker.start()`, o controller e os handlers de health/reset antes de prosseguir. Existem baselines versionadas de início, detalhe, carrinho e pagamento em ambos os perfis.

A matriz Lighthouse final usou build de produção com MSW default, três medições por rota/perfil, sem PSI remoto. Os relatórios HTML/JSON individuais e o resumo integral estão em `reports/lighthouse/`; versões e ambiente estão no topo de `reports/lighthouse/summary.md`.

| Perfil  | Rota                   | Performance | Accessibility | Best Practices |  SEO |     LCP |   CLS |    TBT |
| ------- | ---------------------- | ----------: | ------------: | -------------: | ---: | ------: | ----: | -----: |
| mobile  | `/`                    |         84% |          100% |            96% | 100% | 3576 ms | 0.000 | 195 ms |
| mobile  | `/nft/emerald-ape-042` |         83% |          100% |            96% | 100% | 3777 ms | 0.013 | 162 ms |
| desktop | `/`                    |         61% |          100% |           100% | 100% | 3352 ms | 0.006 | 203 ms |
| desktop | `/nft/emerald-ape-042` |         64% |          100% |           100% | 100% | 3338 ms | 0.009 | 170 ms |

Performance está abaixo da meta de 90 em todos os perfis; não foram reduzidos thresholds nem desativados recursos para aumentar a nota. Nos LHR medianos, FCP varia de aproximadamente 2,3 a 2,5 s e o elemento LCP não é descoberto no HTML inicial. A primeira carga inclui um chunk comum de cerca de 508 KB (162 KB gzip) e o chunk MSW de cerca de 340 KB (111 KB gzip); o breakdown mostra custo de script-evaluation/layout. As oportunidades medidas incluem JavaScript não usado (~116–119 KiB), CSS não usado (~10–13 KiB), CSS bloqueante (~150–300 ms) e imagens não dimensionadas corretamente (~45–196 KiB, conforme rota/perfil). As variantes responsivas 320/480 já foram adicionadas, mas não resolveram o custo dominante de FCP/LCP. O resultado, ambiente e relatórios devem ser considerados juntos; uma revisão de otimização de performance permanece pendente.

Ambiente medido: Node.js 22.23.4, Linux/arm64, pnpm 11.25.0, Lighthouse CI 0.15.1, Lighthouse 12.6.1 e Chromium 156.0.8078.47. Consulte [`reports/lighthouse/summary.md`](reports/lighthouse/summary.md) para valores das três rodadas e arquivos brutos.

## Documentação relacionada e execução

`README.md` contém instalação, variáveis de ambiente, credenciais fictícias, cenários, reset e comandos. `docs/api-contracts.md` detalha recursos e eventos; `docs/visual-reference-inventory.md` cataloga frames e decisões visuais; `TODO.md` acompanha evidências e pendências; `docs/CONTINUATION_HANDOFF.md` registra o histórico técnico relevante e os passos para retomada.

A entrega não depende de serviços privados nem do backend de produção. Instale dependências com `pnpm install`, configure `.env.local` a partir de `.env.example` e siga os comandos do README. O build de demonstração precisa ativar MSW; as rotas do SPA devem continuar acessíveis por URL direta e refresh. Deploy público continua dependente de autorização e acesso à conta/provedor de hospedagem; nenhuma integração real de blockchain, carteira ou pagamento deve ser insinuada.
