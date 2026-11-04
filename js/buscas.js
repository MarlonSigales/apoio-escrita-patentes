/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * BUSCAS DE ANTERIORIDADE: monta as famílias de termos (PT, EN, ES), gera as sequências das estratégias A–G para
 * INPI, PATENTSCOPE, Espacenet, USPTO, Google Patents e literatura, e lê/gera o prompt padrão (.md) de busca.
 */

'use strict';

const FAMILIAS = [
    ['objeto', 'Objeto', 'O que é a invenção (dosador, sensor, sistema de monitoramento…)'],
    ['elemento', 'Elemento principal', 'A peça ou bloco que faz a função (cilindro, rotor, sensor de pressão…)'],
    ['orientacao', 'Disposição', 'Posição ou arranjo (vertical, em série, sem fio…)'],
    ['geometria', 'Geometria', 'Formas e detalhes (cavidades, canais, dentes…)'],
    ['problema', 'Problema', 'O defeito que se quer eliminar (pulsação, falta de mobilidade…)'],
    ['condicao', 'Condição de uso', 'Onde e como trabalha (inclinação, máquinas agrícolas…)'],
    ['fabricacao', 'Fabricação', 'Só complementar (impressão 3D, injeção…)']
];

const BASES = {
    inpi: { nome: 'INPI (pePI)', url: 'https://busca.inpi.gov.br/pePI/', cor: '#2e7d32' },
    google: { nome: 'Google Patents', url: 'https://patents.google.com/', cor: '#1a73e8' },
    espacenet: { nome: 'Espacenet', url: 'https://worldwide.espacenet.com/patent/search', cor: '#0b5394' },
    patentscope: { nome: 'PATENTSCOPE', url: 'https://patentscope.wipo.int/search/pt/search.jsf', cor: '#00639e' },
    uspto: { nome: 'USPTO PPUBS', url: 'https://ppubs.uspto.gov/pubwebapp/', cor: '#5b2c83' },
    scholar: { nome: 'Google Acadêmico', url: 'https://scholar.google.com/', cor: '#4285f4' },
    scielo: { nome: 'SciELO', url: 'https://search.scielo.org/', cor: '#b84a00' }
};

const ESTRATEGIAS = {
    A: { nome: 'Objeto + elemento + disposição', fams: ['objeto', 'elemento', 'orientacao'] },
    B: { nome: 'Objeto + geometria + problema', fams: ['objeto', 'geometria', 'problema'] },
    C: { nome: 'Objeto + condição de uso + problema', fams: ['objeto', 'condicao', 'problema'] },
    D: { nome: 'Só pela classificação', fams: [] },
    E: { nome: 'Depositantes e inventores (inclui a própria equipe)', fams: [] },
    F: { nome: 'Citações e famílias dos mais próximos', fams: [] },
    G: { nome: 'Literatura não patentária', fams: ['objeto', 'elemento', 'problema'] }
};

function listaTermos(t) { return String(t || '').split(/[;,\n]/).map(s => s.trim()).filter(Boolean); }

/** Família → { pt, en, es } (as traduções vêm do dicionário ou da edição do aluno). */
function familia(p, chave) {
    const pt = listaTermos(p.busca.termos[chave]);
    const en = [], es = [];
    for (const t of pt) {
        const tr = traduzir(p, t);
        tr.en.forEach(x => en.includes(x) || en.push(x));
        tr.es.forEach(x => es.includes(x) || es.push(x));
    }
    return { pt, en, es };
}

