// =================================================================
// app.js — Manual do Gestor Público · CAGE RS
// =================================================================
// Este arquivo controla toda a lógica do site:
//   1. Carregamento dos dados (conteudo.json)
//   2. Inicialização da interface
//   3. Navegação entre páginas
//   4. Renderização de temas e blocos de conteúdo
//   5. Busca full-text
//   6. Filtros e agrupamento de temas
//   7. Acessibilidade
//   8. Exportação para PDF
// =================================================================

// -----------------------------------------------------------------
// SEÇÃO 1 — CARREGAMENTO DOS DADOS
// -----------------------------------------------------------------

// Variáveis globais — preenchidas após carregar o JSON
let dados;          // objeto completo do conteudo.json
let siteConfig;     // dados do site (título, edição, etc.)
let temas;          // array com todos os temas do manual

async function init() {
  const resposta = await fetch('conteudo.json');
  dados = await resposta.json();
  siteConfig = dados.site;
  temas = dados.temas;
  inicializarInterface();
}

// -----------------------------------------------------------------
// SEÇÃO 2 — INICIALIZAÇÃO DA INTERFACE
// -----------------------------------------------------------------

function inicializarInterface() {

  // Título da aba do navegador
  document.title = siteConfig.titulo + ' — ' + siteConfig.orgao;

  // Cabeçalho
  document.getElementById('h-sigla').textContent = 'CAGE';
  document.getElementById('h-titulo').textContent = siteConfig.titulo;
  document.getElementById('h-sub').textContent = siteConfig.subtitulo;

  // Hero (seção de destaque da home)
  document.getElementById('hero-edicao').textContent = siteConfig.edicao;
  document.getElementById('hero-titulo').textContent = siteConfig.titulo;
  document.getElementById('hero-sub').textContent =
    'O guia completo da ' + siteConfig.orgao +
    ' para gestores e servidores públicos estaduais. ' +
    'Consulte temas, legislação, procedimentos e perguntas frequentes.';

  // Rodapé
  document.getElementById('footer-titulo').textContent =
    siteConfig.orgao + ' — ' + siteConfig.subtitulo;
  document.getElementById('footer-sub').textContent =
    siteConfig.titulo + ' · ' + siteConfig.edicao +
    ' · Governo do Estado do Rio Grande do Sul';

  // Estatísticas do hero (nº de temas, última atualização, etc.)
  document.getElementById('hero-stats').innerHTML = [
    [temas.length, 'temas'],
    [siteConfig.ultima_atualizacao, 'última atualização'],
    ['RS', 'Governo do Estado']
  ].map(([valor, label]) =>
    `<div class="hero-stat"><strong>${valor}</strong><span>${label}</span></div>`
  ).join('');

  // Menu de navegação principal
  document.getElementById('h-nav').innerHTML = `
    <a href="#" onclick="irParaHome()" id="nav-inicio" class="on">Início</a>
    <a href="#" onclick="irParaTemas()" id="nav-temas">Temas</a>
    <a href="#" onclick="irParaLegislacao()" id="nav-leg">Legislação</a>
    <a href="#" onclick="irParaContato()" id="nav-contato">Entre em Contato</a>
    <a href="#" onclick="irParaCAGE()" id="nav-cage">Sobre a CAGE</a>`;

  // Cards de temas na home
  montarCardsHome();

  // FAQ e atualizações da home
  montarFaqHome();
  montarAtualizacoesHome();

  // Chips de filtro na página de temas
  montarFiltrosTemas();

} // fim inicializarInterface()

// -----------------------------------------------------------------
// SEÇÃO 3 — CARDS DA HOME
// -----------------------------------------------------------------

function criarCardTema(tema) {
  const card = document.createElement('div');
  card.className = 'tc' + (tema.destaque ? ' dest' : '');
  card.innerHTML = `
    <div class="tc-ic">${tema.icone}</div>
    <div class="tc-nm">${tema.nome}</div>
    <div class="tc-ds">${tema.desc}</div>
    <div class="tc-tags">${
      tema.tags.map(tag =>
        `<span class="tc-tag ${tag === 'novo' ? 'novo' : ''}">${
          tag === 'novo' ? '🆕 Novo' : tag
        }</span>`
      ).join('')
    }</div>`;
  card.onclick = () => abrirTema(tema.id);
  return card;
}

function montarCardsHome() {
  // Grid de temas em destaque
  temas
    .filter(tema => tema.destaque)
    .forEach(tema => document.getElementById('grid-dest').appendChild(criarCardTema(tema)));

  // Grid com todos os temas
  temas.forEach(tema =>
    document.getElementById('grid-todos').appendChild(criarCardTema(tema))
  );
}

function montarFaqHome() {
  document.getElementById('faq-home').innerHTML = dados.faq_home.map(item =>
    `<li><a href="#" onclick="abrirTema('${item.tema_id}')">${item.pergunta}</a></li>`
  ).join('');
}

function montarAtualizacoesHome() {
  document.getElementById('atu-home').innerHTML = dados.atualizacoes.map(atualizacao =>
    `<div class="ai">
      <span class="atu-d">${atualizacao.data}</span>
      <div class="atu-t"><strong>${atualizacao.tema}:</strong> ${atualizacao.texto}</div>
    </div>`
  ).join('');
}

