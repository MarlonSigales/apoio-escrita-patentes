/**
 * © 2026 Apoio à Escrita de Patentes — Inova Agro UFPel EMBRAPII. Todos os direitos reservados; copiar, reproduzir ou alterar exige autorização do autor (ver LICENSE).
 *
 * EXEMPLOS: (1) um pedido completo de sistema de monitoramento de pressão (modelo da equipe) e (2) o início de um
 * pedido de dosador de fertilizantes de cilindro vertical, com a busca de anterioridade registrada.
 * Os inventores dos exemplos são fictícios: dados pessoais reais nunca entram no código.
 */

'use strict';

function exemploPressao() {
    const p = pedidoVazio();
    Object.assign(p, { natureza: 'MU', titulo: 'Sistema de monitoramento de pressão para circuitos pneumáticos', area: 'eletrônica embarcada e máquinas agrícolas' });
    Object.assign(p.contexto, { instituicao: 'Universidade Federal de Pelotas', ano: '2024', inventores: 'Professor(a) Orientador(a) Exemplo\nEstudante Exemplo', depositante: 'Universidade Federal de Pelotas' });
    p.revisao.semDivulgacao = true;
    p.ficha = {
        campo: 'Um sistema eletrônico com um sensor de pressão para monitorar continuamente a pressão de circuitos pneumáticos e identificar variações em relação à pressão inicial',
        problema: 'A facilidade de acesso e a necessidade de locomoção em aplicações que envolvem máquinas e implementos agrícolas com sistemas pneumáticos; os manômetros existentes precisam de um local fixo na máquina',
        estadoTecnica: 'O manômetro é um instrumento utilizado para medir a pressão de fluídos em recipientes fechados. Ao analisar o estado da técnica nos pedidos de patentes ou modelos de utilidade empregando manômetros digitais são encontradas inovações referentes à área da saúde, como nas patentes BR 212020008879-5 U2 e BR 102013031950-3 A2, e na área automotiva, como a patente MU 8402728-2 U. Por outro lado, foi encontrada a patente PI 9203934-0 A, que possui alguma semelhança, porém esta não tem aplicação destinada ao mesmo campo da invenção.',
        solucao: 'Um sistema eletrônico portátil, com bateria recarregável, que lê a pressão de um duto pressurizado referenciada à pressão atmosférica e envia as medidas sem fio, em tempo real',
        componentes: [
            { id: uid(), num: '01', nome: 'Bateria com carregamento externo controlado', funcao: 'alimentar o sistema com autonomia' },
            { id: uid(), num: '02', nome: 'Chave liga/desliga', funcao: 'interromper o consumo de energia quando não estiver em uso' },
            { id: uid(), num: '03', nome: 'Fonte chaveada', funcao: 'estabilizar a tensão para as cargas' },
            { id: uid(), num: '04', nome: 'Processamento', funcao: 'ler as medidas do sensor e enviá-las' },
            { id: uid(), num: '05', nome: 'Sensor de pressão', funcao: 'medir a pressão com precisão e confiabilidade' },
            { id: uid(), num: '06', nome: 'Módulo de comunicação sem fio', funcao: 'permitir o acesso às leituras de maneira remota e em tempo real' },
            { id: uid(), num: '07', nome: 'Fonte de pressão', funcao: 'pressurizar o circuito' },
            { id: uid(), num: '08', nome: 'Carga pneumática', funcao: 'consumir o ar do circuito' },
            { id: uid(), num: '09', nome: 'Duto pressurizado', funcao: 'ligar a fonte à carga' },
            { id: uid(), num: '10', nome: 'Sensor S', funcao: 'ficar submetido à mesma pressão do duto' }
        ],
        vantagens: 'O sistema pode ser levado de uma máquina a outra e dispensa local fixo, com leitura remota em tempo real',
        aplicacoes: 'máquinas e implementos agrícolas ou qualquer equipamento que faça uso de sistemas pneumáticos, como dosadores de sementes pneumáticos',
        ensaios: '', concorrentes: 'manômetros analógicos e digitais de painel'
    };
    p.busca.termos = { objeto: 'sistema de monitoramento; manômetro digital', elemento: 'sensor de pressão', orientacao: 'sem fio', geometria: '', problema: 'monitoramento; vazamento', condicao: 'circuitos pneumáticos; máquinas agrícolas', fabricacao: '' };
    p.classes.marcadas = ['G01L 9/00', 'G01L 19/08', 'G08C 17/02', 'H02J 7/00'];
    p.busca.resultados = [
        { id: uid(), num: 'BR 212020008879-5 U2', titulo: 'Manômetro digital (área da saúde)', base: 'INPI', relevancia: 3, categoria: 'A', tipoDoc: 'Patente ou MU', lido: 'resumo', nota: 'Área da saúde; não se aplica a circuitos pneumáticos de máquinas.', carac: {} },
        { id: uid(), num: 'BR 102013031950-3 A2', titulo: 'Manômetro digital (área da saúde)', base: 'INPI', relevancia: 3, categoria: 'A', tipoDoc: 'Patente ou MU', lido: 'resumo', nota: 'Área da saúde.', carac: {} },
        { id: uid(), num: 'MU 8402728-2 U', titulo: 'Manômetro digital automotivo', base: 'INPI', relevancia: 3, categoria: 'A', tipoDoc: 'Patente ou MU', lido: 'resumo', nota: 'Área automotiva; instalação fixa.', carac: {} },
        { id: uid(), num: 'PI 9203934-0 A', titulo: 'Dispositivo de medição de pressão', base: 'INPI', relevancia: 4, categoria: 'A', tipoDoc: 'Patente ou MU', lido: 'resumo', nota: 'Alguma semelhança, mas outro campo de aplicação.', carac: {} }
    ];
    p.relatorio = {
        campo: 'O objeto do presente pedido de patente de modelo de utilidade trata-se de um sistema eletrônico com um sensor de pressão atmosférica (05 e 10) para monitorar continuamente a pressão e identificar variações em relação à pressão inicial. Essa medição é realizada eletronicamente e sua aplicação pode ser em máquinas e implementos agrícolas ou qualquer outro equipamento que faça uso de sistemas pneumáticos.',
        fundamentos: p.ficha.estadoTecnica + ' Diante dessa busca, foi constatado que não foram encontradas patentes que possuam a mesma construção e aplicação da apresentada neste relatório.',
        problemaSolucao: 'O que motivou o desenvolvimento desse sistema foi a facilidade de acesso e necessidade de locomoção em aplicações que envolvam máquinas e implementos agrícolas que fazem uso de sistemas pneumáticos. Esse sistema se torna de grande utilidade pois difere dos outros encontrados, onde necessitam de um local fixo na máquina para seu correto funcionamento.',
        desenhos: 'A FIGURA 1 ilustra o diagrama de blocos que representa todas as etapas do modelo de utilidade. Nos dois primeiros blocos, temos a alimentação do sistema (01), seguido pelo bloco de "Liga/desliga" (02) que representa a chave de alimentação do sistema. Em seguida, há a estabilização da tensão através de uma fonte chaveada (03) e a etapa de processamento (04), na qual ocorrem as leituras das medidas realizadas pelo sensor de pressão (05) e seu envio para nuvem via comunicação sem fio no bloco (06).\n\nA FIGURA 2 demonstra um exemplo de circuito pneumático, com uma fonte de pressão (07), uma carga pneumática (08) ligadas por um duto pressurizado (09) onde o sensor "S" (10) está submetido à mesma pressão. A pressão que a invenção mede é a resultante da pressurização do duto menos a pressão atmosférica.',
        descricao: 'Para compreender a essência da invenção, parte-se de um tubo pressurizado (09) com a pressão diferente do ambiente. Essa é uma pressão inicial e que servirá como referência para as variações que poderão ocorrer. Qualquer alteração nesta pressão será considerada não natural e se encontrará acima ou abaixo da pressão atmosférica de acordo com um manômetro de mercúrio.\n\nO sistema proposto apresenta um diferencial: um sistema eletrônico com um sensor de pressão atmosférico (05). Este sistema inclui um módulo carregador de bateria (01) que se conecta a uma fonte de alimentação por meio de um conector USB, garantindo autonomia e praticidade; uma bateria (01) que será carregada pelo módulo conforme a necessidade; uma chave (02) para interromper a ligação da bateria aos outros componentes, sendo possível o carregamento da bateria mesmo com a chave interrompida; uma fonte chaveada (03) para estabilização da tensão; um processamento (04); um sensor de pressão (05) para fornecer resultados com precisão e confiabilidade; e por fim um módulo de comunicação sem fio (06) para possibilitar o acesso às leituras de maneira remota e em tempo real. O sensor (10) é posicionado em série com o sistema para ser submetido à mesma pressão.',
        exemplos: 'O sistema apresentado se destaca principalmente em situações que exigem locomoção e facilidade de acesso. Devido à sua versatilidade, há diversas formas de implementação, por exemplo, a sua utilização no monitoramento de equipamentos pneumáticos para a manutenção preditiva e corretiva de maneira eficiente.'
    };
    p.reivindicacoes = [
        { id: uid(), dep: null, texto: 'ler as variações de pressão, a partir de sensores, referenciadas à pressão atmosférica e comunicar este valor a um receptor de forma sem fio' },
        { id: uid(), dep: 1, texto: 'ter autonomia própria, possuindo bateria, carregador, possibilidade de desligamento e adequação de níveis de tensão de acordo com a necessidade do sistema de processamento, instrumentação e comunicação' },
        { id: uid(), dep: 1, texto: 'possibilitar a inserção para leitura em qualquer sistema pneumático de máquinas e implementos agrícolas ou qualquer equipamento que faça uso de sistemas pneumáticos' },
        { id: uid(), dep: 1, texto: 'possibilitar a utilização em redes de sensores sem fio em máquinas e implementos agrícolas ou qualquer equipamento que faça uso de sistemas pneumáticos' },
        { id: uid(), dep: 1, texto: 'apresentar, conforme seu diagrama de blocos, um carregamento externo controlado (01), uma bateria (01), um liga/desliga (02), uma fonte chaveada (03), um processamento (04), um sensor de pressão (05) e um módulo de comunicação sem fio (06)' }
    ];
    p.desenhos = [
        { id: uid(), legenda: 'ilustra o diagrama de blocos do sistema, da alimentação (01) à comunicação sem fio (06)', img: '', _url: 'img/exemplo/figura1.png' },
        { id: uid(), legenda: 'demonstra um exemplo de circuito pneumático com fonte de pressão (07), carga (08), duto (09) e sensor S (10)', img: '', _url: 'img/exemplo/figura2.png' }
    ];
    p.resumo = 'O presente modelo de utilidade trata de um sistema eletrônico (FIGURA 1) com um sensor de pressão atmosférico (05) que irá monitorar a pressão no interior de um tubo (09) que estará pressurizado inicialmente com a pressão do ambiente. Ao existir variação nessa pressão, ela será considerada não natural e essa variação será acima ou abaixo da pressão do ambiente, referenciada na pressão atmosférica.\n\nNesse sistema eletrônico proposto as medidas que serão registradas pelo sensor de pressão trafegam sem uso de fio (06). Além disso, ele possui uma bateria (01) recarregável e autogerida, possibilitando o uso em situações que exigem mobilidade e facilidade de acesso.\n\nEsse dispositivo será aplicado em máquinas e implementos agrícolas ou qualquer equipamento que faça uso de sistemas pneumáticos.';
    const u = p.universidade;
    Object.assign(u, {
        memorando: { numero: '000', ano: '2024', data: '', assunto: 'Solicitação Abertura de processo Sigiloso' },
        cadastroProjeto: '0000', tipoProjeto: 'Tese', tituloProjeto: 'Projeto preliminar e sistema de controle para dosador de sementes pneumático com cilindro vertical acionado eletricamente',
        objetoProjeto: 'O desenvolvimento do sistema de monitoramento de pressão para circuitos pneumáticos faz parte de uma tese e tem o objetivo de monitorar de forma digital e remotamente a pressão em circuitos pneumáticos.',
        areaPredominante: 'ENGENHARIA', areasAbrangidas: ['Eng. Agrícola', 'Eng. Elétrica'], consiste: 'NOVO PRODUTO',
        contexto: 'O sistema propõe a verificação constante dos dutos pressurizados através de um sistema eletrônico, a fim de identificar anomalias e expor ao operador possíveis problemas na linha pressurizada através de tecnologias sem fio, podendo trabalhar em redes de sensores.',
        comoHoje: 'A depender da aplicação, não se identificam anomalias, pequenos vazamentos e perdas; em outros casos o operador experiente deve buscar o problema e sua possível solução.',
        resultado: 'Uma análise em tempo real dos dados de pressão que avisa o operador sobre anomalias e que pode ser disposta em redes de sensores para respostas mais completas sobre possíveis vazamentos.',
        aplicacoesIndustriais: 'Dosadores de sementes pneumáticos, para identificar anomalias no sistema de pressurização.',
        outrasAplicacoes: 'Qualquer sistema pneumático que necessite de análise de pressão, como sistemas industriais com ar comprimido e sistemas automotivos de suspensão ativa.',
        empresasMercado: 'Fabricantes de semeadoras (exemplos: AGCO, Stara, KF, Vence Tudo, Semeato).',
        empresasOferta: 'Fabricantes de semeadoras pneumáticas e de instrumentação agrícola [COMPLETAR com contatos].',
        notaBusca: 'Os documentos encontrados tratam de manômetros digitais na área da saúde e automotiva, com instalação fixa; nenhum apresenta a mesma construção portátil, sem fio e aplicada a circuitos pneumáticos de máquinas agrícolas.'
    });
    u.inventores = [
        Object.assign(inventorVazio(), { nome: 'Professor(a) Orientador(a) Exemplo', qualificacao: 'Professor de Ensino Superior', notificante: true, percentual: '50', cidade: 'Pelotas', uf: 'RS' }),
        Object.assign(inventorVazio(), { nome: 'Estudante Exemplo', qualificacao: 'Aluno Doutorado ou Pós-Doutorado', percentual: '50', cidade: 'Pelotas', uf: 'RS' })
    ];
    p.fontes = [{ id: uid(), nome: 'Anotações do projeto (exemplo)', tipo: 'texto', ativa: true, data: hojeISO(), texto: p.relatorio.descricao + '\n' + p.relatorio.problemaSolucao + '\n' + p.ficha.estadoTecnica }];
    return normalizarPedido(p);
}

