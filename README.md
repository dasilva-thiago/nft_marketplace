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

- concluir a fidelidade visual fina aos frames nas larguras 390, 768 e 1440 px; a auditoria inicial identificou diferenças na tipografia, proporções e espaçamentos, detalhadas em [`ARCHITECTURE.md`](ARCHITECTURE.md);
- completar a revisão manual global de acessibilidade, em especial zoom/reflow e feedback de eventos; os testes cobrem teclado, foco, labels, landmarks e associações de erro, e os pares cromáticos representativos foram verificados;
- otimizar a carga inicial: as medianas Lighthouse de Performance são 87% mobile e 68% desktop, abaixo da meta de 90%; a causa é estrutural (LCP gateado por MSW lazy init + chamada de API sem SSR); causas e relatórios estão em [`reports/lighthouse/summary.md`](reports/lighthouse/summary.md) e [`ARCHITECTURE.md`](ARCHITECTURE.md);
- realizar o deploy público e validar acesso direto, refresh, mocks e realtime. A configuração de build/fallback para Cloudflare Pages está preparada (`public/_headers` e `public/_redirects`); falta autorização/acesso à conta do provedor.

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

| Perfil  | Rota                   | Performance | Accessibility | Best Practices |  SEO |     LCP |   CLS |   TBT |
| ------- | ---------------------- | ----------: | ------------: | -------------: | ---: | ------: | ----: | ----: |
| mobile  | `/`                    |         87% |          100% |            96% | 100% | 3780 ms | 0.001 | 89 ms |
| mobile  | `/nft/emerald-ape-042` |         87% |          100% |            96% | 100% | 3846 ms | 0.013 | 38 ms |
| desktop | `/`                    |         68% |          100% |           100% | 100% | 3676 ms | 0.015 | 70 ms |
| desktop | `/nft/emerald-ape-042` |         68% |          100% |           100% | 100% | 3701 ms | 0.020 | 48 ms |

Performance não alcança a meta de 90 em nenhum dos quatro cenários. A causa é estrutural: o LCP é a primeira imagem de NFT carregada após o ciclo React bootstrap → MSW lazy init → chamada de API, resultando em LCP ≥ 3,6 s sem SSR. FCP melhorou para 2,1 s com skeleton loader e chunk splitting; TBT caiu de ~200 ms para 40–90 ms. Os demais scores atingem ou superam as metas do desafio. A otimização permanece registrada como pendência, sem redução de thresholds.

## Credenciais fictícias

| Usuário     | E-mail             | Senha fictícia |
| ----------- | ------------------ | -------------- |
| Ana Silva   | `ana@kurio.demo`   | `Kurio#2026!`  |
| Bruno Costa | `bruno@kurio.demo` | `Market#2026!` |

A sessão simulada mantém apenas um handle opaco em `sessionStorage`; senhas não são armazenadas no navegador nem retornadas nas respostas. Os dados de catálogo, carrinho, favoritos, perfil, carteiras e pedidos são isolados por usuário no estado MSW.

## Autor

Thiago da Silva — [GitHub](https://github.com/dasilva-thiago) · [LinkedIn](https://www.linkedin.com/in/dasilva-thiago/) · [Portfólio](https://www.dasilva-thiago.dev/)

## Documentação técnica

- [`ARCHITECTURE.md`](ARCHITECTURE.md): arquitetura, camadas, contratos REST, eventos Socket.IO, política de sessão, estado do carrinho, estratégia de cache, reconciliação REST/Socket.IO, decisões de UX, desvios do Figma, acessibilidade, performance e deploy;
