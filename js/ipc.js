/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * CLASSIFICAÇÃO POR APROXIMAÇÃO: catálogo resumido da IPC/CPC (títulos traduzidos e simplificados) com palavras-chave.
 * As classes sugeridas são marcadas por semelhança de palavras com a ficha da invenção. É um ponto de partida:
 * o aluno confirma cada classe no IPCPUB (WIPO) ou na busca do INPI antes de usar.
 * Também guarda o dicionário de termos técnicos PT → EN / ES usado para montar as buscas.
 */

'use strict';

// [código, título resumido, palavras-chave (pt e en, separadas por espaço; use _ para expressão)]
const IPC_CATALOGO = [
    // ---- A01B solo e máquinas em geral
    ['A01B 49/00', 'Máquinas combinadas de preparo do solo com outras operações', 'preparo solo combinada semeadura adubacao subsolador escarificador combined tillage'],
    ['A01B 69/00', 'Direção de máquinas agrícolas (inclui direção automática)', 'direcao guiada piloto_automatico gps esterçamento steering guidance autosteer'],
    ['A01B 79/005', 'Agricultura de precisão', 'agricultura_precisao taxa_variavel mapa prescricao precision_farming variable_rate mapeamento'],
    // ---- A01C plantio e adubação
    ['A01C 1/00', 'Preparo de sementes para semeadura ou plantio', 'tratamento sementes revestimento peletizacao germinacao seed_treatment coating'],
    ['A01C 5/00', 'Abertura e fechamento de sulcos ou covas para semear, plantar ou adubar', 'sulcador sulco cova haste disco_duplo cobridor furrow opener covas abertura_covas'],
    ['A01C 7/00', 'Semeadura (semeadoras em geral)', 'semeadora semeadura plantadeira seeder sowing planter'],
    ['A01C 7/04', 'Semeadoras de precisão (grão a grão), com ou sem sucção', 'grao_a_grao precisao singulacao vacuo succao pneumatico disco_alveolado single_grain singulation vacuum'],
    ['A01C 7/06', 'Semeadoras combinadas com adubadora', 'semeadora_adubadora adubadora fertilizante adubo combinada seed_drill fertiliser'],
    ['A01C 7/08', 'Semeadoras a lanço ou em linhas', 'linhas lanco distribuicao_linear linha rows broadcast'],
    ['A01C 7/10', 'Regulagem da caixa e do fluxo de sementes', 'regulagem vazao fluxo controle_fluxo sensor_sementes seed_flow regulating adjusting'],
    ['A01C 7/12', 'Semeadoras com rodas, rotores ou cilindros dosadores', 'dosador roda rotor cilindro tambor rolo_acanalado alveolos celulas feeding_wheel metering_wheel drum roller fluted'],
    ['A01C 7/16', 'Semeadoras com outros dispositivos distribuidores (escovas, discos, roscas)', 'disco rosca helicoidal escova distribuidor parafuso disc screw auger brush'],
    ['A01C 7/18', 'Deposição de sementes em intervalos (plantio em covas, em grupos)', 'intervalos covas grupos hill_drop dosagem_intermitente espacamento'],
    ['A01C 7/20', 'Condução e deposição das sementes (tubos condutores)', 'tubo_condutor conducao deposicao queda velocidade_semente seed_tube conducting'],
    ['A01C 11/00', 'Transplantadoras de mudas', 'transplantadora mudas transplante bandeja transplanting seedlings'],
    ['A01C 14/00', 'Métodos ou aparelhos de plantio não previstos em outro lugar', 'plantio manual plantadora_manual planting'],
    ['A01C 15/00', 'Distribuidores de fertilizantes', 'distribuidor fertilizante adubo dosador_fertilizante adubacao corretivo calcario granulado fertiliser_distributor granular'],
    ['A01C 15/04', 'Distribuidores de fertilizante com sopradores (transporte pneumático)', 'pneumatico soprador ventilador ar transporte_pneumatico blower air'],
    ['A01C 17/00', 'Distribuidores de fertilizante ou sementes com discos centrífugos', 'centrifugo lanco disco_giratorio aletas spinner centrifugal'],
    ['A01C 19/00', 'Acionamento das partes ativas de semeadoras e adubadoras', 'acionamento transmissao motor_eletrico engrenagem corrente roda_motriz drive transmission'],
    ['A01C 21/00', 'Métodos de adubação, semeadura ou plantio', 'metodo adubacao fertilizacao manejo method fertilising'],
    ['A01C 23/00', 'Distribuição de esterco líquido ou fertilizantes líquidos', 'liquido fertilizante_liquido chorume dejeto vinhaca liquid manure'],
    // ---- colheita, cultivo, animais, armazenagem
    ['A01D 41/127', 'Controle e medição em colhedoras combinadas', 'colhedora colheitadeira monitor_produtividade perdas combine harvester yield'],
    ['A01D 43/08', 'Colhedoras com picagem da forragem (forrageiras)', 'forragem forrageira silagem picadora forage chopper'],
    ['A01F 25/00', 'Armazenagem de produtos agrícolas (silos, armazéns)', 'silo armazenagem armazem graos pos_colheita storage grain'],
    ['A01G 9/14', 'Estufas e casas de vegetação', 'estufa casa_vegetacao greenhouse'],
    ['A01G 25/16', 'Controle da irrigação', 'irrigacao controle_irrigacao umidade_solo gotejamento aspersao irrigation watering'],
    ['A01G 31/00', 'Cultivo sem solo (hidroponia)', 'hidroponia hidroponico sem_solo hydroponic soilless'],
    ['A01K 5/02', 'Alimentadores automáticos para animais', 'alimentador racao animais trato comedouro feeder livestock'],
    ['A01K 29/00', 'Outros aparelhos para criação de animais (monitoramento)', 'animais bovinos gado monitoramento_animal pecuaria animal_husbandry'],
    ['A01M 7/00', 'Pulverizadores agrícolas de líquidos', 'pulverizador pulverizacao barra bico defensivo calda sprayer spraying nozzle'],
    ['A01M 21/00', 'Controle de plantas daninhas por meios físicos', 'plantas_daninhas capina weed'],
    // ---- B: técnicas industriais
    ['B05B 1/00', 'Bicos, cabeças de pulverização e outros bocais', 'bico ponta_pulverizacao bocal atomizador nozzle'],
    ['B05B 12/00', 'Controle da descarga de pulverizadores', 'controle_vazao valvula_bico pwm taxa_aplicacao spray_control'],
    ['B29C 64/118', 'Manufatura aditiva por deposição de filamento fundido (FDM)', 'impressao_3d fdm filamento pla abs impressora additive_manufacturing 3d_printing'],
    ['B33Y 80/00', 'Produtos feitos por manufatura aditiva', 'impressao_3d impresso manufatura_aditiva 3d_printed'],
    ['B64D 1/18', 'Aeronaves e drones que liberam líquido ou pó (pulverização aérea)', 'drone vant aeronave pulverizacao_aerea uav aerial'],
    ['B65D 83/06', 'Recipientes dosadores de sólidos fluidos (pós, grânulos)', 'recipiente reservatorio granulado po dispensador container dispensing'],
    ['B65G 33/00', 'Transportadores helicoidais (roscas sem-fim)', 'rosca_sem_fim helicoide helicoidal transportador_helicoidal screw_conveyor auger'],
    ['B65G 53/00', 'Transporte pneumático de material a granel em tubos', 'transporte_pneumatico tubos ar granel pneumatic_conveying'],
    ['B65G 65/48', 'Descarga de recipientes por alimentadores rotativos (válvulas rotativas)', 'alimentador_rotativo valvula_rotativa eclusa rotor celulas rotary_feeder'],
    ['F15B 19/00', 'Testes e monitoramento de sistemas pneumáticos e hidráulicos', 'pneumatico hidraulico circuito_pneumatico teste_pressao vazamento pneumatic hydraulic'],
    ['F16K 31/02', 'Acionamento elétrico de válvulas (solenoide)', 'valvula solenoide eletrovalvula valve solenoid'],
    ['F26B 21/00', 'Controle de processos de secagem', 'secagem secador controle_secagem grao umidade drying dryer'],
    // ---- G: medição, controle, computação
    ['G01F 1/00', 'Medição de vazão (volume de escoamento)', 'vazao medidor_vazao fluxometro escoamento flow_meter'],
    ['G01F 11/00', 'Dosadores volumétricos de acionamento externo', 'dosagem_volumetrica volume celula alveolo volumetric metering'],
    ['G01F 13/00', 'Medir por volume e entregar fluidos ou sólidos fluidos', 'dosar entregar volume granulado dispensar volumetric_dispensing'],
    ['G01G 11/00', 'Pesagem de fluxo contínuo de material (balanças de fluxo)', 'balanca_fluxo pesagem_continua celula_carga belt_weigher continuous_weighing'],
    ['G01G 19/00', 'Balanças para fins especiais', 'balanca pesagem celula_carga weighing scale'],
    ['G01K 1/00', 'Medição de temperatura (detalhes)', 'temperatura termopar termistor ntc temperature'],
    ['G01L 9/00', 'Medição de pressão de fluido por elementos elétricos', 'pressao sensor_pressao transdutor manometro piezoeletrico pressure_sensor transducer'],
    ['G01L 19/08', 'Indicação ou registro remoto de pressão', 'pressao_remota leitura_remota indicacao registro manometro_digital remote_indication'],
    ['G01N 27/22', 'Medição por capacitância (ex.: umidade)', 'capacitivo capacitancia umidade moisture capacitive'],
    ['G01N 33/24', 'Análise de solo e materiais da terra', 'solo analise_solo fertilidade ph condutividade soil'],
    ['G01S 19/00', 'Posicionamento por satélite (GNSS, GPS)', 'gps gnss rtk satelite georreferenciado positioning'],
    ['G05B 11/00', 'Controladores automáticos (PID e semelhantes)', 'controlador pid malha_fechada controle_automatico controller feedback'],
    ['G05B 13/02', 'Controle adaptativo (elétrico)', 'adaptativo autoajuste mrac adaptive'],
    ['G05B 19/042', 'Controle programado com processadores digitais (microcontroladores, CLP)', 'microcontrolador arduino esp32 clp plc firmware embarcado embedded microcontroller'],
    ['G05D 7/06', 'Controle elétrico de vazão', 'controle_vazao vazao_constante regulador_vazao flow_control'],
    ['G05D 16/20', 'Controle elétrico de pressão', 'controle_pressao regulador_pressao pressure_control'],
    ['G06N 3/063', 'Redes neurais implementadas em hardware eletrônico', 'rede_neural hardware analogico neuromorfico neural_network'],
    ['G06T 7/00', 'Análise de imagens', 'imagem visao_computacional camera processamento_imagem image_analysis computer_vision'],
    ['G06Q 50/02', 'Sistemas de gestão para agricultura', 'gestao software agricultura fazenda farm_management'],
    ['G08C 17/02', 'Transmissão de sinais de medição sem fio (telemetria)', 'sem_fio wireless telemetria radio transmissao bluetooth wifi lora telemetry'],
    ['G16Y 10/05', 'Internet das coisas aplicada à agricultura', 'iot internet_das_coisas nuvem agricultura_digital mqtt internet_of_things'],
    ['G16Y 40/10', 'IoT para detecção e monitoramento', 'monitoramento sensores rede_sensores nuvem monitoring sensor_network'],
    // ---- H: eletricidade
    ['H01M 10/44', 'Métodos de carga ou descarga de baterias', 'bateria carga recarregavel litio battery charging'],
    ['H02J 7/00', 'Circuitos para carregar baterias e alimentar cargas por bateria', 'bateria carregador alimentacao autonomia fonte battery charger'],
    ['H02J 7/35', 'Carga de baterias por células fotovoltaicas', 'solar fotovoltaico painel_solar off_grid photovoltaic'],
    ['H02J 3/38', 'Geração distribuída em paralelo com a rede', 'geracao_distribuida rede inversor eolica gerador grid'],
    ['H02M 3/00', 'Conversores CC-CC (fontes chaveadas)', 'fonte_chaveada conversor buck boost regulador_tensao estabilizacao_tensao dc_dc switching'],
    ['H02P 7/00', 'Controle de motores de corrente contínua', 'motor_cc motor_corrente_continua pwm ponte_h dc_motor'],
    ['H02P 8/00', 'Controle de motores de passo', 'motor_passo passo stepper'],
    ['H02P 21/00', 'Controle vetorial de máquinas CA', 'inversor_frequencia motor_inducao vetorial trifasico vector_control'],
    ['H02S 40/38', 'Armazenamento de energia em sistemas fotovoltaicos', 'armazenamento energia solar bateria fotovoltaico pv_storage'],
    ['H04L 67/12', 'Protocolos de rede para aplicações especiais (IoT)', 'protocolo mqtt http servidor nuvem cloud protocol'],
    ['H04W 4/38', 'Serviços sem fio para coleta de dados de sensores', 'sensores_sem_fio coleta_dados rede_sensores_sem_fio wireless_sensor'],
    ['H04W 84/18', 'Redes sem fio auto-organizadas (redes de sensores, mesh)', 'mesh rede_sensores ad_hoc zigbee lora self_organising']
];

