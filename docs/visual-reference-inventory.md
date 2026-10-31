# Inventário visual de referência

As referências visuais do Figma são usadas como fonte de implementação, mas não são assets de produto e não devem ser renderizadas como uma imagem única dentro da aplicação.

## Arquivos de referência

| Arquivo                      |   Dimensão | Fluxo                 | Plataforma    |
| ---------------------------- | ---------: | --------------------- | ------------- |
| `desktop-inicio.png`         | 448 × 1109 | Início                | Desktop       |
| `desktop-login.png`          |  462 × 656 | Login                 | Desktop/modal |
| `desktop-cadastro.png`       |  734 × 977 | Cadastro              | Desktop/modal |
| `desktop-detalhes.png`       | 736 × 1116 | Detalhe do NFT        | Desktop       |
| `desktop-carrinho.png`       |  728 × 835 | Carrinho              | Desktop       |
| `desktop-carteiras.png`      |  784 × 598 | Carteiras             | Desktop       |
| `desktop-confirmacao.png`    |  750 × 844 | Confirmação de pedido | Desktop/modal |
| `desktop-pagamento.png`      |  713 × 818 | Pagamento             | Desktop       |
| `desktop-perfil.png`         |  731 × 632 | Perfil                | Desktop       |
| `mobile-inicio.png`          |  512 × 965 | Início                | Mobile        |
| `mobile-login.png`           |  509 × 978 | Login                 | Mobile        |
| `mobile-cadastro.png`        |  512 × 987 | Cadastro              | Mobile        |
| `mobile-detalhes-do-nft.png` |  512 × 970 | Detalhe do NFT        | Mobile        |
| `mobile-carrinho.png`        |  521 × 972 | Carrinho              | Mobile        |
| `mobile-pagamento.png`       |  519 × 971 | Pagamento             | Mobile        |

## Observações visuais

- A paleta é escura, com base marrom/preta, painéis chocolate e acentos âmbar/laranja.
- A tipografia dos títulos, valores e rótulos tem aparência monoespaçada e deve respeitar os tokens/fontes do projeto quando disponíveis.
- As referências desktop de login e cadastro mostram um modal sobre a home; as referências mobile mostram telas dedicadas com marca KURIO centralizada.
- A home mobile usa navegação inferior fixa, busca no topo, botão de filtros, hero compacto e grade de duas colunas.
- O detalhe mobile transforma a galeria desktop em uma imagem principal, metadados, quantidade, preço e CTA de compra em um painel vertical.
- O carrinho mobile usa linhas em cartões horizontais, resumo financeiro e CTA de checkout no fim do shell.
- O pagamento mobile usa seleção de carteira/rede em cartões e CTA inferior.
- As linhas pontilhadas azuis, títulos `Desktop / ...` e marcações de enquadramento são elementos do material de referência, não da interface do produto.
- Não há frames mobile para confirmação, perfil ou carteiras. Essas três variantes usam adaptação responsiva conservadora da composição desktop, conforme registrado em `docs/architecture.md`.

## Auditoria visual da home

A comparação foi feita com `desktop-inicio.png` e `mobile-inicio.png`, usando MSW ativado no cenário padrão e capturas de página inteira com viewports de 1440 × 1109, 768 × 1024 e 390 × 844 px. A implementação renderizou nove cards de catálogo, dois cards na faixa de lançamentos, quatro cards no diário e o footer. A captura inicial em 390 px mostrava o hero empilhado, com 617 px de altura; após o ajuste, o hero mede 184 px, com texto e arte lado a lado. Não foram observadas exceções JavaScript nem overflow horizontal nos três viewports.

| Viewport | Estado observado                                                                                                                             | Comparação com a referência                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1440 px  | Grade do catálogo em três colunas; destaque lateral; seções de lançamentos, diário e footer presentes.                                       | A sequência principal e a grade correspondem à composição desktop. A fidelidade fina de tipografia, proporções e espaçamentos ainda precisa ser revisada. |
| 768 px   | Grade do catálogo em duas colunas; conteúdo dentro do viewport, sem overflow.                                                                | Não há frame de referência específico para tablet nesta coleção; a validação visual em 768 px permanece pendente.                                         |
| 390 px   | Hero compacto de 184 px com texto e arte lado a lado; busca e filtro no topo, grade de duas colunas e navegação inferior fixa; sem overflow. | A composição principal do hero agora acompanha a referência mobile. Tipografia, proporções e detalhes de espaçamento ainda precisam de revisão final.     |

A presença de cards de lançamentos e conteúdo do diário na composição da home não autoriza criar páginas independentes de conteúdo editorial, suporte, atividade, ofertas ou downloads. Essas páginas e ações permanecem fora do escopo estabelecido pelo desafio; links e controles fora do escopo não devem aparentar sucesso funcional. A auditoria da home não está concluída até revisar a fidelidade fina nos três viewports e comparar as demais telas com seus frames.
