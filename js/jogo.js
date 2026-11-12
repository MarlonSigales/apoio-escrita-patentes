/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * JOGO: etapas do Guia Básico do INPI como missões. Cada missão cumprida dá XP; o XP sobe o nível; marcos dão medalhas.
 * O XP é calculado do próprio pedido (não dá para "farmar"): apagar um texto tira os pontos.
 */

'use strict';

const cheio = t => String(t || '').trim().length >= 20;
const algum = t => String(t || '').trim().length > 0;

/** Etapas na ordem do guia. grupo = título no menu. */
const ETAPAS = [
    { id: 'inicio', grupo: 'Comece aqui', titulo: 'Painel do inventor', icone: '🏠' },
    { id: 'ficha', grupo: '1. Sua invenção', titulo: 'Sua invenção (e PI ou MU)', icone: '💡', guia: 'Entenda' },
    { id: 'fontes', grupo: '1. Sua invenção', titulo: 'Caderno de fontes', icone: '📚' },
    { id: 'resumo', grupo: '2. O núcleo do pedido', titulo: 'Resumo', icone: '✂️' },
    { id: 'reivindicacoes', grupo: '2. O núcleo do pedido', titulo: 'Reivindicações', icone: '⚖️' },
    { id: 'classificacao', grupo: '3. Faça buscas', titulo: 'Classificação', icone: '🧭', guia: 'Faça buscas' },
    { id: 'buscas', grupo: '3. Faça buscas', titulo: 'Buscas de anterioridade', icone: '🔎', guia: 'Faça buscas' },
    { id: 'desenhos', grupo: '4. Escreva o restante', titulo: 'Desenhos', icone: '🖼️', guia: 'Inicie o pedido' },
    { id: 'relatorio', grupo: '4. Escreva o restante', titulo: 'Relatório descritivo', icone: '📝' },
    { id: 'inventores', grupo: '5. Via universidade', titulo: 'Inventores e participação', icone: '👥' },
    { id: 'universidade', grupo: '5. Via universidade', titulo: 'Formulários da universidade', icone: '🏛️' },
    { id: 'revisao', grupo: '6. Deposite e acompanhe', titulo: 'Revisão final', icone: '✅' },
    { id: 'deposito', grupo: '6. Deposite e acompanhe', titulo: 'Depósito e GRU', icone: '📤', guia: 'Inicie o pedido / Pague a GRU' },
    { id: 'acompanhe', grupo: '6. Deposite e acompanhe', titulo: 'Acompanhe e prazos', icone: '📅', guia: 'Acompanhe / Pedido em andamento / Validade' },
    { id: 'entrega', grupo: '🏆 Fim', titulo: 'Os 8 documentos', icone: '🏆' }
];

