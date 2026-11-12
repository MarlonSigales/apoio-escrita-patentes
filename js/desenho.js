/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * EDITOR DE FIGURAS (parecido com o draw.io, sem servidor): cada figura é uma célula, como no Google Colab, e pode ter
 * uma imagem de fundo (foto, PNG/JPG/SVG feito fora, ex.: no draw.io) e elementos desenhados por cima: retângulo,
 * elipse, linha, texto e SETAS NUMERADAS. A seta aponta para a peça; o número fica na cauda, sempre na horizontal,
 * grande e com contorno branco, para ser legível. Arrastar a cauda gira a seta. Várias setas podem ter o mesmo número.
 * Cada número é um componente da ficha (nome + função): setas iguais compartilham a descrição, que pré-preenche o
 * relatório. Os textos têm PT/EN/ES, para trocar o idioma da figura sem redesenhar.
 * Na exportação (.docx), a figura é composta numa imagem PNG em preto e branco.
 */

'use strict';

const FIG_PADRAO = { w: 1000, h: 600 };
const FIG_TOOLS = [
    ['sel', '🖐️', 'Selecionar e mover (arraste as pontas para girar a seta)'],
    ['area', '⬚', 'Selecionar uma área e mover (como no Paint): arraste para marcar e depois arraste a área. Move a parte da imagem e o que estiver dentro. Delete apaga a área; Esc solta'],
    ['seta', '➘', 'Seta numerada: arraste da peça até onde o número deve ficar'],
    ['ligacao', '⤳', 'Ligação: fluxo, fio, tubulação ou sinal (estilo, pontas e cotovelo no painel). Encaixa nos terminais dos símbolos'],
    ['ret', '▭', 'Retângulo'], ['retArred', '▢', 'Caixa com bordas arredondadas'], ['elipse', '◯', 'Elipse'], ['linha', '╱', 'Linha'], ['texto', 'T', 'Texto (traduzível)']
];
const Ed = { tool: {}, num: {}, sel: {}, drag: null, desfazer: {}, url: {}, forma: {}, grade: {}, lig: {}, area: {} };
const ehCaixa = e => e.t === 'ret' || e.t === 'elipse' || e.t === 'sim';
const ehTraco = e => e.t === 'seta' || e.t === 'linha' || e.t === 'ligacao';
function passoGrade(d) { return Math.max(5, Math.round(d.w / 100)); }
function ligPadrao(id) { return Ed.lig[id] || (Ed.lig[id] = { estilo: 'cheia', ini: 'nenhuma', fim: 'seta', cotovelo: 'reto' }); }

/** Pontos da ligação, conforme o cotovelo (reta, em L ou em Z). */
function pontosLigacao(e) {
    const { x1, y1, x2, y2 } = e, xm = (x1 + x2) / 2;
    const pts = e.cotovelo === 'hv' ? [[x1, y1], [x2, y1], [x2, y2]] : e.cotovelo === 'vh' ? [[x1, y1], [x1, y2], [x2, y2]]
        : e.cotovelo === 'hvh' ? [[x1, y1], [xm, y1], [xm, y2], [x2, y2]] : [[x1, y1], [x2, y2]];
    return pts.filter((p, i) => !i || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.5);
}
function pontaLigacao(tipo, ponta, de, sw) {
    const L = Math.hypot(ponta[0] - de[0], ponta[1] - de[1]) || 1, ux = (ponta[0] - de[0]) / L, uy = (ponta[1] - de[1]) / L;
    const a = Math.max(10, sw * 5), b = a * .45, bx = ponta[0] - ux * a, by = ponta[1] - uy * a;
    if (tipo === 'seta') return `<polygon fill="#000" stroke="none" points="${ponta[0]},${ponta[1]} ${bx - uy * b},${by + ux * b} ${bx + uy * b},${by - ux * b}"/>`;
    if (tipo === 'aberta') return `<polyline fill="none" stroke="#000" stroke-width="${sw}" points="${bx - uy * b},${by + ux * b} ${ponta[0]},${ponta[1]} ${bx + uy * b},${by - ux * b}"/>`;
    if (tipo === 'ponto') return `<circle fill="#000" cx="${ponta[0]}" cy="${ponta[1]}" r="${sw * 2.6}"/>`;
    return '';
}
function svgLigacao(d, e) {
    const pts = pontosLigacao(e); if (pts.length < 2) return '';
    const base = Math.max(2, d.w / 400), sw = e.estilo === 'processo' ? base * 2.2 : base;
    const tr = e.estilo === 'eletrico' ? ` stroke-dasharray="${sw * 5} ${sw * 3}"` : e.estilo === 'pontilhada' ? ` stroke-dasharray="${sw * .1} ${sw * 2.5}" stroke-linecap="round"` : '';
    let s = `<polyline fill="none" stroke="#000" stroke-width="${sw}" stroke-linejoin="round"${tr} points="${pts.map(p => p.join(',')).join(' ')}"/>`;
    if (e.estilo === 'pneumatico' || e.estilo === 'dados') {
        const passo = Math.max(36, d.w / 26), m = passo * .22;
        for (let i = 1; i < pts.length; i++) {
            const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L;
            for (let t = passo / 2; t < L - passo * .3; t += passo) {
                const px = ax + ux * t, py = ay + uy * t;
                if (e.estilo === 'dados') s += `<circle cx="${px}" cy="${py}" r="${m}" fill="#fff" stroke="#000" stroke-width="${sw}"/>`;
                else for (const o of [-m * .7, m * .7]) { const qx = px + ux * o, qy = py + uy * o; s += `<line stroke="#000" stroke-width="${sw}" x1="${qx - uy * m * 1.6 + ux * m * .8}" y1="${qy + ux * m * 1.6 + uy * m * .8}" x2="${qx + uy * m * 1.6 - ux * m * .8}" y2="${qy - ux * m * 1.6 - uy * m * .8}"/>`; }
            }
        }
    }
    const n = pts.length;
    return s + pontaLigacao(e.fim, pts[n - 1], pts[n - 2], base) + pontaLigacao(e.ini, pts[0], pts[1], base);
}

