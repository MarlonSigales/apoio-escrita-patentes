/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * ETAPAS: páginas do fluxo (Guia Básico do INPI + caminho pela universidade). Cada página devolve HTML;
 * os campos usam data-c="caminho.do.dado" e são salvos sozinhos por app.js.
 */

'use strict';

const PAGINAS = {};

// ------------------------------------------------------------ componentes de interface
function campo(c, rotulo, o = {}) {
    const v = lerCaminho(App.p, c);
    const ph = o.ph ? ` placeholder="${escAttr(o.ph)}"` : '';
    let ctl;
    if (o.tipo === 'textarea') ctl = `<textarea data-c="${c}" rows="${o.linhas || 4}"${ph}>${esc(v)}</textarea>`;
    else if (o.tipo === 'select') ctl = `<select data-c="${c}">${o.opts.map(x => { const [val, txt] = Array.isArray(x) ? x : [x, x]; return `<option value="${escAttr(val)}"${String(v) === String(val) ? ' selected' : ''}>${esc(txt)}</option>`; }).join('')}</select>`;
    else ctl = `<input type="${o.tipo || 'text'}" data-c="${c}" value="${escAttr(v)}"${ph}>`;
    const ferramentas = o.rasc ? `<span class="campo-ferr"><button type="button" class="chip" data-acao="rascunho" data-k="${o.rasc}" data-c="${c}" title="Preenche com um rascunho feito a partir da ficha (só se estiver vazio; senão pergunta)">✨ Rascunho</button><button type="button" class="chip" data-acao="perguntar-campo" data-c="${c}" title="Procura nas suas fontes trechos para este campo">📚 Fontes</button></span>` : '';
    const conta = o.contar ? `<small class="contador-palavras" data-conta="${c}">${palavras(v)} palavras</small>` : '';
    return `<label class="${o.largo ? 'largo' : ''}">${rotulo}${o.dica ? ` <small>${o.dica}</small>` : ''}${ctl}${ferramentas || conta ? `<span class="campo-rodape">${ferramentas}${conta}</span>` : ''}</label>`;
}

function cartaoMissoes(id) {
    const pl = App.placar, lista = pl.missoes[id] || [];
    if (!lista.length) return '';
    const e = pl.porEtapa[id];
    return `<div class="missoes"><div class="missoes-topo"><b>🎮 Missões desta etapa</b><span>${e.xp} / ${e.max} XP</span></div>
        <div class="barra-xp"><i style="width:${e.max ? Math.round(100 * e.xp / e.max) : 0}%"></i></div>
        <ul>${lista.map(m => `<li class="${m.ok ? 'ok' : ''}">${m.ok ? '✅' : '⬜'} ${esc(m.t)} <small>+${m.xp} XP</small></li>`).join('')}</ul></div>`;
}

function cabecalho(id, sub) {
    const e = ETAPAS.find(x => x.id === id);
    return `<div class="page-titulo"><h1>${e.icone} ${esc(e.titulo)}${e.guia ? ` <span class="selo-guia" title="Passo do Guia Básico do INPI">Guia INPI: ${esc(e.guia)}</span>` : ''}</h1><p>${sub}</p></div>${cartaoMissoes(id)}`;
}

function alertas(onde) {
    const v = verificar(App.p).filter(x => x.onde === onde);
    if (!v.length) return '';
    return `<ul class="alertas">${v.map(x => `<li class="${x.nivel}">${x.nivel === 'erro' ? '⛔' : '⚠️'} ${esc(x.msg)}</li>`).join('')}</ul>`;
}

const LINK = (url, txt) => `<a href="${escAttr(url)}" target="_blank" rel="noopener">${esc(txt)}</a>`;

// ------------------------------------------------------------ INÍCIO
PAGINAS.inicio = {
    render(p) {
        const pl = App.placar;
        const prox = proximaEtapa();
        const pct = pl.total ? Math.round(100 * pl.xp / pl.total) : 0;
        return `${cabecalho('inicio', 'Escreva seu pedido de patente passo a passo, seguindo o Guia Básico do INPI e o caminho da universidade. Comece pela ficha <b>Sua invenção</b>: dela saem o resumo, as reivindicações, as buscas, o relatório, os desenhos e os formulários da universidade. Cada missão cumprida dá XP. No fim, você recebe os 8 documentos prontos.')}
        <div class="painel-jogo card">
            <div class="nivel"><span class="nivel-icone">${pl.nivel[2]}</span><div><small>Seu nível</small><b>${esc(pl.nivel[1])}</b><span>${pl.xp} XP${pl.prox ? ` · faltam ${pl.prox[0] - pl.xp} XP para <b>${esc(pl.prox[1])}</b>` : ''}</span></div></div>
            <div class="barra-xp grande"><i style="width:${pct}%"></i></div><small>${pct}% do pedido completo</small>
            ${prox ? `<div class="proximo-passo"><div class="proximo-passo-texto"><span class="proximo-passo-rotulo">próxima missão</span> ${ETAPAS.find(x => x.id === prox).icone} <b>${esc(ETAPAS.find(x => x.id === prox).titulo)}</b></div><a class="btn btn-primary" href="#/${prox}">Continuar ▶</a></div>` : ''}
        </div>
        <div class="card"><div class="grade-campos">${campo('titulo', 'Título provisório da invenção', { largo: true, ph: 'Ex.: Dosador de fertilizantes com cilindro rotativo vertical' })}</div>
        <p class="nota">Tudo fica salvo sozinho neste navegador. Para levar a outro computador, use "Baixar ZIP" (leva os 8 documentos e o projeto).</p></div>
        <div class="card"><h2>Comece rápido</h2><div class="comecar-opcoes">
            <button type="button" class="opcao" data-acao="importar-md"><b>⇪ Tenho o prompt da busca (.md)</b><span>Preenche ficha, termos, classes e buscas a partir do prompt de anterioridade.</span></button>
            <button type="button" class="opcao" data-acao="importar-docx"><b>📄 Tenho um pedido em Word</b><span>Lê Relatório, Reivindicações, Desenhos e Resumo (.docx) e preenche tudo.</span></button>
            <button type="button" class="opcao" data-acao="exemplo" data-ex="pressao"><b>🧪 Ver exemplo completo</b><span>Sistema de monitoramento de pressão para circuitos pneumáticos.</span></button>
            <button type="button" class="opcao" data-acao="novo"><b>🗑️ Começar do zero</b><span>Apaga tudo deste navegador e abre a ficha "Sua invenção" em branco.</span></button>
        </div></div>
        <div class="card"><h2>🏅 Medalhas</h2><div class="medalhas">${pl.medalhas.map(m => `<div class="medalha ${m.ok ? 'ganha' : ''}" title="${escAttr(m.desc)}"><span>${m.icone}</span><b>${esc(m.nome)}</b><small>${esc(m.desc)}</small></div>`).join('')}</div></div>
        <div class="card"><h2>O caminho</h2><ol class="trilha">${ETAPAS.filter(e => e.id !== 'inicio').map(e => { const st = estadoEtapa(pl, e.id); return `<li class="${st}"><a href="#/${e.id}">${e.icone} ${esc(e.titulo)}</a> <small>${pl.porEtapa[e.id] ? pl.porEtapa[e.id].feitas + '/' + pl.porEtapa[e.id].total : ''}</small></li>`; }).join('')}</ol></div>`;
    }
};

