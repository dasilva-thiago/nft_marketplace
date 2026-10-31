# NFT Marketplace

Implementação React/TypeScript de um marketplace de NFTs com catálogo, sessão simulada, carrinho, checkout, pedidos, perfil, carteiras e sincronização em tempo real. O projeto utiliza MSW para simulação de transporte e domínio, preservando contratos REST e eventos Socket.IO tipados. Estados avançados de recuperação de pedidos, auditoria Lighthouse e deploy público permanecem no backlog.

## Estado funcional

Implementado:

- home e catálogo com busca, filtros combináveis, ordenação, paginação, detalhe de NFT e navegação por URL;
- layout responsivo para 390, 768 e 1440 px, com adaptação conservadora das variantes sem frame mobile;
- cadastro, login, logout, sessão recuperável após refresh, expiração determinística e proteção de rotas;
- favoritos autenticados com mutation otimista, rollback e isolamento por usuário;
- carrinho visitante persistido localmente, carrinho autenticado isolado por usuário e merge após login/cadastro;
- cotação com cupom, estoque, taxas e aritmética decimal por `big.js`;
- checkout com revalidação de cotação e pedido idempotente;
- snapshots imutáveis de pedidos e cenários `confirmed`, `pending` e `rejected`;
- perfil, alteração de senha e carteiras principal/secundária persistidos no mock por usuário;
- eventos versionados `nft.updated` e `order.updated`, deduplicação, descarte de versões antigas e reconciliação após reconexão;
- validação de entradas e respostas com Zod, testes E2E Playwright e cenários MSW determinísticos.

Pendências principais:

- recuperação completa de pedido após timeout, refresh e reconexão;
- remoção seletiva das linhas compradas após confirmação;
- conclusão da cobertura de avatar, confirmação de senha, skeletons, foco/teclado e regressão visual em 768 px;
- auditoria Lighthouse, otimização e deploy público.

O backlog detalhado está em [`TODO.md`](TODO.md).

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
    orders/            snapshot, consulta e estados de pedido
    profile/           perfil e alteração de senha
    wallets/           carteiras principal/secundária
  shared/              contratos, schemas, transporte, cache, utilitários e UI
  mocks/               handlers MSW, fixtures, cenários e estado simulado
  realtime/            ciclo de vida Socket.IO e eventos versionados
  styles/              tokens e estilos globais
public/
  mockServiceWorker.js worker versionado do MSW
e2e/                   testes Playwright de UI, contratos e tempo real
docs/                  arquitetura, contratos e referências visuais
```

As dependências seguem a direção `app/routes → features → shared`; `mocks` intercepta HTTP/WebSocket no limite de transporte; `realtime` atualiza o cache TanStack Query; features não importam mocks. Recursos privados incluem a identidade do usuário nas query keys. Valores ETH permanecem como strings decimais em contratos, cache e persistência.

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

A camada MSW é ativada por `VITE_ENABLE_MOCKS=true`. `VITE_API_BASE_URL` e `VITE_SOCKET_URL` configuram os pontos REST e Socket.IO. `VITE_MOCK_DELAY_MS` adiciona latência aos handlers. Os cenários disponíveis são `default`, `empty`, `slow`, `out-of-order`, `rate-limited`, `unavailable`, `session-expired`, `payment-pending` e `payment-rejected`.

Os endpoints `/api/__mock/scenario`, `/api/__mock/events` e `/api/__mock/reset` são controles exclusivos do ambiente MSW de demonstração e testes. O worker `public/mockServiceWorker.js` é versionado; sua regeneração só é necessária após atualização da versão do MSW.

## Comandos

```bash
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
pnpm test:e2e
pnpm test:e2e:report
pnpm audit:lighthouse
```

A suíte Playwright executa Chromium desktop e mobile. O estado atual contém 48 testes E2E cobrindo autenticação, catálogo, favoritos, carrinho visitante, checkout, pedidos, perfil, carteiras, cenários MSW e eventos Socket.IO.

## Credenciais fictícias

| Usuário     | E-mail             | Senha fictícia |
| ----------- | ------------------ | -------------- |
| Ana Silva   | `ana@kurio.demo`   | `Kurio#2026!`  |
| Bruno Costa | `bruno@kurio.demo` | `Market#2026!` |

A sessão simulada mantém apenas um handle opaco em `sessionStorage`; senhas não são armazenadas no navegador nem retornadas nas respostas. Os dados de catálogo, carrinho, favoritos, perfil, carteiras e pedidos são isolados por usuário no estado MSW.

## Documentação técnica

- [`docs/architecture.md`](docs/architecture.md): camadas, dependências, estado, precisão decimal e tempo real;
- [`docs/api-contracts.md`](docs/api-contracts.md): endpoints REST, schemas, erros e eventos Socket.IO;
- [`docs/implementation-roadmap.md`](docs/implementation-roadmap.md): fases, critérios de saída e requisitos funcionais;
- [`docs/visual-reference-inventory.md`](docs/visual-reference-inventory.md): inventário de frames e decisões responsivas;
- [`TODO.md`](TODO.md): requisitos concluídos e pendências verificáveis.