/** Símbolo da biblioteca, girado/espelhado na sua caixa, com o rótulo sempre na horizontal. */
function svgSimbolo(p, d, e) {
    const def = SIMBOLOS[e.forma]; if (!def) return '';
    const rot = ((Number(e.rot) || 0) % 360 + 360) % 360, w = Math.abs(e.w), h = Math.abs(e.h);
    const [lw, lh] = rot % 180 ? [h, w] : [w, h], cx = e.x + w / 2, cy = e.y + h / 2;
    const sw = Math.max(2, d.w / 450), branco = def.g === 'fluxo' || def.g === 'blocos' || def.tag;
    let s = `<g transform="translate(${cx} ${cy}) rotate(${rot})${e.esp ? ' scale(-1 1)' : ''} translate(${-lw / 2} ${-lh / 2})" stroke="#000" stroke-width="${sw}" fill="${branco ? '#fff' : 'none'}" stroke-linejoin="round" stroke-linecap="round">${def.d(lw, lh)}</g>`;
    const txt = textoNoIdioma(p, e);
    if (txt && def.r !== 'nenhum' || txt && e.pt) {
        const linhas = def.tag && !txt.includes('|') ? txt.replace(/\s+/, '|').split('|') : txt.split('|');
        const maior = Math.max(...linhas.map(l => l.length), 1);
        const fs = Math.round(Number(e.tam) || (def.r === 'abaixo' || def.r === 'nenhum' ? Math.max(14, Math.min(d.w, d.h) * .03)
            : Math.max(11, Math.min(h / (linhas.length + (def.tag ? 1.6 : .8)), w * (def.g === 'fluxo' && e.forma === 'fx-decisao' ? .62 : .86) / (maior * .56), Math.min(d.w, d.h) * .034))));
        const gap = def.tag ? 1.4 : 1.1;
        const y0 = def.r === 'abaixo' || def.r === 'nenhum' ? e.y + h + fs * .8 : cy - (linhas.length - 1) * fs * gap / 2;
        const x0 = e.forma === 'bl-ganho' ? e.x + w * .38 : cx;
        s += `<text x="${x0}" y="${y0}" font-family="Arial, Helvetica, sans-serif" font-size="${fs}" fill="#000" text-anchor="middle" dominant-baseline="middle">${linhas.map((l, i) => `<tspan x="${x0}" dy="${i ? fs * gap : 0}">${esc(l)}</tspan>`).join('')}</text>`;
    }
    return s;
}

/**
 * Terminal k do símbolo (0 esquerda, 1 direita, 2 em cima, 3 embaixo, 4 centro), medido no desenho ORIGINAL do símbolo
 * e levado para a figura com o giro e o espelho. Assim o fio continua no mesmo terminal quando o símbolo gira.
 */
function terminalSimbolo(e, k) {
    const rot = ((Number(e.rot) || 0) % 360 + 360) % 360, w = Math.abs(e.w), h = Math.abs(e.h);
    const [lw, lh] = rot % 180 ? [h, w] : [w, h];
    let [lx, ly] = [[0, lh / 2], [lw, lh / 2], [lw / 2, 0], [lw / 2, lh], [lw / 2, lh / 2]][k] || [lw / 2, lh / 2];
    lx -= lw / 2; ly -= lh / 2; if (e.esp) lx = -lx;
    const a = rot * Math.PI / 180, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a));
    return [Math.round((e.x + w / 2 + lx * c - ly * s) * 10) / 10, Math.round((e.y + h / 2 + lx * s + ly * c) * 10) / 10];
}
/** Pontos onde as ligações encaixam: terminais dos símbolos (com o elemento e o terminal) e pontas das outras ligações. */
function terminaisFigura(d, exceto) {
    const t = [];
    for (const e of d.elementos || []) {
        if (e === exceto) continue;
        if (e.t === 'sim') { const ks = Math.abs(e.w) < 30 && Math.abs(e.h) < 30 ? [4, 0, 1, 2, 3] : [0, 1, 2, 3]; for (const k of ks) t.push([...terminalSimbolo(e, k), e.id, k]); }
        else if (e.t === 'ligacao' || e.t === 'linha') t.push([e.x1, e.y1, null, null], [e.x2, e.y2, null, null]);
    }
    return t;
}
function encaixar(d, p, exceto) {
    const tol = Math.max(10, d.w / 70);
    let melhor = null, dm = tol;
    for (const [x, y, el, k] of terminaisFigura(d, exceto)) { const dd = Math.hypot(x - p.x, y - p.y); if (dd < dm) { dm = dd; melhor = { x, y, el, k }; } }
    return melhor;
}
/** As ligações presas a um símbolo acompanham o símbolo quando ele é movido, redimensionado, girado ou espelhado. */
function atualizarLigacoes(d) {
    for (const e of d.elementos || []) {
        if (e.t !== 'ligacao' && e.t !== 'linha') continue;
        for (const [ponta, cx, cy] of [['con1', 'x1', 'y1'], ['con2', 'x2', 'y2']]) {
            const c = e[ponta]; if (!c) continue;
            const s = d.elementos.find(x => x.id === c.el && x.t === 'sim');
            if (!s) { delete e[ponta]; continue; }          // o símbolo foi apagado: a ponta fica solta onde estava
            [e[cx], e[cy]] = terminalSimbolo(s, c.k);
        }
    }
}
function prender(e, ponta, q) { if (q && q.el) e[ponta] = { el: q.el, k: q.k }; else delete e[ponta]; }

function normalizarFigura(d) {
    d.w = Number(d.w) || FIG_PADRAO.w; d.h = Number(d.h) || FIG_PADRAO.h;
    d.elementos = (Array.isArray(d.elementos) ? d.elementos : []).map(e => Object.assign({ id: uid() }, e));
    return d;
}
function figura(id) { return App.p.desenhos.find(d => d.id === id); }
function fonteNum(d) { return Math.round(Math.max(20, Math.min(d.w, d.h) * 0.045)); }
function fonteTexto(d, e) { return Math.round(Number(e.tam) || Math.max(16, Math.min(d.w, d.h) * 0.032)); }
function n2(n) { const s = String(n || '').replace(/\D/g, ''); return s ? s.padStart(2, '0') : ''; }
function textoNoIdioma(p, e) { const l = p.idiomaDesenhos || 'pt'; return (l !== 'pt' && e[l]) ? e[l] : (e.pt || ''); }

/** Números usados em todas as figuras e na ficha (para sugerir o próximo). */
function numerosUsados(p) {
    const s = new Set(p.ficha.componentes.map(c => n2(c.num)).filter(Boolean));
    for (const d of p.desenhos) for (const e of d.elementos || []) if (e.t === 'seta' && e.num) s.add(n2(e.num));
    return [...s].sort();
}
/** Próximo número da figura: o menor componente ainda não usado nela; se todos já estiverem, um número novo. */
function proximoNumero(p, d) {
    const naFig = new Set((d.elementos || []).filter(e => e.t === 'seta').map(e => n2(e.num)));
    const livre = p.ficha.componentes.map(c => n2(c.num)).filter(n => n && !naFig.has(n)).sort()[0];
    if (livre) return livre;
    const max = Math.max(0, ...numerosUsados(p).map(Number));
    return n2(max + 1);
}
function garantirComponente(p, num) {
    num = n2(num);
    if (num && !p.ficha.componentes.some(c => n2(c.num) === num)) {
        p.ficha.componentes.push({ id: uid(), num, nome: '', funcao: '' });
        p.ficha.componentes.sort((a, b) => n2(a.num).localeCompare(n2(b.num)));
    }
    return num;
}
function numerosDaFigura(d) { return [...new Set((d.elementos || []).filter(e => e.t === 'seta' && e.num).map(e => n2(e.num)))].sort(); }