// ------------------------------------------------------------ ENTENDA
PAGINAS.entenda = {
    render(p) {
        const nat = (v, t, d) => `<button type="button" class="opcao tipo ${p.natureza === v ? 'ativo' : ''}" data-acao="natureza" data-v="${v}"><b>${t}</b><span>${d}</span></button>`;
        return `${cabecalho('entenda', 'A patente dá ao titular o direito de impedir que outros produzam, usem, vendam ou importem a invenção sem autorização. Escolha o tipo de pedido e registre se a ideia já foi divulgada.')}
        <div class="card"><h2>Qual é o seu caso?</h2><div class="comecar-opcoes">
            ${nat('PI', '🔬 Patente de invenção (PI)', 'Tecnologia nova (produto ou processo). Precisa de novidade, atividade inventiva e aplicação industrial. Vale 20 anos.')}
            ${nat('MU', '🛠️ Modelo de utilidade (MU)', 'Nova forma ou disposição de um objeto de uso prático que melhora o uso ou a fabricação. Precisa de novidade e ato inventivo. Desenhos obrigatórios. Vale 15 anos.')}
        </div>
        <details class="nota"><summary>Na dúvida? Faça o teste</summary><ul class="checklist">
            <li>É um <b>processo</b>, composição química ou método? → <b>PI</b>.</li>
            <li>É um <b>objeto</b> cuja novidade está na <b>forma ou disposição</b> das peças, que melhora o uso ou a fabricação? → <b>MU</b>.</li>
            <li>O princípio de funcionamento é novo (não só a forma)? → <b>PI</b>.</li></ul></details></div>
        <div class="card"><h2>⏳ Divulgações (cuidado com o prazo!)</h2>
        <p class="nota">Defesa de TCC, pôster, artigo, vídeo ou feira contam como divulgação. Pela Lei 9.279/96 (art. 12) você tem <b>12 meses</b> da primeira divulgação para depositar (período de graça). O ideal é depositar <b>antes</b> de divulgar.</p>
        ${p.contexto.divulgacoes.length ? `<div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Data</th><th>Meio (defesa, congresso, artigo…)</th><th>Prazo final</th><th></th></tr></thead><tbody>${p.contexto.divulgacoes.map(d => `<tr><td><input type="date" data-c="contexto.divulgacoes.#${d.id}.data" value="${escAttr(d.data)}"></td><td><input type="text" data-c="contexto.divulgacoes.#${d.id}.meio" value="${escAttr(d.meio)}"></td><td>${d.data ? dataBR(somarMeses(d.data, 12)) : '—'}</td><td class="col-acao"><button type="button" class="btn-icone" data-acao="remover" data-lista="contexto.divulgacoes" data-id="${d.id}" title="Remover">✕</button></td></tr>`).join('')}</tbody></table></div>` : ''}
        <div class="botoes"><button type="button" class="btn btn-secondary btn-sm" data-acao="add-divulgacao">＋ Divulgação</button>
        <label class="campo-inline"><input type="checkbox" data-c="revisao.semDivulgacao" ${p.revisao.semDivulgacao ? 'checked' : ''}> Não houve nenhuma divulgação</label></div>
        ${alertas('entenda')}</div>
        <div class="card"><h2>O que o INPI exige no pedido</h2><ul class="checklist">
            <li>📝 <b>Relatório descritivo</b> — descreve a invenção para que um técnico consiga reproduzi-la.</li>
            <li>⚖️ <b>Reivindicações</b> — definem o que fica protegido.</li>
            <li>🖼️ <b>Desenhos</b> — obrigatórios para MU; para PI, quando houver.</li>
            <li>✂️ <b>Resumo</b> — síntese do pedido.</li>
            <li>🧬 <b>Listagem de sequências</b> — só para PI com sequências biológicas essenciais.</li></ul>
        <p class="nota">Fonte: ${LINK('https://www.gov.br/inpi/pt-br/servicos/patentes/guia-basico', 'Guia Básico de Patentes do INPI')} · ${LINK('https://www.gov.br/inpi/pt-br/servicos/patentes/legislacao', 'Legislação')}</p></div>`;
    }
};

