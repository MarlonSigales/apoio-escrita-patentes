/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * BIBLIOTECA DE SÍMBOLOS DO EDITOR DE FIGURAS, em preto e branco, como pede o INPI:
 *  - Fluxograma (ISO 5807): terminal, processo, decisão, dados, documento, subprocesso, preparação, entrada manual,
 *    banco de dados, conector e atraso.
 *  - Diagrama de blocos: bloco, integrador, ganho, somador, saturação e ponto de ramificação.
 *  - Elétrico / eletrônico (IEC 60617): resistor (zigue-zague e IEC), capacitor, capacitor polarizado, indutor, bateria,
 *    fontes CC e CA, terra, chave, contatos NA e NF, bobina de relé, fusível, diodo, LED, transistor NPN, amplificador
 *    operacional, lâmpada, motor, gerador, medidor, transformador e nó.
 *  - P&ID (ISA 5.1 / ISO 10628): válvulas (gaveta, controle, retenção, esfera, três vias), bomba, compressor, vaso, tanque
 *    aberto, silo/moega, trocador de calor, filtro, válvula rotativa, rosca transportadora, redutor e instrumentos
 *    (campo, painel, SDCD e CLP).
 * Cada símbolo é desenhado numa caixa local w × h (traço preto, sem preenchimento). Os componentes elétricos e as
 * válvulas têm os terminais no meio das laterais, onde as ligações se encaixam.
 */

'use strict';

const _p = (pts) => pts.map(p => p.map(v => +v.toFixed(2)).join(',')).join(' ');
const _cheio = 'fill="#000" stroke="none"';

