// ── Carrega dados do conteudo.json ──────────────────────────────
let D, S, TEMAS;

async function init() {
  const res = await fetch('conteudo.json');
  D = await res.json();
  S = D.site;
  TEMAS = D.temas;
  main();
}

function main() {

// ── Preenche elementos estáticos ────────────────────────────────
document.title = S.titulo + ' — ' + S.orgao;
document.getElementById('h-sigla').textContent = 'CAGE';
document.getElementById('h-titulo').textContent = S.titulo;
document.getElementById('h-sub').textContent = S.subtitulo;
document.getElementById('hero-edicao').textContent = S.edicao;
document.getElementById('hero-titulo').textContent = S.titulo;
document.getElementById('hero-sub').textContent = 'O guia completo da ' + S.orgao + ' para gestores e servidores públicos estaduais. Consulte temas, legislação, procedimentos e perguntas frequentes.';
document.getElementById('footer-titulo').textContent = S.orgao + ' — ' + S.subtitulo;
document.getElementById('footer-sub').textContent = S.titulo + ' · ' + S.edicao + ' · Governo do Estado do Rio Grande do Sul';

document.getElementById('hero-stats').innerHTML = [
  [TEMAS.length,'temas'],[S.ultima_atualizacao,'última atualização'],['RS','Governo do Estado']
].map(([v,l])=>`<div class="hero-stat"><strong>${v}</strong><span>${l}</span></div>`).join('');

// Nav header
document.getElementById('h-nav').innerHTML =
  `<a href="#" onclick="goHome()" id="nav-inicio" class="on">Início</a>
   <a href="#" onclick="goTemas()" id="nav-temas">Temas</a>
   <a href="#" onclick="goLeg()" id="nav-leg">Legislação</a><a href="#" id="nav-mod">Modelos</a><a href="#" onclick="goCAGE()" id="nav-cage">Sobre a CAGE</a>`;

// ── Grids de cards ──────────────────────────────────────────────
function mkCard(t){
  const d=document.createElement('div');
  d.className='tc'+(t.destaque?' dest':'');
  d.innerHTML=`<div class="tc-n">Cap. ${t.num}</div>
    <div class="tc-ic">${t.icone}</div>
    <div class="tc-nm">${t.nome}</div>
    <div class="tc-ds">${t.desc}</div>
    <div class="tc-tags">${t.tags.map(g=>`<span class="tc-tag ${g==='novo'?'novo':''}">${g==='novo'?'🆕 Novo':g}</span>`).join('')}</div>`;
  d.onclick=()=>abrirTema(t.id);
  return d;
}
TEMAS.filter(t=>t.destaque).forEach(t=>document.getElementById('grid-dest').appendChild(mkCard(t)));
TEMAS.forEach(t=>document.getElementById('grid-todos').appendChild(mkCard(t)));

// ── FAQ home ────────────────────────────────────────────────────
document.getElementById('faq-home').innerHTML = D.faq_home.map(f=>
  `<li><a href="#" onclick="abrirTema('${f.tema_id}')">${f.pergunta}</a></li>`).join('');

// ── Atualizações home ───────────────────────────────────────────
document.getElementById('atu-home').innerHTML = D.atualizacoes.map(a=>
  `<div class="ai"><span class="atu-d">${a.data}</span><div class="atu-t"><strong>${a.tema}:</strong> ${a.texto}</div></div>`).join('');

// Montar chips de filtro ao carregar
(function(){
  const todasTags=new Set();
  TEMAS.forEach(t=>(t.tags||[]).forEach(tg=>todasTags.add(tg)));
  const labelMap={
    'fundamental':'Fundamentos','financeiro':'Finanças','transferências':'Transferências',
    'controle':'Controle','compliance':'Integridade','pessoal':'Pessoal',
    'indenização':'Indenizações','licitação':'Licitações'
  };
  const wrap=document.getElementById('pt-filtros');
  if(wrap){
    [...todasTags].sort().forEach(tag=>{
      const label=labelMap[tag]||tag;
      const btn=document.createElement('button');
      btn.className='pt-filtro';
      btn.textContent=label;
      btn.onclick=()=>filtrarPorTag(tag,btn);
      wrap.appendChild(btn);
    });
  }
})();

} // fim main()

// ── Roteamento ──────────────────────────────────────────────────
function show(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  window.scrollTo({top:0,behavior:'instant'});
}
function goHome(){
  show('pg-home');
  document.getElementById('h-inp').value='';
  document.querySelectorAll('.h-nav a').forEach(a=>a.classList.remove('on'));
  document.getElementById('nav-inicio')?.classList.add('on');
}