// ------------------------------------------------------------ SVG
function svgElemento(p, d, e, comAlcas) {
    const sel = comAlcas && Ed.sel[d.id] === e.id;
    const traço = `stroke="#000" stroke-width="${Math.max(2, d.w / 400)}" fill="none"`;
    let s = '';
    if (e.t === 'ret') { const x = Math.min(e.x, e.x + e.w), y = Math.min(e.y, e.y + e.h), w = Math.abs(e.w), h = Math.abs(e.h), r = e.arred ? Math.round(Math.min(w, h) * 0.2) : 0; s = `<rect x="${x}" y="${y}" width="${w}" height="${h}"${r ? ` rx="${r}" ry="${r}"` : ''} ${traço}/>`; }
    else if (e.t === 'elipse') s = `<ellipse cx="${e.x + e.w / 2}" cy="${e.y + e.h / 2}" rx="${Math.abs(e.w / 2)}" ry="${Math.abs(e.h / 2)}" ${traço}/>`;
    else if (e.t === 'linha') s = `<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" ${traço}/>`;
    else if (e.t === 'ligacao') s = svgLigacao(d, e);
    else if (e.t === 'sim') s = svgSimbolo(p, d, e);
    else if (e.t === 'texto') {
        const fs = fonteTexto(d, e);
        s = `<text x="${e.x}" y="${e.y}" font-family="Arial, Helvetica, sans-serif" font-size="${fs}" fill="#000" dominant-baseline="middle" text-anchor="middle">${esc(textoNoIdioma(p, e) || 'Texto')}</text>`;
    } else if (e.t === 'seta') {
        const fs = fonteNum(d), dx = e.x2 - e.x1, dy = e.y2 - e.y1, L = Math.hypot(dx, dy) || 1;
        const ux = dx / L, uy = dy / L;
        const nx = e.x2 + ux * fs * 0.85, ny = e.y2 + uy * fs * 0.75;          // número logo além da cauda
        const ah = Math.max(10, fs * 0.55), aw = ah * 0.55;                      // ponta da seta
        const bx = e.x1 + ux * ah, by = e.y1 + uy * ah;
        const sw = Math.max(2, d.w / 450);
        s = `<line x1="${bx}" y1="${by}" x2="${e.x2}" y2="${e.y2}" stroke="#000" stroke-width="${sw}"/>` +
            `<polygon points="${e.x1},${e.y1} ${bx - uy * aw},${by + ux * aw} ${bx + uy * aw},${by - ux * aw}" fill="#000"/>` +
            `<text x="${nx}" y="${ny}" font-family="Arial, Helvetica, sans-serif" font-size="${fs}" font-weight="700" fill="#000" stroke="#fff" stroke-width="${fs * 0.22}" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${esc(n2(e.num))}</text>`;
    }
    if (!comAlcas) return s;
    const alvo = `data-el="${e.id}"`;
    let alcas = '';
    const h = Math.max(7, d.w / 120);
    if (sel) {
        if (ehTraco(e)) alcas = `<circle class="alca" data-alca="1" ${alvo} cx="${e.x1}" cy="${e.y1}" r="${h}"/><circle class="alca alca-giro" data-alca="2" ${alvo} cx="${e.x2}" cy="${e.y2}" r="${h}"/>`;
        else if (ehCaixa(e)) alcas = `<rect class="selecao" x="${Math.min(e.x, e.x + e.w)}" y="${Math.min(e.y, e.y + e.h)}" width="${Math.abs(e.w)}" height="${Math.abs(e.h)}"/><circle class="alca" data-alca="br" ${alvo} cx="${e.x + e.w}" cy="${e.y + e.h}" r="${h}"/>`;
        else if (e.t === 'texto') alcas = `<circle class="alca" data-alca="mv" ${alvo} cx="${e.x}" cy="${e.y + fonteTexto(d, e) * 0.9}" r="${h * 0.8}"/>`;
    }
    // área de clique mais larga que o traço
    const zona = e.t === 'ligacao' ? `<polyline class="zona" ${alvo} fill="none" points="${pontosLigacao(e).map(q => q.join(',')).join(' ')}" stroke-width="${Math.max(18, d.w / 50)}"/>`
        : e.t === 'seta' || e.t === 'linha' ? `<line class="zona" ${alvo} x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke-width="${Math.max(18, d.w / 50)}"/>` +
        (e.t === 'seta' ? `<circle class="zona" ${alvo} cx="${e.x2 + (e.x2 - e.x1) / (Math.hypot(e.x2 - e.x1, e.y2 - e.y1) || 1) * fonteNum(d) * 0.85}" cy="${e.y2 + (e.y2 - e.y1) / (Math.hypot(e.x2 - e.x1, e.y2 - e.y1) || 1) * fonteNum(d) * 0.75}" r="${fonteNum(d) * 0.8}"/>` : '')
        : e.t === 'texto' ? `<rect class="zona" ${alvo} x="${e.x - fonteTexto(d, e) * 3}" y="${e.y - fonteTexto(d, e) * 0.7}" width="${fonteTexto(d, e) * 6}" height="${fonteTexto(d, e) * 1.4}"/>`
        : `<rect class="zona" ${alvo} x="${Math.min(e.x, e.x + e.w) - 6}" y="${Math.min(e.y, e.y + e.h) - 6}" width="${Math.abs(e.w) + 12}" height="${Math.abs(e.h) + 12}" fill="none" stroke-width="12"/>`;
    return `<g class="el ${sel ? 'sel' : ''}">${s}${zona}${alcas}</g>`;
}

