/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * FONTES (caderno parecido com o NotebookLM): o aluno junta TCC, artigos, relatórios de busca e anotações; o app
 * resume cada fonte, responde perguntas com trechos citados [1], [2]… e deixa inserir o trecho no campo em edição.
 * Também lê pedidos já escritos (.docx com RELATÓRIO, REIVINDICAÇÕES, DESENHOS, RESUMO) e monta o pacote para IA.
 * Tudo roda no navegador: nenhuma fonte sai do computador, a não ser que o aluno cole o pacote numa IA.
 */

'use strict';

/** Texto de um .docx (parágrafos de word/document.xml). */
async function textoDocx(arquivo) {
    const zip = await JSZip.loadAsync(arquivo);
    const xml = await zip.file('word/document.xml').async('string');
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    return [...doc.getElementsByTagNameNS(W, 'p')].map(p => {
        let t = '';
        for (const n of p.getElementsByTagNameNS(W, '*')) {
            if (n.localName === 't') t += n.textContent;
            else if (n.localName === 'tab') t += ' ';
        }
        const lista = p.getElementsByTagNameNS(W, 'numPr').length ? '• ' : '';
        return t.trim() ? lista + t.trim() : '';
    }).join('\n');
}

async function lerArquivoFonte(arq) {
    const nome = arq.name || 'arquivo';
    if (/\.docx$/i.test(nome)) return { nome, tipo: 'docx', texto: await textoDocx(arq) };
    if (/\.(txt|md|csv|json|html?)$/i.test(nome) || /^text\//.test(arq.type)) {
        let t = await arq.text();
        if (/\.html?$/i.test(nome)) t = new DOMParser().parseFromString(t, 'text/html').body.innerText;
        return { nome, tipo: nome.split('.').pop().toLowerCase(), texto: t };
    }
    if (/\.pdf$/i.test(nome)) throw new Error('PDF: abra o arquivo, selecione o texto (Ctrl+A, Ctrl+C) e use "Colar texto".');
    throw new Error('Formato não lido. Use .docx, .txt, .md ou cole o texto.');
}

// ------------------------------------------------------------ busca nos trechos
function trechosDaFonte(f) {
    const ps = String(f.texto || '').split(/\n+/).map(s => s.trim()).filter(s => s.length > 25);
    const out = [];
    let buf = '';
    for (const s of ps) {
        buf = buf ? buf + ' ' + s : s;
        if (buf.length > 320) { out.push(buf); buf = ''; }
    }
    if (buf) out.push(buf);
    return out;
}

/** Perguntar às fontes: devolve os melhores trechos [{ fonte, n (nº da fonte), texto, nota }]. */
function perguntarFontes(p, pergunta, max = 5) {
    const q = [...new Set(tokens(pergunta).map(radical))];
    if (!q.length) return [];
    const fontes = p.fontes.filter(f => f.ativa);
    const todos = [];
    fontes.forEach((f, i) => trechosDaFonte(f).forEach(t => todos.push({ fonte: f, n: p.fontes.indexOf(f) + 1, texto: t, rad: tokens(t).map(radical) })));
    const df = {};
    for (const t of todos) for (const r of new Set(t.rad)) df[r] = (df[r] || 0) + 1;
    const N = todos.length || 1;
    for (const t of todos) {
        let s = 0;
        for (const r of q) {
            const tf = t.rad.filter(x => x === r).length;
            if (tf) s += (1 + Math.log(tf)) * Math.log(1 + N / (df[r] || 1));
        }
        t.nota = s / Math.sqrt(1 + t.rad.length / 60);
    }
    return todos.filter(t => t.nota > 0).sort((a, b) => b.nota - a.nota).slice(0, max);
}

