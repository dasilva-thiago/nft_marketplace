# Arquitetura da aplicação

## Objetivo e estado atual

A aplicação é uma SPA React + TypeScript para o desafio NFT Marketplace. A arquitetura coloca todos os dados de negócio atrás de contratos REST tipados e uma API simulada MSW. Socket.IO é uma via de atualização em tempo real separada, que deve reconciliar os recursos com REST após reconexão. A carteira, a cotação e o pagamento são simulações — não há conexão blockchain, extensão de carteira nem gateway.

O projeto contém configuração e diretórios por domínio, roteamento, cliente Axios, QueryClient, contratos REST documentados, schemas Zod de catálogo e autenticação, utilitário decimal, cliente Socket.IO, habilitação opt-in do MSW, catálogo simulado de leitura com busca/filtros/ordenação/paginação/detalhe, sessão simulada com dois usuários, cenários reproduzíveis e testes de integração. Os fluxos visuais e os handlers de favoritos, carrinho, cotação, pedido, perfil e carteiras ainda estão pendentes em `TODO.md`; rotas existentes não significam fluxos prontos.

## Direção das dependências

```text
app/routes -> features/* -> shared/api + shared/query + shared/lib + shared/ui
                                  ^
                    mocks/* intercepta transporte HTTP/WebSocket
realtime/* -> socket.io-client; emite atualizações -> cache TanStack Query
```

- `app/` compõe providers e rotas. Não contém regra de negócio.
- `features/<domínio>/` mantém páginas, componentes, validação, hooks, contratos/API e mutations daquele domínio. Uma feature não deve importar detalhes internos de outra; compartilhar por `shared` ou contratos públicos.
- `shared/api/` configura Axios e tipos de transporte/erros. Só APIs de domínio fazem chamadas HTTP.
- `shared/query/` contém política do cache e chaves compartilhadas. Features definem as próprias query options.
- `shared/lib/` contém utilitários puros, como aritmética decimal ETH.
- `shared/ui/` contém componentes acessíveis reutilizáveis compatíveis com o sistema do Figma/shadcn.
- `mocks/` implementa handlers e fixtures no limite da rede. Não deve ser importado por páginas, hooks de domínio ou cliente Axios, exceto pelo bootstrap opt-in.
- `realtime/` encapsula criação, conexão, subscriptions e descarte do cliente Socket.IO. Eventos não são simulados chamando setters ou escrevendo direto em componente.

## Transporte e estado assíncrono

A camada de domínio chama Axios; Axios recebe `AbortSignal` fornecido pelo TanStack Query. O handler MSW intercepta a requisição em desenvolvimento/teste/demo quando `VITE_ENABLE_MOCKS=true`. Contratos devem distinguir resposta bem-sucedida de erros tipados para validação, sessão inválida, autorização, recurso ausente, conflito e falha transitória.

Query keys são serializáveis e incluem todos os parâmetros da consulta. Recursos privados também incluem `userId`/identidade estável na chave. A query `session` é recuperável após refresh por um handle exclusivo do mock; ao fazer logout, expirar a sessão ou trocar de usuário, limpar queries privadas e subscriptions antes de carregar a nova sessão. Não compartilhar cache privado mesmo que duas contas peçam a mesma rota.

Retry é limitado a consultas seguras e erros transitórios; não repetir mutations automaticamente. Pedido exige chave de idempotência e o cliente consulta/recupera a tentativa já iniciada após timeout. Mutations otimizadas revertem snapshot do cache em erro. Após mutations REST, invalidar apenas recursos relacionados; após evento, atualizar/inutilizar cache de forma idempotente. A mutation de logout grava `null` na query `session` e remove queries futuras com prefixo `private`; as próximas features devem usar esse prefixo para manter o isolamento.

## Precisão e pedido

`priceEth`, valores da cotação, taxas e totais são strings decimais em contratos, estado e persistência. Cálculos usam `big.js`; quantidades são inteiros. Não converter valor para `number` para calcular preço, desconto ou total. Formatação local é a única fronteira em que se admite conversão segura para apresentação, e ainda deve respeitar a precisão escolhida.

O pedido armazena um snapshot imutável dos nomes, imagens, preços unitários, quantidades, taxas, total, referência simulada e estado. Atualizações posteriores do NFT não alteram o recibo. A confirmação só é exibida para `confirmed`; `pending` é retomável e `confirmed`/`rejected` são terminais. Falha mantém o carrinho; confirmação baixa apenas itens/quantidades efetivamente comprados.

## Tempo real

`nft.updated` e `order.updated` são eventos versionados, com `eventId`, `resourceId`, `version`, timestamp e payload. O receptor ignora duplicatas e versões menores que a versão armazenada. Alterações de NFT no carrinho atualizam visualmente preço/disponibilidade e invalidam a cotação. O checkout recota no servidor simulado; diferenças exigem nova confirmação humana. Quando Socket.IO reconecta, REST revalida os recursos ativos antes de sinalizar estado sincronizado.

No escopo deste desafio, eventos do MSW precisam chegar ao `socket.io-client` pelo binding compatível `@mswjs/socket.io-binding`. O scaffold já inclui o handler de WebSocket com o binding, inscrição por usuário e um smoke E2E que verifica a ida e volta pelo cliente. A integração de cenários de negócio para `nft.updated` e `order.updated` ainda está pendente. O binding trabalha sobre WebSocket e não implementa todos os recursos do servidor Socket.IO (como rooms/broadcasting); não alegar suporte para transporte/funcionalidade não exercitados.

## Roteamento e interface

TanStack Router é a fonte das rotas e parâmetros de catálogo. Busca, filtros combináveis, ordenação e paginação ficam na URL; atualizar filtro reinicia a página. Rotas privadas precisam carregar sessão e preservar a URL de retorno quando exigem login. Todas as páginas previstas suportam acesso direto e refresh; fallback 404 não pode ser confundido com recurso inexistente.

O design de referência é o export do Figma: base escura marrom/preta e acentos âmbar, navegação e cards compactos, formulários coerentes com as telas desktop/mobile. Tokens exatos e assets de NFT/fontes precisam ser exportados do arquivo fonte se disponíveis. Não usar a prancha inteira exportada como se fosse asset de produto. Em breakpoints 390/768/1440, skeletons reservam geometria, interações têm foco visível, diálogos controlam foco e feedback de mudança de rede é anunciado semanticamente.

## Mocking e testes

REST e Socket.IO são pontos de transporte independentes, mas compartilham o mesmo estado de cenário nos handlers; nenhuma alteração pode atualizar só o socket ou só a resposta REST. Cenários devem ser selecionáveis e resetáveis, persistir o suficiente para refresh e usar dados determinísticos. Testes iniciam com estado limpo; latência, relógio e eventos são controlados nos casos sensíveis a tempo.

Playwright observa a interface e a consequência da operação, em Chromium desktop e mobile. Testes REST exercitam handlers MSW; testes de tempo real emitem eventos pelo binding e recebem-nos pelo cliente real Socket.IO. Relatórios e traces ficam sob pastas ignoradas. Lighthouse roda no build de produção sobre as imagens, fontes e funcionalidades reais, com três medições por página/perfil e relatório de medianas.
