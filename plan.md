# Plano da fatia — sessão e segurança simulada

## Escopo aprovado

Implementar a sessão e a conta mínima exigidas pelo desafio, usando MSW como servidor simulado e mantendo o frontend sem segredos de autenticação. A fatia cobre cadastro, login, consulta de sessão, logout, expiração determinística, dois usuários fictícios isolados, proteção inicial dos fluxos privados e validação Zod na borda do mock e no cliente Axios.

## Nova fatia aprovada — reprodução visual das telas

As referências visuais do Figma são a fonte primária de design. A implementação deve reproduzir composição, hierarquia, tipografia, cores, bordas, espaçamentos, proporções, imagens, estados e navegação sem criar uma direção visual alternativa. Cada correção necessária para acessibilidade, responsividade, conteúdo ou comportamento será registrada em `docs/architecture.md` com o motivo.

### Matriz de referência visual

| Fluxo          | Desktop                   | Mobile                       | Estado da referência                                   |
| -------------- | ------------------------- | ---------------------------- | ------------------------------------------------------ |
| Início         | `desktop-inicio.png`      | `mobile-inicio.png`          | referência visual definida                             |
| Login          | `desktop-login.png`       | `mobile-login.png`           | desktop em modal sobre a home; mobile em tela dedicada |
| Cadastro       | `desktop-cadastro.png`    | `mobile-cadastro.png`        | desktop em modal sobre a home; mobile em tela dedicada |
| Detalhe do NFT | `desktop-detalhes.png`    | `mobile-detalhes-do-nft.png` | referência visual definida                             |
| Carrinho       | `desktop-carrinho.png`    | `mobile-carrinho.png`        | referência visual definida                             |
| Pagamento      | `desktop-pagamento.png`   | `mobile-pagamento.png`       | referência visual definida                             |
| Confirmação    | `desktop-confirmacao.png` | —                            | referência mobile ausente                              |
| Perfil         | `desktop-perfil.png`      | —                            | referência mobile ausente                              |
| Carteiras      | `desktop-carteiras.png`   | —                            | referência mobile ausente                              |

As versões desktop e as seis telas com referência mobile foram reproduzidas primeiro. Para confirmação, perfil e carteiras mobile, que não possuem frame correspondente no Figma disponível, foi feita uma adaptação responsiva conservadora da composição desktop, preservando a mesma paleta, tipografia, espaçamento, hierarquia e componentes. A decisão e as diferenças inevitáveis estão registradas em `docs/architecture.md`.

### Direção visual aprovada pela referência

- Estética editorial de galeria NFT: fundo marrom quase preto, painéis chocolate, acentos âmbar/laranja e tipografia monoespaçada nos títulos e valores.
- Desktop: navegação superior compacta, conteúdo em colunas, cards de imagem com cantos arredondados, sidebar de filtros/formulários e rodapé editorial.
- Mobile: shell escuro com cantos amplos, navegação inferior fixa na home, cartões empilhados ou em grade de duas colunas, CTA de compra fixado dentro do fluxo e cabeçalhos compactos.
- Elementos de demonstração do screenshot que não são produto, como linhas pontilhadas azuis, títulos “Desktop / Mobile” e marcações de exportação, não entram na aplicação.

## Abordagem de implementação

1. **Contratos e schemas**
   - Expandir schemas Zod para `Session`, `UserSummary`, `RegisterRequest` e `LoginRequest`.
   - Adicionar schemas de respostas e de erros para rejeitar payloads inválidos no cliente.
   - Manter senhas fora de todas as respostas e fora de `localStorage`/`sessionStorage`.

2. **Estado compartilhado do MSW**
   - Criar fixtures determinísticas para pelo menos dois usuários.
   - Guardar somente um hash/digest de demonstração ou uma representação não reversível para credenciais do mock; nunca retornar senha.
   - Controlar a sessão por um handle de demonstração enviado em header e expiração configurável/testável.
   - Manter estado privado por usuário e resetar integralmente no endpoint de reset.
   - Adicionar cenários determinísticos para sessão expirada, credencial inválida, conflito de cadastro, validação e rate limit de leitura.

3. **Handlers REST**
   - Implementar `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/session` e `POST /api/auth/logout`.
   - Validar body com Zod antes da regra de negócio.
   - Responder erros no envelope tipado, sem stack trace, senha, token secreto ou dados de outro usuário.

4. **Cliente Axios e camada de domínio**
   - Criar `authApi` com chamadas Axios, `withCredentials` e parse Zod das respostas.
   - Criar query de sessão e mutations de login, cadastro e logout.
   - Mapear erros da API para mensagens de formulário sem repetir mutations automaticamente.
   - Configurar política de retry somente para queries seguras e erros transitórios.

5. **Estado da aplicação e rotas**
   - Criar um `SessionProvider`/hook de sessão apoiado pela query `session`.
   - Criar telas de login e cadastro no padrão visual KURIO existente, com labels, erros associados e feedback acessível.
   - Preservar `returnTo` ao exigir autenticação, sem declarar checkout/perfil/carteiras como implementados antes das próximas fatias.
   - Exibir o estado autenticado no cabeçalho e permitir logout; o cabeçalho não inventará dados de usuário.

6. **Testes**
   - Testar contratos e handlers de sucesso, erro de credencial, conflito, validação, sessão ausente/expirada e logout.
   - Testar pela interface login, cadastro, refresh da sessão, logout, expiração e retorno ao destino.
   - Provar isolamento entre os dois usuários e ausência de senha nas respostas/armazenamento do navegador.
   - Manter os testes de catálogo e Socket.IO existentes.

7. **Documentação**
   - Atualizar `docs/api-contracts.md`, `docs/architecture.md`, `README.md` e `TODO.md` com os comportamentos realmente implementados.