/** Pré-preenche as famílias de termos a partir da ficha (só as vazias). */
function preencherTermos(p) {
    const t = p.busca.termos, f = p.ficha;
    const set = (k, v) => { if (!t[k] && v.length) t[k] = v.join('; '); };
    const tit = termosCandidatos(p.titulo, 4);
    set('objeto', tit.slice(0, 2));
    set('elemento', termosCandidatos(f.componentes.map(c => c.nome).join(', ') + ' ' + f.solucao, 4).filter(x => !tit.includes(x)).slice(0, 3));
    set('orientacao', termosCandidatos(f.solucao, 12).filter(x => /vertical|horizontal|eixo|serie|série|sem fio|paralel|axial|radial|inclinad|móvel|portátil|lateral|inferior|superior/i.test(x)).slice(0, 3));
    set('geometria', termosCandidatos(f.solucao + ' ' + f.componentes.map(c => c.funcao).join(' '), 14).filter(x => /cavidad|alvéol|furo|orifíc|canal|dente|palheta|ranhura|aleta|geometr|cônic|conic|cilíndr|perfil|rosca|bocal/i.test(x)).slice(0, 3));
    set('problema', termosCandidatos(f.problema, 3));
    set('condicao', termosCandidatos(f.aplicacoes + ' ' + f.campo, 3));
    return p;
}

// ------------------------------------------------------------ montagem das sequências
const aspas = t => (/\s/.test(t) ? `"${t}"` : t);
function grupoOU(lista) { return lista.length ? '(' + lista.map(aspas).join(' OR ') + ')' : ''; }

function classesBusca(p) {
    const manuais = (p.classes.manuais.match(/[A-H]\d{2}[A-Z]\s?\d{1,4}\/\d{2,6}|[A-H]\d{2}[A-Z]\b/g) || []).map(s => s.trim());
    return [...new Set([...p.classes.marcadas, ...manuais])];
}