/** Circulo central (raio proporcional à menor dimensão) com terminais horizontais. */
function _circuloTerm(w, h, k = 0.42) {
    const r = Math.min(w, h) * k, cx = w / 2, cy = h / 2;
    return { r, cx, cy, s: `<line x1="0" y1="${cy}" x2="${cx - r}" y2="${cy}"/><line x1="${cx + r}" y1="${cy}" x2="${w}" y2="${cy}"/><circle cx="${cx}" cy="${cy}" r="${r}"/>` };
}
function _gravata(w, h, cy, a) {   // corpo de válvula (dois triângulos que se tocam no centro)
    return `<polygon points="${_p([[w * .15, cy - a], [w / 2, cy], [w * .15, cy + a]])}"/><polygon points="${_p([[w * .85, cy - a], [w / 2, cy], [w * .85, cy + a]])}"/><line x1="0" y1="${cy}" x2="${w * .15}" y2="${cy}"/><line x1="${w * .85}" y1="${cy}" x2="${w}" y2="${cy}"/>`;
}
function _setinha(x1, y1, x2, y2, t) {
    const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><polygon ${_cheio} points="${_p([[x2, y2], [x2 - ux * t - uy * t * .5, y2 - uy * t + ux * t * .5], [x2 - ux * t + uy * t * .5, y2 - uy * t - ux * t * .5]])}"/>`;
}

/**
 * g = grupo; n = nome; w/h = tamanho padrão (figura de 1000 × 600); r = onde vai o rótulo ('dentro', 'abaixo' ou
 * 'nenhum'); txt = rótulo padrão; tag = rótulo em duas linhas (instrumentos: "PT 101" → PT / 101); d(w, h) = desenho.
 */
const SIMBOLOS = {
    // ------------------------------------------------ fluxograma
    'fx-terminal': { g: 'fluxo', n: 'Início / fim', w: 160, h: 60, r: 'dentro', txt: 'Início', d: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}" rx="${h / 2}"/>` },
    'fx-processo': { g: 'fluxo', n: 'Processo', w: 160, h: 80, r: 'dentro', txt: 'Processo', d: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}"/>` },
    'fx-decisao': { g: 'fluxo', n: 'Decisão', w: 160, h: 100, r: 'dentro', txt: 'Condição?', d: (w, h) => `<polygon points="${_p([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]])}"/>` },
    'fx-dados': { g: 'fluxo', n: 'Entrada / saída de dados', w: 170, h: 70, r: 'dentro', txt: 'Dados', d: (w, h) => `<polygon points="${_p([[w * .15, 0], [w, 0], [w * .85, h], [0, h]])}"/>` },
    'fx-documento': { g: 'fluxo', n: 'Documento', w: 160, h: 90, r: 'dentro', txt: 'Relatório', d: (w, h) => `<path d="M0 0 H${w} V${h * .82} Q${w * .75} ${h * .62} ${w * .5} ${h * .82} T0 ${h * .82} Z"/>` },
    'fx-subprocesso': { g: 'fluxo', n: 'Subprocesso (processo predefinido)', w: 170, h: 80, r: 'dentro', txt: 'Sub-rotina', d: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}"/><line x1="${w * .1}" y1="0" x2="${w * .1}" y2="${h}"/><line x1="${w * .9}" y1="0" x2="${w * .9}" y2="${h}"/>` },
    'fx-preparacao': { g: 'fluxo', n: 'Preparação / inicialização', w: 170, h: 70, r: 'dentro', txt: 'Inicializar', d: (w, h) => `<polygon points="${_p([[w * .15, 0], [w * .85, 0], [w, h / 2], [w * .85, h], [w * .15, h], [0, h / 2]])}"/>` },
    'fx-manual': { g: 'fluxo', n: 'Entrada manual', w: 160, h: 80, r: 'dentro', txt: 'Ajuste', d: (w, h) => `<polygon points="${_p([[0, h * .3], [w, 0], [w, h], [0, h]])}"/>` },
    'fx-bd': { g: 'fluxo', n: 'Banco de dados / memória', w: 110, h: 110, r: 'dentro', txt: 'Memória', d: (w, h) => { const ry = h * .13; return `<path d="M0 ${ry} V${h - ry} A${w / 2} ${ry} 0 0 0 ${w} ${h - ry} V${ry}"/><ellipse cx="${w / 2}" cy="${ry}" rx="${w / 2}" ry="${ry}"/>`; } },
    'fx-conector': { g: 'fluxo', n: 'Conector', w: 50, h: 50, r: 'dentro', txt: 'A', d: (w, h) => `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/>` },
    'fx-atraso': { g: 'fluxo', n: 'Atraso / espera', w: 130, h: 70, r: 'dentro', txt: 'Esperar', d: (w, h) => `<path d="M0 0 H${w * .55} A${w * .45} ${h / 2} 0 0 1 ${w * .55} ${h} H0 Z"/>` },

    // ------------------------------------------------ diagrama de blocos
    'bl-bloco': { g: 'blocos', n: 'Bloco (função de transferência, subsistema)', w: 150, h: 80, r: 'dentro', txt: 'G(s)', d: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}"/>` },
    'bl-integrador': { g: 'blocos', n: 'Integrador', w: 100, h: 80, r: 'dentro', txt: '1/s', d: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}"/>` },
    'bl-ganho': { g: 'blocos', n: 'Ganho', w: 100, h: 90, r: 'dentro', txt: 'K', d: (w, h) => `<polygon points="${_p([[0, 0], [w, h / 2], [0, h]])}"/>` },
    'bl-somador': { g: 'blocos', n: 'Somador / comparador (ponha + e − com o texto)', w: 60, h: 60, r: 'nenhum', txt: '', d: (w, h) => { const cx = w / 2, cy = h / 2, rx = w / 2 * .707, ry = h / 2 * .707; return `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}"/><line x1="${cx - rx}" y1="${cy - ry}" x2="${cx + rx}" y2="${cy + ry}"/><line x1="${cx - rx}" y1="${cy + ry}" x2="${cx + rx}" y2="${cy - ry}"/>`; } },
    'bl-saturacao': { g: 'blocos', n: 'Saturação / não linearidade', w: 100, h: 80, r: 'nenhum', txt: '', d: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}"/><line x1="${w * .15}" y1="${h / 2}" x2="${w * .85}" y2="${h / 2}" stroke-dasharray="4 4"/><polyline points="${_p([[w * .15, h * .75], [w * .38, h * .75], [w * .62, h * .25], [w * .85, h * .25]])}"/>` },
    'bl-ponto': { g: 'blocos', n: 'Ponto de ramificação / nó', w: 16, h: 16, r: 'nenhum', txt: '', d: (w, h) => `<ellipse ${_cheio} cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/>` },

    // ------------------------------------------------ elétrico / eletrônico
    'el-resistor': { g: 'eletrico', n: 'Resistor (zigue-zague)', w: 120, h: 40, r: 'abaixo', txt: 'R1', d: (w, h) => { const pts = [[0, h / 2], [w * .2, h / 2]]; for (let i = 1; i <= 12; i++) pts.push([w * .2 + i * w * .05, i === 12 ? h / 2 : (i % 2 ? h * .1 : h * .9)]); pts.push([w, h / 2]); return `<polyline points="${_p(pts)}"/>`; } },
    'el-resistor-iec': { g: 'eletrico', n: 'Resistor (IEC)', w: 120, h: 40, r: 'abaixo', txt: 'R1', d: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w * .2}" y2="${h / 2}"/><rect x="${w * .2}" y="${h * .2}" width="${w * .6}" height="${h * .6}"/><line x1="${w * .8}" y1="${h / 2}" x2="${w}" y2="${h / 2}"/>` },
    'el-capacitor': { g: 'eletrico', n: 'Capacitor', w: 100, h: 60, r: 'abaixo', txt: 'C1', d: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w * .44}" y2="${h / 2}"/><line x1="${w * .44}" y1="${h * .1}" x2="${w * .44}" y2="${h * .9}"/><line x1="${w * .56}" y1="${h * .1}" x2="${w * .56}" y2="${h * .9}"/><line x1="${w * .56}" y1="${h / 2}" x2="${w}" y2="${h / 2}"/>` },
    'el-capacitor-pol': { g: 'eletrico', n: 'Capacitor eletrolítico (polarizado)', w: 100, h: 60, r: 'abaixo', txt: 'C1', d: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w * .44}" y2="${h / 2}"/><line x1="${w * .44}" y1="${h * .1}" x2="${w * .44}" y2="${h * .9}"/><path d="M${w * .6} ${h * .1} Q${w * .5} ${h / 2} ${w * .6} ${h * .9}"/><line x1="${w * .55}" y1="${h / 2}" x2="${w}" y2="${h / 2}"/><line x1="${w * .28}" y1="${h * .18}" x2="${w * .38}" y2="${h * .18}"/><line x1="${w * .33}" y1="${h * .08}" x2="${w * .33}" y2="${h * .28}"/>` },
    'el-indutor': { g: 'eletrico', n: 'Indutor / bobina', w: 130, h: 40, r: 'abaixo', txt: 'L1', d: (w, h) => { const a = w * .7 / 4, ry = Math.min(a / 2, h * .45); let s = `M0 ${h * .7} H${w * .15}`; for (let i = 0; i < 4; i++) s += ` A${a / 2} ${ry} 0 0 1 ${w * .15 + (i + 1) * a} ${h * .7}`; return `<path d="${s} H${w}"/>`; } },
    'el-bateria': { g: 'eletrico', n: 'Bateria / pilha', w: 100, h: 60, r: 'abaixo', txt: 'B1', d: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w * .45}" y2="${h / 2}"/><line x1="${w * .45}" y1="${h * .05}" x2="${w * .45}" y2="${h * .95}"/><line x1="${w * .55}" y1="${h * .28}" x2="${w * .55}" y2="${h * .72}" stroke-width="4"/><line x1="${w * .55}" y1="${h / 2}" x2="${w}" y2="${h / 2}"/><line x1="${w * .27}" y1="${h * .15}" x2="${w * .37}" y2="${h * .15}"/><line x1="${w * .32}" y1="${h * .05}" x2="${w * .32}" y2="${h * .25}"/>` },
    'el-fonte-cc': { g: 'eletrico', n: 'Fonte de tensão CC', w: 120, h: 70, r: 'abaixo', txt: 'V1', d: (w, h) => { const c = _circuloTerm(w, h); return c.s + `<line x1="${c.cx - c.r * .6}" y1="${c.cy - c.r * .25}" x2="${c.cx - c.r * .6}" y2="${c.cy + c.r * .25}"/><line x1="${c.cx - c.r * .85}" y1="${c.cy}" x2="${c.cx - c.r * .35}" y2="${c.cy}"/><line x1="${c.cx + c.r * .35}" y1="${c.cy}" x2="${c.cx + c.r * .85}" y2="${c.cy}"/>`; } },
    'el-fonte-ca': { g: 'eletrico', n: 'Fonte de tensão CA', w: 120, h: 70, r: 'abaixo', txt: 'V1', d: (w, h) => { const c = _circuloTerm(w, h), r = c.r * .6; return c.s + `<path d="M${c.cx - r} ${c.cy} Q${c.cx - r / 2} ${c.cy - r * 1.1} ${c.cx} ${c.cy} T${c.cx + r} ${c.cy}"/>`; } },
    'el-terra': { g: 'eletrico', n: 'Terra / aterramento (terminal em cima)', w: 60, h: 60, r: 'nenhum', txt: '', d: (w, h) => `<line x1="${w / 2}" y1="0" x2="${w / 2}" y2="${h * .45}"/><line x1="${w * .1}" y1="${h * .45}" x2="${w * .9}" y2="${h * .45}"/><line x1="${w * .25}" y1="${h * .65}" x2="${w * .75}" y2="${h * .65}"/><line x1="${w * .4}" y1="${h * .85}" x2="${w * .6}" y2="${h * .85}"/>` },
    'el-chave': { g: 'eletrico', n: 'Chave / interruptor', w: 110, h: 50, r: 'abaixo', txt: 'S1', d: (w, h) => `<line x1="0" y1="${h * .75}" x2="${w * .3}" y2="${h * .75}"/><circle cx="${w * .3}" cy="${h * .75}" r="3"/><line x1="${w * .3}" y1="${h * .75}" x2="${w * .68}" y2="${h * .15}"/><circle cx="${w * .7}" cy="${h * .75}" r="3"/><line x1="${w * .7}" y1="${h * .75}" x2="${w}" y2="${h * .75}"/>` },
    'el-contato-na': { g: 'eletrico', n: 'Contato normalmente aberto (NA)', w: 100, h: 50, r: 'abaixo', txt: 'K1', d: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w * .4}" y2="${h / 2}"/><line x1="${w * .4}" y1="${h * .1}" x2="${w * .4}" y2="${h * .9}"/><line x1="${w * .6}" y1="${h * .1}" x2="${w * .6}" y2="${h * .9}"/><line x1="${w * .6}" y1="${h / 2}" x2="${w}" y2="${h / 2}"/>` },
    'el-contato-nf': { g: 'eletrico', n: 'Contato normalmente fechado (NF)', w: 100, h: 50, r: 'abaixo', txt: 'K1', d: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w * .4}" y2="${h / 2}"/><line x1="${w * .4}" y1="${h * .1}" x2="${w * .4}" y2="${h * .9}"/><line x1="${w * .6}" y1="${h * .1}" x2="${w * .6}" y2="${h * .9}"/><line x1="${w * .6}" y1="${h / 2}" x2="${w}" y2="${h / 2}"/><line x1="${w * .3}" y1="${h * .95}" x2="${w * .7}" y2="${h * .05}"/>` },
    'el-rele': { g: 'eletrico', n: 'Bobina de relé / contator', w: 110, h: 50, r: 'abaixo', txt: 'K1', d: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w * .3}" y2="${h / 2}"/><rect x="${w * .3}" y="${h * .1}" width="${w * .4}" height="${h * .8}"/><line x1="${w * .3}" y1="${h * .9}" x2="${w * .7}" y2="${h * .1}"/><line x1="${w * .7}" y1="${h / 2}" x2="${w}" y2="${h / 2}"/>` },
    'el-fusivel': { g: 'eletrico', n: 'Fusível', w: 110, h: 40, r: 'abaixo', txt: 'F1', d: (w, h) => `<rect x="${w * .25}" y="${h * .25}" width="${w * .5}" height="${h * .5}"/><line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}"/>` },
    'el-diodo': { g: 'eletrico', n: 'Diodo', w: 100, h: 50, r: 'abaixo', txt: 'D1', d: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w * .35}" y2="${h / 2}"/><polygon points="${_p([[w * .35, h * .1], [w * .35, h * .9], [w * .65, h / 2]])}"/><line x1="${w * .65}" y1="${h * .1}" x2="${w * .65}" y2="${h * .9}"/><line x1="${w * .65}" y1="${h / 2}" x2="${w}" y2="${h / 2}"/>` },
    'el-led': { g: 'eletrico', n: 'LED', w: 100, h: 70, r: 'abaixo', txt: 'LED1', d: (w, h) => { const y = h * .65, a = h * .28; return `<line x1="0" y1="${y}" x2="${w * .35}" y2="${y}"/><polygon points="${_p([[w * .35, y - a], [w * .35, y + a], [w * .62, y]])}"/><line x1="${w * .62}" y1="${y - a}" x2="${w * .62}" y2="${y + a}"/><line x1="${w * .62}" y1="${y}" x2="${w}" y2="${y}"/>` + _setinha(w * .5, h * .3, w * .64, h * .06, 6) + _setinha(w * .62, h * .36, w * .76, h * .12, 6); } },
    'el-npn': { g: 'eletrico', n: 'Transistor NPN (base à esquerda)', w: 90, h: 100, r: 'abaixo', txt: 'Q1', d: (w, h) => { const cx = w * .55, cy = h / 2, r = Math.min(w, h) * .4; return `<circle cx="${cx}" cy="${cy}" r="${r}"/><line x1="0" y1="${cy}" x2="${w * .4}" y2="${cy}"/><line x1="${w * .4}" y1="${h * .3}" x2="${w * .4}" y2="${h * .7}"/><polyline points="${_p([[w * .4, h * .4], [w * .72, h * .2], [w * .72, 0]])}"/>` + _setinha(w * .4, h * .6, w * .72, h * .8, 8) + `<line x1="${w * .72}" y1="${h * .8}" x2="${w * .72}" y2="${h}"/>`; } },
    'el-ampop': { g: 'eletrico', n: 'Amplificador operacional', w: 130, h: 100, r: 'nenhum', txt: '', d: (w, h) => `<polygon points="${_p([[w * .2, 0], [w * .2, h], [w * .88, h / 2]])}"/><line x1="0" y1="${h * .3}" x2="${w * .2}" y2="${h * .3}"/><line x1="0" y1="${h * .7}" x2="${w * .2}" y2="${h * .7}"/><line x1="${w * .88}" y1="${h / 2}" x2="${w}" y2="${h / 2}"/><line x1="${w * .25}" y1="${h * .3}" x2="${w * .33}" y2="${h * .3}"/><line x1="${w * .25}" y1="${h * .7}" x2="${w * .33}" y2="${h * .7}"/><line x1="${w * .29}" y1="${h * .65}" x2="${w * .29}" y2="${h * .75}"/>` },
    'el-lampada': { g: 'eletrico', n: 'Lâmpada / sinaleiro', w: 110, h: 60, r: 'abaixo', txt: 'H1', d: (w, h) => { const c = _circuloTerm(w, h), k = c.r * .707; return c.s + `<line x1="${c.cx - k}" y1="${c.cy - k}" x2="${c.cx + k}" y2="${c.cy + k}"/><line x1="${c.cx - k}" y1="${c.cy + k}" x2="${c.cx + k}" y2="${c.cy - k}"/>`; } },
    'el-motor': { g: 'eletrico', n: 'Motor', w: 120, h: 70, r: 'dentro', txt: 'M', d: (w, h) => _circuloTerm(w, h).s },
    'el-gerador': { g: 'eletrico', n: 'Gerador', w: 120, h: 70, r: 'dentro', txt: 'G', d: (w, h) => _circuloTerm(w, h).s },
    'el-medidor': { g: 'eletrico', n: 'Medidor (V, A, W…) / sensor', w: 110, h: 60, r: 'dentro', txt: 'V', d: (w, h) => _circuloTerm(w, h).s },
    'el-transformador': { g: 'eletrico', n: 'Transformador', w: 120, h: 100, r: 'abaixo', txt: 'T1', d: (w, h) => { const y0 = h * .15, seg = h * .7 / 4, rx = w * .08; let a = `M0 ${y0} H${w * .32}`, b = `M${w} ${y0} H${w * .68}`; for (let i = 1; i <= 4; i++) { a += ` A${rx} ${seg / 2} 0 0 1 ${w * .32} ${y0 + i * seg}`; b += ` A${rx} ${seg / 2} 0 0 0 ${w * .68} ${y0 + i * seg}`; } return `<path d="${a} H0"/><path d="${b} H${w}"/><line x1="${w * .47}" y1="${h * .1}" x2="${w * .47}" y2="${h * .9}"/><line x1="${w * .53}" y1="${h * .1}" x2="${w * .53}" y2="${h * .9}"/>`; } },
    'el-no': { g: 'eletrico', n: 'Nó (junção de fios)', w: 14, h: 14, r: 'nenhum', txt: '', d: (w, h) => `<ellipse ${_cheio} cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/>` },

    // ------------------------------------------------ P&ID
    'pid-valvula': { g: 'pid', n: 'Válvula (gaveta / bloqueio)', w: 90, h: 50, r: 'abaixo', txt: '', d: (w, h) => _gravata(w, h, h / 2, h * .4) },
    'pid-valvula-controle': { g: 'pid', n: 'Válvula de controle (atuador a diafragma)', w: 90, h: 90, r: 'abaixo', txt: '', d: (w, h) => { const cy = h * .74; return _gravata(w, h, cy, h * .2) + `<line x1="${w / 2}" y1="${cy}" x2="${w / 2}" y2="${h * .32}"/><path d="M${w * .25} ${h * .32} A${w * .25} ${h * .26} 0 0 1 ${w * .75} ${h * .32} Z"/>`; } },
    'pid-retencao': { g: 'pid', n: 'Válvula de retenção (fluxo da esquerda para a direita)', w: 90, h: 50, r: 'abaixo', txt: '', d: (w, h) => _gravata(w, h, h / 2, h * .4) + `<polygon ${_cheio} points="${_p([[w * .85, h * .1], [w / 2, h / 2], [w * .85, h * .9]])}"/>` },
    'pid-esfera': { g: 'pid', n: 'Válvula de esfera', w: 90, h: 50, r: 'abaixo', txt: '', d: (w, h) => _gravata(w, h, h / 2, h * .4) + `<circle ${_cheio} cx="${w / 2}" cy="${h / 2}" r="${h * .14}"/>` },
    'pid-tres-vias': { g: 'pid', n: 'Válvula de três vias', w: 90, h: 90, r: 'nenhum', txt: '', d: (w, h) => { const cy = h * .32, a = h * .22; return _gravata(w, h, cy, a) + `<polygon points="${_p([[w / 2 - a, h * .8], [w / 2, cy], [w / 2 + a, h * .8]])}"/><line x1="${w / 2}" y1="${h * .8}" x2="${w / 2}" y2="${h}"/>`; } },
    'pid-bomba': { g: 'pid', n: 'Bomba centrífuga (entrada à esquerda, saída em cima)', w: 110, h: 100, r: 'abaixo', txt: '', d: (w, h) => { const r = Math.min(w, h) * .36, cx = w / 2, cy = h * .45; return `<circle cx="${cx}" cy="${cy}" r="${r}"/><line x1="0" y1="${cy}" x2="${cx - r}" y2="${cy}"/><line x1="${cx}" y1="${cy - r}" x2="${w}" y2="${cy - r}"/><polyline points="${_p([[cx - r * .8, cy + r * .6], [cx - r, h], [cx + r, h], [cx + r * .8, cy + r * .6]])}"/>`; } },
    'pid-compressor': { g: 'pid', n: 'Compressor / ventilador', w: 110, h: 90, r: 'abaixo', txt: '', d: (w, h) => { const c = _circuloTerm(w, h, .45); return c.s + `<line x1="${c.cx - c.r * .75}" y1="${c.cy - c.r * .6}" x2="${c.cx + c.r * .75}" y2="${c.cy - c.r * .3}"/><line x1="${c.cx - c.r * .75}" y1="${c.cy + c.r * .6}" x2="${c.cx + c.r * .75}" y2="${c.cy + c.r * .3}"/>`; } },
    'pid-vaso': { g: 'pid', n: 'Vaso / reservatório fechado', w: 100, h: 170, r: 'dentro', txt: '', d: (w, h) => { const ry = Math.min(h * .14, w * .35); return `<path d="M0 ${ry} V${h - ry} A${w / 2} ${ry} 0 0 0 ${w} ${h - ry} V${ry} A${w / 2} ${ry} 0 0 0 0 ${ry} Z"/>`; } },
    'pid-tanque': { g: 'pid', n: 'Tanque aberto', w: 140, h: 110, r: 'dentro', txt: '', d: (w, h) => `<polyline points="${_p([[0, 0], [0, h], [w, h], [w, 0]])}"/><line x1="0" y1="${h * .25}" x2="${w}" y2="${h * .25}" stroke-dasharray="6 5"/>` },
    'pid-silo': { g: 'pid', n: 'Silo / moega / reservatório com funil', w: 120, h: 160, r: 'dentro', txt: '', d: (w, h) => `<polygon points="${_p([[0, 0], [w, 0], [w, h * .6], [w * .6, h * .92], [w * .4, h * .92], [0, h * .6]])}"/><line x1="${w * .5}" y1="${h * .92}" x2="${w * .5}" y2="${h}"/>` },
    'pid-trocador': { g: 'pid', n: 'Trocador de calor', w: 110, h: 80, r: 'abaixo', txt: '', d: (w, h) => { const r = Math.min(w, h) * .45, cx = w / 2, cy = h / 2; return `<circle cx="${cx}" cy="${cy}" r="${r}"/><polyline points="${_p([[0, cy], [cx - r * .7, cy], [cx - r * .35, cy - r * .5], [cx, cy + r * .5], [cx + r * .35, cy - r * .5], [cx + r * .7, cy], [w, cy]])}"/>`; } },
    'pid-filtro': { g: 'pid', n: 'Filtro', w: 90, h: 70, r: 'abaixo', txt: '', d: (w, h) => `<line x1="0" y1="${h / 2}" x2="${w * .15}" y2="${h / 2}"/><polygon points="${_p([[w / 2, 0], [w * .85, h / 2], [w / 2, h], [w * .15, h / 2]])}"/><line x1="${w / 2}" y1="0" x2="${w / 2}" y2="${h}" stroke-dasharray="5 4"/><line x1="${w * .85}" y1="${h / 2}" x2="${w}" y2="${h / 2}"/>` },
    'pid-rotativa': { g: 'pid', n: 'Válvula rotativa / dosador de alvéolos', w: 90, h: 90, r: 'abaixo', txt: '', d: (w, h) => { const cx = w / 2, cy = h / 2, r = Math.min(w, h) * .42; let s = `<rect x="${cx - r * 1.12}" y="${cy - r * 1.12}" width="${r * 2.24}" height="${r * 2.24}"/><circle cx="${cx}" cy="${cy}" r="${r}"/>`; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s += `<line x1="${cx}" y1="${cy}" x2="${(cx + r * Math.cos(a)).toFixed(2)}" y2="${(cy + r * Math.sin(a)).toFixed(2)}"/>`; } return s; } },
    'pid-rosca': { g: 'pid', n: 'Rosca transportadora / helicoide', w: 200, h: 50, r: 'abaixo', txt: '', d: (w, h) => { const pts = []; for (let i = 0; i <= 10; i++) pts.push([w * .05 + i * w * .09, i % 2 ? h * .15 : h * .85]); return `<rect x="0" y="0" width="${w}" height="${h}"/><polyline points="${_p(pts)}"/>`; } },
    'pid-redutor': { g: 'pid', n: 'Redução concêntrica', w: 70, h: 60, r: 'nenhum', txt: '', d: (w, h) => `<polygon points="${_p([[0, h * .1], [w, h * .3], [w, h * .7], [0, h * .9]])}"/>` },
    'pid-inst-campo': { g: 'pid', n: 'Instrumento no campo (ex.: PT 101)', w: 80, h: 80, r: 'dentro', txt: 'PT 101', tag: true, d: (w, h) => `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/>` },
    'pid-inst-painel': { g: 'pid', n: 'Instrumento no painel (ex.: PIC 101)', w: 80, h: 80, r: 'dentro', txt: 'PIC 101', tag: true, d: (w, h) => `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/><line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}"/>` },
    'pid-sdcd': { g: 'pid', n: 'Função no SDCD / supervisório', w: 80, h: 80, r: 'dentro', txt: 'FIC 101', tag: true, d: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}"/><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/><line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}"/>` },
    'pid-clp': { g: 'pid', n: 'Função no CLP', w: 80, h: 80, r: 'dentro', txt: 'LY 101', tag: true, d: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}"/><polygon points="${_p([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]])}"/><line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}"/>` }
};