// ------------------------------------------------------------ FICHA
PAGINAS.ficha = {
    render(p) {
        const f = p.ficha;
        return `${cabecalho('ficha', 'Comece por aqui. Conte a invenção com as suas palavras: desta ficha saem os rascunhos do resumo e das reivindicações, a classificação, os termos das buscas, o relatório, os desenhos e os formulários da universidade. Se você já tem o resumo e as reivindicações escritos, cole-os nas abas deles: a ficha é completada a partir deles.')}
        <div class="card"><div class="botoes"><button type="button" class="btn btn-primary" data-acao="pre-preencher">⚡ Pré-preencher as outras abas com esta ficha</button></div>
        <p class="nota">O pré-preenchimento também acontece sozinho quando você abre as próximas abas. Ele só completa o que está vazio.</p></div>
        <div class="card"><div class="grade-campos">
            ${campo('titulo', 'Título', { largo: true, dica: 'curto, técnico, sem marca' })}
            ${campo('natureza', 'Tipo de pedido', { tipo: 'select', opts: [['', '— escolher (veja a aba Entenda) —'], ['PI', 'Patente de invenção (PI)'], ['MU', 'Modelo de utilidade (MU)']] })}
            ${campo('contexto.inventores', 'Inventores (um por linha)', { tipo: 'textarea', linhas: 3, dica: 'vão para a aba Inventores' })}
            ${campo('area', 'Área técnica', { ph: 'Ex.: máquinas agrícolas, eletrônica embarcada' })}
            ${campo('contexto.instituicao', 'Instituição')}
            ${campo('ficha.campo', 'Para que serve (campo da invenção)', { tipo: 'textarea', largo: true, linhas: 2, ph: 'Ex.: um sistema eletrônico para monitorar a pressão de circuitos pneumáticos' })}
            ${campo('ficha.problema', 'Qual problema técnico resolve?', { tipo: 'textarea', largo: true, linhas: 3 })}
            ${campo('ficha.estadoTecnica', 'O que existe hoje (o que você já conhece)', { tipo: 'textarea', largo: true, linhas: 3, dica: 'produtos, patentes, artigos' })}
            ${campo('ficha.solucao', 'A solução e como funciona', { tipo: 'textarea', largo: true, linhas: 4 })}
        </div></div>
        <div class="card"><div class="card-topo"><h2>🔢 Componentes numerados</h2><div class="botoes"><button type="button" class="btn btn-secondary btn-sm" data-acao="componentes-do-texto" title="Procura 'nome (01)' nos textos já escritos">🪄 Achar nos textos</button><button type="button" class="btn btn-primary btn-sm" data-acao="add-componente">＋ Componente</button></div></div>
        <p class="nota">Os números de referência (01, 02…) aparecem iguais no relatório, nas reivindicações, nos desenhos e no resumo.</p>
        ${f.componentes.length ? `<div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Nº</th><th>Componente</th><th>Função</th><th></th></tr></thead><tbody>${f.componentes.map(c => `<tr><td class="col-num"><input type="text" data-c="ficha.componentes.#${c.id}.num" value="${escAttr(c.num)}" style="width:4rem"></td><td><input type="text" data-c="ficha.componentes.#${c.id}.nome" value="${escAttr(c.nome)}"></td><td><input type="text" data-c="ficha.componentes.#${c.id}.funcao" value="${escAttr(c.funcao)}"></td><td class="col-acao"><button type="button" class="btn-icone" data-acao="remover" data-lista="ficha.componentes" data-id="${c.id}">✕</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="vazio">Nenhum componente ainda.</div>'}</div>
        <div class="card"><div class="grade-campos">
            ${campo('ficha.vantagens', 'Vantagens em relação ao que existe', { tipo: 'textarea', linhas: 3 })}
            ${campo('ficha.aplicacoes', 'Onde pode ser aplicada', { tipo: 'textarea', linhas: 3 })}
            ${campo('ficha.ensaios', 'Ensaios e resultados (se houver)', { tipo: 'textarea', linhas: 3 })}
            ${campo('ficha.concorrentes', 'Produtos ou empresas concorrentes', { tipo: 'textarea', linhas: 3 })}
        </div></div>`;
    }
};

// ------------------------------------------------------------ FONTES (caderno)
PAGINAS.fontes = {
    render(p) {
        return `${cabecalho('fontes', 'Junte aqui o TCC, artigos, relatórios de busca e anotações, como num caderno do NotebookLM. O app resume cada fonte e, em qualquer campo, o botão "📚 Fontes" traz trechos para você inserir.')}
        <div class="card"><div class="botoes"><button type="button" class="btn btn-primary" data-acao="add-fonte-arquivo">⬆ Adicionar arquivo (.docx, .txt, .md)</button><button type="button" class="btn btn-secondary" data-acao="add-fonte-texto">📋 Colar texto</button><button type="button" class="btn btn-secondary" data-acao="abrir-caderno">💬 Perguntar às fontes</button></div>
        <p class="nota">PDF: abra o arquivo, selecione o texto (Ctrl+A, Ctrl+C) e use "Colar texto". As fontes ficam só neste navegador.</p></div>
        ${p.fontes.length ? `<div class="grade-fontes">${p.fontes.map((f, i) => { const g = guiaDaFonte(f); return `<div class="card fonte ${f.ativa ? '' : 'inativa'}"><div class="card-topo"><h3>[${i + 1}] ${esc(f.nome)}</h3><div class="botoes"><label class="campo-inline" title="Usar nas respostas"><input type="checkbox" data-c="fontes.#${f.id}.ativa" ${f.ativa ? 'checked' : ''}> usar</label><button type="button" class="btn-icone" data-acao="remover" data-lista="fontes" data-id="${f.id}">✕</button></div></div>
            <p class="nota">${g.palavras} palavras · ${esc(f.tipo)} · ${dataBR(f.data)}</p>
            ${g.resumo ? `<p><b>Guia da fonte:</b> ${esc(g.resumo)}</p>` : ''}
            ${g.termos.length ? `<div class="chips"><span class="chips-rotulo">termos:</span>${g.termos.map(t => `<button type="button" class="chip" data-acao="perguntar" data-q="${escAttr(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
            ${g.patentes.length ? `<div class="chips"><span class="chips-rotulo">patentes citadas:</span>${g.patentes.map(t => `<button type="button" class="chip" data-acao="add-resultado" data-num="${escAttr(t)}" title="Registrar como resultado da busca">＋ ${esc(t)}</button>`).join('')}</div>` : ''}
            </div>`; }).join('')}</div>` : '<div class="vazio">Nenhuma fonte ainda. Comece pelo seu TCC, relatório ou projeto.</div>'}
        <div class="card cartao-ia"><h2>🤖 Pacote para IA (opcional)</h2><p class="nota">Copie o pedido pronto (com as fontes e a ficha), cole numa IA (ChatGPT, Claude, Gemini…) e cole a resposta de volta. Só preenche o que está vazio. Não cole dados pessoais dos inventores.</p>
        <div class="botoes"><button type="button" class="btn btn-secondary" data-acao="copiar-pacote">📋 Copiar pedido para a IA</button><button type="button" class="btn btn-primary" data-acao="colar-ia">⇩ Colar resposta da IA</button></div></div>`;
    }
};

// ------------------------------------------------------------ CLASSIFICAÇÃO
PAGINAS.classificacao = {
    render(p) {
        const sug = sugerirClasses(p, 12);
        return `${cabecalho('classificacao', 'A classificação (IPC/CPC) agrupa as patentes por assunto e deixa a busca muito mais precisa. As classes abaixo foram <b>marcadas por aproximação</b>, comparando as palavras da sua ficha com o catálogo. Confira cada uma antes de usar.')}
        <div class="card"><h2>🧭 Sugestões por aproximação</h2>
        ${sug.length ? `<div class="lista-classes">${sug.map(s => `<label class="classe ${p.classes.marcadas.includes(s.codigo) ? 'marcada' : ''}"><input type="checkbox" data-acao="marcar-classe" data-cod="${escAttr(s.codigo)}" ${p.classes.marcadas.includes(s.codigo) ? 'checked' : ''}>
            <span class="classe-cod">${esc(s.codigo)}</span><span class="classe-tit">${esc(s.titulo)}<small>semelhança pelas palavras: ${s.motivos.map(esc).join(', ')}</small></span>
            <span class="classe-nota" title="Semelhança relativa"><i style="width:${s.nota}%"></i><b>${s.nota}%</b></span>
            <a href="${escAttr(linkIpcpub(s.codigo))}" target="_blank" rel="noopener" title="Conferir a classe">conferir ↗</a></label>`).join('')}</div>
            <div class="botoes"><button type="button" class="btn btn-secondary btn-sm" data-acao="marcar-top">✔ Marcar as 3 mais próximas</button></div>`
            : '<div class="vazio">Preencha a ficha da invenção (título, campo, solução e componentes) para receber sugestões.</div>'}</div>
        <div class="card"><h2>Classes marcadas</h2>${classesBusca(p).length ? `<div class="chips">${classesBusca(p).map(c => `<span class="chip chip-fixo">${esc(c)} <small>${esc(tituloClasse(c))}</small></span>`).join('')}</div>` : '<p class="nota">Nenhuma ainda.</p>'}
        <div class="grade-campos">${campo('classes.manuais', 'Outras classes (achadas nas buscas, ex.: nas patentes parecidas)', { largo: true, ph: 'Ex.: A01C 7/127; B65G 65/48' })}</div>
        <p class="nota">Dica de ouro: abra as patentes mais parecidas que você encontrar e copie as classes delas. Para conferir: ${LINK('https://ipcpub.wipo.int/', 'IPCPUB (WIPO)')} · ${LINK('https://worldwide.espacenet.com/patent/cpc-browser', 'navegador CPC do Espacenet')}.</p></div>`;
    }
};

// ------------------------------------------------------------ BUSCAS
PAGINAS.buscas = {
    render(p) {
        const buscas = gerarBuscas(p);
        const porBase = {};
        buscas.forEach(b => (porBase[b.base] = porBase[b.base] || []).push(b));
        const fam = FAMILIAS.map(([k, nome, dica]) => {
            const f = familia(p, k);
            return `<tr><td><b>${nome}</b><br><small>${dica}</small></td><td><input type="text" data-c="busca.termos.${k}" value="${escAttr(p.busca.termos[k])}" placeholder="termos em português separados por ;"></td><td class="pequeno">${f.en.map(esc).join('; ') || '<i>sem tradução</i>'}<br>${f.es.map(esc).join('; ')}</td></tr>`;
        }).join('');
        const semTr = FAMILIAS.flatMap(([k]) => listaTermos(p.busca.termos[k])).filter(t => !traduzir(p, t).en.length);
        const reg = p.busca.registroColado;
        return `${cabecalho('buscas', 'Antes de escrever o relatório, veja se já existe algo igual. Primeiro gere o prompt e deixe uma IA com navegador (ex.: Claude com o Chrome) fazer a busca; depois cole o retorno aqui. Só faça à mão o que faltar.')}
        <div class="card"><div class="card-topo"><h2>1. Termos da busca</h2><div class="botoes"><button type="button" class="btn btn-secondary btn-sm" data-acao="preencher-termos">🪄 Preencher pela ficha</button><button type="button" class="btn btn-secondary btn-sm" data-acao="importar-md">⇪ Importar prompt .md</button></div></div>
        <p class="nota">Já vêm do resumo e das reivindicações. Confira e acrescente sinônimos (separados por ;). Classes marcadas: ${classesBusca(p).map(esc).join(', ') || '<a href="#/classificacao">marcar</a>'}.</p>
        <div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Família</th><th>Português (sinônimos com ;)</th><th>Inglês / espanhol (automático)</th></tr></thead><tbody>${fam}</tbody></table></div>
        ${semTr.length ? `<details class="nota"><summary>Traduzir ${semTr.length} termo(s) sem tradução</summary><div class="grade-campos">${semTr.slice(0, 12).map(t => `<label>${esc(t)}<input type="text" data-acao-traducao="${escAttr(semAcento(t))}" value="${escAttr(p.busca.traducoes[semAcento(t)] || '')}" placeholder="inglês; sinônimo | espanhol"></label>`).join('')}</div></details>` : ''}
        <div class="grade-campos">${campo('busca.depositantes', 'Depositantes e inventores para a estratégia E (empresas, universidades, pessoas)', { largo: true, ph: 'Ex.: John Deere; Stara; Universidade Federal de Pelotas' })}</div></div>

        <div class="card cartao-ia"><h2>2. 🤖 Gere o prompt e peça a busca para a IA</h2><p class="nota">O prompt já sai preenchido com a sua invenção, as classes, os termos em PT/EN/ES, as características C1, C2… das reivindicações e as estratégias A–G para as 5 bases. Ele pede o retorno <b>em JSON</b> num formato fixo (gasta menos créditos e é importado sem erro) e diz para a IA <b>parar e pedir que você resolva CAPTCHA, verificação ou login manualmente</b>.</p>
        <div class="botoes"><button type="button" class="btn btn-primary" data-acao="copiar-md">📋 Copiar prompt</button><button type="button" class="btn btn-secondary" data-acao="baixar-md">⬇ Baixar .md</button></div></div>

        <div class="card"><h2>3. 📥 Importe o retorno (JSON)</h2><p class="nota">Cole o JSON que a IA devolveu ou abra o arquivo <code>.json</code>. O app lê as contagens por base e sequência, os documentos (número, título, categoria, relevância, link e o quadro S/P/N), a conclusão, os diferenciais e as lacunas, e leva tudo para o <b>Formulário de Busca de Anterioridade</b> e para o relatório da busca. Retornos antigos em texto (PDF copiado, tabelas, "Sensor de pressão / 1843") também são aceitos.</p>
        <textarea id="retorno-busca" rows="7" placeholder='Cole aqui o JSON: { "formato": "apoio-escrita-patentes-busca", "registro": [...], "documentos": [...] }'></textarea>
        <div class="botoes"><button type="button" class="btn btn-primary" data-acao="colar-retorno">⇩ Ler o retorno colado</button><button type="button" class="btn btn-secondary" data-acao="arquivo-retorno">📂 Abrir arquivo .json</button>${p.busca.retorno ? `<span class="nota">Retorno já colado: ${palavras(p.busca.retorno)} palavras.</span><button type="button" class="btn-link" data-acao="limpar-retorno">apagar retorno e contagens</button>` : ''}</div>
        ${reg.length ? `<h3>Contagens lidas (vão para o formulário)</h3><div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Base</th><th>Palavra-chave / sequência</th><th>Nº de documentos</th><th></th></tr></thead><tbody>${reg.map(r => `<tr><td><select data-c="busca.registroColado.#${r.id}.base">${Object.keys(BASES).map(k => `<option value="${k}" ${r.base === k ? 'selected' : ''}>${BASES[k].nome}</option>`).join('')}</select></td><td><input type="text" data-c="busca.registroColado.#${r.id}.consulta" value="${escAttr(r.consulta)}"></td><td class="col-num"><input type="number" data-c="busca.registroColado.#${r.id}.n" value="${escAttr(r.n)}" style="width:9rem"></td><td class="col-acao"><button type="button" class="btn-icone" data-acao="remover" data-lista="busca.registroColado" data-id="${r.id}">✕</button></td></tr>`).join('')}</tbody></table></div>` : ''}
        <button type="button" class="btn btn-secondary btn-sm" data-acao="add-registro">＋ Contagem à mão</button>
        ${p.busca.notaRetorno ? `<div class="grade-campos">${campo('busca.notaRetorno', 'Conclusão lida do retorno (vira a nota explicativa do formulário)', { tipo: 'textarea', largo: true, linhas: 3 })}</div>` : ''}</div>

        <div class="card"><div class="card-topo"><h2>4. Documentos encontrados</h2><button type="button" class="btn btn-primary btn-sm" data-acao="add-resultado">＋ Documento</button></div>
        <p class="nota">Vêm do retorno colado. Categoria: <b>X</b> = sozinho já tira a novidade; <b>Y</b> = combinado com outro; <b>A</b> = estado geral da técnica. Eles escrevem os fundamentos do relatório.</p>
        ${p.busca.resultados.length ? `<div class="tabela-rolagem"><table class="tabela tabela-res"><thead><tr><th>Nº do documento</th><th>Título</th><th>Base</th><th>Tipo</th><th>Cat.</th><th>Rel.</th><th>Lido</th><th>Publicação</th><th>Diferença para a sua invenção</th><th></th></tr></thead><tbody>${p.busca.resultados.map(r => { const c = `busca.resultados.#${r.id}.`; return `<tr><td><input type="text" data-c="${c}num" value="${escAttr(r.num)}">${r.num ? `<a class="link-doc" href="${escAttr(r.link || 'https://patents.google.com/patent/' + r.num.replace(/[\s.\-\/]/g, '') + '/pt')}" target="_blank" rel="noopener">abrir ↗</a>` : ''}</td><td><input type="text" data-c="${c}titulo" value="${escAttr(r.titulo)}"></td>
            <td><input type="text" data-c="${c}base" value="${escAttr(r.base)}" style="width:7rem"></td><td><select data-c="${c}tipoDoc">${TIPOS_DOC.map(t => `<option ${r.tipoDoc === t ? 'selected' : ''}>${t}</option>`).join('')}</select></td>
            <td><select data-c="${c}categoria">${Object.keys(CATEGORIAS).map(k => `<option ${r.categoria === k ? 'selected' : ''}>${k}</option>`).join('')}</select></td>
            <td><select data-c="${c}relevancia">${[1, 2, 3, 4, 5].map(k => `<option ${Number(r.relevancia) === k ? 'selected' : ''}>${k}</option>`).join('')}</select></td>
            <td><select data-c="${c}lido">${['título', 'resumo', 'reivindicações', 'texto completo'].map(k => `<option ${r.lido === k ? 'selected' : ''}>${k}</option>`).join('')}</select></td>
            <td><input type="date" data-c="${c}publicacao" value="${escAttr(r.publicacao)}"></td>
            <td><input type="text" data-c="${c}nota" value="${escAttr(r.nota)}"></td><td class="col-acao"><button type="button" class="btn-icone" data-acao="remover" data-lista="busca.resultados" data-id="${r.id}">✕</button></td></tr>`; }).join('')}</tbody></table></div>` : '<div class="vazio">Nenhum documento ainda: cole o retorno da busca acima.</div>'}</div>
        ${PAGINAS.buscas.quadro(p)}

        <details class="card manual"><summary><b>5. 🖐️ Buscas à mão (só o que faltar)</b> <small>${buscas.filter(b => (p.busca.executadas[b.id] || {}).feita).length}/${buscas.length} feitas</small></summary>
        <div class="card aviso-captcha">🛡️ <b>CAPTCHA, verificação de segurança ou login?</b> Resolva você mesmo na página da base e depois continue.</div>
        <p class="nota">Use quando o retorno colado não cobrir alguma base. Marque ✔ e anote o número de resultados: vai para o formulário junto com as contagens coladas.</p>
        ${buscas.length ? Object.entries(porBase).map(([base, lista]) => `<details class="base-busca"><summary><span class="bola" style="background:${BASES[base].cor}"></span><b>${BASES[base].nome}</b> <small>${lista.filter(b => (p.busca.executadas[b.id] || {}).feita).length}/${lista.length} feitas${reg.some(r => r.base === base) ? ' · já tem contagem colada' : ''}</small></summary>
            ${lista.map(b => { const e = p.busca.executadas[b.id] || {}; return `<div class="busca ${e.feita ? 'feita' : ''}"><div class="busca-topo"><span class="selo-est" title="${escAttr(b.rotulo)}">${b.est}</span><small>${esc(b.rotulo)}</small></div>
                <pre class="consulta">${esc(b.consulta)}</pre>${b.dica ? `<p class="nota">${esc(b.dica)}</p>` : ''}
                <div class="botoes"><button type="button" class="btn btn-secondary btn-sm" data-acao="copiar" data-texto="${escAttr(b.consulta)}">📋 Copiar</button><a class="btn btn-primary btn-sm" href="${escAttr(b.url)}" target="_blank" rel="noopener">Abrir ↗</a>
                <label class="campo-inline"><input type="checkbox" data-acao="busca-feita" data-id="${escAttr(b.id)}" ${e.feita ? 'checked' : ''}> feita</label>
                <label class="campo-inline">resultados <input type="number" min="0" data-acao="busca-n" data-campo="n" data-id="${escAttr(b.id)}" value="${escAttr(e.n ?? '')}" style="width:6rem"></label>
                <label class="campo-inline">triados <input type="number" min="0" data-acao="busca-n" data-campo="triados" data-id="${escAttr(b.id)}" value="${escAttr(e.triados ?? '')}" style="width:5rem"></label></div></div>`; }).join('')}</details>`).join('')
            : '<div class="vazio">Preencha ao menos duas famílias de termos para gerar as buscas.</div>'}</details>
        <div class="card"><div class="botoes"><button type="button" class="btn btn-primary" data-acao="baixar-doc" data-doc="relbusca">⬇ Relatório da busca (.docx)</button><button type="button" class="btn btn-secondary" data-acao="baixar-doc" data-doc="formbusca">⬇ Formulário de busca (.docx)</button></div></div>`;
    },
    quadro(p) {
        const car = caracteristicasComparacao(p);
        const rs = p.busca.resultados.filter(r => r.num).sort((a, b) => b.relevancia - a.relevancia).slice(0, 10);
        if (!rs.length || !car.length) return '';
        return `<div class="card"><h2>Quadro comparativo</h2><p class="nota">As características vêm das suas reivindicações. Para cada documento, diga se ele divulga cada característica: S (sim), P (parcial), N (não), ? (não sei). As que ficarem N em todos são os seus possíveis diferenciais.</p>
        <div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Documento</th>${car.map((c, i) => `<th title="${escAttr(c)}">C${i + 1}</th>`).join('')}</tr></thead><tbody>${rs.map(r => `<tr><td>${esc(r.num)}</td>${car.map((c, i) => `<td class="col-centro"><select data-c="busca.resultados.#${r.id}.carac.C${i + 1}">${['?', 'S', 'P', 'N'].map(k => `<option ${(r.carac['C' + (i + 1)] || '?') === k ? 'selected' : ''}>${k}</option>`).join('')}</select></td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <ol class="nota">${car.map(c => `<li>${esc(c)}</li>`).join('')}</ol></div>`;
    }
};

// ------------------------------------------------------------ RELATÓRIO
PAGINAS.relatorio = {
    render(p) {
        const sec = [['campo', 'Campo da invenção', 'Para que serve, em 1 parágrafo.'], ['fundamentos', 'Fundamentos da invenção (estado da técnica)', 'O que já existe, citando as patentes da busca e em que se diferenciam.'],
            ['problemaSolucao', 'Problema e solução (motivação)', 'Qual problema motivou e como a invenção resolve.'], ['desenhos', 'Breve descrição dos desenhos', 'Uma frase por figura: "A FIGURA 1 ilustra…".'],
            ['descricao', 'Descrição da invenção', 'Como é feita e como funciona, citando os números de referência (01), (02)…'], ['exemplos', 'Exemplos de concretizações', 'Formas de uso e de execução; resultados de ensaio.']];
        return `${cabecalho('relatorio', 'O relatório descritivo explica a invenção de forma clara e completa, para que um técnico do assunto consiga reproduzi-la. Os parágrafos são numerados automaticamente no documento.')}
        <div class="card"><div class="botoes"><button type="button" class="btn btn-primary" data-acao="rascunho-tudo" data-parte="relatorio">✨ Rascunho de todas as seções vazias</button><button type="button" class="btn btn-secondary" data-acao="baixar-doc" data-doc="relatorio">⬇ Baixar .docx</button></div></div>
        <div class="card"><h3 class="titulo-doc">${esc(tituloPedido(p))}</h3><div class="grade-campos">${sec.map(([k, t, d]) => campo('relatorio.' + k, t, { tipo: 'textarea', largo: true, linhas: k === 'descricao' ? 9 : 5, dica: d, rasc: k })).join('')}</div>${alertas('relatorio')}</div>`;
    }
};

// ------------------------------------------------------------ REIVINDICAÇÕES
PAGINAS.reivindicacoes = {
    render(p) {
        const rs = p.reivindicacoes;
        const partes = partesDoTitulo(p);
        const cartao = (r, i) => {
            const c = `reivindicacoes.#${r.id}.`;
            return `<div class="card reivindicacao ${r.dep ? 'dependente' : 'independente'}"><div class="card-topo"><h3>${i + 1}. <small>${r.dep ? 'dependente da ' + r.dep : 'independente'}</small></h3><div class="botoes">
                <button type="button" class="btn btn-secondary btn-sm" data-acao="add-reiv-dep" data-n="${i + 1}" title="Nova reivindicação que detalha esta">＋ Dependente desta</button>
                <button type="button" class="btn-icone" data-acao="subir-reiv" data-id="${r.id}" title="Subir" ${i ? '' : 'disabled'}>↑</button><button type="button" class="btn-icone" data-acao="remover" data-lista="reivindicacoes" data-id="${r.id}">✕</button></div></div>
            <div class="reiv-campos">
                <label class="reiv-pre">① Título ou parte do título
                    <input type="text" list="dl-partes-titulo" data-c="${c}preambulo" value="${escAttr(r.preambulo)}" placeholder="${escAttr(tituloPedido(p))}">
                    <small>vazio = título completo</small></label>
                <label class="reiv-dep">② De acordo com
                    <select data-c="${c}dep"><option value="">— (independente)</option>${rs.slice(0, i).map((x, j) => `<option value="${j + 1}" ${Number(r.dep) === j + 1 ? 'selected' : ''}>a reivindicação ${j + 1}</option>`).join('')}</select></label>
                <label class="reiv-exp">③ Palavra-chave
                    <select data-c="${c}expressao"><option value="">${esc(expressaoReiv(p, Object.assign({}, r, { expressao: '' })))} (automático)</option>${EXPRESSOES.map(x => `<option ${r.expressao === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
                <label class="reiv-txt">④ Característica (o que vem depois da palavra-chave)
                    <textarea data-c="${c}texto" rows="3" placeholder="ex.: compreender um sensor de pressão (05) e um módulo de comunicação sem fio (06)">${esc(r.texto)}</textarea></label>
            </div>
            <p class="previa-reiv"><span class="pr-pre">${esc(preambuloReiv(p, r))}</span>${r.dep ? `<span class="pr-dep">${esc(trechoDependencia(r))}</span>` : ''} <span class="pr-exp">${esc(expressaoReiv(p, r))}</span> <span class="pr-txt">${esc(String(r.texto || '').trim().replace(/\.+$/, '') || '…')}</span>.</p></div>`;
        };
        return `${cabecalho('reivindicacoes', 'As reivindicações definem o que fica protegido. Cada uma é uma única frase montada em 4 partes: ① o título (ou parte dele), ② "de acordo com a reivindicação N" (só nas dependentes), ③ a palavra-chave "caracterizado por" e ④ a característica. O rascunho vem da ficha.')}
        <datalist id="dl-partes-titulo">${partes.map(x => `<option value="${escAttr(x)}"></option>`).join('')}</datalist>
        <div class="card"><div class="botoes">${!rs.length && p.ficha.componentes.length ? '<button type="button" class="btn btn-secondary" data-acao="rascunho-reivindicacoes">✨ Montar a partir dos componentes</button>' : ''}<button type="button" class="btn btn-primary" data-acao="add-reiv-ind">＋ Independente</button><button type="button" class="btn btn-secondary" data-acao="add-reiv-dep" ${rs.length ? '' : 'disabled'}>＋ Dependente</button><button type="button" class="btn btn-secondary" data-acao="pre-preencher">⚡ Pré-preencher o pedido</button><button type="button" class="btn btn-secondary" data-acao="baixar-doc" data-doc="reivindicacoes">⬇ Baixar .docx</button></div>
        <p class="nota">A <b>independente</b> diz o essencial (o que não pode faltar). Cada <b>dependente</b> acrescenta um detalhe e repete o título (ou a mesma parte dele) seguido de "de acordo com a reivindicação N". A palavra-chave do INPI é <b>"caracterizado por"</b> (ou "caracterizada por", conforme o título).</p>
        <p class="nota">${p.natureza === 'MU' ? 'Modelo de utilidade: uma só reivindicação independente, descrevendo a forma ou disposição.' : 'Patente de invenção: pode ter mais de uma independente (ex.: produto e processo).'} Evite: etc., aproximadamente, preferencialmente, "conforme a figura".</p></div>
        ${rs.map(cartao).join('') || '<div class="vazio">Nenhuma reivindicação. Comece pela independente.</div>'}
        <div class="card">${alertas('reivindicacoes')}</div>`;
    }
};

// ------------------------------------------------------------ DESENHOS
PAGINAS.desenhos = {
    render(p) {
        return `${cabecalho('desenhos', 'Figuras em preto e branco, sem textos além dos indispensáveis, com os números de referência dos componentes. Obrigatórias para modelo de utilidade.')}
        <div class="card"><div class="botoes"><button type="button" class="btn btn-primary" data-acao="add-desenho">＋ Figura</button><button type="button" class="btn btn-secondary" data-acao="baixar-doc" data-doc="desenhos">⬇ Baixar .docx</button></div></div>
        <div class="grade-desenhos">${p.desenhos.map((d, i) => `<div class="card desenho"><div class="card-topo"><h3>FIGURA ${i + 1}</h3><button type="button" class="btn-icone" data-acao="remover" data-lista="desenhos" data-id="${d.id}">✕</button></div>
            ${d.img ? `<img data-img="${escAttr(d.img)}" alt="Figura ${i + 1}">` : '<div class="foto-vazia">sem imagem</div>'}
            <div class="botoes"><button type="button" class="btn btn-secondary btn-sm" data-acao="imagem-desenho" data-id="${d.id}">🖼️ ${d.img ? 'Trocar' : 'Escolher'} imagem</button></div>
            <label>Legenda (vai para a breve descrição)<input type="text" data-c="desenhos.#${d.id}.legenda" value="${escAttr(d.legenda)}" placeholder="ilustra o diagrama de blocos…"></label></div>`).join('') || '<div class="vazio">Nenhuma figura.</div>'}</div>
        <div class="card"><label class="campo-inline">Figura mais representativa (vai no resumo) <select data-c="figuraResumo">${p.desenhos.map((d, i) => `<option value="${i + 1}" ${String(p.figuraResumo) === String(i + 1) ? 'selected' : ''}>FIGURA ${i + 1}</option>`).join('')}</select></label>${alertas('desenhos')}</div>`;
    }
};

// ------------------------------------------------------------ RESUMO
PAGINAS.resumo = {
    render(p) {
        const n = palavras(p.resumo);
        return `${cabecalho('resumo', 'O resumo diz, em 50 a 200 palavras, o que é a invenção, como é composta (com os números de referência) e onde é aplicada. Ele já vem como rascunho da ficha "Sua invenção"; revise. Junto com as reivindicações, ele completa o que faltar no resto do pedido.')}
        <div class="card"><div class="grade-campos">${campo('titulo', 'Título', { largo: true, dica: 'curto, técnico, sem marca — vai no topo de todos os documentos', ph: 'Ex.: Sistema de monitoramento de pressão para circuitos pneumáticos' })}</div>
        <details class="nota" ${p.resumo ? '' : 'open'}><summary>Modelo para começar</summary><p>O presente ${nomeNatureza(p)} trata de <b>[o que é]</b> (FIGURA 1) com <b>[componente principal (01)]</b> que <b>[o que faz]</b>. <b>[Como funciona, citando (02), (03)…]</b>. Além disso, <b>[vantagem]</b>. Esse dispositivo será aplicado em <b>[aplicações]</b>.</p>
        <button type="button" class="btn btn-secondary btn-sm" data-acao="modelo-resumo">Usar este modelo</button></details>
        <h3 class="titulo-doc">${esc(tituloPedido(p))}</h3>
        <div class="grade-campos">${campo('resumo', 'Resumo', { tipo: 'textarea', largo: true, linhas: 10, rasc: 'resumo', contar: true })}</div>
        <div class="medidor ${n >= 50 && n <= 200 ? 'ok' : 'ruim'}"><i style="width:${Math.min(100, n / 2)}%"></i><span>${n} / 200 palavras</span></div>${alertas('resumo')}
        <div class="botoes"><button type="button" class="btn btn-primary" data-acao="pre-preencher">⚡ Pré-preencher o pedido com o resumo e as reivindicações</button><button type="button" class="btn btn-secondary" data-acao="baixar-doc" data-doc="resumo">⬇ Baixar .docx</button></div></div>`;
    }
};

// ------------------------------------------------------------ INVENTORES
PAGINAS.inventores = {
    render(p) {
        const u = p.universidade;
        const soma = u.inventores.concat(u.colaboradores).reduce((s, x) => s + (Number(String(x.percentual).replace(',', '.')) || 0), 0);
        const ficha = (i, lista, k) => { const c = `universidade.${lista}.#${i.id}.`; return `<div class="card inventor"><div class="card-topo"><h3>${lista === 'inventores' ? 'Inventor(a)' : 'Colaborador(a)'} nº ${String(k + 1).padStart(2, '0')}${i.notificante ? ' <span class="selo-guia">NOTIFICANTE</span>' : ''}</h3><button type="button" class="btn-icone" data-acao="remover" data-lista="universidade.${lista}" data-id="${i.id}">✕</button></div>
            <div class="grade-campos">${campo(c + 'nome', 'Nome completo')}${campo(c + 'cpf', 'CPF')}${campo(c + 'email', 'E-mail', { tipo: 'email' })}${campo(c + 'celular', 'Celular')}
            ${lista === 'inventores' ? `${campo(c + 'endereco', 'Endereço residencial', { largo: true })}${campo(c + 'cidade', 'Cidade')}${campo(c + 'uf', 'UF')}${campo(c + 'cep', 'CEP')}${campo(c + 'nacionalidade', 'Nacionalidade')}
            ${campo(c + 'qualificacao', 'Qualificação à época', { tipo: 'select', opts: QUALIFICACOES })}${campo(c + 'vinculo', `Vínculo com a ${u.sigla}?`, { tipo: 'select', opts: ['Sim', 'Não'] })}
            ${i.vinculo === 'Não' ? campo(c + 'instituicao', 'Instituição de origem') : ''}` : ''}
            ${campo(c + 'percentual', '% na participação (1/3)', { tipo: 'number' })}</div>
            ${lista === 'inventores' ? `<label class="campo-inline"><input type="checkbox" data-acao="notificante" data-id="${i.id}" ${i.notificante ? 'checked' : ''}> É o(a) notificante (responsável pelas informações; servidor da universidade)</label>` : ''}</div>`; };
        return `${cabecalho('inventores', 'Pela universidade, o depositante (titular) é a instituição e os inventores são as pessoas que contribuíram intelectualmente (ato inventivo). Quem só coletou dados ou fez experimentos não é inventor, mas pode dividir a participação nos resultados.')}
        <div class="card aviso-privado">🔒 CPF, endereço e telefone ficam <b>só neste navegador</b> e no ZIP que você baixar. Não publique o ZIP nem cole esses dados numa IA.</div>
        ${u.inventores.map((i, k) => ficha(i, 'inventores', k)).join('')}
        <div class="botoes"><button type="button" class="btn btn-primary" data-acao="add-inventor">＋ Inventor(a)</button><button type="button" class="btn btn-secondary" data-acao="add-colaborador">＋ Colaborador(a) (não inventor)</button></div>
        ${u.colaboradores.map((i, k) => ficha(i, 'colaboradores', k)).join('')}
        <div class="card"><div class="medidor ${Math.abs(soma - 100) < 0.01 ? 'ok' : 'ruim'}"><i style="width:${Math.min(100, soma)}%"></i><span>Participação: ${soma}% de 100%</span></div>
        <button type="button" class="btn btn-secondary btn-sm" data-acao="dividir-igual">⚖ Dividir igualmente</button>${alertas('inventores')}</div>`;
    }
};

// ------------------------------------------------------------ UNIVERSIDADE
PAGINAS.universidade = {
    render(p) {
        const u = p.universidade, f = p.ficha;
        const rad = (c, opts) => `<div class="radios">${opts.map(o => `<label class="campo-inline"><input type="radio" name="${c}" data-c="${c}" value="${escAttr(o)}" ${lerCaminho(p, c) === o ? 'checked' : ''}> ${esc(o)}</label>`).join('')}</div>`;
        return `${cabecalho('universidade', 'Pela universidade, o pedido passa pelo escritório de propriedade intelectual (NIT). O orientador abre um processo sigiloso no SEI com o memorando e anexa os formulários e os 4 documentos. Os campos abaixo já vêm pré-preenchidos com o resumo, as reivindicações, a ficha, o relatório e o retorno da busca: só confira.')}
        <div class="card"><h2>🏛️ Instituição (depositante)</h2><div class="grade-campos">${campo('universidade.nome', 'Nome')}${campo('universidade.sigla', 'Sigla')}${campo('universidade.cnpj', 'CNPJ')}${campo('universidade.unidade', 'Unidade (centro/faculdade)')}${campo('universidade.siglaUnidade', 'Sigla da unidade')}${campo('universidade.email', 'E-mail do escritório de PI')}${campo('universidade.endereco', 'Endereço', { largo: true })}</div></div>
        <div class="card"><div class="card-topo"><h2>5. Memorando (abertura de processo sigiloso)</h2><button type="button" class="btn btn-secondary btn-sm" data-acao="baixar-doc" data-doc="memorando">⬇ .docx</button></div><div class="grade-campos">${campo('universidade.memorando.numero', 'Nº do memorando')}${campo('universidade.memorando.ano', 'Ano')}${campo('universidade.memorando.data', 'Data', { tipo: 'date' })}${campo('universidade.destinatario', 'Destinatário', { largo: true })}</div><p class="nota">Assinado no SEI pelo notificante: ${esc((u.inventores.find(i => i.notificante) || {}).nome || '— defina em Inventores')}.</p></div>
        <div class="card"><div class="card-topo"><h2>6. Formulário de Informação Tecnológica</h2><button type="button" class="btn btn-secondary btn-sm" data-acao="baixar-doc" data-doc="infotec">⬇ .docx</button></div>
        <div class="grade-campos">${campo('universidade.areaPredominante', '1.1.1 Área predominante', { tipo: 'select', opts: AREAS_PREDOMINANTES })}${campo('universidade.consiste', '1.2 Em que consiste', { tipo: 'select', opts: CONSISTE })}</div>
        <label>1.1.2 Áreas abrangidas</label><div class="chips">${AREAS_ABRANGIDAS.map(a => `<label class="chip ${u.areasAbrangidas.includes(a) ? 'chip-fixo' : ''}"><input type="checkbox" data-acao="area" data-v="${escAttr(a)}" ${u.areasAbrangidas.includes(a) ? 'checked' : ''}> ${esc(a)}</label>`).join('')}</div>
        <p class="nota">1.3 Divulgações: vêm da etapa "Entenda" (${p.contexto.divulgacoes.length ? p.contexto.divulgacoes.length + ' registrada(s)' : 'nenhuma'}). 1.5 Título e 1.6 palavras-chave vêm da ficha e dos termos da busca (${palavrasChave(p).length} palavras).</p>
        <div class="grade-campos"><label>1.4.1 Patrimônio genético${rad('universidade.patrimonioGenetico', ['Nenhum', 'Material biológico', 'Conhecimento tradicional'])}</label><label>1.4.2 Fauna/flora brasileira${rad('universidade.faunaFlora', ['Não', 'Sim'])}</label><label>1.4.3 Conhecimento tradicional${rad('universidade.conhecimentoTradicional', ['Não', 'Sim'])}</label>
        ${campo('universidade.contexto', '1.8 a. Contexto tecnológico do problema', { tipo: 'textarea', largo: true, linhas: 3, ph: f.problema })}
        ${campo('universidade.comoHoje', '1.8 b. Como o problema é resolvido hoje', { tipo: 'textarea', largo: true, linhas: 3, ph: f.estadoTecnica })}
        ${campo('universidade.resultado', '1.8 c. Resultado que a tecnologia oferece', { tipo: 'textarea', largo: true, linhas: 3, ph: f.vantagens })}
        ${campo('universidade.aplicacoesIndustriais', '1.8 d. Aplicações industriais', { tipo: 'textarea', largo: true, linhas: 2, ph: f.aplicacoes })}
        ${campo('universidade.outrasAplicacoes', '1.8 e. Outras aplicações', { tipo: 'textarea', largo: true, linhas: 2 })}
        <label>2.1 Parceria com outra instituição?${rad('universidade.parceria', ['Não', 'Agência de fomento', 'Outras universidades', 'Instituições ou empresas'])}</label>${u.parceria !== 'Não' ? campo('universidade.parceriaDetalhe', 'Quais? (enviar termo de outorga/convênio)') : ''}
        <label>2.2 Material de terceiros?${rad('universidade.materialTerceiros', ['Não', 'Sim, com termo', 'Sim, sem termo'])}</label>
        <label>2.3 Empresas já interessadas?${rad('universidade.empresasInteressadas', ['Não', 'Sim'])}</label>${u.empresasInteressadas === 'Sim' ? campo('universidade.empresasInteressadasQuais', 'Quais?') : ''}
        ${campo('universidade.empresasMercado', '2.4 Ao menos 5 empresas do mercado', { tipo: 'textarea', largo: true, linhas: 2, ph: f.concorrentes })}
        ${campo('universidade.empresasOferta', '2.5 Ao menos 3 empresas para ofertar (com contatos)', { tipo: 'textarea', largo: true, linhas: 2 })}</div>
        <p class="nota">Campos em branco usam o texto da ficha (mostrado em cinza).</p></div>
        <div class="card"><div class="card-topo"><h2>7. Formulário de Busca de Anterioridade</h2><button type="button" class="btn btn-secondary btn-sm" data-acao="baixar-doc" data-doc="formbusca">⬇ .docx</button></div>
        <div class="grade-campos">${campo('universidade.cadastroProjeto', 'Nº de cadastro do projeto (Cobalto ou PPG)')}${campo('universidade.tipoProjeto', 'Tipo', { tipo: 'select', opts: ['TCC', 'Pesquisa', 'Dissertação', 'Tese', 'Extensão'] })}
        ${campo('universidade.tituloProjeto', 'Título do projeto (pesquisa/dissertação/tese)', { largo: true })}${campo('universidade.objetoProjeto', 'Objeto do projeto', { tipo: 'textarea', largo: true, linhas: 2 })}
        <label>Foram encontradas anterioridades?${rad('universidade.buscaResultado', ['', 'Não', 'Sim'].slice(1))}<small>Em branco: "Sim" se algum documento tiver categoria X ou Y.</small></label>
        ${campo('universidade.notaBusca', 'Nota explicativa do resultado', { tipo: 'textarea', largo: true, linhas: 3, ph: textoEstadoTecnica(p) })}</div>
        <p class="nota">As classificações, as palavras-chave, as contagens por base e os documentos relevantes vêm da etapa de buscas.</p></div>`;
    }
};

// ------------------------------------------------------------ REVISÃO
PAGINAS.revisao = {
    render(p) {
        const v = verificar(p);
        const erros = v.filter(x => x.nivel === 'erro'), avisos = v.filter(x => x.nivel === 'aviso');
        return `${cabecalho('revisao', 'O "chefão final" antes do depósito: o app confere as regras do INPI e a coerência entre os documentos. Zere os erros e marque o checklist.')}
        <div class="card"><h2>${erros.length ? `⛔ ${erros.length} erro(s)` : '🎉 Nenhum erro'} · ⚠️ ${avisos.length} aviso(s)</h2>
        ${v.length ? `<ul class="alertas">${v.map(x => `<li class="${x.nivel}"><a href="#/${x.onde}">${x.nivel === 'erro' ? '⛔' : '⚠️'} ${esc(x.msg)}</a></li>`).join('')}</ul>` : '<p>Tudo certo pelas regras que o app confere.</p>'}</div>
        <div class="card"><h2>Checklist</h2><ul class="checklist">${CHECKLIST.map(c => `<li><label><input type="checkbox" data-c="revisao.${c.id}" ${p.revisao[c.id] ? 'checked' : ''}> ${esc(c.t)}</label></li>`).join('')}</ul></div>`;
    }
};

// ------------------------------------------------------------ DEPÓSITO
PAGINAS.deposito = {
    render(p) {
        const u = p.universidade;
        return `${cabecalho('deposito', 'Pela universidade, quem deposita é o escritório de propriedade intelectual. Você entrega os documentos; o NIT faz o depósito no INPI e paga a GRU em nome da instituição.')}
        <div class="card"><h2>🏛️ Caminho pela ${esc(u.sigla)}</h2><ol class="passos">
            <li>Baixe os 8 documentos (etapa 🏆) e confira com os inventores.</li>
            <li>O(a) orientador(a) (servidor) abre um <b>processo sigiloso no SEI</b> com o <b>memorando</b> (documento 5).</li>
            <li>Anexe no processo: Formulário de Informação Tecnológica (6), Formulário de Busca de Anterioridade (7), Relatório Descritivo, Reivindicações, Desenhos e Resumo (1–4), e cópias das divulgações, se houver.</li>
            <li>O escritório de PI (${esc(u.email)}) revisa e pode pedir ajustes.</li>
            <li>O escritório deposita no INPI pelo ${LINK('https://servicos.patentes.inpi.gov.br/', 'Módulo de Serviços de Patentes')} (login gov.br ou e-INPI), anexando os documentos em DOCX ou PDF, e paga a GRU (código 200 para o depósito).</li>
            <li>O INPI devolve o <b>protocolo</b> e o <b>número do pedido</b>. Registre abaixo.</li></ol>
        <div class="grade-campos">${campo('universidade.processoSEI', 'Nº do processo SEI')}${campo('deposito.numero', 'Nº do pedido no INPI', { ph: 'BR 10 2026 000000 0' })}${campo('deposito.data', 'Data de depósito', { tipo: 'date' })}${campo('deposito.gru', 'Nº da GRU (se tiver)')}</div></div>
        <div class="card"><h2>Se for depositar por conta própria (pessoa física ou empresa)</h2><ol class="passos">
            <li>Entre no ${LINK('https://servicos.patentes.inpi.gov.br/', 'Módulo de Serviços de Patentes')} com o gov.br e clique em "Depósito do pedido".</li>
            <li>Baixe os ${LINK('https://www.gov.br/inpi/pt-br/servicos/patentes/guia-basico', 'modelos de documentos')} (este app já gera no formato) e anexe cada parte.</li>
            <li>Gere e pague a GRU (pode gerar antes em ${LINK('https://meu.inpi.gov.br/pag/', 'meu.inpi.gov.br/pag')}; exige cadastro no e-INPI). Pessoas físicas, microempresas e instituições de ensino podem ter desconto: veja a ${LINK('https://www.gov.br/inpi/pt-br/servicos/tabelas-de-retribuicao', 'tabela de retribuições')}.</li>
            <li>Se você mesmo divulgou a invenção antes, anexe a ${LINK('https://www.gov.br/inpi/pt-br/servicos/patentes/guia-basico', 'declaração de divulgação do inventor')}.</li></ol></div>`;
    }
};

// ------------------------------------------------------------ ACOMPANHE
PAGINAS.acompanhe = {
    render(p) {
        const d = p.deposito.data;
        const linha = (t, data, extra) => `<tr><td>${t}</td><td><b>${data ? dataBR(data) : '—'}</b></td><td class="pequeno">${extra}</td></tr>`;
        return `${cabecalho('acompanhe', 'Depois do depósito, o pedido passa por Exame Formal → Publicação → Exame Técnico → Decisão. Acompanhar é responsabilidade do depositante: a RPI sai toda terça-feira.')}
        <div class="card"><div class="grade-campos">${campo('deposito.data', 'Data de depósito', { tipo: 'date' })}${campo('deposito.numero', 'Nº do pedido')}</div>
        <div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Prazo</th><th>Data</th><th>O que fazer</th></tr></thead><tbody>
            ${linha('Fim do sigilo (publicação)', somarMeses(d, 18), 'O pedido fica sigiloso por até 18 meses e depois é publicado na RPI.')}
            ${linha('1ª anuidade', somarMeses(d, 24), 'Começa a partir do 24º mês do depósito e segue até o fim da patente. Sem pagar, o pedido é arquivado.')}
            ${linha('Limite para pedir o exame técnico', somarMeses(d, 36), `Até 36 meses do depósito: código 203 (PI) ou 204 (MU). ${p.natureza ? 'Seu caso: ' + (p.natureza === 'MU' ? '204' : '203') + '.' : ''}`)}
            ${linha('Fim da proteção (se concedida)', somarMeses(d, p.natureza === 'MU' ? 180 : 240), p.natureza === 'MU' ? 'MU vale 15 anos.' : 'PI vale 20 anos.')}
        </tbody></table></div>
        <label class="campo-inline"><input type="checkbox" data-c="deposito.exameSolicitado" ${p.deposito.exameSolicitado ? 'checked' : ''}> Exame técnico já solicitado</label></div>
        <div class="card"><h2>Ferramentas</h2><ul class="checklist">
            <li>📰 ${LINK('https://revistas.inpi.gov.br/rpi/', 'Revista da Propriedade Industrial (RPI)')} — toda terça-feira.</li>
            <li>📧 "Meus Pedidos" no INPI — avisos por e-mail (opcional; não substitui a RPI).</li>
            <li>🚀 ${LINK('https://www.gov.br/inpi/pt-br/servicos/patentes/tramite-prioritario', 'Trâmite prioritário')} — exame acelerado em alguns casos.</li>
            <li>🔮 Opinião preliminar (código 276) — avaliação antes do exame oficial.</li>
            <li>💬 ${LINK('https://www.gov.br/inpi/pt-br/canais_atendimento/fale-conosco', 'Plataforma Integrada de Atendimento')}</li></ul></div>`;
    }
};

// ------------------------------------------------------------ ENTREGA (8 documentos)
PAGINAS.entrega = {
    render(p) {
        const v = verificar(p), erros = v.filter(x => x.nivel === 'erro');
        const pl = App.placar;
        return `${cabecalho('entrega', 'Fim de jogo! Aqui estão os 8 documentos preenchidos, prontos para revisar com o orientador e entregar ao escritório de propriedade intelectual.')}
        <div class="card trofeu ${p.jogo.baixouTudo ? 'ganho' : ''}"><span class="trofeu-icone">🏆</span><div><b>${esc(pl.nivel[1])}</b> · ${pl.xp} XP · ${pl.medalhas.filter(m => m.ok).length}/${pl.medalhas.length} medalhas
        ${erros.length ? `<p class="nota">Ainda há ${erros.length} erro(s) na revisão: os documentos saem com [COMPLETAR] onde faltar. <a href="#/revisao">Ver revisão</a></p>` : '<p class="nota">Revisão sem erros. 🎉</p>'}</div>
        <button type="button" class="btn btn-primary grande" data-acao="baixar-tudo">⬇ Baixar os 8 documentos (ZIP)</button></div>
        ${['INPI', 'Universidade', 'Busca'].map(g => `<div class="card"><h2>${g === 'INPI' ? '📄 Pedido no INPI' : g === 'Universidade' ? '🏛️ Universidade (processo sigiloso no SEI)' : '🔎 Busca de anterioridade'}</h2><div class="lista-docs">${DOCUMENTOS.filter(d => d.grupo === g).map(d => `<div class="doc"><span class="doc-icone">📄</span><span class="doc-nome">${esc(d.nome)}</span><a href="#/${d.etapa}" class="btn-link">editar</a><button type="button" class="btn btn-secondary btn-sm" data-acao="baixar-doc" data-doc="${d.id}">⬇ .docx</button></div>`).join('')}</div></div>`).join('')}
        <p class="nota">O ZIP também leva o projeto (pedido.json), para abrir de novo neste app, e o prompt de busca (.md). Ele contém dados pessoais dos inventores: não publique.</p>`;
    }
};

function proximaEtapa() {
    const pl = App.placar;
    const e = ETAPAS.find(x => x.id !== 'inicio' && pl.porEtapa[x.id] && pl.porEtapa[x.id].feitas < pl.porEtapa[x.id].total);
    return e ? e.id : null;
}
