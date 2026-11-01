# Arquitetura do NFT Marketplace

## Escopo e limites

SPA React 19 + TypeScript para descoberta, compra simulada e gestão de conta de colecionador. O Figma é a referência de composição visual; o README oficial do desafio determina comportamentos e critérios de aceite. As telas previstas são início, detalhe do NFT, carrinho, pagamento, dados do colecionador, confirmação do pedido, login, cadastro, perfil e carteiras.

Sessões, catálogo, favoritos, carrinho, perfil, carteiras, cotações, pedidos e pagamento são simulados por MSW. Não há conexão com blockchain, extensão de carteira, gateway de pagamento nem backend de produção. Páginas de editorial, suporte, atividade, ofertas e downloads ficam fora do escopo; controles auxiliares não devem aparentar concluir ações que não existem.

---

## Camadas e direção das dependências

```text
src/app/            bootstrap, providers, rotas
        ↓
src/features/*      UI e regras por domínio
        ↓
src/shared/         contratos, schemas, API, queries, utilitários, UI

src/mocks/          intercepta HTTP/WebSocket no limite de transporte (não importado por features)
src/realtime/       encapsula socket.io-client e sincroniza o cache TanStack Query
```

- `app/` compõe providers e rotas; não contém regra de negócio.
- `features/<domínio>/` mantém páginas, componentes, validação, hooks e mutations do domínio; features não importam detalhes internas umas das outras.
- `shared/api/` configura Axios e tipos de transporte/erros; só APIs de domínio fazem chamadas HTTP.
- `shared/query/` define política de cache e chaves compartilhadas; features definem suas próprias query options.
- `shared/lib/` contém utilitários puros (aritmética decimal ETH via `big.js`).
- `shared/ui/` reúne componentes reutilizáveis compatíveis com shadcn/ui: `Button`, `Badge`, `Input`, `Label`.
- `mocks/` implementa handlers e fixtures no limite da rede; não é importado por páginas ou hooks de domínio.
- `realtime/` encapsula criação, conexão, subscriptions e descarte do cliente Socket.IO.

---

## Contratos REST

