# NFT Marketplace

Implementação frontend em React e TypeScript de um marketplace de NFTs, com catálogo, sessão simulada, carrinho, checkout, pedidos, perfil, carteiras e sincronização em tempo real. APIs, pagamentos e carteiras usam dados simulados por MSW; Socket.IO transporta eventos tipados. Não há integração real com blockchain, extensões de carteira ou gateways de pagamento.

O Figma define a identidade visual e a composição das telas; o README do desafio define comportamentos e critérios de avaliação. Páginas independentes de conteúdo editorial, suporte, atividade, ofertas e downloads ficam fora do escopo. Seções presentes na referência da home não devem ser transformadas em fluxos que aparentem funcionalidade fora do desafio.

## Estado funcional

Implementado:

- home e catálogo com busca, filtros combináveis, ordenação, paginação, detalhe de NFT e navegação por URL;
- layout responsivo; a home foi conferida em 390, 768 e 1440 px. A auditoria E2E verifica overflow na home, detalhe e carrinho em 768 px; existem baselines desktop/mobile para início, detalhe, carrinho e pagamento. A fidelidade fina aos frames ainda está pendente;
- cadastro, login, logout, sessão recuperável após refresh, expiração determinística e proteção de rotas;
- favoritos autenticados com mutation otimista, rollback, cenário `favorite-failure` e isolamento por usuário;
- carrinho visitante persistido localmente, carrinho autenticado isolado por usuário e merge após login/cadastro;
- cotação com cupom, estoque, taxas e aritmética decimal por `big.js`;
- checkout com revalidação, pedido idempotente e recuperação após timeout pela mesma chave;
- snapshots imutáveis de pedidos nos estados `confirmed`, `pending` e `rejected`; após confirmação, o carrinho remove somente as quantidades compradas;
- perfil com avatar e confirmação de nova senha, além de carteiras principal/secundária, persistidos no mock por usuário;
- skeletons com shimmer em catálogo, detalhe e resumo do carrinho;
- eventos versionados `nft.updated` e `order.updated`, deduplicação, descarte de versões antigas e reconciliação após reconexão;
- validação de entradas e respostas com Zod, suíte E2E Playwright com 110 execuções Chromium desktop/mobile e cenários MSW determinísticos.

Pendências principais:

- concluir a fidelidade visual fina aos frames nas larguras 390, 768 e 1440 px; a auditoria inicial identificou diferenças na tipografia, proporções e espaçamentos, detalhadas em [`docs/visual-reference-inventory.md`](docs/visual-reference-inventory.md);
- completar a revisão manual global de acessibilidade, em especial zoom/reflow e feedback de eventos; os testes cobrem teclado, foco, labels, landmarks e associações de erro, e os pares cromáticos representativos foram verificados;
- otimizar a carga inicial: as medianas Lighthouse de Performance são 84%/83% mobile e 61%/64% desktop (home/detalhe), abaixo da meta de 90%; causas e relatórios estão em [`reports/lighthouse/summary.md`](reports/lighthouse/summary.md) e [`ARCHITECTURE.md`](ARCHITECTURE.md);
- realizar o deploy público e validar acesso direto, refresh, mocks e realtime. A configuração de build/fallback Vercel está preparada; falta autorização/acesso à conta do provedor.

O backlog detalhado e verificável está em [`TODO.md`](TODO.md).

## Stack

React 19, TypeScript, Vite, TanStack Router, TanStack Query, Axios, Socket.IO Client, Tailwind CSS, componentes compatíveis com shadcn/ui, MSW, Zod, `big.js`, Playwright e Lighthouse CI.

## Estrutura

```text
  src/
  app/                 composição da aplicação, providers e rotas
  features/            módulos de domínio independentes
    catalog/           API, queries e rotas de descoberta/detalhe
    auth/              sessão, login, cadastro e proteção de rotas
    favorites/         favoritos autenticados e mutation otimista
    cart/              carrinho visitante/autenticado, cupons e cotação
    checkout/          revisão, cotação e envio idempotente
    orders/            snapshot, consulta, recuperação e estados do pedido
    profile/           perfil, avatar e alteração de senha
    wallets/           carteiras principal/secundária
  shared/              contratos, schemas, transporte, cache, utilitários e UI
  mocks/               handlers MSW, fixtures, cenários e estado simulado
  realtime/            ciclo de vida Socket.IO e eventos versionados
  styles/              tokens e estilos globais
  public/
    mockServiceWorker.js worker versionado do MSW
  ARCHITECTURE.md       arquitetura e decisões técnicas na raiz
  e2e/                  testes Playwright de UI, contratos e tempo real
  docs/                 arquitetura, contratos, roadmap e referências visuais
  reports/lighthouse/   relatórios HTML/JSON e medianas da matriz Lighthouse
```

As dependências seguem a direção `app/routes → features → shared`; `mocks` intercepta HTTP/WebSocket no limite de transporte; features não importam mocks. Recursos privados incluem a identidade do usuário nas query keys. Valores ETH permanecem como strings decimais em contratos, cache e persistência.

## Execução local

Requisitos: Node.js 20.19+ ou 22.12+ e pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

