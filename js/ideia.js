/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * IDEIA COM AS SUAS PALAVRAS → PEDIDO INTEIRO (rodadas com IA)
 * O inventor conta a ideia em linguagem do dia a dia (campo da página inicial). O app monta um prompt copiável que leva
 * esse texto, o estado atual do pedido (sem dados pessoais), as respostas às perguntas da rodada anterior e o know-how
 * que já ficou de fora. A IA devolve um JSON (formato FORMATO_IDEIA) com o pedido inteiro pré-preenchido, a estratégia,
 * as próximas melhorias e novas perguntas. O app aplica o JSON (só no vazio ou substituindo o que a IA melhorou, com
 * desfazer) e a cada rodada o prompt sai melhor, porque leva o pedido já melhorado.
 */

'use strict';

const FORMATO_IDEIA = 'apoio-escrita-patentes-pedido-ia';
const CHAVE_DESFAZER_IDEIA = 'pe_ideia_desfazer';
const PERGUNTA_IDEIA = 'Descreva o resumo mais completo que você pode dar sobre o que vamos fazer, nas tuas palavras, com linguajar do dia a dia mesmo: qual o produto/sistema/processo vamos fazer? O que tu acha que tem de diferencial e que vamos buscar reivindicar? Como tu descreve da melhor maneira o que é? E o que mais tu achar pertinente.';
const CAMPOS_UNIV_IA = ['contexto', 'comoHoje', 'resultado', 'aplicacoesIndustriais', 'outrasAplicacoes', 'objetoProjeto', 'empresasMercado', 'empresasOferta'];

function rodadasIdeia(p) { return (p.ideia && p.ideia.rodadas) || []; }
function ultimaRodada(p) { const r = rodadasIdeia(p); return r.length ? r[r.length - 1] : null; }

/** O pedido atual, só com o conteúdo técnico (nada de nomes, CPF, e-mail ou endereço dos inventores). */
function estadoParaIA(p) {
    const u = p.universidade;
    const univ = {};
    for (const k of CAMPOS_UNIV_IA) univ[k] = u[k] || '';
    Object.assign(univ, { consiste: u.consiste, areaPredominante: u.areaPredominante, areasAbrangidas: u.areasAbrangidas });
    return {
        natureza: p.natureza || '', titulo: p.titulo, area: p.area,
        ficha: { campo: p.ficha.campo, problema: p.ficha.problema, estadoTecnica: p.ficha.estadoTecnica, solucao: p.ficha.solucao, vantagens: p.ficha.vantagens, aplicacoes: p.ficha.aplicacoes, ensaios: p.ficha.ensaios, concorrentes: p.ficha.concorrentes },
        componentes: p.ficha.componentes.filter(c => c.nome || c.num).map(c => ({ num: c.num, nome: c.nome, funcao: c.funcao })),
        resumo: p.resumo, figura_resumo: String(p.figuraResumo || '1'),
        reivindicacoes: p.reivindicacoes.filter(r => r.texto.trim()).map(r => ({ dep: r.dep || null, preambulo: r.preambulo || '', texto: r.texto })),
        relatorio: p.relatorio,
        desenhos: p.desenhos.map(d => ({ legenda: d.legenda, numeros: typeof numerosDaFigura === 'function' ? numerosDaFigura(d) : [] })),
        classes: classesBusca(p),
        termos_busca: p.busca.termos,
        depositantes_busca: p.busca.depositantes,
        documentos_da_busca: p.busca.resultados.filter(r => r.num).sort((a, b) => b.relevancia - a.relevancia).slice(0, 15)
            .map(r => ({ numero: r.num, titulo: r.titulo, categoria: r.categoria, relevancia: r.relevancia, diferenca: r.nota })),
        divulgacoes: p.contexto.divulgacoes.length ? p.contexto.divulgacoes.map(d => ({ data: d.data, meio: d.meio })) : (p.revisao.semDivulgacao ? 'nenhuma' : 'não informado'),
        universidade: univ,
        alertas_da_revisao: verificar(p).filter(x => x.nivel !== 'ok').map(x => x.msg)
    };
}

