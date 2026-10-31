# Backlog do desafio — status após a fundação e fatia de sessão

Legenda: **[x]** implementado com evidência; **[ ]** pendente. O scaffold não transforma rotas em funcionalidades concluídas.

## Base de arquitetura

- [x] React, TypeScript, TanStack Router, TanStack Query, Axios, Socket.IO client, Tailwind, Playwright e configuração Lighthouse instalados/configurados. MSW v2 ativável por `VITE_ENABLE_MOCKS`; handlers de negócio ainda pendentes.
- [x] Rotas tipadas declaradas para início, NFT, carrinho, checkout, pedido, login, cadastro, perfil e carteiras; as telas visuais principais já substituem os placeholders.
- [x] Contratos TypeScript documentados para sessão/conta, catálogo, favoritos, carrinho, cotação, pedidos, perfil, carteiras e eventos; ETH representado como string decimal.
- [x] API simulada do catálogo: 12 NFTs locais variados, listagem, busca, filtros de coleção/rede/atributo, ordenação, paginação e detalhe/404, com validação Zod.
- [ ] Completar handlers REST/MSW para sessão/conta (cadastro, login, consulta, logout, expiração), favoritos, carrinho, cotação, pedidos idempotentes, perfil e carteiras.
- [x] Erros tipados e cenários iniciais de parâmetros inválidos, catálogo vazio/lento, respostas fora de ordem, HTTP 429 e 503, com controle e reset de cenário no MSW.
- [ ] Completar cenários de sessão inválida, falta de permissão, conflito de disponibilidade, cupom, timeout/idempotência e persistência/reset de todos os recursos.

## Esforço extra de segurança

- [x] Documentar a diferença entre validação de demonstração e proteção real; adicionar Zod para query de catálogo, fixtures e respostas do catálogo.
- [x] Simular HTTP 429 com `Retry-After` e testar reset; não representa rate limit de produção.
- [ ] Aplicar schemas Zod aos demais domínios e tratar 429 na interface sem repetir mutations automaticamente.
- [ ] Configurar cabeçalhos de segurança do deploy quando a plataforma for escolhida.
- [ ] JWT, Helmet middleware e cookie HttpOnly exigem servidor real; não implementar como segredo/controle de segurança no bundle ou no mock do navegador.

### Fatia aprovada — sessão e segurança simulada

- [x] Implementar `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/session` e `POST /api/auth/logout` com MSW, contratos tipados, validação Zod na entrada e na resposta, erros `VALIDATION_ERROR`, `SESSION_INVALID` e `CONFLICT`, sem retornar ou armazenar senhas.
- [x] Disponibilizar pelo menos dois usuários fictícios, com credenciais documentadas, sessões recuperáveis após refresh, expiração determinística e dados privados isolados por usuário; resetar integralmente o estado simulado.
- [x] Criar `authApi` usando Axios com `withCredentials`, query/mutations TanStack Query e política sem retry automático de mutations; validar respostas no cliente antes de entregá-las à interface.
- [x] Implementar telas de login e cadastro com labels, validação, mensagens de erro associadas, estados loading/sucesso/falha, conflito de cadastro e retorno ao destino solicitado.
- [x] Implementar logout e limpeza do cache privado/subscriptions da sessão; exibir identidade autenticada somente a partir da sessão consultada pela API. A limpeza de queries usa o prefixo `private`; subscriptions de domínio ainda serão adicionadas nas próximas fatias.
- [x] Testar pela API e pela interface credencial inválida, cadastro conflitante, validação, sessão ausente/expirada, refresh, logout, troca de usuário e isolamento entre usuários.
- [x] Documentar que o handle usado pelo MSW é apenas de demonstração; JWT assinado, cookie `HttpOnly; Secure; SameSite`, Helmet e rate limit efetivo permanecem requisitos de um backend/host real.

## Catálogo, detalhe e favoritos

- [x] Primeira home funcional: hero, listagem de cards ligada à API, busca submetida, filtro de coleção, ordenação, paginação, estados loading/erro/vazio e parâmetros preservados na URL; testes cobrem filtro/busca/histórico em desktop e mobile.
- [ ] Replicar a nova referência reenviada da home: hero compacto com `Emerald Ape #042`, catálogo em três colunas, card de oferta limitada, faixas editoriais, diário e footer; manter os quatro assets de macacos reutilizados em todo o catálogo e documentar qualquer ajuste de acessibilidade.
- [x] Implementar destaque, lançamentos/diário, filtros combináveis de rede/traits/faixa de preço previstos pelo contrato, histórico, paginação e URLs de busca; a validação de respostas fora de ordem permanece coberta no nível de API e a confirmação visual em 768 px continua pendente.
- [x] Implementar a tela visual de detalhe com acesso direto, estado 404, galeria, edição, quantidade, favorito e ações de compra/adicionar; persistência e mutations permanecem pendentes.
- [ ] Persistir favoritos para autenticados; incluir ao menos uma mutation otimista com rollback.

## Sessão e conta

- [ ] Cadastro, login, logout e sessão integrada à API simulada; credenciais fictícias; sessão recuperável após refresh; tratar expiração durante navegação/checkout preservando contexto de retorno.
- [ ] Logout/troca de usuário limpam cache privado e subscriptions; nenhum usuário vê dados de outro. Checkout, perfil, carteiras, favoritos e pedidos exigem autenticação.
- [ ] Perfil: editar dados/avatar e senha; carteiras: cadastrar/editar principal e secundária; validar formulários e erros da API; persistir alterações após refresh; nunca armazenar senha em claro.

## Carrinho e pagamento