// Termos técnicos comuns PT → [EN, ES]. O aluno pode corrigir as traduções na tela de buscas.
const DICIONARIO = {
    'dosador': ['meter; metering device; doser', 'dosificador'], 'dosagem': ['metering; dosing', 'dosificación'],
    'fertilizante': ['fertilizer; fertiliser', 'fertilizante; abono'], 'adubo': ['fertilizer; manure', 'abono'],
    'semente': ['seed', 'semilla'], 'sementes': ['seeds', 'semillas'], 'semeadora': ['seeder; planter; seed drill', 'sembradora'],
    'semeadora-adubadora': ['seed drill; seeder-fertilizer', 'sembradora abonadora'], 'plantadeira': ['planter', 'sembradora'],
    'cilindro': ['cylinder; drum', 'cilindro; tambor'], 'tambor': ['drum', 'tambor'], 'rotor': ['rotor', 'rotor'], 'disco': ['disc; disk', 'disco'],
    'roda': ['wheel', 'rueda'], 'rosca': ['screw; auger', 'tornillo; sinfín'], 'helicoidal': ['helical; auger', 'helicoidal'],
    'vertical': ['vertical', 'vertical'], 'horizontal': ['horizontal', 'horizontal'], 'eixo': ['axis; shaft', 'eje'], 'eixo vertical': ['vertical axis', 'eje vertical'],
    'cavidade': ['cavity; pocket; cell', 'cavidad; alvéolo'], 'cavidades': ['cavities; pockets; cells', 'cavidades; alvéolos'], 'alvéolo': ['cell; pocket', 'alvéolo'],
    'orifício': ['orifice; hole', 'orificio'], 'canal': ['channel; groove', 'canal'], 'dente': ['tooth', 'diente'], 'palheta': ['vane; blade', 'paleta'],
    'pulsação': ['pulsation; surging', 'pulsación'], 'uniformidade': ['uniformity; evenness', 'uniformidad'], 'vazão': ['flow rate', 'caudal'],
    'inclinação': ['slope; inclination; tilt', 'inclinación; pendiente'], 'aclive': ['uphill', 'pendiente ascendente'], 'declive': ['downhill', 'pendiente descendente'],
    'terreno': ['terrain; field', 'terreno'], 'impressão 3d': ['3D printing; additive manufacturing', 'impresión 3D'], 'manufatura aditiva': ['additive manufacturing', 'fabricación aditiva'],
    'sensor': ['sensor', 'sensor'], 'pressão': ['pressure', 'presión'], 'sensor de pressão': ['pressure sensor', 'sensor de presión'],
    'monitoramento': ['monitoring', 'monitoreo'], 'sem fio': ['wireless', 'inalámbrico'], 'bateria': ['battery', 'batería'],
    'pneumático': ['pneumatic', 'neumático'], 'circuito pneumático': ['pneumatic circuit', 'circuito neumático'], 'circuitos pneumáticos': ['pneumatic circuits', 'circuitos neumáticos'],
    'máquina agrícola': ['agricultural machine', 'máquina agrícola'], 'máquinas agrícolas': ['agricultural machinery', 'maquinaria agrícola'], 'implemento': ['implement', 'implemento'],
    'pulverizador': ['sprayer', 'pulverizador'], 'bico': ['nozzle', 'boquilla'], 'barra': ['boom', 'barra'], 'motor': ['motor', 'motor'],
    'motor elétrico': ['electric motor', 'motor eléctrico'], 'controle': ['control', 'control'], 'malha fechada': ['closed loop', 'lazo cerrado'],
    'microcontrolador': ['microcontroller', 'microcontrolador'], 'tubo': ['tube; pipe', 'tubo'], 'mangueira': ['hose', 'manguera'],
    'reservatório': ['hopper; tank', 'tolva; depósito'], 'carcaça': ['housing; casing', 'carcasa'], 'saída': ['outlet', 'salida'], 'entrada': ['inlet', 'entrada'],
    'grânulos': ['granules', 'gránulos'], 'granulado': ['granular', 'granulado'], 'silo': ['silo', 'silo'], 'grãos': ['grain', 'granos'],
    'secador': ['dryer', 'secador'], 'umidade': ['moisture; humidity', 'humedad'], 'irrigação': ['irrigation', 'riego'], 'solo': ['soil', 'suelo'],
    'drone': ['drone; UAV', 'dron'], 'gps': ['GPS; GNSS', 'GPS'], 'câmera': ['camera', 'cámara'], 'imagem': ['image', 'imagen'],
    'balança': ['scale; weigher', 'balanza'], 'célula de carga': ['load cell', 'celda de carga'], 'fonte chaveada': ['switching power supply', 'fuente conmutada'],
    'painel solar': ['solar panel', 'panel solar'], 'transmissão': ['transmission', 'transmisión'], 'engrenagem': ['gear', 'engranaje']
};