/** "Guia da fonte": primeiras frases + termos mais frequentes + números de patente citados. */
function guiaDaFonte(f) {
    const frases = String(f.texto || '').replace(/\s+/g, ' ').match(/[^.!?]{30,}[.!?]/g) || [];
    const cont = {};
    for (const w of tokens(f.texto)) if (w.length > 4) cont[w] = (cont[w] || 0) + 1;
    const termos = Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => x[0]);
    const pat = [...new Set((String(f.texto).match(/\b(?:BR|PI|MU|US|EP|WO|CN|DE|JP)\s?\d[\d\s.\-\/]{5,16}\d(?:\s?[A-Z]\d?)?/g) || []).map(s => s.replace(/\s+/g, ' ').trim()))].slice(0, 12);
    return { resumo: frases.slice(0, 2).join(' '), termos, patentes: pat, palavras: palavras(f.texto) };
}

/** Perguntas sugeridas (chips), como no NotebookLM, a partir da etapa atual. */
function perguntasSugeridas(p, etapa) {
    const base = {
        ficha: ['Qual problema a invenção resolve?', 'Quais são os componentes e suas funções?', 'Quais vantagens em relação ao que existe?'],
        buscas: ['Quais patentes são citadas?', 'Quais termos técnicos e sinônimos aparecem?', 'Quem são os fabricantes concorrentes?'],
        relatorio: ['Como funciona a invenção passo a passo?', 'Quais resultados de ensaio foram obtidos?', 'Em que áreas pode ser aplicada?'],
        reivindicacoes: ['Quais características são essenciais?', 'O que diferencia dos documentos encontrados?'],
        resumo: ['Qual é o objetivo principal da invenção?']
    };
    return base[etapa] || ['Do que trata a invenção?', 'Quais são os componentes?', 'Quais patentes são citadas?'];
}

// ------------------------------------------------------------ pedido existente (.docx)
/** Reconhece os 4 documentos do INPI pelo título no topo e devolve os campos para o pedido. */
function lerPedidoExistente(texto) {
    const linhas = String(texto || '').split('\n').map(s => s.trim()).filter(Boolean);
    const topo = semAcento(linhas[0] || '');
    const r = {};
    const sem = s => s.replace(/^•\s*/, '');
    if (/^reivindica/.test(topo)) {
        r.tipo = 'reivindicacoes';
        r.reivindicacoes = [];
        for (const l of linhas.slice(1).map(sem)) {
            const m = l.match(/^(?:\d+\s*[.)-]\s*)?(.+?),?\s+(de acordo com (?:a|as) reivindica[çc](?:[ãa]o|[õo]es)\s+(\d+)[^,]*?[,]?\s*)?(caracterizad[oa]\s+(?:pelo fato de|por|pelo|pela|em))\s*(.+)$/i);
            if (m) {
                const pre = m[1].replace(/,\s*$/, '').trim();
                if (!r.titulo || pre.length > r.titulo.length) r.titulo = pre;   // o preâmbulo mais longo é o título completo
                const expr = m[4].toLowerCase().replace(/\s+/g, ' ');
                r.reivindicacoes.push({ dep: m[3] ? Number(m[3]) : null, preambulo: pre, expressao: EXPRESSOES.includes(expr) ? expr : '', texto: m[5].replace(/\.$/, '') });
            }
        }
        // o preâmbulo igual ao título fica vazio (= título completo)
        for (const x of r.reivindicacoes) if (r.titulo && semAcento(x.preambulo) === semAcento(r.titulo)) x.preambulo = '';
        for (const x of r.reivindicacoes) if (x.expressao === 'caracterizado por' || x.expressao === 'caracterizada por') x.expressao = '';
    } else if (/^resumo/.test(topo)) {
        r.tipo = 'resumo';
        r.titulo = linhas[1] && linhas[1] === maiusculo(linhas[1]) ? linhas[1] : '';
        r.resumo = linhas.slice(r.titulo ? 2 : 1).map(sem).join('\n\n');
        const fig = r.resumo.match(/FIGURA\s*(\d+)/i); if (fig) r.figuraResumo = fig[1];
    } else if (/^desenhos/.test(topo)) {
        r.tipo = 'desenhos';
        r.figuras = linhas.filter(l => /^fig(ura)?\.?\s*\d+/i.test(l)).length;
    } else {
        r.tipo = 'relatorio';
        r.titulo = linhas[0];
        const sec = { campo: /^campo/, fundamentos: /^(fundamentos|estado da t)/, problemaSolucao: /^(problema|objetivo|sumario|sumário)/, desenhos: /^breve descri/, descricao: /^descri[cç][aã]o (detalhada )?da inven|^descri[cç][aã]o da/, exemplos: /^(exemplo|concretiza|melhor forma)/ };
        let atual = null; r.relatorio = {};
        for (const l of linhas.slice(1)) {
            const k = Object.keys(sec).find(k => sec[k].test(semAcento(l).replace(/^\d+\s*[.-]\s*/, '')) && l.length < 70);
            if (k) { atual = k; r.relatorio[k] = ''; continue; }
            if (atual) r.relatorio[atual] += (r.relatorio[atual] ? '\n\n' : '') + sem(l).replace(/^\[?\d{1,4}\]?\s*[.-]?\s+(?=[A-ZÁÉÍÓÚ])/, '');
        }
        // separa motivação do estado da técnica (parágrafo que fala de "motivou", "objetivo", "problema")
        if (r.relatorio.fundamentos && !r.relatorio.problemaSolucao) {
            const ps = paragrafos(r.relatorio.fundamentos);
            const i = ps.findIndex((x, j) => j > 0 && /^(o que motivou|a motiva|o objetivo|o problema)|motivou o desenvolvimento|objetivo da (presente )?inven/i.test(x));
            if (i > 0) { r.relatorio.problemaSolucao = ps.slice(i).join('\n\n'); r.relatorio.fundamentos = ps.slice(0, i).join('\n\n'); }
        }
    }
    return r;
}

