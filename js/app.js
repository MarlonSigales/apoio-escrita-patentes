/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * APLICAÇÃO: casca (menu, rotas #/etapa, XP no topo), ligação dos campos aos dados (data-c), salvar automático,
 * ações dos botões (data-acao), caderno de fontes lateral (estilo NotebookLM), janelas e tour.
 */

'use strict';

const App = { p: null, pagina: 'inicio', placar: null, campoAtivo: null, _t: null };

function $(s, r = document) { return r.querySelector(s); }
function $$(s, r = document) { return [...r.querySelectorAll(s)]; }
function avisar(msg, tipo = 'ok', ms = 3500) {
    const a = $('#aviso'); a.textContent = msg; a.className = 'aviso-flutuante visivel ' + tipo;
    clearTimeout(avisar._t); avisar._t = setTimeout(() => a.classList.remove('visivel'), ms);
}
function baixarArquivo(blob, nome) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function escolherArquivo(accept, multiplo = false) {
    return new Promise(ok => {
        const el = $('#arq'); el.value = ''; el.accept = accept; el.multiple = multiplo;
        el.onchange = () => ok(el.files ? [...el.files] : []); el.click();
    });
}
async function copiarTexto(t) {
    try { await navigator.clipboard.writeText(t); avisar('Copiado!'); }
    catch (e) { janelaTexto('Copie o texto', t, null); }
}

function valorDe(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.dataset.c && /\.dep$/.test(el.dataset.c)) return el.value ? Number(el.value) : null;
    return el.value;
}

