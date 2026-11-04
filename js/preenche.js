/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * PRÉ-PREENCHIMENTO EM CADEIA: o aluno começa pelo RESUMO e pelas REIVINDICAÇÕES; daí saem a ficha (campo, solução,
 * componentes, vantagens, aplicações), os termos e as classes da busca, o relatório, os desenhos e os formulários da
 * universidade. Também lê o RETORNO DA BUSCA colado (relatório de IA, PDF, planilha, formulário antigo) e leva as
 * contagens por base e os documentos para o Formulário de Busca de Anterioridade.
 * Regra: só preenche o que está vazio, e cada campo só uma vez (se o aluno apagar, não volta).
 */

'use strict';

function frases(t) { return String(t || '').replace(/\s+/g, ' ').match(/[^.!?]+[.!?]?/g)?.map(s => s.trim()).filter(s => s.length > 8) || []; }
function semFinal(t) { return String(t || '').trim().replace(/[.;:,]+$/, ''); }

/** Núcleo do resumo: "O presente modelo de utilidade trata de X (FIGURA 1) ..." → X. */
function objetoDoResumo(resumo) {
    const f = frases(resumo)[0] || '';
    const m = f.match(/(?:trata(?:-se)?|refere-se|consiste)\s+(?:de|a|em)\s+(.+)$/i);
    let x = m ? m[1] : f;
    x = x.replace(/\s*\(FIGURA\s*\d+\)/gi, '');
    return semFinal(x.split(/\s+que\s+(?:irá|vai|será|é|permite|possui)(?=\s)/i)[0]);
}