Todos os endpoints têm o prefixo `/api`. Axios é a única camada HTTP da aplicação. Respostas de sucesso retornam JSON direto (exceto `204` sem corpo). Erros usam o formato:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Revise os campos destacados.",
  "fields": { "email": "Informe um e-mail válido." },
  "requestId": "req-demo-001",
  "retryable": false
}
```

Códigos tipados: `VALIDATION_ERROR` (400), `SESSION_INVALID` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `AVAILABILITY_CONFLICT` / `CONFLICT` (409), `COUPON_INVALID` / `COUPON_EXPIRED` (422), `PAYMENT_REJECTED` (422), `RATE_LIMITED` (429, respeitar `Retry-After`) e `TRANSIENT_ERROR` (503, retryable). Timeout/desconexão podem não ter resposta HTTP; a UI recupera a operação sem repetir a compra.

Padrões comuns:
- Datas são ISO 8601 UTC; IDs são strings estáveis de fixtures.
- `page` começa em 1; resposta paginada contém `items`, `page`, `pageSize`, `totalItems`, `totalPages`.
- Preços, taxas, descontos e totais ETH são strings decimais, nunca `number`. Quantidade/página/versão são inteiros.
- A identidade do usuário vem da sessão simulada; o cliente não escolhe `userId` no corpo.
- Operações de escrita repetíveis são seguras contra duplo clique; criação de pedido exige `Idempotency-Key`.

### Sessão e conta

| Método e rota             | Entrada                          | Sucesso                           | Erros relevantes          |
| ------------------------- | -------------------------------- | --------------------------------- | ------------------------- |
| `POST /api/auth/register` | `name`, `email`, `password`      | `201 Session`                     | 400 validação, 409 conflito |
| `POST /api/auth/login`    | `email`, `password`              | `200 Session` e cookie de sessão  | 400 validação, 401 inválida |
| `GET /api/session`        | —                                | `200 Session` ou `200 null`       | 401 handle inválido/expirado |
| `POST /api/auth/logout`   | —                                | `200 { "loggedOut": true }`       | 401 tratado como já encerrada |

`Session` tem `user` (`id`, `name`, `email`, `avatarUrl`) e `expiresAt`. O MSW usa o header interno `X-Mock-Session` para transportar um handle opaco; `GET /api/session` retorna `200 null` sem handle (sessão anônima) e `401` com handle inválido/expirado. Logout remove o handle e encerra o registro em memória.

### NFTs

| Método e rota          | Entrada                                                              | Sucesso                    | Erros           |
| ---------------------- | -------------------------------------------------------------------- | -------------------------- | --------------- |
| `GET /api/nfts`        | `page`, `pageSize`, `search`, `sort`, `sortOrder`, filtros repetíveis | `PageResponse<NftSummary>` | 400, 503        |
| `GET /api/nfts/:nftId` | id na rota                                                           | `Nft`                      | 404             |

`NftSummary`: `id`, `name`, `imageUrl`, `collection`, `priceEth`, `availableEditions`, `network`, `version`. `Nft` acrescenta `description`, `gallery`, edição atual/total e `attributes` (`trait`, `value`).

### Favoritos

| Método e rota                  | Sucesso                           | Erros                |
| ------------------------------ | --------------------------------- | -------------------- |
| `GET /api/favorites`           | `Favorite[]`                      | 401                  |
| `PUT /api/favorites/:nftId`    | `Favorite` (idempotente)          | 401, 404 NFT, 503    |
| `DELETE /api/favorites/:nftId` | `204`                             | 401, 503             |

A interface usa mutation otimista: atualiza a lista imediatamente, restaura o snapshot anterior em erro e invalida a query após resposta. No cenário `favorite-failure`, os dois endpoints respondem `503 TRANSIENT_ERROR` sem alterar estado persistido.

### Carrinho

| Método e rota                   | Entrada                              | Sucesso           | Erros                     |
| ------------------------------- | ------------------------------------ | ----------------- | ------------------------- |
| `GET /api/cart`                 | sessão ou visitante                  | `Cart`            | 401                       |
| `POST /api/cart/items`          | `nftId`, `quantity`                  | `Cart` atualizado | 400, 404 NFT, 409 edição  |
| `PATCH /api/cart/items/:nftId`  | `quantity`                           | `Cart` atualizado | 400, 404 item, 409 estoque |
| `DELETE /api/cart/items/:nftId` | —                                    | `Cart` atualizado | 404 idempotente           |
| `POST /api/cart/merge`          | `items` (`nftId`, `quantity`)        | `Cart` atualizado | 400, 404 NFT, 409 estoque |
| `POST /api/cart/consume`        | `items` (`nftId`, `quantity`)        | `Cart` atualizado | 400, 401                  |

`Cart` contém `userId` ou `null`, `items` (`CartLine`) e `version`. `CartLine` tem `nftId`, quantidade inteira e o resumo atual do NFT.

Após um pedido confirmado, o checkout envia as linhas do snapshot para `POST /api/cart/consume`. O handler subtrai somente a quantidade comprada; remove a linha quando o saldo chega a zero e preserva quantidades não incluídas no pedido. Pedidos `pending` ou `rejected` não consomem o carrinho.

### Cotação e cupom

| Método e rota      | Entrada                                                        | Sucesso  | Erros                          |
| ------------------ | -------------------------------------------------------------- | -------- | ------------------------------ |
| `POST /api/quotes` | `items`, `couponCode?`, `walletId?`, `network?`                | `Quote`  | 401, 404, 409 estoque, 422 cupom |

`Quote` contém `quoteId`, `QuoteLine[]`, cupom aplicado, `subtotalEth`, `discountEth`, `networkFeeEth`, `totalEth`, `createdAt`, `expiresAt`, `version`. Divergência de preço, disponibilidade, carteira ou rede exige nova cotação e confirmação explícita do usuário. Cupons suportados: `KURIO10` (10% desconto), `EXPIRED` (cupom expirado); taxa de rede simulada: `0.016` ETH.

### Pedidos

| Método e rota                         | Entrada                                                | Sucesso                         | Erros                              |
| ------------------------------------- | ------------------------------------------------------ | ------------------------------- | ---------------------------------- |
| `POST /api/orders`                    | Header `Idempotency-Key`; `quoteId`, `walletId`, `network` | `201 OrderSnapshot`         | 400, 401, 403, 409 conflito/estoque, 422 recusa |
| `GET /api/orders/:orderId`            | sessão                                                 | `OrderSnapshot`                 | 401, 403 outro usuário, 404        |
| `GET /api/orders/by-idempotency/:key` | sessão                                                 | `OrderSnapshot`                 | 401, 403, 404                      |

`OrderSnapshot`: `id`, `userId`, estado (`pending`/`confirmed`/`rejected`), linhas e cotação como snapshot imutável, `transactionRef`, timestamps, `version`. Replay com mesma chave e payload recupera o mesmo pedido; mesma chave com payload diferente retorna `409 CONFLICT`. O cenário `order-timeout` cria o snapshot antes de atrasar a resposta; a recuperação consulta por `GET /api/orders/by-idempotency/:key`.

### Perfil

| Método e rota                 | Entrada                        | Sucesso                   | Erros     |
| ----------------------------- | ------------------------------ | ------------------------- | --------- |
| `GET /api/profile`            | sessão                         | `CollectorProfile`        | 401       |
| `PATCH /api/profile`          | `name`, `avatarUrl?`           | perfil atualizado         | 400, 401  |
| `PATCH /api/profile/password` | `currentPassword`, `newPassword`, `confirmPassword` | `{ "updated": true }` | 400, 401 |

### Carteiras

| Método e rota                  | Entrada                  | Sucesso             | Erros                     |
| ------------------------------ | ------------------------ | ------------------- | ------------------------- |
| `GET /api/wallets`             | sessão                   | `Wallet[]`          | 401                       |
| `POST /api/wallets`            | `CreateWalletRequest`    | `201 Wallet`        | 400, 401, 409 conflito    |
| `PATCH /api/wallets/:walletId` | campos alteráveis        | `Wallet` atualizado | 400, 401, 404, 409        |

`Wallet`: `id`, `userId`, `label`, `address`, `network`, `isPrimary`, `version`.

### Controle de cenário MSW (somente demonstração/teste)

| Método e rota              | Entrada                                                                                                                                            | Sucesso                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `PUT /api/__mock/scenario` | `{ "scenario": "default"\|"empty"\|"slow"\|"out-of-order"\|"rate-limited"\|"unavailable"\|"favorite-failure"\|"session-expired"\|"payment-pending"\|"payment-rejected"\|"order-timeout" }` | `{ "scenario": "..." }` |
| `POST /api/__mock/reset`   | —                                                                                                                                                  | `{ "scenario": "...", "reset": true }` |

Não expor esses controles em uma API real.

---

## Eventos Socket.IO

Formato comum `VersionedEvent<T>`: `eventId`, `resourceId`, `version`, `occurredAt`, `payload`.

- `nft.updated` — payload `NftUpdatedPayload` (`nftId`, `priceEth`, `availableEditions`): atualiza listagem/detalhe/carrinho e invalida cotação.
- `order.updated` — payload `OrderUpdatedPayload` (`orderId`, `status`, `transactionRef`): atualiza o snapshot; `confirmed`/`rejected` são estados terminais.

Evento duplicado (mesmo `eventId`) ou com versão menor que a armazenada é ignorado. Após reconexão, recursos ativos são reconciliados por REST antes de sinalizar estado sincronizado. Listeners e subscriptions são liberados ao encerrar sessão ou trocar de usuário.

Limitação: o binding `@mswjs/socket.io-binding` opera sobre WebSocket e não reproduz todo o comportamento de um servidor Socket.IO (rooms, broadcasting completo). O transporte é adequado à simulação local do desafio, não constitui serviço realtime de produção.

---

## Política de sessão

O MSW implementa os quatro endpoints de sessão/conta e valida requests/responses com Zod. Um handle opaco identifica a sessão no header interno `X-Mock-Session` e permite reconstruí-la após refresh de aba (`sessionStorage`). Senhas são validadas no cadastro/login, mas nunca armazenadas nem retornadas. Checkout, favoritos, perfil, carteiras e pedidos exigem sessão ativa.

Logout, expiração e troca de identidade:
1. A mutation de logout grava `null` na query `session`.
2. Remove do cache todas as queries com prefixo `private` (que inclui recursos isolados por usuário: carrinho, favoritos, pedidos, perfil, carteiras).
3. Encerra subscriptions Socket.IO da sessão anterior.
4. Eventos de sessão antiga não alteram o usuário atual.

O cenário `session-expired` faz `GET /api/session` retornar `401 SESSION_INVALID` para reproduzir refresh em testes E2E.

Credenciais fictícias documentadas no README: Ana Silva (`ana@kurio.demo` / `Kurio#2026!`) e Bruno Costa (`bruno@kurio.demo` / `Market#2026!`).