// ── Renderiza página interna ────────────────────────────────────
let _temaAtual=null;
function abrirTema(id){
  const t=TEMAS.find(x=>x.id===id);
  _temaAtual=t;
  if(!t){alert('Tema em construção — em breve disponível neste site.');return;}

  // hero
  document.getElementById('bc-tema').textContent=t.nome;
  document.getElementById('pg-ic').textContent=t.icone;
  document.getElementById('pg-titulo').textContent=t.nome;
  const resumoEl=document.getElementById('pg-resumo');resumoEl.textContent=t.resumo;resumoEl.style.display=t.resumo?'':`none`;
  document.getElementById('pg-resp').textContent='Responsável pela atualização: '+t.responsavel;
  document.getElementById('pg-badges').innerHTML=
    `<span class="pg-b v">✔ Atualizado — ${t.atualizacao}</span>
     <span class="pg-b a">Capítulo ${t.num}</span>
     ${t.tags.includes('novo')?'<span class="pg-b l">🆕 Novo</span>':''}`;

  // nav lateral
  const navEl=document.getElementById('pg-nav');
  const secoes=[...t.secoes.map((s,i)=>({id:'s'+(i+1),titulo:s.titulo})),
    {id:'s-cl',titulo:'Checklist operacional'},
    {id:'s-faq',titulo:'Perguntas frequentes'},
    {id:'s-leg',titulo:'Legislação'},
    {id:'s-rel',titulo:'Temas relacionados'}];
  navEl.innerHTML=secoes.map((s,i)=>
    `<li><a href="#${s.id}" class="pg-nav-a"><span class="pn-num">${i+1}</span>${s.titulo}</a></li>`).join('');

  // chips legislação na sidebar
  document.getElementById('side-leg').innerHTML=
    `<h4>Normas principais</h4>`+
    t.legislacao.slice(0,4).map(l=>`<span class="lchip">${l.nome.split(' ').slice(0,2).join(' ')}</span>`).join('');

  // conteúdo principal
  const cont=document.getElementById('pg-cont');
  let html='';

  // seções de conteúdo
  t.secoes.forEach((sec,i)=>{
    html+=`<section class="sec" id="s${i+1}">
      <h2 class="sec-t"><span class="sec-num">${i+1}</span>${sec.titulo}</h2>`;
    sec.conteudo.forEach(b=>{ html+=renderBloco(b); });
    html+='</section>';
  });

  // checklist
  const total=t.checklist?t.checklist.length:0;
  if(total>0){
  html+=`<section class="sec" id="s-cl">
    <h2 class="sec-t"><span class="sec-num">${t.secoes.length+1}</span>Checklist operacional</h2>
    <p>Clique nos itens para marcar como concluído.</p>
    <div class="cl-wrap">
      <div class="cl-hd"><h4>Processo completo — ${t.nome}</h4><span id="cl-pct">0 / ${total}</span></div>
      <div id="cl-prog"><div id="cl-bar" style="width:0%"></div></div>
      <ul class="cl" id="cl-lista">
        ${t.checklist.map(item=>`<li onclick="ck(this)"><div class="cb"></div><span>${item}</span></li>`).join('')}
      </ul>
    </div>
  </section>`;
  }

  // faq
  html+=`<section class="sec" id="s-faq">
    <h2 class="sec-t"><span class="sec-num">${t.secoes.length+2}</span>Perguntas frequentes</h2>
    <ul class="faq-l">
      ${t.faq.map(f=>`
        <li class="faq-i">
          <button class="faq-btn" onclick="toggleFaq(this)">
            <span class="faq-q">${f.pergunta}</span><i class="faq-ch">▾</i>
          </button>
          <div class="faq-r">${f.resposta}</div>
        </li>`).join('')}
    </ul>
  </section>`;

  // legislação
  html+=`<section class="sec" id="s-leg">
    <h2 class="sec-t"><span class="sec-num">${t.secoes.length+3}</span>Legislação relacionada</h2>
    <div class="lg-grid">
      ${t.legislacao.map(l=>{
        const tipo=l.tipo.toLowerCase();
        const cls=tipo==='dec'?'dec':tipo==='res'?'res':(tipo==='port')?'port':(tipo==='in'||tipo==='instrução normativa')?'in':(tipo==='circ')?'circ':(tipo==='os')?'os':(tipo==='lc'||tipo==='lei complementar')?'lc':'';
        const inner=`<span class="lg-tp ${cls}">${l.tipo}</span>
          <div style="flex:1"><div class="lg-nm">${l.nome}${l.link?` <span class="lg-link-icon">&#8599;</span>`:''}</div><div class="lg-ds">${l.desc}</div></div>`;
        return l.link
          ? `<a href="${l.link}" target="_blank" rel="noopener" class="lg-c clicavel" style="text-decoration:none">${inner}</a>`
          : `<div class="lg-c">${inner}</div>`;
      }).join('')}
    </div>
  </section>`;

  // relacionados
  html+=`<section class="sec" id="s-rel">
    <h2 class="sec-t"><span class="sec-num">${t.secoes.length+4}</span>Temas relacionados</h2>
    <div class="rel-grid">
      ${t.relacionados.map(rid=>{
        const r=TEMAS.find(x=>x.id===rid);
        return r?`<div class="rel-c" onclick="abrirTema('${r.id}')">
          <span style="font-size:22px">${r.icone}</span>
          <div><div class="rel-nm">${r.nome}</div>
          <div style="font-size:12px;color:var(--cinza-suav);margin-top:2px">${r.desc.split('.')[0]}</div></div></div>`:'';
      }).join('')}
    </div>
    <button class="btn-topo" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑ Voltar ao topo</button>
  </section>`;

  cont.innerHTML=html;
  show('pg-interna');
  initScrollSpy();
}

