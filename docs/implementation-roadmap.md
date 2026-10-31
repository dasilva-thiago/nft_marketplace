# Roteiro de implementação — NFT Marketplace

Este roteiro segue o enunciado do desafio. O Figma define a apresentação; o enunciado define comportamentos, APIs, falhas, testes, qualidade e entrega. Não adicionar blockchain, extensões de carteira, gateways de pagamento ou páginas editoriais: estão fora do escopo. Não considerar uma rota, mock ou tela estática como funcionalidade concluída.

## Princípios que não podem ser flexibilizados

- Implementar as tecnologias obrigatórias de forma efetiva: React, TypeScript, TanStack Router, TanStack Query, Axios, REST, Socket.IO, Tailwind CSS, shadcn/ui, MSW, Playwright e Lighthouse.
- Não simular negócio em componente, hook de UI, cliente Axios ou setter de cache. Respostas e estado de simulação pertencem à camada de rede/MSW; o tempo real deve percorrer `socket.io-client` e o binding Socket.IO/MSW.
- Tipar o fluxo completo: transporte → API → query/mutation → view. Paginação e estado de busca/filtros ficam na URL. Dados privados e queries são isolados por usuário.
- Valores ETH trafegam como strings decimais e usam aritmética de precisão arbitrária. Quantidades são inteiros. A cotação da API é a referência para o pedido.
- Compra só pode ser mostrada como confirmada após confirmação efetiva do mock. Preserve itens em falhas e remova após sucesso somente os itens/quantidades comprados. Recibo é snapshot imutável.
- Cada mudança de domínio precisa cobrir carregando, vazio, erro, sucesso e recuperação. Mutations de pedido são idempotentes. Eventos duplicados/antigos não podem reaplicar efeitos ou regredir estado.
- Testes devem começar isolados, controlar latência/relógio/eventos quando necessário, operar pela interface e verificar efeitos. Teste REST via MSW e tempo real via Socket.IO client real.
- O deploy só vem depois da validação. A versão publicada deve ser a mesma do código avaliado; as rotas precisam funcionar em acesso direto e refresh.

## Fase 0 — preservar e compreender a base

1. Trabalhe em branch de feature (ou branch de trabalho), não direto em `main`. Antes de começar, `git status` deve estar limpo; sincronize a branch com `origin/main`.
2. Leia o enunciado e compare cada requisito com `TODO.md`; inspecione os frames desktop/mobile do Figma, assets exportados e `docs/architecture.md`.
3. Instale e verifique a base:

   ```bash
   pnpm install
   cp .env.example .env.local
   pnpm mocks:init
   pnpm typecheck
   pnpm build
   pnpm test:e2e
   ```

4. Se `mockServiceWorker.js` já estiver versionado, não o regenere sem necessidade. Preserve o estado inicial: os smoke tests validam apenas o scaffold e não provam os fluxos do desafio.
5. Registre inventário de telas e assets e abra uma issue/PR por módulo. Marque requisitos como prontos somente quando houver código e evidência de teste.

**Saída/gate:** instalação limpa reproduzível; typecheck, build e smoke passam; nenhuma mudança no escopo. Layouts-base referenciados para desktop/mobile e assets faltantes identificados.

## Fase 1 — contratos, fixtures e servidor simulado

Faça os contratos antes das telas para que todos os módulos consumam o mesmo comportamento.

1. Complemente `src/shared/api/contracts.ts` com schemas/respostas e erros tipados para todos os recursos. Defina códigos de erro, status HTTP, campos obrigatórios, parâmetros de paginação/filtro/ordenação e exemplos de sucesso/falha.
2. Documente os contratos em `docs/api-contracts.md`: sessão/conta (registro, login, sessão, logout, expiração); NFTs (lista/detalhe); favoritos (ler/adicionar/remover); carrinho (ler/adicionar/alterar/remover); cotação (cupom, estoque, desconto, taxas e total); pedidos (criar idempotente/consultar estado e recibo); perfil (ler/editar/avatar/senha); carteiras (ler/criar/editar).
3. Construa um estado de domínio comum no MSW. Use dados determinísticos e pelo menos dois usuários separados. Persista o necessário para refresh, sem senha em claro. Implemente reset completo para um cenário conhecido; teste que nenhuma conta herda dados de outra.
4. Provisione fixtures suficientes para busca/filtros/paginação e todos os resultados: sucesso, vazio, lenta/latência variável, resposta fora de ordem, desconexão, 4xx/5xx, sessão expirada/sem autorização, conflito de cadastro/validação, cupom inválido/expirado, preço alterado/edição esgotada, timeout após pedido criado, pagamento confirmado e recusado.
5. Mantenha os mocks opt-in por configuração em desenvolvimento, teste e build de demonstração. Evite fallback de negócio no app quando MSW estiver desligado.
6. Implemente endpoints REST para cada operação e verifique a camada de transporte. Configurar simulação de falha sem dependência de chamadas reais externas.