/** Gera todas as buscas: [{ id, base, est, rotulo, consulta, url, dica }]. */
function gerarBuscas(p) {
    const out = [];
    const cls = classesBusca(p);
    const subs = [...new Set(cls.map(subclasse))];
    const add = (base, est, consulta, url, dica) => { if (consulta) out.push({ id: base + '-' + est + '-' + out.length, base, est, rotulo: ESTRATEGIAS[est].nome, consulta, url: url || BASES[base].url, dica: dica || '' }); };

    for (const est of ['A', 'B', 'C']) {
        const fams = ESTRATEGIAS[est].fams.map(k => familia(p, k)).filter(f => f.pt.length);
        if (fams.length < 2) continue;
        // Google Patents: grupos com PT+EN+ES (texto completo multilíngue) + CPC
        const gq = fams.map(f => grupoOU([...f.en, ...f.pt, ...f.es])).join(' ');
        const gcpc = cls.length ? ' (' + cls.slice(0, 4).map(c => 'CPC=' + codCompacto(c)).join(' OR ') + ')' : '';
        add('google', est, gq + gcpc, 'https://patents.google.com/?q=' + encodeURIComponent(gq + gcpc) + '&oq=' + encodeURIComponent(gq));
        add('google', est, gq, 'https://patents.google.com/?q=' + encodeURIComponent(gq) + '&country=BR', 'Mesma busca, só documentos brasileiros.');
        // Espacenet (CQL) — usar pela tela; a EPO não aceita acesso automático
        const ctx = f => '(' + [...f.en, ...f.pt].map(t => `ctxt = "${t}"`).join(' OR ') + ')';
        const eq = fams.map(ctx).join(' AND ') + (cls.length ? ` AND cpc any "${cls.map(codCompacto).join(' ')}"` : '');
        add('espacenet', est, eq, 'https://worldwide.espacenet.com/patent/search?q=' + encodeURIComponent(eq), 'Se aparecer verificação de segurança, resolva e recarregue.');
        // PATENTSCOPE (resumo em EN, PT e ES)
        const ab = (campo, ling) => fams.map(f => grupoOU(f[ling])).filter(Boolean).join(' AND ');
        const pen = ab('EN_AB', 'en'), ppt = ab('PT_AB', 'pt'), pes = ab('ES_AB', 'es');
        const ic = subs.length ? ' AND IC:(' + subs.join(' OR ') + ')' : '';
        const pq = [pen && `EN_AB:(${pen})`, ppt && `PT_AB:(${ppt})`, pes && `ES_AB:(${pes})`].filter(Boolean).join(' OR ');
        add('patentscope', est, '(' + pq + ')' + ic, BASES.patentscope.url, 'Cole no campo de busca (Campo: Primeira página). Pode pedir CAPTCHA: resolva e continue.');
        // USPTO PPUBS
        const uq = fams.map(f => grupoOU(f.en.length ? f.en : f.pt)).join(' SAME ') + (cls.length ? ' AND (' + cls.map(c => codCompacto(c) + '.cpc.').join(' OR ') + ')' : '');
        add('uspto', est, uq, BASES.uspto.url, 'Cole na Pesquisa avançada. Desde 07/11/2026 exige login com conta USPTO.');
        // INPI: frases exatas no Resumo + IPC com curinga (os termos soltos viram OU no pePI)
        const frases = [...new Set(fams.flatMap(f => f.pt))].map(t => `"${t}"`);
        add('inpi', est, 'Resumo (uma frase por vez): ' + frases.join(' · ') + (subs.length ? '\nIPC: ' + subs.map(s => s + '*').join(' ou ') : ''), BASES.inpi.url,
            'Pesquisa → Patente → Pesquisa avançada. Termos soltos são somados com OU: use uma frase entre aspas por vez e o filtro de IPC com *. Não marque "Patente concedida".');
    }
    // D) classificação isolada
    if (cls.length) {
        const ano = new Date().getFullYear() - 10;
        add('google', 'D', '(' + cls.map(c => 'CPC=' + codCompacto(c)).join(' OR ') + ')', 'https://patents.google.com/?q=' + encodeURIComponent('(' + cls.map(c => 'CPC=' + codCompacto(c)).join(' OR ') + ')') + '&after=priority:' + ano + '0101', `Últimos 10 anos (desde ${ano}). Depois tire o filtro de data.`);
        add('espacenet', 'D', `cpc any "${cls.map(codCompacto).join(' ')}" AND pd >= ${ano}`, 'https://worldwide.espacenet.com/patent/search?q=' + encodeURIComponent(`cpc any "${cls.map(codCompacto).join(' ')}" AND pd >= ${ano}`));
        add('inpi', 'D', 'IPC: ' + cls.join(' · ') + `\nData de depósito: de 01/01/${ano} até hoje (depois todo o período)`, BASES.inpi.url, 'Campo Classificação (IPC) da pesquisa avançada.');
    }
    // E) depositantes e inventores
    const nomes = [...listaTermos(p.busca.depositantes), ...listaTermos(p.contexto.depositante), ...listaTermos(p.contexto.inventores)];
    for (const n of [...new Set(nomes)].slice(0, 14)) {
        add('google', 'E', `assignee:"${n}" OR inventor:"${n}"` + (cls.length ? ' (' + subs.map(s => 'CPC=' + s).join(' OR ') + ')' : ''), 'https://patents.google.com/?q=' + encodeURIComponent(subs.map(s => 'CPC=' + s).join(' OR ')) + '&assignee=' + encodeURIComponent(n));
        add('inpi', 'E', `Depositante ou Inventor: ${n}` + (subs.length ? `\nIPC: ${subs.map(s => s + '*').join(' ou ')}` : ''), BASES.inpi.url, 'Rode no campo Depositante e depois no campo Inventor.');
    }
    // F) citações dos mais próximos
    const prox = p.busca.resultados.filter(r => Number(r.relevancia) >= 4).slice(0, 10);
    for (const r of prox) {
        add('google', 'F', `Citações de ${r.num}`, 'https://patents.google.com/patent/' + encodeURIComponent(r.num.replace(/\s|-/g, '')) + '/pt', 'Abra o documento e veja "Citações", "Citado por" e "Família".');
    }
    if (!prox.length) add('espacenet', 'F', 'Marque resultados com relevância 4 ou 5 para gerar as buscas de citações.', BASES.espacenet.url, 'Use "Cited documents", "Citing documents" e "Also published as".');
    // G) literatura
    const fg = ESTRATEGIAS.G.fams.map(k => familia(p, k)).filter(f => f.pt.length);
    if (fg.length) {
        const pt = fg.map(f => grupoOU(f.pt.slice(0, 3))).join(' ');
        const en = fg.map(f => grupoOU(f.en.slice(0, 3))).filter(Boolean).join(' ');
        add('scholar', 'G', pt, 'https://scholar.google.com/scholar?q=' + encodeURIComponent(pt) + '&hl=pt-BR');
        if (en) add('scholar', 'G', en, 'https://scholar.google.com/scholar?q=' + encodeURIComponent(en));
        add('scielo', 'G', pt.replace(/ OR /g, ' or '), 'https://search.scielo.org/?q=' + encodeURIComponent(pt.replace(/ OR /g, ' or ')) + '&lang=pt');
        const inst = listaTermos(p.contexto.instituicao)[0];
        if (inst) add('scholar', 'G', `${grupoOU(fg[0].pt.slice(0, 2))} "${inst}"`, 'https://scholar.google.com/scholar?q=' + encodeURIComponent(`${grupoOU(fg[0].pt.slice(0, 2))} "${inst}"`), 'Trabalhos da própria instituição: divulgação anterior conta como estado da técnica.');
    }
    return out;
}

