# Esforço extra: segurança e validação

## Escopo do desafio

Este repositório é uma aplicação frontend em React/Vite, e o enunciado pede APIs simuladas na camada de rede usando MSW. Não há backend Express ou serviço de autenticação real. Portanto, os recursos abaixo são classificados explicitamente como validação da demonstração ou requisitos de uma futura implantação com backend; não afirmar que um mock de navegador protege uma API pública.

## O que vamos implementar nesta etapa

| Controle | Na aplicação de demonstração | O que seria necessário para proteção real |
|---|---|---|
| Zod | Validar parâmetros de busca, bodies de entrada do MSW e respostas recebidas pelo cliente. Exibir erros úteis e não propagar dados malformados para a UI. | Validar novamente no servidor; validação do browser pode ser contornada. |
| Rate limit | Cenário determinístico do MSW que devolve HTTP 429 e testa feedback/retry respeitando `Retry-After`. É uma simulação do comportamento da tela. | Contador em servidor/gateway, por usuário/IP e rota, compartilhado entre instâncias; limites monitorados. |
| Helmet / headers | Documentar cabeçalhos de segurança do host e configurar headers estáticos no ambiente de deploy quando definido. A aplicação Vite não instancia Express/Helmet. | Middleware Helmet em servidor HTTP real e CSP ajustada aos assets, scripts, conexões e fontes usados. |
| JWT | Não criar nem assinar JWT no browser. Fixtures podem simular sessão válida, inválida e expirada, sem guardar senha/token real. | Backend assina e verifica tokens, limita issuer/audience/expiração/algoritmo, roda TLS e faz rotação de chaves. Segredo nunca entra no bundle Vite. |
| Cookie `HttpOnly` | Documentar como requisito de arquitetura, mas não declarar um cookie de MSW ou `document.cookie` como proteção HttpOnly. | Somente o servidor pode emitir `Set-Cookie` com `HttpOnly; Secure; SameSite=...`; definir renovação, CSRF e logout no servidor. |

## Regras de implementação

1. Zod é validação em runtime e fonte de diagnóstico, não autorização. Tipos TypeScript desaparecem em runtime; por isso parse de resposta/entrada deve ser explícito.
2. Rejeitar dados inválidos na borda da API e devolver formato de erro tipado, sem stack trace, token ou segredo na UI.
3. `RATE_LIMITED` (`429`) deve ser reproduzível no MSW, comunicar espera e não repetir mutations automaticamente. Pode haver retry de consulta idempotente apenas depois de `Retry-After`.
4. Não colocar chaves JWT, credenciais reais nem segredos em `.env` com prefixo `VITE_` — essas variáveis são publicadas no bundle.
5. Não armazenar senha, refresh token ou segredo de autenticação no `localStorage`. O mock usa identidade/estado fictícios e resetáveis.
6. Se o projeto vier a receber backend real fora do desafio, revisar autenticação, autorização por recurso e usuário, rate limit, CSRF/CORS, política de cookies, CSP/Helmet e tratamento de segredo como trabalho de servidor separado.

## Estado

- Implementado nesta fatia: schemas Zod para parâmetros, fixtures e respostas do catálogo; cenário selecionável `rate-limited` com resposta HTTP 429 e `Retry-After`; teste de integração que confirma 429 e reset do cenário.
- Ainda não implementado: aplicar schemas Zod a todos os recursos, mostrar UI/retry para 429, headers estáticos de produção e backend real.
- JWT real, Helmet middleware e cookie HttpOnly só podem ser marcados como concluídos com servidor que os implemente; não contam como implementados pelo frontend/MSW.
