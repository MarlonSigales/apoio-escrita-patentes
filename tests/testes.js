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
    const exp = await exportarPedidoJSON(p);
    const volta = await importarPedidoJSON(exp);
    ok(JSON.parse(exp).formato === 'apoio-escrita-patentes-pedido' && volta.titulo === p.titulo && volta.reivindicacoes.length === p.reivindicacoes.length && volta.busca.registroColado.length === p.busca.registroColado.length && volta.universidade.inventores.length === p.universidade.inventores.length, 'exporta e reimporta o pedido em JSON sem perder nada');
    ok(nomePeloTitulo(p, 'json') === 'Sistema de monitoramento de pressão para circuitos pneumáticos.json', 'o arquivo leva o título da patente');
    let recusou = false; try { await importarPedidoJSON(RETORNO_EXEMPLO); } catch (e) { recusou = /busca/.test(e.message); }
    ok(recusou, 'avisa quando abrem o JSON da busca no lugar do pedido');
    ok((await importarPedidoJSON(JSON.stringify(p))).titulo === p.titulo, 'abre também o pedido.json antigo (sem envelope)');
    // inventores: ficha <-> aba
    const iv = normalizarPedido(pedidoVazio()); iv.contexto.inventores = 'Ana Souza\nBruno Lima';
    sincronizarInventores(iv, 'ficha');
    ok(iv.universidade.inventores.map(i => i.nome).join('|') === 'Ana Souza|Bruno Lima' && iv.universidade.inventores[0].notificante, 'nomes da ficha viram inventores');
    iv.universidade.inventores[1].cpf = '111'; iv.contexto.inventores = 'Ana Souza\nCarla Dias';
    sincronizarInventores(iv, 'ficha');
    ok(iv.universidade.inventores.map(i => i.nome).join('|') === 'Ana Souza|Carla Dias|Bruno Lima' && /Bruno Lima/.test(iv.contexto.inventores), 'atualizações da ficha entram e quem tem dados não some');
    iv.universidade.inventores[0].nome = 'Ana Souza Pereira'; sincronizarInventores(iv, 'tabela');
    ok(iv.contexto.inventores.split('\n')[0] === 'Ana Souza Pereira', 'nome alterado na aba volta para a ficha');
    const ej = exportarInventoresJSON(iv), outro = normalizarPedido(pedidoVazio());
    outro.universidade.inventores = [Object.assign(inventorVazio(), { nome: 'Carla Dias', email: 'c@x.br' })];
    const ri = importarInventoresJSON(outro, ej);
    ok(JSON.parse(ej).formato === 'apoio-escrita-patentes-inventores' && ri.novos === 2 && ri.atualizados === 0 && outro.universidade.inventores.length === 3 && outro.universidade.inventores.find(i => i.nome === 'Bruno Lima').cpf === '111' && /Bruno Lima/.test(outro.contexto.inventores), 'exporta e importa inventores em outro pedido sem duplicar');
    // figuras
    const fg = normalizarPedido(pedidoVazio()); fg.titulo = 'X'; fg.ficha.componentes = [{ id: 'c1', num: '01', nome: 'Bateria', funcao: '' }];
    fg.desenhos = [normalizarFigura({ id: 'f1', legenda: 'ilustra o sistema', img: '', elementos: [{ id: 'a', t: 'seta', num: '01', x1: 10, y1: 10, x2: 50, y2: 50 }, { id: 'b', t: 'seta', num: '01', x1: 90, y1: 10, x2: 60, y2: 50 }, { id: 'c', t: 'seta', num: '02', x1: 30, y1: 80, x2: 60, y2: 90 }] })];
    ok(numerosDaFigura(fg.desenhos[0]).join() === '01,02' && proximoNumero(fg, fg.desenhos[0]) === '03', 'setas: números repetidos contam uma vez e o próximo é progressivo');
    ok(RASCUNHOS.desenhos(fg) === 'A FIGURA 1 ilustra o sistema, na qual se observam bateria (01) e [DESCREVER] (02).', 'as setas escrevem a breve descrição dos desenhos');
    ok(verificar(fg).some(x => x.onde === 'desenhos' && /\(02\) está sem descrição/.test(x.msg)), 'avisa seta sem descrição');
    const tx = normalizarPedido(pedidoVazio()); tx.desenhos = [normalizarFigura({ id: 'f', elementos: [{ id: 't', t: 'texto', pt: 'sensor de pressão', en: '', es: '' }] })];
    traduzirTextosFigura(tx, tx.desenhos[0]);
    ok(tx.desenhos[0].elementos[0].en === 'pressure sensor' && tx.desenhos[0].elementos[0].es === 'sensor de presión', 'textos da figura traduzidos pelo dicionário');
    tx.idiomaDesenhos = 'en'; ok(textoNoIdioma(tx, tx.desenhos[0].elementos[0]) === 'pressure sensor', 'troca o idioma dos textos da figura');
    const png = await figuraPNG(fg, fg.desenhos[0]);
    ok(png && png.type === 'image/png' && png.size > 500, 'figura desenhada vira PNG para o .docx');
    // melhorar o relatório com IA
    const pr = promptMelhorarRelatorio(p);
    ok(/art\. 24/.test(pr) && /mais geral possível/.test(pr) && /apoio-escrita-patentes-relatorio/.test(pr) && pr.includes(textoReivindicacao(p, p.reivindicacoes[0])), 'prompt do relatório leva regras, reivindicações e formato JSON');
    const pm = exemploPressao();
    const resp = 'Segue:\n```json\n' + JSON.stringify({ formato: 'apoio-escrita-patentes-relatorio', versao: 1, relatorio: { campo: 'A presente invenção refere-se a um sistema de monitoramento.', descricao: '1. Primeiro parágrafo.\n\n2. Segundo parágrafo.' }, pendencias: ['faixa de pressão'], reivindicacoes_sem_suporte: [], termos_genericos: [{ antes: 'ESP32', depois: 'unidade de processamento' }], observacoes: [] }) + '\n```';
    const am = aplicarMelhoriaRelatorio(pm, resp);
    ok(pm.relatorio.campo.startsWith('A presente invenção') && pm.relatorio.descricao === 'Primeiro parágrafo.\n\nSegundo parágrafo.' && pm.relatorio.exemplos === exemploPressao().relatorio.exemplos && am.termos[0] === 'ESP32 → unidade de processamento' && pm.relatorioAnterior.campo, 'resposta da IA atualiza as seções e guarda a anterior');
    let rec2 = false; try { aplicarMelhoriaRelatorio(pm, 'texto sem json'); } catch (e) { rec2 = true; } ok(rec2, 'resposta sem o JSON é recusada');
    const cv = promptConverterBusca(p);
    ok(/Não refaça a busca/.test(cv) && /"formato": "apoio-escrita-patentes-busca"/.test(cv) && /\*\*C1:\*\*/.test(cv), 'pedido para converter PDF de busca em JSON');
    ok(mesmoDocumento('BR 10 2016 023064-0 B1', 'BR102016023064A2') && mesmoDocumento('BR202022000099U2 / Y1', 'BR202022000099Y1') && mesmoDocumento('AR045253 / AR040943', 'AR040943') && mesmoDocumento('PI0103912-1', 'BR0103912A') && mesmoDocumento('BR 10 2024 016346 0', 'BR102024016346') && !mesmoDocumento('BR102016023064B1', 'BR102016023065B1'), 'mesmo número de documento em formatos diferentes');
    { const q = normalizarPedido(pedidoVazio());
      aplicarRetorno(q, JSON.stringify({ formato: 'apoio-escrita-patentes-busca', versao: 1, documentos: [{ numero: 'US11582898B2', base: 'google', titulo: 'Meters' }, { numero: 'US 11,582,898 B2', base: 'espacenet', link: 'https://worldwide.espacenet.com/x' }] }));
      const a = aplicarRetorno(q, JSON.stringify({ formato: 'apoio-escrita-patentes-busca', versao: 1, documentos: [{ numero: 'US11582898', base: 'patentscope' }] }));
      ok(q.busca.resultados.length === 1 && a.nrep === 1 && /Google Patents/.test(q.busca.resultados[0].base) && /Espacenet/.test(q.busca.resultados[0].base) && /PATENTSCOPE/i.test(q.busca.resultados[0].base), 'mesmo documento em bases diferentes vira uma entrada só: ' + q.busca.resultados[0].base);
      q.busca.resultados.push({ num: 'US11582898B2', carac: {} }); ok(normalizarPedido(q).busca.resultados.length === 1, 'repetidos já salvos são juntados ao abrir'); }
    { const q = normalizarPedido(pedidoVazio()); q.universidade.empresasOferta = 'Empresa X (contato: fulano)';
      aplicarRetorno(q, JSON.stringify({ formato: 'apoio-escrita-patentes-busca', versao: 1, documentos: [{ numero: 'BR102020016318A2', depositante: 'Marchesan Implementos e Máquinas Agrícolas', relevancia: 3 }, { numero: 'BR102012012157B1', depositante: 'Universidade Federal de Pelotas', relevancia: 5 }, { numero: 'BR102016023064B1', depositante: 'José Roberto do Amaral Assy', relevancia: 5 }, { numero: 'US20150208573A1', depositante: 'Kinze Manufacturing', relevancia: 2 }] }));
      const o = q.universidade.empresasOferta, m = q.universidade.empresasMercado;
      ok(/Empresa X/.test(o) && /Marchesan.*BR102020016318A2/.test(o) && /Kinze/.test(o) && !/Universidade|Assy/.test(o) && /Marchesan/.test(m), 'empresas da busca vão para os formulários 2.4 e 2.5 como possíveis interessadas');
      aplicarRetorno(q, JSON.stringify({ formato: 'apoio-escrita-patentes-busca', versao: 1, documentos: [{ numero: 'X1', depositante: 'Kinze Manufacturing' }] }));
      ok((q.universidade.empresasOferta.match(/Kinze/g) || []).length === 1, 'empresa não se repete no formulário'); }
    { const q = normalizarPedido(pedidoVazio()), d = { id: 'f', w: 1000, h: 600, elementos: [] };
      const ruins = Object.keys(SIMBOLOS).filter(k => { const s = SIMBOLOS[k]; for (const rot of [0, 90]) { const svg = svgSimbolo(q, d, { t: 'sim', forma: k, x: 10, y: 10, w: s.w, h: s.h, rot, pt: s.txt }); if (!svg || /NaN|undefined/.test(svg)) return true; } return false; });
      ok(!ruins.length && Object.keys(SIMBOLOS).length >= 60, Object.keys(SIMBOLOS).length + ' símbolos desenham sem erro' + (ruins.length ? ': ' + ruins : ''));
      const lig = ESTILOS_LIGACAO.every(([es]) => COTOVELOS.every(([c]) => { const s = svgLigacao(d, { x1: 0, y1: 0, x2: 300, y2: 200, estilo: es, cotovelo: c, fim: 'seta', ini: 'ponto' }); return s && !/NaN|undefined/.test(s); }));
      ok(lig, 'ligações em todos os estilos e cotovelos'); }
    for (const d of DOCUMENTOS) {
        const b = await gerarDocumento(p, d.id);
        const z = await JSZip.loadAsync(b);
        ok(z.file('word/document.xml') && /<w:body>/.test(await z.file('word/document.xml').async('string')), 'docx válido: ' + d.nome);
    }
    ok(DOCUMENTOS.length === 8, 'são 8 documentos');
    document.body.innerHTML = `<h1>${RES.filter(r => r[0]).length}/${RES.length} testes ok</h1><ul>${RES.map(([c, n]) => `<li style="color:${c ? 'green' : 'red'}">${c ? '✔' : '✘'} ${esc(n)}</li>`).join('')}</ul>`;
    window.RESULTADO = RES;
})();