/** Parágrafo de estado da técnica para o relatório, a partir dos resultados registrados. */
function textoEstadoTecnica(p) {
    const rs = p.busca.resultados.filter(r => r.num).sort((a, b) => b.relevancia - a.relevancia).slice(0, 6);
    if (!rs.length) return '';
    const itens = rs.map(r => `${r.num}${r.titulo ? ' (' + r.titulo.trim() + ')' : ''}`);
    const lista = itens.length > 1 ? itens.slice(0, -1).join(', ') + ' e ' + itens.slice(-1) : itens[0];
    return `Ao analisar o estado da técnica foram encontrados documentos relacionados, como ${lista}. ` +
        `Diante dessa busca, não foram encontrados documentos que apresentem a mesma construção e aplicação da apresentada neste relatório. [Revise: diga em que cada documento se diferencia.]`;
}

// ------------------------------------------------------------ prompt padrão (.md)
const MD_FIXO = `## 2. BASES OBRIGATÓRIAS
1. INPI — busca de patentes (busca.inpi.gov.br/pePI)
2. WIPO PATENTSCOPE
3. Espacenet (EPO)
4. USPTO (Patent Public Search — PPUBS)
5. Google Patents
6. Literatura não patentária: Google Acadêmico, SciELO, periódicos e anais da área, repositórios institucionais (teses/TCCs), catálogos de fabricantes e vídeos de produtos.

## 3. COMO BUSCAR
### 3.3 Estratégias (rodar todas e registrar a sequência exata em cada base)
- **A)** Objeto + elemento funcional + orientação/disposição
- **B)** Objeto + geometria + problema
- **C)** Objeto + condição de uso + desempenho
- **D)** Classificação isolada, primeiro em anos recentes (10 anos) e depois todo o período
- **E)** Depositantes e inventores — e **sempre** a própria instituição e os próprios inventores do projeto (autodivulgação)
- **F)** Citações para trás e para frente e famílias dos 10 documentos mais próximos
- **G)** Literatura não patentária, incluindo trabalhos anteriores da própria equipe

### 3.4 Particularidades operacionais por base
- **INPI (pePI):** termos soltos são combinados por OU; usar frases exatas entre aspas no Título e no Resumo, IPC com curinga (ex.: A01C*) e não marcar "Patente concedida".
- **Google Patents:** campos TI=, AB=, CL=, CPC= e filtros de país; conferir na base oficial.
- **PATENTSCOPE:** EN_AB:, PT_AB:, ES_AB: + IC:, com CLIR multilíngue.
- **Espacenet:** CQL pela interface (a EPO recusa acesso automático); usar Cited/Citing documents e Also published as.
- **USPTO PPUBS:** SAME/ADJ, truncamento limitado ($3) e campo .cpc.; login obrigatório desde 07/11/2026.
- **Navegador:** faça as buscas no Google Chrome (automação visual) quando possível. **Em caso de necessidade de CAPTCHA, verificação de segurança, login ou qualquer bloqueio, pare e me solicite que eu resolva manualmente; depois continue.** Não tente contornar.

### 3.5 Cuidados de interpretação
- Verificar o sentido técnico de termos ambíguos antes de comparar.
- Diferenciar o que foi lido (texto completo, reivindicações, descrição, resumo, só título).
- Inferir situação legal pelo código de tipo (A2, B1, U2, Y1) e indicar que a vigência precisa ser conferida.

## 4. O QUE ENTREGAR (relatório em PDF, com links clicáveis)
- a) Registro da busca: base, data, estratégia, sequência exata, número de resultados e triados.
- b) Tabela com 20 a 30 documentos: número com link, título, depositante, prioridade e publicação, país, situação legal, extensão da leitura e relevância 1–5.
- c) Quadro comparativo dos 10 mais próximos × características do objeto (S/P/N/?).
- d) Características possivelmente diferenciais e documentos que mais ameaçam novidade e atividade inventiva.
- e) Lacunas e buscas a refazer manualmente.
- f) Recomendações para o NIT e para um agente de propriedade industrial; modalidade provável (invenção ou modelo de utilidade).
- g) Alerta de prazos: divulgações do grupo e período de graça de 12 meses (art. 12 da Lei 9.279/96).

## 5. REGRAS
- Não inventar números de patente, datas, depositantes nem reivindicações; se não puder verificar, escrever "não verificado".
- Citar o link de cada documento e diferenciar o que foi lido do que foi visto só em resumo ou título.
- Não concluir sobre patenteabilidade: avaliação preliminar; a análise formal cabe a um profissional.
- Material ou processo de fabricação isolado não é diferencial; avaliar geometria, princípio de funcionamento e efeito técnico.
- Tratar divulgações anteriores da própria equipe como estado da técnica.
- Responder em português, com tabelas e linguagem técnica clara.`;

