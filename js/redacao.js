/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * REDAÇÃO: rascunhos automáticos de cada parte do pedido (a partir da ficha, das buscas e das fontes) e verificações
 * das regras do INPI (título igual em tudo, "caracterizado por", resumo de 50 a 200 palavras, números de referência…).
 * Os rascunhos só preenchem o que está vazio; o aluno sempre revisa.
 */

'use strict';

function listaComE(itens) {
    const a = itens.filter(Boolean);
    return a.length > 1 ? a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1] : (a[0] || '');
}
function comNum(c) { return `${(c.nome || '').toLowerCase()}${c.num ? ' (' + c.num + ')' : ''}`; }
function primeiraMinuscula(t) { t = String(t || '').trim().replace(/\.$/, ''); return t ? t[0].toLowerCase() + t.slice(1) : ''; }

const RASCUNHOS = {
    campo(p) {
        const f = p.ficha;
        const obj = f.campo || p.titulo;
        if (!obj) return '';
        return `O objeto do presente pedido de ${nomeNatureza(p)} trata-se de ${primeiraMinuscula(obj)}.` +
            (f.aplicacoes ? ` Sua aplicação pode ser em ${primeiraMinuscula(f.aplicacoes)}.` : '');
    },
    fundamentos(p) {
        const f = p.ficha;
        const partes = [];
        if (f.estadoTecnica) partes.push(f.estadoTecnica.trim());
        const busca = textoEstadoTecnica(p);
        if (busca) partes.push(busca);
        if (!partes.length && f.concorrentes) partes.push(`Atualmente são utilizados ${primeiraMinuscula(f.concorrentes)}. [COMPLETAR: cite os documentos de patente encontrados na busca e diga em que se diferenciam.]`);
        return partes.join('\n\n');
    },
    problemaSolucao(p) {
        const f = p.ficha;
        if (!f.problema && !f.solucao) return '';
        return [f.problema && `O que motivou o desenvolvimento desta invenção foi ${primeiraMinuscula(f.problema)}.`,
            f.solucao && `Para resolver esse problema, a invenção propõe ${primeiraMinuscula(f.solucao)}.` + (f.vantagens ? ` Com isso, ${primeiraMinuscula(f.vantagens)}.` : '')
        ].filter(Boolean).join('\n\n');
    },
    desenhos(p) {
        if (!p.desenhos.length) return '';
        return p.desenhos.map((d, i) => `A FIGURA ${i + 1} ${d.legenda ? primeiraMinuscula(d.legenda) : 'ilustra [COMPLETAR: o que a figura mostra, citando os números de referência]'}.`).join('\n\n');
    },
    descricao(p) {
        const f = p.ficha;
        if (!f.componentes.length && !f.solucao) return '';
        const ps = [];
        if (f.solucao) ps.push(`Para compreender a essência da invenção, parte-se de ${primeiraMinuscula(f.solucao)}.`);
        if (f.componentes.length) {
            ps.push(`A invenção compreende ${listaComE(f.componentes.map(c => (c.nome ? 'um(a) ' : '') + comNum(c) + (c.funcao ? ' para ' + primeiraMinuscula(c.funcao) : '')))}.`);
        }
        if (f.vantagens) ps.push(`Essa construção apresenta como diferencial ${primeiraMinuscula(f.vantagens)}.`);
        return ps.join('\n\n');
    },
    exemplos(p) {
        const f = p.ficha;
        if (!f.aplicacoes && !f.ensaios) return '';
        return [f.aplicacoes && `A invenção pode ser implementada de diversas formas para atender a uma ampla variedade de aplicações, por exemplo, ${primeiraMinuscula(f.aplicacoes)}.`,
            f.ensaios && `Em ensaios realizados, ${primeiraMinuscula(f.ensaios)}.`].filter(Boolean).join('\n\n');
    },
    resumo(p) {
        const f = p.ficha;
        if (!p.titulo) return '';
        const fig = p.desenhos.length ? ` (FIGURA ${p.figuraResumo || 1})` : '';
        const comps = f.componentes.slice(0, 6).map(comNum);
        return [`O presente ${nomeNatureza(p)} trata de ${primeiraMinuscula(f.campo || p.titulo)}${fig}.`,
            comps.length ? `Compreende ${listaComE(comps)}.` : '',
            f.vantagens ? `${f.vantagens.trim().replace(/\.$/, '')}.` : '',
            f.aplicacoes ? `Esse dispositivo será aplicado em ${primeiraMinuscula(f.aplicacoes)}.` : ''
        ].filter(Boolean).join('\n\n');
    }
};