function missoes(p) {
    const f = p.ficha, r = p.relatorio, u = p.universidade;
    const rs = p.reivindicacoes.filter(x => x.texto.trim());
    const feitas = Object.values(p.busca.executadas).filter(e => e && e.feita);
    const basesFeitas = new Set([...feitas.map(e => e.base), ...p.busca.registroColado.map(r => r.base)]);
    const erros = verificar(p).filter(x => x.nivel === 'erro');
    const soma = u.inventores.concat(u.colaboradores).reduce((s, x) => s + (Number(String(x.percentual).replace(',', '.')) || 0), 0);
    return {
        inicio: [
            { t: 'Contar a ideia com as suas palavras (40 palavras ou mais)', xp: 15, ok: palavras(p.ideia.texto) >= 40 },
            { t: 'Trazer a resposta da IA para o pedido (1ª rodada)', xp: 15, ok: p.ideia.rodadas.length >= 1 },
            { t: 'Dar nome ao projeto (título provisório)', xp: 10, ok: algum(p.titulo) }
        ],
        ficha: [
            { t: 'Escolher a natureza: PI ou MU', xp: 20, ok: !!p.natureza },
            { t: 'Registrar divulgações (TCC, congresso, artigo) ou confirmar que não houve', xp: 15, ok: p.contexto.divulgacoes.length > 0 || p.revisao.semDivulgacao },
            { t: 'Descrever o campo (para que serve)', xp: 15, ok: cheio(f.campo) },
            { t: 'Explicar o problema técnico', xp: 15, ok: cheio(f.problema) },
            { t: 'Explicar a solução e como funciona', xp: 20, ok: cheio(f.solucao) },
            { t: 'Listar 3 ou mais componentes numerados', xp: 20, ok: f.componentes.filter(c => c.nome && c.num).length >= 3 },
            { t: 'Vantagens e aplicações', xp: 10, ok: cheio(f.vantagens) && cheio(f.aplicacoes) }
        ],
        fontes: [
            { t: 'Adicionar 1 fonte (TCC, artigo, relatório)', xp: 15, ok: p.fontes.length >= 1 },
            { t: 'Adicionar 3 fontes', xp: 15, ok: p.fontes.length >= 3 }
        ],
        classificacao: [
            { t: 'Marcar ao menos 2 classes', xp: 20, ok: classesBusca(p).length >= 2 }
        ],
        buscas: [
            { t: 'Preencher as famílias de termos', xp: 15, ok: ['objeto', 'elemento', 'problema'].every(k => algum(p.busca.termos[k])) },
            { t: 'Gerar o prompt e colar o retorno da busca', xp: 30, ok: p.busca.registroColado.length > 0 || !!p.busca.retorno },
            { t: 'Cobrir as 5 bases de patentes (retorno colado ou buscas à mão)', xp: 20, ok: ['inpi', 'google', 'espacenet', 'patentscope', 'uspto'].every(b => basesFeitas.has(b)) },
            { t: 'Registrar 5 documentos encontrados', xp: 20, ok: p.busca.resultados.filter(x => x.num).length >= 5 },
            { t: 'Buscar trabalhos da própria equipe (autodivulgação)', xp: 15, ok: feitas.some(e => e.est === 'E' || e.est === 'G') || /autodivulga|pr[óo]pria equipe|ufpel|universidade/i.test(p.busca.retorno) }
        ],
        relatorio: [
            { t: 'Campo da invenção', xp: 10, ok: cheio(r.campo) },
            { t: 'Fundamentos e estado da técnica', xp: 20, ok: cheio(r.fundamentos) },
            { t: 'Breve descrição dos desenhos', xp: 10, ok: cheio(r.desenhos) },
            { t: 'Descrição da invenção', xp: 25, ok: cheio(r.descricao) },
            { t: 'Exemplos de concretização', xp: 10, ok: cheio(r.exemplos) }
        ],
        reivindicacoes: [
            { t: 'Reivindicação independente', xp: 30, ok: rs.some(x => !x.dep) },
            { t: '3 reivindicações dependentes', xp: 20, ok: rs.filter(x => x.dep).length >= 3 }
        ],
        desenhos: [
            { t: 'Inserir a FIGURA 1 com legenda', xp: 20, ok: p.desenhos.some(d => (d.img || (d.elementos || []).length) && d.legenda) },
            { t: 'Numerar as peças com setas', xp: 15, ok: p.desenhos.some(d => (d.elementos || []).some(e => e.t === 'seta')) },
            { t: 'Descrever todos os números das setas', xp: 15, ok: p.desenhos.some(d => (d.elementos || []).some(e => e.t === 'seta')) && p.desenhos.every(d => numerosDaFigura(d).every(n => (p.ficha.componentes.find(c => n2(c.num) === n) || {}).nome)) },
            { t: 'Todas as figuras com imagem ou desenho e legenda', xp: 10, ok: p.desenhos.length > 0 && p.desenhos.every(d => (d.img || (d.elementos || []).length) && d.legenda) }
        ],
        resumo: [
            { t: 'Resumo entre 50 e 200 palavras', xp: 30, ok: palavras(p.resumo) >= 50 && palavras(p.resumo) <= 200 }
        ],
        inventores: [
            { t: 'Cadastrar os inventores', xp: 20, ok: u.inventores.some(i => i.nome) },
            { t: 'Definir o notificante (servidor da universidade)', xp: 10, ok: u.inventores.some(i => i.notificante) },
            { t: 'Participação nos resultados somando 100%', xp: 15, ok: Math.abs(soma - 100) < 0.01 }
        ],
        universidade: [
            { t: 'Dados do projeto (cadastro e título)', xp: 10, ok: algum(u.tituloProjeto) && algum(u.cadastroProjeto) },
            { t: 'Estado da técnica do formulário (itens a–e)', xp: 15, ok: [u.contexto || f.problema, u.comoHoje || f.estadoTecnica, u.resultado || f.vantagens].every(cheio) },
            { t: 'Empresas do mercado e para oferta', xp: 10, ok: cheio(u.empresasMercado || f.concorrentes) && cheio(u.empresasOferta) }
        ],
        revisao: [
            { t: 'Zerar os erros da revisão', xp: 40, ok: erros.length === 0 && rs.length > 0 },
            { t: 'Marcar todo o checklist', xp: 20, ok: CHECKLIST.every(c => p.revisao[c.id]) }
        ],
        deposito: [{ t: 'Registrar o envio ao NIT ou o número do pedido', xp: 20, ok: algum(p.deposito.numero) || algum(p.universidade.processoSEI) }],
        acompanhe: [{ t: 'Informar a data de depósito para calcular os prazos', xp: 10, ok: algum(p.deposito.data) }],
        entrega: [{ t: 'Baixar os 8 documentos', xp: 50, ok: !!p.jogo.baixouTudo }]
    };
}

