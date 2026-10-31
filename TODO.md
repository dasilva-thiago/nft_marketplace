# Backlog do NFT Marketplace

Legenda: **[x]** implementado com evidência; **[ ]** pendente. O scaffold não transforma rotas em funcionalidades concluídas.

## Base de arquitetura

- [x] React, TypeScript, TanStack Router, TanStack Query, Axios, Socket.IO client, Tailwind, Playwright e configuração Lighthouse instalados/configurados. MSW v2 ativável por `VITE_ENABLE_MOCKS`.
- [x] Rotas tipadas declaradas para início, NFT, carrinho, checkout, pedido, login, cadastro, perfil e carteiras; as telas visuais principais já substituem os placeholders.
- [x] Contratos TypeScript documentados para sessão/conta, catálogo, favoritos, carrinho, cotação, pedidos, perfil, carteiras e eventos; ETH representado como string decimal.
- [x] API simulada do catálogo: 12 NFTs locais variados, listagem, busca, filtros de coleção/rede/atributo, ordenação, paginação e detalhe/404, com validação Zod.
- [x] Completar handlers REST/MSW para timeout/reconciliação de pedidos; favoritos, carrinho, cotação, pedidos básicos, perfil, carteiras e eventos realtime têm o núcleo implementado.
- [x] Erros tipados e cenários iniciais de parâmetros inválidos, catálogo vazio/lento, respostas fora de ordem, HTTP 429 e 503, com controle e reset de cenário no MSW.
- [x] Completar cenários de sessão inválida, falta de permissão, conflito de disponibilidade, cupom, timeout/idempotência e persistência/reset de todos os recursos.

### Sessão e conta

- [x] Implementar `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/session` e `POST /api/auth/logout` com MSW, contratos tipados, validação Zod na entrada e na resposta, erros `VALIDATION_ERROR`, `SESSION_INVALID` e `CONFLICT`, sem retornar ou armazenar senhas.
- [x] Disponibilizar pelo menos dois usuários fictícios, com credenciais documentadas, sessões recuperáveis após refresh, expiração determinística e dados privados isolados por usuário; resetar integralmente o estado simulado.
- [x] Criar `authApi` usando Axios com `withCredentials`, query/mutations TanStack Query e política sem retry automático de mutations; validar respostas no cliente antes de entregá-las à interface.
- [x] Implementar telas de login e cadastro com labels, validação, mensagens de erro associadas, estados loading/sucesso/falha, conflito de cadastro e retorno ao destino solicitado.
- [x] Implementar logout e limpeza do cache privado/subscriptions da sessão; exibir identidade autenticada somente a partir da sessão consultada pela API. A limpeza de queries usa o prefixo `private`.
- [x] Testar pela API e pela interface credencial inválida, cadastro conflitante, validação, sessão ausente/expirada, refresh, logout, troca de usuário e isolamento entre usuários.

## Catálogo, detalhe e favoritos

- [x] Primeira home funcional: hero, listagem de cards ligada à API, busca submetida, filtro de coleção, ordenação, paginação, estados loading/erro/vazio e parâmetros preservados na URL; testes cobrem filtro/busca/histórico em desktop e mobile.
- [ ] Completar a fidelidade visual prioritária da home nas larguras 390/768/1440: hero mobile ajustado para composição compacta lado a lado (184 px medidos), grade desktop de três colunas, grade mobile de duas colunas, card de destaque, lançamentos, diário e footer presentes; sem overflow nos três viewports. O requisito permanece aberto para revisar tipografia, proporções e espaçamentos contra todos os frames; preservar os quatro assets de macacos e não criar páginas independentes fora do escopo do desafio.
- [x] Implementar destaque, lançamentos/diário, filtros combináveis de rede/traits/faixa de preço previstos pelo contrato, histórico, paginação e URLs de busca; a validação de respostas fora de ordem permanece coberta no nível de API e a confirmação visual em 768 px é uma pendência de regressão.
- [x] Implementar a tela visual de detalhe com acesso direto, estado 404, galeria, edição, quantidade, favorito e ações de compra/adicionar; persistência e mutations são cobertas pelas APIs de domínio.
- [x] Persistir favoritos para autenticados; incluir mutation otimista com rollback e isolamento entre usuários.
- [x] Cobrir rollback otimista pela interface com o cenário `favorite-failure`: o coração é revertido, o snapshot é restaurado e o erro é anunciado; o contrato API também cobre NFT inexistente.

