# NFT Marketplace — fundação arquitetural

Repositório iniciado a partir do desafio frontend. A base técnica e o catálogo REST simulado estão preparados; **as telas do Figma e os fluxos de compra, conta e tempo real ainda não estão concluídos**. A home atual é uma página de scaffold e as rotas não-home são marcações explícitas.

## Stack obrigatória

React + TypeScript + Vite; TanStack Router para rotas; TanStack Query para estado remoto; Axios como cliente REST; Socket.IO client para eventos; Tailwind CSS e componentes compatíveis com shadcn/ui; MSW para REST; Zod para validação em runtime; Playwright para E2E; Lighthouse CI para auditorias. `big.js` dá suporte a valores ETH com strings decimais nos contratos e cálculo sem aritmética binária de ponto flutuante.

## Estrutura

Veja [`docs/architecture.md`](docs/architecture.md) para responsabilidades por camada, regras de dependência, isolamento de sessão/cache, precisão ETH e sincronização por Socket.IO.
Para implementar o teste na ordem correta e verificar a conclusão de cada requisito do enunciado, siga o [roteiro completo de implementação](docs/implementation-roadmap.md).
Os formatos de dados e endpoints previstos para cada recurso estão no [contrato da API REST](docs/api-contracts.md); essa é a referência compartilhada para os próximos handlers MSW e chamadas Axios.
O [plano extra de segurança](docs/security-hardening.md) separa o que é possível validar no frontend/mock (Zod e cenários 429) do que precisa de servidor real (JWT, cookie HttpOnly, Helmet e rate limit efetivo).

```text
src/
  app/                 composição da aplicação e mapa de rotas
  features/            módulos de domínio independentes
    catalog/           API, queries e rotas de descoberta/detalhe
    auth/              sessão, login, cadastro (próxima implementação)
    favorites/         favoritos (próxima implementação)
    cart/              carrinho e cupons (próxima implementação)
    checkout/          revisão e envio de pedido (próxima implementação)
    orders/            estado e recibo imutável (próxima implementação)
    profile/           perfil/avatar/senha (próxima implementação)
    wallets/           carteiras (próxima implementação)
  shared/              código transversal
    api/               Axios, contratos HTTP e schemas Zod
    query/             QueryClient e política base de cache
    lib/               utilitários de domínio, incluindo ETH decimal
    ui/                componentes compartilhados
  mocks/               MSW, handlers, cenários e fixtures
  realtime/            ciclo de vida do Socket.IO e eventos versionados
  styles/              tokens e CSS/Tailwind
public/
  manus-routes.json    manifesto de rotas para o ambiente de preview
  mockServiceWorker.js gerado por `pnpm mocks:init`
e2e/                   Playwright; smoke do scaffold, API de catálogo e cenários MSW
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

A camada MSW é ativada com `VITE_ENABLE_MOCKS=true`, inclusive para builds de demonstração. Defina `VITE_API_BASE_URL` e `VITE_SOCKET_URL` para configurar os pontos REST e socket. Os cenários selecionáveis são `default`, `empty`, `slow`, `out-of-order`, `rate-limited` e `unavailable`; `VITE_MOCK_DELAY_MS` adiciona latência. O endpoint de controle `/api/__mock/scenario` é exclusivo da demonstração/testes. Ele não é segurança de produção. O worker já está versionado: só execute `pnpm mocks:init` se atualizar a versão do MSW e precisar regenerá-lo. Use apenas credenciais fictícias.

## Comandos

```bash
pnpm typecheck
pnpm build
pnpm test:e2e
pnpm test:e2e:report
pnpm audit:lighthouse
```

Playwright já está configurado para Chromium desktop 1440 px e viewport mobile, com relatório HTML e trace em falhas. Há testes iniciais do scaffold, da API de catálogo e do reset/rate limit simulado; isso ainda não satisfaz a cobertura E2E exigida no desafio. Lighthouse CI já declara as duas rotas e três medições, mas só pode ser considerado evidência depois que as páginas funcionais estiverem implementadas. Consulte `TODO.md` para os requisitos pendentes.

## Referências do desafio

O pacote `FrontendChallenge.zip` disponibilizado nesta conversa continha a prancha consolidada do Figma e seis SVGs de interface, mas não fontes/imagens NFT em arquivos individuais. Obtenha/exporte assets originais para produção, se disponíveis. O enunciado define os fluxos, integrações simuladas, falhas reproduzíveis, acessibilidade, testes e metas Lighthouse; veja o `TODO.md` e o plano fornecido na conversa para rastreabilidade detalhada.
