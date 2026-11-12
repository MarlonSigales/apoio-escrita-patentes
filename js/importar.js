/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * IMPORTAR DOCUMENTOS .DOCX JÁ FEITOS
 * - O pedido inteiro num arquivo só (RELATÓRIO DESCRITIVO, REIVINDICAÇÕES, DESENHOS e RESUMO, em qualquer ordem) ou um
 *   arquivo por documento: cada parte vai para o seu lugar. As figuras viram células editáveis do editor de desenhos
 *   (imagem de fundo + setas, textos e a seleção de área ⬚), na ordem em que aparecem no Word, com as legendas tiradas
 *   da breve descrição dos desenhos.
 * - Cada um dos 8 documentos pode ser importado na própria página: relatório, reivindicações, desenhos, resumo,
 *   memorando, formulário de informação tecnológica, formulário de busca e relatório da busca (feitos por este app ou
 *   no mesmo modelo).
 * - Antes de aplicar, o pedido é copiado (↶ Desfazer importação). Com conteúdo no pedido, o app pergunta se substitui
 *   ou só completa o que está vazio.
 */

'use strict';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const SECOES_DOCX = [['relatorio', /^relat[oó]rio descritivo$/i], ['reivindicacoes', /^reivindica[cç][oõ]es$/i], ['desenhos', /^(desenhos|figuras)$/i], ['resumo', /^resumo$/i]];

// ------------------------------------------------------------ leitura do .docx (texto, tabelas e imagens, na ordem)
/**
 * Lê o .docx: { linhas: [{ texto, imgs: [n], tab }], tabelas: [[[célula]]], imagens: [Blob] }.
 * `linhas` segue a ordem do documento (as células das tabelas também entram, uma linha por parágrafo, como em textoDocx).
 */
