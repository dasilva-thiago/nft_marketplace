# Contratos REST do desafio

Esta documentação define o formato compartilhado entre a interface e o MSW. Todos os endpoints têm o prefixo `/api`; Axios é a única camada HTTP da aplicação. Respostas de sucesso retornam JSON direto (exceto `204` em remoção sem corpo). Erros usam o formato abaixo. O backend é simulado por MSW; não há blockchain nem gateway de pagamento.

Os tipos TypeScript correspondentes ficam em `src/shared/contracts/` e os schemas Zod no mesmo limite. Se um campo mudar, atualize tipo, schema, handler e testes juntos.

## Padrões comuns

- Datas são ISO 8601 UTC.
- IDs são strings estáveis de fixtures.
- `page` começa em 1; `pageSize` é inteiro positivo. Resposta paginada contém `items`, `page`, `pageSize`, `totalItems`, `totalPages`.
- Filtros são combináveis e serializados na URL. `sort` identifica o campo e `sortOrder` aceita `asc`/`desc`.
- Preços, taxas, descontos e totais ETH trafegam como strings decimais, nunca números JSON. Quantidade/página/versão são inteiros.
- Identidade de usuário vem da sessão simulada; o cliente não escolhe `userId` no corpo para operar recursos privados.
- A sessão de demonstração é implementada pelo mock; senhas não são guardadas em localStorage/sessionStorage. O cliente mantém somente um handle opaco de demonstração em `sessionStorage` para reconstruir a sessão após refresh. Esse handle não é JWT, não é segredo e não representa um cookie `HttpOnly`; `HttpOnly` só será alegado quando um servidor real puder emitir o cookie. Use apenas credenciais fictícias.
- Todas as operações de escrita repetíveis devem ser seguras contra duplo clique; criação de pedido exige `Idempotency-Key`.

