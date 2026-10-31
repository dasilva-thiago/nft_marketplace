# NFT Marketplace — fundação arquitetural

Repositório iniciado a partir do desafio frontend. A home, o catálogo REST simulado, a conta/sessão, a tela de detalhe, favoritos, carrinho visitante/autenticado, cotação, checkout/pedido idempotente, perfil, carteiras e sincronização realtime versionada já estão preparados; **estados avançados de pedido ainda não estão concluídos**. As rotas visuais existentes não significam que todos os fluxos de domínio estejam implementados.

## Stack obrigatória

React + TypeScript + Vite; TanStack Router para rotas; TanStack Query para estado remoto; Axios como cliente REST; Socket.IO client para eventos; Tailwind CSS e componentes compatíveis com shadcn/ui; MSW para REST; Zod para validação em runtime; Playwright para E2E; Lighthouse CI para auditorias. `big.js` dá suporte a valores ETH com strings decimais nos contratos e cálculo sem aritmética binária de ponto flutuante.

## Estrutura

Veja [`docs/architecture.md`](docs/architecture.md) para responsabilidades por camada, regras de dependência, isolamento de sessão/cache, precisão ETH e sincronização por Socket.IO.
Para implementar o teste na ordem correta e verificar a conclusão de cada requisito do enunciado, siga o [roteiro completo de implementação](docs/implementation-roadmap.md).
Os formatos de dados e endpoints previstos para cada recurso estão no [contrato da API REST](docs/api-contracts.md); essa é a referência compartilhada para os próximos handlers MSW e chamadas Axios. A documentação registra quais recursos já têm fluxo de domínio e quais ainda são apenas composição visual.

```text
src/
  app/                 composição da aplicação e mapa de rotas
  features/            módulos de domínio independentes
    catalog/           API, queries e rotas de descoberta/detalhe
    auth/              sessão, login e cadastro
    favorites/         favoritos autenticados e mutation otimista
    cart/              carrinho autenticado, cupons e cotação
    checkout/          revisão, cotação e envio idempotente
    orders/            snapshot e consulta de pedido
    profile/           perfil/avatar/senha (próxima implementação)
    wallets/           carteiras (próxima implementação)
  shared/              código transversal
    api/               Axios e cliente HTTP configurado
    contracts/         contratos HTTP e schemas Zod compartilhados
    query/             QueryClient e política base de cache
    lib/               utilitários de domínio, incluindo ETH decimal
    ui/                componentes compartilhados
  mocks/               MSW, handlers, cenários e fixtures
  realtime/            ciclo de vida do Socket.IO e eventos versionados
  styles/              tokens e CSS/Tailwind
public/
  mockServiceWorker.js gerado por `pnpm mocks:init`
e2e/                   Playwright; home, API de catálogo, URL/filtros e cenários MSW
artifacts/             relatórios locais (ignorados pelo Git)
```

Regras: componentes não inventam respostas; todas as leituras/escritas passam por APIs de domínio -> Axios -> MSW no ambiente demo. Query keys incluem todos os parâmetros e, para dados privados, a identidade da sessão. Eventos devem ser recebidos pelo `socket.io-client`, versionados, deduplicados e reconciliados com REST. ETH fica como string nos limites da aplicação; conversão para número só pode ocorrer para formatação visual, nunca para cálculo ou cotação.

## Execução local

Requer Node.js 20.19+ ou 22.12+ e pnpm. A cópia deste ambiente usa Node 22.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

No PowerShell, use `Copy-Item .env.example .env.local` no lugar de `cp`.

A camada MSW é ativada com `VITE_ENABLE_MOCKS=true`, inclusive para builds de demonstração. Defina `VITE_API_BASE_URL` e `VITE_SOCKET_URL` para configurar os pontos REST e socket. Os cenários selecionáveis são `default`, `empty`, `slow`, `out-of-order`, `rate-limited`, `unavailable`, `session-expired`, `payment-pending` e `payment-rejected`; `VITE_MOCK_DELAY_MS` adiciona latência. Os dois últimos controlam o estado retornado pelo `POST /api/orders`. O cenário selecionado pelo endpoint de controle `/api/__mock/scenario` é mantido na `sessionStorage` apenas para reproduzir refresh nos testes; o endpoint é exclusivo da demonstração/testes e não é segurança de produção. O worker já está versionado: só execute `pnpm mocks:init` se atualizar a versão do MSW e precisar regenerá-lo. Use apenas credenciais fictícias.

## Comandos

```bash
pnpm typecheck
pnpm build
pnpm test:e2e
pnpm test:e2e:report
pnpm audit:lighthouse
```

Playwright já está configurado para Chromium desktop 1440 px e viewport mobile, com relatório HTML e trace em falhas. Há testes da home, da API de catálogo, URL/busca/filtros/histórico e reset/rate limit simulado; isso ainda não satisfaz a cobertura E2E completa exigida no desafio. Lighthouse CI já declara as duas rotas e três medições, mas só pode ser considerado evidência depois que as páginas funcionais estiverem implementadas. Consulte `TODO.md` para os requisitos pendentes.

## Sessão de demonstração

A primeira fatia de conta implementa cadastro, login, consulta de sessão, logout, expiração determinística e proteção inicial das rotas privadas por MSW. Os dados são fictícios e ficam isolados por usuário.

| Usuário     | E-mail             | Senha fictícia |
| ----------- | ------------------ | -------------- |
| Ana Silva   | `ana@kurio.demo`   | `Kurio#2026!`  |
| Bruno Costa | `bruno@kurio.demo` | `Market#2026!` |

O cliente mantém somente um handle de demonstração em `sessionStorage` para permitir que a sessão simulada sobreviva ao refresh. O mock usa Zod para validar entrada/saída e mantém credenciais fictícias; esse fluxo existe apenas para a demonstração local.

Para reproduzir uma sessão expirada nos testes ou na demonstração, selecione o cenário `session-expired` pelo endpoint de controle `/api/__mock/scenario`; use `POST /api/__mock/reset` para voltar ao cenário conhecido. Esses endpoints pertencem somente ao MSW e não são controles de segurança de produção.

## Referências do desafio

As referências visuais do Figma e os assets disponíveis devem ser tratados como material de referência, não como uma imagem única dentro da aplicação. Exporte assets originais para produção quando estiverem disponíveis. O enunciado define os fluxos, integrações simuladas, falhas reproduzíveis, acessibilidade, testes e metas Lighthouse; veja o `TODO.md` e o `plan.md` para rastreabilidade detalhada.