const GRUPOS_SIMBOLOS = [
    ['fluxo', '🔀 Fluxograma'], ['blocos', '🧩 Diagrama de blocos'], ['eletrico', '⚡ Elétrico / eletrônico'], ['pid', '🏭 P&ID (processo e instrumentação)']
];

/** Estilos de ligação: fluxo/fio, tubulação principal, sinal elétrico, pneumático, dados (software) e tracejada. */
const ESTILOS_LIGACAO = [
    ['cheia', 'Cheia (fluxo, fio, sinal de blocos)'], ['processo', 'Grossa (tubulação de processo)'], ['eletrico', 'Tracejada (sinal elétrico, ISA)'],
    ['pneumatico', 'Com traços // (sinal pneumático)'], ['dados', 'Com círculos (dados / software)'], ['pontilhada', 'Pontilhada (limite, contorno)']
];
const PONTAS_LIGACAO = [['nenhuma', 'sem ponta'], ['seta', 'seta cheia'], ['aberta', 'seta aberta'], ['ponto', 'ponto (junção)']];
const COTOVELOS = [['reto', 'reta'], ['hv', 'em L: horizontal → vertical'], ['vh', 'em L: vertical → horizontal'], ['hvh', 'em Z: horizontal → vertical → horizontal']];

/** Traduções dos rótulos padrão (o aluno pode trocar). */
const TXT_SIMBOLO = {
    'Início': ['Start', 'Inicio'], 'Processo': ['Process', 'Proceso'], 'Condição?': ['Condition?', '¿Condición?'], 'Dados': ['Data', 'Datos'],
    'Relatório': ['Report', 'Informe'], 'Sub-rotina': ['Subroutine', 'Subrutina'], 'Inicializar': ['Initialize', 'Inicializar'], 'Ajuste': ['Setting', 'Ajuste'],
    'Memória': ['Memory', 'Memoria'], 'Esperar': ['Wait', 'Esperar']
};