/** Componentes numerados que aparecem no texto, ex.: "bateria (01)". */
function componentesDoTexto(texto) {
    const out = new Map();
    for (const m of String(texto || '').matchAll(/([A-Za-zÀ-ú][A-Za-zÀ-ú\s\-“”"/]{2,40}?)\s*\((\d{1,3})(?:\s*e\s*\d{1,3})?\)/g)) {
        const num = m[2].padStart(2, '0');
        const vazias = /^(um|uma|o|a|os|as|de|do|da|dos|das|pelo|pela|no|na|nos|ao|à|e|com|seguido|seguida|temos|há|onde|por|para|em|via|bloco|etapa|que|se|seu|sua|através|ligadas|ligada|ligado|realizadas|realizada|mediante)$/i;
        let ws = m[1].replace(/[“”"]/g, '').trim().split(/\s+/).slice(-5);
        while (ws.length > 1 && /^(no|na|do|da|bloco|via)$/i.test(ws[ws.length - 1])) ws.pop();
        if (ws.length > 2 && /^(no|na)$/i.test(ws[ws.length - 2])) ws = ws.slice(0, -2);
        const art = ws.slice(0, -1).map(w => /^(um|uma|o|a|os|as)$/i.test(w)).lastIndexOf(true);
        if (art >= 0) ws = ws.slice(art + 1);
        while (ws.length > 1 && vazias.test(ws[0])) ws.shift();
        while (ws.length > 2 && /(am|em|ou|iu|ava|ia)$/i.test(ws[0]) && !/^(sistema|bem|item)$/i.test(ws[0])) ws.shift();
        let nome = ws.join(' ');
        if (!out.has(num) && nome.length > 2) out.set(num, nome);
    }
    return [...out.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([num, nome]) => ({ id: uid(), num, nome, funcao: '' }));
}

// ------------------------------------------------------------ pacote para IA
const IA_FORMATO = 'apoio-escrita-patentes-ia';

function pacoteIA(p, etapa) {
    const fontes = p.fontes.filter(f => f.ativa).map((f, i) => `### Fonte [${i + 1}] ${f.nome}\n${String(f.texto).slice(0, 12000)}`).join('\n\n');
    const ficha = JSON.stringify({ natureza: nomeNatureza(p), titulo: p.titulo, area: p.area, ficha: p.ficha, classes: classesBusca(p), resultados: p.busca.resultados.map(r => ({ num: r.num, titulo: r.titulo, relevancia: r.relevancia, nota: r.nota })) }, null, 1);
    return `Você é um redator de patentes no Brasil (INPI). Ajude um estudante a escrever um pedido de ${nomeNatureza(p)}.
Use SOMENTE as fontes e a ficha abaixo; não invente números de patente, dados de ensaio ou componentes. Quando faltar informação, escreva [COMPLETAR: …].
Regras do INPI a seguir: relatório descritivo com campo da invenção, estado da técnica (fundamentos), problema e solução, breve descrição dos desenhos, descrição detalhada e exemplos de concretização, em parágrafos numerados; reivindicações numeradas, cada uma numa única frase, começando pelo título e com a expressão "caracterizado por"; as dependentes começam com "${tituloPedido(p)} de acordo com a reivindicação N"; números de referência dos componentes entre parênteses, iguais em todos os documentos; resumo entre 50 e 200 palavras indicando a figura mais representativa.${p.natureza === 'MU' ? ' Por ser modelo de utilidade, use uma só reivindicação independente e descreva o objeto pela forma ou disposição, com desenhos obrigatórios.' : ''}
Etapa em que o estudante está: ${etapa}.
Se você precisar acessar sites e aparecer CAPTCHA, verificação de segurança ou login, pare e peça ao estudante que resolva manualmente; depois continue.

RESPONDA APENAS com um JSON no formato abaixo (deixe "" no que não souber):
{"formato":"${IA_FORMATO}","titulo":"","relatorio":{"campo":"","fundamentos":"","problemaSolucao":"","desenhos":"","descricao":"","exemplos":""},"reivindicacoes":[{"dep":null,"texto":"característica que vem depois de 'caracterizado por'"}],"resumo":"","componentes":[{"num":"01","nome":"","funcao":""}],"termos":{"objeto":"","elemento":"","orientacao":"","geometria":"","problema":"","condicao":""},"observacoes":""}

## Ficha da invenção
${ficha}

## Fontes
${fontes || '(nenhuma fonte adicionada)'}
`;
}

function extrairJsonIA(texto) {
    const t = String(texto || '');
    const ini = t.indexOf('{'), fim = t.lastIndexOf('}');
    if (ini < 0 || fim <= ini) throw new Error('Não achei um JSON na resposta.');
    const obj = JSON.parse(t.slice(ini, fim + 1));
    if (obj.formato && obj.formato !== IA_FORMATO) throw new Error('O JSON não é deste aplicativo.');
    return obj;
}

/** Aplica a resposta da IA só onde está vazio. Devolve a lista do que entrou. */
function aplicarRespostaIA(p, obj) {
    const feito = [];
    const put = (alvo, k, v, rot) => { if (v && typeof v === 'string' && !String(alvo[k] || '').trim()) { alvo[k] = v.trim(); feito.push(rot); } };
    put(p, 'titulo', obj.titulo, 'título');
    for (const k of Object.keys(p.relatorio)) put(p.relatorio, k, obj.relatorio && obj.relatorio[k], 'relatório: ' + k);
    put(p, 'resumo', obj.resumo, 'resumo');
    if (Array.isArray(obj.reivindicacoes) && !p.reivindicacoes.some(r => r.texto.trim())) {
        p.reivindicacoes = obj.reivindicacoes.filter(r => r && r.texto).map(r => ({ id: uid(), dep: r.dep ? Number(r.dep) : null, texto: String(r.texto).trim() }));
        if (p.reivindicacoes.length) feito.push(p.reivindicacoes.length + ' reivindicações');
    }
    if (Array.isArray(obj.componentes) && !p.ficha.componentes.length) {
        p.ficha.componentes = obj.componentes.filter(c => c && c.nome).map(c => ({ id: uid(), num: String(c.num || ''), nome: c.nome, funcao: c.funcao || '' }));
        if (p.ficha.componentes.length) feito.push('componentes');
    }
    if (obj.termos) for (const k of Object.keys(p.busca.termos)) put(p.busca.termos, k, obj.termos[k], 'termos: ' + k);
    return feito;
}
