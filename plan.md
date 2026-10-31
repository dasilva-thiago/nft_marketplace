# Plano técnico do NFT Marketplace

## Escopo

SPA React/TypeScript para marketplace de NFTs com catálogo, autenticação simulada, favoritos, carrinho, cotação, checkout, pedidos, perfil, carteiras e sincronização em tempo real. O transporte REST e os eventos Socket.IO são simulados por MSW para manter fixtures determinísticas e testes reproduzíveis.

Fora do escopo: blockchain, extensões de carteira, gateway de pagamento, custódia de ativos e backend de produção.

## Estado implementado

- TanStack Router, TanStack Query, Axios, Zod, MSW e Socket.IO Client integrados;
- catálogo com busca, filtros combináveis, ordenação, paginação, detalhe, estados de erro e URL serializada;
- sessão com cadastro, login, logout, refresh, expiração determinística, proteção de rotas e dois usuários isolados;
- favoritos autenticados com mutation otimista, rollback e invalidação;
- carrinho visitante em `localStorage`, carrinho autenticado isolado por usuário e merge após autenticação;
- cotação com cupom, disponibilidade, taxa de rede e precisão decimal usando `big.js`;
- checkout com revalidação, pedido idempotente e snapshot imutável;
- cenários de pagamento confirmado, pendente e recusado;
- perfil, alteração de senha e carteiras principal/secundária persistidos por usuário no MSW;
- eventos `nft.updated` e `order.updated` com versão, deduplicação, descarte de eventos antigos, atualização de cache e reconciliação após reconexão;
- 48 testes E2E Playwright em desktop e mobile.

## Regras técnicas

1. Contratos TypeScript e schemas Zod são atualizados junto com APIs, handlers e testes.
2. Dados de negócio passam por API de domínio → Axios → MSW; componentes não inventam respostas.
3. Query keys incluem parâmetros completos e identidade de usuário para recursos privados.
4. Recursos privados são removidos do cache no logout, expiração ou troca de usuário.
5. Valores ETH trafegam como strings decimais e cálculos usam `big.js`; quantidades são inteiros.
6. Mutations financeiras não possuem retry automático. Pedidos exigem `Idempotency-Key`.
7. Eventos realtime percorrem `socket.io-client`, são validados antes de alterar cache e são reconciliados via REST após reconexão.
8. `public/mockServiceWorker.js` permanece versionado e só é regenerado após atualização do MSW.
9. Cenários MSW são controlados por endpoints exclusivos de demonstração/teste e possuem reset determinístico.

## Referências visuais

As referências estão catalogadas em `docs/visual-reference-inventory.md`. A implementação utiliza a identidade visual escura marrom/preta, acentos âmbar, tipografia monoespaciada, grids editoriais e componentes responsivos do projeto.

As variantes de início, login, cadastro, detalhe, carrinho e pagamento possuem referências desktop/mobile. Confirmação, perfil e carteiras possuem somente referência desktop; as variantes mobile usam adaptação responsiva conservadora documentada em `docs/architecture.md`.

Os quatro assets de macacos em `public/assets/monkey1.webp` até `public/assets/monkey4.webp` são reutilizados deterministicamente nos fixtures. A prancha visual não é usada como asset de produto.

## Pendências

- recuperação completa de pedido após timeout, refresh e reconexão;
- remoção seletiva de itens/quantidades comprados após confirmação;
- cobertura de avatar, confirmação de senha, skeletons e revisão de foco/teclado;
- regressão visual dedicada em 768 px;
- auditoria Lighthouse, otimização de bundle, configuração de deploy e validação pública.

## Validação

```bash
pnpm format:check
pnpm typecheck
pnpm build
pnpm test:e2e
pnpm audit:lighthouse
```

Critérios de saída: typecheck, build e E2E sem falhas; contratos, handlers, APIs, queries e telas alinhados; dados privados isolados; eventos realtime versionados e reconciliáveis; documentação sincronizada com o estado do código.
