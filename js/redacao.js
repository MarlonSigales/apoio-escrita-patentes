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
/** "um" ou "uma" pela primeira palavra (bateria → uma; sensor → um; módulo → um). */
function artigoIndef(nome) {
    const w = semAcento(String(nome || '').trim().split(/\s+/)[0]);
    const fem = /(cao|sao|gem|dade|tude|ura|a)$/.test(w) && !/(sistema|problema|esquema|programa|mapa|tema|clima|dia)$/.test(w);
    return fem ? 'uma' : 'um';
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
        return p.desenhos.map((d, i) => {
            const nums = typeof numerosDaFigura === 'function' ? numerosDaFigura(d) : [];
            const comps = nums.map(n => { const c = p.ficha.componentes.find(x => String(x.num).padStart(2, '0') === n); return `${c && c.nome ? c.nome.toLowerCase() : '[DESCREVER]'} (${n})`; });
            const leg = d.legenda ? primeiraMinuscula(d.legenda).replace(/\.$/, '') : 'ilustra [COMPLETAR: o que a figura mostra]';
            const jaCita = nums.length && nums.every(n => leg.includes('(' + n + ')'));
            return `A FIGURA ${i + 1} ${leg}${comps.length && !jaCita ? `, na qual se observam ${listaComE(comps)}` : ''}.`;
        }).join('\n\n');
    },
    descricao(p) {
        const f = p.ficha;
        if (!f.componentes.length && !f.solucao) return '';
        const ps = [];
        if (f.solucao) ps.push(`Para compreender a essência da invenção, parte-se de ${primeiraMinuscula(f.solucao)}.`);
        if (f.componentes.length) {
            ps.push(`A invenção compreende ${listaComE(f.componentes.map(c => (c.nome ? artigoIndef(c.nome) + ' ' : '') + comNum(c) + (c.funcao ? ' para ' + primeiraMinuscula(c.funcao) : '')))}.`);
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
    out.push({ id: uid(), dep: null, preambulo: '', expressao: '', texto: (ind || 'compreender ' + listaComE(essenciais.map(comNum))) + (ind && essenciais.length ? ', compreendendo ' + listaComE(essenciais.map(comNum)) : '') });
    for (const c of f.componentes.slice(essenciais.length)) out.push({ id: uid(), dep: 1, preambulo: '', expressao: '', texto: `compreender ${comNum(c)}${c.funcao ? ' para ' + primeiraMinuscula(c.funcao) : ''}` });
    if (f.aplicacoes) out.push({ id: uid(), dep: 1, preambulo: '', expressao: '', texto: `ser aplicado em ${primeiraMinuscula(f.aplicacoes)}` });
    return out;
}

/** Texto completo de uma reivindicação, como vai para o documento. */
const EXPRESSOES = ['caracterizado por', 'caracterizada por', 'caracterizado pelo fato de', 'caracterizada pelo fato de'];

/** Preâmbulo da reivindicação: o título inteiro (padrão) ou a parte do título que o aluno escolher. */
function preambuloReiv(p, r) { return maiusculo(String(r.preambulo || '').trim() || p.titulo || 'TÍTULO DO PEDIDO'); }
/** "caracterizado" ou "caracterizada" conforme a primeira palavra do preâmbulo (sistema → o; máquina → a). */
function expressaoReiv(p, r) {
    if (r.expressao) return r.expressao;
    const w = semAcento(preambuloReiv(p, r).split(/\s+/)[0]);
    const fem = /(cao|sao|gem|dade|tude|ura|ia|a)$/.test(w) && !/(sistema|problema|esquema|programa|dia|mapa|tema|clima)$/.test(w);
    return fem ? 'caracterizada por' : 'caracterizado por';
}
/** Opções de preâmbulo: partes do título (1, 2, 3… palavras) até o título completo. */
function partesDoTitulo(p) {
    const ws = String(p.titulo || '').trim().split(/\s+/).filter(Boolean);
    const out = [];
    for (let n = 1; n <= ws.length; n++) { if (/^(de|da|do|das|dos|para|com|e|em|a|o)$/i.test(ws[n - 1]) && n < ws.length) continue; out.push(maiusculo(ws.slice(0, n).join(' '))); }
    return [...new Set(out)];
}
function trechoDependencia(r) { return r.dep ? ` de acordo com a reivindicação ${r.dep}` : ''; }

/** Texto completo de uma reivindicação, como vai para o documento: PREÂMBULO [de acordo com a reivindicação N] caracterizado por … */
function textoReivindicacao(p, r) {
    const t = String(r.texto || '').trim().replace(/\.+$/, '').replace(/^caracterizad[oa]\s+(por|pelo|pela|pelo fato de)\s+/i, '');
    return `${preambuloReiv(p, r)}${trechoDependencia(r)} ${expressaoReiv(p, r)} ${t}.`;
}

// ------------------------------------------------------------ verificações
/** Lista de problemas: [{ nivel: 'erro'|'aviso'|'ok', onde (etapa), msg }]. */
function verificar(p) {
    const v = [];
    const add = (nivel, onde, msg) => v.push({ nivel, onde, msg });
    const nums = new Set(numerosReferencia(p));
    if (!p.natureza) add('erro', 'ficha', 'Escolha a natureza: patente de invenção (PI) ou modelo de utilidade (MU).');
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
        if (x.preambulo && p.titulo && !semAcento(p.titulo).startsWith(semAcento(x.preambulo).trim())) add('aviso', 'reivindicacoes', `Reivindicação ${i + 1}: o preâmbulo "${x.preambulo}" não é o título nem o começo dele.`);
        if (x.dep) { const mae = rs[x.dep - 1]; if (mae && semAcento(preambuloReiv(p, x)) !== semAcento(preambuloReiv(p, mae)) && !semAcento(preambuloReiv(p, mae)).startsWith(semAcento(preambuloReiv(p, x)))) add('aviso', 'reivindicacoes', `Reivindicação ${i + 1}: o preâmbulo deve repetir o da reivindicação ${x.dep}.`); }
        if (!t.trim()) add('aviso', 'reivindicacoes', `Reivindicação ${i + 1}: falta a característica (o que vem depois de "${expressaoReiv(p, x)}").`);
    });
    // desenhos
    if (p.natureza === 'MU' && !p.desenhos.length) add('erro', 'desenhos', 'Modelo de utilidade: os desenhos são obrigatórios.');
    p.desenhos.forEach((d, i) => {
        if (!d.img && !(d.elementos || []).length) add('aviso', 'desenhos', `Figura ${i + 1}: está vazia (suba uma imagem ou desenhe).`);
        if (!d.legenda) add('aviso', 'desenhos', `Figura ${i + 1}: falta a legenda.`);
        if (typeof numerosDaFigura === 'function') for (const n of numerosDaFigura(d)) if (!(p.ficha.componentes.find(c => String(c.num).padStart(2, '0') === n) || {}).nome) add('aviso', 'desenhos', `Figura ${i + 1}: a seta (${n}) está sem descrição.`);
    });
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
    const soma = inv.concat(p.universidade ? p.universidade.colaboradores : []).reduce((s, x) => s + (Number(String(x.percentual).replace(',', '.')) || 0), 0);   // inventores + colaboradores dividem a quota
    if (inv.length && Math.abs(soma - 100) > 0.01) add('aviso', 'inventores', `A participação nos resultados soma ${soma}% (precisa dar 100%).`);
    // prazos
    const div = p.contexto.divulgacoes.filter(d => d.data).sort((a, b) => a.data.localeCompare(b.data))[0];
    if (div) {
        const lim = somarMeses(div.data, 12);
        if (lim < hojeISO()) add('erro', 'divulgacao', `A primeira divulgação (${dataBR(div.data)}) passou de 12 meses: o período de graça terminou em ${dataBR(lim)}. Converse com o NIT.`);
        else add('aviso', 'divulgacao', `Período de graça: deposite até ${dataBR(lim)} (12 meses da divulgação de ${dataBR(div.data)}).`);
    }
    return v;
}