**Gate:** testes de contrato/handlers demonstram persistência e reset; mudança de usuário isola recursos; falhas e respostas esperadas são reproduzíveis; Axios não contém branch de resposta fictícia.

## Fase 2 — plataforma de estado, sessão e rotas

1. Declare rotas previstas no TanStack Router: início, detalhe NFT, carrinho, checkout, pedido/recibo, login, cadastro, perfil e carteiras. Fallback 404 é diferente de NFT/pedido não encontrado. Cada página deve funcionar por URL direta e refresh.
2. Crie layouts compartilhados e componentes shadcn/ui acessíveis adaptados aos tokens do Figma. Estabeleça semântica, foco visível, estados disabled/loading/error e controles responsivos antes de multiplicar componentes.
3. Crie a API Axios por domínio; passe `AbortSignal` nas consultas. Defina query keys serializáveis por todos os parâmetros; recursos privados incluem identidade do usuário.
4. Documente cache, `staleTime`, retries, invalidação, sincronização e cancelamento. Retry apenas para queries seguras e erros transitórios; não repetir automaticamente mutations financeiras/compra.
5. Implemente serviço de sessão recuperável após refresh, login, cadastro, consulta da sessão, logout e expiração. Rotas privadas retornam ao destino original depois do login.
6. No logout, expiração ou troca de usuário, limpar todas as queries privadas e liberar listeners/subscriptions antes de carregar a nova identidade. Formulários exibem erros API junto aos campos e não gravam senhas em claro.

**Gate:** sessão e navegação protegida são testadas em refresh, expiração, login/logout/troca; nenhuma query privada é visível entre usuários; query obsoleta é cancelada ou ignorada; retorno do login preserva destino.

## Fase 3 — descoberta e catálogo

1. Implemente home com destaques e catálogo conforme o Figma; filtros, busca, ordenação e paginação consultam os endpoints definidos, não arrays locais de produção.
2. Serialize estado de busca/filtros combináveis/ordenação/página na URL. Atualizar filtro reinicia página; refresh recupera estado; Back/Forward restaura estado e resultado; a API recebe os mesmos valores da URL.
3. Trate skeleton com shimmer (geometria reservada), vazio, falha/retry, carregamento em background e resposta fora de ordem. Cancelar queries antigas quando parâmetros mudarem.
4. Implemente navegação ao detalhe e estados de item inexistente, indisponível e erro.
5. Use assets/fontes NFT do arquivo quando estiverem disponíveis; não use a prancha de tela inteira como asset da UI. Documente substituições necessárias.

**Gate:** teste E2E cobre busca, filtros combinados, ordenação, paginação, refresh/histórico, vazio/falha/resposta obsoleta; comparação visual de home desktop/mobile com Figma.

## Fase 4 — detalhe e favoritos

1. Implemente detalhe NFT com galeria, informação, edição, quantidade, disponibilidade, favorito e ação de adicionar ao carrinho. Acesso direto e refresh funcionam.
2. Quantidade deve respeitar estoque e edição disponível. Item inexistente e edição indisponível têm estados distintos.
3. Favoritos exigem sessão, persistem por usuário e atualizam interface. Escolha uma mutation otimista (favorito é apropriado): atualize temporariamente; reverta ao falhar; informe falha acessivelmente.
4. Invalide/refresque catálogo e detalhe somente nos recursos afetados.

**Gate:** E2E de detalhe direto/inexistente/limites e favoritos sucesso, falha e rollback; nenhum favorito cruza usuários.

## Fase 5 — carrinho e dinheiro

1. Implemente leitura/inclusão/alteração/remoção do carrinho por API. Garanta quantidade inteira, estoque por NFT e edição, e erros de conflito.
2. Persistir carrinho no refresh. Ao autenticar, preservar/mesclar carrinho visitante sem perder itens nem duplicar quantidades.
3. Cupom aplica/remove por mutation da API e cobre inválido/expirado. Exibir subtotal, desconto, taxa de rede e total derivados da cotação retornada pelo serviço; não recalcular uma autoridade paralela na UI.
4. Faça aritmética ETH com decimal de precisão arbitrária (`big.js` já configurado), valores sempre string no transporte/cache/persistência; só formatar para exibir. Nunca calcular por `Number`/float.
5. Reaja a alterações de preço/estoque recebidas em tempo real: avisar, atualizar itens/resumo e marcar cotação vencida. Preservar dimensões do resumo durante skeleton/loading.