function gerarMD(p) {
    const f = p.ficha, c = p.contexto;
    const v = (x, ph) => (String(x || '').trim() || `{{${ph}}}`);
    const fam = FAMILIAS.map(([k, nome]) => { const x = familia(p, k); return x.pt.length ? `- **${nome}:** ${[...x.pt, ...x.en, ...x.es].join(', ')}` : `- **${nome}:** {{termos}}`; }).join('\n');
    const comps = f.componentes.length ? f.componentes.map(x => `${x.num ? '(' + x.num + ') ' : ''}${x.nome}${x.funcao ? ' — ' + x.funcao : ''}`).join('; ') : '';
    const divs = c.divulgacoes.filter(d => d.data || d.meio).map(d => `${dataBR(d.data)} — ${d.meio}`).join('; ');
    return `# Prompt padrão — Busca de anterioridade (patentes + literatura não patentária)

Você é um analista de propriedade intelectual com experiência em **${v(p.area, 'ÁREA TÉCNICA')}** e está fazendo uma **busca de anterioridade** completa e documentada (patentes e literatura não patentária) para o projeto descrito abaixo. Siga exatamente as etapas, regras e o formato de entrega deste prompt.

> **Importante:** sempre que uma base pedir CAPTCHA, verificação de segurança, login ou bloquear o acesso, **pare e me solicite que eu faça isso manualmente**; quando eu avisar que está pronto, continue de onde parou.

## 1. DADOS DO PROJETO
- **Título:** ${v(p.titulo, 'TÍTULO')}
- **Natureza pretendida:** ${p.natureza ? nomeNatureza(p) : '{{PI ou MU}}'}
- **Contexto:** ${v(c.instituicao, 'INSTITUIÇÃO')}, ${v(c.ano, 'ANO')}. Possíveis inventores: ${v(c.inventores.replace(/\n/g, '; '), 'NOMES')}.
- **Datas de divulgação já ocorridas ou previstas:** ${divs || '{{DATAS E MEIOS}}'}
- **Objeto:** ${v(f.campo, 'DESCRIÇÃO DO OBJETO')}
- **Problema técnico a resolver:** ${v(f.problema, 'PROBLEMA')}
- **Solução proposta e princípio de funcionamento:** ${v(f.solucao, 'SOLUÇÃO')}
- **Características construtivas conhecidas:** ${comps || '{{COMPONENTES}}'}
- **Ensaios/resultados:** ${v(f.ensaios, 'ENSAIOS')}
- **Tecnologias concorrentes/comerciais de referência:** ${v(f.concorrentes, 'CONCORRENTES')}
- **Objetivo da busca:** novidade e atividade inventiva para depósito no INPI

## 3.1 Classificações (marcadas por aproximação — confirmar)
${classesBusca(p).length ? classesBusca(p).map(x => `- ${x} — ${tituloClasse(x) || 'classe indicada pelo usuário'}`).join('\n') : '- {{CLASSES ou "a definir pelo analista"}}'}

## 3.2 Famílias de termos (PT, EN, ES)
${fam}

Depositantes e inventores a pesquisar (estratégia E): ${[p.busca.depositantes, c.depositante, c.inventores].filter(Boolean).join('; ').replace(/\n/g, '; ') || '{{EMPRESAS, UNIVERSIDADES, INVENTORES}}'}

${MD_FIXO}
`;
}

