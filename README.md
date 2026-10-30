# NFT Marketplace — fundação arquitetural

Repositório iniciado a partir do desafio frontend. Este commit estabelece a base técnica e as responsabilidades por camada; **não declara concluídos os fluxos de compra, conta, catálogo ou tempo real**. A primeira tela e as rotas não-home são marcações explícitas de scaffold.

## Stack obrigatória

React + TypeScript + Vite; TanStack Router para rotas; TanStack Query para estado remoto; Axios como cliente REST; Socket.IO client para eventos; Tailwind CSS e componentes compatíveis com shadcn/ui; MSW para REST; Playwright para E2E; Lighthouse CI para auditorias. `big.js` dá suporte a valores ETH com strings decimais nos contratos e cálculo sem aritmética binária de ponto flutuante.

## Estrutura

Veja [`docs/architecture.md`](docs/architecture.md) para responsabilidades por camada, regras de dependência, isolamento de sessão/cache, precisão ETH e sincronização por Socket.IO.
Para implementar o teste na ordem correta e verificar a conclusão de cada requisito do enunciado, siga o [roteiro completo de implementação](docs/implementation-roadmap.md).

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
    api/               Axios e contratos HTTP tipados
    query/             QueryClient e política base de cache
    lib/               utilitários de domínio, incluindo ETH decimal
    ui/                componentes compartilhados
  mocks/               MSW, handlers, cenários e fixtures
  realtime/            ciclo de vida do Socket.IO e eventos versionados
  styles/              tokens e CSS/Tailwind
public/
  manus-routes.json    manifesto de rotas para o ambiente de preview
  mockServiceWorker.js gerado por `pnpm mocks:init`
e2e/                   Playwright; no momento, somente smoke test do scaffold
artifacts/             relatórios locais (ignorados pelo Git)
```

Regras: componentes não inventam respostas; todas as leituras/escritas passam por APIs de domínio -> Axios -> MSW no ambiente demo. Query keys incluem todos os parâmetros e, para dados privados, a identidade da sessão. Eventos devem ser recebidos pelo `socket.io-client`, versionados, deduplicados e reconciliados com REST. ETH fica como string nos limites da aplicação; conversão para número só pode ocorrer para formatação visual, nunca para cálculo ou cotação.

## Execução local

Requer Node.js 20.19+ ou 22.12+ e pnpm. A cópia deste ambiente usa Node 22.

```bash
pnpm install
cp .env.example .env.local
pnpm mocks:init
pnpm dev
```

A camada MSW é ativada com `VITE_ENABLE_MOCKS=true`, inclusive para builds de demonstração. Defina `VITE_API_BASE_URL` e `VITE_SOCKET_URL` para configurar os pontos REST e socket. **Ainda não há fixture/handler de negócio completo**; o mock inicial existe apenas para validar o bootstrap. Não utilizar dados reais ou credenciais.

## Comandos

```bash
pnpm typecheck
pnpm build
pnpm test:e2e
pnpm test:e2e:report
pnpm audit:lighthouse
```

Playwright já está configurado para Chromium desktop 1440 px e viewport mobile, com relatório HTML e trace em falhas. A cobertura atual limita-se à tela-base; ela não satisfaz ainda a cobertura E2E exigida no desafio. Lighthouse CI já declara as duas rotas e três medições, mas só pode ser considerado evidência depois que as páginas funcionais estiverem implementadas. Consulte `TODO.md` para os requisitos pendentes.

## Referências do desafio

O pacote `FrontendChallenge.zip` disponibilizado nesta conversa continha a prancha consolidada do Figma e seis SVGs de interface, mas não fontes/imagens NFT em arquivos individuais. Obtenha/exporte assets originais para produção, se disponíveis. O enunciado define os fluxos, integrações simuladas, falhas reproduzíveis, acessibilidade, testes e metas Lighthouse; veja o `TODO.md` e o plano fornecido na conversa para rastreabilidade detalhada.