const CHECKLIST = [
    { id: 'c1', t: 'O título é o mesmo no relatório, nas reivindicações e no resumo (o app garante isso).' },
    { id: 'c2', t: 'Os números de referência são iguais no relatório, nas reivindicações, nos desenhos e no resumo.' },
    { id: 'c3', t: 'Os desenhos não têm textos além das palavras indispensáveis (use os números de referência).' },
    { id: 'c4', t: 'Não há marcas, nomes comerciais nem termos vagos nas reivindicações.' },
    { id: 'c5', t: 'A invenção não foi divulgada, ou foi há menos de 12 meses (período de graça).' },
    { id: 'c6', t: 'Todos os inventores conferiram e concordaram com os documentos e com a titularidade da universidade.' },
    { id: 'c7', t: 'O orientador (servidor) vai abrir o processo sigiloso no SEI com o memorando.' }
];

const NIVEIS = [
    [0, 'Curioso(a)', '🌱'], [80, 'Aprendiz de inventor(a)', '🔧'], [200, 'Pesquisador(a) de anterioridade', '🔎'],
    [380, 'Redator(a) técnico(a)', '📝'], [560, 'Quase examinador(a)', '⚖️'], [720, 'Pronto(a) para depositar', '🚀'], [850, 'Inventor(a) completo(a)', '🏆']
];

function placar(p) {
    const m = missoes(p);
    let xp = 0, total = 0;
    const porEtapa = {};
    for (const [id, lista] of Object.entries(m)) {
        const ok = lista.filter(x => x.ok);
        porEtapa[id] = { feitas: ok.length, total: lista.length, xp: ok.reduce((s, x) => s + x.xp, 0), max: lista.reduce((s, x) => s + x.xp, 0) };
        xp += porEtapa[id].xp; total += porEtapa[id].max;
    }
    let nivel = NIVEIS[0], prox = null;
    for (let i = 0; i < NIVEIS.length; i++) if (xp >= NIVEIS[i][0]) { nivel = NIVEIS[i]; prox = NIVEIS[i + 1] || null; }
    return { xp, total, nivel, prox, porEtapa, missoes: m, medalhas: medalhas(p, porEtapa) };
}

function medalhas(p, pe) {
    const lista = [
        ['natureza', '🎯', 'Rumo certo', 'Escolheu PI ou MU', !!p.natureza],
        ['rodadas', '🤖', 'Parceria com a IA', '3 rodadas de melhoria do pedido', p.ideia.rodadas.length >= 3],
        ['ficha', '💡', 'Ideia no papel', 'Ficha da invenção completa', pe.ficha.feitas === pe.ficha.total],
        ['fontes', '📚', 'Bibliotecário(a)', '3 fontes no caderno', p.fontes.length >= 3],
        ['classe', '🧭', 'Classificador(a)', 'Marcou classes IPC/CPC', classesBusca(p).length >= 2],
        ['detetive', '🔎', 'Detetive de patentes', 'Buscou nas 5 bases', pe.buscas.feitas >= 3],
        ['reiv', '⚖️', 'Guardião(ã) das reivindicações', 'Independente + 3 dependentes', pe.reivindicacoes.feitas === pe.reivindicacoes.total],
        ['desenho', '🖼️', 'Desenhista', 'Figuras com legenda', pe.desenhos.feitas === pe.desenhos.total],
        ['conciso', '✂️', 'Conciso(a)', 'Resumo no limite', pe.resumo.feitas === 1],
        ['equipe', '👥', 'Espírito de equipe', 'Inventores e 100% de participação', pe.inventores.feitas === pe.inventores.total],
        ['coerente', '🔢', 'Coerente', 'Revisão sem erros', pe.revisao.feitas >= 1],
        ['prazo', '⏳', 'Guardião(ã) do prazo', 'Registrou as divulgações', p.contexto.divulgacoes.length > 0 || !!p.revisao.semDivulgacao],
        ['oito', '🏆', 'Pedido completo', 'Baixou os 8 documentos', !!p.jogo.baixouTudo]
    ];
    return lista.map(([id, icone, nome, desc, ok]) => ({ id, icone, nome, desc, ok }));
}

function estadoEtapa(pl, id) {
    const e = pl.porEtapa[id];
    if (!e || !e.total) return '';
    return e.feitas === e.total ? 'feito' : e.feitas ? 'andamento' : '';
}