---

## Estado do carrinho e estratégia de persistência

O carrinho opera em dois modos:

**Visitante (não autenticado):** itens persistidos em `localStorage` como `[{ nftId, quantity }]`. Nenhum dado de sessão é armazenado localmente.

**Autenticado:** carrinho isolado por usuário no estado MSW (serializado em `sessionStorage` do mock para sobreviver ao refresh de demonstração).

**Merge após autenticação:**
1. O cliente envia os itens visitantes para `POST /api/cart/merge`.
2. O handler soma quantidades, valida disponibilidade e retorna o carrinho mesclado.
3. O cliente limpa `localStorage` somente após resposta bem-sucedida.
4. Em conflito de estoque, os itens restantes são preservados e o erro é exibido.

**Reset:** `POST /api/__mock/reset` restaura o cenário `default`, limpa `localStorage`/`sessionStorage` de visitante e invalida o QueryClient inteiro.

---

## Estratégia de cache (TanStack Query)

Query keys são serializáveis e incluem todos os parâmetros da consulta. Recursos privados incluem `userId`/identidade estável na chave (prefixo `private`):

```text
["private", userId, "cart"]
["private", userId, "favorites"]
["private", userId, "orders", orderId]
["private", userId, "profile"]
["private", userId, "wallets"]
["catalog", "nfts", params]
["catalog", "nft", nftId]
["session"]
```