No PowerShell:

```powershell
Copy-Item .env.example .env.local
```

A camada MSW é ativada por `VITE_ENABLE_MOCKS=true`. `VITE_API_BASE_URL` e `VITE_SOCKET_URL` configuram os pontos REST e Socket.IO. `VITE_MOCK_DELAY_MS` adiciona latência aos handlers. Os cenários disponíveis são `default`, `empty`, `slow`, `out-of-order`, `rate-limited`, `unavailable`, `favorite-failure`, `session-expired`, `payment-pending`, `payment-rejected` e `order-timeout`.

Os controles de cenário e reset são rotas exclusivas do ambiente MSW de demonstração/teste, não endpoints de produção. Para selecionar um cenário na aplicação aberta, use no console do navegador:

```js
await fetch('/api/__mock/scenario', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'favorite-failure' }),
});
```

Para resetar o mock para o cenário padrão conhecido:

```js
await fetch('/api/__mock/reset', { method: 'POST' });
```

Para reproduzir `favorite-failure`, selecione o cenário e tente favoritar um NFT no catálogo; a interface reverte a alteração e anuncia a falha. Para `order-timeout`, selecione o cenário, inicie o checkout e use a opção de recuperação apresentada após o timeout; a tentativa deve ser consultada pela mesma chave de idempotência, sem criar outro pedido. O worker `public/mockServiceWorker.js` é versionado; sua regeneração só é necessária após atualização da versão do MSW.

## Comandos

```bash
pnpm format
pnpm format:check
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e
pnpm test:e2e:report
pnpm audit:lighthouse
pnpm preview
```

A última execução completa do Playwright listou 55 casos por projeto Chromium desktop e mobile (110 execuções em 27 arquivos): 104 aprovados e 6 skips intencionais por viewport. A cobertura inclui os fluxos do desafio, acessibilidade, responsividade e eventos Socket.IO. O relatório HTML padrão é salvo em `playwright-report/`; as baselines de início, detalhe, carrinho e pagamento estão em `e2e/visual-regression.spec.ts-snapshots/`.

## Auditoria Lighthouse

A matriz abaixo usa build otimizado com MSW default e três medições por rota/perfil. A mediana é reportada; as três rodadas, versões e ambiente estão em [`reports/lighthouse/summary.md`](reports/lighthouse/summary.md), junto aos relatórios HTML/JSON individuais.

| Perfil  | Rota                   | Performance | Accessibility | Best Practices |  SEO |     LCP |   CLS |    TBT |
| ------- | ---------------------- | ----------: | ------------: | -------------: | ---: | ------: | ----: | -----: |
| mobile  | `/`                    |         84% |          100% |            96% | 100% | 3576 ms | 0.000 | 195 ms |
| mobile  | `/nft/emerald-ape-042` |         83% |          100% |            96% | 100% | 3777 ms | 0.013 | 162 ms |
| desktop | `/`                    |         61% |          100% |           100% | 100% | 3352 ms | 0.006 | 203 ms |
| desktop | `/nft/emerald-ape-042` |         64% |          100% |           100% | 100% | 3338 ms | 0.009 | 170 ms |

Performance não alcança a meta de 90 em nenhum dos quatro cenários. Os relatórios apontam FCP de cerca de 2,3–2,5 s, LCP de 3,3–3,8 s, requests de LCP não descobertos no HTML inicial e custo de execução/layout dos chunks iniciais. Os demais scores atingem ou superam as metas do desafio. A otimização de carga inicial permanece registrada como pendência, sem redução de thresholds.

## Credenciais fictícias

| Usuário     | E-mail             | Senha fictícia |
| ----------- | ------------------ | -------------- |
| Ana Silva   | `ana@kurio.demo`   | `Kurio#2026!`  |
| Bruno Costa | `bruno@kurio.demo` | `Market#2026!` |

A sessão simulada mantém apenas um handle opaco em `sessionStorage`; senhas não são armazenadas no navegador nem retornadas nas respostas. Os dados de catálogo, carrinho, favoritos, perfil, carteiras e pedidos são isolados por usuário no estado MSW.

## Documentação técnica

- [`ARCHITECTURE.md`](ARCHITECTURE.md): arquitetura geral, limites da simulação, estado, cache, tempo real, acessibilidade e decisões responsivas;
- [`docs/architecture.md`](docs/architecture.md): camadas, dependências, estado, precisão decimal e tempo real;
- [`docs/api-contracts.md`](docs/api-contracts.md): endpoints REST, schemas, erros e eventos Socket.IO;
- [`docs/implementation-roadmap.md`](docs/implementation-roadmap.md): fases, critérios de saída e requisitos funcionais;
- [`docs/visual-reference-inventory.md`](docs/visual-reference-inventory.md): inventário dos frames, decisões responsivas e auditoria visual inicial da home;
- [`TODO.md`](TODO.md): requisitos concluídos e pendências verificáveis;
- [`docs/CONTINUATION_HANDOFF.md`](docs/CONTINUATION_HANDOFF.md): histórico técnico resumido, evidências e roteiro para retomar o trabalho.