## Interface de conta e carteiras

- [x] Cadastro, login, logout e sessão integrada à API simulada; credenciais fictícias; sessão recuperável após refresh; expiração durante navegação retorna ao contexto protegido.
- [x] Logout/troca de usuário limpam cache privado; nenhum usuário vê dados de outro. Checkout, perfil, carteiras, favoritos e pedidos exigem autenticação.
- [x] Perfil: edição de nome e senha com confirmação validada; avatar selecionável/removível com assets locais; carteiras podem ser cadastradas/editadas e perfil/carteiras recuperam os dados após refresh da UI.

## Carrinho e pagamento

- [x] Adicionar/alterar/remover itens autenticados conforme disponibilidade de NFT/edição; handlers MSW isolam o carrinho por usuário e queries usam chave privada por identidade.
- [x] Aplicar cupom na cotação API e tratar inválido/expirado; subtotal, desconto, taxa de rede e total vêm da API. ETH trafega em strings decimais e o teste cobre precisão arbitrária.
- [x] Persistir carrinho visitante em armazenamento local e mesclar ao autenticar/cadastrar; quantidades são somadas, disponibilidade é validada e o armazenamento visitante só é limpo após sucesso.
- [x] Refletir alteração de preço/disponibilidade enquanto aberto; informar alteração, atualizar resumo, invalidar a cotação e exigir revisão explícita antes da confirmação.
- [x] Checkout protegido usa os itens do carrinho, gera nova cotação por carteira/rede, valida campos obrigatórios e confirma a compra pela API.
- [x] Pedido com chave de idempotência: mesma chave/conteúdo recupera o mesmo pedido; chave reutilizada com conteúdo diferente retorna conflito. Mutation sem retry automático e E2E de replay/conflito.
- [x] Recuperação pós-timeout/reconexão por chave de idempotência; o checkout persiste a chave na sessão, oferece recuperação explícita e o E2E prova que não há segunda compra.
- [x] Remoção seletiva do carrinho após pedido confirmado: o backend simulado subtrai somente as quantidades compradas e preserva linhas/quantidades restantes.
- [x] Transições de `pending` via evento realtime atualizam o snapshot e a confirmação visual; eventos antigos não regridem o cache após reconexão. Os estados `confirmed`, `pending` e `rejected` são simulados por cenários determinísticos e snapshots consultáveis por refresh.

## Mocking e tempo real

- [x] Fixtures de catálogo com variedade para filtros/paginação e cenários default/vazio/lento/fora de ordem/429/503; os demais domínios usam fixtures persistidas por usuário.
- [x] Fixtures para pelo menos dois usuários e cenários de falha de conexão, sessão expirada/sem permissão, conflito, cupom, preço/edição, timeout pós-criação/idempotência e pagamentos.
- [x] MSW ativo por configuração em desenvolvimento e build demo; estado de catálogo/favoritos/carrinho/perfil/carteiras/pedidos é isolado por domínio/usuário, persiste em `sessionStorage` durante refresh e retorna ao cenário conhecido após reset. Validado pela suíte E2E completa.
- [x] Simular eventos com integração Socket.IO compatível com MSW usando `@mswjs/socket.io-binding`; exercitar `socket.io-client`; documentar transporte e limites. Componentes, hooks e Axios não incluem caminhos de negócio fictícios.
- [x] `nft.updated` atualiza catálogo/detalhe/carrinho; `order.updated` atualiza pedido. Eventos têm identidade estável, recurso e versão; duplicatas/antigos não regridem estado nem reaplicam efeitos; reconexão reconcilia via REST; listeners/subscriptions são limpos; eventos de sessão antiga não alteram usuário atual.
- [x] Cenário ponta a ponta de alteração de NFT no carrinho: a UI informa, atualiza o resumo, recota via REST e bloqueia a cotação antiga até revisão explícita.
- [x] Pedido pendente → evento realtime/reconexão atualiza ou reconcilia o estado sem segunda compra; estados confirmados/recusados são terminais.