Política de retry:
- Consultas seguras (GET): até 2 retentativas em erros transitórios (503/429, respeitando `Retry-After`).
- Mutations: sem retry automático. Pedido e cotação são operações financeiras — o usuário deve iniciar reenvio manualmente.

Invalidação após mutation:
- Adição/remoção de favorito: invalida `["private", userId, "favorites"]`.
- Alteração de carrinho: invalida `["private", userId, "cart"]` e `["private", userId, "quote"]`.
- Confirmação de pedido: invalida `["private", userId, "cart"]` e `["private", userId, "orders"]`.
- Evento `nft.updated`: atualiza `["catalog", "nfts"]`, `["catalog", "nft", nftId]` e invalida cotação.
- Evento `order.updated`: atualiza `["private", userId, "orders", orderId]`.

Mutations otimistas (favoritos): guardam snapshot do cache antes da mutação e fazem rollback exato em erro.

---

## Reconciliação REST e Socket.IO

O Socket.IO é uma via de atualização de menor latência, não a fonte de verdade. O fluxo de reconciliação é:

1. **Evento recebido:** valida payload com Zod, verifica `version` e `eventId`.
2. **Duplicata ou versão antiga:** descartada sem alterar cache.
3. **Versão nova:** atualiza o cache localmente via `queryClient.setQueryData`.
4. **Reconexão:** após `connect` do socket, consulta REST para cada recurso ativo (catálogo em exibição, pedido em acompanhamento) para garantir consistência — o evento pode ter chegado durante a desconexão.
5. **Estado terminal (`confirmed`/`rejected`):** não há mais atualização esperada; o listener do pedido é removido.

O checkout não aceita cotação expirada ou com versão anterior à do cache. Divergência de preço/disponibilidade detectada por `nft.updated` bloqueia a cotação e exige que o usuário revisite o resumo.

---

## Fluxo de checkout em dois passos

