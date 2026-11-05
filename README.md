# Apoio à Escrita de Patentes

Ferramenta web, só navegador e sem instalação, que leva qualquer aluno do zero ao pedido de patente. Segue os passos do
[Guia Básico de Patentes do INPI](https://www.gov.br/inpi/pt-br/servicos/patentes/guia-basico) e o caminho pela
universidade (processo sigiloso no SEI e escritório de propriedade intelectual). Tem o mesmo visual do QFD e do Projeto Conceitual.

**Usar:** https://marlonsigales.github.io/apoio-escrita-patentes/. Também dá para abrir `index.html` por um servidor
local, com `python3 -m http.server`.

## Como funciona

1. **Jogo de missões.** Cada etapa tem missões que dão XP. O XP sobe o nível, de Curioso(a) até Inventor(a) completo(a), e os marcos dão medalhas.
   O XP é calculado do próprio pedido: se você apagar um texto, perde os pontos.
2. **Começa pela ficha "Sua invenção".** É a primeira aba depois do Início e reúne tudo do "Entenda" do guia do INPI: a escolha **PI ou MU** (feita num só lugar, valendo para o pedido todo), o teste para quem está em dúvida, as **divulgações** com o prazo de 12 meses e o que o INPI exige. Dela saem os rascunhos do **resumo** e das **reivindicações**.
   Quem já tem o resumo e as reivindicações escritos pode colá-los: o app completa a ficha a partir deles. Juntos, eles pré-preenchem, em cadeia:
   - a ficha (campo, solução, componentes numerados, vantagens, aplicações);
   - os termos e as classes da busca;
   - os desenhos (quantas figuras há e as legendas);
   - o relatório (os fundamentos são escritos depois que o retorno da busca é colado);
   - os formulários da universidade.

   Tudo isso só preenche o que está vazio e cada campo uma única vez: se o aluno apagar, o app não preenche de novo.
3. **Caderno de fontes, como o NotebookLM.** Você junta TCC, artigos e relatórios (.docx, .txt, .md ou texto colado). O app resume cada
   fonte, responde perguntas com trechos citados [1], [2]… e insere o trecho no campo em edição. Há também um pacote para IA:
   você copia o pedido, cola numa IA e cola a resposta de volta.
4. **Busca de anterioridade: primeiro o prompt e o retorno colado, depois o que for à mão.** A etapa segue esta ordem:
   1. Termos.
   2. **Prompt gerado** para uma IA com navegador. O prompt manda a IA parar e pedir ao usuário que resolva CAPTCHAs e logins manualmente.
      O retorno é pedido **em JSON** num formato fixo (`"formato": "apoio-escrita-patentes-busca"`), e não em PDF. Assim a IA gasta menos créditos e o app importa sem erro.
      O JSON traz: registro por base, estratégia, sequência e resultados; documentos com categoria, relevância, link e o quadro S/P/N por característica C1…Cn; e a conclusão, os diferenciais, as ameaças, as lacunas e as recomendações.
   3. **Retorno colado ou aberto como arquivo `.json`.** Retornos antigos em texto (PDF copiado, tabelas) continuam aceitos. O app lê tabelas em Markdown, texto de PDF e linhas como "Sensor de pressão / 1843" debaixo do nome da base.
      Daí saem as contagens por base, os documentos com relevância e link, a conclusão e se houve anterioridades.
      Tudo isso vai direto para o **Formulário de Busca de Anterioridade**.
      **Já tem a busca num PDF?** O botão "Pedido para converter um PDF de busca em JSON" copia um pedido para colar numa IA junto com o PDF (`docs/pedido-converter-pdf-busca-em-json.md`). A IA não refaz a busca: só transcreve o relatório para o mesmo JSON, usando as características C1…Cn do seu pedido.
      **Sem documentos repetidos:** se o número já está na lista, o app não cria outra entrada, mesmo que o documento venha de outra base (Google Patents, Espacenet, PATENTSCOPE…) ou esteja escrito de outro jeito (com espaços, pontos, dígito verificador ou outro código de tipo, como U2/Y1). As informações novas completam a entrada existente, e as bases ficam somadas nela. Isso vale ao importar o retorno, ao registrar um documento numa busca manual e ao digitar o número na tabela.
   4. Documentos e quadro comparativo, com as características tiradas das reivindicações.
   5. Buscas à mão, só para o que faltar.

   **Importar o `.md`:** Você importa o prompt padrão de busca (`docs/prompt-busca-anterioridade.md`, preenchido)
   ou outro texto parecido. O app lê o título, o objeto, o problema, a solução, as classes, as famílias de termos, os depositantes e as datas de divulgação.
   Com isso, gera as estratégias A–G para INPI (pePI), Google Patents, Espacenet, PATENTSCOPE, USPTO, Google Acadêmico e SciELO.
   Cada estratégia tem a sequência pronta para copiar, um link e o registro de resultados. O app também gera de volta o prompt `.md` preenchido, que diz
   à IA para **parar e pedir ao usuário que resolva CAPTCHAs e logins manualmente**.
5. **Classificação por aproximação.** O app compara as palavras da ficha com um catálogo resumido da IPC/CPC e marca as classes
   mais próximas, mostrando a % de semelhança e o porquê. O aluno confere cada classe no navegador CPC do Espacenet antes de usar.
6. **Reivindicações em 4 campos.** Cada reivindicação é montada assim:
   1. o título, ou uma parte dele, escolhida numa lista com as partes do título;
   2. "de acordo com a reivindicação N", só nas dependentes;
   3. a palavra-chave "caracterizado por", que vira "caracterizada por" quando o título é feminino; também dá para escolher "…pelo fato de";
   4. a característica.

   Há botões "＋ Independente", "＋ Dependente" e "＋ Dependente desta". A numeração e as dependências se ajustam ao inserir, subir ou remover uma reivindicação, e a prévia da frase atualiza enquanto o aluno digita.
7. **Regras do INPI verificadas.** O app confere estes pontos:
   - o título é o mesmo em todos os documentos;
   - as reivindicações usam "caracterizado por" e cada uma é uma única frase;
   - o modelo de utilidade tem uma só reivindicação independente;
   - o resumo tem de 50 a 200 palavras e indica a figura;
   - os números de referência batem entre os documentos;
   - os desenhos existem (obrigatórios para MU);
   - o período de graça de 12 meses é respeitado.
8. **Os 8 documentos no fim**, todos em Word (.docx):

   | # | Documento | Para |
   |---|-----------|------|
   | 1 | Relatório Descritivo | INPI |
   | 2 | Reivindicações | INPI |
   | 3 | Desenhos | INPI |
   | 4 | Resumo | INPI |
   | 5 | Memorando de abertura de processo sigiloso | Universidade (SEI) |
   | 6 | Formulário de Informação Tecnológica (com inventores ilimitados e participação de 1/3) | Universidade |
   | 7 | Formulário de Busca de Anterioridade (contagens por base e documentos relevantes) | Universidade |
   | 8 | Relatório da busca de anterioridade (registro, documentos, quadro comparativo, prazos) | Equipe / NIT |

   Os documentos do INPI saem como os modelos da equipe: Arial 12, espaçamento 1,5, texto justificado, parágrafos numerados e "página / total" no cabeçalho; "caracterizado por" (e "caracterizada por", "caracterizado pelo fato de") sai sempre em negrito.

## Desenhos, inventores e relatório

- **Desenhos (antes do relatório):** figuras em células, como no Colab ("Figura 1" a "Figura n"). Cada figura pode ser enviada (PNG, JPG, SVG) ou desenhada (retângulo, elipse, linha, texto). As setas numeradas seguem a ordem; a mesma peça pode ter várias setas com o mesmo número e todas usam a mesma descrição. As descrições preenchem o relatório, e os textos da figura têm tradução PT/EN/ES.
  - **Biblioteca de símbolos** (60, em preto e branco): fluxograma (ISO 5807), diagrama de blocos, elétrico/eletrônico (IEC 60617: resistor, capacitor, indutor, fontes, terra, chaves, contatos NA/NF, relé, diodo, LED, transistor, amp-op, motor, transformador…) e P&ID (ISA 5.1: válvulas, bomba, compressor, vaso, silo/moega, trocador, filtro, válvula rotativa, rosca transportadora e instrumentos de campo, painel, SDCD e CLP).
  - **Ligações** que encaixam nos terminais dos símbolos e **ficam presas a eles**: ao mover, redimensionar, girar ou espelhar o símbolo, a ligação acompanha (no mesmo terminal); arrastar a ponta para fora a solta. São retas, em L ou em Z, com estilos de fluxo/fio, tubulação, sinal elétrico (tracejado), pneumático (//), dados (círculos) e pontilhado, e pontas de seta ou ponto de junção.
  - Grade para alinhar, girar 90°, espelhar, duplicar (Ctrl+D) e rótulos traduzíveis dentro ou abaixo dos símbolos.
- **Empresas da busca nos formulários da UFPel:** as empresas que depositaram os documentos da busca entram no Formulário de Informação Tecnológica no item 2.4 (mercado) e no 2.5, como possíveis interessadas, com o documento de origem e o lembrete de completar o contato. Universidades e pessoas físicas ficam de fora, e nada do que o aluno escreveu é apagado.
- **Inventores:** os nomes da ficha e da aba Inventores ficam sincronizados. Há exportação e importação de um JSON só de inventores, para reaproveitar em outros pedidos.
- **Melhorar o relatório com IA:** o app gera um pedido para a IA reescrever o relatório em linguagem de patente: geral, amarrado e suficiente para um técnico reproduzir (LPI art. 24), sem revelar know-how que não é essencial. A resposta colada atualiza os campos, e dá para desfazer.

## Exportar e continuar depois

- **💾 Exportar o pedido (.json)**, no Painel, no menu lateral ou na etapa final, baixa um arquivo com o **nome do título da patente**, por exemplo `Sistema de monitoramento de pressão para circuitos pneumáticos.json`.
  Ele tem o pedido inteiro: ficha, resumo, reivindicações, buscas, relatório, inventores, formulários, progresso do jogo e as **figuras embutidas**.
- **📂 Continuar um pedido (.json)** reimporta esse arquivo, restaura as figuras e abre na próxima missão pendente.
  O app também aceita o ZIP dos 8 documentos, que leva o mesmo JSON, e o `pedido.json` de versões antigas.
- O JSON do pedido (`"formato": "apoio-escrita-patentes-pedido"`) é diferente do JSON do retorno da busca (`"apoio-escrita-patentes-busca"`), que se importa na etapa de buscas.
  O app avisa se um for aberto no lugar do outro.

## Dados e privacidade

- Tudo fica **no navegador**: o texto no `localStorage` e as figuras no IndexedDB. Nada vai para um servidor.
- O ZIP final leva os 8 documentos, o pedido em JSON (com o nome do título) e o prompt `.md`.
- O CPF, o endereço e o telefone dos inventores entram só nos formulários da universidade. **Não publique o ZIP** nem cole esses dados numa IA.
- "Começar do zero" (no Painel ou em Mais opções) apaga o pedido, as fontes e as figuras deste navegador.
- O exemplo é o sistema de monitoramento de pressão para circuitos pneumáticos, com o retorno da busca colado do formulário. Os inventores do exemplo são fictícios.

## Estrutura do código

```
index.html            casca (rotas #/etapa, menu, XP no topo, caderno lateral)
css/style.css         identidade visual (mesma do QFD / Projeto Conceitual)
css/patentes.css      jogo, buscas, classificação, caderno, documentos
js/dados.js           modelo do pedido, universidade/inventores, armazenamento, imagens
js/ipc.js             catálogo IPC/CPC resumido, classificação por aproximação, dicionário PT→EN/ES
js/buscas.js          famílias de termos, estratégias A–G por base, leitura e geração do prompt .md
js/fontes.js          caderno de fontes, leitura de .docx, pedido existente, pacote para IA
js/redacao.js         rascunhos de cada parte e verificações das regras do INPI
js/documentos.js      gerador .docx (JSZip) dos 8 documentos e ZIP final
js/jogo.js            etapas, missões, XP, níveis, medalhas e checklist
js/preenche.js        pré-preenchimento em cadeia (resumo + reivindicações → resto) e leitura do retorno da busca colado
js/exemplo.js         exemplo: sistema de monitoramento de pressão para circuitos pneumáticos
js/etapas.js          páginas de cada etapa
js/app.js             ligação dos campos, ações, caderno, janelas e tour
lib/jszip.min.js      JSZip (MIT)
docs/                 prompt padrão de busca de anterioridade (.md)
tests/testes.html     testes no navegador
```

## Licença

Software proprietário. © 2026 Marlon Sigales, todos os direitos reservados (ver `LICENSE`). A biblioteca JSZip segue a licença MIT própria.