**Gate:** E2E quantidades/remoção/cupom/refresh/login; cálculo de exibição confrontado com cotação API; estados inválido/expirado/estoque e carrinho sem perda.

## Fase 6 — checkout, pedido e confirmação

1. Proteja checkout por sessão. Implemente campos previstos no layout, validação associada aos inputs, seleção de carteira e rede, revisão explícita e estados de conexão/recusa/desconexão simulados.
2. No envio, peça nova cotação/valide preço, disponibilidade, cupom e taxas. Se mudou, mostrar diferença e exigir nova confirmação do usuário; nunca confirmar com cotação anterior.
3. Cada tentativa gera chave de idempotência. Mesma chave/conteúdo recupera mesmo pedido; mesma chave/conteúdo diferente é conflito. Desabilitar/reentrância no duplo clique. Após timeout, consultar pedido/chave existente — não criar outro.
4. Estado `pending` pode ser retomado após refresh/reconexão; `confirmed` e `rejected` são terminais. A confirmação só aparece após resposta confirmada do mock.
5. Falhas mantêm o carrinho. Sucesso remove somente as linhas/quantidades compradas. Criar recibo snapshot imutável com itens/preços/taxas/total/referência de transação/explorer simulada.

**Gate:** E2E da compra catálogo→recibo, recusa, duplo clique, timeout recuperado sem duplicata, mudança de cotação com nova confirmação, refresh com pedido pendente e snapshot imutável.

## Fase 7 — perfil e carteiras

1. Perfil protegido: leitura/edição dos campos do layout, avatar e alteração de senha. Carteiras: listar, cadastrar e editar carteiras principal/secundária, com seleção de rede.
2. Validar no cliente para feedback e no MSW para erros de servidor; apresentar erros em associação acessível. Persistir após refresh.
3. Senhas são fictícias, nunca armazenadas em texto claro; dados de cada usuário continuam isolados.
4. Se não houver frame mobile do perfil/carteiras/recibo, adaptar usando o mesmo padrão visual e documentar as decisões.

**Gate:** E2E para edição/validação/avatar/senha/carteiras e persistência em refresh; usuário A não consegue consultar/editar recursos de B.

## Fase 8 — tempo real e reconciliação

1. Estabeleça ciclo de vida Socket.IO por sessão; desregistrar listeners no unmount/logout/troca. Use `socket.io-client` real no app e na suíte.
2. Eventos `nft.updated`/`order.updated` incluem `eventId` estável, `resourceId`, `version`, horário e payload. Descartar duplicados e eventos com versão inferior ao cache; efeitos aplicados uma vez.
3. Em `nft.updated`, atualizar/inutilizar queries de catálogo/detalhe/carrinho; recalcular cotação via REST. Checkout bloqueia a cotação desatualizada até revisão.
4. `order.updated` atualiza somente o pedido certo; estados confirmados/recusados são terminais. Eventos carregados em sessão anterior jamais atualizam o cache do usuário atual.
5. Em reconexão, recuperar recursos ativos via REST; pedido pendente deve ser recuperável sem novo envio. Limpar subscriptions e reconciliar após reload.
6. Simule eventos no MSW usando o `@mswjs/socket.io-binding`, disparados pelo mesmo estado de cenário das respostas REST. Respeite a limitação do binding: WebSocket, sem presumir rooms/broadcasting ou paridade total com servidor Socket.IO. Documente transporte e limitações.
7. Complete exatamente o cenário requerido: NFT no carrinho muda preço/estoque → interface avisa/resumo atualiza → checkout bloqueia a cotação antiga; conexão cai com pedido pendente → reconectar/recarregar recupera a tentativa sem duplicar compra.

**Gate:** integração E2E verifica evento indo pelo handler MSW → protocolo do binding → `socket.io-client` → UI; testes de evento velho/duplicado, sessão antiga, reconexão, cotação bloqueada e retomada do pedido.

## Fase 9 — responsividade, acessibilidade e fidelidade

1. Compare Figma e app, tela por tela, preservando tipografia, cores, espaçamento, hierarquia, imagens, proporções e composição. Use componentes shadcn adaptados, não aparência padrão sem personalização.
2. Verifique 390 px, 768 px e 1440 px para todas as telas, com atenção a filtros, navegação, forms, carrinho e checkout; sem overflow horizontal e com conteúdo legível ao zoom.
3. Skeleton com shimmer nos dados de catálogo, detalhe e resumo de carrinho; reserve dimensões para reduzir CLS; respeite `prefers-reduced-motion`.
4. Audite teclado/foco, diálogos/drawers e retorno de foco, labels/erros, alt text, contraste, estados não dependentes só de cor e `aria-live`/status de mutations e atualizações em tempo real.
5. Documente substituição de assets e ajustes de acessibilidade em relação ao Figma. Ações externas não previstas nunca devem aparentar sucesso de uma operação implementada.