O checkout foi dividido em duas rotas para separar dados do colecionador do pagamento:

- **Passo 1 — `/checkout/collector`:** formulário com nome de exibição, nome de usuário, e-mail, nome de perfil, rede e seleção de carteira. Dados salvos em `sessionStorage('kurio.checkout.collector')` ao avançar.
- **Passo 2 — `/checkout`:** revisão dos itens, cotação da API com a carteira/rede selecionadas, cupom e confirmação. Lê os dados do colecionador do `sessionStorage`.

A chave de idempotência é gerada no passo 2, persistida em `sessionStorage('kurio.checkout.idempotency-key')` e reutilizada para recuperação após timeout sem criar um segundo pedido.

---

## MSW e tempo real

`VITE_ENABLE_MOCKS=true` ativa o worker MSW em desenvolvimento e no build de demonstração. O bootstrap renderiza React sem aguardar o Service Worker; o cliente Axios aguarda a promise real de `worker.start()` antes de emitir qualquer request. A aplicação expõe essa promise apenas em builds com mocks para que a fixture Playwright valide o handshake.

Cenários configuráveis:

| Cenário            | Efeito                                                         |
| ------------------ | -------------------------------------------------------------- |
| `default`          | respostas normais, pagamento confirmado                        |
| `empty`            | catálogo vazio                                                 |
| `slow`             | latência artificial em todas as respostas                      |
| `out-of-order`     | respostas de listagem chegam fora de sequência                 |
| `rate-limited`     | 429 com `Retry-After`                                          |
| `unavailable`      | 503 em todos os endpoints                                      |
| `favorite-failure` | 503 em PUT/DELETE de favoritos (rollback otimista visível)     |
| `session-expired`  | GET /api/session retorna 401 (expiração durante navegação)     |
| `payment-pending`  | pedido criado com estado `pending`                             |
| `payment-rejected` | pedido criado com estado `rejected` (422 PAYMENT_REJECTED)     |
| `order-timeout`    | pedido criado antes do atraso; recuperável por idempotency key |

---

## Decisões visuais e desvios do Figma

### Identidade visual e tokens

Paleta aplicada (tokens CSS em `src/styles/index.css`):

| Token              | Valor      | Uso                              |
| ------------------ | ---------- | -------------------------------- |
| `#100d0c`          | preto-marrom | fundo base do body/layout      |
| `#1a1310`          | chocolate escuro | cards, painéis, modais      |
| `#2a1e14`          | marrom médio | bordas hover, fundos secundários |
| `#e99a45`          | âmbar       | acento primário (CTAs, foco, links) |
| `#f2eee8`          | creme       | texto base                       |
| `#c9bdb2`          | creme médio | texto secundário, labels         |
| `#7a6456`          | marrom claro | hints, placeholders             |

Fontes: **Space Grotesk** (títulos, CTAs) e **DM Mono** (labels, preços, códigos).

### Componentes shadcn/ui aplicados

Os seguintes componentes seguem o padrão shadcn/ui com `cva` + Tailwind, em `src/shared/ui/`:

- **`Button`** — variantes `default` (âmbar), `ghost`, `outline`, `destructive`; tamanhos `sm`, `default`, `lg`, `icon`.
- **`Badge`** — variantes `default` (âmbar), `secondary`, `outline` (borda marrom), `destructive`, `success`; usado em detalhe do NFT (rede, coleção, esgotado, atributos) e cards de catálogo (rede).
- **`Input`** — estilo base escuro `#1a110e`, borda `#4a2e1e`, ring âmbar no foco; fonte `DM Mono`; usado no formulário do colecionador.
- **`Label`** — texto `#c9bdb2`, fonte `DM Mono`; usado em par com `Input`.

### Assets de produto

Os quatro arquivos `public/assets/monkey1–4.webp` foram gerados com Gemini a partir de capturas dos frames do Figma, convertidos para WebP e otimizados para menos de 200 KB cada. São distribuídos deterministicamente nas fixtures das 12 coleções. Derivados responsivos em `320/480/640/1200px` são gerados por `scripts/prepare-responsive-images.py` e usados em `srcSet` com `sizes` ajustados por viewport.