/**
 * Lê um prompt de busca em .md (o padrão deste app ou um texto parecido) e devolve os campos encontrados.
 * Valores ainda com {{ }} são ignorados. Nunca apaga: quem chama decide preencher só o que está vazio.
 */
function lerMD(md) {
    const r = { ficha: {}, contexto: {}, termos: {}, classes: [], depositantes: '', datas: [] };
    const linhas = String(md || '').split(/\r?\n/);
    let secao = '';
    const limpo = s => s.replace(/\*\*/g, '').replace(/^[-*]\s*/, '').trim();
    let i = 0;
    /** Valor depois de "Rótulo:"; se a linha termina no ":", junta as linhas recuadas seguintes (a), b), - …). */
    const valor = (l, rotulo) => {
        const m = limpo(l).match(new RegExp('^(?:' + rotulo + ')[^:]*:\\s*(.*)$', 'i'));
        if (!m) return '';
        let v = m[1].trim();
        if (!v) {
            const extra = [];
            for (let j = i + 1; j < linhas.length && /^\s{2,}\S|^\s*[a-z]\)\s/.test(linhas[j]); j++) extra.push(limpo(linhas[j]));
            v = extra.join(' ');
        }
        return v && !v.includes('{{') ? v : '';
    };
    for (i = 0; i < linhas.length; i++) {
        const l = linhas[i];
        if (/^#{1,4}\s/.test(l) || /^[A-Z0-9. ]{4,}$/.test(l.trim()) || /^\s*\d+\.\d+\s+\S/.test(l)) secao = semAcento(l);
        const familias = /famil|termos/.test(secao);
        const pegar = (rot, alvo, chave) => { const x = valor(l, rot); if (x && !alvo[chave]) alvo[chave] = x; return !!x; };
        if (familias) {
            pegar('Objeto', r.termos, 'objeto'); pegar('Elemento', r.termos, 'elemento'); pegar('Orienta|Disposi', r.termos, 'orientacao');
            pegar('Geometria', r.termos, 'geometria'); pegar('Problema', r.termos, 'problema'); pegar('Condi', r.termos, 'condicao'); pegar('Fabrica', r.termos, 'fabricacao');
        } else {
            pegar('T[íi]tulo', r, 'titulo'); pegar('Objeto', r.ficha, 'campo'); pegar('Problema', r.ficha, 'problema');
            pegar('Solu', r.ficha, 'solucao'); pegar('Caracter[íi]sticas construtivas', r.ficha, 'construcao'); pegar('Ensaios', r.ficha, 'ensaios');
            pegar('Compara|Tecnologias concorrentes', r.ficha, 'concorrentes'); pegar('Contexto', r.contexto, 'texto');
            pegar('Natureza', r, 'natureza');
        }
        const area = l.match(/experi[êe]ncia em \*{0,2}([^*]+?)\*{0,2}\s*(\(|e est|$)/i);
        if (area && !area[1].includes('{{') && !r.area) r.area = area[1].trim();
        const dep = l.match(/^\s*[-*]?\s*\*{0,2}E\)\*{0,2}.*?:\s*(.+)$/) || l.match(/Depositantes e inventores a pesquisar[^:]*:\s*(.+)$/i);
        if (dep && !dep[1].includes('{{')) r.depositantes = dep[1].trim();
        for (const m of l.matchAll(/\b([A-H]\d{2}[A-Z])\s?(\d{1,4}\/\d{2,6})\b/g)) r.classes.push(m[1] + ' ' + m[2]);
        if (/divulga|defesa|congresso|publica/i.test(l)) for (const m of l.matchAll(/\b(\d{2})\/(\d{2})\/(\d{4})\b/g)) {
            const antes = l.slice(0, m.index).split(/[.;]/).pop().replace(/\*\*/g, '').trim();
            r.datas.push({ data: `${m[3]}-${m[2]}-${m[1]}`, meio: (antes || limpo(l)).replace(/\s+(em|no dia)$/i, '').slice(0, 80) });
        }
    }
    if (r.contexto.texto) {
        const t = r.contexto.texto;
        const ano = t.match(/\b(19|20)\d{2}\b/); if (ano) r.contexto.ano = ano[0];
        const inst = t.match(/(Universidade[^,.;(]+|UF[A-Z]{2,4}|Instituto[^,.;(]+)/); if (inst) r.contexto.instituicao = inst[0].trim();
        const pes = [...t.matchAll(/(?:Prof\.?\s*(?:Dr\.?|Dra\.?)?\s*)([A-ZÁÉÍÓÚ][\p{L}]+(?:\s+(?:de|da|do|dos)?\s*[A-ZÁÉÍÓÚ][\p{L}]+){1,4})/gu)].map(m => m[1].trim());
        if (pes.length) r.contexto.inventores = pes.join('\n');
    }
    r.classes = [...new Set(r.classes)];
    return r;
}

/** Aplica o que veio do .md sem apagar nada que o aluno já escreveu. Devolve a lista do que foi preenchido. */
function aplicarMD(p, md) {
    const d = lerMD(md), feito = [];
    const put = (obj, k, v, rot) => { if (v && !String(obj[k] || '').trim()) { obj[k] = v; feito.push(rot); } };
    put(p, 'titulo', (d.titulo || '').replace(/^["“”']+|["“”'.]+$/g, '').trim(), 'título'); put(p, 'area', d.area, 'área técnica');
    if (d.natureza && !p.natureza) { p.natureza = /utilidade|\bMU\b/i.test(d.natureza) ? 'MU' : /inven|\bPI\b/i.test(d.natureza) ? 'PI' : ''; if (p.natureza) feito.push('natureza'); }
    put(p.ficha, 'campo', d.ficha.campo, 'objeto/campo'); put(p.ficha, 'problema', d.ficha.problema, 'problema');
    put(p.ficha, 'solucao', d.ficha.solucao, 'solução'); put(p.ficha, 'ensaios', d.ficha.ensaios, 'ensaios'); put(p.ficha, 'concorrentes', d.ficha.concorrentes, 'concorrentes');
    if (d.ficha.construcao && !p.ficha.componentes.length) {
        p.ficha.componentes = d.ficha.construcao.split(/;\s*/).filter(Boolean).slice(0, 20).map((s, i) => {
            const m = s.match(/^\((\d+)\)\s*(.+)$/);
            const [nome, funcao] = (m ? m[2] : s).split(/\s+—\s+/);
            return { id: uid(), num: m ? m[1] : String(i + 1).padStart(2, '0'), nome: nome.trim(), funcao: (funcao || '').trim() };
        });
        feito.push('componentes');
    }
    put(p.contexto, 'instituicao', d.contexto.instituicao, 'instituição'); put(p.contexto, 'ano', d.contexto.ano, 'ano');
    put(p.contexto, 'inventores', d.contexto.inventores, 'inventores');
    for (const k of Object.keys(d.termos)) put(p.busca.termos, k, d.termos[k], 'termos: ' + k);
    put(p.busca, 'depositantes', d.depositantes, 'depositantes');
    const novas = d.classes.filter(c => !p.classes.marcadas.includes(c));
    if (novas.length) { p.classes.marcadas.push(...novas); feito.push(novas.length + ' classe(s)'); }
    for (const dt of d.datas) if (!p.contexto.divulgacoes.some(x => x.data === dt.data)) { p.contexto.divulgacoes.push({ id: uid(), ...dt }); feito.push('divulgação ' + dataBR(dt.data)); }
    p.busca.md = md;
    return feito;
}