const STOP = new Set(('a o as os um uma uns umas de da do das dos em no na nos nas para por com sem e ou que se ao aos à às pelo pela pelos pelas ' +
    'seu sua seus suas este esta estes estas esse essa isso isto como mais menos muito pouco ser ter estar sobre entre até após ante sob ' +
    'qual quais onde quando também já ainda não sim forma modo meio tipo partir mesmo mesma outro outra outros outras cada todo toda todos todas ' +
    'presente invenção modelo utilidade pedido patente sistema dispositivo objeto trata refere uso usado utilizado possui permite pode podem ' +
    'the of and for with to in on by an or is are').split(/\s+/));

/** Radical simples: tira acento e plural/feminino comuns; corta em 6 letras. Bom o bastante para aproximar. */
function radical(w) {
    let s = semAcento(w).replace(/[^a-z0-9_]/g, '');
    if (s.length > 4) s = s.replace(/(oes|aes|ais|eis|is)$/, '').replace(/(es|s)$/, '');
    return s.slice(0, 6);
}
function tokens(t) {
    return (semAcento(t).match(/[a-z0-9][a-z0-9\-]{1,}/g) || []).filter(w => !STOP.has(w) && w.length > 2);
}

/** Texto da invenção com pesos: o título e a solução pesam mais. */
function textosPonderados(p) {
    const f = p.ficha;
    return [
        [p.titulo, 3], [f.solucao, 2], [f.campo, 2], [f.componentes.map(c => c.nome + ' ' + c.funcao).join(' '), 2],
        [f.problema, 1], [p.area, 1], [f.aplicacoes, 1], [f.vantagens, 0.5],
        [Object.values(p.busca.termos).join(' '), 2]
    ];
}