### Adaptações por tela

**Home mobile (390px):**
- Hero compacto de `min-height: 200px`; arte `min(100%, 184px)` lado a lado com texto (medido no Figma).
- Grade de catálogo em duas colunas; navegação inferior fixa.
- H1 do hero: `clamp(1.02rem, 4.2vw, 1.18rem)`.

**Home desktop (1440px):**
- Grade de catálogo em três colunas.
- Seções de lançamentos, diário e footer editorial presentes como composição visual; não são páginas independentes.

**Detalhe do NFT:**
- Galeria lateral com miniaturas de `76px`; borda âmbar no item selecionado.
- Badges de rede, coleção e atributos abaixo do título.
- Feedback de "adicionado ao carrinho" via `aria-live="polite"`.

**Login e cadastro:**
- Desktop: modal com `role="dialog"` / `aria-modal`, confinamento de foco, fecha com Escape, devolve foco ao trigger.
- Mobile: telas dedicadas com logo centrada, sem modal.

**Carrinho:**
- Margem de `20px` entre a seção de cupom e o botão de checkout.
- Hint do cupom (`KURIO10`) alinhado abaixo do input com `.field-help` (fonte menor, cor discreta).

**Checkout — dados do colecionador (`/checkout/collector`):**
- Tela própria (PASSO 1 DE 2); dados salvos em `sessionStorage` ao avançar.
- Usa `Input` + `Label` (shadcn) e seleção de carteira filtrada por rede.
- Aside card (oculto em mobile) mostra prévia do passo 2.

**Confirmação, perfil e carteiras:**
- Não há frames mobile no Figma. As três variantes usam adaptação responsiva conservadora da composição desktop: sidebar vira grid de navegação, formulários em coluna única, confirmação mantém o cartão central.

### Desvios documentados do Figma

| Tela / elemento              | Referência Figma                    | Implementação                                         | Motivo                                      |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| Hero art overlay             | Texto sobre fundo semi-transparente | `text-shadow` + gradiente mais opaco                  | Legibilidade garantida sobre qualquer imagem |
| Confirmação mobile           | Sem frame                           | Adaptação responsiva do desktop                       | Sem referência Figma mobile                 |
| Perfil mobile                | Sem frame                           | Adaptação responsiva do desktop                       | Sem referência Figma mobile                 |
| Carteiras mobile             | Sem frame                           | Adaptação responsiva do desktop                       | Sem referência Figma mobile                 |
| `/checkout/collector`        | Dados do colecionador dentro do checkout | Tela própria pré-checkout                        | Separação de responsabilidades; UX mais clara |
| Fidelidade fina tipografia   | Frames 390/768/1440px               | Auditoria parcial; proporções e espaçamentos revisados | Auditoria completa ainda pendente           |

---

## Acessibilidade

- **Skip link:** `<a href="#main-content" className="skip-link">` no topo do `RootLayout`; visível apenas no foco (CSS `position: absolute; top: -100%; focus: top: 0`).
- **Landmarks:** `<header>`, `<main id="main-content">`, `<nav aria-label="Navegação principal">`.
- **Formulários:** todos os campos têm `<label>` associado; erros ligados por `aria-describedby`; estados inválidos marcados com `aria-invalid`.
- **Diálogo desktop:** `role="dialog"` / `aria-modal`, foco confinado, fecha com Escape, devolve foco ao trigger.
- **Feedback de mutations:** regiões `aria-live="polite"` (header da sessão, favoritos, adição ao carrinho, confirmação de pedido).
- **Movimento reduzido:** `@media (prefers-reduced-motion: reduce)` desativa todas as transições CSS do projeto.
- **Reflow 320px:** `@media (max-width: 320px)` força layouts em coluna única sem overflow horizontal.
- **Reflow zoom 200% (≈640px lógico):** `@media (max-width: 680px) and (min-width: 521px)` colapsa detalhe/carrinho para coluna única e retira `position: fixed` do resumo do carrinho.
- **`aria-live` no resumo do carrinho:** `<aside aria-live="polite" aria-atomic="false">` anuncia mudanças de cotação ao aplicar cupom.
- **Contraste verificado (WCAG AA/AAA):**

