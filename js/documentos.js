/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * DOCUMENTOS: gera os 8 documentos em .docx (Word) direto no navegador, com JSZip:
 *  INPI — 1. Relatório Descritivo, 2. Reivindicações, 3. Desenhos, 4. Resumo
 *        (Arial 12, espaçamento 1,5, justificado, numeração de página "n / total" no cabeçalho, como os modelos da equipe)
 *  Universidade — 5. Memorando de abertura de processo sigiloso, 6. Formulário de Informação Tecnológica,
 *        7. Formulário de Busca de Anterioridade
 *  8. Relatório da busca de anterioridade (registro das buscas, documentos e quadro comparativo)
 */

'use strict';

const CM = 567; // twips por centímetro
function xe(t) { return String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }

/** Corpo: lista de blocos { t:'p', texto|runs, al, b, tam, recuo, depois } | { t:'tab', linhas, larg, cab } | { t:'img', rid, cx, cy } | { t:'quebra' } */
function runXml(r, base = {}) {
    const o = Object.assign({}, base, r);
    const props = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${o.b ? '<w:b/>' : ''}${o.i ? '<w:i/>' : ''}${o.u ? '<w:u w:val="single"/>' : ''}<w:sz w:val="${(o.tam || 12) * 2}"/><w:szCs w:val="${(o.tam || 12) * 2}"/></w:rPr>`;
    return String(o.texto ?? '').split('\n').map((linha, i) => (i ? `<w:r>${props}<w:br/></w:r>` : '') + `<w:r>${props}<w:t xml:space="preserve">${xe(linha)}</w:t></w:r>`).join('');
}
function parXml(b) {
    const al = { c: 'center', j: 'both', e: 'left', d: 'right' }[b.al || 'j'];
    const esp = b.simples ? '<w:spacing w:before="0" w:after="60" w:line="276" w:lineRule="auto"/>' : `<w:spacing w:before="0" w:after="${b.depois ?? 120}" w:line="360" w:lineRule="auto"/>`;
    const rec = b.recuo ? `<w:ind w:left="${b.recuo}" w:hanging="${b.pendente || 0}"/>` : (b.primeira ? `<w:ind w:firstLine="${b.primeira}"/>` : '');
    const runs = b.runs ? b.runs.map(r => runXml(r, b)).join('') : runXml({ texto: b.texto }, b);
    return `<w:p><w:pPr><w:jc w:val="${al}"/>${esp}${rec}${b.manter ? '<w:keepNext/>' : ''}</w:pPr>${runs}</w:p>`;
}
function tabXml(b, largura) {
    const n = b.linhas[0].length;
    const larg = b.larg || Array(n).fill(Math.floor(largura / n));
    const borda = '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(k => `<w:${k} w:val="single" w:sz="4" w:space="0" w:color="808080"/>`).join('') + '</w:tblBorders>';
    const linhas = b.linhas.map((l, i) => '<w:tr>' + l.map((c, j) => {
        const cab = b.cab && i === 0;
        const conteudo = (Array.isArray(c) ? c : [c]).map(x => parXml(Object.assign({ al: 'e', simples: true, tam: b.tam || 10, b: cab }, typeof x === 'object' ? x : { texto: x }))).join('');
        return `<w:tc><w:tcPr><w:tcW w:w="${larg[j]}" w:type="dxa"/>${cab ? '<w:shd w:val="clear" w:color="auto" w:fill="E6EEEC"/>' : ''}</w:tcPr>${conteudo}</w:tc>`;
    }).join('') + '</w:tr>').join('');
    return `<w:tbl><w:tblPr><w:tblW w:w="${larg.reduce((a, x) => a + x, 0)}" w:type="dxa"/>${borda}<w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${larg.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${linhas}</w:tbl>` + parXml({ texto: '', depois: 60 });
}
function imgXml(b, n) {
    return `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="120"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${b.cx}" cy="${b.cy}"/><wp:docPr id="${n}" name="Figura ${n}"/>` +
        `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
        `<pic:nvPicPr><pic:cNvPr id="${n}" name="imagem${n}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${b.rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
        `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${b.cx}" cy="${b.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

/**
 * Monta o .docx. opts: { blocos, margens: [sup, inf, esq, dir] em cm, paginacao: true, imagens: [{ rid, bytes, ext }], rodape }
 */
async function montarDocx(opts) {
    const [sup, inf, esq, dir] = (opts.margens || [2, 2, 2.5, 2]).map(x => Math.round(x * CM));
    const largura = 11906 - esq - dir;
    let nImg = 0;
    const corpo = opts.blocos.map(b => b.t === 'tab' ? tabXml(b, largura) : b.t === 'img' ? imgXml(b, ++nImg) : b.t === 'quebra' ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : parXml(b)).join('');
    const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
    const cab = opts.paginacao !== false ? '<w:headerReference w:type="default" r:id="rIdCab"/>' : '';
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${corpo}<w:sectPr>${cab}<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="${sup}" w:right="${dir}" w:bottom="${inf}" w:left="${esq}" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const campo = c => `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:instrText xml:space="preserve"> ${c} </w:instrText></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>`;
    const header = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}><w:p><w:pPr><w:jc w:val="right"/></w:pPr>${campo('PAGE')}<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve"> / </w:t></w:r>${campo('NUMPAGES')}</w:p></w:hdr>`;
    const imgs = opts.imagens || [];
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdEst" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        (cab ? '<Relationship Id="rIdCab" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' : '') +
        imgs.map(m => `<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.rid}.${m.ext}"/>`).join('') + '</Relationships>';
    const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;
    const tipos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>${cab ? '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' : ''}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
    const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xe(opts.titulo || '')}</dc:title><dc:creator>Apoio à Escrita de Patentes</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`;
    const z = new JSZip();
    z.file('[Content_Types].xml', tipos);
    z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>');
    z.file('docProps/core.xml', core);
    z.file('word/document.xml', doc);
    z.file('word/styles.xml', estilos);
    z.file('word/_rels/document.xml.rels', rels);
    if (cab) z.file('word/header1.xml', header);
    for (const m of imgs) z.file(`word/media/${m.rid}.${m.ext}`, m.bytes);
    return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

// ------------------------------------------------------------ helpers de conteúdo
const T = (texto, extra = {}) => Object.assign({ t: 'p', texto }, extra);
const vazioSe = (t, ph) => String(t || '').trim() || `[${ph}]`;
const marca = (cond) => (cond ? '( x )' : '(   )');

/** Parágrafos numerados do relatório, continuando a numeração entre as seções. */
function blocosRelatorio(p) {
    const r = p.relatorio;
    const secoes = [['Campo da invenção', r.campo], ['Fundamentos da invenção', [r.fundamentos, r.problemaSolucao].filter(Boolean).join('\n\n')],
        ['Breve descrição dos desenhos', r.desenhos], ['Descrição da invenção', r.descricao], ['Exemplos de concretizações da invenção', r.exemplos]];
    const out = [T(tituloPedido(p), { al: 'c', b: true, depois: 240 })];
    let n = 0;
    for (const [tit, txt] of secoes) {
        const ps = paragrafos(txt);
        if (!ps.length) continue;
        out.push(T(tit, { b: true, manter: true, depois: 120 }));
        for (const x of ps) out.push(T(`${++n}.\t${x}`, { recuo: 567, pendente: 567 }));
        out.push(T('', { depois: 0 }));
    }
    return out;
}

async function imagensDesenhos(p) {
    const imgs = [], blocos = [T('DESENHOS', { al: 'c', b: true, depois: 240 })];
    let i = 0;
    for (const d of p.desenhos) {
        i++;
        const blob = await Imagens.ler(d.img);
        if (blob) {
            const bytes = new Uint8Array(await blob.arrayBuffer());
            const dim = await new Promise(ok => { const im = new Image(); im.onload = () => ok([im.naturalWidth, im.naturalHeight]); im.onerror = () => ok([800, 600]); im.src = URL.createObjectURL(blob); });
            const maxW = 16 * 360000, maxH = 10 * 360000;              // 16 cm × 10 cm em EMU
            let cx = dim[0] * 9525, cy = dim[1] * 9525;
            const k = Math.min(1, maxW / cx, maxH / cy); cx = Math.round(cx * k); cy = Math.round(cy * k);
            const ext = /png/.test(blob.type) ? 'png' : /gif/.test(blob.type) ? 'gif' : 'jpeg';
            imgs.push({ rid: 'rIdImg' + i, bytes, ext });
            blocos.push({ t: 'img', rid: 'rIdImg' + i, cx, cy });
        } else blocos.push(T('[INSERIR A IMAGEM DA FIGURA ' + i + ']', { al: 'c' }));
        blocos.push(T('Figura ' + i, { al: 'c', depois: 360 }));
    }
    if (!p.desenhos.length) blocos.push(T('[Sem desenhos. Obrigatório para modelo de utilidade.]', { al: 'c' }));
    return { blocos, imgs };
}

// ------------------------------------------------------------ os 8 documentos
const DOCUMENTOS = [
    { id: 'relatorio', n: 1, nome: '1. Relatório Descritivo', grupo: 'INPI', etapa: 'relatorio' },
    { id: 'reivindicacoes', n: 2, nome: '2. Reivindicações', grupo: 'INPI', etapa: 'reivindicacoes' },
    { id: 'desenhos', n: 3, nome: '3. Desenhos', grupo: 'INPI', etapa: 'desenhos' },
    { id: 'resumo', n: 4, nome: '4. Resumo', grupo: 'INPI', etapa: 'resumo' },
    { id: 'memorando', n: 5, nome: '5. Memorando — abertura de processo sigiloso', grupo: 'Universidade', etapa: 'universidade' },
    { id: 'infotec', n: 6, nome: '6. Formulário de Informação Tecnológica', grupo: 'Universidade', etapa: 'universidade' },
    { id: 'formbusca', n: 7, nome: '7. Formulário de Busca de Anterioridade', grupo: 'Universidade', etapa: 'universidade' },
    { id: 'relbusca', n: 8, nome: '8. Relatório da busca de anterioridade', grupo: 'Busca', etapa: 'buscas' }
];

async function gerarDocumento(p, id) {
    const u = p.universidade;
    const inv = u.inventores;
    const not = inv.find(i => i.notificante) || inv[0];
    const cabUFPel = [T(u.nome, { al: 'c', b: true, depois: 0 }), T(u.unidade, { al: 'c', depois: 240 })];
    switch (id) {
        case 'relatorio': return montarDocx({ titulo: 'Relatório Descritivo', blocos: blocosRelatorio(p) });
        case 'reivindicacoes': {
            const rs = p.reivindicacoes.filter(r => r.texto.trim());
            return montarDocx({ titulo: 'Reivindicações', blocos: [T('REIVINDICAÇÕES', { al: 'c', b: true, depois: 240 }), ...rs.map((r, i) => T(`${i + 1}.\t${textoReivindicacao(p, r)}`, { recuo: 567, pendente: 567 }))] });
        }
        case 'desenhos': { const d = await imagensDesenhos(p); return montarDocx({ titulo: 'Desenhos', blocos: d.blocos, imagens: d.imgs, margens: [4, 1, 3, 1.5] }); }
        case 'resumo': return montarDocx({ titulo: 'Resumo', blocos: [T('RESUMO', { al: 'c', b: true, depois: 0 }), T(tituloPedido(p), { al: 'c', b: true, depois: 240 }), ...paragrafos(p.resumo).map(x => T(x))] });
        case 'memorando': {
            const m = u.memorando;
            return montarDocx({ titulo: 'Memorando', paginacao: false, blocos: [...cabUFPel,
                T(`Memorando nº ${vazioSe(m.numero, 'nº')}/${m.ano}/${u.siglaUnidade}`, { al: 'e', b: true }),
                T(`Ao(À) ${u.destinatario}`, { al: 'e' }), T(`Assunto: ${m.assunto}`, { al: 'e', depois: 360 }),
                T('Prezado(a),', { al: 'e', depois: 240 }),
                T(`Venho por este solicitar a abertura de processo sigiloso para anexar os documentos para o processo de ${p.natureza === 'MU' ? 'patente de modelo de utilidade' : 'patente'} intitulado "${tituloPedido(p)}".`, { primeira: 1134 }),
                T('Os documentos (Resumo, Figuras, Relatório Descritivo e Reivindicações), o Formulário de Informação Tecnológica e o Formulário de Busca de Anterioridade já estão redigidos.', { primeira: 1134, depois: 480 }),
                T('Atenciosamente,', { al: 'e', depois: 720 }),
                T(vazioSe(not && not.nome, 'Nome do(a) servidor(a) notificante'), { al: 'c', depois: 0 }), T(vazioSe(not && not.qualificacao === 'Professor de Ensino Superior' ? 'Professor(a)' : '', 'Cargo'), { al: 'c' }),
                T(`${u.cidade}, ${m.data ? dataBR(m.data) : '___/___/______'}.`, { al: 'd', depois: 240 }),
                T('Observação: o memorando é assinado no SEI por servidor(a) da universidade (normalmente o(a) orientador(a)), que abre o processo sigiloso.', { i: true, tam: 9, al: 'e' })] });
        }
        case 'infotec': return montarDocx({ titulo: 'Formulário de Informação Tecnológica', paginacao: false, margens: [2, 2, 2, 2], blocos: blocosInfotec(p) });
        case 'formbusca': return montarDocx({ titulo: 'Formulário de Busca de Anterioridade', paginacao: false, margens: [2, 2, 2, 2], blocos: blocosFormBusca(p) });
        case 'relbusca': return montarDocx({ titulo: 'Relatório da busca de anterioridade', margens: [2, 2, 2, 2], blocos: blocosRelBusca(p) });
    }
    throw new Error('documento desconhecido: ' + id);
}

const AREAS_PREDOMINANTES = ['BIOTECNOLOGIA', 'ENGENHARIA', 'VETERINÁRIA', 'QUÍMICA', 'ELETRÔNICA', 'AGRÁRIA', 'FARMÁCIA', 'SAÚDE HUMANA', 'OUTROS'];
const AREAS_ABRANGIDAS = ['Eng. Agrícola', 'Eng. Elétrica', 'Engenharia Mecânica', 'Eng. Mecatrônica', 'Eng. de Produção', 'Eng. Química', 'Eng. Civil', 'Eng. Materiais e Metalúrgica', 'Eng. Biomédica', 'Agronomia', 'Zootecnia', 'Veterinária', 'Ciência e Tec. Alimentos', 'Rec. Florestais e Eng. Florestal', 'Ciência da Computação', 'Física', 'Química', 'Desenho Industrial', 'Adm. Rural', 'Outra'];
const CONSISTE = ['NOVO PRODUTO', 'NOVO PROCESSO', 'NOVA APLICAÇÃO INDUSTRIAL DE ALGO QUE JÁ EXISTE', 'APERFEIÇOAMENTO DE ALGO QUE JÁ EXISTE'];
const QUALIFICACOES = ['Professor de Ensino Superior', 'Aluno Doutorado ou Pós-Doutorado', 'Aluno Mestrando', 'Aluno de outro tipo de Pós-Graduação', 'Aluno Graduação', 'Pesquisador Independente (PF sem vínculos)', 'Servidor das demais carreiras', 'Outro'];

function palavrasChave(p) {
    const fams = ['objeto', 'elemento', 'orientacao', 'geometria', 'problema', 'condicao'].map(k => familia(p, k));
    return [...new Set([...fams.flatMap(f => f.pt), ...fams.flatMap(f => f.en)])];
}

function blocosInfotec(p) {
    const u = p.universidade, f = p.ficha;
    const divs = p.contexto.divulgacoes.filter(d => d.data || d.meio);
    const b = [T(u.nome, { al: 'c', b: true, depois: 0 }), T(u.unidade, { al: 'c', depois: 240 }), T('FORMULÁRIO DE INFORMAÇÃO TECNOLÓGICA', { al: 'c', b: true, depois: 240 }),
        T('SEÇÃO 1 - SOBRE A NOVA TECNOLOGIA', { b: true }), T('1.1 - ÁREA DO CONHECIMENTO', { b: true }),
        T('1.1.1 ÁREA PREDOMINANTE: ' + AREAS_PREDOMINANTES.map(a => `${marca(u.areaPredominante === a)} ${a}`).join('   '), { al: 'e' }),
        T('1.1.2 ÁREAS ABRANGIDAS: ' + (u.areasAbrangidas.length ? u.areasAbrangidas.map(a => `( x ) ${a}`).join('   ') : '[marcar]'), { al: 'e' }),
        T('1.2 - EM QUE CONSISTE A INVENÇÃO:', { b: true }), T(CONSISTE.map(c => `${marca(u.consiste === c)} ${c}`).join('\n'), { al: 'e' }),
        T('1.3 - A INVENÇÃO OU PARTE DELA JÁ FOI DIVULGADA POR ALGUM MEIO?', { b: true }),
        T(divs.length ? '(   ) Não.\n( x ) Sim. Por qual meio?\n' + divs.map(d => `- ${d.meio || 'meio não informado'} — Data: ${dataBR(d.data)}`).join('\n') : '( x ) Não.\n(   ) Sim.', { al: 'e' }),
        T('* Encaminhar em anexo cópia de todos os documentos informados acima e demais publicações relacionadas à tecnologia, de autoria dos inventores.', { i: true, tam: 9 }),
        T('1.4 - ACESSO AO PATRIMÔNIO GENÉTICO E AO CONHECIMENTO TRADICIONAL ASSOCIADO', { b: true }),
        T(`1.4.1 - Para o desenvolvimento da tecnologia houve pesquisa com: ${marca(u.patrimonioGenetico === 'Material biológico')} Material biológico da flora ou fauna brasileira  ${marca(u.patrimonioGenetico === 'Conhecimento tradicional')} Conhecimento Tradicional Associado  ${marca(u.patrimonioGenetico === 'Nenhum')} Nenhum${u.sisgen ? '\nCadastro no SisGen: ' + u.sisgen : ''}`, { al: 'e' }),
        T(`1.4.2 - A tecnologia envolve o uso de organismo ou parte de organismo da fauna e/ou flora brasileira? ${marca(u.faunaFlora === 'Sim')} Sim  ${marca(u.faunaFlora !== 'Sim')} Não`, { al: 'e' }),
        T(`1.4.3 - A invenção advém do uso de conhecimento tradicional de povos da cultura brasileira? ${marca(u.conhecimentoTradicional === 'Sim')} Sim  ${marca(u.conhecimentoTradicional !== 'Sim')} Não`, { al: 'e' }),
        T('1.5 - TÍTULO PROPOSTO PARA A INVENÇÃO', { b: true }), T(tituloPedido(p)),
        T('1.6 - PALAVRAS-CHAVE RELATIVAS À INVENÇÃO (MÍNIMO 5, EM INGLÊS E PORTUGUÊS)', { b: true }), T(palavrasChave(p).join('\n') || '[COMPLETAR]', { al: 'e' }),
        T('1.7 - CAMPO DA INVENÇÃO (RESUMIR, SEM DETALHES TÉCNICOS, A INVENÇÃO)', { b: true }), T(vazioSe(p.relatorio.campo || f.campo, 'COMPLETAR')),
        T('1.8 - ESTADO DA TÉCNICA', { b: true }),
        T('a. Contexto tecnológico do problema técnico que a nova tecnologia pretende solucionar:', { b: true }), T(vazioSe(u.contexto || f.problema, 'COMPLETAR')),
        T('b. Como é tratado/resolvido o problema atualmente:', { b: true }), T(vazioSe(u.comoHoje || f.estadoTecnica, 'COMPLETAR')),
        T('c. Qual o resultado que a nova tecnologia pretende oferecer para o problema:', { b: true }), T(vazioSe(u.resultado || f.vantagens, 'COMPLETAR')),
        T('d. Quais as possíveis aplicações industriais da nova tecnologia (produto/processo/serviço):', { b: true }), T(vazioSe(u.aplicacoesIndustriais || f.aplicacoes, 'COMPLETAR')),
        T('e. Outras possíveis aplicações para a nova tecnologia além das mencionadas:', { b: true }), T(vazioSe(u.outrasAplicacoes, 'COMPLETAR')),
        T('SEÇÃO 2 - INFORMAÇÕES SOBRE PARCERIAS E MERCADO', { b: true }),
        T(`2.1 - Houve o envolvimento/parceria de outra instituição para desenvolvimento da invenção? ${marca(u.parceria === 'Não')} Não  ${marca(u.parceria !== 'Não')} Sim${u.parceria !== 'Não' ? ' – ' + u.parceria + (u.parceriaDetalhe ? ': ' + u.parceriaDetalhe : '') : ''}`, { al: 'e' }),
        T(`2.2 - Houve uso de material de terceiros (material biológico etc.)? ${marca(u.materialTerceiros === 'Não')} Não  ${marca(u.materialTerceiros === 'Sim, com termo')} Sim, via Termo de Transferência de Material  ${marca(u.materialTerceiros === 'Sim, sem termo')} Sim, sem Termo`, { al: 'e' }),
        T(`2.3 - Existem empresas já interessadas na tecnologia? ${marca(u.empresasInteressadas !== 'Sim')} Não  ${marca(u.empresasInteressadas === 'Sim')} Sim${u.empresasInteressadasQuais ? '. Quais? ' + u.empresasInteressadasQuais : ''}`, { al: 'e' }),
        T('2.4 - Indique ao menos 5 das principais empresas que atuam no mercado relacionado ao problema técnico a ser solucionado', { b: true }), T(vazioSe(u.empresasMercado || f.concorrentes, 'COMPLETAR')),
        T('2.5 - Indique ao menos 3 empresas para as quais a sua tecnologia poderá ser ofertada, se possível com os respectivos contatos', { b: true }), T(vazioSe(u.empresasOferta, 'COMPLETAR')),
        T('SEÇÃO 3 - INFORMAÇÕES SOBRE OS INVENTORES', { b: true }),
        T('Inventores são as pessoas físicas que contribuíram intelectualmente para a invenção (ato inventivo). O NOTIFICANTE é o responsável legal pelas informações e o contato com o escritório de propriedade intelectual.', { i: true, tam: 9 })];
    const lista = u.inventores.length ? u.inventores : [inventorVazio()];
    lista.forEach((i, k) => {
        b.push(T(i.notificante ? `NOTIFICANTE ${i.inventor ? 'E INVENTOR' : ''} Nº ${String(k + 1).padStart(2, '0')}${k === 0 ? ' (PRINCIPAL)' : ''}` : `INVENTOR Nº ${String(k + 1).padStart(2, '0')}`, { b: true, manter: true }));
        b.push({ t: 'tab', tam: 10, linhas: [
            [`Nome completo: ${i.nome}`, `CPF: ${i.cpf}`],
            [`Celular: ${i.celular}`, `E-mail: ${i.email}`],
            [`Endereço residencial completo: ${[i.endereco, i.cidade, i.uf].filter(Boolean).join(', ')}`, `CEP: ${i.cep}`],
            [`Qualificação à época do desenvolvimento: ${QUALIFICACOES.map(q => `${marca(i.qualificacao === q)} ${q}`).join('  ')}`, `Possuía vínculo com a ${u.sigla}? ${marca(i.vinculo === 'Sim')} Sim  ${marca(i.vinculo !== 'Sim')} Não${i.vinculo !== 'Sim' && i.instituicao ? ' - Instituição de origem: ' + i.instituicao : ''}\nÉ inventor? ${marca(i.inventor)} Sim  ${marca(!i.inventor)} Não, apenas notificante`]
        ], larg: [6400, 3500] });
    });
    b.push(T('SEÇÃO 4 - DA PARTICIPAÇÃO NOS RESULTADOS', { b: true }),
        T('É assegurada ao conjunto dos inventores e demais colaboradores a participação de 1/3 (um terço) nos ganhos econômicos líquidos auferidos pela universidade, resultantes de contratos de transferência de tecnologia e de licenciamento. Relacione abaixo quem divide essa quota (somatório = 100%).', { tam: 10 }));
    const part = [...u.inventores, ...u.colaboradores].filter(x => x.nome);
    b.push({ t: 'tab', cab: true, tam: 10, linhas: [['NOME', 'CPF', 'E-mail', '%'], ...(part.length ? part.map(x => [x.nome, x.cpf, x.email, String(x.percentual || '')]) : [['', '', '', '']])], larg: [3600, 1900, 3300, 1100] });
    b.push(T('DECLARAÇÃO', { b: true, al: 'c' }),
        T(`Declaro, para os devidos fins de direito, que todos os INVENTORES relacionados participaram do desenvolvimento da tecnologia descrita no presente formulário, em conformidade com a Lei nº 9.279, de 14/05/96, e com a Lei nº 10.973, de 02/12/2004, e que TODOS têm conhecimento de que a titularidade da referida tecnologia pertence à ${u.sigla} e parceiro(s) cotitular(es), quando houver, e de que serão resguardados os seus direitos de INVENTOR, bem como AUTORIZAM a ${u.nome} (${u.sigla}), com sede à ${u.endereco.split(' - ')[0]}, ${u.cidade}, ${u.uf}, inscrita no CNPJ sob o número ${u.cnpj}, a requerer em seu nome, perante o Instituto Nacional da Propriedade Industrial e/ou órgão competente em âmbito internacional, o respectivo pedido de patente de invenção ou modelo de utilidade.`, { tam: 10 }),
        T('(Assinado eletronicamente no SEI pelo notificante.)', { i: true, tam: 9, al: 'c' }));
    return b;
}

const CATEGORIAS = { X: 'X - documento de particular relevância: a invenção não é nova ou não tem atividade inventiva considerando o documento sozinho', Y: 'Y - documento de particular relevância: sem atividade inventiva quando combinado com outro(s) documento(s)', A: 'A - documento que define o estado geral da técnica, mas não é de particular relevância', O: 'O - documento referente a divulgação oral, uso, exibição ou outros meios', L: 'L - documento que pode lançar dúvida na reivindicação de prioridade ou citado por outra razão especial' };
const TIPOS_DOC = ['Patente ou MU', 'Artigo ou Livro', 'Trabalho de Conclusão', 'Apresentação', 'Outro'];

/** Contagens por base e palavra-chave, a partir das buscas marcadas como feitas. */
function contagensPorBase(p) {
    const buscas = gerarBuscas(p);
    const porBase = {};
    for (const [id, e] of Object.entries(p.busca.executadas)) {
        if (!e || !e.feita) continue;
        const b = buscas.find(x => x.id === id) || { base: e.base, consulta: e.consulta };
        const base = b.base || e.base;
        if (!base) continue;
        (porBase[base] = porBase[base] || []).push([String(e.consulta || b.consulta || '').slice(0, 160), e.n === '' || e.n == null ? '—' : String(e.n)]);
    }
    for (const r of p.busca.registroColado) {
        const lista = porBase[r.base || 'outra'] = porBase[r.base || 'outra'] || [];
        if (!lista.some(x => x[0] === r.consulta)) lista.push([String(r.consulta).slice(0, 160), r.n === '' || r.n == null ? '—' : String(r.n)]);
    }
    return porBase;
}

function blocosFormBusca(p) {
    const u = p.universidade;
    const relevantes = p.busca.resultados.filter(r => r.num && Number(r.relevancia) >= 3);
    const achou = u.buscaResultado ? u.buscaResultado === 'Sim' : p.busca.resultados.some(r => r.categoria === 'X' || r.categoria === 'Y');
    const cont = contagensPorBase(p);
    const b = [T(u.nome, { al: 'c', b: true, depois: 0 }), T('ESCRITÓRIO DE PROPRIEDADE INTELECTUAL, TRANSFERÊNCIA DE TECNOLOGIA E EMPREENDEDORISMO', { al: 'c', tam: 10, depois: 240 }),
        T('FORMULÁRIO DE BUSCA DE ANTERIORIDADE', { al: 'c', b: true, depois: 0 }), T('[Pesquisa em documentos de patentes e outras publicações técnicas]', { al: 'c', tam: 10, depois: 240 }),
        T('TÍTULO DA CRIAÇÃO:', { b: true }), T(tituloPedido(p)),
        T('Nº DE CADASTRO DO PROJETO (PESQUISA/DISSERTAÇÃO/TESE): *(Conforme cadastrado no Cobalto ou no PPG)', { b: true }), T(vazioSe(u.cadastroProjeto, 'nº')),
        T('OBJETO DO PROJETO (PESQUISA/DISSERTAÇÃO/TESE):', { b: true }), T(vazioSe(u.objetoProjeto, 'COMPLETAR')),
        T('TÍTULO DO PROJETO (PESQUISA/DISSERTAÇÃO/TESE):', { b: true }), T(vazioSe(maiusculo(u.tituloProjeto), 'COMPLETAR')),
        T('CLASSIFICAÇÕES DE PATENTES ASSOCIADAS:', { b: true }), T('- IPC/CPC: ' + (classesBusca(p).join(', ') || '[COMPLETAR]') + '.'),
        T('PALAVRAS-CHAVE ASSOCIADAS:', { b: true }), T(palavrasChave(p).join(', ') + '.'),
        T('BANCO E BASE DE DADOS', { b: true, al: 'c' })];
    for (const base of ['inpi', 'google', 'capes', 'uspto', 'espacenet', 'patentscope', 'scholar', 'scielo', 'outra']) {
        if (['patentscope', 'scholar', 'scielo', 'outra'].includes(base) && !cont[base]) continue;
        const linhas = cont[base] || [];
        b.push(T(`${BASES[base].nome}${BASES[base].url ? ' - (' + BASES[base].url + ')' : ' - (identificar)'}`, { b: true, manter: true, tam: 11 }));
        b.push({ t: 'tab', cab: true, tam: 9, linhas: [['PALAVRAS-CHAVE / SEQUÊNCIA', 'Nº DE DOCUMENTOS LOCALIZADOS'], ...(linhas.length ? linhas : [['(não pesquisada)', '—']])], larg: [7500, 2400] });
    }
    b.push(T('AVISO IMPORTANTE', { b: true, al: 'c' }),
        T('A busca prévia de anterioridade é uma amostragem e não verifica os documentos de patentes que estão em período de sigilo (18 meses a partir do depósito). Se algum documento similar ou igual estiver no período de sigilo, vale o recurso para o primeiro depositante. A busca prévia também não garante a abrangência total da literatura técnica publicada no mundo.', { tam: 10 }),
        T('RESULTADO DAS BUSCAS REALIZADAS', { b: true, al: 'c' }),
        T(`Segundo sua pesquisa, foram encontradas anterioridades?   ${achou ? '[   ] Não   [ x ] Sim' : '[ x ] Não   [   ] Sim'}`, { al: 'e' }),
        T('DOCUMENTOS RELEVANTES', { b: true, al: 'c' }),
        { t: 'tab', cab: true, tam: 9, linhas: [['CATEGORIA', 'DOCUMENTO', 'PUBLICAÇÃO', 'OBSERVAÇÃO'], ...(relevantes.length ? relevantes.map(r => [r.categoria || 'A', `${r.tipoDoc || 'Patente ou MU'}: ${r.num}${r.titulo ? ' — ' + r.titulo : ''}`, r.publicacao ? dataBR(r.publicacao) : '', r.nota || '']) : [['', '', '', '']])], larg: [1200, 3900, 1500, 3300] },
        T('Categorias: ' + Object.values(CATEGORIAS).join('; ') + '.', { tam: 9 }),
        T('Documentos: "Patente ou MU" – pedido de patente ou de modelo de utilidade publicado; "Artigo ou Livro"; "Trabalho de Conclusão" – TCC, dissertação ou tese defendida em banca aberta; "Apresentação"; "Outro". Publicação: data da publicação e/ou divulgação. Observação: breve comentário da diferença entre o documento e a invenção (novidade).', { tam: 9 }),
        T('NOTA EXPLICATIVA DO RESULTADO DA PESQUISA:', { b: true }),
        T(vazioSe(u.notaBusca || p.busca.notaRetorno || textoEstadoTecnica(p), 'COMPLETAR')));
    return b;
}

function blocosRelBusca(p) {
    const buscas = gerarBuscas(p);
    const ex = p.busca.executadas;
    const rs = p.busca.resultados.filter(r => r.num).sort((a, b) => b.relevancia - a.relevancia);
    const car = caracteristicasComparacao(p);
    const b = [T('RELATÓRIO DA BUSCA DE ANTERIORIDADE', { al: 'c', b: true, depois: 0 }), T(tituloPedido(p), { al: 'c', b: true, depois: 120 }),
        T(`Data: ${dataBR(hojeISO())} · Natureza pretendida: ${nomeNatureza(p)} · Avaliação preliminar, não conclusiva: a análise formal cabe a um profissional de propriedade industrial.`, { al: 'c', tam: 9, depois: 240 }),
        T('1. Classificações usadas (marcadas por aproximação e conferidas pelo aluno)', { b: true }),
        T(classesBusca(p).map(c => `${c} — ${tituloClasse(c) || 'informada pelo usuário'}`).join('\n') || '[nenhuma]', { al: 'e' }),
        T('2. Registro da busca', { b: true }),
        { t: 'tab', cab: true, tam: 8, linhas: [['Base', 'Estr.', 'Sequência exata', 'Resultados', 'Triados', 'Data'], ...buscas.filter(x => ex[x.id] && ex[x.id].feita).map(x => [BASES[x.base].nome, x.est, x.consulta, String(ex[x.id].n ?? ''), String(ex[x.id].triados ?? ''), dataBR(ex[x.id].data)]), ...p.busca.registroColado.map(r => [(BASES[r.base] || BASES.outra).nome, r.est || '—', r.consulta + (r.acessada === false ? ' (não acessada)' : '') + (r.obs ? ' — ' + r.obs : ''), String(r.n ?? ''), String(r.triados ?? ''), (p.busca.analise && p.busca.analise.data) ? dataBR(p.busca.analise.data) : 'retorno da IA'])], larg: [1300, 500, 5300, 900, 800, 1000] },
        T('3. Documentos mais relevantes', { b: true }),
        { t: 'tab', cab: true, tam: 8, linhas: [['Nº', 'Título', 'Base', 'Cat.', 'Lido', 'Rel.', 'Nota / diferença'], ...rs.map(r => [r.num, r.titulo, r.base, r.categoria, r.lido, String(r.relevancia), r.nota + (r.link ? '\n' + r.link : '')])], larg: [1500, 2300, 1000, 500, 900, 500, 3100] }];
    if (car.length && rs.length) {
        b.push(T('4. Quadro comparativo (S = divulga, P = parcialmente, N = não, ? = não verificado)', { b: true }));
        b.push({ t: 'tab', cab: true, tam: 8, linhas: [['Documento', ...car.map((c, i) => 'C' + (i + 1))], ...rs.slice(0, 10).map(r => [r.num, ...car.map((c, i) => r.carac['C' + (i + 1)] || '?')])], larg: [2000, ...car.map(() => Math.floor(7900 / car.length))] });
        b.push(T(car.map((c, i) => `C${i + 1}: ${c}`).join('\n'), { al: 'e', tam: 9 }));
        const dif = car.filter((c, i) => rs.every(r => (r.carac['C' + (i + 1)] || '?') === 'N'));
        b.push(T('5. Características possivelmente diferenciais (não divulgadas por nenhum documento)', { b: true }), T(dif.length ? dif.map(x => '- ' + x).join('\n') : '[nenhuma característica marcada como N em todos os documentos]', { al: 'e' }));
    }
    const an = p.busca.analise || {};
    const bloco = (tit, xs) => { if (xs && xs.length) b.push(T(tit, { b: true }), T(xs.map(x => '- ' + x).join('\n'), { al: 'e' })); };
    bloco('5a. Diferenciais apontados na busca', an.diferenciais);
    bloco('5b. Documentos e combinações que mais ameaçam a novidade', an.ameacas);
    bloco('5c. Recomendações', an.recomendacoes);
    const div = p.contexto.divulgacoes.filter(d => d.data).sort((a, c) => a.data.localeCompare(c.data));
    b.push(T('6. Alerta de prazos', { b: true }),
        T((div.length ? div.map(d => `${dataBR(d.data)} — ${d.meio}: período de graça até ${dataBR(somarMeses(d.data, 12))} (art. 12 da Lei 9.279/96).`).join('\n') : 'Nenhuma divulgação registrada. Não divulgue antes do depósito.') + (an.prazos ? '\n' + an.prazos : ''), { al: 'e' }),
        T('7. Lacunas', { b: true }), T((an.lacunas && an.lacunas.length ? an.lacunas.map(x => '- ' + x).join('\n') + '\n' : '') + Object.keys(BASES).filter(k => k !== 'outra' && k !== 'capes' && !buscas.some(x => x.base === k && ex[x.id] && ex[x.id].feita) && !p.busca.registroColado.some(r => r.base === k)).map(k => '- ' + BASES[k].nome + ': não pesquisada').join('\n') || 'Todas as bases foram pesquisadas.', { al: 'e' }));
    return b;
}

/** Características do objeto para o quadro comparativo: a partir dos componentes e da solução. */
function caracteristicasComparacao(p) {
    if (Array.isArray(p.busca.caracteristicas) && p.busca.caracteristicas.length) return p.busca.caracteristicas;
    const rs = p.reivindicacoes.filter(r => r.texto.trim());
    if (rs.length) return rs.slice(0, 8).map((r, i) => `Reiv. ${i + 1}: ${semFinal(r.texto).slice(0, 110)}${r.texto.length > 110 ? '…' : ''}`);
    const c = p.ficha.componentes.slice(0, 6).map(x => x.nome + (x.funcao ? ' — ' + x.funcao : ''));
    if (p.busca.termos.orientacao) c.unshift(p.busca.termos.elemento.split(';')[0] + ' ' + p.busca.termos.orientacao.split(';')[0]);
    return c.filter(Boolean).slice(0, 7);
}

function nomeArquivoDoc(p, d) { return semAcento(d.nome).replace(/[^a-z0-9. -]/g, '').trim().replace(/\s+/g, '_').replace(/^(\d)\./, '$1').replace(/^./, c => c.toUpperCase()) + '.docx'; }

/** ZIP final: os 8 documentos + o projeto (.json) + o prompt de busca (.md). */
async function zipFinal(p) {
    const z = new JSZip();
    const pasta = z.folder(nomeSeguro(p.titulo));
    for (const d of DOCUMENTOS) pasta.file((d.grupo === 'INPI' ? 'INPI/' : d.grupo === 'Universidade' ? 'Universidade/' : '') + nomeArquivoDoc(p, d), await gerarDocumento(p, d.id));
    const copia = JSON.parse(JSON.stringify(p));
    const imgs = pasta.folder('imagens');
    for (const d of p.desenhos) { const b = await Imagens.ler(d.img); if (b) imgs.file(d.img + '.' + (/png/.test(b.type) ? 'png' : 'jpg'), b); }
    pasta.file('pedido.json', JSON.stringify(copia, null, 1));
    pasta.file('prompt-busca-anterioridade.md', gerarMD(p));
    pasta.file('LEIA-ME.txt', `Pedido: ${tituloPedido(p)}\nGerado em ${dataBR(hojeISO())} pelo Apoio à Escrita de Patentes.\n\nINPI/: os 4 documentos do pedido (anexar no peticionamento como DOCX ou PDF).\nUniversidade/: memorando, formulário de informação tecnológica e formulário de busca (anexar no processo sigiloso do SEI).\n8. Relatório da busca: registro e documentos encontrados.\npedido.json + imagens/: abra no app ("Abrir projeto") para continuar.\n\nATENÇÃO: este arquivo tem dados pessoais dos inventores (CPF, endereço). Não publique nem envie por canais abertos.`);
    return z.generateAsync({ type: 'blob' });
}

async function lerZipProjeto(arq) {
    const z = await JSZip.loadAsync(arq);
    const j = Object.values(z.files).find(f => /pedido\.json$/.test(f.name));
    if (!j) throw new Error('O ZIP não tem pedido.json.');
    const p = normalizarPedido(JSON.parse(await j.async('string')));
    for (const d of p.desenhos) {
        const f = Object.values(z.files).find(x => x.name.includes('imagens/' + d.img + '.'));
        if (f) await Imagens.guardar(new Blob([await f.async('uint8array')], { type: /png$/.test(f.name) ? 'image/png' : 'image/jpeg' }), d.img);
    }
    return p;
}