/**
 * Sugere classes por aproximação. Cada palavra-chave do catálogo (ou expressão com _) que aparece no texto da invenção
 * soma pontos conforme o peso do campo. Devolve [{ codigo, titulo, nota (0–100), motivos: [palavras] }].
 */
function sugerirClasses(p, max = 10) {
    const mapa = new Map();     // radical → peso acumulado
    const texto = textosPonderados(p).map(([t]) => tokens(t || '').join(' ')).join(' | ');   // sem palavras vazias: "sensor de pressão" casa com sensor_pressao
    for (const [t, peso] of textosPonderados(p)) {
        for (const w of tokens(t || '')) { const r = radical(w); mapa.set(r, (mapa.get(r) || 0) + peso); }
    }
    if (!mapa.size) return [];
    const doTitulo = new Set([...tokens(p.titulo || ''), ...tokens(p.ficha.campo || '')].map(radical));
    const tituloTxt = tokens((p.titulo || '') + ' ' + (p.ficha.campo || '')).join(' ');
    const res = [];
    for (const [codigo, titulo, chaves] of IPC_CATALOGO) {
        let pts = 0; const motivos = [];
        for (const k of chaves.split(/\s+/)) {
            if (k.includes('_')) {
                const frase = k.replace(/_/g, ' ');
                if (texto.includes(frase)) { pts += 3 + (tituloTxt.includes(frase) ? 4 : 0); motivos.push(frase); }
            } else {
                const r = radical(k), v = mapa.get(r);
                if (v) { pts += Math.min(v, 4) + (doTitulo.has(r) ? 4 : 0); motivos.push(k); }
            }
        }
        if (pts > 0) res.push({ codigo, titulo, pts, motivos: [...new Set(motivos)].slice(0, 6) });
    }
    res.sort((a, b) => b.pts - a.pts);
    const topo = res[0] ? res[0].pts : 1;
    return res.slice(0, max).map(r => Object.assign(r, { nota: Math.max(5, Math.round(100 * r.pts / topo)) }));
}