/** Prompt copiável: rodada N, com a ideia, o pedido atual e o modelo do JSON de retorno. */
function promptIdeia(p) {
    const n = rodadasIdeia(p).length + 1, ult = ultimaRodada(p);
    const ideia = String((p.ideia && p.ideia.texto) || '').trim();
    const resp = String((p.ideia && p.ideia.respostas) || '').trim();
    const lst = xs => (xs || []).length ? xs.map(x => '- ' + x).join('\n') : '- (nenhuma)';
    const anterior = ult ? `
## O que ficou da rodada anterior (${ult.n})
Melhorias que você sugeriu:
${lst((ult.melhorias || []).map(m => typeof m === 'string' ? m : `[${m.onde || 'geral'}] ${m.o_que || ''}`))}
Perguntas que você fez:
${lst(ult.perguntas)}
Know-how que já combinamos deixar FORA do pedido (continue deixando fora):
${lst(ult.segredos)}

## Respostas do inventor e o que mudou desde então
${resp || '(o inventor não respondeu; mantenha as perguntas que continuam importantes)'}
` : '';
    return `Você é um redator de patentes sênior no Brasil (INPI), com experiência em ${p.area || 'engenharia'} e no caminho de depósito pela universidade (NIT). Esta é a **rodada ${n}** de um trabalho em rodadas: a cada rodada você recebe o pedido como está, melhora e devolve o pedido inteiro, mais as próximas melhorias e perguntas.

## A ideia contada pelo inventor (linguagem do dia a dia)
Pergunta feita a ele: "${PERGUNTA_IDEIA}"

Resposta:
"""
${ideia || '(vazio)'}
"""
${anterior}
## O pedido como está agora (JSON do app, sem dados pessoais)
\`\`\`json
${JSON.stringify(estadoParaIA(p), null, 1)}
\`\`\`

## O que fazer
1. **Preencha o pedido inteiro** a partir da ideia e do pedido atual: ficha, componentes numerados, reivindicações, resumo, relatório descritivo, legendas das figuras, classes IPC/CPC, termos de busca e os textos dos formulários da universidade. Mantenha o que já está bom; melhore o resto. Use os mesmos números de referência (01), (02)… em tudo.
2. **Proteja bem sem entregar o produto inteiro.** Redija como um bom redator de patentes: descreva a invenção pela função e pelo princípio, com termos genéricos, e não pelo protótipo, marca, modelo ou material comercial. O que for preferido no protótipo entra como "em uma concretização" ou "preferencialmente", com alternativas equivalentes. A reivindicação independente leva só o mínimo que distingue a invenção do estado da técnica; o resto vai para dependentes em cascata, do mais amplo ao mais específico.
3. **Suficiência é obrigatória** (art. 24 da Lei 9.279/96): um técnico no assunto precisa conseguir reproduzir a invenção, e omitir algo essencial pode anular a patente. Mas deixe de fora o know-how que não é necessário para realizar a invenção (ajustes finos, valores de calibração, código, receitas de processo, fornecedores, custos, tolerâncias internas); quando um valor for necessário, use faixas. Liste em "segredos_mantidos" o que você deixou de fora de propósito, para o inventor guardar em sigilo.
4. **Regras do INPI:** reivindicações numa frase só, começando pelo título (ou parte dele) e com "caracterizado por"; dependentes "de acordo com a reivindicação N"; resumo entre 50 e 200 palavras indicando a figura mais representativa; relatório com campo, fundamentos, problema e solução, breve descrição dos desenhos ("A FIGURA 1 ilustra…"), descrição detalhada e exemplos de concretização. Sem marketing, sem "nosso"/"eu", sem termos vagos ("etc.", "aproximadamente" sem faixa).
5. **PI ou MU:** recomende e justifique em "natureza_justificativa". Se for MU, use uma só reivindicação independente e descreva pela forma ou disposição (desenhos obrigatórios).
6. **Não invente** números de patente, resultados de ensaio, medidas ou empresas. O que faltar: escreva [COMPLETAR: o que falta] no texto e faça a pergunta em "perguntas". Não coloque nomes, CPF, e-mails ou endereços de pessoas.
7. **Corrija os "alertas_da_revisao"** do JSON acima, se fizer sentido.
8. **Feche a rodada:** diga o que mudou, as próximas melhorias em ordem de prioridade e até 6 perguntas objetivas ao inventor. Na próxima rodada eu volto com as respostas.

## Resposta
Responda **somente** com um bloco \`\`\`json, sem texto antes ou depois, neste formato (textos longos com parágrafos separados por "\\n\\n"; não numere os parágrafos do relatório nem as reivindicações, o app numera):
\`\`\`json
{
  "formato": "${FORMATO_IDEIA}",
  "versao": 1,
  "rodada": ${n},
  "pedido": {
    "natureza": "PI ou MU",
    "natureza_justificativa": "",
    "titulo": "",
    "area": "",
    "ficha": { "campo": "", "problema": "", "estadoTecnica": "", "solucao": "", "vantagens": "", "aplicacoes": "", "ensaios": "", "concorrentes": "" },
    "componentes": [ { "num": "01", "nome": "", "funcao": "" } ],
    "reivindicacoes": [ { "dep": null, "preambulo": "", "texto": "o que vem depois de 'caracterizado por'" }, { "dep": 1, "preambulo": "", "texto": "" } ],
    "resumo": "",
    "figura_resumo": "1",
    "relatorio": { "campo": "", "fundamentos": "", "problemaSolucao": "", "desenhos": "", "descricao": "", "exemplos": "" },
    "desenhos": [ { "legenda": "ilustra …", "numeros": ["01", "02"] } ],
    "classes": [ "A01C 7/12" ],
    "termos_busca": { "objeto": "termo; sinônimo", "elemento": "", "orientacao": "", "geometria": "", "problema": "", "condicao": "", "fabricacao": "" },
    "traducoes": { "termo em português": "inglês; espanhol" },
    "depositantes_busca": "empresas que costumam patentear nesta área, separadas por ;",
    "universidade": {
      "contexto": "", "comoHoje": "", "resultado": "", "aplicacoesIndustriais": "", "outrasAplicacoes": "", "objetoProjeto": "",
      "consiste": "${CONSISTE.join(' | ')}",
      "areaPredominante": "${AREAS_PREDOMINANTES.join(' | ')}",
      "areasAbrangidas": [ "uma ou mais de: ${AREAS_ABRANGIDAS.slice(0, 6).join(', ')}…" ],
      "empresasMercado": "", "empresasOferta": ""
    }
  },
  "estrategia": "em poucas linhas, ao inventor: o núcleo protegido e por que as reivindicações estão assim",
  "segredos_mantidos": [ "know-how deixado fora do pedido de propósito" ],
  "mudancas": [ "o que mudou nesta rodada" ],
  "proximas_melhorias": [ { "prioridade": 1, "onde": "reivindicações | relatório | desenhos | busca | ficha | universidade", "o_que": "" } ],
  "perguntas": [ "pergunta objetiva ao inventor" ],
  "riscos": [ "ex.: divulgação perto do prazo, documento muito parecido na busca" ]
}
\`\`\``;
}