function svgFigura(p, d, urlFundo, comAlcas) {
    atualizarLigacoes(d);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d.w} ${d.h}" width="${d.w}" height="${d.h}" class="fig-svg" data-fig="${d.id}">` +
        `<rect x="0" y="0" width="${d.w}" height="${d.h}" fill="#fff"/>` +
        (comAlcas && Ed.grade[d.id] !== false ? `<defs><pattern id="grade-${d.id}" width="${passoGrade(d) * 2}" height="${passoGrade(d) * 2}" patternUnits="userSpaceOnUse"><circle cx="0.8" cy="0.8" r="0.8" fill="#c9d6d2"/></pattern></defs><rect x="0" y="0" width="${d.w}" height="${d.h}" fill="url(#grade-${d.id})" pointer-events="none"/>` : '') +
        (urlFundo ? `<image href="${urlFundo}" x="0" y="0" width="${d.w}" height="${d.h}" preserveAspectRatio="xMidYMid meet"/>` : '') +
        (d.elementos || []).map(e => svgElemento(p, d, e, comAlcas)).join('') + (comAlcas ? svgArea(d, urlFundo) : '') + '</svg>';
}

// ------------------------------------------------------------ seleção de área (como no Paint)
/** A área marcada; enquanto é arrastada, a parte da imagem aparece no destino e o lugar de origem fica branco. */
function svgArea(d, urlFundo) {
    const a = Ed.area[d.id]; if (!a || (!a.w && !a.h)) return '';
    const r = retArea(a), dx = a.dx || 0, dy = a.dy || 0;
    let s = '';
    if ((dx || dy) && urlFundo) s += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#fff"/><svg x="${r.x + dx}" y="${r.y + dy}" width="${r.w}" height="${r.h}" viewBox="${r.x} ${r.y} ${r.w} ${r.h}" overflow="hidden"><image href="${urlFundo}" x="0" y="0" width="${d.w}" height="${d.h}" preserveAspectRatio="xMidYMid meet"/></svg>`;
    return s + `<rect class="area-sel" data-area="1" x="${r.x + dx}" y="${r.y + dy}" width="${r.w}" height="${r.h}"/>`;
}
function retArea(a) { return { x: Math.min(a.x, a.x + a.w), y: Math.min(a.y, a.y + a.h), w: Math.abs(a.w), h: Math.abs(a.h) }; }
function dentroArea(r, q) { return q.x >= r.x && q.x <= r.x + r.w && q.y >= r.y && q.y <= r.y + r.h; }
/** Elementos inteiramente dentro da área (andam junto com ela). */
function elementosNaArea(d, r) {
    return (d.elementos || []).filter(e => {
        const pts = 'x1' in e ? [{ x: e.x1, y: e.y1 }, { x: e.x2, y: e.y2 }] : 'w' in e ? [{ x: e.x, y: e.y }, { x: e.x + e.w, y: e.y + e.h }] : [{ x: e.x, y: e.y }];
        return pts.every(q => dentroArea(r, q));
    });
}
/** Recorta a área da imagem de fundo e cola deslocada (dx, dy em unidades da figura); com dx = dy = null, só apaga (branco). */
async function moverAreaImagem(d, r, dx, dy) {
    const blob = d.img ? await Imagens.ler(d.img) : null;
    if (!blob) return false;
    const url = URL.createObjectURL(blob);
    try {
        const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = url; });
        const nw = img.naturalWidth || d.w, nh = img.naturalHeight || d.h;
        const k = Math.min(d.w / nw, d.h / nh), ox = (d.w - nw * k) / 2, oy = (d.h - nh * k) / 2;   // preserveAspectRatio meet
        const sx = Math.round((r.x - ox) / k), sy = Math.round((r.y - oy) / k), sw = Math.round(r.w / k), sh = Math.round(r.h / k);
        const cv = document.createElement('canvas'); cv.width = nw; cv.height = nh;
        const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, nw, nh); c.drawImage(img, 0, 0);
        const pedaco = document.createElement('canvas'); pedaco.width = Math.max(1, sw); pedaco.height = Math.max(1, sh);
        pedaco.getContext('2d').drawImage(cv, sx, sy, sw, sh, 0, 0, sw, sh);
        c.fillStyle = '#fff'; c.fillRect(sx, sy, sw, sh);
        if (dx !== null) c.drawImage(pedaco, Math.round(sx + dx / k), Math.round(sy + dy / k));
        const novo = await new Promise(ok => cv.toBlob(ok, 'image/png'));
        d.img = await Imagens.guardar(novo);
        return true;
    } finally { URL.revokeObjectURL(url); }
}
/** Apaga a área marcada: a parte da imagem fica branca e os elementos de dentro saem. */
async function apagarArea(id) {
    const d = figura(id), a = Ed.area[id]; if (!d || !a) return;
    const r = retArea(a); if (r.w < 2 || r.h < 2) return;
    guardarDesfazer(d);
    const dentro = new Set(elementosNaArea(d, r).map(e => e.id));
    d.elementos = d.elementos.filter(e => !dentro.has(e.id));
    await moverAreaImagem(d, r, null, null);
    Ed.area[id] = null; redesenhar(id); terminouMudanca(d);
}
function soltarArea(id) { Ed.area[id] = null; redesenharJa(id); atualizarPainel(id); }

/** Redesenha só o conteúdo do <svg> (o elemento continua o mesmo, para o arrasto não se perder). */
function redesenharJa(id) {
    const d = figura(id), alvo = document.querySelector(`.fig-tela[data-fig="${id}"]`);
    if (!d || !alvo) return;
    atualizarLigacoes(d);
    const novo = svgFigura(App.p, d, Ed.url[id] || '', true);
    const svg = alvo.querySelector('svg.fig-svg');
    if (svg && svg.getAttribute('viewBox') === `0 0 ${d.w} ${d.h}`) svg.innerHTML = novo.replace(/^<svg[^>]*>|<\/svg>$/g, '');
    else alvo.innerHTML = novo;
}
async function redesenhar(id) {
    const d = figura(id); if (!d) return;
    Ed.url[id] = d.img ? (await Imagens.url(d.img)) || '' : '';
    redesenharJa(id);
    atualizarPainel(id);
}