async function lerDocxEstruturado(arquivo) {
    const zip = await JSZip.loadAsync(arquivo);
    const doc = zip.file('word/document.xml');
    if (!doc) throw new Error('não é um .docx do Word.');
    const xml = new DOMParser().parseFromString(await doc.async('string'), 'application/xml');
    const relsArq = zip.file('word/_rels/document.xml.rels');
    const rels = {};
    if (relsArq) for (const r of new DOMParser().parseFromString(await relsArq.async('string'), 'application/xml').getElementsByTagName('Relationship')) rels[r.getAttribute('Id')] = r.getAttribute('Target');
    const imagens = [], porRid = {};
    const imagemDe = async rid => {
        if (rid in porRid) return porRid[rid];
        const alvo = rels[rid]; porRid[rid] = -1;
        if (!alvo || /^https?:/i.test(alvo)) return -1;
        const caminho = alvo.startsWith('/') ? alvo.slice(1) : 'word/' + alvo.replace(/^\.\//, '');
        const f = zip.file(caminho); if (!f) return -1;
        const ext = caminho.split('.').pop().toLowerCase();
        const tipo = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', svg: 'image/svg+xml', webp: 'image/webp' }[ext];
        if (!tipo) return -1;                                           // EMF/WMF: o navegador não mostra
        imagens.push(new Blob([await f.async('uint8array')], { type: tipo }));
        return (porRid[rid] = imagens.length - 1);
    };
    const textoP = async pEl => {
        let t = ''; const imgs = [];
        for (const n of pEl.getElementsByTagName('*')) {
            if (n.namespaceURI === W_NS && n.localName === 't') t += n.textContent;
            else if (n.namespaceURI === W_NS && (n.localName === 'tab')) t += '\t';
            else if (n.namespaceURI === W_NS && (n.localName === 'br' || n.localName === 'cr')) t += '\n';
            else if (n.localName === 'blip') { const rid = n.getAttributeNS(R_NS, 'embed') || n.getAttribute('r:embed'); if (rid) { const i = await imagemDe(rid); if (i >= 0) imgs.push(i); } }
            else if (n.localName === 'imagedata') { const rid = n.getAttributeNS(R_NS, 'id') || n.getAttribute('r:id'); if (rid) { const i = await imagemDe(rid); if (i >= 0) imgs.push(i); } }
        }
        const lista = pEl.getElementsByTagNameNS(W_NS, 'numPr').length ? '• ' : '';
        t = t.replace(/[  ]+/g, ' ').replace(/ *\t */g, '\t').trim();
        return { texto: t ? lista + t : '', imgs };
    };
    const linhas = [], tabelas = [];
    const corpo = xml.getElementsByTagNameNS(W_NS, 'body')[0];
    const visitar = async (no, naTabela) => {
        for (const filho of no.children) {
            if (filho.namespaceURI !== W_NS) { await visitar(filho, naTabela); continue; }   // sdt, ins, etc.
            if (filho.localName === 'p') { const l = await textoP(filho); if (l.texto || l.imgs.length) linhas.push(Object.assign(l, { tab: naTabela })); }
            else if (filho.localName === 'tbl') {
                const tab = [];
                for (const tr of filho.children) {
                    if (tr.localName !== 'tr') continue;
                    const linha = [];
                    for (const tc of tr.children) {
                        if (tc.localName !== 'tc') continue;
                        const ps = [];
                        for (const pEl of tc.getElementsByTagNameNS(W_NS, 'p')) { const l = await textoP(pEl); if (l.texto || l.imgs.length) { linhas.push(Object.assign(l, { tab: true })); if (l.texto) ps.push(l.texto); } }
                        linha.push(ps.join('\n'));
                    }
                    tab.push(linha);
                }
                tabelas.push(tab);
            } else if (filho.localName !== 'sectPr') await visitar(filho, naTabela);
        }
    };
    if (corpo) await visitar(corpo, false);
    return { linhas, tabelas, imagens };
}

/** Separa o arquivo nas partes do pedido do INPI. Sem títulos de seção, o arquivo inteiro é uma parte só. */
function separarPartesPedido(linhas) {
    const marcas = [];
    linhas.forEach((l, i) => { const t = l.texto.replace(/^•\s*/, '').trim(); const s = SECOES_DOCX.find(([, rx]) => rx.test(t)); if (s && !l.tab) marcas.push([i, s[0]]); });
    if (!marcas.length) return [{ tipo: null, linhas }];
    const partes = [];
    if (marcas[0][0] > 0) {
        const antes = linhas.slice(0, marcas[0][0]);
        if (antes.some(l => l.texto.length > 60)) partes.push({ tipo: 'relatorio', linhas: antes });   // relatório sem o título "RELATÓRIO DESCRITIVO"
    }
    marcas.forEach(([i, tipo], k) => {
        const fim = k + 1 < marcas.length ? marcas[k + 1][0] : linhas.length;
        partes.push({ tipo, linhas: linhas.slice(tipo === 'relatorio' ? i + 1 : i, fim) });
    });
    return partes;
}

const textoDe = ls => ls.map(l => l.texto).filter(Boolean).join('\n').replace(/\t/g, ' ');

/** Legendas a partir da breve descrição dos desenhos: "A FIGURA 2 ilustra…" → { 2: 'ilustra…' }. */
function legendasDaBreveDescricao(texto) {
    const out = {};
    for (const m of String(texto || '').matchAll(/FIG(?:URA|\.)?\s*(\d+)\s*[-–—:,]?\s*([^]*?)(?=(?:;\s*|\.\s+|\n|^)\s*(?:e\s+)?(?:a\s+)?FIG(?:URA|\.)?\s*\d+|$)/gim)) {
        let leg = m[2].replace(/\s+/g, ' ').trim().replace(/[;.]\s*$/, '').replace(/^(?:é|e)\s+/i, '');
        if (leg && !/^(ilustra|mostra|apresenta|representa|demonstra|exibe|descreve)\b/i.test(leg)) leg = 'ilustra ' + leg.charAt(0).toLowerCase() + leg.slice(1);
        if (leg && !out[m[1]]) out[m[1]] = leg.slice(0, 300);
    }
    return out;
}

/** Interpreta as partes do pedido do INPI. Devolve { titulo, natureza, relatorio, reivindicacoes, resumo, figuraResumo, figuras: [{ imgs, legenda }] }. */
function interpretarPedidoDocx(est, so) {
    const partes = separarPartesPedido(est.linhas);
    const r = { partes: [] };
    for (const parte of partes) {
        const txt = textoDe(parte.linhas);
        let tipo = parte.tipo;
        if (!tipo) tipo = lerPedidoExistente(txt).tipo;
        if (so && tipo !== so) continue;
        r.partes.push(tipo);
        if (tipo === 'desenhos') {
            const figs = [];
            // cada figura: as imagens até a próxima legenda "Figura N" (ou a própria imagem, quando não há legendas)
            let atual = null;
            for (const l of parte.linhas) {
                const leg = l.texto.match(/^FIG(?:URA|\.)?\s*(\d+)\s*[-–—:.]?\s*(.*)$/i);
                if (l.imgs.length) for (const i of l.imgs) { atual = { imgs: [i], legenda: '' }; figs.push(atual); }
                if (leg) { if (atual && !atual.rotulo) { atual.rotulo = leg[1]; if (leg[2]) atual.legenda = leg[2]; } else if (!l.imgs.length) { atual = { imgs: [], legenda: leg[2] || '', rotulo: leg[1] }; figs.push(atual); } }
            }
            r.figuras = figs;
            if (/modelo de utilidade/i.test(txt)) r.natureza = r.natureza || 'MU';
        } else {
            const x = lerPedidoExistente(tipo === 'relatorio' ? txt : txt);
            if (tipo === 'relatorio') { r.relatorio = x.relatorio || {}; for (const k of Object.keys(r.relatorio)) r.relatorio[k] = juntarQuebrados(r.relatorio[k]); if (x.titulo && !SECOES_DOCX.some(([, rx]) => rx.test(x.titulo))) r.titulo = r.titulo || x.titulo; if (/modelo de utilidade/i.test(txt)) r.natureza = 'MU'; else if (/patente de inven/i.test(txt)) r.natureza = r.natureza || 'PI'; }
            if (tipo === 'reivindicacoes') { r.reivindicacoes = x.reivindicacoes || []; if (x.titulo) r.tituloReiv = x.titulo; }
            if (tipo === 'resumo') { r.resumo = x.resumo; r.figuraResumo = x.figuraResumo; if (x.titulo) r.titulo = r.titulo || x.titulo; }
        }
    }
    // imagens fora de uma parte "DESENHOS" (ex.: arquivo só com as figuras)
    if (!r.figuras && (!so || so === 'desenhos') && est.imagens.length && (so === 'desenhos' || !r.partes.length || partes.length === 1 && !partes[0].tipo && r.partes[0] === 'desenhos')) {
        r.figuras = est.imagens.map((_, i) => ({ imgs: [i], legenda: '' }));
        if (!r.partes.includes('desenhos')) r.partes.push('desenhos');
    }
    if (r.titulo) r.titulo = r.titulo === maiusculo(r.titulo) ? r.titulo.charAt(0) + r.titulo.slice(1).toLowerCase() : r.titulo;
    return r;
}

/** Aplica o pedido lido ao pedido aberto. modo: 'substituir' ou 'completar'. Devolve a lista do que entrou. */
async function aplicarPedidoDocx(p, r, est, modo) {
    const feito = [];
    const troca = atual => modo === 'substituir' || !String(atual ?? '').trim();
    if (r.titulo && troca(p.titulo) && r.titulo !== p.titulo) { p.titulo = r.titulo; feito.push('título'); }
    if (r.natureza && troca(p.natureza) && r.natureza !== p.natureza) { p.natureza = r.natureza; feito.push('natureza ' + r.natureza); }
    if (r.relatorio) for (const k of Object.keys(p.relatorio)) { const v = String(r.relatorio[k] || '').trim(); if (v && troca(p.relatorio[k]) && v !== p.relatorio[k]) { p.relatorio[k] = v; p.autoFeito['relatorio.' + k] = 1; feito.push('relatório: ' + k); } }
    if (r.reivindicacoes && r.reivindicacoes.length && (modo === 'substituir' || !p.reivindicacoes.some(x => x.texto.trim()))) {
        p.reivindicacoes = r.reivindicacoes.map(x => ({ id: uid(), preambulo: '', expressao: '', ...x })); p.autoFeito.reivindicacoes = 1; feito.push(r.reivindicacoes.length + ' reivindicações');
    }
    if (r.resumo && troca(p.resumo)) { p.resumo = r.resumo; feito.push('resumo'); if (r.figuraResumo) p.figuraResumo = r.figuraResumo; }
    if (r.figuras && r.figuras.length) {
        const legBreve = legendasDaBreveDescricao((r.relatorio && r.relatorio.desenhos) || p.relatorio.desenhos);
        const subst = modo === 'substituir' || !p.desenhos.some(d => d.img || (d.elementos || []).length);
        let novas = 0, imgs = 0;
        if (subst) p.desenhos = [];
        for (let i = 0; i < r.figuras.length; i++) {
            const f = r.figuras[i], n = String(f.rotulo || i + 1);
            let d = p.desenhos[i];
            if (!d) { d = normalizarFigura({ id: uid(), legenda: '', img: '', elementos: [] }); p.desenhos.push(d); novas++; }
            const leg = (f.legenda && f.legenda.length > 3 ? f.legenda : '') || legBreve[n] || '';
            if (leg && troca(d.legenda)) d.legenda = /^(ilustra|mostra|apresenta|representa|demonstra)/i.test(leg) ? leg : 'ilustra ' + leg.charAt(0).toLowerCase() + leg.slice(1);
            if (f.imgs.length && (subst || !d.img)) {
                const blob = est.imagens[f.imgs[0]];
                d.img = await Imagens.guardar(blob); d.elementos = d.elementos || [];
                if (!d.elementos.length) await ajustarTamanhoPelaImagem(d, blob);
                imgs++;
            }
        }
        if (novas || imgs) feito.push(`${r.figuras.length} figura(s) editável(is)${imgs ? ' com imagem' : ''}`);
    }
    return feito;
}

/** Depois de importar: legendas vazias saem da breve descrição; componentes e ficha nascem do texto (só acrescenta). */
function completarFichaImportada(p) {
    const feito = [];
    const leg = legendasDaBreveDescricao(p.relatorio.desenhos);
    let nl = 0;
    p.desenhos.forEach((d, i) => { if (!d.legenda && leg[String(i + 1)]) { d.legenda = leg[String(i + 1)]; nl++; } });
    if (nl) feito.push(nl + ' legenda(s)');
    const achados = componentesDoTexto([p.relatorio.desenhos, p.relatorio.descricao, p.relatorio.exemplos, p.relatorio.campo, p.resumo, ...p.reivindicacoes.map(x => x.texto)].join(' '));
    const novos = achados.filter(c => !p.ficha.componentes.some(x => n2(x.num) === n2(c.num)));
    if (novos.length) { p.ficha.componentes.push(...novos); p.ficha.componentes.sort((a, b) => Number(a.num) - Number(b.num)); feito.push(novos.length + ' componente(s)'); }
    if (!p.ficha.campo && p.relatorio.campo) p.ficha.campo = p.relatorio.campo.replace(/^O objeto do presente pedido de [^,]+? trata-se de /i, '');
    if (!p.ficha.problema && p.relatorio.problemaSolucao) p.ficha.problema = paragrafos(p.relatorio.problemaSolucao)[0];
    if (!p.ficha.solucao && p.relatorio.descricao) p.ficha.solucao = paragrafos(p.relatorio.descricao)[0];
    if (!p.ficha.estadoTecnica && p.relatorio.fundamentos) p.ficha.estadoTecnica = paragrafos(p.relatorio.fundamentos)[0];
    return feito;
}

/** Junta parágrafos quebrados no Word (o pedaço que começa com letra minúscula continua o anterior). */
function juntarQuebrados(t) {
    const ps = paragrafos(t), out = [];
    for (const x of ps) { if (out.length && /^[a-zà-ú]/.test(x) && !/[.:;!?]$/.test(out[out.length - 1])) out[out.length - 1] += ' ' + x; else out.push(x); }
    return out.join('\n\n');
}

// ------------------------------------------------------------ formulários da universidade e da busca
const semMarcadorVazio = s => { const t = String(s || '').trim(); return /^\[?\s*(COMPLETAR|n[ºo]|marcar|nenhuma?)\s*\]?\.?$/i.test(t) || /^\[COMPLETAR[^\]]*\]$/i.test(t) ? '' : t; };
/** Opção marcada "( x ) OPÇÃO" (ou "[ x ]") dentro de uma linha, entre as opções conhecidas. */
function opcaoMarcada(linha, opcoes) {
    const t = semAcento(linha);
    return opcoes.find(o => new RegExp('[(\\[]\\s*x\\s*[)\\]]\\s*' + semAcento(o).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(t)) || '';
}
/** Texto entre um rótulo e o próximo rótulo conhecido. */
function textoApos(ls, rx, fim) {
    const i = ls.findIndex(l => rx.test(semAcento(l)));
    if (i < 0) return null;
    const out = [];
    for (const l of ls.slice(i + 1)) { if (fim.some(f => f.test(semAcento(l)))) break; out.push(l); }
    return semMarcadorVazio(out.join('\n\n'));
}
const dataDeBR = s => { const m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };

function interpretarMemorando(ls) {
    const r = {}, t = ls.join('\n');
    const m = t.match(/Memorando\s*n[ºo°.]*\s*([^/\n]*)\/(\d{4})\/([^\s\n]+)/i);
    if (m) { r.numero = semMarcadorVazio(m[1].replace(/[[\]]/g, '').trim()); r.ano = m[2]; r.siglaUnidade = m[3]; }
    const de = t.match(/^Ao\(À\)\s*(.+)$/m) || t.match(/^(?:Ao|À)\s+(.+)$/m); if (de) r.destinatario = de[1].trim();
    const as = t.match(/^Assunto:\s*(.+)$/m); if (as) r.assunto = as[1].trim();
    const tit = t.match(/intitulad[oa]\s*["“](.+?)["”]/i); if (tit) r.titulo = tit[1];
    const dt = t.match(/^([A-Za-zÀ-ú .'-]+),\s*(\d{2}\/\d{2}\/\d{4})\.?$/m); if (dt) { r.cidade = dt[1].trim(); r.data = dataDeBR(dt[2]); }
    return r;
}

function interpretarInfotec(ls, tabelas) {
    const r = { univ: {}, inventores: [] }, u = r.univ, j = ls.join('\n');
    const linha = rx => ls.find(l => rx.test(semAcento(l))) || '';
    u.areaPredominante = opcaoMarcada(linha(/^1\.1\.1/), AREAS_PREDOMINANTES);
    const abr = linha(/^1\.1\.2/); u.areasAbrangidas = AREAS_ABRANGIDAS.filter(a => opcaoMarcada(abr, [a]));
    u.consiste = opcaoMarcada(j, CONSISTE);
    const i13 = ls.findIndex(l => /^1\.3/.test(semAcento(l)));
    if (i13 >= 0) {
        r.divulgacoes = [];
        for (const l of ls.slice(i13 + 1, i13 + 12).flatMap(x => x.split('\n'))) { if (/^(\*|1\.4)/.test(l)) break; const d = l.match(/^-\s*(.*?)\s*[—-]\s*Data:\s*(\d{2}\/\d{2}\/\d{4})/); if (d) r.divulgacoes.push({ meio: d[1], data: dataDeBR(d[2]) }); }
    }
    const l141 = linha(/^1\.4\.1/); u.patrimonioGenetico = opcaoMarcada(l141, ['Material biológico', 'Conhecimento Tradicional', 'Nenhum']).replace('Conhecimento Tradicional', 'Conhecimento tradicional') || '';
    u.faunaFlora = opcaoMarcada(linha(/^1\.4\.2/), ['Sim', 'Não']);
    u.conhecimentoTradicional = opcaoMarcada(linha(/^1\.4\.3/), ['Sim', 'Não']);
    const prox = [/^1\.\d/, /^[a-e]\.\s/, /^secao \d/, /^2\.\d/];
    r.titulo = textoApos(ls, /^1\.5\b/, prox);
    r.campo = textoApos(ls, /^1\.7\b/, prox);
    const sec = [['contexto', /^a\. contexto/], ['comoHoje', /^b\. como/], ['resultado', /^c\. qual o resultado/], ['aplicacoesIndustriais', /^d\. quais as possiveis/], ['outrasAplicacoes', /^e\. outras/]];
    for (const [k, rx] of sec) u[k] = textoApos(ls, rx, prox);
    const l21 = linha(/^2\.1/);
    if (l21) { const s = l21.match(/\(\s*x\s*\)\s*Sim\s*[–-]\s*([^:]+)(?::\s*(.+))?$/i); u.parceria = s ? s[1].trim() : 'Não'; if (s && s[2]) u.parceriaDetalhe = s[2].trim(); }
    const l22 = linha(/^2\.2/); if (l22) u.materialTerceiros = /\(\s*x\s*\)\s*Sim, via/i.test(l22) ? 'Sim, com termo' : /\(\s*x\s*\)\s*Sim, sem/i.test(l22) ? 'Sim, sem termo' : 'Não';
    const l23 = linha(/^2\.3/); if (l23) { u.empresasInteressadas = /\(\s*x\s*\)\s*Sim/i.test(l23) ? 'Sim' : 'Não'; const q = l23.match(/Quais\?\s*(.+)$/i); if (q) u.empresasInteressadasQuais = q[1].trim(); }
    u.empresasMercado = textoApos(ls, /^2\.4\b/, [/^2\.5/, /^secao 3/]);
    u.empresasOferta = textoApos(ls, /^2\.5\b/, [/^secao 3/]);
    // inventores: blocos "INVENTOR Nº 01" / "NOTIFICANTE … Nº 01"
    let atual = null;
    const campo = (l, rot) => { const m = l.match(new RegExp('^' + rot + ':\\s*(.*)$', 'i')); return m ? m[1].trim() : null; };
    for (const l of ls) {
        const cab = l.match(/^(NOTIFICANTE( E INVENTOR)?|INVENTOR)\s*N[ºo°]\s*\d+/i);
        if (cab) { atual = Object.assign(inventorVazio(), { notificante: /^NOTIFICANTE/i.test(l), inventor: !/^NOTIFICANTE/i.test(l) || !!cab[2] }); r.inventores.push(atual); continue; }
        if (/^SE[CÇ][AÃ]O 4/i.test(l)) atual = null;
        if (!atual) continue;
        let v;
        if ((v = campo(l, 'Nome completo')) !== null) atual.nome = v;
        else if ((v = campo(l, 'CPF')) !== null) atual.cpf = v;
        else if ((v = campo(l, 'Celular')) !== null) atual.celular = v;
        else if ((v = campo(l, 'E-mail')) !== null) atual.email = v;
        else if ((v = campo(l, 'CEP')) !== null) atual.cep = v;
        else if ((v = campo(l, 'Endereço residencial completo')) !== null) { const ps = v.split(/\s*,\s*/); if (ps.length >= 3 && /^[A-Z]{2}$/.test(ps[ps.length - 1])) { atual.uf = ps.pop(); atual.cidade = ps.pop(); } atual.endereco = ps.join(', '); }
        else if (/^Qualifica/i.test(l)) atual.qualificacao = opcaoMarcada(l, QUALIFICACOES) || atual.qualificacao;
        else if (/^Possu[ií]a v[ií]nculo/i.test(l)) { atual.vinculo = /\(\s*x\s*\)\s*Sim/i.test(l) ? 'Sim' : 'Não'; const o = l.match(/Institui[cç][aã]o de origem:\s*(.+)$/i); if (o) atual.instituicao = o[1].trim(); }
    }
    r.inventores = r.inventores.filter(x => x.nome);
    // participação: tabela NOME | CPF | E-mail | %
    const part = tabelas.find(t => t[0] && /^nome$/i.test((t[0][0] || '').trim()) && /%/.test(t[0][3] || ''));
    if (part) for (const [nome, , , pc] of part.slice(1)) { const x = r.inventores.find(i => semAcento(i.nome) === semAcento(nome)); if (x && pc) x.percentual = pc.trim(); else if (nome && nome.trim() && !x) (r.colaboradores = r.colaboradores || []).push(Object.assign(inventorVazio(), { nome: nome.trim(), inventor: false, percentual: (pc || '').trim() })); }
    return r;
}

/** Linha de tabela de documento: "Patente ou MU: BR 10 2020 … — Título". */
function documentoDaCelula(c) {
    const m = String(c || '').match(/^(?:([^:]{3,25}):\s*)?(.+?)(?:\s+[—–-]\s+(.+))?$/);
    return m ? { tipoDoc: m[1] && TIPOS_DOC.includes(m[1].trim()) ? m[1].trim() : 'Patente ou MU', num: (m[2] || '').trim(), titulo: (m[3] || '').trim() } : null;
}
function baseDoNome(nome) {
    const k = semAcento(nome);
    return Object.keys(BASES).find(b => k.startsWith(semAcento(BASES[b].nome)) || k.startsWith(b)) || baseDoTexto(nome) || '';
}

function interpretarFormBusca(ls, tabelas, est) {
    const r = { univ: {}, registro: [], documentos: [] };
    const fim = [/^(n[ºo] de cadastro|objeto do projeto|titulo do projeto|classificacoes|palavras-chave|banco e base)/];
    r.titulo = textoApos(ls, /^titulo da criacao/, fim);
    r.univ.cadastroProjeto = textoApos(ls, /^n[ºo°] de cadastro/, fim);
    r.univ.objetoProjeto = textoApos(ls, /^objeto do projeto/, fim);
    const tp = textoApos(ls, /^titulo do projeto/, fim); if (tp) r.univ.tituloProjeto = tp.charAt(0) + tp.slice(1).toLowerCase();
    const cl = ls.find(l => /^-\s*IPC\/CPC:/i.test(l)); if (cl) r.classes = cl.replace(/^-\s*IPC\/CPC:\s*/i, '').replace(/\.$/, '').split(/\s*,\s*/).filter(c => /^[A-H]\d{2}[A-Z]/.test(c));
    const res = ls.find(l => /foram encontradas anterioridades/i.test(semAcento(l)));
    if (res) r.univ.buscaResultado = /\[\s*x\s*\]\s*Sim/i.test(res) ? 'Sim' : /\[\s*x\s*\]\s*N[aã]o/i.test(res) ? 'Não' : '';
    r.univ.notaBusca = textoApos(ls, /^nota explicativa/, [/^zzz/]);
    // tabelas de contagem: o parágrafo antes de cada tabela diz a base
    let k = 0;
    for (let i = 0; i < est.linhas.length; i++) {
        const l = est.linhas[i];
        if (!l.tab) continue;
        if (i > 0 && !est.linhas[i - 1].tab) {
            const t = tabelas[k++]; if (!t) break;
            const cab = semAcento(t[0] ? t[0].join(' ') : '');
            if (/palavras-chave/.test(cab)) { const base = baseDoNome(est.linhas[i - 1].texto.replace(/\s*-\s*\(.*$/, '')) || 'outra'; for (const [consulta, n] of t.slice(1)) if (consulta && !/nao pesquisada/i.test(semAcento(consulta))) r.registro.push({ base, consulta: consulta.trim(), n: String(n || '').replace(/[^\d]/g, '') }); }
            if (/^categoria/.test(cab)) for (const [cat, doc, pub, obs] of t.slice(1)) { const d = documentoDaCelula(doc); if (d && d.num && !/nenhum/i.test(d.num)) r.documentos.push(Object.assign(d, { categoria: (cat || 'A').trim().charAt(0).toUpperCase(), publicacao: dataDeBR(pub), nota: (obs || '').trim() })); }
        }
    }
    return r;
}

function interpretarRelBusca(ls, tabelas) {
    const r = { registro: [], documentos: [], classes: [], analise: {} };
    const i1 = ls.findIndex(l => /^1\. classifica/i.test(semAcento(l)));
    if (i1 >= 0) for (const l of ls.slice(i1 + 1, i1 + 40)) { if (/^2\. registro/i.test(semAcento(l))) break; for (const x of l.split('\n')) { const m = x.match(/^([A-H]\d{2}[A-Z]\s*\d+\/\d+)/); if (m) r.classes.push(m[1].replace(/^([A-H]\d{2}[A-Z])\s*/, '$1 ')); } }
    for (const t of tabelas) {
        const cab = semAcento((t[0] || []).join('|'));
        if (/^base\|estr/.test(cab)) for (const [base, est, consulta, n, tri, data] of t.slice(1)) { if (consulta) r.registro.push({ base: baseDoNome(base) || 'outra', estrategia: (est || '').trim(), consulta: consulta.trim(), n: String(n || '').replace(/\D/g, ''), triados: String(tri || '').replace(/\D/g, ''), data: dataDeBR(data) }); }
        if (/^n[ºo°]\|titulo\|base/.test(cab)) for (const [num, titulo, base, cat, lido, rel, nota] of t.slice(1)) {
            if (!num || !num.trim()) continue;
            const [obs, link] = String(nota || '').split('\n');
            r.documentos.push({ num: num.trim(), titulo: (titulo || '').trim(), base: (base || '').trim(), categoria: (cat || 'A').trim().charAt(0).toUpperCase() || 'A', lido: (lido || 'resumo').trim(), relevancia: Math.max(1, Math.min(5, Number(rel) || 3)), nota: (obs || '').trim(), link: /^https?:/.test((link || '').trim()) ? link.trim() : '' });
        }
    }
    const lista = rx => { const i = ls.findIndex(l => rx.test(semAcento(l))); if (i < 0) return []; const out = []; for (const l of ls.slice(i + 1)) { const xs = l.split('\n').filter(x => /^-\s/.test(x)); if (!xs.length) break; out.push(...xs.map(x => x.replace(/^-\s*/, '').trim())); } return out; };
    r.analise.diferenciais = lista(/^5a\./); r.analise.ameacas = lista(/^5b\./); r.analise.recomendacoes = lista(/^5c\./);
    const lac = lista(/^7\. lacunas/); if (lac.length) r.analise.lacunas = lac;
    return r;
}

/** Junta documentos da busca sem duplicar (mesmo número = mesma entrada). */
function juntarDocumentosBusca(p, docs) {
    let n = 0;
    for (const x of docs) {
        const novo = Object.assign({ id: uid(), num: '', titulo: '', base: '', link: '', relevancia: 3, lido: 'resumo', nota: '', carac: {}, categoria: 'A', tipoDoc: 'Patente ou MU', publicacao: '' }, x);
        const ja = p.busca.resultados.find(r => r.num && mesmoDocumento(r.num, novo.num));
        if (ja) juntarDocumento(ja, novo); else { p.busca.resultados.push(novo); n++; }
    }
    return n;
}
function juntarRegistro(p, regs) {
    let n = 0;
    for (const x of regs) if (!p.busca.registroColado.some(r => r.base === x.base && semAcento(r.consulta) === semAcento(x.consulta))) { p.busca.registroColado.push(Object.assign({ id: uid(), base: 'outra', consulta: '', n: '', triados: '' }, x)); n++; }
    return n;
}
function juntarClasses(p, cods) {
    const doCat = new Set(IPC_CATALOGO.map(c => c[0])), ja = classesBusca(p); let n = 0;
    for (const c of cods) { if (ja.includes(c)) continue; if (doCat.has(c)) p.classes.marcadas.push(c); else p.classes.manuais = [p.classes.manuais.trim(), c].filter(Boolean).join('; '); n++; }
    return n;
}

/** Aplica um formulário lido. Devolve a lista do que entrou. */
function aplicarFormulario(p, id, r, modo) {
    const feito = [], u = p.universidade;
    const troca = (atual, padrao) => modo === 'substituir' || !String(atual ?? '').trim() || (padrao !== undefined && atual === padrao);
    const pad = universidadePadrao();
    const put = (obj, k, v, rot, padrao) => { if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) return; if (JSON.stringify(obj[k]) === JSON.stringify(v)) return; if (Array.isArray(v) ? (modo === 'substituir' || !obj[k].length) : troca(obj[k], padrao)) { obj[k] = v; feito.push(rot); } };
    if (r.titulo && troca(p.titulo)) { p.titulo = r.titulo.charAt(0) + (r.titulo === maiusculo(r.titulo) ? r.titulo.slice(1).toLowerCase() : r.titulo.slice(1)); feito.push('título'); }
    if (id === 'memorando') {
        for (const k of ['numero', 'ano', 'assunto', 'data']) put(u.memorando, k, r[k], 'memorando: ' + k, pad.memorando[k]);
        put(u, 'destinatario', r.destinatario, 'destinatário', pad.destinatario); put(u, 'siglaUnidade', r.siglaUnidade, 'sigla da unidade', pad.siglaUnidade); put(u, 'cidade', r.cidade, 'cidade', pad.cidade);
    }
    if (id === 'infotec') {
        for (const [k, v] of Object.entries(r.univ)) put(u, k, v, 'universidade: ' + k, pad[k]);
        if (r.campo && troca(p.ficha.campo)) { p.ficha.campo = r.campo; feito.push('campo da invenção'); }
        if (r.divulgacoes && r.divulgacoes.length) { let n = 0; for (const d of r.divulgacoes) if (!p.contexto.divulgacoes.some(x => x.data === d.data && x.meio === d.meio)) { p.contexto.divulgacoes.push({ id: uid(), ...d }); n++; } if (n) feito.push(n + ' divulgação(ões)'); }
        if (r.inventores.length && (modo === 'substituir' || !u.inventores.some(i => i.nome))) {
            u.inventores = r.inventores; if (r.colaboradores) u.colaboradores = r.colaboradores;
            if (typeof sincronizarInventores === 'function') sincronizarInventores(p, 'tabela');
            feito.push(r.inventores.length + ' inventor(es)');
        }
    }
    if (id === 'formbusca' || id === 'relbusca') {
        if (r.univ) for (const [k, v] of Object.entries(r.univ)) put(u, k, v, 'formulário: ' + k, pad[k]);
        const nr = juntarRegistro(p, r.registro || []); if (nr) feito.push(nr + ' linha(s) do registro da busca');
        const nd = juntarDocumentosBusca(p, r.documentos || []); if (nd) feito.push(nd + ' documento(s) da busca');
        const nc = juntarClasses(p, r.classes || []); if (nc) feito.push(nc + ' classe(s)');
        if (r.analise) for (const [k, v] of Object.entries(r.analise)) if (v && v.length && (modo === 'substituir' || !(p.busca.analise[k] || []).length)) { p.busca.analise[k] = v; feito.push('análise: ' + k); }
    }
    return feito;
}

// ------------------------------------------------------------ entrada única: arquivo → pedido
const NOMES_IMPORT = { pedido: 'pedido completo', relatorio: 'Relatório Descritivo', reivindicacoes: 'Reivindicações', desenhos: 'Desenhos', resumo: 'Resumo', memorando: 'Memorando', infotec: 'Formulário de Informação Tecnológica', formbusca: 'Formulário de Busca de Anterioridade', relbusca: 'Relatório da busca' };

/** Reconhece os formulários pelo cabeçalho (o pedido do INPI é reconhecido pelas seções). */
function tipoDoFormulario(ls) {
    const topo = ls.slice(0, 8).map(l => semAcento(l).replace(/\s+/g, ' ').trim());
    if (topo.some(l => /^memorando\s*n/.test(l))) return 'memorando';
    if (topo.includes('formulario de informacao tecnologica')) return 'infotec';
    if (topo.includes('formulario de busca de anterioridade')) return 'formbusca';
    if (topo.includes('relatorio da busca de anterioridade')) return 'relbusca';
    return '';
}

/** Lê o arquivo e diz o que há nele, sem mexer no pedido (para perguntar antes de substituir). */
async function lerDocumentoDocx(arquivo, id = 'pedido') {
    const est = await lerDocxEstruturado(arquivo);
    const ls = est.linhas.map(l => l.texto).filter(Boolean);
    if (id === 'pedido') id = tipoDoFormulario(ls) || 'pedido';      // vários arquivos de uma vez: cada um vai para a sua página
    if (['relatorio', 'reivindicacoes', 'desenhos', 'resumo', 'pedido'].includes(id)) {
        const r = interpretarPedidoDocx(est, id === 'pedido' ? null : id);
        if (!r.partes.length) throw new Error(id === 'pedido' ? 'não achei RELATÓRIO, REIVINDICAÇÕES, DESENHOS nem RESUMO no arquivo.' : `não achei ${NOMES_IMPORT[id]} no arquivo.`);
        return { id, est, r, ocupa: r.partes };
    }
    const r = id === 'memorando' ? interpretarMemorando(ls) : id === 'infotec' ? interpretarInfotec(ls, est.tabelas) : id === 'formbusca' ? interpretarFormBusca(ls, est.tabelas, est) : interpretarRelBusca(ls, est.tabelas);
    return { id, est, r, ocupa: [id] };
}

/** O pedido já tem conteúdo onde a importação vai escrever? */
function importacaoSobrescreve(p, lido) {
    const tem = { relatorio: Object.values(p.relatorio).some(v => v.trim()), reivindicacoes: p.reivindicacoes.some(r => r.texto.trim()), desenhos: p.desenhos.some(d => d.img || (d.elementos || []).length), resumo: !!p.resumo.trim(),
        memorando: !!p.universidade.memorando.numero, infotec: !!(p.universidade.contexto || p.universidade.inventores.some(i => i.nome)), formbusca: !!(p.universidade.objetoProjeto || p.universidade.notaBusca || p.busca.resultados.length), relbusca: p.busca.resultados.length > 0 };
    return lido.ocupa.filter(k => tem[k]);
}

async function aplicarDocumentoDocx(p, lido, modo) {
    if (['relatorio', 'reivindicacoes', 'desenhos', 'resumo', 'pedido'].includes(lido.id)) return aplicarPedidoDocx(p, lido.r, lido.est, modo);
    return aplicarFormulario(p, lido.id, lido.r, modo);
}

/** Cópia do pedido antes da importação (fica no navegador; as imagens antigas continuam guardadas). */
const DesfazerImport = {
    chave: 'pe_import_desfazer',
    guardar(p) { try { localStorage.setItem(this.chave, JSON.stringify(p)); return true; } catch (e) { return false; } },
    tem() { try { return !!localStorage.getItem(this.chave); } catch (e) { return false; } },
    tirar() { try { const t = localStorage.getItem(this.chave); localStorage.removeItem(this.chave); return t ? normalizarPedido(JSON.parse(t)) : null; } catch (e) { return null; } },
    limpar() { try { localStorage.removeItem(this.chave); } catch (e) { /* ok */ } }
};

/** Botões de importar (e desfazer) para colocar ao lado do "⬇ Baixar .docx" de cada documento. */
function htmlImportarDoc(id, rotulo) {
    return `<button type="button" class="btn btn-secondary${id === 'pedido' ? '' : ' btn-sm'}" data-acao="importar-doc" data-doc="${id}" title="Ler um .docx já feito e colocar cada coisa no seu lugar">⇪ ${rotulo || 'Importar .docx'}</button>` +
        (DesfazerImport.tem() ? '<button type="button" class="btn-link" data-acao="desfazer-importacao">↶ Desfazer importação</button>' : '');
}

// fecha o menu "baixar um documento" depois de escolher (ou ao clicar fora)
if (typeof document !== 'undefined') document.addEventListener('click', ev => {
    for (const m of document.querySelectorAll('details.menu-docs[open]')) if (!m.contains(ev.target) || ev.target.closest('.menu-docs-lista button')) m.open = false;
});