// ------------------------------------------------------------ leitura e aplicação da resposta
/** Lê o JSON da IA (puro, dentro de ```json ou com texto em volta). Devolve null se não for deste formato. */
function lerRespostaIdeia(texto) {
    const t = String(texto || ''), bloco = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const fonte = bloco ? bloco[1] : t, ini = fonte.indexOf('{'), fim = fonte.lastIndexOf('}');
    if (ini < 0 || fim <= ini) return null;
    let o; try { o = JSON.parse(fonte.slice(ini, fim + 1)); } catch (e) { return null; }
    if (!o || typeof o !== 'object') return null;
    if (o.formato && o.formato !== FORMATO_IDEIA) return null;
    const ped = o.pedido && typeof o.pedido === 'object' ? o.pedido : (o.ficha || o.reivindicacoes ? o : null);
    if (!ped) return null;
    return { pedido: ped, meta: o };
}

const txt = v => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim() : typeof v === 'number' ? String(v) : '');
const listaTxt = v => (Array.isArray(v) ? v : v ? [v] : []).map(x => typeof x === 'object' && x ? (x.o_que || x.texto || x.pergunta || JSON.stringify(x)) : String(x)).map(s => s.trim()).filter(Boolean);
const semMarcaNum = s => s.replace(/^[ \t]*\[?\d{1,4}\]?[.)-]?[ \t]+(?=\S)/gm, '');
const semCaracterizado = s => s.replace(/^.*?\bcaracterizad[oa]\s+(?:por|pelo|pela|pelo fato de(?: que)?)\s+/i, '').replace(/\.+$/, '').trim();

/**
 * Aplica o JSON da IA ao pedido.
 *   modo 'completar': só preenche o que está vazio (regra do app: nunca apagar).
 *   modo 'melhorar' : substitui os campos que a IA devolveu preenchidos (quem chama guarda a cópia para desfazer).
 * Nunca toca em inventores, dados pessoais, divulgações, buscas feitas nem figuras desenhadas. Devolve a lista do que entrou.
 */