| Par de cores                          | Ratio   |
| ------------------------------------- | ------- |
| `#f2eee8` sobre `#100d0c` (texto base) | 16,75:1 |
| `#c9bdb2` sobre `#15100f` (nav)       | 10,25:1 |
| `#1b110c` sobre `#e99a45` (botão CTA) | 8,10:1  |
| `#e99a45` sobre `#100d0c` (foco)      | 8,45:1  |
| `#a08c7f` sobre `#171210` (placeholder)| 5,80:1 |
| `#c18d58` sobre `#2a1812` (links auth)| 5,83:1  |

Auditoria automática Lighthouse: Accessibility 100% nos quatro cenários. Revisão manual global de zoom/reflow em todas as telas continua pendente.

### Modo claro (light mode)

O projeto oferece suporte a modo claro como opção de acessibilidade e UX. Respeitar a preferência do sistema operacional é uma boa prática recomendada pelo WCAG 2.2 (Critério 1.4.3 e diretrizes de personalização), pois usuários com sensibilidade à luz, daltonismo ou leitura em ambiente iluminado beneficiam-se de paletas de alto contraste sobre fundo claro.

**Implementação:**

| Camada | Mecanismo |
| ------ | --------- |
| CSS custom properties | Tokens de cor declarados em `:root` (dark, padrão); sobrescritos em `@media (prefers-color-scheme: light)` para preferência do SO e em `:root[data-theme='light']` para seleção manual |
| Toggle no header | Botão sun/moon em `RootLayout`; ícone reflete o tema corrente; `aria-label` descreve a ação ("Ativar modo claro" / "Ativar modo escuro") |
| Persistência | `localStorage('kurio.theme')`: `'light'`, `'dark'` ou ausente (segue SO); leitura no init do hook antes do primeiro render; wrappado em `try/catch` (private windows) |
| Prioridade | Manual (`data-theme`) > preferência do SO (`prefers-color-scheme`) > padrão dark |

**Tokens (20 custom properties, cobertura total da folha de estilos):**

| Token | Dark | Light | Uso |
| ----- | ---- | ----- | --- |
| `--color-bg` | `#100d0c` | `#f7f3ef` | fundo da página |
| `--color-bg-header` | `#15100f` | `#ffffff` | cabeçalho |
| `--color-bg-card` | `#171210` | `#fffcf9` | cards, inputs, selects |
| `--color-bg-surface` | `#1a1310` | `#ede8e2` | sidebars, rows secundárias |
| `--color-border` | `#30231d` | `#ddd0c5` | divisores padrão |
| `--color-border-mid` | `#3a2215` | `#cbbfb6` | bordas internas |
| `--color-border-deep` | `#57311e` | `#b8a89e` | separadores fortes |
| `--color-accent` | `#e99a45` | `#c97a20` | CTA, destaques |
| `--color-accent-2` | `#dfa05a` | `#a86218` | eyebrow, variantes |
| `--color-accent-hover` | `#f4b66e` | `#a86218` | hover de botões CTA |
| `--color-accent-fg` | `#1b110c` | `#ffffff` | texto sobre amber |
| `--color-text` | `#f2eee8` | `#1a1310` | texto primário |
| `--color-text-alt` | `#f0e4d9` | `#2a1a14` | texto secundário brilhante |
| `--color-text-sub` | `#c9bdb2` | `#5c5049` | nav, labels terciárias |
| `--color-text-muted` | `#a8978b` | `#7a6355` | placeholders, captions |
| `--color-text-dim` | `#7a5e4a` | `#6b5d54` | metadados, timestamps |
| `--color-error` | `#d46b52` | `#b8402b` | estados de erro |

O amber do modo claro (`#c97a20`) mantém razão de contraste ≥ 4,5:1 sobre `#f7f3ef`, atendendo WCAG AA. Todos os valores de `--color-text` sobre `--color-bg` superam 7:1 (AAA) em ambos os temas.

---

## Performance e otimizações

Medianas Lighthouse (build de produção + MSW default, 3 medições por rota/perfil, sem PSI remoto):