function exemploDosador() {
    const p = pedidoVazio();
    Object.assign(p, { natureza: 'PI', titulo: 'Dosador de fertilizantes com cilindro rotativo vertical', area: 'máquinas agrícolas (dosadores de fertilizantes e semeadoras-adubadoras)' });
    Object.assign(p.contexto, { instituicao: 'Universidade Federal de Pelotas', ano: '2026', inventores: 'Orientador(a) Exemplo\nCoorientador(a) Exemplo\nEstudante Exemplo', depositante: 'Universidade Federal de Pelotas' });
    p.contexto.divulgacoes = [{ id: uid(), data: '2026-08-17', meio: 'Defesa pública do TCC' }];
    Object.assign(p.ficha, {
        campo: 'Um mecanismo dosador de fertilizantes sólidos granulados para semeadoras-adubadoras, com cilindro (tambor) rotativo de eixo vertical',
        problema: 'Os dosadores helicoidais geram fluxo intermitente (pulsação), com coeficiente de variação acima de 30% em laboratório, e a vazão varia com a inclinação do terreno: aclive causa superdosagem e declive causa subdosagem',
        solucao: 'Um dosador de cilindro rotativo vertical com cavidades circulares distribuídas ao redor do furo central de acoplamento ao eixo, com entrada superior e saída inferior axial, alimentado por gravidade',
        componentes: [
            { id: uid(), num: '01', nome: 'Carcaça quadrada com flange', funcao: 'fixar o dosador com quatro parafusos' },
            { id: uid(), num: '02', nome: 'Entrada superior circular', funcao: 'receber o fertilizante do reservatório' },
            { id: uid(), num: '03', nome: 'Tambor rotativo', funcao: 'transportar volumes definidos de fertilizante' },
            { id: uid(), num: '04', nome: 'Cavidades circulares', funcao: 'definir o volume dosado em cada passagem' },
            { id: uid(), num: '05', nome: 'Furo central de seção quadrada', funcao: 'acoplar o tambor ao eixo' },
            { id: uid(), num: '06', nome: 'Saída inferior em tubo com abas tipo baioneta', funcao: 'conduzir o fertilizante ao tubo de descida' }
        ],
        vantagens: 'Maior uniformidade de distribuição linear, menor pulsação e menor sensibilidade à inclinação do terreno',
        aplicacoes: 'semeadoras-adubadoras e distribuidores de fertilizantes em linha',
        ensaios: 'Vazão mássica em fatorial 3x5x3 (inclinações de -11° a +11°; doses de 200, 300 e 400 kg/ha) e distribuição linear em esteira com 60 recipientes',
        concorrentes: 'dosadores helicoidais simples e duplos e dosadores de rotor dentado'
    });
    p.busca.termos = { objeto: 'dosador; fertilizante; semeadora-adubadora', elemento: 'cilindro; tambor; rotor', orientacao: 'eixo vertical; vertical', geometria: 'cavidades; alvéolo; orifício', problema: 'pulsação; uniformidade', condicao: 'inclinação; terreno', fabricacao: 'impressão 3D' };
    p.busca.depositantes = 'J.Assy; John Deere; Stara; Jumil; Marchesan; Vence Tudo; Universidade Federal de Pelotas';
    p.classes.marcadas = ['A01C 7/12', 'A01C 15/00', 'A01C 7/06'];
    const R = (num, titulo, base, rel, cat, nota) => ({ id: uid(), num, titulo, base, relevancia: rel, categoria: cat, tipoDoc: 'Patente ou MU', lido: 'resumo', nota, link: 'https://patents.google.com/patent/' + num.replace(/\s|-/g, '') + '/pt', carac: {} });
    p.busca.resultados = [
        R('BR102016023064B1', 'Dosador com disco rotativo de orifícios passantes', 'Google Patents', 5, 'X', 'Disco horizontal com orifícios de dosagem; maior ameaça à novidade.'),
        R('BR202022000099U2', 'Dosador de adubo com rotor de cavidades', 'Google Patents', 5, 'Y', 'Rotor com cavidades e funil fora do centro.'),
        R('BR102012012157B1', 'Dosador de palhetas com duas saídas (UFPel)', 'INPI', 5, 'Y', 'Rotor de palhetas no plano horizontal; mesma instituição.'),
        R('US3513700A', 'Metering apparatus', 'USPTO', 4, 'A', 'Carcaça cilíndrica de eixo vertical com roda de pás.'),
        R('BR102020010445B1', 'Dosador de insumos (rotor de fluxo vertical)', 'Google Patents', 4, 'A', 'Eixo horizontal; células entre aletas.')
    ];
    p.relatorio.campo = RASCUNHOS.campo(p);
    return normalizarPedido(p);
}

/** Carrega as figuras do exemplo (só funciona quando o app está num servidor, ex.: GitHub Pages). */
async function carregarFigurasExemplo(p) {
    for (const d of p.desenhos) {
        if (d.img || !d._url) continue;
        try { const r = await fetch(d._url); if (r.ok) d.img = await Imagens.guardar(await r.blob()); } catch (e) { /* aberto como arquivo: sem figuras */ }
        delete d._url;
    }
}