function aplicarRespostaIdeia(p, texto, modo = 'completar') {
    const r = lerRespostaIdeia(texto);
    if (!r) throw new Error(`não achei o JSON da resposta (formato "${FORMATO_IDEIA}"). Peça à IA para responder só com o bloco \`\`\`json.`);
    const d = r.pedido, m = r.meta, feito = [];
    const trocar = atual => modo === 'melhorar' || !String(atual ?? '').trim();
    const put = (caminho, valor, rot) => {
        const v = txt(valor);
        if (!v || v === txt(lerCaminho(p, caminho))) return;
        if (!trocar(lerCaminho(p, caminho))) return;
        gravarCaminho(p, caminho, v); p.autoFeito[caminho] = 1; feito.push(rot);
    };

    const nat = txt(d.natureza).toUpperCase();
    if ((nat === 'PI' || nat === 'MU') && nat !== p.natureza && trocar(p.natureza)) { p.natureza = nat; feito.push('natureza ' + nat); }
    put('titulo', d.titulo, 'título');
    put('area', d.area, 'área');
    const f = d.ficha || {};
    for (const [k, rot] of [['campo', 'para que serve'], ['problema', 'problema'], ['estadoTecnica', 'o que existe hoje'], ['solucao', 'solução'], ['vantagens', 'vantagens'], ['aplicacoes', 'aplicações'], ['ensaios', 'ensaios'], ['concorrentes', 'concorrentes']]) put('ficha.' + k, f[k], rot);

    // componentes: troca a lista inteira (os números ligam figuras, reivindicações e relatório)
    const comps = (Array.isArray(d.componentes) ? d.componentes : []).filter(c => c && txt(c.nome))
        .map(c => ({ id: uid(), num: n2(txt(c.num)) || '', nome: txt(c.nome), funcao: txt(c.funcao) }));
    if (comps.length && (modo === 'melhorar' || !p.ficha.componentes.length)) {
        for (const c of comps) { const ja = p.ficha.componentes.find(x => n2(x.num) === c.num); if (ja) c.id = ja.id; }
        p.ficha.componentes = comps; p.autoFeito.componentes = 1; feito.push(comps.length + ' componentes');
    }

    const reivs = (Array.isArray(d.reivindicacoes) ? d.reivindicacoes : []).filter(x => x && txt(x.texto))
        .map(x => ({ id: uid(), dep: x.dep ? Number(x.dep) || null : null, preambulo: txt(x.preambulo), expressao: '', texto: semCaracterizado(semMarcaNum(txt(x.texto))) }));
    if (reivs.length && (modo === 'melhorar' || !p.reivindicacoes.some(x => x.texto.trim()))) {
        reivs.forEach((x, i) => { if (x.dep && (x.dep > i || x.dep < 1)) x.dep = null; });
        p.reivindicacoes = reivs; p.autoFeito.reivindicacoes = 1; feito.push(reivs.length + ' reivindicações');
    }

    put('resumo', d.resumo, 'resumo');
    const fr = txt(d.figura_resumo).replace(/\D/g, '');
    if (fr && (modo === 'melhorar' || !p.autoFeito.figuraResumo)) { p.figuraResumo = fr; p.autoFeito.figuraResumo = 1; }
    const rel = d.relatorio || {};
    for (const [k, nome] of SECOES_RELATORIO) put('relatorio.' + k, semMarcaNum(txt(rel[k])), 'relatório: ' + nome.split(' (')[0].toLowerCase());

    // figuras: só legendas; cria a célula da figura que ainda não existe (o desenho é do inventor)
    const figs = (Array.isArray(d.desenhos) ? d.desenhos : []).map(x => (typeof x === 'string' ? { legenda: x } : x || {}));
    let novasFig = 0, legendas = 0;
    figs.forEach((x, i) => {
        const leg = txt(x.legenda).replace(/^a\s+figura\s+\d+\s+/i, '');
        if (!leg) return;
        const fig = p.desenhos[i];
        if (!fig) { p.desenhos.push({ id: uid(), legenda: leg, img: '', w: 1000, h: 600, elementos: [] }); novasFig++; }
        else if (leg !== fig.legenda && trocar(fig.legenda)) { fig.legenda = leg; legendas++; }
    });
    if (novasFig) feito.push(novasFig + ' figura(s) nova(s) com legenda');
    if (legendas) feito.push(legendas + ' legenda(s)');

    // classes: as do catálogo são marcadas; as outras vão para "outras classes"
    const cods = listaTxt(d.classes).map(c => c.toUpperCase().replace(/\s+/g, ' ').replace(/^([A-H]\d{2}[A-Z])\s*(\d)/, '$1 $2'));
    const doCat = new Set(IPC_CATALOGO.map(c => c[0]));
    const marc = cods.filter(c => doCat.has(c) && !p.classes.marcadas.includes(c));
    const ja = classesBusca(p);
    const outras = cods.filter(c => !doCat.has(c) && !ja.includes(c));
    if (marc.length) p.classes.marcadas.push(...marc);
    if (outras.length) p.classes.manuais = [p.classes.manuais.trim(), ...outras].filter(Boolean).join('; ');
    if (marc.length + outras.length) feito.push((marc.length + outras.length) + ' classe(s)');

    const tb = d.termos_busca || d.termos || {};
    for (const k of Object.keys(p.busca.termos)) put('busca.termos.' + k, tb[k], 'termos: ' + k);
    if (d.traducoes && typeof d.traducoes === 'object') {
        let nt = 0;
        for (const [k, v] of Object.entries(d.traducoes)) { const kk = semAcento(k).trim(), vv = txt(v); if (kk && vv && (modo === 'melhorar' || !p.busca.traducoes[kk])) { p.busca.traducoes[kk] = vv; nt++; } }
        if (nt) feito.push(nt + ' tradução(ões)');
    }
    put('busca.depositantes', d.depositantes_busca, 'depositantes da busca');

    const u = d.universidade || {};
    for (const k of CAMPOS_UNIV_IA) put('universidade.' + k, u[k], 'universidade: ' + k);
    const padrao = universidadePadrao();
    const sel = (k, lista) => { const v = lista.find(o => semAcento(o) === semAcento(txt(u[k]))); if (v && v !== p.universidade[k] && (modo === 'melhorar' || p.universidade[k] === padrao[k])) { p.universidade[k] = v; feito.push('universidade: ' + k); } };
    sel('consiste', CONSISTE); sel('areaPredominante', AREAS_PREDOMINANTES);
    const areas = listaTxt(u.areasAbrangidas).map(a => AREAS_ABRANGIDAS.find(o => semAcento(o) === semAcento(a))).filter(a => a && !p.universidade.areasAbrangidas.includes(a));
    if (areas.length) { p.universidade.areasAbrangidas.push(...areas); feito.push(areas.length + ' área(s) abrangida(s)'); }

    // registro da rodada (as últimas 12)
    const rod = {
        n: rodadasIdeia(p).length + 1, data: new Date().toISOString(), modo, aplicados: feito.length,
        naturezaJustificativa: txt(d.natureza_justificativa), estrategia: txt(m.estrategia),
        segredos: listaTxt(m.segredos_mantidos), mudancas: listaTxt(m.mudancas), perguntas: listaTxt(m.perguntas), riscos: listaTxt(m.riscos),
        melhorias: (Array.isArray(m.proximas_melhorias) ? m.proximas_melhorias : listaTxt(m.proximas_melhorias))
            .map(x => (typeof x === 'object' && x ? { prioridade: Number(x.prioridade) || 9, onde: txt(x.onde), o_que: txt(x.o_que || x.texto) } : { prioridade: 9, onde: '', o_que: String(x) }))
            .filter(x => x.o_que).sort((a, b) => a.prioridade - b.prioridade)
    };
    p.ideia.rodadas = rodadasIdeia(p).concat(rod).slice(-12);
    p.ideia.respostas = '';
    return feito;
}

/** Cópia do pedido antes de aplicar (fica no navegador, fora do JSON exportado). */
const DesfazerIdeia = {
    guardar(p) { try { localStorage.setItem(CHAVE_DESFAZER_IDEIA, JSON.stringify(p)); return true; } catch (e) { return false; } },
    tem() { try { return !!localStorage.getItem(CHAVE_DESFAZER_IDEIA); } catch (e) { return false; } },
    tirar() { try { const t = localStorage.getItem(CHAVE_DESFAZER_IDEIA); localStorage.removeItem(CHAVE_DESFAZER_IDEIA); return t ? normalizarPedido(JSON.parse(t)) : null; } catch (e) { return null; } },
    limpar() { try { localStorage.removeItem(CHAVE_DESFAZER_IDEIA); } catch (e) { /* ok */ } }
};