| Perfil  | Rota                   | Performance | Accessibility | Best Practices | SEO  | LCP      | CLS   | TBT   |
| ------- | ---------------------- | ----------: | ------------: | -------------: | ---: | -------: | ----: | ----: |
| mobile  | `/`                    |         87% |          100% |            96% | 100% | 3780 ms  | 0.001 | 89 ms |
| mobile  | `/nft/emerald-ape-042` |         87% |          100% |            96% | 100% | 3846 ms  | 0.013 | 38 ms |
| desktop | `/`                    |         68% |          100% |           100% | 100% | 3676 ms  | 0.015 | 70 ms |
| desktop | `/nft/emerald-ape-042` |         68% |          100% |           100% | 100% | 3701 ms  | 0.020 | 48 ms |

Performance abaixo de 90 em todos os perfis. Causa estrutural: o elemento LCP é a primeira imagem de NFT, carregada após `React bootstrap → MSW lazy init (~340 KB) → chamada de API`; LCP ≥ 3,6 s sem SSR. Thresholds não foram reduzidos nem recursos desativados para melhorar a nota.

Otimizações aplicadas:
- **Chunk splitting manual:** `vendor-react`, `vendor-tanstack`, `vendor-zod`, `vendor-axios`, `vendor-lucide`, `vendor-misc`; MSW permanece lazy.
- **CSS crítico inline:** cores do body, fundo e fontes via plugin Vite (`criticalCssPlugin`).
- **CSS não-bloqueante:** folhas convertidas para `<link rel="preload" as="style" onload>`.
- **Skeleton loader inline:** HTML no `#root` antes do React hidratar; inclui imagem de alta prioridade como LCP placeholder.
- FCP: ~2,5 s → ~2,1 s; TBT: ~195 ms → 40–90 ms.

Relatórios HTML/JSON em `reports/lighthouse/`. Ambiente: Node.js 22.23.4, Linux/arm64, Lighthouse 12.6.1, Chromium 156.0.8078.47.

---

## Deploy (Cloudflare Pages)

Configuração de build:

| Campo                | Valor                                                           |
| -------------------- | --------------------------------------------------------------- |
| Build command        | `VITE_ENABLE_MOCKS=true VITE_MOCK_SCENARIO=default pnpm build` |
| Build output         | `dist`                                                          |
| Node.js version      | 20+ (`NODE_VERSION=20` nas env vars do projeto)                 |

Arquivos de configuração em `public/` (copiados para `dist/` pelo Vite):

- **`_redirects`:** `/* /index.html 200` — fallback SPA para acesso direto e refresh em qualquer rota.
- **`_headers`:** cabeçalhos de segurança (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`) e cache imutável de 1 ano para `/assets/*`, `/*.js`, `/*.css`, `/*.woff2`; `mockServiceWorker.js` com `no-cache`.

Deploy público aguarda autorização e acesso à conta do provedor.

---

## Testes E2E

A suíte Playwright executa em Chromium desktop (1440px) e mobile (390px) com MSW ativo. 110 casos totais: 104 aprovados e 6 skips intencionais por viewport. A fixture aguarda a promise real de `worker.start()`, o controller e os handlers de health/reset antes de prosseguir. Baselines visuais versionadas em `e2e/visual-regression.spec.ts-snapshots/` para início, detalhe, carrinho e pagamento em ambos os perfis.

Cobertura: catálogo/URL/histórico, sessão (cadastro/login/expiração/logout/troca), favoritos com rollback, carrinho visitante/autenticado/merge, compra/recibo/recusa/idempotência/timeout, perfil/carteiras, eventos realtime/reconexão, teclado/foco, skeleton/falha/retry, responsividade sem overflow em 768px. Baselines visuais para tablet (768×1024) em projeto `chromium-tablet`: home, detalhe e carrinho.

---

## Precisão decimal ETH

`priceEth`, valores da cotação, taxas e totais são strings decimais em contratos, estado e persistência. Cálculos usam `big.js`; quantidades são inteiros. Não converter valor para `number` para calcular preço, desconto ou total. Formatação local é a única fronteira em que se admite conversão segura para apresentação.