// ------------------------------------------------------------ melhorar o relatório com IA (prompt + resposta colada)
const FORMATO_RELATORIO = 'apoio-escrita-patentes-relatorio';
const SECOES_RELATORIO = [['campo', 'Campo da invenção'], ['fundamentos', 'Fundamentos da invenção (estado da técnica)'], ['problemaSolucao', 'Problema técnico e solução proposta'],
    ['desenhos', 'Breve descrição dos desenhos'], ['descricao', 'Descrição detalhada da invenção'], ['exemplos', 'Exemplos de concretizações']];

/**
 * Prompt para uma IA reescrever o relatório em linguagem de patente: o mais geral possível, amarrado às reivindicações,
 * suficiente para um técnico no assunto reproduzir (exigência do art. 24 da Lei 9.279/96), sem expor know-how que não é
 * necessário para realizar a invenção. A resposta vem num JSON fixo, que o app importa e usa para atualizar os campos.
 */
function promptMelhorarRelatorio(p) {
    const rs = p.reivindicacoes.filter(r => r.texto.trim());
    const comps = p.ficha.componentes.filter(c => c.nome || c.num).map(c => `(${c.num}) ${c.nome}${c.funcao ? ' — ' + c.funcao : ''}`);
    const docs = p.busca.resultados.filter(r => r.num).sort((a, b) => b.relevancia - a.relevancia).slice(0, 10).map(r => `${r.num}${r.titulo ? ' — ' + r.titulo : ''}${r.nota ? ' (diferença: ' + r.nota + ')' : ''}`);
    const atual = SECOES_RELATORIO.map(([k, nome]) => `### ${nome} [${k}]\n${p.relatorio[k] || '(vazio)'}`).join('\n\n');
    return `Você é um redator de patentes experiente no Brasil (INPI). Reescreva o RELATÓRIO DESCRITIVO abaixo de um pedido de ${nomeNatureza(p)} intitulado "${tituloPedido(p)}".

## Objetivo
1. **O mais geral possível:** descreva a invenção pelo princípio e pela função de cada elemento, com termos genéricos ("meio de acionamento", "elemento de vedação", "unidade de processamento"), e não pelo produto comercial, marca, modelo ou material específico. Quando houver uma forma preferida, apresente-a como "em uma concretização" ou "preferencialmente", seguida de alternativas equivalentes, para não limitar a proteção.
2. **Amarrado:** tudo o que está nas reivindicações tem de estar descrito e com os mesmos termos; os números de referência (01), (02)… devem ser os mesmos dos desenhos e das reivindicações; não deixe nada em aberto ("etc.", "entre outros", "conforme necessário", "aproximadamente" sem faixa), nem termos que mudam de nome ao longo do texto. Cada elemento citado deve ter função e ligação com os demais explicadas.
3. **Suficiente, sem entregar o que não é necessário:** um técnico no assunto deve conseguir reproduzir a invenção com algum esforço normal de projeto. Isso é obrigatório (art. 24 da Lei 9.279/96: descrição clara e suficiente e, quando for o caso, a melhor forma de execução); omitir algo essencial pode anular a patente. Mas **não inclua** know-how dispensável para realizar a invenção: código-fonte, valores de calibração ou ajuste fino, fornecedores, custos, tolerâncias de fabricação próprias e detalhes de processo industrial interno. Quando um valor for necessário, prefira faixas ("entre X e Y") em vez do valor exato do protótipo.
4. **Linguagem de patente:** português técnico, impessoal, frases completas, um assunto por parágrafo, sem marketing nem adjetivos de propaganda, sem referências a "nosso", "eu", "o aluno". O campo da invenção diz para que serve, sem detalhes. Os fundamentos citam o estado da técnica (use os documentos da busca) e os seus problemas, sem desmerecer. A breve descrição dos desenhos tem uma frase por figura ("A FIGURA 1 ilustra…").
5. **Não invente:** use só as informações abaixo. Se faltar algo essencial para a suficiência, não preencha com suposição: escreva [COMPLETAR: o que falta] no texto e liste em "pendencias".

## Dados do pedido
- Natureza: ${nomeNatureza(p)}
- Campo/objeto: ${p.ficha.campo || '(não informado)'}
- Problema técnico: ${p.ficha.problema || '(não informado)'}
- Solução: ${p.ficha.solucao || '(não informada)'}
- Vantagens: ${p.ficha.vantagens || '(não informadas)'}
- Aplicações: ${p.ficha.aplicacoes || '(não informadas)'}
- Componentes e números de referência:\n${comps.length ? comps.map(x => '  - ' + x).join('\n') : '  - (não informados)'}
- Figuras:\n${p.desenhos.length ? p.desenhos.map((d, i) => `  - FIGURA ${i + 1}: ${d.legenda || '(sem legenda)'}`).join('\n') : '  - (sem figuras)'}
- Reivindicações (precisam estar todas descritas):\n${rs.length ? rs.map((r, i) => `  ${i + 1}. ${textoReivindicacao(p, r)}`).join('\n') : '  (ainda não escritas)'}
- Documentos do estado da técnica (busca):\n${docs.length ? docs.map(x => '  - ' + x).join('\n') : '  - (nenhum registrado)'}
- Resultados de ensaio: ${p.ficha.ensaios || '(não informados)'}

## Relatório atual
${atual}

## Resposta
Responda **somente** com um bloco \`\`\`json, sem texto antes ou depois, neste formato (parágrafos separados por linha em branco "\\n\\n"; não numere os parágrafos, o app numera):
\`\`\`json
{
  "formato": "${FORMATO_RELATORIO}",
  "versao": 1,
  "relatorio": { "campo": "", "fundamentos": "", "problemaSolucao": "", "desenhos": "", "descricao": "", "exemplos": "" },
  "termos_genericos": [ { "antes": "termo específico usado", "depois": "termo genérico adotado" } ],
  "reivindicacoes_sem_suporte": [ "característica das reivindicações que ainda não está descrita" ],
  "pendencias": [ "informação que falta para a suficiência" ],
  "observacoes": [ "alerta curto ao inventor (ex.: detalhe retirado por ser know-how dispensável)" ]
}
\`\`\``;
}

