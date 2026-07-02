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
// SEGURANÇA — Sanitização de HTML
// Todas as inserções de conteúdo dinâmico no DOM passam por esta
// função, que usa o DOMPurify para prevenir ataques XSS.
// DOMPurify é carregado via CDN no index.html antes deste script.
// -----------------------------------------------------------------

// Contador global para gerar IDs únicos de forma segura (sem Math.random)
let _contadorId = 0;
function gerarIdUnico(prefixo = 'id') {
  return `${prefixo}_${++_contadorId}`;
}

function definirHTML(elemento, html) {
  if (typeof DOMPurify !== 'undefined') {
    // DOMPurify remove onclick por segurança — usamos data-acao em vez disso
    elemento.innerHTML = DOMPurify.sanitize(html, {
      ADD_ATTR: ['data-acao', 'data-id', 'data-versao', 'target', 'rel'],
      FORCE_BODY: false
    });
  } else {
    // Fallback: criar elemento temporário e usar apenas nós de texto seguros
    const temp = document.createElement('div');
    // Sem DOMPurify, limpa scripts manualmente antes de inserir
    const htmlLimpo = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\son\w+\s*=/gi, ' data-removed=');
    temp.innerHTML = htmlLimpo;
    while (elemento.firstChild) elemento.removeChild(elemento.firstChild);
    while (temp.firstChild) elemento.appendChild(temp.firstChild);
  }
}

// Event delegation global — captura cliques em elementos com data-acao
// em vez de usar onclick inline (que é bloqueado pelo DOMPurify por segurança)
document.addEventListener('click', function(e) {
  const el = e.target.closest('[data-acao]');
  if (!el) return;
  const acao = el.getAttribute('data-acao');
  const id = el.getAttribute('data-id');
  const versao = el.getAttribute('data-versao');

  switch(acao) {
    case 'abrirTema':       abrirTema(id); break;
    case 'irParaHome':      irParaHome(); break;
    case 'irParaTemas':     irParaTemas(); break;
    case 'irParaLegislacao': irParaLegislacao(); break;
    case 'irParaCAGE':      irParaCAGE(); break;
    case 'irParaContato':   irParaContato(); break;
    case 'imprimirTema':    imprimirTema(); break;
    case 'toggleFaq':       toggleFaq(el); break;
    case 'toggleGrupo':     toggleGrupo(el, id); break;
    case 'marcarChecklist': marcarChecklist(el.closest('li')); break;
    case 'restaurarVersao': restaurarVersao(id, parseInt(versao)); break;
    case 'filtrarPorTag':   filtrarPorTag(id, el); break;
    case 'buscar':
      const inp = document.getElementById('hero-inp');
      if (inp) buscar(inp.value);
      break;
    case 'buscarPt':
      const inpPt = document.getElementById('pt-inp');
      if (inpPt) filtrarTemas(inpPt.value);
      break;
    case 'voltarTopo':
      window.scrollTo({top:0, behavior:'smooth'});
      break;
  }
});

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

  // Estatísticas do hero — construção DOM direta (sem innerHTML)
  const heroStats = document.getElementById('hero-stats');
  heroStats.replaceChildren();
  [
    [temas.length, 'temas'],
    [siteConfig.ultima_atualizacao, 'última atualização'],
    ['RS', 'Governo do Estado']
  ].forEach(([valor, label]) => {
    const div = document.createElement('div');
    div.className = 'hero-stat';
    const strong = document.createElement('strong');
    strong.textContent = valor;
    const span = document.createElement('span');
    span.textContent = label;
    div.append(strong, span);
    heroStats.appendChild(div);
  });

  // Menu de navegação — HTML estático, sem dados do JSON
  definirHTML(document.getElementById('h-nav'), `
    <a href="#" data-acao="irParaHome" id="nav-inicio" class="on">Início</a>
    <a href="#" data-acao="irParaTemas" id="nav-temas">Temas</a>
    <a href="#" data-acao="irParaLegislacao" id="nav-leg">Legislação</a>
    <a href="#" data-acao="irParaContato" id="nav-contato">Entre em Contato</a>
    <a href="#" data-acao="irParaCAGE" id="nav-cage">Sobre a CAGE</a>`);

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
  card.dataset.acao = 'abrirTema';
  card.dataset.id = tema.id;

  // Ícone
  const ic = document.createElement('div');
  ic.className = 'tc-ic';
  ic.textContent = tema.icone;

  // Nome
  const nm = document.createElement('div');
  nm.className = 'tc-nm';
  nm.textContent = tema.nome;

  // Descrição
  const ds = document.createElement('div');
  ds.className = 'tc-ds';
  ds.textContent = tema.desc;

  // Tags
  const tagsDiv = document.createElement('div');
  tagsDiv.className = 'tc-tags';
  (tema.tags || []).forEach(tag => {
    const span = document.createElement('span');
    span.className = 'tc-tag' + (tag === 'novo' ? ' novo' : '');
    span.textContent = tag === 'novo' ? '🆕 Novo' : tag;
    tagsDiv.appendChild(span);
  });

  card.append(ic, nm, ds, tagsDiv);
  return card;
}