- [ ] Adicionar/alterar/remover itens conforme disponibilidade de NFT/edição; persistir em refresh e preservar/mesclar itens do visitante ao autenticar.
- [ ] Aplicar/remover cupom; tratar inválido/expirado; subtotal, desconto, taxa de rede e total vêm da cotação da API. ETH trafega em strings decimais; quantidades inteiras; precisão arbitrária; cotação da API é referência final.
- [ ] Refletir alteração de preço/disponibilidade enquanto aberto; informar alteração, atualizar resumo e invalidar cotação.
- [ ] Checkout valida campos, permite revisão, usa carteiras e redes cadastradas e simula conexão/recusa/desconexão. Revalidar preço, disponibilidade, cupom e taxas antes de confirmar; mudança exige nova confirmação.
- [ ] Pedido com chave de idempotência: mesma chave/conteúdo recupera o mesmo pedido; chave reutilizada com conteúdo diferente retorna conflito. Impedir duplicata por clique/reenvio após timeout.
- [ ] Estados pendente/confirmado/recusado com recuperação após refresh/reconexão; confirmação apenas após sucesso simulado; falhas preservam itens; sucesso remove apenas itens/quantidades comprados; recibo usa snapshot imutável e referências de transação/explorer simuladas.

## Mocking e tempo real

- [x] Fixtures de catálogo com variedade para filtros/paginação e cenários default/vazio/lento/fora de ordem/429/503; ainda não há fixtures de dois usuários nem dos demais domínios.
- [ ] Fixtures para pelo menos dois usuários e cenários de falha de conexão, sessão expirada/sem permissão, conflito, cupom, preço/edição, timeout pós-criação/idempotência e pagamentos.
- [ ] MSW ativo por configuração em desenvolvimento e build demo, state consistente em catálogo/favoritos/carrinho/perfil/carteiras/pedidos, persistência local para refresh e reset para cenário conhecido.
- [ ] Simular eventos com integração Socket.IO compatível com MSW (avaliar `@mswjs/socket.io-binding`); exercitar `socket.io-client`; documentar transporte e limites. Componentes, hooks e Axios não incluem caminhos de negócio fictícios.
- [ ] `nft.updated` atualiza catálogo/detalhe/carrinho; `order.updated` atualiza pedido. Eventos têm identidade estável, recurso e versão; duplicatas/antigos não regridem estado nem reaplicam efeitos; reconexão reconcilia via REST; limpar listeners/subscriptions; eventos de sessão antiga nunca alteram usuário atual.
- [ ] Cenário ponta a ponta: NFT no carrinho sofre alteração → UI informa e atualiza resumo → checkout bloqueia cotação antiga. Queda com pedido pendente → reconexão/refresh recupera estado sem segunda compra; estados confirmados/recusados são terminais.

## Interface e acessibilidade

- [ ] Implementar os frames recebidos do Figma em desktop/tablet/mobile nas larguras 390/768/1440, preservando tipografia, cores, espaçamentos, hierarquia, imagens, proporções e composição; documentar em `docs/architecture.md` cada substituição de asset e ajuste de acessibilidade.
- [ ] Reproduzir visualmente início, login, cadastro, detalhe do NFT, carrinho e pagamento nos pares desktop/mobile fornecidos; login e cadastro desktop devem permanecer modais sobre a home, enquanto mobile deve usar as telas dedicadas fornecidas.
- [x] Reproduzir visualmente confirmação, perfil e carteiras nas referências desktop fornecidas; adaptar responsivamente as três variantes mobile sem screenshot, preservando a composição desktop e documentando a decisão em `docs/architecture.md`.
- [ ] Skeleton shimmer em catálogo, detalhe e resumo do carrinho; preservar dimensões contra CLS e respeitar movimento reduzido.
- [ ] Teclado/foco visível; foco em diálogos/drawers; semântica, labels e erros associados; alt text; contraste e estados que não dependem só de cor; feedback acessível para mutations/eventos; sem overflow indevido e sem perda de conteúdo com zoom.

## Testes, qualidade e deploy

- [x] Playwright inicial para smoke da home, catálogo via Axios/MSW (página/filtro/detalhe/404/parâmetros inválidos), Socket.IO binding e cenário 429/reset.
- [ ] Completar E2E: catálogo/URL/histórico na interface; cadastro/login/expiração/logout/troca; favoritos/falha/recuperação; carrinho; compra/recibo/recusa/idempotência; perfil/carteiras; eventos/reconexão; teclado/foco; skeleton/falha/retry.
- [ ] Cada teste inicia isolado; controlar relógio/latência/eventos sensíveis ao tempo; observar UI e resultado; REST por handlers MSW e tempo real por socket.io-client. Chromium desktop/mobile; visual regressão de início/detalhe/carrinho/pagamento com baselines versionadas; entregar relatório HTML e traces.
- [ ] Lighthouse otimizado em início e detalhe, desktop/mobile, três medições por cenário; reportar medianas: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90; reportar LCP/CLS/TBT e justificar déficits; versionar configuração, relatórios HTML/JSON, ferramentas e ambiente.
- [ ] README completo com setup, variáveis, credenciais fictícias, cenários/reset, comandos, contratos, transporte/limitações Socket.IO/MSW, cache/retries e fluxos de falha. Código, lockfile, assets, mocks, fixtures, testes e configs entregues.
- [ ] Deploy obrigatório (Vercel recomendado; Netlify/Cloudflare Pages aceitos), URL pública acessível, mocks e tempo real funcionais, rota direta e refresh operacionais; versão publicada corresponde ao código entregue.
