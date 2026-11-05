/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 * TESTES: abra tests/testes.html por um servidor local (python3 -m http.server) e veja o resultado na página.
 */
'use strict';
const RES = [];
function ok(cond, nome) { RES.push([!!cond, nome]); }

(async () => {
    const p = exemploPressao();
    ok(p.natureza === 'MU' && p.reivindicacoes.length === 5, 'exemplo de pressão carrega');
    ok(verificar(p).filter(x => x.nivel === 'erro').length === 0, 'exemplo sem erros na revisão');
    ok(textoReivindicacao(p, p.reivindicacoes[1]).startsWith('SISTEMA DE MONITORAMENTO DE PRESSÃO PARA CIRCUITOS PNEUMÁTICOS de acordo com a reivindicação 1 caracterizado por'), 'reivindicação dependente no formato da equipe');
    ok(sugerirClasses(p, 4).some(s => s.codigo.startsWith('G01L')), 'classificação aproxima o sistema de pressão de G01L');
    // cadeia: só título, resumo e reivindicações → resto pré-preenchido
    const n = normalizarPedido(pedidoVazio());
    Object.assign(n, { natureza: 'MU', titulo: p.titulo, resumo: p.resumo });
    n.reivindicacoes = p.reivindicacoes.map(r => Object.assign({}, r));
    const auto = autoPreencher(n);
    ok(n.ficha.componentes.length >= 4 && n.ficha.campo && n.ficha.solucao, 'resumo e reivindicações pré-preenchem a ficha');
    ok(n.busca.termos.objeto && n.classes.marcadas.length >= 1, 'e também os termos e as classes da busca');
    ok(n.desenhos.length >= 1 && n.relatorio.campo && n.relatorio.descricao, 'e os desenhos e o relatório');
    ok(n.universidade.objetoProjeto && n.universidade.aplicacoesIndustriais, 'e os formulários da universidade');
    ok(autoPreencher(n).length === 0, 'não repreenche o que já preencheu');
    // cadeia inversa: só a ficha → resumo e reivindicações
    const fi = normalizarPedido(pedidoVazio());
    Object.assign(fi, { natureza: 'MU', titulo: p.titulo });
    Object.assign(fi.ficha, { campo: p.ficha.campo, solucao: p.ficha.solucao, componentes: p.ficha.componentes.slice(0, 4), aplicacoes: p.ficha.aplicacoes });
    autoPreencher(fi);
    ok(fi.resumo && fi.reivindicacoes.length >= 2 && fi.relatorio.campo && fi.universidade.objetoProjeto, 'a ficha pré-preenche resumo, reivindicações, relatório e universidade');
    ok(ETAPAS[1].id === 'ficha', '"Sua invenção" é a primeira aba depois do Início');
    const vz = normalizarPedido(pedidoVazio());
    ok(autoPreencher(vz).length === 0, 'pedido vazio continua vazio');
    const rj = lerRetornoJSON(RETORNO_EXEMPLO);
    ok(rj && rj.registro.length === 6 && rj.registro.some(r => r.base === 'inpi' && r.n === 1843 && r.est === 'A'), 'lê o JSON padronizado: contagens por base e estratégia');
    ok(rj.resultados.length === 2 && rj.achou === false && /manômetros/.test(rj.nota) && rj.resultados[0].carac.C1 === 'P' && rj.analise.diferenciais.length === 1, 'lê o JSON: documentos, quadro S/P/N, nota e análise');
    ok(lerRetornoJSON('Aqui está:\n```json\n' + RETORNO_EXEMPLO + '\n```\nfim') !== null, 'aceita o JSON dentro de um bloco ```json');
    ok(lerRetornoJSON('{"x":1}') === null && lerRetornoJSON('texto qualquer') === null, 'texto que não é o JSON cai na leitura de texto');
    ok(/apoio-escrita-patentes-busca/.test(gerarMD(p)) && !/relatório em PDF/.test(gerarMD(p)), 'o prompt pede o retorno em JSON, não em PDF');
    const ret = lerRetornoBusca('INPI - (http://www.inpi.gov.br/)\nManômetro digital / 16\nSensor de pressão / 1843\n\nUSPTO\nPressure sensor / 1538402\n\n- PI 9203934-0 A — Dispositivo de medição de pressão\nforam encontradas anterioridades? [ x ] Não');
    ok(ret.registro.length === 3 && ret.registro.some(r => r.base === 'uspto' && r.n === 1538402) && ret.resultados.length === 1 && ret.achou === false, 'continua lendo retorno antigo em texto (PDF copiado)');
    const tab = lerRetornoBusca('| Base | Sequência exata | Resultados | Triados |\n|---|---|---|---|\n| Espacenet | ctxt = "pressure sensor" | 34 | 25 |\n\n| Registro | Nome | Resumo | Nível de proximidade |\n|---|---|---|---|\n| BR 10 2016 023064 B1 | Dosador | x | Alta |');
    ok(tab.registro[0].base === 'espacenet' && tab.registro[0].n === 34 && tab.resultados[0].relevancia === 4, 'lê tabelas em Markdown do retorno');
    const rp = normalizarPedido(pedidoVazio()); rp.titulo = 'Máquina dosadora de sementes';
    ok(textoReivindicacao(rp, { dep: null, preambulo: '', expressao: '', texto: 'ter um rotor' }) === 'MÁQUINA DOSADORA DE SEMENTES caracterizada por ter um rotor.', 'palavra-chave concorda com o título (caracterizada)');
    ok(textoReivindicacao(rp, { dep: 1, preambulo: 'Máquina', expressao: '', texto: 'ter motor.' }) === 'MÁQUINA de acordo com a reivindicação 1 caracterizada por ter motor.', 'preâmbulo com parte do título + de acordo com');
    ok(partesDoTitulo(rp).join('|') === 'MÁQUINA|MÁQUINA DOSADORA|MÁQUINA DOSADORA DE SEMENTES', 'sugere partes do título');
    const lida = lerPedidoExistente('REIVINDICAÇÕES\n1. MÁQUINA X caracterizada por ter A.\n2. MÁQUINA de acordo com a reivindicação 1, caracterizada pelo fato de ter B.').reivindicacoes;
    ok(lida[0].preambulo === '' && lida[1].preambulo === 'MÁQUINA' && lida[1].dep === 1 && lida[1].expressao === 'caracterizada pelo fato de', 'lê preâmbulo, dependência e palavra-chave de um .docx');
    ok(gerarBuscas(p).some(b => b.base === 'espacenet') && gerarBuscas(p).some(b => b.base === 'inpi'), 'gera buscas para Espacenet e INPI');
    const md = gerarMD(p);
    ok(/manualmente/.test(md), 'prompt .md manda pedir CAPTCHA manualmente');
    const vazio = normalizarPedido(pedidoVazio());
    const feito = aplicarMD(vazio, md);
    ok(vazio.titulo === p.titulo && vazio.classes.marcadas.includes('G01L 9/00') && feito.length > 5, 'o .md preenche um pedido vazio');
    ok(lerPedidoExistente('REIVINDICAÇÕES\n1. SISTEMA X caracterizado por ter A.\n2. SISTEMA X de acordo com a reivindicação 1 caracterizado por ter B.').reivindicacoes.length === 2, 'lê reivindicações de um .docx');
    ok(componentesDoTexto('uma bateria (01) e um sensor de pressão (05)').length === 2, 'acha componentes numerados no texto');
    ok(palavras('um dois três') === 3, 'conta palavras');
    ok(somarMeses('2026-08-17', 12) === '2027-08-17', 'período de graça de 12 meses');
    for (const d of DOCUMENTOS) {
        const b = await gerarDocumento(p, d.id);
        const z = await JSZip.loadAsync(b);
        ok(z.file('word/document.xml') && /<w:body>/.test(await z.file('word/document.xml').async('string')), 'docx válido: ' + d.nome);
    }
    ok(DOCUMENTOS.length === 8, 'são 8 documentos');
    document.body.innerHTML = `<h1>${RES.filter(r => r[0]).length}/${RES.length} testes ok</h1><ul>${RES.map(([c, n]) => `<li style="color:${c ? 'green' : 'red'}">${c ? '✔' : '✘'} ${esc(n)}</li>`).join('')}</ul>`;
    window.RESULTADO = RES;
})();