/** Monta reivindicações iniciais: 1 independente com o essencial + dependentes com os demais componentes. */
function rascunhoReivindicacoes(p) {
    const f = p.ficha;
    const out = [];
    const essenciais = f.componentes.slice(0, Math.min(4, f.componentes.length));
    const ind = f.solucao ? primeiraMinuscula(f.solucao) : '';
    out.push({ id: uid(), dep: null, texto: (ind || 'compreender ' + listaComE(essenciais.map(comNum))) + (ind && essenciais.length ? ', compreendendo ' + listaComE(essenciais.map(comNum)) : '') });
    for (const c of f.componentes.slice(essenciais.length)) out.push({ id: uid(), dep: 1, texto: `compreender ${comNum(c)}${c.funcao ? ' para ' + primeiraMinuscula(c.funcao) : ''}` });
    if (f.aplicacoes) out.push({ id: uid(), dep: 1, texto: `ser aplicado em ${primeiraMinuscula(f.aplicacoes)}` });
    return out;
}

/** Texto completo de uma reivindicação, como vai para o documento. */
function textoReivindicacao(p, r) {
    const t = String(r.texto || '').trim().replace(/\.+$/, '').replace(/^caracterizad[oa]\s+(por|pelo|pela)\s+/i, '');
    return `${tituloPedido(p)}${r.dep ? ' de acordo com a reivindicação ' + r.dep : ''} caracterizado por ${t}.`;
}