function montarCardsHome() {
  const gridDest = document.getElementById('grid-dest');
  const gridTodos = document.getElementById('grid-todos');
  temas.filter(tema => tema.destaque).forEach(tema => gridDest.appendChild(criarCardTema(tema)));
  temas.forEach(tema => gridTodos.appendChild(criarCardTema(tema)));
}

function montarFaqHome() {
  const el = document.getElementById('faq-home');
  el.replaceChildren();
  dados.faq_home.forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.dataset.acao = 'abrirTema';
    a.dataset.id = item.tema_id;
    a.textContent = item.pergunta;
    li.appendChild(a);
    el.appendChild(li);
  });
}

function montarAtualizacoesHome() {
  const el = document.getElementById('atu-home');
  el.replaceChildren();
  dados.atualizacoes.forEach(atu => {
    const div = document.createElement('div');
    div.className = 'ai';

    const span = document.createElement('span');
    span.className = 'atu-d';
    span.textContent = atu.data;

    const texto = document.createElement('div');
    texto.className = 'atu-t';
    const strong = document.createElement('strong');
    strong.textContent = atu.tema + ':';
    texto.appendChild(strong);
    texto.append(' ' + atu.texto);

    div.append(span, texto);
    el.appendChild(div);
  });
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

  [...todasAsTags].sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(tag => {
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

  // Badges (atualizado, novo) — construção DOM direta
  const pgBadges = document.getElementById('pg-badges');
  pgBadges.replaceChildren();
  const badgeV = document.createElement('span');
  badgeV.className = 'pg-b v';
  badgeV.textContent = '✔ Atualizado — ' + tema.atualizacao;
  pgBadges.appendChild(badgeV);
  if (tema.tags.includes('novo')) {
    const badgeL = document.createElement('span');
    badgeL.className = 'pg-b l';
    badgeL.textContent = '🆕 Novo';
    pgBadges.appendChild(badgeL);
  }

  // Monta a navegação lateral (sumário)
  montarNavLateral(tema);

  // Chips de legislação na sidebar — construção DOM direta
  const sideLeg = document.getElementById('side-leg');
  sideLeg.replaceChildren();
  const h4 = document.createElement('h4');
  h4.textContent = 'Normas principais';
  sideLeg.appendChild(h4);
  tema.legislacao.slice(0, 4).forEach(lei => {
    const chip = document.createElement('span');
    chip.className = 'lchip';
    chip.textContent = lei.nome.split(' ').slice(0, 2).join(' ');
    sideLeg.appendChild(chip);
  });

  // Monta o conteúdo principal — construção DOM direta
  const pgCont = document.getElementById('pg-cont');
  pgCont.replaceChildren(montarConteudoTema(tema));

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

  const nav = document.getElementById('pg-nav');
  nav.replaceChildren();
  secoes.forEach((secao, indice) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + secao.id;
    a.className = 'pg-nav-a';
    const num = document.createElement('span');
    num.className = 'pn-num';
    num.textContent = indice + 1;
    a.append(num, secao.titulo);
    li.appendChild(a);
    nav.appendChild(li);
  });
}

// Cria um elemento com classe e textContent opcionais
function criarEl(tag, className, texto) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

// Cria o título de seção com número
function criarTituloSecao(num, titulo) {
  const h2 = criarEl('h2', 'sec-t');
  const span = criarEl('span', 'sec-num', num);
  h2.append(span, titulo);
  return h2;
}

function montarConteudoTema(tema) {
  const fragment = document.createDocumentFragment();

  // Seções de conteúdo
  tema.secoes.forEach((secao, indice) => {
    const section = document.createElement('section');
    section.className = 'sec';
    section.id = 's' + (indice + 1);
    section.appendChild(criarTituloSecao(indice + 1, secao.titulo));
    secao.conteudo.forEach(bloco => {
      const el = renderizarBloco(bloco);
      if (el) section.appendChild(el);
    });
    fragment.appendChild(section);
  });

  // Checklist operacional
  const totalItens = tema.checklist ? tema.checklist.length : 0;
  if (totalItens > 0) {
    const sec = document.createElement('section');
    sec.className = 'sec';
    sec.id = 's-cl';
    sec.appendChild(criarTituloSecao(tema.secoes.length + 1, 'Checklist operacional'));

    const p = criarEl('p', null, 'Clique nos itens para marcar como concluído.');
    const wrap = criarEl('div', 'cl-wrap');
    const hd = criarEl('div', 'cl-hd');
    const h4 = criarEl('h4', null, 'Processo completo — ' + tema.nome);
    const pct = criarEl('span', null, '0 / ' + totalItens);
    pct.id = 'cl-pct';
    hd.append(h4, pct);

    const prog = criarEl('div');
    prog.id = 'cl-prog';
    const bar = criarEl('div');
    bar.id = 'cl-bar';
    bar.style.width = '0%';
    prog.appendChild(bar);

    const ul = criarEl('ul', 'cl');
    ul.id = 'cl-lista';
    tema.checklist.forEach(item => {
      const li = document.createElement('li');
      li.dataset.acao = 'marcarChecklist';
      const cb = criarEl('div', 'cb');
      const span = criarEl('span', null, item);
      li.append(cb, span);
      ul.appendChild(li);
    });

    wrap.append(hd, prog, ul);
    sec.append(p, wrap);
    fragment.appendChild(sec);
  }

  // Perguntas frequentes
  const secFaq = document.createElement('section');
  secFaq.className = 'sec';
  secFaq.id = 's-faq';
  secFaq.appendChild(criarTituloSecao(tema.secoes.length + 2, 'Perguntas frequentes'));
  const ulFaq = criarEl('ul', 'faq-l');
  tema.faq.forEach(item => {
    const li = criarEl('li', 'faq-i');
    const btn = criarEl('button', 'faq-btn');
    btn.dataset.acao = 'toggleFaq';
    const q = criarEl('span', 'faq-q', item.pergunta);
    const ch = criarEl('i', 'faq-ch', '▾');
    btn.append(q, ch);
    const resp = criarEl('div', 'faq-r', item.resposta);
    li.append(btn, resp);
    ulFaq.appendChild(li);
  });
  secFaq.appendChild(ulFaq);
  fragment.appendChild(secFaq);

  // Legislação relacionada
  const secLeg = document.createElement('section');
  secLeg.className = 'sec';
  secLeg.id = 's-leg';
  secLeg.appendChild(criarTituloSecao(tema.secoes.length + 3, 'Legislação relacionada'));
  const lgGrid = criarEl('div', 'lg-grid');
  tema.legislacao.forEach(lei => {
    const tipoFormatado = lei.tipo.toLowerCase();
    const classeTipo =
      tipoFormatado === 'dec' ? 'dec' :
      tipoFormatado === 'res' ? 'res' :
      tipoFormatado === 'port' ? 'port' :
      (tipoFormatado === 'in' || tipoFormatado === 'instrução normativa') ? 'in' :
      tipoFormatado === 'circ' ? 'circ' :
      tipoFormatado === 'os' ? 'os' :
      (tipoFormatado === 'lc' || tipoFormatado === 'lei complementar') ? 'lc' : '';

    const item = lei.link
      ? document.createElement('a')
      : document.createElement('div');
    item.className = 'lg-c' + (lei.link ? ' clicavel' : '');
    if (lei.link) {
      item.href = lei.link;
      item.target = '_blank';
      item.rel = 'noopener';
      item.style.textDecoration = 'none';
    }
    const badge = criarEl('span', 'lg-tp ' + classeTipo, lei.tipo);
    const info = criarEl('div');
    info.style.flex = '1';
    const nm = criarEl('div', 'lg-nm', lei.nome);
    if (lei.link) {
      const icon = criarEl('span', 'lg-link-icon', '↗');
      nm.appendChild(icon);
    }
    const ds = criarEl('div', 'lg-ds', lei.desc);
    info.append(nm, ds);
    item.append(badge, info);
    lgGrid.appendChild(item);
  });
  secLeg.appendChild(lgGrid);
  fragment.appendChild(secLeg);

  // Temas relacionados
  const secRel = document.createElement('section');
  secRel.className = 'sec';
  secRel.id = 's-rel';
  secRel.appendChild(criarTituloSecao(tema.secoes.length + 4, 'Temas relacionados'));
  const relGrid = criarEl('div', 'rel-grid');
  tema.relacionados.forEach(idRel => {
    const temaRel = temas.find(t => t.id === idRel);
    if (!temaRel) return;
    const div = criarEl('div', 'rel-c');
    div.dataset.acao = 'abrirTema';
    div.dataset.id = temaRel.id;
    const ic = criarEl('span', null, temaRel.icone);
    ic.style.fontSize = '22px';
    const info = document.createElement('div');
    const nm = criarEl('div', 'rel-nm', temaRel.nome);
    const ds = criarEl('div', null, temaRel.desc.split('.')[0]);
    ds.style.cssText = 'font-size:12px;color:var(--cinza-suav);margin-top:2px';
    info.append(nm, ds);
    div.append(ic, info);
    relGrid.appendChild(div);
  });
  const btnTopo = criarEl('button', 'btn-topo', '↑ Voltar ao topo');
  btnTopo.dataset.acao = 'voltarTopo';
  secRel.append(relGrid, btnTopo);
  fragment.appendChild(secRel);

  return fragment;
}

// -----------------------------------------------------------------
// SEÇÃO 6 — RENDERIZAÇÃO DE BLOCOS DE CONTEÚDO
// -----------------------------------------------------------------
// Cada bloco retorna um elemento DOM (não uma string HTML)
// Tipos: texto, lista, lista_numerada, info, atencao, sucesso,
//        aviso, tabela, toggle_group, checklist_estatico, subtitulo

function renderizarBloco(bloco) {
  if (!bloco) return null;

  if (bloco.tipo === 'texto') {
    const p = document.createElement('p');
    p.textContent = bloco.valor;
    return p;
  }

  if (bloco.tipo === 'subtitulo') {
    const p = criarEl('p', 'sec-subtitulo', bloco.valor);
    return p;
  }

  if (bloco.tipo === 'lista' || bloco.tipo === 'lista_numerada') {
    const ul = document.createElement(bloco.tipo === 'lista' ? 'ul' : 'ol');
    (bloco.itens || []).forEach(item => {
      const li = criarEl('li', null, item);
      ul.appendChild(li);
    });
    return ul;
  }

  if (['info', 'atencao', 'sucesso', 'aviso'].includes(bloco.tipo)) {
    const icones = { info: '📌', atencao: '⚡', sucesso: '✔️', aviso: '⚠️' };
    const div = criarEl('div', 'box ' + bloco.tipo);
    const ic = criarEl('span', 'box-ic', icones[bloco.tipo]);
    const bd = criarEl('div', 'box-bd');
    const tl = criarEl('p', 'box-tl', bloco.titulo);
    const txt = criarEl('p', null, bloco.texto);
    bd.append(tl, txt);
    div.append(ic, bd);
    return div;
  }

  if (bloco.tipo === 'tabela') {
    const wrap = criarEl('div', 'tw');
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    (bloco.cabecalho || []).forEach(col => {
      const th = criarEl('th', null, col);
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    const tbody = document.createElement('tbody');
    (bloco.linhas || []).forEach(linha => {
      const tr = document.createElement('tr');
      linha.forEach(celula => {
        const td = criarEl('td', null, celula);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.append(thead, tbody);
    wrap.appendChild(table);
    return wrap;
  }

  if (bloco.tipo === 'toggle_group') {
    const idUnico = gerarIdUnico('tg');
    const div = criarEl('div', 'toggle-group');
    const btn = criarEl('button', 'toggle-btn');
    btn.dataset.acao = 'toggleGrupo';
    btn.dataset.id = idUnico;
    const spanLabel = criarEl('span', null, bloco.label);
    const chevron = criarEl('i', 'toggle-chevron', '▾');
    btn.append(spanLabel, chevron);
    const body = criarEl('div', 'toggle-body');
    body.id = idUnico;
    const ul = document.createElement('ul');
    (bloco.itens || []).forEach(item => ul.appendChild(criarEl('li', null, item)));
    body.appendChild(ul);
    div.append(btn, body);
    return div;
  }

  if (bloco.tipo === 'checklist_estatico') {
    const ul = criarEl('ul', 'cl-estatico');
    (bloco.itens || []).forEach(item => ul.appendChild(criarEl('li', null, item)));
    return ul;
  }

  return null; // tipo desconhecido
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

  // Exibe o cabeçalho de resultado — construção DOM direta
  const buscaInfo = document.getElementById('busca-info');
  buscaInfo.replaceChildren();
  if (resultados.length) {
    const s1 = document.createElement('strong');
    s1.textContent = resultados.length;
    const s2 = document.createElement('strong');
    s2.textContent = '"' + termoBusca + '"';
    buscaInfo.append(s1, ' tema(s) com resultados para ', s2);
  } else {
    const s = document.createElement('strong');
    s.textContent = '"' + termoBusca + '"';
    buscaInfo.append('Nenhum resultado para ', s, '.');
  }

  const buscaLista = document.getElementById('busca-lista');
  buscaLista.replaceChildren();

  if (!resultados.length) {
    const p = document.createElement('p');
    p.style.cssText = 'color:var(--cinza-suav);margin-top:8px';
    p.textContent = 'Tente outros termos ou verifique a ortografia.';
    buscaLista.appendChild(p);
    return;
  }

  const MAXIMO_TRECHOS_POR_TEMA = 3;
  resultados.forEach(({ tema, correspondencias }) => {
    const card = criarEl('div', 'ri');
    card.dataset.acao = 'abrirTema';
    card.dataset.id = tema.id;

    const badge = criarEl('span', 'ri-tema-badge', tema.icone + ' ' + tema.nome);
    const h4 = criarEl('h4', null, tema.nome);

    card.append(badge, h4);

    correspondencias.slice(0, MAXIMO_TRECHOS_POR_TEMA).forEach(c => {
      const onde = criarEl('div', 'ri-onde', c.secao);
      // O trecho já tem <mark> para destacar — usamos definirHTML aqui pois
      // o conteúdo é gerado internamente pela função destacarOcorrencia,
      // não vem diretamente do JSON
      const trecho = criarEl('div', 'ri-trecho');
      definirHTML(trecho, c.trecho);
      card.append(onde, trecho);
    });

    if (correspondencias.length > MAXIMO_TRECHOS_POR_TEMA) {
      const mais = criarEl('div', 'ri-mais',
        '+' + (correspondencias.length - MAXIMO_TRECHOS_POR_TEMA) + ' ocorrência(s) neste tema');
      card.appendChild(mais);
    }

    buscaLista.appendChild(card);
  });
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
    container.replaceChildren(criarEl('div', 'pt-vazio', 'Nenhum tema encontrado para este filtro.'));
    return;
  }

  const fragment = document.createDocumentFragment();

  // Com filtro ativo: lista simples
  if (textoBusca || tagBusca) {
    const grupo = criarEl('div', 'pt-grupo');
    const titulo = criarEl('div', 'pt-grupo-titulo', temasFiltrados.length + ' tema(s) encontrado(s)');
    const lista = criarEl('div', 'pt-lista');
    temasFiltrados.forEach(tema => lista.appendChild(criarItemTema(tema)));
    grupo.append(titulo, lista);
    fragment.appendChild(grupo);
    container.replaceChildren(fragment);
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

  [...prioridadeGrupos, 'geral'].forEach(grupo => {
    if (!grupos[grupo] || !grupos[grupo].length) return;
    const nomeGrupo = nomesGrupos[grupo] || grupo.charAt(0).toUpperCase() + grupo.slice(1);
    const divGrupo = criarEl('div', 'pt-grupo');
    const tituloGrupo = criarEl('div', 'pt-grupo-titulo', nomeGrupo);
    const lista = criarEl('div', 'pt-lista');
    grupos[grupo].forEach(tema => lista.appendChild(criarItemTema(tema)));
    divGrupo.append(tituloGrupo, lista);
    fragment.appendChild(divGrupo);
  });

  container.replaceChildren(fragment);
}

function criarItemTema(tema) {
  const div = criarEl('div', 'pt-item');
  div.dataset.acao = 'abrirTema';
  div.dataset.id = tema.id;

  const ic = criarEl('div', 'pt-ic', tema.icone);
  const info = criarEl('div', 'pt-info');
  const nome = criarEl('div', 'pt-nome', tema.nome);
  const desc = criarEl('div', 'pt-desc', tema.desc);
  info.append(nome, desc);

  if (tema.tags && tema.tags.length) {
    const tagsDiv = criarEl('div', 'pt-tags');
    tema.tags.forEach(tag => tagsDiv.appendChild(criarEl('span', 'pt-tag', tag)));
    info.appendChild(tagsDiv);
  }

  const seta = criarEl('div', 'pt-seta', '›');
  div.append(ic, info, seta);
  return div;
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