/** Painel do elemento selecionado (número da seta, textos PT/EN/ES, tamanho, apagar). */
function atualizarPainel(id) {
    const d = figura(id), box = document.querySelector(`.fig-painel[data-fig="${id}"]`);
    if (!d || !box) return;
    if ((Ed.tool[id] || 'sel') === 'area') {
        const a = Ed.area[id];
        box.innerHTML = `<b>⬚ Selecionar área</b><small>${a ? 'Arraste a área tracejada para mover a parte da imagem e o que estiver dentro dela. Clique fora para marcar outra.' : 'Arraste sobre a figura para marcar a parte que quer mover (funciona também em imagens e figuras escaneadas).'}</small>` +
            (a ? `<div class="botoes"><button type="button" class="btn btn-danger btn-sm" data-acao="fig-area-apagar" data-fig="${id}" title="Delete">🗑 Apagar a área</button><button type="button" class="btn btn-secondary btn-sm" data-acao="fig-area-soltar" data-fig="${id}" title="Esc">Soltar</button></div>` : '');
        return;
    }
    const e = (d.elementos || []).find(x => x.id === Ed.sel[id]);
    if (!e) { box.innerHTML = '<small>Clique num elemento para editar. Tecla Delete apaga; Ctrl+Z desfaz.</small>'; return; }
    const c = `desenhos.#${d.id}.elementos.#${e.id}.`;
    const nomes = { seta: 'Seta numerada', ret: e.arred ? 'Caixa arredondada' : 'Retângulo', elipse: 'Elipse', linha: 'Linha', texto: 'Texto', ligacao: 'Ligação', sim: (SIMBOLOS[e.forma] || {}).n || 'Símbolo' };
    const sel = (prop, opts, val) => `<select data-fig-prop="${prop}" data-fig="${d.id}">${opts.map(([v, t]) => `<option value="${v}" ${val === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
    let corpo = '';
    if (e.t === 'seta') corpo = `<label class="campo-inline">Número <select data-fig-num="${d.id}">${[...new Set([...numerosUsados(App.p), n2(e.num)])].sort().map(n => `<option ${n === n2(e.num) ? 'selected' : ''}>${n}</option>`).join('')}<option value="novo">novo (${n2(Math.max(0, ...numerosUsados(App.p).map(Number)) + 1)})</option></select></label><small>Setas com o mesmo número usam a mesma descrição.</small>`;
    if (e.t === 'texto') corpo = `<label>Português<input type="text" data-c="${c}pt" value="${escAttr(e.pt)}"></label><label>Inglês<input type="text" data-c="${c}en" value="${escAttr(e.en)}"></label><label>Espanhol<input type="text" data-c="${c}es" value="${escAttr(e.es)}"></label><label class="campo-inline">Tamanho <input type="number" min="8" max="200" data-c="${c}tam" value="${escAttr(e.tam || fonteTexto(d, e))}" style="width:5rem"></label>`;
    if (e.t === 'sim') corpo = `<label>Rótulo (português)<input type="text" data-c="${c}pt" value="${escAttr(e.pt)}"></label><label>Inglês<input type="text" data-c="${c}en" value="${escAttr(e.en)}"></label><label>Espanhol<input type="text" data-c="${c}es" value="${escAttr(e.es)}"></label><small>Use | para quebrar a linha (ex.: Ler|sensor).</small><label class="campo-inline">Tamanho do texto <input type="number" min="8" max="200" data-c="${c}tam" value="${escAttr(e.tam || '')}" placeholder="auto" style="width:5rem"></label>`;
    if (e.t === 'ret') corpo = `<label>Cantos ${sel('arred', [['', 'Retos'], ['1', 'Arredondados']], e.arred ? '1' : '')}</label>`;
    if (e.t === 'ligacao') corpo = `<label>Estilo ${sel('estilo', ESTILOS_LIGACAO, e.estilo)}</label><label>Ponta no fim ${sel('fim', PONTAS_LIGACAO, e.fim)}</label><label>Ponta no início ${sel('ini', PONTAS_LIGACAO, e.ini)}</label><label>Traçado ${sel('cotovelo', COTOVELOS, e.cotovelo)}</label><small>As próximas ligações desta figura usam o mesmo estilo.</small>`;
    const giro = e.t !== 'texto' ? `<button type="button" class="btn btn-secondary btn-sm" data-acao="fig-girar" data-fig="${d.id}" title="Girar 90°">⟳ 90°</button>` : '';
    const esp = e.t === 'sim' ? `<button type="button" class="btn btn-secondary btn-sm" data-acao="fig-espelhar" data-fig="${d.id}" title="Espelhar na horizontal">⇋ Espelhar</button>` : '';
    box.innerHTML = `<b>${esc(nomes[e.t])}</b> ${corpo}<div class="botoes">${giro}${esp}<button type="button" class="btn btn-secondary btn-sm" data-acao="fig-duplicar" data-fig="${d.id}" title="Duplicar (Ctrl+D)">⧉ Duplicar</button><button type="button" class="btn btn-danger btn-sm" data-acao="fig-apagar" data-fig="${d.id}">🗑 Apagar</button></div>`;
}

// ------------------------------------------------------------ interação (ponteiro)
function pontoSVG(svg, ev) {
    const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
    const r = pt.matrixTransform(m.inverse()), d = figura(svg.dataset.fig);
    if (d && Ed.grade[d.id] !== false) { const g = passoGrade(d); return { x: Math.round(r.x / g) * g, y: Math.round(r.y / g) * g }; }
    return { x: Math.round(r.x), y: Math.round(r.y) };
}
function guardarDesfazer(d) { (Ed.desfazer[d.id] = Ed.desfazer[d.id] || []).push(JSON.stringify({ el: d.elementos, img: d.img || '' })); if (Ed.desfazer[d.id].length > 60) Ed.desfazer[d.id].shift(); }
function terminouMudanca(d) { salvar(); atualizarSecoesFigura(d.id); }

document.addEventListener('pointerdown', ev => {
    const svg = ev.target.closest && ev.target.closest('svg.fig-svg');
    if (!svg) return;
    ev.preventDefault();
    const id = svg.dataset.fig, d = figura(id); if (!d) return;
    const tool = Ed.tool[id] || 'sel', p0 = pontoSVG(svg, ev);
    const alvoEl = ev.target.closest('[data-el]');
    if (tool === 'area') {
        const a = Ed.area[id];
        if (a && (a.w || a.h) && dentroArea(retArea(a), p0)) {
            const r = retArea(a);
            guardarDesfazer(d);
            const els = elementosNaArea(d, r).map(e => ({ e, o: JSON.parse(JSON.stringify(e)) }));
            Ed.drag = { id, svg, modo: 'area-mover', p0, els, e: { t: 'area' } };
        } else {
            Ed.area[id] = { x: p0.x, y: p0.y, w: 0, h: 0, dx: 0, dy: 0 };
            Ed.drag = { id, svg, modo: 'area-nova', p0, e: { t: 'area' } };
        }
        redesenharJa(id); return;
    }
    if (tool === 'sel' || ev.target.classList.contains('alca')) {
        if (!alvoEl) { Ed.sel[id] = null; redesenharJa(id); atualizarPainel(id); return; }
        const e = d.elementos.find(x => x.id === alvoEl.dataset.el);
        Ed.sel[id] = e.id; guardarDesfazer(d);
        Ed.drag = { id, svg, e, modo: ev.target.dataset.alca || 'mover', p0, orig: JSON.parse(JSON.stringify(e)) };
        redesenharJa(id); atualizarPainel(id); return;
    }
    guardarDesfazer(d);
    let e;
    if (tool === 'ret' || tool === 'elipse') e = { id: uid(), t: tool, x: p0.x, y: p0.y, w: 1, h: 1 };
    else if (tool === 'retArred') e = { id: uid(), t: 'ret', arred: '1', x: p0.x, y: p0.y, w: 1, h: 1 };   // caixa com bordas arredondadas
    else if (tool === 'sim') {
        const forma = Ed.forma[id], def = SIMBOLOS[forma]; if (!def) return;
        const tr = TXT_SIMBOLO[def.txt] || [];
        e = { id: uid(), t: 'sim', forma, x: p0.x, y: p0.y, w: 1, h: 1, rot: 0, pt: def.txt, en: tr[0] || (def.txt && !TXT_SIMBOLO[def.txt] ? def.txt : ''), es: tr[1] || (def.txt && !TXT_SIMBOLO[def.txt] ? def.txt : '') };
    } else if (tool === 'ligacao') {
        const q = encaixar(d, p0) || p0;
        e = Object.assign({ id: uid(), t: 'ligacao', x1: q.x, y1: q.y, x2: q.x + 1, y2: q.y }, ligPadrao(id));
        prender(e, 'con1', q);
    }
    else if (tool === 'linha') e = { id: uid(), t: 'linha', x1: p0.x, y1: p0.y, x2: p0.x + 1, y2: p0.y + 1 };
    else if (tool === 'seta') {
        const num = garantirComponente(App.p, Ed.num[id] && Ed.num[id] !== 'auto' ? Ed.num[id] : proximoNumero(App.p, d));
        e = { id: uid(), t: 'seta', num, x1: p0.x, y1: p0.y, x2: p0.x + 1, y2: p0.y - 1 };
    } else if (tool === 'texto') {
        e = { id: uid(), t: 'texto', x: p0.x, y: p0.y, pt: 'Texto', en: '', es: '' };
        d.elementos.push(e); Ed.sel[id] = e.id; Ed.tool[id] = 'sel'; marcarFerramenta(id);
        redesenhar(id).then(() => { const i = document.querySelector(`.fig-painel[data-fig="${id}"] input[data-c$=".pt"]`); if (i) { i.focus(); i.select(); } });
        terminouMudanca(d); return;
    }
    d.elementos.push(e); Ed.sel[id] = e.id;
    Ed.drag = { id, svg, e, modo: 'novo', p0, orig: JSON.parse(JSON.stringify(e)) };
    redesenharJa(id);
});
document.addEventListener('pointermove', ev => {
    const g = Ed.drag; if (!g) return;
    let p = pontoSVG(g.svg, ev);
    if (g.modo === 'area-nova' || g.modo === 'area-mover') {
        const a = Ed.area[g.id]; if (!a) return;
        const dx = p.x - g.p0.x, dy = p.y - g.p0.y;
        if (g.modo === 'area-nova') { a.w = dx; a.h = dy; }
        else {
            a.dx = dx; a.dy = dy;
            for (const { e, o } of g.els) { if ('x1' in o) { e.x1 = o.x1 + dx; e.y1 = o.y1 + dy; e.x2 = o.x2 + dx; e.y2 = o.y2 + dy; delete e.con1; delete e.con2; } else { e.x = o.x + dx; e.y = o.y + dy; } }
        }
        redesenharJa(g.id); return;
    }
    if ((g.e.t === 'ligacao' || g.e.t === 'linha') && ['novo', '1', '2'].includes(g.modo)) {
        const q = encaixar(figura(g.id), p, g.e);
        prender(g.e, g.modo === '1' ? 'con1' : 'con2', q);      // solta a ponta se ela sair do terminal
        if (q) p = { x: q.x, y: q.y };
    }
    if ((g.e.t === 'ligacao' || g.e.t === 'linha') && g.modo === 'mover') { delete g.e.con1; delete g.e.con2; }   // arrastar a ligação inteira a solta
    const dx = p.x - g.p0.x, dy = p.y - g.p0.y, e = g.e, o = g.orig;
    if (g.modo === 'novo') {
        if (ehCaixa(e)) { e.w = dx; e.h = dy; } else { e.x2 = p.x; e.y2 = p.y; }
    } else if (g.modo === 'mover') {
        if ('x1' in o) { e.x1 = o.x1 + dx; e.y1 = o.y1 + dy; e.x2 = o.x2 + dx; e.y2 = o.y2 + dy; } else { e.x = o.x + dx; e.y = o.y + dy; }
    } else if (g.modo === '1') { e.x1 = p.x; e.y1 = p.y; }
    else if (g.modo === '2') { e.x2 = p.x; e.y2 = p.y; }
    else if (g.modo === 'br') { e.w = o.w + dx; e.h = o.h + dy; }
    else if (g.modo === 'mv') { e.x = o.x + dx; e.y = o.y + dy; }
    redesenharJa(g.id);
});
document.addEventListener('pointerup', async () => {
    const g = Ed.drag; if (!g) return;
    Ed.drag = null;
    if (g.modo === 'area-nova') {
        const a = Ed.area[g.id];
        if (a) { const r = retArea(a); if (r.w < 4 || r.h < 4) Ed.area[g.id] = null; else Object.assign(a, r, { dx: 0, dy: 0 }); }
        redesenharJa(g.id); atualizarPainel(g.id); return;
    }
    if (g.modo === 'area-mover') {
        const d = figura(g.id), a = Ed.area[g.id]; if (!d || !a) return;
        const dx = a.dx || 0, dy = a.dy || 0;
        if (dx || dy) { await moverAreaImagem(d, retArea(a), dx, dy); a.x += dx; a.y += dy; }
        a.dx = 0; a.dy = 0;
        redesenhar(g.id); terminouMudanca(d); return;
    }
    const d = figura(g.id), e = g.e;
    if (g.modo === 'novo') {
        const pequeno = ehCaixa(e) ? Math.abs(e.w) < 6 && Math.abs(e.h) < 6 : Math.hypot(e.x2 - e.x1, e.y2 - e.y1) < 8;
        if (pequeno) {
            const k = Math.min(d.w, d.h);
            if (e.t === 'sim') { const def = SIMBOLOS[e.forma], f = k / 600; e.w = Math.round(def.w * f); e.h = Math.round(def.h * f); e.x = Math.round(e.x - e.w / 2); e.y = Math.round(e.y - e.h / 2); }
            else if (e.t === 'ret' || e.t === 'elipse') { e.w = k * 0.2; e.h = k * 0.14; }
            else if (e.t === 'seta') { e.x2 = e.x1 + k * 0.12; e.y2 = e.y1 - k * 0.12; }     // clique simples: seta a 45°, número em cima à direita
            else { e.x2 = e.x1 + k * 0.2; e.y2 = e.y1; }
        }
        if (e.w < 0) { e.x += e.w; e.w = -e.w; } if (e.h < 0) { e.y += e.h; e.h = -e.h; }
        if (e.t === 'sim') { Ed.tool[g.id] = 'sel'; marcarFerramenta(g.id); }
    }
    if (g.modo === 'br') { if (e.w < 0) { e.x += e.w; e.w = -e.w; } if (e.h < 0) { e.y += e.h; e.h = -e.h; } }
    redesenhar(g.id); terminouMudanca(d);
});
document.addEventListener('keydown', ev => {
    const ativo = document.activeElement;
    if (ativo && /INPUT|TEXTAREA|SELECT/.test(ativo.tagName)) return;
    const idArea = Object.keys(Ed.area).find(k => Ed.area[k] && document.querySelector(`.fig-tela[data-fig="${k}"]`));
    if (idArea && (ev.key === 'Delete' || ev.key === 'Backspace')) { ev.preventDefault(); apagarArea(idArea); return; }
    if (idArea && ev.key === 'Escape') { soltarArea(idArea); return; }
    const id = Object.keys(Ed.sel).find(k => Ed.sel[k] && document.querySelector(`.fig-tela[data-fig="${k}"]`));
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && id) { ev.preventDefault(); apagarSelecionado(id); }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'd' && id) { ev.preventDefault(); duplicarSelecionado(id); }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
        const fid = id || Object.keys(Ed.desfazer).find(k => (Ed.desfazer[k] || []).length);
        if (fid) { ev.preventDefault(); desfazerFigura(fid); }
    }
});
function apagarSelecionado(id) {
    const d = figura(id); if (!d) return;
    const i = d.elementos.findIndex(x => x.id === Ed.sel[id]); if (i < 0) return;
    guardarDesfazer(d); d.elementos.splice(i, 1); Ed.sel[id] = null; redesenhar(id); terminouMudanca(d);
}
function duplicarSelecionado(id) {
    const d = figura(id), e = d && d.elementos.find(x => x.id === Ed.sel[id]); if (!e) return;
    guardarDesfazer(d);
    const c = JSON.parse(JSON.stringify(e)), o = passoGrade(d) * 3;
    c.id = uid(); delete c.con1; delete c.con2; if ('x1' in c) { c.x1 += o; c.y1 += o; c.x2 += o; c.y2 += o; } else { c.x += o; c.y += o; }
    d.elementos.push(c); Ed.sel[id] = c.id; redesenhar(id); terminouMudanca(d);
}
/** Gira 90° o elemento selecionado (símbolo: na própria caixa; traços: em torno do meio). */
function girarSelecionado(id) {
    const d = figura(id), e = d && d.elementos.find(x => x.id === Ed.sel[id]); if (!e) return;
    guardarDesfazer(d);
    if (ehCaixa(e)) { const cx = e.x + e.w / 2, cy = e.y + e.h / 2; [e.w, e.h] = [e.h, e.w]; e.x = Math.round(cx - e.w / 2); e.y = Math.round(cy - e.h / 2); if (e.t === 'sim') e.rot = ((Number(e.rot) || 0) + 90) % 360; }
    else if ('x1' in e) { const mx = (e.x1 + e.x2) / 2, my = (e.y1 + e.y2) / 2; [e.x1, e.y1] = [mx - (e.y1 - my), my + (e.x1 - mx)]; [e.x2, e.y2] = [mx - (e.y2 - my), my + (e.x2 - mx)]; }
    redesenhar(id); terminouMudanca(d);
}
function espelharSelecionado(id) {
    const d = figura(id), e = d && d.elementos.find(x => x.id === Ed.sel[id]); if (!e || e.t !== 'sim') return;
    guardarDesfazer(d); e.esp = !e.esp; redesenhar(id); terminouMudanca(d);
}
function desfazerFigura(id) {
    const d = figura(id), pilha = Ed.desfazer[id]; if (!d || !pilha || !pilha.length) return;
    const x = JSON.parse(pilha.pop());
    if (Array.isArray(x)) d.elementos = x; else { d.elementos = x.el; d.img = x.img; }
    Ed.sel[id] = null; Ed.area[id] = null; redesenhar(id); terminouMudanca(d);
}
function marcarFerramenta(id) {
    document.querySelectorAll(`.fig-ferr[data-fig="${id}"] [data-tool]`).forEach(b => b.classList.toggle('ativo', b.dataset.tool === (Ed.tool[id] || 'sel')));
    document.querySelectorAll(`.fig-biblio[data-fig="${id}"] [data-forma]`).forEach(b => b.classList.toggle('ativo', Ed.tool[id] === 'sim' && b.dataset.forma === Ed.forma[id]));
}