// ------------------------------------------------------------ verificações
/** Lista de problemas: [{ nivel: 'erro'|'aviso'|'ok', onde (etapa), msg }]. */
function verificar(p) {
    const v = [];
    const add = (nivel, onde, msg) => v.push({ nivel, onde, msg });
    const nums = new Set(numerosReferencia(p));
    if (!p.natureza) add('erro', 'entenda', 'Escolha a natureza: patente de invenção (PI) ou modelo de utilidade (MU).');
    if (!p.titulo) add('erro', 'ficha', 'Falta o título.');
    else if (p.titulo.length > 120) add('aviso', 'ficha', 'Título muito longo: seja direto, sem nomes de fantasia nem marcas.');
    if (/®|™|\bmarca\b/i.test(p.titulo)) add('aviso', 'ficha', 'O título não pode ter marca ou nome de fantasia.');
    // relatório
    const r = p.relatorio;
    for (const [k, rot] of [['campo', 'Campo da invenção'], ['fundamentos', 'Fundamentos (estado da técnica)'], ['descricao', 'Descrição da invenção']]) if (!r[k].trim()) add('erro', 'relatorio', `Relatório: falta "${rot}".`);
    if (p.desenhos.length && !r.desenhos.trim()) add('erro', 'relatorio', 'Relatório: falta a "Breve descrição dos desenhos".');
    p.desenhos.forEach((d, i) => { if (r.desenhos && !new RegExp('FIGURA\\s*' + (i + 1) + '\\b', 'i').test(r.desenhos)) add('aviso', 'relatorio', `A FIGURA ${i + 1} não é citada na breve descrição dos desenhos.`); });
    const textoRel = Object.values(r).join(' ');
    for (const n of nums) if (!numerosNoTexto(textoRel).includes(n)) add('aviso', 'relatorio', `O componente (${n}) não aparece no relatório descritivo.`);
    for (const n of numerosNoTexto(textoRel)) if (nums.size && !nums.has(n)) add('aviso', 'relatorio', `O número (${n}) aparece no relatório mas não está na lista de componentes.`);
    // reivindicações
    const rs = p.reivindicacoes.filter(x => x.texto.trim());
    const inds = rs.filter(x => !x.dep);
    if (!rs.length) add('erro', 'reivindicacoes', 'Escreva ao menos uma reivindicação independente.');
    if (rs.length && !inds.length) add('erro', 'reivindicacoes', 'Não há reivindicação independente (sem "de acordo com").');
    if (p.natureza === 'MU' && inds.length > 1) add('aviso', 'reivindicacoes', 'Modelo de utilidade: use uma única reivindicação independente.');
    rs.forEach((x, i) => {
        if (x.dep && (x.dep > i || x.dep < 1)) add('erro', 'reivindicacoes', `Reivindicação ${i + 1}: só pode depender de uma reivindicação anterior.`);
        const t = x.texto;
        if ((t.replace(/\.+$/, '').match(/\.\s/g) || []).length) add('aviso', 'reivindicacoes', `Reivindicação ${i + 1}: deve ser uma única frase (há ponto no meio).`);
        if (/\b(etc|aproximadamente|preferencialmente|tipo|como por exemplo|e\/ou)\b/i.test(t)) add('aviso', 'reivindicacoes', `Reivindicação ${i + 1}: evite termos vagos (etc., aproximadamente, preferencialmente, tipo, e/ou).`);
        if (/conforme (descrito|mostrado)|de acordo com a figura|vide figura/i.test(t)) add('aviso', 'reivindicacoes', `Reivindicação ${i + 1}: não remeta ao relatório ou às figuras; descreva a característica.`);
        for (const n of numerosNoTexto(t)) if (nums.size && !nums.has(n)) add('aviso', 'reivindicacoes', `Reivindicação ${i + 1}: o número (${n}) não está na lista de componentes.`);
    });
    // desenhos
    if (p.natureza === 'MU' && !p.desenhos.length) add('erro', 'desenhos', 'Modelo de utilidade: os desenhos são obrigatórios.');
    p.desenhos.forEach((d, i) => { if (!d.img) add('aviso', 'desenhos', `FIGURA ${i + 1}: falta a imagem.`); });
    // resumo
    const np = palavras(p.resumo);
    if (!p.resumo.trim()) add('erro', 'resumo', 'Falta o resumo.');
    else {
        if (np < 50) add('aviso', 'resumo', `Resumo com ${np} palavras: o recomendado é de 50 a 200.`);
        if (np > 200) add('erro', 'resumo', `Resumo com ${np} palavras: reduza para no máximo 200.`);
        if (/caracterizad/i.test(p.resumo)) add('aviso', 'resumo', 'O resumo não usa "caracterizado por" (isso é das reivindicações).');
        if (p.desenhos.length && !/FIGURA\s*\d/i.test(p.resumo)) add('aviso', 'resumo', 'Indique no resumo a figura mais representativa, ex.: "(FIGURA 1)".');
    }
    // universidade
    const inv = p.universidade ? p.universidade.inventores : [];
    if (!inv.length) add('aviso', 'inventores', 'Cadastre os inventores (dados completos vão para os formulários da universidade).');
    const soma = inv.reduce((s, x) => s + (Number(String(x.percentual).replace(',', '.')) || 0), 0);
    if (inv.length && Math.abs(soma - 100) > 0.01) add('aviso', 'inventores', `A participação nos resultados soma ${soma}% (precisa dar 100%).`);
    // prazos
    const div = p.contexto.divulgacoes.filter(d => d.data).sort((a, b) => a.data.localeCompare(b.data))[0];
    if (div) {
        const lim = somarMeses(div.data, 12);
        if (lim < hojeISO()) add('erro', 'entenda', `A primeira divulgação (${dataBR(div.data)}) passou de 12 meses: o período de graça terminou em ${dataBR(lim)}. Converse com o NIT.`);
        else add('aviso', 'entenda', `Período de graça: deposite até ${dataBR(lim)} (12 meses da divulgação de ${dataBR(div.data)}).`);
    }
    return v;
}