function autoPreencher(p) {
    const feito = [];
    const put = (caminho, valor, rot) => {
        if (!valor || p.autoFeito[caminho]) return;
        const atual = lerCaminho(p, caminho);
        if (String(atual || '').trim()) return;
        gravarCaminho(p, caminho, valor); p.autoFeito[caminho] = 1; feito.push(rot || caminho);
    };
    const rs = p.reivindicacoes.filter(r => r.texto.trim());
    const ind = rs.find(r => !r.dep);
    const nucleo = [p.resumo, ...rs.map(r => r.texto)].join(' \n ');

    // 1) resumo + reivindicações → ficha
    if (!p.ficha.componentes.length && !p.autoFeito.componentes) {
        const c = componentesDoTexto(nucleo + ' ' + Object.values(p.relatorio).join(' '));
        if (c.length) { p.ficha.componentes = c; p.autoFeito.componentes = 1; feito.push(`${c.length} componentes`); }
    }
    if (p.resumo) {
        put('ficha.campo', objetoDoResumo(p.resumo), 'para que serve');
        const fs = frases(p.resumo);
        put('ficha.aplicacoes', semFinal((fs.find(s => /aplicad|aplica[çc][ãa]o|utilizad|empregad/i.test(s)) || '').replace(/^.*?\b(?:aplicad[oa]s?|utilizad[oa]s?|empregad[oa]s?)\s+(?:em|no|na|nos|nas)\s+/i, '')), 'aplicações');
        put('ficha.vantagens', semFinal(fs.find(s => /possibilit|permit|garant|vantag|reduz|melhor|facilit|evita/i.test(s)) || ''), 'vantagens');
        const fig = p.resumo.match(/FIGURA\s*(\d+)/i); if (fig && !p.autoFeito.figuraResumo) { p.figuraResumo = fig[1]; p.autoFeito.figuraResumo = 1; }
    }
    if (ind) put('ficha.solucao', `${primeiraMinuscula(p.titulo || 'a invenção')} caracterizado por ${semFinal(ind.texto)}`, 'solução');
    if (rs.length > 1) put('ficha.vantagens', rs.filter(r => r.dep).slice(0, 3).map(r => semFinal(r.texto)).join('; '), 'vantagens');

    // 1b) ficha → resumo e reivindicações (quando o aluno começou pela ficha)
    const f0 = p.ficha;
    const fichaTem = !!(f0.campo.trim() || f0.solucao.trim()) && !!p.titulo.trim();
    if (fichaTem && !p.resumo.trim() && !p.autoFeito.resumo) {
        const t = RASCUNHOS.resumo(p);
        if (t) { p.resumo = t; p.autoFeito.resumo = 1; feito.push('resumo'); }
    }
    if (fichaTem && (f0.solucao.trim() || f0.componentes.length) && !p.reivindicacoes.some(r => r.texto.trim()) && !p.autoFeito.reivindicacoes) {
        p.reivindicacoes = rascunhoReivindicacoes(p); p.autoFeito.reivindicacoes = 1; feito.push(p.reivindicacoes.length + ' reivindicações');
    }
    if (!p.contexto.depositante && p.contexto.instituicao && !p.autoFeito.depositante) { p.contexto.depositante = p.contexto.instituicao; p.autoFeito.depositante = 1; }

    // 2) ficha → busca (termos) e classificação
    const antes = JSON.stringify(p.busca.termos);
    if (!p.autoFeito.termos && (p.titulo || p.ficha.solucao)) { preencherTermos(p); if (JSON.stringify(p.busca.termos) !== antes) { p.autoFeito.termos = 1; feito.push('termos da busca'); } }
    if (!p.classes.marcadas.length && !p.autoFeito.classes) {
        const sug = sugerirClasses(p, 3).filter(s => s.nota >= 40);
        if (sug.length) { p.classes.marcadas = sug.map(s => s.codigo); p.autoFeito.classes = 1; feito.push('classes (por aproximação)'); }
    }

    // 3) desenhos: o resumo e as reivindicações dizem quantas figuras há
    const figs = Math.max(0, ...[...nucleo.matchAll(/FIGURA\s*(\d+)/gi)].map(m => Number(m[1])));
    if (figs && p.desenhos.length < figs && !p.autoFeito.desenhos) {
        while (p.desenhos.length < figs) p.desenhos.push({ id: uid(), legenda: '', img: '' });
        p.autoFeito.desenhos = 1; feito.push(`${figs} figura(s)`);
    }
    p.desenhos.forEach((d, i) => {
        if (d.legenda || p.autoFeito['leg' + d.id]) return;
        const nums = componentesCitadosPerto(nucleo, i + 1);
        const comps = nums.map(n => componentePorNum(p, n)).filter(Boolean).map(c => `${c.nome.toLowerCase()} (${c.num})`);
        const leg = String(i + 1) === String(p.figuraResumo) ? `ilustra ${p.ficha.campo ? primeiraMinuscula(p.ficha.campo) : 'a invenção'}${comps.length ? ', com ' + listaComE(comps) : ''}` : (comps.length ? `ilustra ${listaComE(comps)}` : '');
        if (leg) { d.legenda = leg; p.autoFeito['leg' + d.id] = 1; feito.push(`legenda da FIGURA ${i + 1}`); }
    });

    // 4) relatório: rascunhos das seções vazias (usa a ficha e o retorno das buscas)
    for (const k of Object.keys(p.relatorio)) {
        if (k === 'fundamentos' && !p.busca.resultados.length && !p.ficha.estadoTecnica) continue;   // espera a busca
        put('relatorio.' + k, RASCUNHOS[k] ? RASCUNHOS[k](p) : '', 'relatório: ' + k);
    }

    // 5) universidade: tudo o que dá para tirar dos campos anteriores
    const u = p.universidade, f = p.ficha, r = p.relatorio;
    put('universidade.contexto', f.problema || paragrafos(r.problemaSolucao)[0], 'formulário 1.8a');
    put('universidade.comoHoje', f.estadoTecnica || paragrafos(r.fundamentos)[0], 'formulário 1.8b');
    put('universidade.resultado', f.vantagens || paragrafos(r.problemaSolucao).slice(-1)[0], 'formulário 1.8c');
    put('universidade.aplicacoesIndustriais', f.aplicacoes, 'formulário 1.8d');
    put('universidade.outrasAplicacoes', paragrafos(r.exemplos)[0], 'formulário 1.8e');
    const empresas = [f.concorrentes, ...new Set(p.busca.resultados.map(x => x.depositante).filter(Boolean))].filter(Boolean).join('; ');
    put('universidade.empresasMercado', empresas, 'formulário 2.4');
    if (p.titulo) put('universidade.objetoProjeto', `O desenvolvimento do ${maiusculo(p.titulo)} faz parte de ${{ TCC: 'um Trabalho de Conclusão de Curso', Tese: 'uma Tese', 'Dissertação': 'uma Dissertação', Pesquisa: 'um projeto de pesquisa', 'Extensão': 'um projeto de extensão' }[u.tipoProjeto] || 'um projeto'}${f.campo ? ' e tem o objetivo de oferecer ' + primeiraMinuscula(f.campo) : ''}.`, 'objeto do projeto');
    if (p.titulo) put('universidade.memorando.data', hojeISO(), 'data do memorando');
    if (!u.areasAbrangidas.length && !p.autoFeito.areas) {
        const subs = classesBusca(p).map(subclasse);
        const a = new Set();
        subs.forEach(s => { if (/^A01/.test(s)) a.add('Eng. Agrícola'); if (/^(G01|G05|G08|H01|H02|H04|G16)/.test(s)) a.add('Eng. Elétrica'); if (/^(B65|F15|F16|B29|B33)/.test(s)) a.add('Engenharia Mecânica'); if (/^G06/.test(s)) a.add('Ciência da Computação'); });
        if (a.size) { u.areasAbrangidas = [...a]; p.autoFeito.areas = 1; feito.push('áreas abrangidas'); }
    }
    if (!u.inventores.length && p.contexto.inventores && !p.autoFeito.inventores) {
        u.inventores = p.contexto.inventores.split('\n').map(s => s.trim()).filter(Boolean).map((nome, i) => Object.assign(inventorVazio(), { nome, notificante: i === 0 }));
        if (u.inventores.length) { p.autoFeito.inventores = 1; feito.push('inventores'); }
    }
    return feito;
}

