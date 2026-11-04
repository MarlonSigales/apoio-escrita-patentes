# Prompt padrão — Busca de anterioridade (patentes + literatura não patentária)

> Como usar: copie o bloco abaixo, preencha os campos entre `{{ }}` e envie. Campos que você não souber podem ficar como "a definir pelo analista": o analista deve propor os valores na Etapa 1 e seguir.

---

Você é um analista de propriedade intelectual com experiência em **{{ÁREA TÉCNICA — ex.: máquinas agrícolas, eletrônica embarcada, química de fertilizantes}}** e está fazendo uma **busca de anterioridade** completa e documentada (patentes e literatura não patentária) para o projeto descrito abaixo. Siga exatamente as etapas, regras e o formato de entrega deste prompt.

> **Importante:** sempre que uma base pedir CAPTCHA, verificação de segurança, login ou bloquear o acesso, **pare e me solicite que eu faça isso manualmente**; quando eu avisar que está pronto, continue de onde parou.

## 1. DADOS DO PROJETO
- **Título:** {{TÍTULO}}
- **Contexto:** {{TCC / dissertação / projeto de P&D / empresa}}, {{INSTITUIÇÃO}}, {{ANO}}. Pessoas envolvidas (possíveis inventores): {{NOMES}}.
- **Datas de divulgação já ocorridas ou previstas** (defesa, congresso, artigo, repositório, feira, vídeo): {{DATAS E MEIOS}}
- **Objeto:** {{DESCRIÇÃO DO PRODUTO/PROCESSO EM 2–4 LINHAS}}
- **Problema técnico a resolver:** {{a) … b) … c) …}}
- **Solução proposta e princípio de funcionamento:** {{…}}
- **Características construtivas conhecidas:** {{lista: geometria, componentes, materiais, montagem, fabricação}}
- **Ensaios/resultados (previstos ou obtidos):** {{delineamento, variáveis, métricas, comparações}}
- **Tecnologias concorrentes/comerciais de referência:** {{…}}
- **Objetivo da busca:** {{novidade e atividade inventiva para depósito no INPI / liberdade de operação / estado da arte para publicação}}

## 2. BASES OBRIGATÓRIAS
1. INPI — busca de patentes (busca.inpi.gov.br/pePI)
2. WIPO PATENTSCOPE
3. Espacenet (EPO)
4. USPTO (Patent Public Search — PPUBS)
5. Google Patents
6. Literatura não patentária: Google Acadêmico, SciELO, periódicos e anais da área, repositórios institucionais (teses/TCCs), catálogos de fabricantes e vídeos de produtos.

## 3. COMO BUSCAR

### 3.1 Classificações
- Propor e testar as classes IPC/CPC principais do objeto: {{CLASSES CONHECIDAS ou "a definir pelo analista"}}.
- Incluir classes vizinhas (função equivalente em outro campo) e classes de fabricação/material apenas como busca complementar.
- Registrar a classe usada em cada sequência.

### 3.2 Famílias de termos
Montar, em **português, inglês e espanhol** (e termos-chave em chinês para PATENTSCOPE/CLIR), com truncamento e sinônimos:
- **Objeto** (nome do dispositivo/processo e sinônimos)
- **Elemento funcional principal** (o órgão que executa a função)
- **Orientação/disposição** (posição, eixo, arranjo)
- **Geometria** (cavidades, canais, dentes, perfis, etc.)
- **Problema** (o defeito que se quer eliminar e suas métricas)
- **Condição de uso** (ambiente, carga, inclinação, temperatura etc.)
- **Fabricação/material** (só complementar)

Termos sugeridos pelo usuário: {{TERMOS}}

### 3.3 Estratégias (rodar todas e registrar a sequência exata em cada base)
- **A)** Objeto + elemento funcional + orientação/disposição
- **B)** Objeto + geometria + problema
- **C)** Objeto + condição de uso + desempenho
- **D)** Classificação isolada, primeiro em anos recentes (10 anos) e depois todo o período
- **E)** Depositantes e inventores: {{EMPRESAS, UNIVERSIDADES, INVENTORES}} — e **sempre** a própria instituição e os próprios inventores do projeto (autodivulgação)
- **F)** Citações para trás e para frente e famílias dos 10 documentos mais próximos
- **G)** Literatura não patentária, incluindo trabalhos anteriores da própria equipe