function montarFiltrosTemas() {
  const todasAsTags = new Set();
  temas.forEach(tema => (tema.tags || []).forEach(tag => todasAsTags.add(tag)));

  const nomesAmigaveis = {
    'fundamental': 'Fundamentos',
    'financeiro': 'Finanças',
    'transferências': 'Transferências',
    'controle': 'Controle',
    'compliance': 'Integridade',
    'pessoal': 'Pessoal',
    'indenização': 'Indenizações',
    'licitação': 'Licitações'
  };

  const containerFiltros = document.getElementById('pt-filtros');
  if (!containerFiltros) return;

  [...todasAsTags].sort().forEach(tag => {
    const nomeExibido = nomesAmigaveis[tag] || tag;
    const botao = document.createElement('button');
    botao.className = 'pt-filtro';
    botao.textContent = nomeExibido;
    botao.onclick = () => filtrarPorTag(tag, botao);
    containerFiltros.appendChild(botao);
  });
}

// -----------------------------------------------------------------
// SEÇÃO 4 — NAVEGAÇÃO ENTRE PÁGINAS
// -----------------------------------------------------------------

// Exibe a página com o id informado e oculta as demais
function mostrarPagina(idPagina) {
  document.querySelectorAll('.page').forEach(pagina => pagina.classList.remove('on'));
  document.getElementById(idPagina).classList.add('on');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function irParaHome() {
  mostrarPagina('pg-home');
  document.getElementById('h-inp').value = '';
  document.querySelectorAll('.h-nav a').forEach(link => link.classList.remove('on'));
  document.getElementById('nav-inicio')?.classList.add('on');
}

function irParaTemas() {
  renderizarListaTemas('', '');
  mostrarPagina('pg-temas');
  document.querySelectorAll('.h-nav a').forEach(link => link.classList.remove('on'));
  document.querySelector('#nav-temas')?.classList.add('on');
}

function irParaLegislacao() {
  mostrarPagina('pg-leg');
  document.querySelectorAll('.h-nav a').forEach(link => link.classList.remove('on'));
  document.getElementById('nav-leg')?.classList.add('on');
}

function irParaCAGE() {
  mostrarPagina('pg-cage');
  document.querySelectorAll('.h-nav a').forEach(link => link.classList.remove('on'));
  document.getElementById('nav-cage')?.classList.add('on');
}

function irParaContato() {
  mostrarPagina('pg-contato');
  document.querySelectorAll('.h-nav a').forEach(link => link.classList.remove('on'));
  document.getElementById('nav-contato')?.classList.add('on');
}

// Aliases mantidos para compatibilidade com o HTML existente
const show = mostrarPagina;
const goHome = irParaHome;
const goTemas = irParaTemas;
const goLeg = irParaLegislacao;
const goCAGE = irParaCAGE;

// -----------------------------------------------------------------
// SEÇÃO 5 — ABERTURA E RENDERIZAÇÃO DE TEMAS
// -----------------------------------------------------------------

let temaAtual = null; // tema aberto no momento

function abrirTema(idTema) {
  const tema = temas.find(t => t.id === idTema);
  temaAtual = tema;

  if (!tema) {
    alert('Tema em construção — em breve disponível neste site.');
    return;
  }

  // Preenche o cabeçalho da página interna
  document.getElementById('bc-tema').textContent = tema.nome;
  document.getElementById('pg-ic').textContent = tema.icone;
  document.getElementById('pg-titulo').textContent = tema.nome;

  const resumoEl = document.getElementById('pg-resumo');
  resumoEl.textContent = tema.resumo;
  resumoEl.style.display = tema.resumo ? '' : 'none';

  document.getElementById('pg-resp').textContent =
    'Responsável pela atualização: ' + tema.responsavel;

  document.getElementById('pg-badges').innerHTML = `
    <span class="pg-b v">✔ Atualizado — ${tema.atualizacao}</span>
    ${tema.tags.includes('novo') ? '<span class="pg-b l">🆕 Novo</span>' : ''}`;

  // Monta a navegação lateral (sumário)
  montarNavLateral(tema);

  // Monta os chips de legislação na sidebar
  document.getElementById('side-leg').innerHTML =
    `<h4>Normas principais</h4>` +
    tema.legislacao.slice(0, 4).map(lei =>
      `<span class="lchip">${lei.nome.split(' ').slice(0, 2).join(' ')}</span>`
    ).join('');

  // Monta o conteúdo principal
  document.getElementById('pg-cont').innerHTML = montarConteudoTema(tema);

  mostrarPagina('pg-interna');
  iniciarScrollSpy();
}

function montarNavLateral(tema) {
  const secoes = [
    ...tema.secoes.map((secao, indice) => ({ id: 's' + (indice + 1), titulo: secao.titulo })),
    { id: 's-cl', titulo: 'Checklist operacional' },
    { id: 's-faq', titulo: 'Perguntas frequentes' },
    { id: 's-leg', titulo: 'Legislação' },
    { id: 's-rel', titulo: 'Temas relacionados' }
  ];

  document.getElementById('pg-nav').innerHTML = secoes.map((secao, indice) =>
    `<li>
      <a href="#${secao.id}" class="pg-nav-a">
        <span class="pn-num">${indice + 1}</span>${secao.titulo}
      </a>
    </li>`
  ).join('');
}

function montarConteudoTema(tema) {
  let html = '';

  // Seções de conteúdo
  tema.secoes.forEach((secao, indice) => {
    html += `<section class="sec" id="s${indice + 1}">
      <h2 class="sec-t"><span class="sec-num">${indice + 1}</span>${secao.titulo}</h2>`;
    secao.conteudo.forEach(bloco => { html += renderizarBloco(bloco); });
    html += '</section>';
  });

  // Checklist operacional
  const totalItensChecklist = tema.checklist ? tema.checklist.length : 0;
  if (totalItensChecklist > 0) {
    html += `<section class="sec" id="s-cl">
      <h2 class="sec-t">
        <span class="sec-num">${tema.secoes.length + 1}</span>Checklist operacional
      </h2>
      <p>Clique nos itens para marcar como concluído.</p>
      <div class="cl-wrap">
        <div class="cl-hd">
          <h4>Processo completo — ${tema.nome}</h4>
          <span id="cl-pct">0 / ${totalItensChecklist}</span>
        </div>
        <div id="cl-prog"><div id="cl-bar" style="width:0%"></div></div>
        <ul class="cl" id="cl-lista">
          ${tema.checklist.map(item =>
            `<li onclick="marcarChecklist(this)"><div class="cb"></div><span>${item}</span></li>`
          ).join('')}
        </ul>
      </div>
    </section>`;
  }

  // Perguntas frequentes
  html += `<section class="sec" id="s-faq">
    <h2 class="sec-t">
      <span class="sec-num">${tema.secoes.length + 2}</span>Perguntas frequentes
    </h2>
    <ul class="faq-l">
      ${tema.faq.map(item => `
        <li class="faq-i">
          <button class="faq-btn" onclick="toggleFaq(this)">
            <span class="faq-q">${item.pergunta}</span>
            <i class="faq-ch">▾</i>
          </button>
          <div class="faq-r">${item.resposta}</div>
        </li>`
      ).join('')}
    </ul>
  </section>`;

  // Legislação relacionada
  html += `<section class="sec" id="s-leg">
    <h2 class="sec-t">
      <span class="sec-num">${tema.secoes.length + 3}</span>Legislação relacionada
    </h2>
    <div class="lg-grid">
      ${tema.legislacao.map(lei => {
        const tipoFormatado = lei.tipo.toLowerCase();
        const classeTipo =
          tipoFormatado === 'dec' ? 'dec' :
          tipoFormatado === 'res' ? 'res' :
          tipoFormatado === 'port' ? 'port' :
          (tipoFormatado === 'in' || tipoFormatado === 'instrução normativa') ? 'in' :
          tipoFormatado === 'circ' ? 'circ' :
          tipoFormatado === 'os' ? 'os' :
          (tipoFormatado === 'lc' || tipoFormatado === 'lei complementar') ? 'lc' : '';

        const conteudoInterno = `
          <span class="lg-tp ${classeTipo}">${lei.tipo}</span>
          <div style="flex:1">
            <div class="lg-nm">${lei.nome}${lei.link ? ' <span class="lg-link-icon">&#8599;</span>' : ''}</div>
            <div class="lg-ds">${lei.desc}</div>
          </div>`;

        return lei.link
          ? `<a href="${lei.link}" target="_blank" rel="noopener" class="lg-c clicavel" style="text-decoration:none">${conteudoInterno}</a>`
          : `<div class="lg-c">${conteudoInterno}</div>`;
      }).join('')}
    </div>
  </section>`;

  // Temas relacionados
  html += `<section class="sec" id="s-rel">
    <h2 class="sec-t">
      <span class="sec-num">${tema.secoes.length + 4}</span>Temas relacionados
    </h2>
    <div class="rel-grid">
      ${tema.relacionados.map(idRelacionado => {
        const temaRelacionado = temas.find(t => t.id === idRelacionado);
        if (!temaRelacionado) return '';
        return `<div class="rel-c" onclick="abrirTema('${temaRelacionado.id}')">
          <span style="font-size:22px">${temaRelacionado.icone}</span>
          <div>
            <div class="rel-nm">${temaRelacionado.nome}</div>
            <div style="font-size:12px;color:var(--cinza-suav);margin-top:2px">
              ${temaRelacionado.desc.split('.')[0]}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <button class="btn-topo" onclick="window.scrollTo({top:0,behavior:'smooth'})">
      ↑ Voltar ao topo
    </button>
  </section>`;

  return html;
}

// -----------------------------------------------------------------
// SEÇÃO 6 — RENDERIZAÇÃO DE BLOCOS DE CONTEÚDO
// -----------------------------------------------------------------

// Cada bloco é uma unidade de conteúdo dentro de uma seção de tema
// Tipos suportados: texto, lista, lista_numerada, info, atencao,
//                  sucesso, aviso, tabela, toggle_group,
//                  checklist_estatico, subtitulo
function renderizarBloco(bloco) {
  const iconesPorTipo = { info: '📌', atencao: '⚡', sucesso: '✔️', aviso: '⚠️' };

  if (bloco.tipo === 'texto')
    return `<p>${bloco.valor}</p>`;

  if (bloco.tipo === 'lista')
    return `<ul>${bloco.itens.map(item => `<li>${item}</li>`).join('')}</ul>`;

  if (bloco.tipo === 'lista_numerada')
    return `<ol>${bloco.itens.map(item => `<li>${item}</li>`).join('')}</ol>`;

  if (['info', 'atencao', 'sucesso', 'aviso'].includes(bloco.tipo))
    return `<div class="box ${bloco.tipo}">
      <span class="box-ic">${iconesPorTipo[bloco.tipo]}</span>
      <div class="box-bd">
        <p class="box-tl">${bloco.titulo}</p>
        <p>${bloco.texto}</p>
      </div>
    </div>`;

  if (bloco.tipo === 'tabela')
    return `<div class="tw"><table>
      <thead><tr>${bloco.cabecalho.map(col => `<th>${col}</th>`).join('')}</tr></thead>
      <tbody>${bloco.linhas.map(linha =>
        `<tr>${linha.map(celula => `<td>${celula}</td>`).join('')}</tr>`
      ).join('')}</tbody>
    </table></div>`;

  if (bloco.tipo === 'toggle_group') {
    const idUnico = 'tg_' + Math.random().toString(36).slice(2, 7);
    return `<div class="toggle-group">
      <button class="toggle-btn" onclick="toggleGrupo(this,'${idUnico}')">
        <span>${bloco.label}</span><i class="toggle-chevron">&#9662;</i>
      </button>
      <div class="toggle-body" id="${idUnico}">
        <ul>${bloco.itens.map(item => `<li>${item}</li>`).join('')}</ul>
      </div>
    </div>`;
  }

  if (bloco.tipo === 'checklist_estatico')
    return `<ul class="cl-estatico">${bloco.itens.map(item => `<li>${item}</li>`).join('')}</ul>`;

  if (bloco.tipo === 'subtitulo')
    return `<p class="sec-subtitulo">${bloco.valor}</p>`;

  return ''; // tipo desconhecido — ignora silenciosamente
}

// Alias para compatibilidade com chamadas existentes no HTML
const renderBloco = renderizarBloco;

// -----------------------------------------------------------------
// SEÇÃO 7 — BUSCA FULL-TEXT
// -----------------------------------------------------------------

// Extrai todo o texto indexável de um tema para a busca
function extrairTextoTema(tema) {
  const trechos = [];
  const adicionar = (secao, texto) => {
    if (texto && texto.trim()) trechos.push({ secao, texto: texto.trim() });
  };

  // Metadados do tema
  adicionar(tema.nome, tema.desc || '');
  adicionar(tema.nome, tema.resumo || '');

  // Seções e blocos
  tema.secoes.forEach(secao => {
    secao.conteudo.forEach(bloco => {
      if (!bloco) return;
      if (bloco.valor) adicionar(secao.titulo, bloco.valor);
      if (bloco.texto) adicionar(secao.titulo, bloco.texto);
      if (bloco.titulo) adicionar(secao.titulo, bloco.titulo);
      if (bloco.itens) bloco.itens.forEach(item => adicionar(secao.titulo, item));
      if (bloco.cabecalho) adicionar(secao.titulo, bloco.cabecalho.join(' '));
      if (bloco.linhas) bloco.linhas.forEach(linha => adicionar(secao.titulo, linha.join(' ')));
    });
  });

  // FAQ e legislação
  tema.faq.forEach(item => {
    adicionar('Perguntas Frequentes', item.pergunta);
    adicionar('Perguntas Frequentes', item.resposta);
  });
  tema.legislacao.forEach(lei => {
    adicionar('Legislação', lei.nome + ' ' + lei.desc);
  });

  return trechos;
}

function destacarOcorrencia(texto, regex) {
  return texto.replace(regex, correspondencia => `<mark>${correspondencia}</mark>`);
}

function extrairTrecho(texto, regex, tamanhoMaximo = 160) {
  const posicao = texto.search(regex);
  if (posicao === -1) return null;
  const inicio = Math.max(0, posicao - 60);
  const fim = Math.min(texto.length, inicio + tamanhoMaximo);
  const trecho = (inicio > 0 ? '…' : '') + texto.slice(inicio, fim) + (fim < texto.length ? '…' : '');
  return destacarOcorrencia(trecho, regex);
}

function buscar(termoBusca) {
  termoBusca = (termoBusca || '').trim();
  if (!termoBusca) return;

  const termoEscapado = termoBusca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  mostrarPagina('pg-busca');

  const resultados = [];
  temas.forEach(tema => {
    const regex = new RegExp(termoEscapado, 'gi');
    const trechosTema = extrairTextoTema(tema);
    const correspondencias = [];
    const secoesVistas = new Set();

    trechosTema.forEach(({ secao, texto }) => {
      regex.lastIndex = 0;
      if (!regex.test(texto)) return;
      regex.lastIndex = 0;
      if (!secoesVistas.has(secao)) {
        secoesVistas.add(secao);
        const trecho = extrairTrecho(texto, regex);
        if (trecho) correspondencias.push({ secao, trecho });
      }
    });

    regex.lastIndex = 0;
    const nomeCorresponde = regex.test(tema.nome + ' ' + tema.desc);
    regex.lastIndex = 0;

    if (correspondencias.length > 0 || nomeCorresponde) {
      resultados.push({ tema, correspondencias });
    }
  });

  // Exibe o cabeçalho de resultado
  document.getElementById('busca-info').innerHTML = resultados.length
    ? `<strong>${resultados.length}</strong> tema(s) com resultados para <strong>"${termoBusca}"</strong>`
    : `Nenhum resultado para <strong>"${termoBusca}"</strong>.`;

  if (!resultados.length) {
    document.getElementById('busca-lista').innerHTML =
      `<p style="color:var(--cinza-suav);margin-top:8px">Tente outros termos ou verifique a ortografia.</p>`;
    return;
  }

  const MAXIMO_TRECHOS_POR_TEMA = 3;
  document.getElementById('busca-lista').innerHTML = resultados.map(({ tema, correspondencias }) => {
    const nomeDestacado = destacarOcorrencia(tema.nome, new RegExp(termoEscapado, 'gi'));
    const trechosHtml = correspondencias.slice(0, MAXIMO_TRECHOS_POR_TEMA).map(c =>
      `<div class="ri-onde">${c.secao}</div>
       <div class="ri-trecho">${c.trecho}</div>`
    ).join('');
    const maisOcorrencias = correspondencias.length > MAXIMO_TRECHOS_POR_TEMA
      ? `<div class="ri-mais">+${correspondencias.length - MAXIMO_TRECHOS_POR_TEMA} ocorrência(s) neste tema</div>`
      : '';
    return `<div class="ri" onclick="abrirTema('${tema.id}')">
      <span class="ri-tema-badge">${tema.icone} ${tema.nome}</span>
      <h4>${nomeDestacado}</h4>
      ${trechosHtml}${maisOcorrencias}
    </div>`;
  }).join('');
}

// -----------------------------------------------------------------
// SEÇÃO 8 — FILTROS E AGRUPAMENTO DE TEMAS
// -----------------------------------------------------------------

// Converte "20-21" → 20, "1" → 1, para ordenação correta por capítulo
function converterNumeroCapitulo(numero) {
  if (!numero && numero !== 0) return 999;
  const valor = parseInt(String(numero).split('-')[0]);
  return isNaN(valor) ? 999 : valor;
}

let filtroTagAtivo = ''; // tag selecionada no filtro de temas

function renderizarListaTemas(filtroTexto, filtroTag) {
  const container = document.getElementById('pt-lista-wrap');
  if (!container) return;

  // Ordenar por número de capítulo
  const temasOrdenados = [...temas].sort((a, b) =>
    converterNumeroCapitulo(a.num) - converterNumeroCapitulo(b.num)
  );

  // Aplicar filtros
  const textoBusca = (filtroTexto || '').toLowerCase().trim();
  const tagBusca = (filtroTag || '').toLowerCase().trim();

  const temasFiltrados = temasOrdenados.filter(tema => {
    const correspondeTexto = !textoBusca ||
      tema.nome.toLowerCase().includes(textoBusca) ||
      tema.desc.toLowerCase().includes(textoBusca) ||
      (tema.tags || []).some(tag => tag.toLowerCase().includes(textoBusca));
    const correspondeTag = !tagBusca ||
      (tema.tags || []).some(tag => tag.toLowerCase() === tagBusca);
    return correspondeTexto && correspondeTag;
  });

  if (!temasFiltrados.length) {
    container.innerHTML = '<div class="pt-vazio">Nenhum tema encontrado para este filtro.</div>';
    return;
  }

  // Com filtro ativo: lista simples sem agrupamento
  if (textoBusca || tagBusca) {
    container.innerHTML = `
      <div class="pt-grupo">
        <div class="pt-grupo-titulo">${temasFiltrados.length} tema(s) encontrado(s)</div>
        <div class="pt-lista">${temasFiltrados.map(tema => htmlItemTema(tema)).join('')}</div>
      </div>`;
    return;
  }

  // Sem filtro: agrupar por categoria
  const nomesGrupos = {
    'fundamental': 'Fundamentos da Gestão Pública',
    'financeiro': 'Finanças e Orçamento',
    'transferências': 'Transferências e Parcerias',
    'controle': 'Controle e Fiscalização',
    'compliance': 'Integridade e Compliance',
    'pessoal': 'Gestão de Pessoal',
    'indenização': 'Indenizações',
    'licitação': 'Licitações e Contratos'
  };

  const prioridadeGrupos = Object.keys(nomesGrupos);
  const grupos = {};

  temasFiltrados.forEach(tema => {
    const tags = tema.tags || ['geral'];
    let grupo = 'geral';
    for (const prioridade of prioridadeGrupos) {
      if (tags.some(tag => tag.toLowerCase() === prioridade)) {
        grupo = prioridade;
        break;
      }
    }
    if (!grupos[grupo]) grupos[grupo] = [];
    grupos[grupo].push(tema);
  });

  const ordemGrupos = [...prioridadeGrupos, 'geral'];
  let html = '';
  ordemGrupos.forEach(grupo => {
    if (!grupos[grupo] || !grupos[grupo].length) return;
    const nomeGrupo = nomesGrupos[grupo] || grupo.charAt(0).toUpperCase() + grupo.slice(1);
    html += `<div class="pt-grupo">
      <div class="pt-grupo-titulo">${nomeGrupo}</div>
      <div class="pt-lista">${grupos[grupo].map(tema => htmlItemTema(tema)).join('')}</div>
    </div>`;
  });
  container.innerHTML = html;
}

function htmlItemTema(tema) {
  const tagsHtml = (tema.tags || []).map(tag => `<span class="pt-tag">${tag}</span>`).join('');
  return `<div class="pt-item" onclick="abrirTema('${tema.id}')">
    <div class="pt-ic">${tema.icone}</div>
    <div class="pt-info">
      <div class="pt-nome">${tema.nome}</div>
      <div class="pt-desc">${tema.desc}</div>
      ${tagsHtml ? `<div class="pt-tags">${tagsHtml}</div>` : ''}
    </div>
    <div class="pt-seta">›</div>
  </div>`;
}

function filtrarTemas(texto) {
  renderizarListaTemas(texto, filtroTagAtivo);
}

function filtrarPorTag(tag, botao) {
  filtroTagAtivo = (filtroTagAtivo === tag) ? '' : tag;
  document.querySelectorAll('.pt-filtro').forEach(btn => btn.classList.remove('on'));
  if (filtroTagAtivo) botao.classList.add('on');
  renderizarListaTemas(document.getElementById('pt-inp')?.value || '', filtroTagAtivo);
}

// Aliases para compatibilidade com o HTML existente
const renderTemas = renderizarListaTemas;
const _ptItemHtml = htmlItemTema;
const _numSort = converterNumeroCapitulo;

// -----------------------------------------------------------------
// SEÇÃO 9 — COMPONENTES INTERATIVOS
// -----------------------------------------------------------------

// FAQ accordion — abre/fecha respostas
function toggleFaq(botao) {
  const resposta = botao.nextElementSibling;
  const estaAberto = botao.classList.contains('on');
  // Fecha todos os outros
  document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.classList.remove('on');
    btn.nextElementSibling.classList.remove('on');
  });
  // Abre o clicado (se estava fechado)
  if (!estaAberto) {
    botao.classList.add('on');
    resposta.classList.add('on');
  }
}

// Toggle group — lista expansível
function toggleGrupo(botao, idConteudo) {
  const conteudo = document.getElementById(idConteudo);
  const estaAberto = botao.classList.contains('on');
  botao.classList.toggle('on', !estaAberto);
  conteudo.classList.toggle('on', !estaAberto);
}

// Alias para compatibilidade
const toggleGrp = toggleGrupo;

// Checklist interativo — marca/desmarca itens
function marcarChecklist(itemLista) {
  itemLista.classList.toggle('ck');
  const total = document.querySelectorAll('#cl-lista li').length;
  const concluidos = document.querySelectorAll('#cl-lista li.ck').length;
  document.getElementById('cl-pct').textContent = `${concluidos} / ${total}`;
  document.getElementById('cl-bar').style.width = (concluidos / total * 100) + '%';
}

// Alias para compatibilidade
const ck = marcarChecklist;

// -----------------------------------------------------------------
// SEÇÃO 10 — SCROLL SPY
// -----------------------------------------------------------------

// Destaca o item do sumário lateral conforme o usuário rola a página
function iniciarScrollSpy() {
  const secoes = document.querySelectorAll('.sec');
  const links = document.querySelectorAll('.pg-nav-a');
  window.addEventListener('scroll', () => {
    let secaoAtual = '';
    secoes.forEach(secao => {
      if (window.scrollY >= secao.offsetTop - 140) secaoAtual = secao.id;
    });
    links.forEach(link => {
      link.classList.remove('on');
      if (link.getAttribute('href') === '#' + secaoAtual) link.classList.add('on');
    });
  }, { passive: true });
}

// Alias para compatibilidade
const initScrollSpy = iniciarScrollSpy;

// -----------------------------------------------------------------
// SEÇÃO 11 — ACESSIBILIDADE
// -----------------------------------------------------------------

let tamanhoFonteBase = 100; // percentual — 100% = 16px padrão

function ajustarFonte(direcao) {
  if (direcao === 0) {
    tamanhoFonteBase = 100; // reset para padrão
  } else {
    // Cada passo = ~2px equivalente (12.5% de 16px)
    tamanhoFonteBase = Math.min(137, Math.max(81, tamanhoFonteBase + direcao * 12.5));
  }
  document.documentElement.style.fontSize = tamanhoFonteBase + '%';
}

function alternarAltoContraste() {
  document.body.classList.toggle('hi-c');
  document.getElementById('btn-hc').classList.toggle('on');
}

// Aliases para compatibilidade com o HTML existente
const setF = ajustarFonte;
const toggleHC = alternarAltoContraste;

// -----------------------------------------------------------------
// SEÇÃO 12 — EXPORTAÇÃO PARA PDF
// -----------------------------------------------------------------

function imprimirTema() {
  if (!temaAtual) return;
  const tema = temaAtual;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Dimensões da página
  const LARGURA_PAGINA = 210, ALTURA_PAGINA = 297;
  const MARGEM_ESQ = 18, MARGEM_DIR = 18, MARGEM_TOP = 18, MARGEM_BOT = 18;
  const LARGURA_CONTEUDO = LARGURA_PAGINA - MARGEM_ESQ - MARGEM_DIR;
  let posY = MARGEM_TOP;

  // Paleta de cores (valores RGB)
  const COR_AZUL = [0, 73, 135];
  const COR_AZUL_CLARO = [0, 196, 179];
  const COR_TEXTO = [30, 30, 30];
  const COR_TEXTO_MEDIO = [100, 100, 100];
  const COR_LINHA = [220, 225, 232];
  const COR_BRANCO = [255, 255, 255];
  const COR_LARANJA = [234, 88, 12];
  const COR_AMARELO = [202, 138, 4];
  const COR_VERDE = [22, 163, 74];
  const COR_FUNDO_INFO = [239, 246, 255];
  const COR_FUNDO_AVISO = [255, 247, 237];
  const COR_FUNDO_AMARELO = [254, 252, 232];
  const COR_FUNDO_SUCESSO = [240, 253, 244];

  // Helpers de desenho
  function novaPagina() {
    doc.addPage();
    posY = MARGEM_TOP;
    // Rodapé da nova página
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_TEXTO_MEDIO);
    const dataExportacao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text('Manual do Gestor Público · CAGE RS', MARGEM_ESQ, ALTURA_PAGINA - 10);
    doc.text(`Exportado em ${dataExportacao}`, LARGURA_PAGINA / 2, ALTURA_PAGINA - 10, { align: 'center' });
    doc.text(String(doc.internal.getNumberOfPages()), LARGURA_PAGINA - MARGEM_DIR, ALTURA_PAGINA - 10, { align: 'right' });
  }

  function verificarEspacoY(alturaMinima) {
    if (posY + alturaMinima > ALTURA_PAGINA - MARGEM_BOT) novaPagina();
  }

  function desenharRetangulo(x, y, largura, altura, cor, raio = 0) {
    doc.setFillColor(...cor);
    doc.roundedRect(x, y, largura, altura, raio, raio, 'F');
  }

  function desenharBlocoColorido(bloco) {
    const LARGURA_ICONE = 8;
    const textoTitulo = doc.splitTextToSize(bloco.titulo || '', LARGURA_CONTEUDO - LARGURA_ICONE - 6);
    const textoCorpo = doc.splitTextToSize(bloco.texto || '', LARGURA_CONTEUDO - LARGURA_ICONE - 6);
    const alturaTotal = (textoTitulo.length + textoCorpo.length) * 4.5 + 8;
    verificarEspacoY(alturaTotal);

    const corFundo =
      bloco.tipo === 'info' ? COR_FUNDO_INFO :
      bloco.tipo === 'atencao' ? COR_FUNDO_AVISO :
      bloco.tipo === 'aviso' ? COR_FUNDO_AMARELO : COR_FUNDO_SUCESSO;

    const corTextoTipo =
      bloco.tipo === 'info' ? COR_AZUL :
      bloco.tipo === 'atencao' ? COR_LARANJA :
      bloco.tipo === 'aviso' ? COR_AMARELO : COR_VERDE;

    desenharRetangulo(MARGEM_ESQ, posY, LARGURA_CONTEUDO, alturaTotal, corFundo, 2);

    // Indicador lateral colorido no lugar do ícone emoji
    const larguraIndicador = 4;
    desenharRetangulo(MARGEM_ESQ, posY, larguraIndicador, alturaTotal, corTextoTipo, 1);

    // Título e texto
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COR_TEXTO);
    let linhaY = posY + 5;
    textoTitulo.forEach(linha => { doc.text(linha, MARGEM_ESQ + larguraIndicador + 4, linhaY); linhaY += 4.5; });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_TEXTO_MEDIO);
    textoCorpo.forEach(linha => { doc.text(linha, MARGEM_ESQ + larguraIndicador + 4, linhaY); linhaY += 4.5; });
    posY += alturaTotal + 3;
  }

  function desenharBloco(bloco) {
    if (!bloco) return;

    if (bloco.tipo === 'texto') {
      const linhas = doc.splitTextToSize(bloco.valor || '', LARGURA_CONTEUDO);
      const altura = linhas.length * 4.5 + 4;
      verificarEspacoY(altura);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COR_TEXTO);
      linhas.forEach(linha => { doc.text(linha, MARGEM_ESQ, posY); posY += 4.5; });
      posY += 4;
    }

    else if (bloco.tipo === 'subtitulo') {
      const linhas = doc.splitTextToSize(bloco.valor || '', LARGURA_CONTEUDO);
      const altura = linhas.length * 5 + 4;
      verificarEspacoY(altura);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COR_AZUL);
      linhas.forEach(linha => { doc.text(linha, MARGEM_ESQ, posY); posY += 5; });
      posY += 3;
    }

    else if (bloco.tipo === 'lista' || bloco.tipo === 'lista_numerada') {
      const itens = bloco.itens || [];
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COR_TEXTO);
      itens.forEach((item, indice) => {
        // Limpar caracteres especiais que causam encoding issues no jsPDF
        const textoLimpo = item
          .replace(/[^\x00-\x7E\u00C0-\u017E]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const prefixo = bloco.tipo === 'lista_numerada' ? `${indice + 1}.` : '-';
        const linhas = doc.splitTextToSize(textoLimpo, LARGURA_CONTEUDO - 10);
        verificarEspacoY(linhas.length * 4.5 + 2);
        doc.setFont('helvetica', 'bold');
        doc.text(prefixo, MARGEM_ESQ + 2, posY);
        doc.setFont('helvetica', 'normal');
        linhas.forEach(linha => {
          doc.text(linha, MARGEM_ESQ + 8, posY);
          posY += 4.5;
        });
        posY += 1;
      });
      posY += 3;
    }

    else if (['info', 'atencao', 'aviso', 'sucesso'].includes(bloco.tipo)) {
      desenharBlocoColorido(bloco);
    }

    else if (bloco.tipo === 'tabela') {
      const cabecalho = bloco.cabecalho || [];
      const linhas = bloco.linhas || [];
      const larguraColunas = LARGURA_CONTEUDO / cabecalho.length;

      verificarEspacoY(10);
      desenharRetangulo(MARGEM_ESQ, posY, LARGURA_CONTEUDO, 7, COR_AZUL, 2);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COR_BRANCO);
      cabecalho.forEach((col, indice) => {
        doc.text(col, MARGEM_ESQ + larguraColunas * indice + 2, posY + 5);
      });
      posY += 7;

      linhas.forEach((linha, indiceLinha) => {
        const alturaLinha = 6;
        verificarEspacoY(alturaLinha);
        if (indiceLinha % 2 === 0) {
          desenharRetangulo(MARGEM_ESQ, posY, LARGURA_CONTEUDO, alturaLinha, [245, 247, 250]);
        }
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COR_TEXTO);
        linha.forEach((celula, indice) => {
          const texto = doc.splitTextToSize(String(celula || ''), larguraColunas - 4);
          doc.text(texto[0] || '', MARGEM_ESQ + larguraColunas * indice + 2, posY + 4);
        });
        posY += alturaLinha;
      });
      posY += 4;
    }
  }

  // ── Capa do PDF ──────────────────────────────────────────────
  desenharRetangulo(0, 0, LARGURA_PAGINA, 60, COR_AZUL);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COR_BRANCO);
  doc.text('CAGE RS · Manual do Gestor Público', MARGEM_ESQ, 20);

  doc.setFontSize(22);
  const linhasTitulo = doc.splitTextToSize(tema.nome, LARGURA_CONTEUDO - 20);
  linhasTitulo.forEach((linha, indice) => { doc.text(linha, MARGEM_ESQ, 33 + indice * 9); });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${tema.atualizacao}`, MARGEM_ESQ, 55);

  posY = 72;

  // Resumo
  if (tema.resumo) {
    const linhasResumo = doc.splitTextToSize(tema.resumo, LARGURA_CONTEUDO);
    verificarEspacoY(linhasResumo.length * 4.5 + 8);
    desenharRetangulo(MARGEM_ESQ, posY, LARGURA_CONTEUDO, linhasResumo.length * 4.5 + 8, COR_FUNDO_INFO, 2);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COR_AZUL);
    let linhaY = posY + 6;
    linhasResumo.forEach(linha => { doc.text(linha, MARGEM_ESQ + 4, linhaY); linhaY += 4.5; });
    posY += linhasResumo.length * 4.5 + 12;
  }

  // ── Seções de conteúdo ───────────────────────────────────────
  tema.secoes.forEach((secao, indice) => {
    verificarEspacoY(14);
    desenharRetangulo(MARGEM_ESQ, posY, LARGURA_CONTEUDO, 9, COR_AZUL, 2);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COR_BRANCO);
    doc.text(`${indice + 1}. ${secao.titulo}`, MARGEM_ESQ + 5, posY + 6.2);
    posY += 13;

    secao.conteudo.forEach(bloco => desenharBloco(bloco));
    posY += 4;
  });

  // ── FAQ no PDF ───────────────────────────────────────────────
  if (tema.faq && tema.faq.length > 0) {
    verificarEspacoY(14);
    desenharRetangulo(MARGEM_ESQ, posY, LARGURA_CONTEUDO, 9, COR_AZUL, 2);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COR_BRANCO);
    doc.text(`${tema.secoes.length + 1}. Perguntas Frequentes`, MARGEM_ESQ + 5, posY + 6.2);
    posY += 13;

    tema.faq.forEach((item, indice) => {
      const linhaPergunta = doc.splitTextToSize(`${indice + 1}. ${item.pergunta}`, LARGURA_CONTEUDO - 4);
      const linhasResposta = doc.splitTextToSize(item.resposta, LARGURA_CONTEUDO - 8);
      const alturaTotal = (linhaPergunta.length + linhasResposta.length) * 4.5 + 10;
      verificarEspacoY(alturaTotal);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COR_AZUL);
      linhaPergunta.forEach(linha => { doc.text(linha, MARGEM_ESQ + 2, posY); posY += 4.5; });

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COR_TEXTO_MEDIO);
      linhasResposta.forEach(linha => { doc.text(linha, MARGEM_ESQ + 4, posY); posY += 4.3; });

      doc.setDrawColor(...COR_LINHA);
      doc.setLineWidth(0.2);
      doc.line(MARGEM_ESQ, posY + 1, MARGEM_ESQ + LARGURA_CONTEUDO, posY + 1);
      posY += 5;
    });
  }

  // ── Legislação no PDF ────────────────────────────────────────
  if (tema.legislacao && tema.legislacao.length > 0) {
    verificarEspacoY(14);
    desenharRetangulo(MARGEM_ESQ, posY, LARGURA_CONTEUDO, 9, COR_AZUL, 2);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COR_BRANCO);
    doc.text(`${tema.secoes.length + 2}. Legislação Relacionada`, MARGEM_ESQ + 5, posY + 6.2);
    posY += 13;

    tema.legislacao.forEach(lei => {
      const linhasNome = doc.splitTextToSize(lei.nome, LARGURA_CONTEUDO - 22);
      const linhasDesc = doc.splitTextToSize(lei.desc || '', LARGURA_CONTEUDO - 22);
      const alturaLei = (linhasNome.length + linhasDesc.length) * 4.3 + 6;
      verificarEspacoY(alturaLei);

      const larguraBadge = 14;
      desenharRetangulo(MARGEM_ESQ, posY, larguraBadge, alturaLei - 2, COR_FUNDO_INFO, 2);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COR_AZUL);
      doc.text(lei.tipo, MARGEM_ESQ + larguraBadge / 2, posY + alturaLei / 2 + 1, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COR_TEXTO);
      linhasNome.forEach((linha, indice) => doc.text(linha, MARGEM_ESQ + larguraBadge + 4, posY + 4 + indice * 4.3));

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COR_TEXTO_MEDIO);
      linhasDesc.forEach((linha, indice) =>
        doc.text(linha, MARGEM_ESQ + larguraBadge + 4, posY + 4 + linhasNome.length * 4.3 + indice * 4)
      );
      posY += alturaLei + 1;
    });
  }

  // ── Salva o PDF ──────────────────────────────────────────────
  const nomeArquivo = tema.nome
    .replace(/[^a-zA-Z0-9\u00C0-\u017E\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  doc.save(`Manual-Gestor-${nomeArquivo}.pdf`);
}

// -----------------------------------------------------------------
// INICIALIZAÇÃO
// -----------------------------------------------------------------
init();
