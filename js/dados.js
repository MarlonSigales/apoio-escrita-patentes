/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * DADOS: modelo do pedido, armazenamento no navegador (localStorage + IndexedDB para imagens) e utilidades de texto.
 * Regra: todo dado do usuário entra na tela por esc()/escAttr().
 */

'use strict';

const PE_VERSAO = 1;
const PE_CHAVE = 'pe_pedido_v1';

function esc(t) {
    return String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const escAttr = esc;
function semAcento(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function nomeSeguro(t) { return semAcento(t || 'pedido').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'pedido'; }
function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
function paragrafos(t) { return String(t || '').split(/\n\s*\n|\r\n\s*\r\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean); }
function palavras(t) { return (String(t || '').match(/[\p{L}\p{N}][\p{L}\p{N}\-]*/gu) || []).length; }
function maiusculo(t) { return String(t || '').toLocaleUpperCase('pt-BR'); }
function hojeISO() { return new Date().toISOString().slice(0, 10); }
function somarMeses(iso, meses) {
    if (!iso) return '';
    const d = new Date(iso + 'T12:00:00');
    if (isNaN(d)) return '';
    d.setMonth(d.getMonth() + meses);
    return d.toISOString().slice(0, 10);
}
function dataBR(iso) { if (!iso) return '—'; const [a, m, d] = iso.split('-'); return `${d}/${m}/${a}`; }

/** Pedido vazio. Cada campo existe sempre (normalizarPedido completa os que faltarem). */
function pedidoVazio() {
    return {
        versao: PE_VERSAO,
        criadoEm: hojeISO(),
        natureza: '',            // 'PI' (invenção) ou 'MU' (modelo de utilidade)
        titulo: '',
        area: '',
        contexto: { instituicao: '', ano: String(new Date().getFullYear()), inventores: '', depositante: '', divulgacoes: [] },
        ficha: { campo: '', problema: '', estadoTecnica: '', solucao: '', componentes: [], vantagens: '', aplicacoes: '', ensaios: '', concorrentes: '' },
        fontes: [],
        classes: { marcadas: [], manuais: '' },
        busca: {
            termos: { objeto: '', elemento: '', orientacao: '', geometria: '', problema: '', condicao: '', fabricacao: '' },
            traducoes: {},       // termo → "en; es" editado pelo usuário
            depositantes: '',
            executadas: {},      // id da busca → { feita, n, triados, data }
            resultados: [],      // { id, num, titulo, base, link, relevancia, lido, nota, carac: {} }
            md: '',
            retorno: '',         // texto colado do retorno da busca (relatório da IA, PDF, planilha…)
            registroColado: [],  // { id, base, consulta, n, triados } lidos do retorno colado
            notaRetorno: '',     // conclusão/resumo lido do retorno colado
            analise: { diferenciais: [], ameacas: [], lacunas: [], recomendacoes: [], prazos: '', data: '' }   // vindos do JSON da IA
        },
        autoFeito: {},           // campos já pré-preenchidos uma vez (não repreenche o que o aluno apagou)
        relatorio: { campo: '', fundamentos: '', problemaSolucao: '', desenhos: '', descricao: '', exemplos: '' },
        reivindicacoes: [],      // { id, dep: null | número da reivindicação, texto }
        desenhos: [],            // { id, legenda, img: id no IndexedDB }
        resumo: '',
        figuraResumo: '1',
        revisao: {},             // id do item → true
        deposito: { data: '', numero: '', protocolo: '', gru: '', exameSolicitado: false, desconto: '' },
        universidade: universidadePadrao(),
        jogo: { xpVisto: 0, medalhasVistas: [] }
    };
}

/** Dados da universidade (pré-preenchidos com a UFPel; o aluno pode trocar por outra ICT). */
function universidadePadrao() {
    return {
        nome: 'UNIVERSIDADE FEDERAL DE PELOTAS', sigla: 'UFPel', cnpj: '92.242.080/0001-00',
        endereco: 'Rua Gomes Carneiro, 01 - Ed. Delfim Mendes Silveira - Campus Porto/Reitoria - 4º Andar - PRPPG',
        cidade: 'Pelotas', uf: 'RS', cep: '96010-610', telefone: '(53) 3284 4086', email: 'epitte@ufpel.edu.br',
        unidade: 'Centro de Engenharias', siglaUnidade: 'CENG',
        destinatario: 'Coordenação de Inovação Tecnológica, Núcleo de Proteção Intelectual e Patentes, Núcleo de Execução Orçamentária - PRPPGI',
        memorando: { numero: '', ano: String(new Date().getFullYear()), data: '', assunto: 'Solicitação Abertura de processo Sigiloso' },
        processoSEI: '', cadastroProjeto: '', tituloProjeto: '', tipoProjeto: 'TCC', objetoProjeto: '',
        areaPredominante: 'ENGENHARIA', areasAbrangidas: [], consiste: 'NOVO PRODUTO',
        patrimonioGenetico: 'Nenhum', sisgen: '', faunaFlora: 'Não', conhecimentoTradicional: 'Não',
        contexto: '', comoHoje: '', resultado: '', aplicacoesIndustriais: '', outrasAplicacoes: '',
        parceria: 'Não', parceriaDetalhe: '', materialTerceiros: 'Não', empresasInteressadas: 'Não', empresasInteressadasQuais: '',
        empresasMercado: '', empresasOferta: '',
        inventores: [],          // { id, nome, cpf, celular, email, endereco, cep, cidade, uf, nacionalidade, qualificacao, vinculo, instituicao, inventor, notificante, percentual }
        colaboradores: [],       // não inventores que dividem o 1/3 (mesmos campos de participação)
        buscaResultado: '', notaBusca: ''
    };
}

function inventorVazio() {
    return { id: uid(), nome: '', cpf: '', celular: '', email: '', endereco: '', cep: '', cidade: '', uf: '', nacionalidade: 'Brasileira',
        qualificacao: 'Aluno Graduação', vinculo: 'Sim', instituicao: '', inventor: true, notificante: false, percentual: '', daFicha: false };
}

function normalizarPedido(p) {
    const base = pedidoVazio();
    const fundir = (alvo, modelo) => {
        for (const k of Object.keys(modelo)) {
            if (alvo[k] === undefined || alvo[k] === null) alvo[k] = JSON.parse(JSON.stringify(modelo[k]));
            else if (modelo[k] && typeof modelo[k] === 'object' && !Array.isArray(modelo[k])) fundir(alvo[k], modelo[k]);
        }
    };
    p = p && typeof p === 'object' ? p : {};
    fundir(p, base);
    p.versao = PE_VERSAO;
    p.ficha.componentes = (p.ficha.componentes || []).map(c => ({ id: c.id || uid(), num: String(c.num || ''), nome: c.nome || '', funcao: c.funcao || '' }));
    p.reivindicacoes = (p.reivindicacoes || []).map(r => ({ id: r.id || uid(), dep: r.dep ? Number(r.dep) : null, preambulo: r.preambulo || '', expressao: r.expressao || '', texto: r.texto || '' }));
    p.desenhos = (p.desenhos || []).map(d => { const x = Object.assign({}, d, { id: d.id || uid(), legenda: d.legenda || '', img: d.img || '' }); x.w = Number(x.w) || 1000; x.h = Number(x.h) || 600; x.elementos = (Array.isArray(x.elementos) ? x.elementos : []).map(e => Object.assign({ id: uid() }, e)); return x; });
    if (!['pt', 'en', 'es'].includes(p.idiomaDesenhos)) p.idiomaDesenhos = 'pt';
    p.fontes = (p.fontes || []).map(f => ({ id: f.id || uid(), nome: f.nome || 'Fonte', tipo: f.tipo || 'texto', texto: f.texto || '', data: f.data || hojeISO(), ativa: f.ativa !== false }));
    p.contexto.divulgacoes = (p.contexto.divulgacoes || []).map(d => ({ id: d.id || uid(), data: d.data || '', meio: d.meio || '' }));
    p.busca.resultados = (p.busca.resultados || []).map(r => Object.assign({ id: uid(), num: '', titulo: '', base: '', link: '', relevancia: 3, lido: 'resumo', nota: '', carac: {}, categoria: 'A', tipoDoc: 'Patente ou MU', publicacao: '' }, r));
    p.universidade.inventores = (p.universidade.inventores || []).map(i => Object.assign(inventorVazio(), i));
    p.universidade.colaboradores = (p.universidade.colaboradores || []).map(i => Object.assign(inventorVazio(), { inventor: false }, i));
    if (!Array.isArray(p.universidade.areasAbrangidas)) p.universidade.areasAbrangidas = [];
    p.busca.registroColado = (p.busca.registroColado || []).map(r => Object.assign({ id: uid(), base: '', consulta: '', n: '', triados: '' }, r));
    p.busca.resultados = deduplicarResultados(p.busca.resultados);
    return p;
}

// ------------------------------------------------------------ documentos da busca sem repetição
/**
 * Chaves de identidade de um número de documento. Ignora espaços, pontos e barras, o código de tipo (A1, B1, U2, Y1…)
 * e o dígito verificador brasileiro. Assim "BR 10 2016 023064-0 B1", "BR102016023064B1" e "BR102016023064A2" são
 * o mesmo pedido, e "BR202022000099U2 / Y1" ou "AR045253 / AR040943" geram uma chave para cada número.
 */
function chavesDoc(num) {
    const s = String(num || '').toUpperCase();
    const chaves = new Set();
    for (const parte of s.split(/\s*;\s*|\s+\/\s+|\s*,\s*(?=[A-Z]{2})|\s+E\s+|[()]/)) {
        let t = parte.replace(/^(PI|MU|C1)\s*(?=\d)/, 'BR$1').replace(/[^A-Z0-9]/g, '');
        if (!/\d{4}/.test(t)) continue;
        t = t.replace(/^BR(PI|MU|C1)(?=\d)/, 'BR');
        const m = t.match(/^([A-Z]{2})(\d+)([A-Z]\d?)?$/);
        if (!m) { chaves.add(t); continue; }
        let [, pais, dig] = m;
        if (pais === 'BR') {
            if (dig.length === 13) dig = dig.slice(0, 12);          // BR 10 2024 016346 0 → sem o dígito verificador
            else if (dig.length === 8) dig = dig.slice(0, 7);       // PI 0103912-1, MU 8401135-0
        }
        chaves.add(pais + dig.replace(/^0+(?=\d{6})/, ''));
    }
    return [...chaves];
}

function mesmoDocumento(a, b) {
    const ka = chavesDoc(a), kb = new Set(chavesDoc(b));
    if (!ka.length || !kb.size) { const n = x => String(x || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return !!n(a) && n(a) === n(b); }   // referência sem número (artigo, tese)
    return ka.some(k => kb.has(k));
}

/** Completa o documento já registrado com o que o novo traz (sem apagar nada). */
function juntarDocumento(ja, x) {
    for (const k of ['titulo', 'link', 'depositante', 'publicacao', 'prioridade', 'situacao', 'pais', 'base', 'nota']) if (!ja[k] && x[k]) ja[k] = x[k];
    // o mesmo documento achado em outra base (Google Patents, Espacenet, PATENTSCOPE…): registra as duas bases numa entrada só
    if (ja.base && x.base) { const bs = String(ja.base).split(/\s*,\s*/); if (!bs.some(b => b.toLowerCase() === String(x.base).toLowerCase())) ja.base = bs.concat(x.base).join(', '); }
    for (const [c, v] of Object.entries(x.carac || {})) if (!ja.carac[c] || ja.carac[c] === '?') ja.carac[c] = v;
    const ka = chavesDoc(ja.num); if (x.num && chavesDoc(x.num).some(k => !ka.includes(k)) && !/\//.test(ja.num)) ja.num = ja.num + ' / ' + x.num;
    if (Number(x.relevancia) > Number(ja.relevancia)) ja.relevancia = x.relevancia;
    return ja;
}

/** Remove documentos repetidos (mesmo número), juntando as informações no primeiro. */
function deduplicarResultados(lista) {
    const saida = [];
    for (const r of lista || []) {
        if (!r.carac) r.carac = {};
        const ja = r.num ? saida.find(y => y.num && mesmoDocumento(y.num, r.num)) : null;
        if (ja) juntarDocumento(ja, r); else saida.push(r);
    }
    return saida;
}

// ---------------------------------------------------------------- armazenamento
const Armazem = {
    carregar() {
        try { const t = localStorage.getItem(PE_CHAVE); return t ? normalizarPedido(JSON.parse(t)) : null; } catch (e) { return null; }
    },
    salvar(p) {
        try { localStorage.setItem(PE_CHAVE, JSON.stringify(p)); return true; } catch (e) { return false; }
    },
    apagar() { try { localStorage.removeItem(PE_CHAVE); } catch (e) { /* ok */ } }
};

/** Imagens dos desenhos no IndexedDB (não cabem no localStorage). */
const Imagens = {
    _db: null,
    abrir() {
        if (this._db) return Promise.resolve(this._db);
        return new Promise((ok, erro) => {
            if (!window.indexedDB) return erro(new Error('sem IndexedDB'));
            const r = indexedDB.open('pe_imagens', 1);
            r.onupgradeneeded = () => r.result.createObjectStore('img');
            r.onsuccess = () => { this._db = r.result; ok(this._db); };
            r.onerror = () => erro(r.error);
        });
    },
    async guardar(blob, id = uid()) {
        const db = await this.abrir();
        await new Promise((ok, erro) => { const t = db.transaction('img', 'readwrite'); t.objectStore('img').put(blob, id); t.oncomplete = ok; t.onerror = () => erro(t.error); });
        return id;
    },
    async ler(id) {
        if (!id) return null;
        try {
            const db = await this.abrir();
            return await new Promise(ok => { const r = db.transaction('img').objectStore('img').get(id); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); });
        } catch (e) { return null; }
    },
    /** Apaga todas as figuras guardadas (usado ao começar do zero). */
    async limpar() {
        for (const u of Object.values(this._urls)) URL.revokeObjectURL(u);
        this._urls = {};
        try { const db = await this.abrir(); await new Promise(ok => { const t = db.transaction('img', 'readwrite'); t.objectStore('img').clear(); t.oncomplete = ok; t.onerror = ok; }); } catch (e) { /* sem IndexedDB */ }
    },
    _urls: {},
    async url(id) {
        if (this._urls[id]) return this._urls[id];
        const b = await this.ler(id);
        if (!b) return null;
        return (this._urls[id] = URL.createObjectURL(b));
    }
};

// ---------------------------------------------------------------- caminhos de dados ("a.b.#id.c")
function partes(c) { return String(c).split('.'); }
function lerCaminho(obj, c) {
    let o = obj;
    for (const k of partes(c)) {
        if (o == null) return '';
        o = k.startsWith('#') && Array.isArray(o) ? o.find(x => x.id === k.slice(1)) : o[k];
    }
    return o ?? '';
}
function gravarCaminho(obj, c, v) {
    const ks = partes(c);
    let o = obj;
    for (let i = 0; i < ks.length - 1; i++) {
        const k = ks[i];
        let prox = k.startsWith('#') && Array.isArray(o) ? o.find(x => x.id === k.slice(1)) : o[k];
        if (prox == null) { prox = {}; o[k] = prox; }
        o = prox;
    }
    o[ks[ks.length - 1]] = v;
}

// ---------------------------------------------------------------- consultas úteis
function numerosReferencia(p) { return p.ficha.componentes.map(c => c.num).filter(Boolean); }
function componentePorNum(p, n) { return p.ficha.componentes.find(c => c.num === n); }
/** Números entre parênteses usados num texto, ex.: "(05)" ou "(05 e 10)". */
function numerosNoTexto(t) {
    const out = new Set();
    for (const m of String(t || '').matchAll(/\(([^()]{1,40})\)/g)) {
        for (const n of m[1].match(/\b\d{1,3}[a-zA-Z]?\b/g) || []) out.add(n.length === 1 ? '0' + n : n);
    }
    return [...out];
}
function nomeNatureza(p, curto = false) {
    if (p.natureza === 'MU') return curto ? 'MU' : 'modelo de utilidade';
    if (p.natureza === 'PI') return curto ? 'PI' : 'patente de invenção';
    return curto ? '?' : 'pedido de patente';
}
function tituloPedido(p) { return maiusculo(p.titulo || 'TÍTULO DO PEDIDO'); }
