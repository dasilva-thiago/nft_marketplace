# Plano de conclusão do desafio técnico

## Fonte e escopo

Fonte normativa consultada em 31/10/2026: [README oficial do frontend challenge](https://github.com/junglegaming/frontend-challenge/blob/main/README.md), clonado para leitura em `/tmp/frontend-challenge/README.md`. O Figma fornecido no enunciado é a fonte de composição visual; o README define os comportamentos e critérios de avaliação.

O desafio cobre início, detalhe do NFT, carrinho, pagamento/recibo, login, cadastro, perfil e carteiras, desktop/mobile. APIs, sessão, carteiras, pagamentos e tempo real são simulados localmente. Não implementar páginas ou fluxos independentes de conteúdo editorial, suporte, atividade, ofertas ou downloads; blockchain, extensões reais de carteira e gateways de pagamento também estão fora do escopo.

## Baseline de auditoria e estado atual

A suíte original passou com 72/72 após a compactação inicial do hero mobile. A implementação foi ampliada desde então; a última execução completa de Playwright passou em 110 execuções Chromium desktop/mobile: 104 aprovadas e 6 skips intencionais por viewport, sem falhas. Oito baselines visuais versionadas cobrem início, detalhe, carrinho e pagamento em desktop/mobile; o reporter HTML local é salvo em `playwright-report/`.

| Frente               | Estado atual                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado MSW e pedidos | Implementado: reset, persistência, isolamento por usuário, revalidação da cotação, consumo idempotente do carrinho e estados terminais; coberto por E2E.                   |
| Compra e carrinho    | Implementado: seleção de carteiras, conexão simulada, recálculo/revisão, recuperação de timeout pela mesma chave e preservação seletiva dos itens; coberto por E2E.        |
| Realtime/cache       | Implementado: eventos versionados, descarte de eventos antigos, reconciliação após reconnect e limpeza de estado privado; coberto por E2E.                                 |
| Visual               | Baselines de quatro fluxos existem nos dois viewports; permanece a comparação fina de todos os frames e o ajuste de tipografia, proporções e espaçamentos em 390/768/1440. |
| Acessibilidade       | Foco/modal, campos, landmarks e contrastes representativos têm cobertura; resta a revisão manual global de zoom/reflow e feedback de eventos.                              |
| Playwright           | Cobertura desktop/mobile; execução integral final sem falhas: 104 aprovados e 6 skips por viewport.                                                                        |
| Documentação/scripts | `ARCHITECTURE.md`, handoff, comandos de lint/preview, configs Lighthouse e fallback de Vercel estão presentes; README/backlog registram resultados e pendências.           |
| Lighthouse           | Matriz tripla concluída: 12 relatórios HTML/JSON e medianas em `reports/lighthouse/summary.md`; Performance ainda fica abaixo de 90 nos quatro cenários.                   |
| Deploy               | `vercel.json` prepara build demo com MSW e fallback SPA; publicar e validar uma URL pública requer autorização/acesso à conta do provedor.                                 |

## Medianas Lighthouse finais

Execução de 31/10/2026, build de produção com MSW default, três rodadas por rota/perfil. Accessibility (100%), Best Practices (96% mobile/100% desktop) e SEO (100%) atendem às metas. Performance não alcança a meta 90; o déficit está documentado e nenhuma assertion/threshold foi reduzida.

| Perfil  | Rota                   | Performance | Accessibility | Best Practices |  SEO |     LCP |   CLS |    TBT |
| ------- | ---------------------- | ----------: | ------------: | -------------: | ---: | ------: | ----: | -----: |
| mobile  | `/`                    |         84% |          100% |            96% | 100% | 3576 ms | 0.000 | 195 ms |
| mobile  | `/nft/emerald-ape-042` |         83% |          100% |            96% | 100% | 3777 ms | 0.013 | 162 ms |
| desktop | `/`                    |         61% |          100% |           100% | 100% | 3352 ms | 0.006 | 203 ms |
| desktop | `/nft/emerald-ape-042` |         64% |          100% |           100% | 100% | 3338 ms | 0.009 | 170 ms |

Os LHR medianos registram FCP de aproximadamente 2,3–2,5 s e indicam requests LCP não descobertos no HTML inicial, custo de script-evaluation/layout, cerca de 116–119 KiB de JavaScript não usado, 10–13 KiB de CSS não usado, CSS bloqueante com economia estimada de 150–300 ms e imagens potencialmente acima do tamanho necessário (45–196 KiB conforme cenário). Os assets responsivos 320/480/640/1200 já foram gerados, mas não removeram o custo dominante de FCP/LCP. O detalhamento e as versões do ambiente estão no resumo e nos relatórios individuais.

## Regra de conclusão

Só marcar uma etapa concluída quando houver código/documentação necessária e evidência de validação executada. Listagem de testes não equivale a execução; asserts existentes não comprovam execução; configuração Lighthouse não equivale a relatório; build local não equivale a deploy. Registrar bloqueios de provedor/conta separadamente.

## Auditoria visual preliminar das telas

Fontes: README oficial do desafio (`https://github.com/junglegaming/frontend-challenge/blob/main/README.md`) e frames compartilhados em `/home/ubuntu/projects/nft-marketplace-7fe390ea/`. Em 31/10/2026, capturas full-page da aplicação no MSW `default` foram geradas em 1440×1100 e 390×844 para início, detalhe, carrinho, pagamento, login e cadastro. Uma análise comparativa por tela apontou as diferenças abaixo; os apontamentos são evidências de triagem, não ordens de implementação. Toda mudança deve ser confirmada no frame, no código e nos critérios do README.

| Tela      | Diferença preliminar a confirmar                                                                                                                                                                                | Escopo                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Início    | Quebra do título do hero no desktop; proporção/chamada do hero no mobile; cabeçalho de resultados ocupa espaço antes dos filtros/cards. A composição mobile foi compactada, mas a fidelidade fina segue aberta. | Tela obrigatória; preservar seções que aparecem no frame, sem novas páginas editoriais.                                      |
| Detalhe   | Captura usa valores/atributos diferentes dos exibidos no frame; fixture possui apenas uma imagem de galeria; controles de navegação no mobile podem divergir.                                                   | Tela obrigatória; validar catálogo/edição/estoque e não alterar dados sem checar efeitos nos testes.                         |
| Carrinho  | A captura foi semeada com dois itens e a referência apresenta mais; totais resultam de dados diferentes. Há oportunidades de revisar densidade das linhas no mobile.                                            | Estado mock e composição de compra; manter precisão, cotação API e itens rastreáveis.                                        |
| Pagamento | A versão mobile foi ajustada para priorizar carteiras, rede, total e CTA; captura desktop usa sessão/quote do mock, ainda a conferir com os frames.                                                             | Fluxo obrigatório; preservar validação do formulário desktop e não mostrar carteira conectada sem ação simulada.             |
| Login     | Login/cadastro desktop usam diálogos sobre a home real; mobile tem telas dedicadas e senha visível por controle nomeado.                                                                                        | Interações, foco e validações estão cobertos por E2E; permanecem diferenças finas de proporção/rótulos a comparar com Figma. |
| Cadastro  | Modal desktop tem proporção/rótulos diferentes; confirmação de senha agora é validada no cliente e coberta por teste.                                                                                           | Fluxo obrigatório; manter cadastro mock, retorno seguro e erros associados.                                                  |

Os assets de produto disponíveis no checkout são somente `public/assets/monkey1.webp`–`monkey4.webp` e um placeholder genérico; as imagens de frame não devem ser incorporadas como assets do produto. Nenhum dado ou item foi alterado apenas para tornar capturas visualmente idênticas: mudanças de fixture precisam preservar contratos, demonstração e testes.
