# Converter um relatório de busca de anterioridade (PDF) para o JSON do app "Apoio à Escrita de Patentes"

Anexei (ou colei abaixo) um **relatório de busca de anterioridade** em PDF. **Não refaça a busca e não pesquise nada na internet:** apenas leia o relatório e transcreva o que ele contém para o JSON abaixo.

## Como converter
- **registro:** uma linha para cada sequência de busca do relatório (tabela de registro, "palavra-chave / nº de documentos" ou parecido), com a base, a estratégia (A–G, se o relatório indicar; senão ""), a sequência exata, o número de resultados e quantos foram triados. Bases que o relatório diz que não foram acessadas (CAPTCHA, bloqueio, login) entram com `"acessada": false` e o motivo em `obs`.
- **base:** use um destes códigos: inpi, google, espacenet, patentscope, uspto, scholar, scielo, capes ou outra.
- **documentos:** todos os documentos da tabela de documentos relevantes, com número, título, depositante, datas (AAAA-MM-DD), país, situação legal, link, tipo, categoria (X, Y, A, O, L; se o relatório não disser, use "A"), relevância de 1 a 5 (converta "alta/média/baixa" para 4/3/2) e o que foi lido. Em `diferenca`, resuma a nota ou observação do relatório sobre o documento.
- **caracteristicas:** se o relatório tiver quadro comparativo, transcreva S/P/N/? usando os códigos abaixo. Se as características do relatório tiverem outros nomes, associe cada uma ao código mais próximo e diga em `observacoes` como associou.
  - {{liste aqui as características C1, C2… do seu pedido}}
- **anterioridades_encontradas, nota_explicativa, diferenciais, ameacas, lacunas, recomendacoes, alerta_prazos:** venham do resumo executivo, da conclusão e das seções de diferenciais, lacunas e recomendações do relatório.
- **Não invente:** o que o relatório não trouxer fica "" ou []; "não verificado" no relatório vira `"situacao": "não verificada"`. Mantenha os números dos documentos exatamente como estão.
- Responda **somente** com o bloco ```json, sem texto antes ou depois, e não gere PDF.

## Modelo do JSON
Responda **somente** com um bloco ```json contendo um objeto no formato abaixo, sem texto antes ou depois. Ele é importado direto no app "Apoio à Escrita de Patentes" e vira o Formulário de Busca de Anterioridade e o relatório da busca; por isso **mantenha os nomes dos campos e os valores permitidos**. Campos sem informação: use "" ou [] (nunca invente). Datas em AAAA-MM-DD.

```json
{
  "formato": "apoio-escrita-patentes-busca",
  "versao": 1,
  "data_busca": "AAAA-MM-DD",
  "registro": [
    { "base": "inpi | google | espacenet | patentscope | uspto | scholar | scielo | capes | outra", "estrategia": "A | B | C | D | E | F | G", "consulta": "sequência exata usada", "resultados": 0, "triados": 0, "acessada": true, "obs": "ex.: bloqueio por CAPTCHA resolvido pelo usuário" }
  ],
  "documentos": [
    { "numero": "BR 10 2016 023064 B1", "titulo": "", "depositante": "", "prioridade": "AAAA-MM-DD", "publicacao": "AAAA-MM-DD", "pais": "BR", "situacao": "vigente | extinta | em exame | sem entrada no Brasil | não verificada", "link": "https://...", "base": "inpi", "tipo": "Patente ou MU | Artigo ou Livro | Trabalho de Conclusão | Apresentação | Outro", "categoria": "X | Y | A | O | L", "relevancia": 1, "lido": "título | resumo | reivindicações | texto completo", "diferenca": "em que difere da invenção", "caracteristicas": { "C1": "S | P | N | ?" } }
  ],
  "anterioridades_encontradas": false,
  "nota_explicativa": "conclusão curta: o que foi encontrado e em que a invenção se diferencia",
  "diferenciais": ["característica que não aparece em nenhum documento"],
  "ameacas": ["documento ou combinação que mais ameaça novidade/atividade inventiva"],
  "lacunas": ["base não acessada, idioma não coberto, busca a refazer (com a sequência)"],
  "recomendacoes": ["próximo passo para o NIT / agente de PI"],
  "alerta_prazos": "divulgações do grupo e período de graça (art. 12 da Lei 9.279/96)"
}
```
- `registro`: uma linha por sequência executada em cada base (estratégias A–G), com o número de resultados e quantos foram triados; bases não acessadas entram com `"acessada": false` e a sequência pronta em `consulta`.
- `documentos`: os 20 a 30 mais relevantes (relevância 1–5; categoria X = sozinho tira a novidade, Y = combinado com outro, A = estado geral da técnica). Em `caracteristicas`, use os códigos C1, C2… da lista do item 3.6 (S = divulga, P = parcialmente, N = não, ? = não verificado), ao menos para os 10 mais próximos.
- Prefira o JSON também por economia: não repita textos longos nem copie resumos inteiros dos documentos.
