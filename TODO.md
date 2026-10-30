# Backlog do desafio — status após a fundação

Legenda: **[x]** implementado com evidência; **[ ]** pendente. O scaffold não transforma rotas em funcionalidades concluídas.

## Base de arquitetura

- [x] React, TypeScript, TanStack Router, TanStack Query, Axios, Socket.IO client, Tailwind, Playwright e configuração Lighthouse instalados/configurados. MSW v2 ativável por `VITE_ENABLE_MOCKS`; handlers de negócio ainda pendentes.
- [x] Rotas tipadas declaradas para início, NFT, carrinho, checkout, pedido, login, cadastro, perfil e carteiras; rotas placeholder exceto home scaffold.
- [x] Contratos iniciais tipados para paginação, NFT, cotação, pedido e evento versionado; ETH representado como string e utilitário decimal.
- [ ] Completar API REST e MSW para sessão/conta (cadastro, login, consulta, logout, expiração), NFTs (listagem/detalhe), favoritos, carrinho, cotação, pedidos idempotentes, perfil e carteiras.
- [ ] Erros simulados tipados para validação, sessão inválida, falta de permissão, não encontrado, conflito de disponibilidade e falha transitória; persistência coerente e reset total dos mocks.

## Catálogo, detalhe e favoritos

- [ ] Implementar destaque, catálogo, busca, filtros combináveis, ordenação, paginação e navegação para detalhe. Busca/filtros/ordenação/paginação compõem URL, sobrevivem a refresh e histórico; mudança de filtro reinicia página; parâmetros enviados à API correspondem à URL; tratar vazio, erros, respostas fora de ordem e cancelar/descartar respostas obsoletas.
- [ ] Implementar detalhe com acesso direto, NFT inexistente, edição indisponível, limite de quantidade, galeria, quantidade, favorito e compra.
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

- [ ] Fixtures com variedade para filtros/paginação e pelo menos dois usuários; sucesso/vazio, latência variável, respostas fora de ordem, falha de conexão, 4xx/5xx, sessão expirada/sem permissão, conflito, cupom inválido/expirado, preço alterado, edição esgotada, timeout pós-criação/idempotência e pagamento confirmado/recusado.
- [ ] MSW ativo por configuração em desenvolvimento e build demo, state consistente em catálogo/favoritos/carrinho/perfil/carteiras/pedidos, persistência local para refresh e reset para cenário conhecido.
- [ ] Simular eventos com integração Socket.IO compatível com MSW (avaliar `@mswjs/socket.io-binding`); exercitar `socket.io-client`; documentar transporte e limites. Componentes, hooks e Axios não incluem caminhos de negócio fictícios.
- [ ] `nft.updated` atualiza catálogo/detalhe/carrinho; `order.updated` atualiza pedido. Eventos têm identidade estável, recurso e versão; duplicatas/antigos não regridem estado nem reaplicam efeitos; reconexão reconcilia via REST; limpar listeners/subscriptions; eventos de sessão antiga nunca alteram usuário atual.
- [ ] Cenário ponta a ponta: NFT no carrinho sofre alteração → UI informa e atualiza resumo → checkout bloqueia cotação antiga. Queda com pedido pendente → reconexão/refresh recupera estado sem segunda compra; estados confirmados/recusados são terminais.

## Interface e acessibilidade

- [ ] Implementar frames desktop/mobile do Figma, desktop/tablet/mobile, inclusive perfil, carteiras e confirmação mobile sem frame específico. Conferir larguras 390/768/1440; preservar tipografia, cores, espaçamentos, hierarquia, imagens, proporções e composição; documentar substituições de asset e ajustes de acessibilidade.
- [ ] Skeleton shimmer em catálogo, detalhe e resumo do carrinho; preservar dimensões contra CLS e respeitar movimento reduzido.
- [ ] Teclado/foco visível; foco em diálogos/drawers; semântica, labels e erros associados; alt text; contraste e estados que não dependem só de cor; feedback acessível para mutations/eventos; sem overflow indevido e sem perda de conteúdo com zoom.

## Testes, qualidade e deploy

- [ ] Playwright E2E com mocks: catálogo/URL/histórico; detalhe inexistente; cadastro/login/expiração/logout/troca; favoritos/falha/recuperação; carrinho/quantidades/remoção/cupom/persistência/login; compra/recibo/recusa/duplo clique/timeout-idempotência; perfil/avatar/senha/carteiras/validação; atualização de preço/disponibilidade Socket.IO; evento antigo/duplicado/desconexão/retomada; teclado/foco/formulários; skeleton/falha/retry.
- [ ] Cada teste inicia isolado; controlar relógio/latência/eventos sensíveis ao tempo; observar UI e resultado; REST por handlers MSW e tempo real por socket.io-client. Chromium desktop/mobile; visual regressão de início/detalhe/carrinho/pagamento com baselines versionadas; entregar relatório HTML e traces.
- [ ] Lighthouse otimizado em início e detalhe, desktop/mobile, três medições por cenário; reportar medianas: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90; reportar LCP/CLS/TBT e justificar déficits; versionar configuração, relatórios HTML/JSON, ferramentas e ambiente.
- [ ] README completo com setup, variáveis, credenciais fictícias, cenários/reset, comandos, contratos, transporte/limitações Socket.IO/MSW, cache/retries e fluxos de falha. Código, lockfile, assets, mocks, fixtures, testes e configs entregues.
- [ ] Deploy obrigatório (Vercel recomendado; Netlify/Cloudflare Pages aceitos), URL pública acessível, mocks e tempo real funcionais, rota direta e refresh operacionais; versão publicada corresponde ao código entregue.