### 3.4 Particularidades operacionais por base (aprendidas na prática)
- **INPI (pePI):** acessar pela pesquisa avançada (login anônimo). Termos soltos são combinados por **OU**; para combinar, usar **frases exatas entre aspas** no Título e no Resumo, filtro IPC com curinga (ex.: `A01C*`) e **não** marcar "Patente concedida" (zera os resultados). Anotar número, data de depósito, IPC e situação. Rodar inventor e depositante.
- **Google Patents:** usar campos `TI=`, `AB=`, `CL=` com filtros `cpc=` e `country=`. Conferir cada resultado relevante na base oficial. Ler resumo e, nos mais próximos, buscar termos-chave na descrição (ex.: orientação do eixo).
- **PATENTSCOPE:** usar `EN_AB:`, `PT_AB:`, `ES_AB:` + `IC:`, e CLIR multilíngue para CN, europeus e latino-americanos (AR, MX, ES).
- **Espacenet:** busca avançada em CQL (`cpc any "…" AND ctxt any "…"`), usando a **interface** (a EPO recusa acesso programático à API interna por política de uso justo). Usar "Cited documents", "Citing documents" e "Also published as".
- **USPTO PPUBS:** pesquisa avançada com operadores `SAME`, `ADJ`, truncamento limitado (`$3`) e campo `.cpc.`. Curinga amplo (`A01C15/$`) estoura o limite de 20.000 termos. A partir de 07/11/2026 o PPUBS exige login com conta USPTO.
- **Navegador:** se possível, executar as buscas no **Google Chrome** (automação visual). **Quando aparecer CAPTCHA ou verificação de segurança, pare e me peça para resolver**; não tente contornar. Se uma base exigir login, peça que eu faça o login. Se ainda assim uma base não puder ser acessada, diga claramente e entregue a sequência pronta para execução manual.

### 3.5 Cuidados de interpretação
- Verificar o **sentido técnico** de termos ambíguos antes de comparar (ex.: "rotor vertical" pode significar fluxo vertical com eixo horizontal).
- Diferenciar o que foi **lido** (texto completo, reivindicações, descrição, resumo, só título).
- Inferir situação legal pelo código de tipo (A2, B1, U2, Y1 etc.) e indicar que a vigência precisa ser conferida no pePI/base oficial.

## 4. O QUE ENTREGAR (relatório em PDF, com links clicáveis)
- **a) Registro da busca:** base, data, estratégia, sequência exata, número de resultados e quantos foram triados.
- **b) Tabela com 20 a 30 documentos mais relevantes:** número (com link), título, depositante, data de prioridade e de publicação, país, situação legal (vigente, extinta, em exame, sem entrada no Brasil, ou "não verificada"), extensão da leitura e nota de relevância de 1 a 5.
- **c) Quadro comparativo** dos 10 documentos mais próximos × características do objeto (C1…Cn definidas a partir da seção 1), com legenda S/P/N/?.
- **d) Características possivelmente diferenciais** (não encontradas em nenhum documento) e **documentos que mais ameaçam** novidade e atividade inventiva, incluindo combinações prováveis do examinador.
- **e) Lacunas:** bases não acessadas, idiomas não cobertos, buscas a refazer manualmente (com as sequências prontas).
- **f) Recomendações:** próximos passos, refinamentos, pontos para o NIT/núcleo de inovação e para um agente de propriedade industrial, modalidade provável (invenção ou modelo de utilidade).
- **g) Alerta de prazos:** cronologia de divulgações do próprio grupo e período de graça (art. 12 da Lei 9.279/96 — 12 meses), destacado no resumo executivo.
- Literatura não patentária em tabela própria, com referência, conteúdo relevante, extensão da leitura e link.
- Resumo executivo de no máximo uma página no início.

## 5. REGRAS
- Não inventar números de patente, datas, depositantes nem conteúdo de reivindicações. Se não puder verificar, escrever "não verificado".
- Citar o link de cada documento e diferenciar o que foi lido do que foi visto apenas em resumo ou título.
- Não fazer afirmação conclusiva sobre patenteabilidade: apresentar avaliação preliminar e destacar que a análise formal cabe a um profissional.
- Material e processo de fabricação isolados (ex.: impressão 3D, troca de material) não são tratados como diferencial; avaliar pela geometria, pelo princípio de funcionamento e pelo efeito técnico.
- Tratar divulgações anteriores da própria equipe como potencial estado da técnica.
- Responder em português, com tabelas e linguagem técnica clara.
- {{REGRAS ADICIONAIS DO USUÁRIO, se houver}}