/** Lê a resposta da IA (JSON acima). Devolve null se não for esse JSON. */
function lerMelhoriaRelatorio(texto) {
    const t = String(texto || ''), bloco = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const fonte = bloco ? bloco[1] : t, ini = fonte.indexOf('{'), fim = fonte.lastIndexOf('}');
    if (ini < 0 || fim <= ini) return null;
    let o; try { o = JSON.parse(fonte.slice(ini, fim + 1)); } catch (e) { return null; }
    if (!o || (o.formato && o.formato !== FORMATO_RELATORIO) || !o.relatorio || typeof o.relatorio !== 'object') return null;
    const lista = v => (Array.isArray(v) ? v : v ? [v] : []).map(x => typeof x === 'object' ? (x.antes ? `${x.antes} → ${x.depois}` : JSON.stringify(x)) : String(x)).map(s => s.trim()).filter(Boolean);
    const rel = {};
    for (const [k] of SECOES_RELATORIO) { const v = o.relatorio[k]; if (typeof v === 'string' && v.trim()) rel[k] = v.replace(/\r\n/g, '\n').replace(/^[ \t]*\[?\d{1,3}\]?[.)-]?[ \t]+(?=\S)/gm, '').trim(); }
    return { relatorio: rel, termos: lista(o.termos_genericos), semSuporte: lista(o.reivindicacoes_sem_suporte), pendencias: lista(o.pendencias), observacoes: lista(o.observacoes) };
}

/** Atualiza as seções do relatório com a resposta (guarda a versão anterior para desfazer). */
function aplicarMelhoriaRelatorio(p, texto) {
    const r = lerMelhoriaRelatorio(texto);
    if (!r) throw new Error('não achei o JSON da resposta (formato "' + FORMATO_RELATORIO + '"). Peça à IA para responder só com o bloco ```json.');
    const secoes = Object.keys(r.relatorio);
    if (!secoes.length) throw new Error('a resposta não trouxe nenhuma seção do relatório.');
    p.relatorioAnterior = JSON.parse(JSON.stringify(p.relatorio));
    for (const k of secoes) { p.relatorio[k] = r.relatorio[k]; p.autoFeito['relatorio.' + k] = 1; }
    p.melhoriaRelatorio = { data: new Date().toISOString(), secoes, termos: r.termos, semSuporte: r.semSuporte, pendencias: r.pendencias, observacoes: r.observacoes };
    return p.melhoriaRelatorio;
}
