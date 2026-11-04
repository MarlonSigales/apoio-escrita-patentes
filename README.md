# Apoio à Escrita de Patentes

Ferramenta web, só navegador e sem instalação, que leva qualquer aluno do zero ao pedido de patente. Segue os passos do
[Guia Básico de Patentes do INPI](https://www.gov.br/inpi/pt-br/servicos/patentes/guia-basico) e o caminho pela
universidade (processo sigiloso no SEI e escritório de propriedade intelectual). Tem o mesmo visual do QFD e do Projeto Conceitual.

**Usar:** https://marlonsigales.github.io/apoio-escrita-patentes/. Também dá para abrir `index.html` por um servidor
local, com `python3 -m http.server`.

## Como funciona

1. **Jogo de missões.** Cada etapa tem missões que dão XP. O XP sobe o nível, de Curioso(a) até Inventor(a) completo(a), e os marcos dão medalhas.
   O XP é calculado do próprio pedido: se você apagar um texto, perde os pontos.
2. **Começa pela ficha "Sua invenção".** É a primeira aba depois do Início. Dela saem os rascunhos do **resumo** e das **reivindicações**.
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
   3. **Retorno da busca colado.** O app lê tabelas em Markdown, texto de PDF e linhas como "Sensor de pressão / 1843" debaixo do nome da base.
      Daí saem as contagens por base, os documentos com relevância e link, a conclusão e se houve anterioridades.
      Tudo isso vai direto para o **Formulário de Busca de Anterioridade**.
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

   Os documentos do INPI saem como os modelos da equipe: Arial 12, espaçamento 1,5, texto justificado, parágrafos numerados e "página / total" no cabeçalho.

## Dados e privacidade

- Tudo fica **no navegador**: o texto no `localStorage` e as figuras no IndexedDB. Nada vai para um servidor.
- O ZIP final leva os 8 documentos, o `pedido.json`, as imagens e o prompt `.md`. Para continuar o pedido, abra o ZIP em "Abrir pedido".
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