/** Biblioteca de símbolos (fluxograma, blocos, elétrico e P&ID), com miniaturas desenhadas pelo próprio editor. */
function htmlBibliotecaFigura(d) {
    const mini = (k, def) => { const m = 34 / Math.max(def.w, def.h), w = def.w * m, h = def.h * m; return `<svg viewBox="-2 -2 ${w + 4} ${h + 4}" width="34" height="34" aria-hidden="true"><g stroke="#000" stroke-width="1.4" fill="none" stroke-linejoin="round">${def.d(w, h)}</g></svg>`; };
    return `<div class="fig-biblio" data-fig="${d.id}">${GRUPOS_SIMBOLOS.map(([g, nome]) => `<details><summary>${nome}</summary><div class="fig-biblio-itens">${Object.entries(SIMBOLOS).filter(([, s]) => s.g === g).map(([k, s]) => `<button type="button" class="simb ${Ed.tool[d.id] === 'sim' && Ed.forma[d.id] === k ? 'ativo' : ''}" data-acao="fig-simbolo" data-fig="${d.id}" data-forma="${k}" title="${escAttr(s.n)}: clique no desenho para pôr (ou arraste para escolher o tamanho)">${mini(k, s)}</button>`).join('')}</div></details>`).join('')}</div>`;
}