### Erro comum

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Revise os campos destacados.",
  "fields": { "email": "Informe um e-mail válido." },
  "requestId": "req-demo-001",
  "retryable": false
}
```

Códigos tipados: `VALIDATION_ERROR` (400), `SESSION_INVALID` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `AVAILABILITY_CONFLICT` (409), `CONFLICT` (409), `COUPON_INVALID`/`COUPON_EXPIRED` (422), `PAYMENT_REJECTED` (422), `RATE_LIMITED` (429, respeitar `Retry-After`) e `TRANSIENT_ERROR` (503, retryable). Timeout/desconexão podem não ter resposta HTTP; a UI precisa recuperar a operação sem repetir compra.

## Recursos e operações

### Sessão e conta

| Método e rota             | Entrada                                         | Sucesso                                    | Erros relevantes                              |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ | --------------------------------------------- |
| `POST /api/auth/register` | `RegisterRequest` (`name`, `email`, `password`) | `201 Session`; email existente é conflito  | 400 validação, 409 conflito                   |
| `POST /api/auth/login`    | `LoginRequest`                                  | `200 Session` e cookie de sessão           | 400 validação, 401 credencial/sessão inválida |
| `GET /api/session`        | —                                               | `200 Session`                              | 401 ausente/expirada                          |
| `POST /api/auth/logout`   | —                                               | `200 { "loggedOut": true }`, expira cookie | 401 pode ser tratado como sessão já encerrada |

`Session` tem `user` (`id`, `name`, `email`, `avatarUrl`) e `expiresAt`. Use duas contas fictícias de teste documentadas no README; cada uma deve ter dados privados separados.

Na demonstração atual, o MSW implementa os quatro endpoints acima e valida requests/responses com Zod. O mock usa o header interno `X-Mock-Session` para transportar um handle codificado entre o cliente Axios e o handler; o valor é reconstruível após refresh somente para sustentar o cenário local. Logout remove o handle do navegador e encerra o registro em memória do mock. O cenário `session-expired` faz `GET /api/session` retornar `401 SESSION_INVALID` e é persistido na `sessionStorage` do cenário somente para reproduzir refresh em testes.

### NFTs

| Método e rota          | Entrada                                                                       | Sucesso                    | Erros relevantes                                |
| ---------------------- | ----------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------- |
| `GET /api/nfts`        | query: `page`, `pageSize`, `search`, `sort`, `sortOrder` e filtros repetíveis | `PageResponse<NftSummary>` | 400 parâmetros inválidos, 503 falha transitória |
| `GET /api/nfts/:nftId` | identificador na rota                                                         | `Nft`                      | 404 não encontrado                              |

`NftSummary` contém `id`, `name`, `imageUrl`, `collection`, `priceEth`, `availableEditions`, `network` e `version`. `Nft` acrescenta `description`, `gallery`, edição atual/total e `attributes` (`trait`, `value`). Quantidade indisponível não é 404: é um conflito de disponibilidade na tentativa de carrinho/cotação.

### Favoritos

| Método e rota                  | Entrada   | Sucesso                           | Erros relevantes |
| ------------------------------ | --------- | --------------------------------- | ---------------- |
| `GET /api/favorites`           | sessão    | `Favorite[]`                      | 401              |
| `PUT /api/favorites/:nftId`    | sem corpo | `Favorite` (operação idempotente) | 401, 404 NFT     |
| `DELETE /api/favorites/:nftId` | sem corpo | `204`                             | 401              |

`Favorite` é vinculado ao usuário da sessão e NFT. Remover favorito inexistente pode responder 204 para ser idempotente.

Os handlers MSW mantêm favoritos isolados por usuário e validam a existência do NFT. A interface usa mutation otimista: atualiza a lista imediatamente, restaura o snapshot anterior em caso de erro e invalida a query após a resposta.

### Carrinho

| Método e rota                   | Entrada                                    | Sucesso           | Erros relevantes                                 |
| ------------------------------- | ------------------------------------------ | ----------------- | ------------------------------------------------ |
| `GET /api/cart`                 | sessão ou visitante                        | `Cart`            | 401 se sessão expirou em operação protegida      |
| `POST /api/cart/items`          | `AddCartItemRequest` (`nftId`, `quantity`) | `Cart` atualizado | 400 quantidade; 404 NFT; 409 edição indisponível |
| `PATCH /api/cart/items/:nftId`  | `UpdateCartItemRequest` (`quantity`)       | `Cart` atualizado | 400; 404 item; 409 estoque mudou                 |
| `DELETE /api/cart/items/:nftId` | —                                          | `Cart` atualizado | 404 item pode ser tratado idempotentemente       |

`Cart` contém `userId` ou `null`, `items` e `version`. Cada `CartLine` tem `nftId`, quantidade inteira e o resumo atual do NFT. Ao login, preservar/mesclar carrinho visitante segundo regra documentada e testada; não descartar itens silenciosamente.

Na fatia atualmente implementada, o carrinho é protegido por sessão e mantém estado isolado por usuário no MSW. A persistência/mesclagem de carrinho visitante continua pendente.

### Cotação e cupom

| Método e rota      | Entrada                                                                             | Sucesso              | Erros relevantes                                                |
| ------------------ | ----------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------- |
| `POST /api/quotes` | `QuoteRequest`: itens (`nftId`, `quantity`), `couponCode?`, `walletId?`, `network?` | `Quote` atual da API | 401, 404 NFT/carteira, 409 estoque, 422 cupom inválido/expirado |

`Quote` contém `quoteId`, linhas cotadas (`QuoteLine`), cupom aplicado, `subtotalEth`, `discountEth`, `networkFeeEth`, `totalEth`, `createdAt`, `expiresAt`, `version`. Toda mudança de item, cupom, preço, disponibilidade, carteira ou rede requer cotação nova. Checkout não aceita cotação expirada ou antiga; divergência deve ser mostrada e exigir confirmação do usuário.

Os fixtures de demonstração aceitam `KURIO10`, que aplica 10% de desconto, e reconhecem `EXPIRED` como cupom expirado. Outros códigos retornam `COUPON_INVALID`; a taxa de rede simulada é `0.016` ETH.

### Pedidos

| Método e rota              | Entrada                                                                                             | Sucesso                                                                       | Erros relevantes                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `POST /api/orders`         | Header `Idempotency-Key` obrigatório; corpo `CreateOrderRequest` (`quoteId`, `walletId`, `network`) | `201 OrderSnapshot`; mesma chave e mesmo conteúdo recuperam a mesma tentativa | 400 chave ausente; 401; 403; 409 chave com outro conteúdo/estoque; 422 pagamento recusado |
| `GET /api/orders/:orderId` | sessão                                                                                              | `OrderSnapshot`                                                               | 401, 403 pedido de outro usuário, 404                                                     |

`OrderSnapshot` registra `id`, `userId`, estado `pending`/`confirmed`/`rejected`, linhas e cotação usadas como snapshot imutável, `transactionRef` (string simulada ou null), timestamps e `version`. Um timeout após criação não cancela necessariamente o pedido: consultar/recuperar pela chave antes de tentar enviar outra compra. Pedido confirmado ou recusado é terminal.

Atualmente o mock persiste a cotação por usuário, valida expiração no `POST /api/orders`, cria snapshots e guarda a associação entre usuário, chave de idempotência e conteúdo. O replay da mesma chave e payload retorna o mesmo pedido; a mesma chave com payload diferente retorna `409 CONFLICT`. Os cenários `payment-pending` e `payment-rejected` produzem snapshots com estado `pending` ou `rejected`, sem `transactionRef`; o cenário `default` produz `confirmed`. Timeout/reconexão e remoção seletiva dos itens do carrinho permanecem nas próximas etapas.

### Perfil

| Método e rota                 | Entrada                                       | Sucesso                   | Erros relevantes               |
| ----------------------------- | --------------------------------------------- | ------------------------- | ------------------------------ |
| `GET /api/profile`            | sessão                                        | `CollectorProfile`        | 401                            |
| `PATCH /api/profile`          | `UpdateProfileRequest` (`name`, `avatarUrl?`) | perfil atualizado         | 400 validação, 401             |
| `PATCH /api/profile/password` | `ChangePasswordRequest`                       | `200 { "updated": true }` | 400 validação/senha atual, 401 |

O avatar usa caminho/URL local de fixture no demo. Nunca armazenar senha em claro ou retornar senha nas respostas.

### Carteiras

| Método e rota                  | Entrada                                   | Sucesso             | Erros relevantes                               |
| ------------------------------ | ----------------------------------------- | ------------------- | ---------------------------------------------- |
| `GET /api/wallets`             | sessão                                    | `Wallet[]`          | 401                                            |
| `POST /api/wallets`            | `CreateWalletRequest`                     | `201 Wallet`        | 400 validação/endereço/rede, 401, 409 conflito |
| `PATCH /api/wallets/:walletId` | `UpdateWalletRequest` (campos alteráveis) | `Wallet` atualizado | 400 validação, 401, 404, 409                   |

`Wallet` tem `id`, `userId`, `label`, `address`, `network`, `isPrimary`, `version`. Principal/secundária e seleção de rede são dados simulados, não endereços reais necessários.

## Controle de cenário MSW (somente demonstração/teste)

Estas rotas são interceptadas pelo service worker, não fazem parte da API de produção e existem para tornar testes repetíveis.

| Método e rota              | Entrada                  | Sucesso                                |
| -------------------------- | ------------------------ | -------------------------------------- | ------ | -------------- | -------------- | ------------- | ----------------- | ----------------- | --------------------- | ----------------------- |
| `PUT /api/__mock/scenario` | `{ "scenario": "default" | "empty"                                | "slow" | "out-of-order" | "rate-limited" | "unavailable" | "session-expired" | "payment-pending" | "payment-rejected" }` | `{ "scenario": "..." }` |
| `POST /api/__mock/reset`   | —                        | `{ "scenario": "...", "reset": true }` |

O cenário escolhido afeta apenas os handlers MSW em memória. Controle global é serializado no Playwright para evitar que um teste contamine outro. Não expor controles desse tipo em uma API real.

## Eventos Socket.IO

Formato comum: `VersionedEvent<T>` com `eventId`, `resourceId`, `version`, `occurredAt`, `payload`.

- `nft.updated`: payload `NftUpdatedPayload` (`nftId`, `priceEth`, `availableEditions`). Atualiza listagem/detalhe/carrinho e invalida cotação.
- `order.updated`: payload `OrderUpdatedPayload` (`orderId`, `status`, `transactionRef`). Atualiza o pedido; `confirmed`/`rejected` são terminais.

Evento duplicado (mesmo `eventId`) ou mais antigo (versão menor) não modifica o estado. Após reconexão, consultar REST para conciliar. Liberar listener e subscription ao encerrar sessão.

## Cobertura de contratos a implementar

Os contratos em `src/shared/contracts/` estabelecem os tipos; esta documentação estabelece o comportamento esperado. Listagem e detalhe de NFTs, sessão, favoritos, cotação, criação/consulta inicial de pedidos e o núcleo autenticado de carrinho já têm handlers MSW, validação, API Axios, queries/mutations e testes de integração. Estados avançados de pedido, perfil, carteiras, carrinho visitante/mesclagem e eventos de negócio ainda precisam de implementação. Para cada rota, criar um teste que prove o sucesso e ao menos o erro relevante acima. Não considerar o recurso concluído até o handler, API Axios, query/mutation e teste da interface usarem o mesmo contrato.