function tituloClasse(cod) { const e = IPC_CATALOGO.find(c => c[0] === cod); return e ? e[1] : ''; }
/** Abre a classe no navegador de classificação do Espacenet (CPC, compatível com a IPC até o grupo). */
function linkIpcpub(cod) { return 'https://worldwide.espacenet.com/patent/cpc-browser#!/CPC=' + encodeURIComponent(cod.replace(/\s+/g, '')); }
/** Código no formato de busca: "A01C 7/12" → "A01C7/12" (Google Patents/Espacenet) ou "A01C*" (INPI, por subclasse). */
function codCompacto(cod) { return cod.replace(/\s+/g, ''); }
function subclasse(cod) { return cod.replace(/\s+/g, '').slice(0, 4); }

/** Traduz um termo PT pelo dicionário (ou pela tradução que o aluno editou). Devolve { en: [], es: [] }. */
function traduzir(p, termo) {
    const k = semAcento(termo).trim();
    const editado = p.busca.traducoes[k];
    let par = null;
    if (editado) par = editado.split('|');
    else {
        const chave = Object.keys(DICIONARIO).find(d => semAcento(d) === k);
        if (chave) par = DICIONARIO[chave];
    }
    if (!par) return { en: [], es: [] };
    const lista = s => String(s || '').split(';').map(x => x.trim()).filter(Boolean);
    return { en: lista(par[0]), es: lista(par[1]) };
}

/** Extrai termos candidatos (1 e 2 palavras) de um texto, priorizando os que estão no dicionário. */
function termosCandidatos(t, max = 6) {
    const ws = String(t || '').toLowerCase().split(/[^\p{L}\p{N}\-]+/u).filter(Boolean);
    const out = [];
    const noDic = s => Object.keys(DICIONARIO).some(d => semAcento(d) === semAcento(s));
    for (let i = 0; i < ws.length; i++) {
        const dupla = ws[i] + ' ' + (ws[i + 1] || '');
        const tripla = dupla + ' ' + (ws[i + 2] || '');
        if (ws[i + 2] && noDic(tripla)) { out.push(tripla); i += 2; continue; }
        if (ws[i + 1] && noDic(dupla)) { out.push(dupla); i++; continue; }
        if (!STOP.has(semAcento(ws[i])) && ws[i].length > 3) out.push(ws[i]);
    }
    const unicos = [...new Set(out)];
    unicos.sort((a, b) => (noDic(b) ? 1 : 0) - (noDic(a) ? 1 : 0));
    return unicos.slice(0, max);
}