// número escolhido no painel / na barra
document.addEventListener('change', ev => {
    const s = ev.target;
    if (s.dataset.figNum) {
        const d = figura(s.dataset.figNum), e = d && d.elementos.find(x => x.id === Ed.sel[d.id]);
        if (!e) return;
        guardarDesfazer(d);
        e.num = garantirComponente(App.p, s.value === 'novo' ? n2(Math.max(0, ...numerosUsados(App.p).map(Number)) + 1) : s.value);
        redesenhar(d.id); terminouMudanca(d);
    } else if (s.dataset.figNumBarra) Ed.num[s.dataset.figNumBarra] = s.value;
    else if (s.dataset.figProp) {
        const d = figura(s.dataset.fig), e = d && d.elementos.find(x => x.id === Ed.sel[d.id]);
        if (!e) return;
        guardarDesfazer(d); e[s.dataset.figProp] = s.value;
        if (e.t === 'ligacao') ligPadrao(d.id)[s.dataset.figProp] = s.value;
        redesenharJa(d.id); salvar();
    }
});
// textos e tamanhos redesenham ao digitar
document.addEventListener('input', ev => {
    const c = ev.target.dataset && ev.target.dataset.c;
    const m = c && c.match(/^desenhos\.#([^.]+)\.elementos\./);
    if (m) redesenharJa(m[1]);          // só a figura: o painel e o campo em edição continuam com o foco
});

// ------------------------------------------------------------ seções abaixo da figura (números e textos)
function htmlSecoesFigura(p, d) {
    const nums = numerosDaFigura(d);
    const textos = (d.elementos || []).filter(e => e.t === 'texto' || (e.t === 'sim' && (e.pt || e.en || e.es)));
    const comps = nums.map(n => p.ficha.componentes.find(c => n2(c.num) === n)).filter(Boolean);
    const contar = n => d.elementos.filter(e => e.t === 'seta' && n2(e.num) === n).length;
    return `<details class="fig-sec" open><summary><b>🔢 Descrição das setas</b> <small>${nums.length ? nums.length + ' número(s)' : 'nenhuma seta ainda'}</small></summary>
        ${comps.length ? `<div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Nº</th><th>Nome do componente</th><th>Função (opcional)</th><th>Setas</th></tr></thead><tbody>${comps.map(c => `<tr><td class="col-cod">${esc(n2(c.num))}</td><td><input type="text" data-c="ficha.componentes.#${c.id}.nome" value="${escAttr(c.nome)}" placeholder="ex.: sensor de pressão"></td><td><input type="text" data-c="ficha.componentes.#${c.id}.funcao" value="${escAttr(c.funcao)}" placeholder="ex.: medir a pressão do duto"></td><td class="col-centro">${contar(n2(c.num))}</td></tr>`).join('')}</tbody></table></div>
        <p class="nota">A descrição é a mesma em todas as setas e figuras com o mesmo número, e vai para a ficha, para a breve descrição dos desenhos e para a descrição da invenção.</p>` : '<p class="nota">Use a ferramenta ➘ e arraste da peça até onde o número deve ficar.</p>'}</details>
        ${textos.length ? `<details class="fig-sec" open><summary><b>🌐 Textos da figura</b> <small>${textos.length}</small></summary><div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Português</th><th>Inglês</th><th>Espanhol</th></tr></thead><tbody>${textos.map(e => { const c = `desenhos.#${d.id}.elementos.#${e.id}.`; return `<tr><td><input type="text" data-c="${c}pt" value="${escAttr(e.pt)}"></td><td><input type="text" data-c="${c}en" value="${escAttr(e.en)}"></td><td><input type="text" data-c="${c}es" value="${escAttr(e.es)}"></td></tr>`; }).join('')}</tbody></table></div>
        <button type="button" class="btn btn-secondary btn-sm" data-acao="fig-traduzir" data-fig="${d.id}">🌐 Traduzir o que estiver vazio (dicionário)</button></details>` : ''}`;
}
function htmlOpcoesNumero(p, d) {
    return `<option value="auto">próximo (${proximoNumero(p, d)})</option>${numerosUsados(p).map(n => `<option ${Ed.num[d.id] === n ? 'selected' : ''}>${n}</option>`).join('')}`;
}
function atualizarSecoesFigura(id) {
    const d = figura(id), box = document.querySelector(`.fig-secoes[data-fig="${id}"]`);
    if (d && box) box.innerHTML = htmlSecoesFigura(App.p, d);
    for (const f of App.p.desenhos) { const s = document.querySelector(`select[data-fig-num-barra="${f.id}"]`); if (s) s.innerHTML = htmlOpcoesNumero(App.p, f); }
    if (typeof atualizarPlacar === 'function') atualizarPlacar();
}

/** Preenche EN/ES vazios dos textos pelo dicionário do app (o aluno corrige o resto). */
function traduzirTextosFigura(p, d) {
    let n = 0;
    for (const e of d.elementos || []) {
        if ((e.t !== 'texto' && e.t !== 'sim') || !e.pt) continue;
        let tr = traduzir(p, e.pt);
        if (!tr.en.length) {       // palavra a palavra, quando a expressão inteira não está no dicionário
            const ws = e.pt.split(/\s+/).map(w => traduzir(p, w));
            if (ws.every(x => x.en.length)) tr = { en: [ws.map(x => x.en[0]).join(' ')], es: [ws.map(x => x.es[0] || '').join(' ')] };
        }
        if (!e.en && tr.en[0]) { e.en = tr.en[0]; n++; }
        if (!e.es && tr.es[0]) { e.es = tr.es[0]; n++; }
    }
    return n;
}

// ------------------------------------------------------------ exportação (PNG para o .docx)
async function blobParaDataUrlFig(b) { return new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => ok(''); fr.readAsDataURL(b); }); }