function renderBloco(b){
  const icons={info:'📌',atencao:'⚡',sucesso:'✔️',aviso:'⚠️'};
  if(b.tipo==='texto') return `<p>${b.valor}</p>`;
  if(b.tipo==='lista') return `<ul>${b.itens.map(i=>`<li>${i}</li>`).join('')}</ul>`;
  if(b.tipo==='lista_numerada') return `<ol>${b.itens.map(i=>`<li>${i}</li>`).join('')}</ol>`;
  if(['info','atencao','sucesso','aviso'].includes(b.tipo))
    return `<div class="box ${b.tipo}"><span class="box-ic">${icons[b.tipo]}</span>
      <div class="box-bd"><p class="box-tl">${b.titulo}</p><p>${b.texto}</p></div></div>`;
  if(b.tipo==='tabela')
    return `<div class="tw"><table>
      <thead><tr>${b.cabecalho.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${b.linhas.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
  if(b.tipo==='toggle_group'){
    const id='tg_'+Math.random().toString(36).slice(2,7);
    return `<div class="toggle-group">
      <button class="toggle-btn" onclick="toggleGrp(this,'${id}')">
        <span>${b.label}</span><i class="toggle-chevron">&#9662;</i>
      </button>
      <div class="toggle-body" id="${id}">
        <ul>${b.itens.map(i=>`<li>${i}</li>`).join('')}</ul>
      </div>
    </div>`;
  }
  if(b.tipo==='checklist_estatico')
    return `<ul class="cl-estatico">${b.itens.map(i=>`<li>${i}</li>`).join('')}</ul>`;
  if(b.tipo==='subtitulo')
    return `<p class="sec-subtitulo">${b.valor}</p>`;
  return '';
}

// ── Busca full-text ──────────────────────────────────────────────
function _extrairTexto(tema){
  // Retorna array de {onde, texto} com todo o conteúdo indexável do tema
  const chunks=[];
  const add=(onde,txt)=>{ if(txt&&txt.trim()) chunks.push({onde, txt:txt.trim()}); };

  // meta
  add(tema.nome, tema.desc||'');
  add(tema.nome, tema.resumo||'');

  // seções
  tema.secoes.forEach(sec=>{
    const onde=sec.titulo;
    sec.conteudo.forEach(b=>{
      if(!b) return;
      if(b.valor) add(onde, b.valor);
      if(b.texto) add(onde, b.texto);
      if(b.titulo) add(onde, b.titulo);
      if(b.itens) b.itens.forEach(i=>add(onde, i));
      if(b.cabecalho) add(onde, b.cabecalho.join(' '));
      if(b.linhas) b.linhas.forEach(r=>add(onde, r.join(' ')));
    });
  });

  // faq
  tema.faq.forEach(f=>{
    add('Perguntas Frequentes', f.pergunta);
    add('Perguntas Frequentes', f.resposta);
  });

  // legislação
  tema.legislacao.forEach(l=>{
    add('Legislação', l.nome+' '+l.desc);
  });

  return chunks;
}

function _highlight(txt, re){
  return txt.replace(re, m=>`<mark>${m}</mark>`);
}

function _trecho(txt, re, maxLen=160){
  const m=txt.search(re);
  if(m===-1) return null;
  const start=Math.max(0,m-60);
  const end=Math.min(txt.length, start+maxLen);
  let t=(start>0?'…':'')+txt.slice(start,end)+(end<txt.length?'…':'');
  return _highlight(t, re);
}

function buscar(v){
  v=(v||'').trim(); if(!v) return;
  const safe=v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp(safe,'gi');
  show('pg-busca');

  // Para cada tema, coletar todos os trechos que batem
  const resultados=[];
  TEMAS.forEach(t=>{
    // Nova instância da regex para cada tema — evita lastIndex acumulado
    const re2=new RegExp(safe,'gi');
    const chunks=_extrairTexto(t);
    const bates=[];
    const ondesVistas=new Set();

    chunks.forEach(({onde,txt})=>{
      re2.lastIndex=0;
      if(!re2.test(txt)) return;
      re2.lastIndex=0;
      if(!ondesVistas.has(onde)){
        ondesVistas.add(onde);
        const tr=_trecho(txt,re2);
        if(tr) bates.push({onde, trecho:tr});
      }
    });

    re2.lastIndex=0;
    const nomeMatch=re2.test(t.nome+' '+t.desc);
    re2.lastIndex=0;
    if(bates.length>0 || nomeMatch){
      resultados.push({t, bates});
    }
  });

  document.getElementById('busca-info').innerHTML=
    resultados.length
      ? `<strong>${resultados.length}</strong> tema(s) com resultados para <strong>"${v}"</strong>`
      : `Nenhum resultado para <strong>"${v}"</strong>.`;

  if(!resultados.length){
    document.getElementById('busca-lista').innerHTML=
      `<p style="color:var(--cinza-suav);margin-top:8px">Tente outros termos ou verifique a ortografia.</p>`;
    return;
  }

  document.getElementById('busca-lista').innerHTML=resultados.map(({t,bates})=>{
    const nomeDest=_highlight(t.nome, new RegExp(safe,'gi'));
    const MAX_TRECHOS=3;
    const trechosHtml=bates.slice(0,MAX_TRECHOS).map(b=>
      `<div class="ri-onde">${b.onde}</div>
       <div class="ri-trecho">${b.trecho}</div>`
    ).join('');
    const mais=bates.length>MAX_TRECHOS
      ? `<div class="ri-mais">+${bates.length-MAX_TRECHOS} ocorrência(s) neste tema</div>` : '';
    return `<div class="ri" onclick="abrirTema('${t.id}')">
      <span class="ri-tema-badge">${t.icone} Cap. ${t.num}</span>
      <h4>${nomeDest}</h4>
      ${trechosHtml}${mais}
    </div>`;
  }).join('');
}

// ── FAQ accordion ───────────────────────────────────────────────
function toggleGrp(btn,id){
  const body=document.getElementById(id);
  const on=btn.classList.contains('on');
  btn.classList.toggle('on',!on);
  body.classList.toggle('on',!on);
}
function toggleFaq(btn){
  const r=btn.nextElementSibling,on=btn.classList.contains('on');
  document.querySelectorAll('.faq-btn').forEach(b=>{b.classList.remove('on');b.nextElementSibling.classList.remove('on');});
  if(!on){btn.classList.add('on');r.classList.add('on');}
}

// ── Checklist ───────────────────────────────────────────────────
function ck(li){
  li.classList.toggle('ck');
  const total=document.querySelectorAll('#cl-lista li').length;
  const done=document.querySelectorAll('#cl-lista li.ck').length;
  document.getElementById('cl-pct').textContent=`${done} / ${total}`;
  document.getElementById('cl-bar').style.width=(done/total*100)+'%';
}

// ── Scroll spy ──────────────────────────────────────────────────
function initScrollSpy(){
  const secs=document.querySelectorAll('.sec');
  const links=document.querySelectorAll('.pg-nav-a');
  window.addEventListener('scroll',()=>{
    let cur='';
    secs.forEach(s=>{if(window.scrollY>=s.offsetTop-140)cur=s.id;});
    links.forEach(a=>{a.classList.remove('on');if(a.getAttribute('href')==='#'+cur)a.classList.add('on');});
  },{passive:true});
}

// ── Acessibilidade ──────────────────────────────────────────────
let fBase=16;
function setF(d){fBase=d===0?16:Math.min(22,Math.max(13,fBase+d*2));document.body.style.fontSize=fBase+'px';}
function toggleHC(){document.body.classList.toggle('hi-c');document.getElementById('btn-hc').classList.toggle('on');}

// ── Exportar PDF via jsPDF ────────────────────────────────────
function imprimirTema(){
  if(!_temaAtual){return;}
  const t=_temaAtual;
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});

  const PW=210, PH=297;
  const ML=18, MR=18, MT=18, MB=18;
  const CW=PW-ML-MR;
  let y=MT;

  // ── Paleta ──────────────────────────────────────────────────
  const AZUL=[0,73,135];
  const AZUL_CLA=[0,196,179];
  const CINZA_TEXT=[30,30,30];
  const CINZA_MED=[100,100,100];
  const CINZA_LIN=[220,225,232];
  const BRANCO=[255,255,255];
  const LARANJA=[234,88,12];
  const AMARELO=[202,138,4];
  const VERDE=[22,163,74];
  const INFO_BG=[239,246,255];
  const WARN_BG=[255,247,237];
  const YELL_BG=[254,252,232];
  const SUCS_BG=[240,253,244];

  // ── Helpers ─────────────────────────────────────────────────
  function newPage(){
    doc.addPage();
    y=MT;
    // rodapé
    doc.setFontSize(8);
    doc.setTextColor(...CINZA_MED);
    doc.text(`${t.nome} | Manual do Gestor Publico | CAGE RS`, ML, PH-8);
    doc.text(`${doc.internal.getNumberOfPages()}`, PW-ML, PH-8, {align:'right'});
  }

  function checkY(h){
    if(y+h>PH-MB-10) newPage();
  }

  function wrapText(txt, x, maxW, fSize){
    doc.setFontSize(fSize);
    return doc.splitTextToSize(String(txt||''), maxW);
  }

  function drawText(txt, x, fSize, color, style='normal', maxW=CW){
    doc.setFontSize(fSize);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    const lines=doc.splitTextToSize(String(txt||''), maxW);
    lines.forEach(ln=>{
      checkY(fSize*0.4+1);
      doc.text(ln, x, y);
      y+=fSize*0.38;
    });
    return lines.length;
  }

  function drawRect(rx,ry,rw,rh,fillColor,radius=2){
    doc.setFillColor(...fillColor);
    doc.setDrawColor(...fillColor);
    doc.roundedRect(rx,ry,rw,rh,radius,radius,'F');
  }

  function drawBox(titulo, texto, bgColor, accentColor){
    const pad=4, innerW=CW-pad*2-4;
    const bodyLines=doc.splitTextToSize(String(texto||''), innerW);
    const titleLines=titulo?doc.splitTextToSize(titulo, innerW):[];
    const lh=4.2;
    const h=pad*2+(titleLines.length+bodyLines.length)*lh+2;
    checkY(h+4);
    drawRect(ML, y, CW, h, bgColor, 2);
    doc.setFillColor(...accentColor);
    doc.rect(ML, y, 2.5, h, 'F');
    let by=y+pad+3;
    if(titulo){
      doc.setFontSize(8.5);doc.setFont('helvetica','bold');doc.setTextColor(...accentColor);
      titleLines.forEach(ln=>{doc.text(ln,ML+6,by);by+=lh;});
    }
    doc.setFontSize(8.5);doc.setFont('helvetica','normal');doc.setTextColor(...CINZA_TEXT);
    bodyLines.forEach(ln=>{doc.text(ln,ML+6,by);by+=lh;});
    y+=h+3;
  }

  function drawTable(cabecalho, linhas){
    if(!cabecalho||!linhas||!linhas.length) return;
    const ncols=cabecalho.length;
    const colW=CW/ncols;
    const lhMin=5.5;

    // header
    checkY(9);
    drawRect(ML, y, CW, 7.5, AZUL, 1);
    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(...BRANCO);
    cabecalho.forEach((h,i)=>{
      const lines=doc.splitTextToSize(String(h), colW-4);
      doc.text(lines[0], ML+i*colW+3, y+5);
    });
    y+=7.5;

    // rows
    linhas.forEach((row,ri)=>{
      const maxLines=Math.max(...row.map((_,ci)=>
        doc.splitTextToSize(String(row[ci]||''), colW-4).length
      ));
      const rh=Math.max(lhMin, maxLines*4)+3;
      checkY(rh);
      if(ri%2===0){drawRect(ML,y,CW,rh,INFO_BG,0);}
      doc.setDrawColor(...CINZA_LIN);
      doc.setLineWidth(0.2);
      doc.line(ML,y+rh,ML+CW,y+rh);
      doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(...CINZA_TEXT);
      row.forEach((cell,ci)=>{
        const lines=doc.splitTextToSize(String(cell||''), colW-4);
        lines.forEach((ln,li)=>{doc.text(ln, ML+ci*colW+3, y+4+li*4);});
      });
      y+=rh;
    });
    y+=4;
  }

  function drawBloco(b){
    if(!b||!b.tipo) return;
    const tipo=b.tipo;

    if(tipo==='texto'){
      checkY(8);
      doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(...CINZA_TEXT);
      const lines=doc.splitTextToSize(String(b.valor||''), CW);
      lines.forEach(ln=>{checkY(5);doc.text(ln,ML,y);y+=4.5;});
      y+=2;
    }
    else if(tipo==='subtitulo'){
      y+=2;checkY(8);
      doc.setFontSize(10);doc.setFont('helvetica','bold');doc.setTextColor(...AZUL);
      doc.text(String(b.valor||''),ML,y);
      y+=1;
      doc.setDrawColor(...AZUL_CLA);doc.setLineWidth(0.5);
      doc.line(ML,y+1,ML+CW*0.4,y+1);
      y+=5;
    }
    else if(tipo==='lista'||tipo==='lista_numerada'){
      const items=b.itens||[];
      items.forEach((item,i)=>{
        const prefix=tipo==='lista_numerada'?`${i+1}.`:'•';
        const lines=doc.splitTextToSize(String(item), CW-10);
        const rh=lines.length*4.3+1;
        checkY(rh);
        doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(...AZUL);
        doc.text(prefix, ML+2, y+3.5);
        doc.setFont('helvetica','normal');doc.setTextColor(...CINZA_TEXT);
        lines.forEach((ln,li)=>{doc.text(ln, ML+8, y+3.5+li*4.3);});
        y+=rh+1;
      });
      y+=1;
    }
    else if(tipo==='tabela'){
      drawTable(b.cabecalho, b.linhas);
    }
    else if(tipo==='info'){
      drawBox(b.titulo||null, b.texto||'', INFO_BG, AZUL);
    }
    else if(tipo==='atencao'){
      drawBox(b.titulo||null, b.texto||'', WARN_BG, LARANJA);
    }
    else if(tipo==='aviso'){
      drawBox(b.titulo||null, b.texto||'', YELL_BG, AMARELO);
    }
    else if(tipo==='sucesso'){
      drawBox(b.titulo||null, b.texto||'', SUCS_BG, VERDE);
    }
    else if(tipo==='checklist_estatico'){
      const items=b.itens||[];
      items.forEach(item=>{
        const lines=doc.splitTextToSize(String(item), CW-10);
        const rh=lines.length*4.3+2;
        checkY(rh);
        // checkmark circle
        doc.setFillColor(...VERDE);
        doc.circle(ML+3, y+3, 2, 'F');
        doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(...BRANCO);
        doc.text('✓', ML+1.8, y+4.2);
        doc.setFontSize(8.5);doc.setFont('helvetica','normal');doc.setTextColor(...CINZA_TEXT);
        lines.forEach((ln,li)=>{doc.text(ln, ML+8, y+3.5+li*4.3);});
        y+=rh;
      });
      y+=2;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CAPA / HERO
  // ═══════════════════════════════════════════════════════════
  // Calcular altura do hero: fundo azul + faixa verde + índice
  const heroAzulH=54;

  // fundo azul
  drawRect(0, 0, PW, heroAzulH, AZUL, 0);

  // título
  doc.setFontSize(22);doc.setFont('helvetica','bold');doc.setTextColor(...BRANCO);
  const tLines=doc.splitTextToSize(t.nome, CW);
  tLines.forEach((ln,i)=>{doc.text(ln, ML, 22+i*10);});
  // badges
  doc.setFontSize(8.5);doc.setFont('helvetica','normal');doc.setTextColor(...BRANCO);
  doc.text(`Capitulo ${t.num}   |   ${t.atualizacao}   |   CAGE RS`, ML, 40);

  // faixa verde-água com índice completo (texto corrido multi-linha)
  const allItems=[
    ...t.secoes.map((s,i)=>`${i+1}. ${s.titulo}`),
    `${t.secoes.length+1}. Perguntas Frequentes`,
    `${t.secoes.length+2}. Legislação Relacionada`
  ];
  const idxText=allItems.join('   ');
  doc.setFontSize(7.5);doc.setFont('helvetica','bold');
  const idxLines=doc.splitTextToSize(idxText, CW);
  const faixaRealH=idxLines.length*4.5+6;
  drawRect(0, heroAzulH, PW, faixaRealH, AZUL_CLA, 0);
  doc.setTextColor(...BRANCO);
  idxLines.forEach((ln,i)=>{
    doc.text(ln, ML, heroAzulH+5+i*4.5);
  });

  y=heroAzulH+faixaRealH+8;

  // rodapé pág 1
  doc.setFontSize(8);doc.setTextColor(...CINZA_MED);
  doc.text(`${t.nome} | Manual do Gestor Publico | CAGE RS`, ML, PH-8);
  doc.text('1', PW-ML, PH-8, {align:'right'});

  // ═══════════════════════════════════════════════════════════
  // SEÇÕES
  // ═══════════════════════════════════════════════════════════
  t.secoes.forEach((sec,si)=>{
    // cabeçalho da seção
    checkY(14);
    const secH=9;
    drawRect(ML, y, CW, secH, AZUL, 2);
    doc.setFontSize(10);doc.setFont('helvetica','bold');doc.setTextColor(...BRANCO);
    doc.text(`${si+1}. ${sec.titulo}`, ML+5, y+6.2);
    y+=secH+4;

    sec.conteudo.forEach(b=>drawBloco(b));
    y+=4;
  });

  // ═══════════════════════════════════════════════════════════
  // FAQ
  // ═══════════════════════════════════════════════════════════
  if(t.faq&&t.faq.length>0){
    checkY(14);
    drawRect(ML,y,CW,9,AZUL,2);
    doc.setFontSize(10);doc.setFont('helvetica','bold');doc.setTextColor(...BRANCO);
    doc.text(`${t.secoes.length+1}. Perguntas Frequentes`,ML+5,y+6.2);
    y+=13;

    t.faq.forEach((f,fi)=>{
      const qLines=doc.splitTextToSize(`${fi+1}. ${f.pergunta}`, CW-4);
      const aLines=doc.splitTextToSize(f.resposta, CW-8);
      const totalH=(qLines.length+aLines.length)*4.5+10;
      checkY(totalH);

      // pergunta
      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(...AZUL);
      qLines.forEach(ln=>{doc.text(ln,ML+2,y);y+=4.5;});
      // resposta
      doc.setFontSize(8.5);doc.setFont('helvetica','normal');doc.setTextColor(...CINZA_TEXT);
      aLines.forEach(ln=>{doc.text(ln,ML+4,y);y+=4.3;});
      // separador
      doc.setDrawColor(...CINZA_LIN);doc.setLineWidth(0.2);
      doc.line(ML,y+1,ML+CW,y+1);
      y+=5;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // LEGISLAÇÃO
  // ═══════════════════════════════════════════════════════════
  if(t.legislacao&&t.legislacao.length>0){
    checkY(14);
    drawRect(ML,y,CW,9,AZUL,2);
    doc.setFontSize(10);doc.setFont('helvetica','bold');doc.setTextColor(...BRANCO);
    doc.text(`${t.secoes.length+2}. Legislação Relacionada`,ML+5,y+6.2);
    y+=13;

    t.legislacao.forEach(l=>{
      const nLines=doc.splitTextToSize(l.nome, CW-22);
      const dLines=doc.splitTextToSize(l.desc||'', CW-22);
      const rh=(nLines.length+dLines.length)*4.3+6;
      checkY(rh);

      // badge tipo
      const bw=14;
      drawRect(ML, y, bw, rh-2, INFO_BG, 2);
      doc.setFontSize(7.5);doc.setFont('helvetica','bold');doc.setTextColor(...AZUL);
      doc.text(l.tipo, ML+bw/2, y+rh/2+1, {align:'center'});

      doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(...CINZA_TEXT);
      nLines.forEach((ln,li)=>doc.text(ln, ML+bw+4, y+4+li*4.3));
      doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(...CINZA_MED);
      dLines.forEach((ln,li)=>doc.text(ln, ML+bw+4, y+4+nLines.length*4.3+li*4));
      y+=rh+1;
    });
  }

  // ── Salva ──────────────────────────────────────────────────
  const nome=t.nome.replace(/[^a-zA-Z0-9\u00C0-\u017E\s]/g,'').trim().replace(/\s+/g,'-');
  doc.save(`Manual-Gestor-${nome}.pdf`);
}

// ── Página Temas ─────────────────────────────────────────────
function goTemas(){
  renderTemas('','');
  show('pg-temas');
  // atualiza nav ativo
  document.querySelectorAll('.h-nav a').forEach(a=>a.classList.remove('on'));
  document.querySelector('#nav-temas')?.classList.add('on');
}

function _numSort(num){
  // Converte "20-21" → 20, "1" → 1 etc para ordenar
  if(!num && num!==0) return 999;
  const n=parseInt(String(num).split('-')[0]);
  return isNaN(n)?999:n;
}

function renderTemas(filtroTexto, filtroTag){
  const wrap=document.getElementById('pt-lista-wrap');
  if(!wrap) return;

  // Ordenar por número do capítulo
  const ordenados=[...TEMAS].sort((a,b)=>_numSort(a.num)-_numSort(b.num));

  // Filtrar
  const txt=(filtroTexto||'').toLowerCase().trim();
  const tag=(filtroTag||'').toLowerCase().trim();
  const filtrados=ordenados.filter(t=>{
    const matchTxt=!txt||
      t.nome.toLowerCase().includes(txt)||
      t.desc.toLowerCase().includes(txt)||
      (t.tags||[]).some(tg=>tg.toLowerCase().includes(txt));
    const matchTag=!tag||(t.tags||[]).some(tg=>tg.toLowerCase()===tag);
    return matchTxt&&matchTag;
  });

  if(!filtrados.length){
    wrap.innerHTML='<div class="pt-vazio">Nenhum tema encontrado para este filtro.</div>';
    return;
  }

  // Agrupar por tag principal (primeiro tag de cada tema)
  // Se filtro ativo, mostrar tudo numa lista só
  if(txt||tag){
    wrap.innerHTML=`
      <div class="pt-grupo">
        <div class="pt-grupo-titulo">${filtrados.length} tema(s) encontrado(s)</div>
        <div class="pt-lista">${filtrados.map(t=>_ptItemHtml(t)).join('')}</div>
      </div>`;
    return;
  }

  // Sem filtro: agrupar por categoria
  const grupos={};
  const labelMap={
    'fundamental':'Fundamentos da Gestão Pública',
    'financeiro':'Finanças e Orçamento',
    'transferências':'Transferências e Parcerias',
    'controle':'Controle e Fiscalização',
    'compliance':'Integridade e Compliance',
    'pessoal':'Gestão de Pessoal',
    'indenização':'Indenizações',
    'licitação':'Licitações e Contratos',
  };

  filtrados.forEach(t=>{
    const tags=t.tags||['geral'];
    // Prioridade de grupo
    const prioridade=['fundamental','financeiro','transferências','controle','compliance','pessoal','indenização','licitação'];
    let grupo='geral';
    for(const p of prioridade){
      if(tags.some(tg=>tg.toLowerCase()===p)){grupo=p;break;}
    }
    if(!grupos[grupo]) grupos[grupo]=[];
    grupos[grupo].push(t);
  });

  const ordem=['fundamental','financeiro','transferências','controle','compliance','pessoal','indenização','licitação','geral'];
  let html='';
  ordem.forEach(g=>{
    if(!grupos[g]||!grupos[g].length) return;
    const label=labelMap[g]||g.charAt(0).toUpperCase()+g.slice(1);
    html+=`<div class="pt-grupo">
      <div class="pt-grupo-titulo">${label}</div>
      <div class="pt-lista">${grupos[g].map(t=>_ptItemHtml(t)).join('')}</div>
    </div>`;
  });
  wrap.innerHTML=html;
}

function _ptItemHtml(t){
  const tagsHtml=(t.tags||[]).map(tg=>`<span class="pt-tag">${tg}</span>`).join('');
  return `<div class="pt-item" onclick="abrirTema('${t.id}')">
    <div class="pt-num">Cap.<br>${t.num}</div>
    <div class="pt-ic">${t.icone}</div>
    <div class="pt-info">
      <div class="pt-nome">${t.nome}</div>
      <div class="pt-desc">${t.desc}</div>
      ${tagsHtml?`<div class="pt-tags">${tagsHtml}</div>`:''}
    </div>
    <div class="pt-seta">›</div>
  </div>`;
}

let _ptFiltroTag='';
function filtrarTemas(txt){
  renderTemas(txt,_ptFiltroTag);
}
function filtrarPorTag(tag,btn){
  _ptFiltroTag=(_ptFiltroTag===tag)?'':tag;
  document.querySelectorAll('.pt-filtro').forEach(b=>b.classList.remove('on'));
  if(_ptFiltroTag) btn.classList.add('on');
  renderTemas(document.getElementById('pt-inp')?.value||'',_ptFiltroTag);
}

// ── Página Legislação ─────────────────────────────────────────
function goLeg(){
  show('pg-leg');
  document.querySelectorAll('.h-nav a').forEach(a=>a.classList.remove('on'));
  document.getElementById('nav-leg')?.classList.add('on');
}

// ── Página Sobre a CAGE ─────────────────────────────────────
function goCAGE(){
  show('pg-cage');
  document.querySelectorAll('.h-nav a').forEach(a=>a.classList.remove('on'));
  document.getElementById('nav-cage')?.classList.add('on');
}

init();