**Gate:** checklist acessível executado em todas as telas e viewports; regressão visual baseline revisada, sem diferenças não justificadas.

## Fase 10 — Playwright completo

1. Cada caso parte de estado MSW resetado; controlar relógio, latência, ordem de respostas e emissão de eventos nos casos temporais. Fixar fixtures e evitar depender de flakiness de rede.
2. Implementar a cobertura E2E prevista no enunciado: catálogo/URL/histórico; detalhe direto/inexistente; cadastro/login/expiração/logout/troca; favoritos com falha/recuperação; carrinho/quantidade/remoção/cupom/refresh/login; compra/recibo/recusa/duplo clique/timeout-idempotência; perfil/avatar/senha/carteiras/erros; alteração preço/disponibilidade em checkout via socket; evento velho/duplicado/desconexão/retomada; teclado/foco/validação; skeleton/falha/retry.
3. Executar fluxos principais em Chromium desktop e mobile. Faça regressão visual para início, detalhe, carrinho e pagamento; mantenha baselines versionadas e fixtures estáveis.
4. Asserções devem observar interface e resultado real simulado. REST passa pelos handlers MSW; socket passa pelo `socket.io-client`. Guardar relatório HTML e traces das falhas.
5. Rode os comandos após cada fase funcional:

   ```bash
   pnpm typecheck
   pnpm build
   pnpm test:e2e
   ```

**Gate:** cobertura exigida executa localmente de instalação limpa; nenhum requisito principal é apenas visual; nenhum teste consulta backend real.

## Fase 11 — Lighthouse e otimização

1. Medir `build` otimizado de produção com mocks padrão e imagens/fontes reais da entrega. Não simplificar a página só para pontuar.
2. Auditar início e detalhe NFT nos perfis mobile e desktop, três execuções para cada combinação. Registrar mediana separada das categorias Performance, Accessibility, Best Practices e SEO.
3. Metas: Performance ≥90; Accessibility ≥95; Best Practices ≥95; SEO ≥90. Registrar LCP, CLS e TBT e explicar causas de qualquer resultado abaixo da meta.
4. Versionar config e relatórios HTML/JSON, versões de Lighthouse/tooling, ambiente, dispositivo/perfil e condições de execução. Configure CI/artefatos para reproduzir. Corrija causas de CLS, imagens/fonte bloqueantes e bundle somente após medir.

**Gate:** relatório reproduzível para 2 páginas × 2 perfis × 3 medições, com medianas e análise completa.

## Fase 12 — documentação, revisão e deploy

1. Complete o `README.md` para outro desenvolvedor conseguir reproduzir: requisitos/instalação, variáveis, credenciais fictícias, seleção/reset de cenários, comandos, como reproduzir cada falha, contratos, política de cache/retry, limitações do socket, testes, Lighthouse e build/deploy.
2. Entregue código, lockfile, assets/fontes, mocks/fixtures, testes, configuração de auditoria, relatórios pedidos e URLs do repositório/deploy. Remova dados pessoais/segredos e arquivos de build/relatórios locais não requeridos.
3. Antes do release: revise diff, typecheck/build/E2E, `git status`, dependências e checks; integre por PR sem sobrescrever mudanças de terceiros.
4. Publique em Vercel (recomendado), Netlify ou Cloudflare Pages. Configure fallback para SPA para rotas diretas; faça o build público usar os mocks e fluxo de tempo real com o limite documentado; valide refresh de cada tela e disponibilidade pública.
5. Confirme que a URL publicada corresponde ao SHA avaliado e que mocks, compra simulada e tempo real estão funcionais. Entregue link do repo e URL pública, não apenas capturas.

**Gate final:** repositório, lockfile, assets, mocks, fixtures, testes, auditoria e deploy públicos/reproduzíveis; telas e fluxos principais funcionais; nenhum critério eliminatório violado.

## Ordem recomendada de PRs

1. Contratos + estado base de MSW + reset/fixtures.
2. APIs e sessão/isolamento.
3. Shell/rotas e catálogo URL-driven.
4. Detalhe/favoritos.
5. Carrinho/cotação ETH.
6. Checkout/idempotência/recibo.
7. Perfil/carteiras.
8. Socket.IO + integração de cenários + recuperação.
9. Acessibilidade/responsividade/regressão visual.
10. Cobertura E2E total + Lighthouse + documentação + deploy.

Cada PR deve atualizar `TODO.md`, acrescentar testes da fatia entregue e manter build/testes anteriores verdes. Não paralelize duas fatias que alterem o mesmo contrato/estado; coordene essas mudanças primeiro.