## Estrutura prevista

```text
src/
  features/auth/
    api/auth-api.ts          # chamadas Axios e parse dos contratos
    queries.ts               # query/mutations de sessão
    routes/login-page.tsx    # formulário de login
    routes/register-page.tsx # formulário de cadastro
  mocks/
    fixtures/users.ts        # credenciais fictícias sem senha exposta
    scenarios/scenario-state.ts
    handlers.ts              # endpoints REST da sessão
  shared/api/
    contracts.ts             # contratos de transporte
    schemas.ts               # validação Zod
  shared/session/
    mock-session.ts          # handle exclusivo do mock no sessionStorage
```

## Design aprovado

### Direção visual

A fatia reutiliza a identidade KURIO já presente: estética editorial dark de galeria digital, com base marrom quase preta, acentos âmbar e composição compacta. Não serão introduzidos gradientes, imagens, páginas ou componentes fora do padrão existente.

### Princípios

- Formulários compactos e legíveis, com foco claro e mensagens de erro próximas ao campo.
- Contraste alto entre texto, fundo e ação primária.
- Estado de carregamento explícito, sem deslocar a estrutura do formulário.
- Feedback de sessão e logout anunciado por `aria-live`, não apenas por cor.

### Tipografia e voz

Reutilizar `Space Grotesk`/`DM Mono` e os tokens CSS atuais. Os textos serão diretos e técnicos no tom da marca, por exemplo: “Acesse sua coleção” e “Confira os campos destacados antes de continuar.”

### Interação e acessibilidade

Todos os campos terão `label`, `autocomplete`, `required`, mensagens associadas por `aria-describedby` e estado inválido expresso por `aria-invalid`. O submit será desabilitado durante a mutation, o foco permanecerá visível e o erro global usará `role="alert"`. A preferência `prefers-reduced-motion` existente será preservada.

## Critérios de saída desta fatia

A fatia só será considerada concluída quando os handlers, APIs Axios, schemas, telas, proteção/retorno, isolamento por usuário, documentação e testes estiverem presentes e as verificações `pnpm typecheck`, `pnpm build` e `pnpm test:e2e` forem executadas com resultado verdadeiro. Falhas ambientais serão reportadas separadamente e não serão convertidas em sucesso.

## Saída da rodada visual

- Telas conectadas: início, login, cadastro, detalhe, carrinho, pagamento, confirmação, perfil e carteiras.
- Evidência visual: capturas reais conferidas em 390 px e 1440 px; a largura 768 px continua como próxima validação de regressão.
- Evidência automatizada: `pnpm typecheck` passou; `pnpm build` passou; `pnpm test:e2e` passou com 30/30 testes.
- Limitações mantidas de propósito: fontes exportadas do Figma não estão disponíveis; os quatro assets de macacos são reutilizados nos fixtures para manter a unidade visual, enquanto carrinho, pagamento, pedido, perfil e carteiras ainda são composição visual e não têm handlers de domínio concluídos.

## Nova fatia aprovada — home e listagem de NFTs

Esta é a próxima fatia autorizada. A referência primária é `desktop-inicio.png`/`mobile-inicio.png`, com validação adicional em 768 px. A home deve conter hero, busca, filtros, ordenação, paginação, cards, destaque, lançamentos/diário e footer; a listagem deve consultar somente o endpoint REST tipado, manter filtros combináveis/ordenação/página na URL e preservar Back/Forward/refresh.

Não serão inventados assets de NFT: os quatro arquivos disponíveis são reutilizados de forma determinística nos fixtures, sem gerar ou alterar pixels. Não serão adicionados filtros ou regras de negócio que não existam nos contratos; quando a referência visual mostrar um controle sem contrato funcional, ele deverá permanecer claramente demonstrativo ou ser documentado como pendência, nunca simular sucesso.

### Critérios de saída desta fatia

- A composição de home/listagem reproduz as referências visuais em 390/768/1440 px sem usar a prancha inteira como asset.
- Busca, coleção, rede/traits quando suportados pelos contratos, ordenação e paginação são serializados na URL; alterar um filtro retorna à página 1.
- Estados pending/skeleton, vazio, erro com retry e carregamento em background são preservados.
- Os testes E2E cobrem filtros combinados, refresh, Back/Forward, paginação, vazio, erro/429 e resposta fora de ordem.

## Nova rodada — fidelidade da home à referência reenviada

A nova referência da home passa a ser a fonte visual de maior prioridade para esta rodada. Ela mostra uma composição editorial compacta: hero com o macaco verde em destaque, cabeçalho estreito, catálogo em três colunas com sidebar de filtros, card "NFT em destaque" abaixo da sidebar, duas faixas editoriais, diário de cunhagem em quatro cards e footer dividido em benefícios, newsletter e links. A implementação deve corrigir a composição atual sem transformar a screenshot em asset.

Os dados de catálogo continuam vindo dos contratos existentes. Para a cena default, a imagem hero usará o NFT `Emerald Ape #042`, o card de oferta limitada usará `Desert Ape #117` e as faixas editoriais priorizarão a coleção `Neo Apes`; busca, filtros, paginação e os testes que dependem das demais coleções continuam preservados.

## Atualização — assets reais de macacos

O repositório contém quatro assets em `public/assets/monkey1.webp` até `public/assets/monkey4.webp`. Eles foram integrados aos fixtures de todas as coleções visíveis, com reutilização determinística e sem alterar ids, nomes, preços, redes, traits ou contratos. Como todos os componentes de home, listagem, detalhe, carrinho e pedido consomem `imageUrl`/`gallery` dos contratos, a substituição se propaga para essas telas sem duplicar lógica de apresentação.