## Interface e acessibilidade

- [ ] Completar a fidelidade fina aos frames do Figma em 390/768/1440 px, preservando tipografia, cores, espaçamentos, hierarquia, imagens, proporções e composição. `ARCHITECTURE.md` registra as substituições de asset e decisões responsivas/acessíveis já tomadas.
- [ ] Reproduzir visualmente início, login, cadastro, detalhe do NFT, carrinho e pagamento nos pares desktop/mobile definidos pelo Figma; login e cadastro desktop devem permanecer modais sobre a home, enquanto mobile deve usar as telas dedicadas. Existem baselines versionadas de início/detalhe/carrinho/pagamento; a comparação fina com todos os frames continua aberta.
- [x] Reproduzir visualmente confirmação, perfil e carteiras nas referências desktop; adaptar responsivamente as três variantes mobile sem frame específico, preservando a composição desktop e documentando a decisão em `ARCHITECTURE.md`.
- [x] Skeleton shimmer em catálogo, detalhe e resumo do carrinho; preservar dimensões contra CLS e respeitar movimento reduzido.
- [ ] Revisão manual global de acessibilidade, incluindo zoom/reflow e feedback de eventos em todas as telas. Playwright cobre teclado/foco, diálogo desktop, labels, landmarks, confirmação nomeada e erros associados; os contrastes representativos e os ajustes documentados em `ARCHITECTURE.md` foram verificados.

## Testes, qualidade e deploy

- [x] Playwright inicial para smoke da home, catálogo via Axios/MSW (página/filtro/detalhe/404/parâmetros inválidos), Socket.IO binding e cenário 429/reset.
- [x] Cobrir com E2E catálogo/URL/histórico; cadastro/login/expiração/logout/troca; favoritos/falha/recuperação; carrinho; compra/recibo/recusa/idempotência; perfil/carteiras; eventos/reconexão; teclado/foco; skeleton/falha/retry. A última execução completa listou 110 casos: 104 aprovados e 6 skips intencionais por viewport.
- [x] Casos Playwright executam em Chromium desktop/mobile com MSW e cliente Socket.IO, observam UI/resultados e isolam/resetam seus cenários; existem baselines versionadas para início/detalhe/carrinho/pagamento e reporter HTML em `playwright-report/`. A última execução terminou sem falhas.
- [x] Executar a matriz Lighthouse em build otimizado de início/detalhe, desktop/mobile, três medições por combinação; versionar configuração, 12 relatórios HTML/JSON, ambiente/versões, medianas das categorias e LCP/CLS/TBT em `reports/lighthouse/summary.md`.
- [ ] Otimizar a carga inicial até Performance ≥90 ou priorizar com a revisão técnica. Medianas atuais: 84% home mobile, 83% detalhe mobile, 61% home desktop e 64% detalhe desktop; Accessibility (100%), Best Practices (96% mobile/100% desktop) e SEO (100%) atingem as metas. Os LHR apontam FCP/LCP altos, request LCP não descoberto no HTML e custo de script/layout; detalhes e relatórios estão em `ARCHITECTURE.md` e `reports/lighthouse/`.
- [x] README completo com setup, variáveis, credenciais fictícias, cenários/reset, comandos, contratos, transporte/limitações Socket.IO/MSW, cache/retries e fluxos de falha. Código, lockfile, assets, mocks, fixtures, testes e configs estão no repositório.
- [ ] Deploy obrigatório (Vercel recomendado; Netlify/Cloudflare Pages aceitos), URL pública acessível, mocks e tempo real funcionais, rota direta e refresh operacionais; configuração Vercel/fallback está preparada, mas publicar e validar requer autorização/acesso à conta do provedor.