/** Imagem final da figura: fundo + desenhos + setas, em PNG (largura mínima 1600 px para ficar nítida). */
async function figuraPNG(p, d) {
    normalizarFigura(d);
    const fundo = d.img ? await Imagens.ler(d.img) : null;
    if (!d.elementos.length) return fundo;
    const url = fundo ? await blobParaDataUrlFig(fundo) : '';
    const svg = svgFigura(p, d, url, false);
    const k = Math.max(1, 1600 / d.w);
    const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    const cv = document.createElement('canvas'); cv.width = Math.round(d.w * k); cv.height = Math.round(d.h * k);
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0, cv.width, cv.height);
    return new Promise(ok => cv.toBlob(ok, 'image/png'));
}

/** Tamanho da figura a partir da imagem de fundo (até 1200 px de largura, mantendo a proporção). */
async function ajustarTamanhoPelaImagem(d, blob) {
    const url = URL.createObjectURL(blob);
    const dim = await new Promise(ok => { const i = new Image(); i.onload = () => ok([i.naturalWidth || 1000, i.naturalHeight || 600]); i.onerror = () => ok([1000, 600]); i.src = url; });
    URL.revokeObjectURL(url);
    const k = Math.min(1, 1200 / dim[0]);
    d.w = Math.round(dim[0] * k) || 1000; d.h = Math.round(dim[1] * k) || 600;
}
