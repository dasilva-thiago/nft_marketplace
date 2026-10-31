# Plano da fatia — sessão e segurança simulada

## Escopo aprovado

Implementar a sessão e a conta mínima exigidas pelo desafio, usando MSW como servidor simulado e mantendo o frontend sem segredos de autenticação. A fatia cobre cadastro, login, consulta de sessão, logout, expiração determinística, dois usuários fictícios isolados, proteção inicial dos fluxos privados e validação Zod na borda do mock e no cliente Axios.

O escopo não inclui criar um backend real neste momento. JWT assinado, cookie `HttpOnly`, Helmet middleware e rate limit efetivo pertencem a um servidor/host real e serão documentados como próximos requisitos, sem simular uma garantia de segurança dentro do bundle Vite.

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
   - Emitir apenas um identificador de sessão fictício em header de demonstração; a documentação explicará que MSW/browser não transforma esse handle em cookie `HttpOnly` real.
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
   - Atualizar `docs/api-contracts.md`, `docs/architecture.md`, `docs/security-hardening.md`, `README.md` e `TODO.md` com os comportamentos realmente implementados.
   - Registrar que `429` é uma simulação de UX/teste e que o rate limit de produção deve existir no servidor/gateway.
   - Registrar o desenho de migração para JWT assinado no servidor e cookie `HttpOnly; Secure; SameSite`, sem marcar esses controles como implementados.

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
