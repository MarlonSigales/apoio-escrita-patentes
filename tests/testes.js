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
    ok(sugerirClasses(exemploDosador(), 3).some(s => s.codigo.startsWith('A01C')), 'classificação aproxima o dosador de A01C');
    ok(gerarBuscas(p).some(b => b.base === 'espacenet') && gerarBuscas(p).some(b => b.base === 'inpi'), 'gera buscas para Espacenet e INPI');
    const md = gerarMD(exemploDosador());
    ok(/manualmente/.test(md), 'prompt .md manda pedir CAPTCHA manualmente');
    const vazio = normalizarPedido(pedidoVazio());
    const feito = aplicarMD(vazio, md);
    ok(vazio.titulo === 'Dosador de fertilizantes com cilindro rotativo vertical' && vazio.classes.marcadas.includes('A01C 7/12') && feito.length > 5, 'o .md preenche um pedido vazio');
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
