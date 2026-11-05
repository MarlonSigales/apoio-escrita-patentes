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
    ['seta', '➘', 'Seta numerada: arraste da peça até onde o número deve ficar'],
    ['ret', '▭', 'Retângulo'], ['elipse', '◯', 'Elipse'], ['linha', '╱', 'Linha'], ['texto', 'T', 'Texto (traduzível)']
];
const Ed = { tool: {}, num: {}, sel: {}, drag: null, desfazer: {}, url: {} };

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
    if (e.t === 'ret') s = `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" ${traço}/>`;
    else if (e.t === 'elipse') s = `<ellipse cx="${e.x + e.w / 2}" cy="${e.y + e.h / 2}" rx="${Math.abs(e.w / 2)}" ry="${Math.abs(e.h / 2)}" ${traço}/>`;
    else if (e.t === 'linha') s = `<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" ${traço}/>`;
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
        if (e.t === 'seta' || e.t === 'linha') alcas = `<circle class="alca" data-alca="1" ${alvo} cx="${e.x1}" cy="${e.y1}" r="${h}"/><circle class="alca alca-giro" data-alca="2" ${alvo} cx="${e.x2}" cy="${e.y2}" r="${h}"/>`;
        else if (e.t === 'ret' || e.t === 'elipse') alcas = `<rect class="selecao" x="${Math.min(e.x, e.x + e.w)}" y="${Math.min(e.y, e.y + e.h)}" width="${Math.abs(e.w)}" height="${Math.abs(e.h)}"/><circle class="alca" data-alca="br" ${alvo} cx="${e.x + e.w}" cy="${e.y + e.h}" r="${h}"/>`;
        else if (e.t === 'texto') alcas = `<circle class="alca" data-alca="mv" ${alvo} cx="${e.x}" cy="${e.y + fonteTexto(d, e) * 0.9}" r="${h * 0.8}"/>`;
    }
    // área de clique mais larga que o traço
    const zona = e.t === 'seta' || e.t === 'linha' ? `<line class="zona" ${alvo} x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke-width="${Math.max(18, d.w / 50)}"/>` +
        (e.t === 'seta' ? `<circle class="zona" ${alvo} cx="${e.x2 + (e.x2 - e.x1) / (Math.hypot(e.x2 - e.x1, e.y2 - e.y1) || 1) * fonteNum(d) * 0.85}" cy="${e.y2 + (e.y2 - e.y1) / (Math.hypot(e.x2 - e.x1, e.y2 - e.y1) || 1) * fonteNum(d) * 0.75}" r="${fonteNum(d) * 0.8}"/>` : '')
        : e.t === 'texto' ? `<rect class="zona" ${alvo} x="${e.x - fonteTexto(d, e) * 3}" y="${e.y - fonteTexto(d, e) * 0.7}" width="${fonteTexto(d, e) * 6}" height="${fonteTexto(d, e) * 1.4}"/>`
        : `<rect class="zona" ${alvo} x="${Math.min(e.x, e.x + e.w) - 6}" y="${Math.min(e.y, e.y + e.h) - 6}" width="${Math.abs(e.w) + 12}" height="${Math.abs(e.h) + 12}" fill="none" stroke-width="12"/>`;
    return `<g class="el ${sel ? 'sel' : ''}">${s}${zona}${alcas}</g>`;
}

function svgFigura(p, d, urlFundo, comAlcas) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d.w} ${d.h}" width="${d.w}" height="${d.h}" class="fig-svg" data-fig="${d.id}">` +
        `<rect x="0" y="0" width="${d.w}" height="${d.h}" fill="#fff"/>` +
        (urlFundo ? `<image href="${urlFundo}" x="0" y="0" width="${d.w}" height="${d.h}" preserveAspectRatio="xMidYMid meet"/>` : '') +
        (d.elementos || []).map(e => svgElemento(p, d, e, comAlcas)).join('') + '</svg>';
}

/** Redesenha só o conteúdo do <svg> (o elemento continua o mesmo, para o arrasto não se perder). */
function redesenharJa(id) {
    const d = figura(id), alvo = document.querySelector(`.fig-tela[data-fig="${id}"]`);
    if (!d || !alvo) return;
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
    const e = (d.elementos || []).find(x => x.id === Ed.sel[id]);
    if (!e) { box.innerHTML = '<small>Clique num elemento para editar. Tecla Delete apaga; Ctrl+Z desfaz.</small>'; return; }
    const c = `desenhos.#${d.id}.elementos.#${e.id}.`;
    const nomes = { seta: 'Seta numerada', ret: 'Retângulo', elipse: 'Elipse', linha: 'Linha', texto: 'Texto' };
    let corpo = '';
    if (e.t === 'seta') corpo = `<label class="campo-inline">Número <select data-fig-num="${d.id}">${[...new Set([...numerosUsados(App.p), n2(e.num)])].sort().map(n => `<option ${n === n2(e.num) ? 'selected' : ''}>${n}</option>`).join('')}<option value="novo">novo (${n2(Math.max(0, ...numerosUsados(App.p).map(Number)) + 1)})</option></select></label><small>Setas com o mesmo número usam a mesma descrição.</small>`;
    if (e.t === 'texto') corpo = `<label>Português<input type="text" data-c="${c}pt" value="${escAttr(e.pt)}"></label><label>Inglês<input type="text" data-c="${c}en" value="${escAttr(e.en)}"></label><label>Espanhol<input type="text" data-c="${c}es" value="${escAttr(e.es)}"></label><label class="campo-inline">Tamanho <input type="number" min="8" max="200" data-c="${c}tam" value="${escAttr(e.tam || fonteTexto(d, e))}" style="width:5rem"></label>`;
    box.innerHTML = `<b>${nomes[e.t]}</b> ${corpo}<button type="button" class="btn btn-danger btn-sm" data-acao="fig-apagar" data-fig="${d.id}">🗑 Apagar</button>`;
}