// ------------------------------------------------------------ salvar e redesenhar
function salvar() {
    clearTimeout(App._t);
    App._t = setTimeout(() => {
        if (!Armazem.salvar(App.p)) avisar('Não consegui salvar no navegador (memória cheia?). Baixe o ZIP.', 'erro', 6000);
        $('#topbar-selo').textContent = 'salvo ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }, 400);
}

function atualizarPlacar(comemorar = true) {
    const antes = App.placar;
    App.placar = placar(App.p);
    const pl = App.placar;
    if (comemorar && antes) {
        const ganho = pl.xp - antes.xp;
        if (ganho > 0) soltarXP(ganho);
        const novas = pl.medalhas.filter(m => m.ok && !antes.medalhas.find(x => x.id === m.id).ok);
        if (novas.length) comemorarMedalha(novas[0]);
        if (pl.nivel[1] !== antes.nivel[1] && pl.xp > antes.xp) avisar(`${pl.nivel[2]} Subiu de nível: ${pl.nivel[1]}!`, 'ok', 5000);
    }
    $('#xp-topo').innerHTML = `<span title="Nível">${pl.nivel[2]} <b>${esc(pl.nivel[1])}</b></span><span class="barra-xp mini"><i style="width:${pl.prox ? Math.round(100 * (pl.xp - pl.nivel[0]) / (pl.prox[0] - pl.nivel[0])) : 100}%"></i></span><span class="xp-num">${pl.xp} XP</span>`;
    montarMenu();
}

function soltarXP(n) {
    const el = document.createElement('div'); el.className = 'xp-voa'; el.textContent = '+' + n + ' XP';
    document.body.appendChild(el); setTimeout(() => el.remove(), 1400);
}
function comemorarMedalha(m) {
    const el = document.createElement('div'); el.className = 'medalha-pop';
    el.innerHTML = `<span>${m.icone}</span><div><small>Nova medalha!</small><b>${esc(m.nome)}</b><small>${esc(m.desc)}</small></div>`;
    document.body.appendChild(el); setTimeout(() => el.classList.add('sai'), 3200); setTimeout(() => el.remove(), 3800);
    confete();
}
function confete() {
    const c = document.createElement('div'); c.className = 'confete';
    for (let i = 0; i < 40; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = ['#a8e156', '#409580', '#d4a017', '#085357', '#e57373'][i % 5]; s.style.animationDelay = Math.random() * 0.4 + 's'; c.appendChild(s); }
    document.body.appendChild(c); setTimeout(() => c.remove(), 2200);
}

function montarMenu() {
    const pl = App.placar, prox = proximaEtapa();
    let grupo = '', h = '';
    for (const e of ETAPAS) {
        if (e.grupo !== grupo) { grupo = e.grupo; h += `<span class="sidebar-grupo">${esc(grupo)}</span>`; }
        const st = estadoEtapa(pl, e.id);
        h += `<a href="#/${e.id}" class="sidebar-link ${App.pagina === e.id ? 'ativo' : ''} ${st ? 'etapa-' + st : ''} ${prox === e.id ? 'etapa-proxima' : ''}"><span class="sidebar-num">${st === 'feito' ? '✓' : e.icone}</span>${esc(e.titulo)}</a>`;
    }
    $('#sidebar-nav').innerHTML = h;
    $('#topbar-projeto-nome').textContent = App.p.titulo || 'Sem título';
}

function renderPagina(manter = false) {
    const y = window.scrollY;
    const pg = PAGINAS[App.pagina] || PAGINAS.inicio;
    App.placar = App.placar || placar(App.p);
    $('#app').innerHTML = `<div class="container">${pg.render(App.p)}</div>`;
    const i = ETAPAS.findIndex(e => e.id === App.pagina);
    const ant = ETAPAS[i - 1], prox = ETAPAS[i + 1];
    $('#etapa-nav').innerHTML = (ant ? `<a class="btn btn-secondary" href="#/${ant.id}"><small>◀ anterior</small>${esc(ant.titulo)}</a>` : '') + (prox ? `<a class="btn btn-primary etapa-nav-proxima" href="#/${prox.id}"><small>próxima ▶</small>${esc(prox.titulo)}</a>` : '');
    hidratarImagens();
    montarMenu();
    if (manter) window.scrollTo(0, y); else window.scrollTo(0, 0);
}

async function hidratarImagens() {
    for (const img of $$('img[data-img]')) { const u = await Imagens.url(img.dataset.img); if (u) img.src = u; }
}

function rota() {
    const id = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'inicio';
    App.pagina = PAGINAS[id] ? id : 'inicio';
    if (App.pagina !== 'inicio' && App.pagina !== 'ficha' && temBase(App.p)) {
        const feito = autoPreencher(App.p);
        if (feito.length) { salvar(); atualizarPlacar(); avisar('⚡ Pré-preenchido com o que você já escreveu: ' + feito.slice(0, 6).join(', ') + (feito.length > 6 ? '…' : ''), 'ok', 6000); }
    }
    document.body.classList.remove('sidebar-aberta');
    renderPagina();
}

/** Mudança feita fora de um campo (botão): salva, recalcula e redesenha a página mantendo a rolagem. */
function mudou() { salvar(); atualizarPlacar(); renderPagina(true); }

// ------------------------------------------------------------ edição dos campos
document.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.c) {
        gravarCaminho(App.p, el.dataset.c, valorDe(el));
        salvar();
        const conta = $(`[data-conta="${CSS.escape(el.dataset.c)}"]`);
        if (conta) conta.textContent = palavras(el.value) + ' palavras';
        if (el.dataset.c === 'titulo') $('#topbar-projeto-nome').textContent = el.value || 'Sem título';
        const m = el.dataset.c.match(/^reivindicacoes\.#([^.]+)\./);
        if (m) {
            const r = App.p.reivindicacoes.find(x => x.id === m[1]), card = el.closest('.reivindicacao');
            if (r && card) { $('.pr-pre', card).textContent = preambuloReiv(App.p, r); $('.pr-exp', card).textContent = expressaoReiv(App.p, r); $('.pr-txt', card).textContent = String(r.texto || '').trim().replace(/\.+$/, '') || '…'; }
        }
        clearTimeout(App._tp); App._tp = setTimeout(() => atualizarPlacar(), 700);
    } else if (el.dataset.acaoTraducao !== undefined) {
        App.p.busca.traducoes[el.dataset.acaoTraducao] = el.value; salvar();
    } else if (el.dataset.acao === 'busca-n') {
        const ex = App.p.busca.executadas[el.dataset.id] = App.p.busca.executadas[el.dataset.id] || {};
        ex[el.dataset.campo] = el.value === '' ? '' : Number(el.value); salvar();
    }
});
document.addEventListener('change', e => {
    const el = e.target;
    // selects, datas, checkboxes e rádios que mudam a página (ex.: tipo da reivindicação, vínculo)
    if (el.dataset.c && (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio' || el.type === 'date')) {
        gravarCaminho(App.p, el.dataset.c, valorDe(el)); mudou();
    } else if (el.dataset.c && el.tagName === 'TEXTAREA' && /desenhos|busca\.termos|ficha\.componentes|resultados/.test(el.dataset.c)) {
        mudou();
    } else if (el.dataset.c && /busca\.termos|ficha\.componentes|classes\.manuais|busca\.depositantes|legenda/.test(el.dataset.c)) {
        mudou();
    } else if (el.dataset.acao === 'marcar-classe') {
        const m = App.p.classes.marcadas, c = el.dataset.cod;
        if (el.checked && !m.includes(c)) m.push(c); else if (!el.checked) m.splice(m.indexOf(c), 1);
        mudou();
    } else if (el.dataset.acao === 'busca-feita') {
        const b = gerarBuscas(App.p).find(x => x.id === el.dataset.id) || {};
        const ex = App.p.busca.executadas[el.dataset.id] = App.p.busca.executadas[el.dataset.id] || {};
        Object.assign(ex, { feita: el.checked, data: hojeISO(), base: b.base, est: b.est, consulta: b.consulta });
        mudou();
    } else if (el.dataset.acao === 'notificante') {
        App.p.universidade.inventores.forEach(i => { i.notificante = i.id === el.dataset.id ? el.checked : false; }); mudou();
    } else if (el.dataset.acao === 'area') {
        const a = App.p.universidade.areasAbrangidas, v = el.dataset.v;
        if (el.checked && !a.includes(v)) a.push(v); else if (!el.checked) a.splice(a.indexOf(v), 1);
        mudou();
    } else if (el.dataset.acao === 'busca-n') mudou();
});
document.addEventListener('focusin', e => { if (e.target.matches('textarea[data-c], input[type=text][data-c]')) App.campoAtivo = e.target.dataset.c; });

// ------------------------------------------------------------ ações
const ACOES = {
    'natureza'(el) { App.p.natureza = el.dataset.v; mudou(); },
    'add-divulgacao'() { App.p.contexto.divulgacoes.push({ id: uid(), data: '', meio: '' }); mudou(); },
    'add-componente'() { const n = App.p.ficha.componentes.length + 1; App.p.ficha.componentes.push({ id: uid(), num: String(n).padStart(2, '0'), nome: '', funcao: '' }); mudou(); },
    'componentes-do-texto'() {
        const p = App.p;
        const achados = componentesDoTexto([p.ficha.solucao, ...Object.values(p.relatorio), p.resumo, ...p.reivindicacoes.map(r => r.texto)].join(' '));
        const novos = achados.filter(a => !p.ficha.componentes.some(c => c.num === a.num));
        p.ficha.componentes.push(...novos); p.ficha.componentes.sort((a, b) => a.num.localeCompare(b.num));
        avisar(novos.length ? `${novos.length} componente(s) encontrado(s). Confira os nomes.` : 'Nenhum "nome (01)" novo nos textos.'); mudou();
    },
    'remover'(el) {
        const lista = lerCaminho(App.p, el.dataset.lista);
        const i = lista.findIndex(x => x.id === el.dataset.id);
        if (i >= 0 && confirm('Remover este item?')) {
            lista.splice(i, 1);
            if (el.dataset.lista === 'reivindicacoes') for (const r of lista) { if (r.dep === i + 1) r.dep = r.dep > 1 ? r.dep - 1 : null; else if (r.dep > i + 1) r.dep--; }
            mudou();
        }
    },
    'add-fonte-arquivo': async () => {
        const arqs = await escolherArquivo('.docx,.txt,.md,.csv,.html,.pdf', true);
        for (const a of arqs) {
            try { const f = await lerArquivoFonte(a); App.p.fontes.push({ id: uid(), ...f, data: hojeISO(), ativa: true }); avisar('Fonte adicionada: ' + f.nome); }
            catch (e) { avisar(e.message, 'erro', 7000); }
        }
        mudou();
    },
    'add-fonte-texto'() {
        janelaTexto('Colar texto como fonte', '', (t, nome) => { if (t.trim()) { App.p.fontes.push({ id: uid(), nome: nome || 'Texto colado', tipo: 'texto', texto: t, data: hojeISO(), ativa: true }); mudou(); } }, { nome: true });
    },
    'abrir-caderno'() { abrirCaderno(); },
    'perguntar'(el) { abrirCaderno(el.dataset.q); },
    'perguntar-campo'(el) {
        App.campoAtivo = el.dataset.c;
        const rot = el.closest('label') ? el.closest('label').firstChild.textContent.trim() : '';
        abrirCaderno(rot + ' ' + (App.p.titulo || ''));
    },
    'inserir-trecho'(el) {
        if (!App.campoAtivo) return avisar('Clique antes no campo onde quer inserir.', 'erro');
        const atual = String(lerCaminho(App.p, App.campoAtivo) || '');
        gravarCaminho(App.p, App.campoAtivo, (atual ? atual.trim() + '\n\n' : '') + el.dataset.texto + ` [fonte ${el.dataset.n}]`);
        avisar('Trecho inserido. Reescreva com as suas palavras e tire a marca [fonte].'); mudou();
    },
    'copiar-pacote'() { copiarTexto(pacoteIA(App.p, App.pagina)); },
    'colar-ia'() {
        janelaTexto('Cole a resposta da IA', '', t => {
            try { const feito = aplicarRespostaIA(App.p, extrairJsonIA(t)); avisar(feito.length ? 'Preenchido: ' + feito.join(', ') : 'Nada novo (só preencho o que está vazio).', 'ok', 6000); mudou(); }
            catch (e) { avisar(e.message, 'erro', 6000); }
        });
    },
    'add-resultado'(el) { App.p.busca.resultados.push({ id: uid(), num: el.dataset.num || '', titulo: '', base: '', link: '', relevancia: 3, lido: 'resumo', nota: '', carac: {}, categoria: 'A', tipoDoc: 'Patente ou MU', publicacao: '' }); if (el.dataset.num) avisar('Registrado em Buscas → Documentos encontrados.'); mudou(); },
    'marcar-top'() { for (const s of sugerirClasses(App.p, 3)) if (!App.p.classes.marcadas.includes(s.codigo)) App.p.classes.marcadas.push(s.codigo); mudou(); },
    'preencher-termos'() { preencherTermos(App.p); mudou(); },
    'copiar'(el) { copiarTexto(el.dataset.texto); },
    'copiar-md'() { copiarTexto(gerarMD(App.p)); },
    'baixar-md'() { baixarArquivo(new Blob([gerarMD(App.p)], { type: 'text/markdown' }), 'prompt-busca-' + nomeSeguro(App.p.titulo) + '.md'); },
    'importar-md': async () => {
        const [a] = await escolherArquivo('.md,.txt');
        if (!a) return;
        const feito = aplicarMD(App.p, await a.text());
        preencherTermos(App.p);
        avisar(feito.length ? 'Preenchido pelo .md: ' + feito.slice(0, 8).join(', ') + (feito.length > 8 ? '…' : '') : 'Nada novo no .md (só preencho o que está vazio).', 'ok', 7000);
        mudou();
    },
    'importar-docx': async () => {
        const arqs = await escolherArquivo('.docx', true);
        const feito = [];
        for (const a of arqs) {
            try {
                const texto = await textoDocx(a);
                const r = lerPedidoExistente(texto), p = App.p;
                if (r.titulo && !p.titulo) p.titulo = r.titulo.charAt(0) + r.titulo.slice(1).toLowerCase();
                if (r.tipo === 'relatorio') { for (const k of Object.keys(p.relatorio)) if (r.relatorio[k] && !p.relatorio[k]) p.relatorio[k] = r.relatorio[k]; if (/modelo de utilidade/i.test(texto) && !p.natureza) p.natureza = 'MU'; if (/patente de inven/i.test(texto) && !p.natureza) p.natureza = 'PI'; }
                if (r.tipo === 'reivindicacoes' && !p.reivindicacoes.length) p.reivindicacoes = r.reivindicacoes.map(x => ({ id: uid(), preambulo: '', expressao: '', ...x }));
                if (r.tipo === 'resumo' && !p.resumo) { p.resumo = r.resumo; if (r.figuraResumo) p.figuraResumo = r.figuraResumo; }
                if (r.tipo === 'desenhos') while (p.desenhos.length < r.figuras) p.desenhos.push({ id: uid(), legenda: '', img: '' });
                if (r.tipo === 'desenhos') { const z = await JSZip.loadAsync(a); const imgs = Object.keys(z.files).filter(n => /^word\/media\//.test(n)).sort(); for (let i = 0; i < imgs.length && i < p.desenhos.length; i++) if (!p.desenhos[i].img) p.desenhos[i].img = await Imagens.guardar(new Blob([await z.file(imgs[i]).async('uint8array')], { type: /png$/i.test(imgs[i]) ? 'image/png' : 'image/jpeg' })); }
                p.fontes.push({ id: uid(), nome: a.name, tipo: 'docx', texto, data: hojeISO(), ativa: true });
                feito.push(r.tipo);
            } catch (e) { avisar(a.name + ': ' + e.message, 'erro', 6000); }
        }
        const p = App.p;
        if (!p.ficha.componentes.length) p.ficha.componentes = componentesDoTexto(Object.values(p.relatorio).join(' ') + ' ' + p.resumo);
        if (!p.ficha.campo && p.relatorio.campo) p.ficha.campo = p.relatorio.campo.replace(/^O objeto do presente pedido de [^,]+? trata-se de /i, '');
        if (!p.ficha.problema && p.relatorio.problemaSolucao) p.ficha.problema = paragrafos(p.relatorio.problemaSolucao)[0];
        if (!p.ficha.solucao && p.relatorio.descricao) p.ficha.solucao = paragrafos(p.relatorio.descricao)[0];
        if (!p.ficha.estadoTecnica && p.relatorio.fundamentos) p.ficha.estadoTecnica = paragrafos(p.relatorio.fundamentos)[0];
        if (feito.length) avisar('Lido: ' + feito.join(', ') + '. Confira a ficha e os componentes.', 'ok', 6000);
        mudou();
    },
    'exemplo': async (el) => {
        if (temConteudo() && !confirm('Trocar o pedido atual pelo exemplo? (baixe o ZIP antes se quiser guardar)')) return;
        App.p = exemploPressao();
        await carregarFigurasExemplo(App.p);
        App.placar = null; salvar(); atualizarPlacar(false); location.hash = '#/inicio'; renderPagina();
        avisar('Exemplo carregado. Explore as etapas!');
    },
    'novo': async () => {
        if (temConteudo() && !confirm('Apagar tudo e começar do zero? O pedido atual, as fontes e as figuras serão apagados deste navegador (baixe o ZIP antes se quiser guardar).')) return;
        clearTimeout(App._t); clearTimeout(App._tp);
        Armazem.apagar();
        await Imagens.limpar();
        App.p = normalizarPedido(pedidoVazio());
        Armazem.salvar(App.p);
        App.placar = null; atualizarPlacar(false);
        $('#topbar-selo').textContent = 'pedido novo';
        if (location.hash === '#/ficha') renderPagina(); else location.hash = '#/ficha';
        avisar('Tudo limpo. Comece pela ficha "Sua invenção".', 'ok', 5000);
    },
    'abrir': async () => {
        const [a] = await escolherArquivo('.json,.zip');
        if (!a) return;
        try {
            const novo = /\.zip$/i.test(a.name) ? await lerZipProjeto(a) : await importarPedidoJSON(await a.text());
            if (temConteudo() && !confirm(`Abrir "${novo.titulo || a.name}"? O pedido que está aberto agora será substituído (exporte o JSON dele antes, se quiser guardar).`)) return;
            App.p = novo; App.placar = null; Armazem.salvar(App.p); atualizarPlacar(false);
            const prox = proximaEtapa();
            avisar(`Pedido "${App.p.titulo || 'sem título'}" aberto. Continue de onde parou.`, 'ok', 5000);
            if (prox && location.hash !== '#/' + prox) location.hash = '#/' + prox; else renderPagina();
        } catch (e) { avisar('Não consegui abrir: ' + e.message, 'erro', 7000); }
    },
    'exportar-json': async () => {
        try {
            baixarArquivo(new Blob([await exportarPedidoJSON(App.p)], { type: 'application/json' }), nomePeloTitulo(App.p, 'json'));
            App.p.jogo.exportouEm = new Date().toISOString(); salvar();
            avisar(`Exportado: "${nomePeloTitulo(App.p, 'json')}". Para continuar depois, use "Continuar um pedido".`, 'ok', 6000);
        } catch (e) { avisar('Erro ao exportar: ' + e.message, 'erro', 6000); }
    },
    'rascunho'(el) {
        const k = el.dataset.k, c = el.dataset.c;
        const txt = (RASCUNHOS[k] || (() => ''))(App.p);
        if (!txt) return avisar('Preencha antes a ficha da invenção: o rascunho sai dela.', 'erro', 5000);
        const atual = String(lerCaminho(App.p, c) || '').trim();
        if (atual && !confirm('O campo já tem texto. Substituir pelo rascunho?')) return;
        gravarCaminho(App.p, c, txt); avisar('Rascunho pronto. Revise e complete onde estiver [COMPLETAR].'); mudou();
    },
    'rascunho-tudo'() {
        let n = 0;
        for (const k of Object.keys(App.p.relatorio)) { if (!App.p.relatorio[k].trim()) { const t = RASCUNHOS[k](App.p); if (t) { App.p.relatorio[k] = t; n++; } } }
        avisar(n ? `${n} seção(ões) com rascunho. Revise tudo!` : 'Nada vazio para preencher (ou a ficha está vazia).'); mudou();
    },
    'rascunho-reivindicacoes'() { App.p.reivindicacoes = rascunhoReivindicacoes(App.p); mudou(); },
    'add-reivindicacao'() { ACOES[App.p.reivindicacoes.length ? 'add-reiv-dep' : 'add-reiv-ind']({ dataset: {} }); },
    'add-reiv-ind'() { App.p.reivindicacoes.push({ id: uid(), dep: null, preambulo: '', expressao: '', texto: '' }); mudou(); focarUltimaReiv(); },
    'add-reiv-dep'(el) {
        const rs = App.p.reivindicacoes;
        if (!rs.length) return ACOES['add-reiv-ind']();
        // depende da indicada; sem indicação, da independente mais recente
        let n = Number(el.dataset.n) || 0;
        if (!n) { for (let i = rs.length - 1; i >= 0; i--) if (!rs[i].dep) { n = i + 1; break; } n = n || 1; }
        const mae = rs[n - 1];
        const nova = { id: uid(), dep: n, preambulo: mae.preambulo || '', expressao: mae.expressao || '', texto: '' };
        // entra logo depois da última dependente da mesma família, para manter a numeração em ordem
        let pos = n; while (pos < rs.length && rs[pos].dep && rs[pos].dep >= n) pos++;
        const deslocadas = rs.slice(pos);
        rs.splice(pos, 0, nova);
        for (const r of deslocadas) if (r.dep && r.dep > pos) r.dep++;
        mudou(); focarReiv(nova.id);
    },
    'subir-reiv'(el) {
        const rs = App.p.reivindicacoes, i = rs.findIndex(r => r.id === el.dataset.id);
        if (i <= 0) return;
        if (rs[i].dep === i) return avisar('Ela depende da reivindicação de cima: não dá para passar à frente dela.', 'erro');
        [rs[i - 1], rs[i]] = [rs[i], rs[i - 1]];
        for (const r of rs) { if (r.dep === i) r.dep = i + 1; else if (r.dep === i + 1) r.dep = i; }
        mudou();
    },
    'add-desenho'() { App.p.desenhos.push({ id: uid(), legenda: '', img: '' }); mudou(); },
    'imagem-desenho': async (el) => {
        const [a] = await escolherArquivo('image/*');
        if (!a) return;
        const d = App.p.desenhos.find(x => x.id === el.dataset.id);
        d.img = await Imagens.guardar(a); mudou();
    },
    'add-inventor'() { const i = inventorVazio(); if (!App.p.universidade.inventores.length) i.notificante = true; App.p.universidade.inventores.push(i); mudou(); },
    'add-colaborador'() { App.p.universidade.colaboradores.push(Object.assign(inventorVazio(), { inventor: false })); mudou(); },
    'dividir-igual'() { const t = App.p.universidade.inventores.concat(App.p.universidade.colaboradores); if (!t.length) return; const v = Math.floor(10000 / t.length) / 100; t.forEach((x, i) => { x.percentual = String(i === 0 ? Math.round((100 - v * (t.length - 1)) * 100) / 100 : v); }); mudou(); },
    'baixar-doc': async (el) => {
        const d = DOCUMENTOS.find(x => x.id === el.dataset.doc);
        try { baixarArquivo(await gerarDocumento(App.p, d.id), nomeArquivoDoc(App.p, d)); } catch (e) { avisar('Erro ao gerar: ' + e.message, 'erro', 6000); }
    },
    'baixar-tudo': async () => {
        try {
            baixarArquivo(await zipFinal(App.p), nomePeloTitulo(App.p, 'zip').replace(/\.zip$/, ' - 8 documentos.zip'));
            if (!App.p.jogo.baixouTudo) { App.p.jogo.baixouTudo = true; confete(); }
            mudou();
        } catch (e) { avisar('Erro ao gerar o ZIP: ' + e.message, 'erro', 6000); }
    },
    'pre-preencher'() {
        const feito = autoPreencher(App.p);
        avisar(feito.length ? '⚡ Pré-preenchido: ' + feito.slice(0, 10).join(', ') + (feito.length > 10 ? '…' : '') : 'Nada novo para pré-preencher (só completo o que está vazio).', 'ok', 7000);
        mudou();
    },
    'modelo-resumo'() {
        if (App.p.resumo.trim() && !confirm('Substituir o resumo pelo modelo?')) return;
        App.p.resumo = `O presente ${nomeNatureza(App.p)} trata de [o que é] (FIGURA 1) com [componente principal] (01) que [o que faz].\n\n[Como funciona, citando os componentes] (02), (03).\n\nAlém disso, [vantagem].\n\nEsse dispositivo será aplicado em [aplicações].`;
        mudou();
    },
    'colar-retorno'() {
        const t = ($('#retorno-busca') || {}).value || '';
        if (!t.trim()) return avisar('Cole o retorno da busca no campo antes.', 'erro');
        const r = aplicarRetorno(App.p, t);
        autoPreencher(App.p);
        avisar(`${r.json ? 'JSON' : 'Texto'} lido: ${r.nr} contagem(ns), ${r.nd} documento(s)${r.nota ? ' e a conclusão' : ''}. Já estão no Formulário de Busca de Anterioridade.`, r.nr || r.nd ? 'ok' : 'erro', 7000);
        mudou();
    },
    'arquivo-retorno': async () => {
        const [a] = await escolherArquivo('.json,.txt,.md');
        if (!a) return;
        const t = await a.text();
        const r = aplicarRetorno(App.p, t); autoPreencher(App.p);
        avisar(`${r.json ? 'JSON' : 'Texto'} lido: ${r.nr} contagem(ns), ${r.nd} documento(s)${r.nota ? ' e a conclusão' : ''}.`, r.nr || r.nd ? 'ok' : 'erro', 7000);
        mudou();
    },
    'limpar-retorno'() {
        if (!confirm('Apagar o retorno colado e as contagens lidas? (os documentos ficam)')) return;
        Object.assign(App.p.busca, { retorno: '', registroColado: [], notaRetorno: '', analise: { diferenciais: [], ameacas: [], lacunas: [], recomendacoes: [], prazos: '', data: '' } }); mudou();
    },
    'add-registro'() { App.p.busca.registroColado.push({ id: uid(), base: 'inpi', consulta: '', n: '', triados: '' }); mudou(); },
    'tour'() { iniciarTour(true); },
    'fechar-menu'() { document.body.classList.remove('sidebar-aberta'); }
};

document.addEventListener('click', e => {
    const el = e.target.closest('[data-acao]');
    if (!el || el.tagName === 'INPUT') return;
    const f = ACOES[el.dataset.acao];
    if (f) { e.preventDefault(); f(el); }
});

/** Há de onde pré-preencher? (ficha da invenção, resumo ou reivindicações) */
function focarReiv(id) { setTimeout(() => { const t = $(`textarea[data-c="reivindicacoes.#${id}.texto"]`); if (t) { t.scrollIntoView({ block: 'center' }); t.focus(); } }, 60); }
function focarUltimaReiv() { const rs = App.p.reivindicacoes; if (rs.length) focarReiv(rs[rs.length - 1].id); }
function temBase(p) { const f = p.ficha; return !!(f.campo.trim() || f.solucao.trim() || f.problema.trim() || f.componentes.length || p.resumo.trim() || p.reivindicacoes.some(r => r.texto.trim())); }
function temConteudo() { const p = App.p; return !!(p.titulo || p.ficha.solucao || p.reivindicacoes.length || p.resumo); }

// ------------------------------------------------------------ caderno lateral (perguntar às fontes)
function abrirCaderno(pergunta = '') {
    document.body.classList.add('caderno-aberto');
    const q = $('#caderno-q'); q.value = pergunta.trim(); responderCaderno();
    q.focus();
}
function responderCaderno() {
    const p = App.p, q = $('#caderno-q').value;
    const chips = perguntasSugeridas(p, App.pagina).map(t => `<button type="button" class="chip" data-acao="perguntar" data-q="${escAttr(t)}">${esc(t)}</button>`).join('');
    let corpo;
    if (!p.fontes.length) corpo = '<div class="vazio">Sem fontes ainda. <a href="#/fontes">Adicione o TCC ou um relatório</a>.</div>';
    else if (!q.trim()) corpo = `<p class="nota">${p.fontes.filter(f => f.ativa).length} fonte(s) ativa(s). Pergunte algo ou escolha uma sugestão.</p>`;
    else {
        const rs = perguntarFontes(p, q, 6);
        corpo = rs.length ? rs.map(r => `<div class="trecho"><small>[${r.n}] ${esc(r.fonte.nome)}</small><p>${esc(r.texto.length > 420 ? r.texto.slice(0, 420) + '…' : r.texto)}</p><button type="button" class="btn btn-secondary btn-sm" data-acao="inserir-trecho" data-n="${r.n}" data-texto="${escAttr(r.texto)}">⤵ Inserir no campo ${App.campoAtivo ? 'ativo' : '(clique antes num campo)'}</button></div>`).join('') : '<p class="nota">Nada encontrado nas fontes para essa pergunta. Tente outras palavras.</p>';
    }
    $('#caderno-corpo').innerHTML = `<div class="chips">${chips}</div>${corpo}`;
}

// ------------------------------------------------------------ janela de texto
function janelaTexto(titulo, texto, aoConfirmar, o = {}) {
    const j = document.createElement('div'); j.className = 'janela';
    j.innerHTML = `<div class="janela-caixa" role="dialog" aria-modal="true"><h2>${esc(titulo)}</h2>${o.nome ? '<label>Nome da fonte<input type="text" class="j-nome" placeholder="Ex.: TCC — capítulo 3"></label>' : ''}<textarea class="j-texto" rows="14">${esc(texto)}</textarea>
        <div class="botoes"><button type="button" class="btn btn-secondary" data-j="fechar">Fechar</button>${aoConfirmar ? '<button type="button" class="btn btn-primary" data-j="ok">Usar</button>' : ''}</div></div>`;
    document.body.appendChild(j);
    const ta = $('.j-texto', j); ta.focus(); if (texto) ta.select();
    j.addEventListener('click', e => {
        if (e.target === j || e.target.dataset.j === 'fechar') j.remove();
        if (e.target.dataset.j === 'ok') { const nome = $('.j-nome', j); j.remove(); aoConfirmar(ta.value, nome ? nome.value : ''); }
    });
}

// ------------------------------------------------------------ tour
function iniciarTour(forcar = false) {
    const CH = 'pe_tour_visto';
    try { if (!forcar && localStorage.getItem(CH)) return; } catch (e) { /* ok */ }
    const passos = [
        ['.comecar-opcoes', '<b>Comece por aqui.</b> Importe o prompt da busca (.md), um pedido em Word ou veja um exemplo completo.'],
        ['#xp-topo', '<b>Seu nível e XP.</b> Cada missão cumprida dá pontos e medalhas.'],
        ['#sidebar-nav', '<b>As etapas, em ordem,</b> seguindo o Guia Básico do INPI e o caminho pela universidade.'],
        ['.topbar-caderno', '<b>Caderno de fontes.</b> Pergunte às suas fontes e insira trechos no campo, como no NotebookLM.'],
        ['.topbar-zip', '<b>No fim, os 8 documentos.</b> Tudo fica salvo neste navegador; o ZIP leva para outro computador.']
    ].map(([s, t]) => ({ el: $$(s).find(x => x.getClientRects().length), t })).filter(x => x.el);
    if (!passos.length) return;
    let i = 0;
    const c = document.createElement('div'); c.className = 'tour';
    c.innerHTML = '<div class="tour-foco"></div><div class="tour-balao" role="dialog"><div class="tour-texto"></div><div class="tour-botoes"><button type="button" class="btn btn-secondary btn-sm" data-t="pular">Pular</button><button type="button" class="btn btn-primary btn-sm" data-t="prox">Próximo</button></div></div>';
    document.body.appendChild(c);
    const fim = () => { c.remove(); try { localStorage.setItem(CH, '1'); } catch (e) { /* ok */ } };
    const mostra = () => {
        const p = passos[i]; p.el.scrollIntoView({ block: 'center' });
        const r = p.el.getBoundingClientRect(), f = $('.tour-foco', c), b = $('.tour-balao', c);
        Object.assign(f.style, { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' });
        $('.tour-texto', c).innerHTML = p.t;
        b.style.top = Math.min(window.innerHeight - 160, r.bottom + 14) + 'px';
        b.style.left = Math.max(10, Math.min(window.innerWidth - 330, r.left)) + 'px';
        $('[data-t="prox"]', c).textContent = i === passos.length - 1 ? 'Começar' : 'Próximo';
    };
    c.addEventListener('click', e => { if (e.target.dataset.t === 'pular') fim(); if (e.target.dataset.t === 'prox') { i++; i < passos.length ? mostra() : fim(); } });
    mostra();
}

// ------------------------------------------------------------ início
function iniciar() {
    App.p = Armazem.carregar() || normalizarPedido(pedidoVazio());
    App.placar = placar(App.p);
    atualizarPlacar(false);
    window.addEventListener('hashchange', rota);
    rota();
    $('.sidebar-toggle').addEventListener('click', () => document.body.classList.toggle('sidebar-aberta'));
    $('#caderno-q').addEventListener('input', () => { clearTimeout(App._tc); App._tc = setTimeout(responderCaderno, 250); });
    $('#caderno-fechar').addEventListener('click', () => document.body.classList.remove('caderno-aberto'));
    setTimeout(() => iniciarTour(), 600);
}
document.addEventListener('DOMContentLoaded', iniciar);