/** Números de componentes citados na mesma frase que "FIGURA n" (ou, na falta, os do resumo). */
function componentesCitadosPerto(texto, n) {
    const fs = frases(texto).filter(s => new RegExp('FIGURA\\s*' + n + '\\b', 'i').test(s));
    return numerosNoTexto((fs.length ? fs : frases(texto).slice(0, 3)).join(' '));
}

// ------------------------------------------------------------ retorno da busca colado
const NOMES_BASE = [
    ['inpi', /\binpi\b|pepi/i], ['google', /google\s*patents|patents\.google/i], ['espacenet', /espacenet|\bepo\b/i],
    ['patentscope', /patentscope|\bwipo\b|\bompi\b/i], ['uspto', /uspto|ppubs|patft/i], ['scholar', /google\s*(acad[eê]mico|scholar)/i],
    ['scielo', /scielo/i], ['capes', /capes/i]
];
function baseDoTexto(t) { const b = NOMES_BASE.find(([, rx]) => rx.test(t)); return b ? b[0] : ''; }
const RX_PATENTE = /\b(?:BR|PI|MU|US|EP|WO|CN|DE|JP|ES|AR|GB|FR|CA|AU|KR|RU)\s?\d[\d\s.\-\/]{4,18}\d(?:\s?[A-Z]\d?)?\b/g;
function normNum(n) { return String(n || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function relevanciaDe(t) {
    const s = semAcento(t);
    const n = s.match(/\b([1-5])\b/); if (n) return Number(n[1]);
    if (/muito alta|altissima/.test(s)) return 5; if (/media.?alta|alta/.test(s)) return 4; if (/media/.test(s)) return 3; if (/baixa/.test(s)) return 2;
    return 3;
}

/**
 * Lê o texto colado e devolve { registro: [{base, consulta, n, triados}], resultados: [...], nota, achou }.
 * Entende tabelas em Markdown (| a | b |), tabelas com tabulação e linhas "palavra-chave / 123" debaixo do nome da base.
 */
function lerRetornoBusca(texto) {
    const linhas = String(texto || '').split(/\r?\n/);
    const registro = [], resultados = [];
    let base = '', nota = '', achou = null;
    const celulas = l => (l.includes('|') ? l.replace(/^\s*\||\|\s*$/g, '').split('|') : l.split('\t')).map(c => c.trim());
    const ehSeparador = l => /^\s*\|?\s*:?-{3,}/.test(l);
    for (let i = 0; i < linhas.length; i++) {
        const l = linhas[i];
        // tabela: linhas seguidas com | ou tab
        if ((l.includes('|') && (l.match(/\|/g) || []).length >= 2) || (l.split('\t').length >= 3)) {
            const bloco = [];
            while (i < linhas.length && ((linhas[i].includes('|') && (linhas[i].match(/\|/g) || []).length >= 2) || linhas[i].split('\t').length >= 3)) { if (!ehSeparador(linhas[i])) bloco.push(celulas(linhas[i])); i++; }
            i--;
            lerTabela(bloco, registro, resultados, base);
            continue;
        }
        const b = baseDoTexto(l);
        if (b && l.length < 120) base = b;
        // "Manômetro digital / 16"
        const m = l.match(/^\s*[-•*]?\s*(.+?)\s*\/\s*([\d.\s]+)\s*$/);
        if (m && base && !/\.\.\.|…/.test(m[1])) registro.push({ id: uid(), base, consulta: m[1].replace(/^\.+/, '').trim(), n: Number(m[2].replace(/[.\s]/g, '')), triados: '' });
        // documentos citados em listas ("- BR 10 2016 023064 B1 — título …")
        if (/^\s*([-•*]|\d+[.)])\s+/.test(l)) for (const x of l.matchAll(RX_PATENTE)) resultados.push({ num: x[0].trim(), titulo: semFinal(l.slice(x.index + x[0].length).replace(/^[\s—:–-]+/, '').split(/[.;]/)[0]).slice(0, 140), base: base ? BASES[base].nome : '', relevancia: relevanciaDe(l) });
        // conclusão / nota explicativa
        if (!nota && /resumo executivo|conclus|nota explicativa|avalia[cç][aã]o preliminar/i.test(l) && l.length < 90) {
            const corpo = [];
            for (let j = i + 1; j < linhas.length && corpo.join(' ').length < 900; j++) { const t = linhas[j].trim(); if (!t) { if (corpo.length) break; continue; } if (/^#|^\d+\.\s+[A-Z]/.test(t) && corpo.length) break; corpo.push(t.replace(/^[-•*]\s*/, '')); }
            nota = corpo.join(' ').replace(/\*\*/g, '').slice(0, 900);
        }
        if (/foram encontradas anterioridades/i.test(l)) achou = /\[\s*x\s*\]\s*sim|\(\s*x\s*\)\s*sim/i.test(l) ? true : /\[\s*x\s*\]\s*n[ãa]o|\(\s*x\s*\)\s*n[ãa]o/i.test(l) ? false : null;
    }
    // números citados em links do Google Patents
    for (const m of String(texto).matchAll(/patents\.google\.com\/patent\/([A-Z]{2}[0-9A-Z]+)/g)) resultados.push({ num: m[1], titulo: '', base: 'Google Patents', relevancia: 3, link: 'https://patents.google.com/patent/' + m[1] });
    // sem duplicados (a primeira ocorrência, mais completa, fica)
    const vistos = new Map();
    for (const r of resultados) { const k = normNum(r.num); if (!k) continue; const v = vistos.get(k); if (!v) vistos.set(k, r); else for (const c of Object.keys(r)) if (!v[c] && r[c]) v[c] = r[c]; }
    return { registro, resultados: [...vistos.values()], nota, achou };
}

function lerTabela(bloco, registro, resultados, baseAtual) {
    if (bloco.length < 2) return;
    const cab = bloco[0].map(c => semAcento(c.replace(/\*\*/g, '')));
    const col = rx => cab.findIndex(c => rx.test(c));
    const iSeq = col(/sequencia|palavra|consulta|query|termo|estrategia exata/), iN = col(/^resultados?$|localizad|retorno|encontrad|n.? de doc|qtd|quantidade|^n$/);
    const iBase = col(/^base|banco/), iTri = col(/triad/);
    const iNum = col(/^n[ºo°.]?$|numero|documento|registro|pedido|^doc/), iTit = col(/titulo|^nome/), iDep = col(/depositante|titular|assignee/);
    const iRel = col(/relev|proximidade|nivel/), iLink = col(/link|url/), iCat = col(/categoria|^cat/), iPub = col(/publica|prioridade/), iObs = col(/observa|diferen|coment|onde se encaixa|resumo|nota/), iSit = col(/situa/);
    const linhas = bloco.slice(1);
    if (iSeq >= 0 && iN >= 0) {
        for (const l of linhas) {
            const n = String(l[iN] || '').replace(/[.\s]/g, '').match(/\d+/);
            const b = baseDoTexto(iBase >= 0 ? l[iBase] : '') || baseAtual || 'outra';
            if (l[iSeq]) registro.push({ id: uid(), base: b, consulta: l[iSeq].replace(/`/g, ''), n: n ? Number(n[0]) : '', triados: iTri >= 0 ? (String(l[iTri]).match(/\d+/) || [''])[0] : '' });
        }
        return;
    }
    const temPatente = linhas.some(l => l.some(c => new RegExp(RX_PATENTE.source).test(c)));
    if (!temPatente && iNum < 0) return;
    for (const l of linhas) {
        const celNum = iNum >= 0 ? l[iNum] : l.find(c => new RegExp(RX_PATENTE.source).test(c));
        const num = ((celNum || '').match(new RegExp(RX_PATENTE.source)) || [celNum || ''])[0].trim();
        if (!num || num.length < 5) continue;
        const data = iPub >= 0 ? (String(l[iPub]).match(/(\d{2})\/(\d{2})\/(\d{4})/) || null) : null;
        resultados.push({
            num, titulo: iTit >= 0 ? l[iTit].replace(/\*\*/g, '') : '', depositante: iDep >= 0 ? l[iDep] : '', base: iBase >= 0 ? l[iBase] : (baseAtual ? BASES[baseAtual].nome : ''),
            relevancia: iRel >= 0 ? relevanciaDe(l[iRel]) : 3, link: iLink >= 0 ? (String(l[iLink]).match(/https?:\/\/\S+/) || [''])[0].replace(/[)\]]+$/, '') : '',
            categoria: iCat >= 0 ? (String(l[iCat]).match(/\b[XYAOL]\b/) || ['A'])[0] : '', publicacao: data ? `${data[3]}-${data[2]}-${data[1]}` : '',
            nota: [iObs >= 0 ? l[iObs] : '', iSit >= 0 && l[iSit] ? 'Situação: ' + l[iSit] : ''].filter(Boolean).join(' · ').replace(/\*\*/g, '').slice(0, 300)
        });
    }
}

/** Junta o retorno colado ao pedido: contagens, documentos e nota. Devolve um resumo do que entrou. */
function aplicarRetorno(p, texto) {
    const r = lerRetornoBusca(texto);
    const b = p.busca;
    b.retorno = (b.retorno ? b.retorno + '\n\n' : '') + texto;
    let nr = 0, nd = 0;
    for (const x of r.registro) if (!b.registroColado.some(y => y.base === x.base && y.consulta === x.consulta)) { b.registroColado.push(x); nr++; }
    for (const x of r.resultados) {
        const ja = b.resultados.find(y => normNum(y.num) === normNum(x.num));
        if (ja) { for (const k of ['titulo', 'link', 'depositante', 'publicacao']) if (!ja[k] && x[k]) ja[k] = x[k]; continue; }
        const cat = x.categoria || 'A';   // X/Y só quando o retorno disser; o aluno ajusta
        b.resultados.push(Object.assign({ id: uid(), num: '', titulo: '', base: '', link: '', relevancia: 3, lido: 'resumo', nota: '', carac: {}, categoria: cat, tipoDoc: 'Patente ou MU', publicacao: '', depositante: '' }, x, { categoria: cat }));
        nd++;
    }
    if (r.nota && !b.notaRetorno) b.notaRetorno = r.nota;
    if (r.achou !== null && !p.universidade.buscaResultado) p.universidade.buscaResultado = r.achou ? 'Sim' : 'Não';
    if (!p.fontes.some(f => f.nome === 'Retorno da busca de anterioridade')) p.fontes.push({ id: uid(), nome: 'Retorno da busca de anterioridade', tipo: 'texto', texto, data: hojeISO(), ativa: true });
    return { nr, nd, nota: !!r.nota };
}