// ------------------------------------------------------------ interação (ponteiro)
function pontoSVG(svg, ev) {
    const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
    const r = pt.matrixTransform(m.inverse());
    return { x: Math.round(r.x), y: Math.round(r.y) };
}
function guardarDesfazer(d) { (Ed.desfazer[d.id] = Ed.desfazer[d.id] || []).push(JSON.stringify(d.elementos)); if (Ed.desfazer[d.id].length > 60) Ed.desfazer[d.id].shift(); }
function terminouMudanca(d) { salvar(); atualizarSecoesFigura(d.id); }

document.addEventListener('pointerdown', ev => {
    const svg = ev.target.closest && ev.target.closest('svg.fig-svg');
    if (!svg) return;
    ev.preventDefault();
    const id = svg.dataset.fig, d = figura(id); if (!d) return;
    const tool = Ed.tool[id] || 'sel', p0 = pontoSVG(svg, ev);
    const alvoEl = ev.target.closest('[data-el]');
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
    const p = pontoSVG(g.svg, ev), dx = p.x - g.p0.x, dy = p.y - g.p0.y, e = g.e, o = g.orig;
    if (g.modo === 'novo') {
        if (e.t === 'ret' || e.t === 'elipse') { e.w = dx; e.h = dy; } else { e.x2 = p.x; e.y2 = p.y; }
    } else if (g.modo === 'mover') {
        if ('x1' in o) { e.x1 = o.x1 + dx; e.y1 = o.y1 + dy; e.x2 = o.x2 + dx; e.y2 = o.y2 + dy; } else { e.x = o.x + dx; e.y = o.y + dy; }
    } else if (g.modo === '1') { e.x1 = p.x; e.y1 = p.y; }
    else if (g.modo === '2') { e.x2 = p.x; e.y2 = p.y; }
    else if (g.modo === 'br') { e.w = o.w + dx; e.h = o.h + dy; }
    else if (g.modo === 'mv') { e.x = o.x + dx; e.y = o.y + dy; }
    redesenharJa(g.id);
});
document.addEventListener('pointerup', () => {
    const g = Ed.drag; if (!g) return;
    Ed.drag = null;
    const d = figura(g.id), e = g.e;
    if (g.modo === 'novo') {
        const pequeno = (e.t === 'ret' || e.t === 'elipse') ? Math.abs(e.w) < 6 && Math.abs(e.h) < 6 : Math.hypot(e.x2 - e.x1, e.y2 - e.y1) < 8;
        if (pequeno) {
            const k = Math.min(d.w, d.h);
            if (e.t === 'ret' || e.t === 'elipse') { e.w = k * 0.2; e.h = k * 0.14; }
            else if (e.t === 'seta') { e.x2 = e.x1 + k * 0.12; e.y2 = e.y1 - k * 0.12; }     // clique simples: seta a 45°, número em cima à direita
            else { e.x2 = e.x1 + k * 0.2; e.y2 = e.y1; }
        }
        if (e.w < 0) { e.x += e.w; e.w = -e.w; } if (e.h < 0) { e.y += e.h; e.h = -e.h; }
    }
    if (g.modo === 'br') { if (e.w < 0) { e.x += e.w; e.w = -e.w; } if (e.h < 0) { e.y += e.h; e.h = -e.h; } }
    redesenhar(g.id); terminouMudanca(d);
});
document.addEventListener('keydown', ev => {
    const ativo = document.activeElement;
    if (ativo && /INPUT|TEXTAREA|SELECT/.test(ativo.tagName)) return;
    const id = Object.keys(Ed.sel).find(k => Ed.sel[k] && document.querySelector(`.fig-tela[data-fig="${k}"]`));
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && id) { ev.preventDefault(); apagarSelecionado(id); }
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
function desfazerFigura(id) {
    const d = figura(id), pilha = Ed.desfazer[id]; if (!d || !pilha || !pilha.length) return;
    d.elementos = JSON.parse(pilha.pop()); Ed.sel[id] = null; redesenhar(id); terminouMudanca(d);
}
function marcarFerramenta(id) { document.querySelectorAll(`.fig-ferr[data-fig="${id}"] [data-tool]`).forEach(b => b.classList.toggle('ativo', b.dataset.tool === (Ed.tool[id] || 'sel'))); }

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
    const textos = (d.elementos || []).filter(e => e.t === 'texto');
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
        if (e.t !== 'texto' || !e.pt) continue;
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
