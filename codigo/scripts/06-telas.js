// ---------- Telas: lobby, loja com a mochila, luta, fim de corrida e ranking ----------
let tela = 'lobby', sel = null, lutaAtual = null, rankingDados = null, classeEscolhida = 'guerreiro';
let PERFIL = temDOM ? ler('tdg-perfil', null) : null;
if(!PERFIL) PERFIL = {nome:'', corridas:0, vitoriasCorrida:0, melhor:0, pontos:0, colecao:{}};
PERFIL.xp = PERFIL.xp || {}; PERFIL.cartas = PERFIL.cartas || {}; PERFIL.bronze = PERFIL.bronze || 0; PERFIL.modo = PERFIL.modo || 'ranqueada';
const gravarPerfil = () => guardar('tdg-perfil', PERFIL);

// ---- experiência de cada personagem (PROGRESSAO.md): quem manda é o servidor; aqui fica uma cópia para jogar offline ----
const nivelClasse = c => nivelDe(PERFIL.xp[c] || 0);
async function sincronizarExperiencia(){
  const L = await onlineExperiencia(); if(!Array.isArray(L)) return false;
  // o servidor é a fonte: classe sem linha lá tem 0 (uma cópia local mexida não libera nada)
  PERFIL.xp = {}; for(const l of L) if(CLASSES[l.classe]) PERFIL.xp[l.classe] = Number(l.xp) || 0;
  PERFIL.mult = L[0] ? Number(L[0].multiplicador) || 1 : PERFIL.mult || 1; gravarPerfil(); return true;
}
// o que cada nível libera: itens da classe e receitas daquele nível
function liberadosNo(c, n){
  const itens = ITENS.filter(it => it.classe === c && !it.fusao && it.nivel === n && !(n === 1 && it.inicial)).filter(it => !it.gerado).map(it => ({id:it.id}));
  const receitas = RECEITAS.filter(r => r[3] === n && ITEM[r[2]].classe === c).map(r => ({id:r[2], receita:[r[0], r[1]]}));
  return itens.concat(receitas);
}
const barraXp = (nv, cls) => `<span class="xpbar ${cls || ''}"><i style="width:${Math.round(nv.fracao * 100)}%"></i></span>`;
const selo = nv => `<span class="selo-nivel">Nv ${nv.nivel}${nv.estrelas ? ` <em>${'★'.repeat(Math.min(nv.estrelas, 5))}${nv.estrelas > 5 ? '+' : ''}</em>` : ''}</span>`;
// a corrida no servidor: começa ao abrir a loja; a rodada só conta para a experiência com o número dela
let corridaPendente = null, ultimoEnvio = null;
function iniciarNoServidor(){
  const alvo = C; C.corrida = null;
  corridaPendente = onlineIniciar(C.classe).then(id => { if(alvo === C && id){ C.corrida = Number(id); salvarCorrida(); } return id; });
}
const raiz = () => $('jogo');

// ---- guardar a corrida no meio (fechar o jogo e voltar depois) ----
function salvarCorrida(){ if(C && !C.fim) guardar('tdg-corrida', C); else guardar('tdg-corrida', null); }
function continuarCorrida(){
  const s = ler('tdg-corrida', null); if(!s || !s.mochila || !CLASSES[s.classe]) return false;
  C = s; proxUid = Math.max(proxUid, ...C.mochila.pecas.concat(C.mochila.bancada).map(p => p.uid + 1), 1);
  return true;
}

// ---- pedaços ----
const raridade = id => RARIDADES[ITEM[id].rar];
// retrato da classe: a pintura própria (retrato-*, ARTE-PERSONAGENS.md) ou, até ela chegar, a provisória
const retrato = c => urlArte('retrato-' + c) || urlArte('rosto-' + c);
// a pintura do item (item-*, ARTE-ITENS.md) ou, até ela chegar, o ícone provisório
function iconeItem(id){ const p = urlArte('item-' + id); return p ? `<img class="ic item pintado" src="${p}" alt="" draggable="false">` : ic(ITEM[id].arte, 'item'); }
// uma peça desenhada com o seu formato (casas) e o ícone no meio; tam = tamanho da casa em px
function pecaHtml(p, tam, extra){
  const f = forma(p.id, p.g), d = ITEM[p.id], bolsa = d.tipo === 'bolsa';
  const casas = f.casas.map(([x, y]) => `<i style="left:${x * tam}px;top:${y * tam}px;width:${tam}px;height:${tam}px"></i>`).join('');
  const lado = Math.min(f.w, f.h) * tam * (bolsa ? .5 : .82);
  return `<div class="peca${bolsa ? ' bolsa' : ''}${extra || ''}" data-uid="${p.uid}" data-rar="${d.rar}" style="--rar:${raridade(p.id).cor};width:${f.w * tam}px;height:${f.h * tam}px">${casas}
    <span class="pic" style="width:${lado}px;height:${lado}px">${iconeItem(p.id)}</span>${p.n > 0 ? `<b class="nvp">${p.n}</b>` : ''}${p.tempera > 0 ? `<b class="ofp tp">T${p.tempera}</b>` : p.lapida > 0 ? `<b class="ofp lp">L${p.lapida}</b>` : p.engrenagem > 0 ? `<b class="ofp ap">A${p.engrenagem}</b>` : p.fermento > 0 ? `<b class="ofp fm">F${p.fermento}</b>` : p.costura > 0 ? `<b class="ofp cs">C${p.costura}</b>` : p.brotos > 0 ? `<b class="ofp br">${p.brotos}</b>` : p.prato ? '<b class="ofp pr">Prato</b>' : p.cozido ? '<b class="ofp cz">…</b>' : ''}</div>`;
}
const pips = (n, total, classe) => Array.from({length:total}, (_, i) => `<i class="${classe}${i < n ? ' on' : ''}"></i>`).join('');
function linhaNumeros(id, s){
  const d = ITEM[id], L = [];
  if(s && s.dano) L.push(`<b>${s.dano[0]}–${s.dano[1]}</b> de dano`);
  if(d.cd) L.push(`a cada <b>${(s ? s.cd : d.cd).toFixed(1).replace('.', ',')} s</b>`);
  if(d.custo) L.push(`gasta <b>${d.custo}</b> de vigor`);
  if(s && s.crit) L.push(`<b>${Math.round(s.crit * 100)}%</b> de crítico`);
  return L.join(' · ');
}

// ---- tela: lobby ----
function telaLobby(){
  const s = ler('tdg-corrida', null);
  return `<section class="lobby">
    <header class="logo"><div class="etiqueta"><small>batalha de mochilas</small><h1>Tralha de Guerra</h1></div></header>
    <div class="nome"><label for="campoNome">Seu nome no ranking</label><div><input id="campoNome" maxlength="20" placeholder="Aventureiro" value="${(PERFIL.nome || '').replace(/"/g, '')}"><span class="status ${conexao.ok === false ? 'off' : conexao.ok ? 'on' : ''}">${conexao.ok === false ? 'Offline' : conexao.ok ? 'Online' : 'Conectando'}</span></div></div>
    <div class="classes">${Object.keys(CLASSES).map(k => { const c = CLASSES[k], ini = ITEM[c.inicial], nv = nivelClasse(k);
      return `<button class="classe${k === classeEscolhida ? ' on' : ''}" data-classe="${k}" style="--cc:${c.cor}">${retrato(k) ? `<img class="rosto" src="${retrato(k)}" alt="" draggable="false">` : `<span class="sem-retrato">${c.nome[0]}</span>`}${selo(nv)}
        <span class="txt"><b>${c.nome}</b>${barraXp(nv)}<small>${c.desc}</small><span class="ini">${iconeItem(ini.id)} ${ini.nome}</span></span></button>`; }).join('')}</div>
    ${painelPersonagem(classeEscolhida)}
    <div class="acoes">
      <div class="modos">${['ranqueada', 'normal'].map(k => `<button class="chip${PERFIL.modo === k ? ' on' : ''}" data-modo="${k}"><b>${k === 'ranqueada' ? 'Ranqueada' : 'Normal'}</b><span>${k === 'ranqueada' ? 'Todos os itens no nível 0. Vitórias valem pontos no ranking.' : 'Seus itens lutam no nível das cartas. Não vale ranking.'}</span></button>`).join('')}</div>
      ${s && s.mochila && !s.fim ? `<button class="btn grande primario" id="btContinuar">Continuar<small>${CLASSES[s.classe].nome} · rodada ${s.rodada} · ${s.vitorias} vitórias</small></button>` : ''}
      <button class="btn grande${s && !s.fim ? '' : ' primario'}" id="btJogar">Nova corrida<small>${CLASSES[classeEscolhida].nome} · nível ${nivelClasse(classeEscolhida).nivel} · 7 vitórias para vencer, 3 derrotas e acaba</small></button>
      <div class="linha-btns"><button class="btn" id="btColecao">Coleção</button><button class="btn" id="btLojaCartas">Loja de cartas</button><button class="btn" id="btRanking">Ranking</button></div>
    </div>
    <p class="nota">${PERFIL.corridas ? `${PERFIL.corridas} ${PERFIL.corridas === 1 ? 'corrida' : 'corridas'} · ${PERFIL.vitoriasCorrida} ${PERFIL.vitoriasCorrida === 1 ? 'vencida' : 'vencidas'} · ${PERFIL.pontos} pontos no ranking` : 'Compre itens, encaixe na mochila e veja a luta acontecer sozinha.'}</p>
  </section>`;
}
function ligarLobby(){
  raiz().querySelectorAll('[data-classe]').forEach(b => b.onclick = () => { classeEscolhida = b.dataset.classe; desenhar(); });
  const n = $('campoNome'); n.onchange = () => { const v = n.value.trim().slice(0, 20); PERFIL.nome = v; gravarPerfil(); if(v.length >= 2) onlineNome(v).then(ok => { if(ok) avisar('Nome salvo no ranking'); desenhar(); }); };
  $('btJogar').onclick = ev => { const b = ev.currentTarget; if(ler('tdg-corrida', null) && !b.dataset.certeza){ b.dataset.certeza = 1; b.innerHTML = 'Abandonar a corrida guardada?<small>Toque de novo para confirmar</small>'; return; }
    comecarCorrida(classeEscolhida); };
  $('btTrilha').onclick = () => { tela = 'trilha'; desenhar(); };
  raiz().querySelectorAll('[data-modo]').forEach(b => b.onclick = () => { PERFIL.modo = b.dataset.modo; gravarPerfil(); desenhar(); });
  $('btColecao').onclick = abrirColecao; $('btLojaCartas').onclick = () => abrirLojaCartas('dia');
  const c = $('btContinuar'); if(c) c.onclick = () => { if(continuarCorrida()){ tela = 'loja'; desenhar(); } };
  $('btRanking').onclick = abrirRanking;
}

function comecarCorrida(classe){
  const niveis = {}; for(const k in PERFIL.cartas) if(PERFIL.cartas[k].nivel > 0) niveis[k] = PERFIL.cartas[k].nivel;
  novaCorrida(classe, null, nivelClasse(classe).nivel, PERFIL.modo, niveis); iniciarNoServidor();
  salvarCorrida(); sel = null; tela = 'loja'; desenhar();
}
// o personagem escolhido: nível, experiência e o próximo desbloqueio
function painelPersonagem(c){
  const nv = nivelClasse(c);
  const prox = nv.nivel < 10 ? liberadosNo(c, nv.nivel + 1) : [];
  return `<div class="personagem" style="--cc:${CLASSES[c].cor}">
    <div class="pl-topo">${selo(nv)}<b>${CLASSES[c].nome}</b><span class="pl-xp">${nv.nivel < 10 ? `${nv.xp - nv.de} / ${nv.ate - nv.de} para o nível ${nv.nivel + 1}` : `${nv.xp - nv.de} / ${XP_ESTRELA} para a próxima estrela`}</span></div>
    ${barraXp(nv, 'grossa')}
    ${prox.length ? `<p class="pl-prox">Próximo nível libera: ${prox.map(x => `<span class="mini-item">${iconeItem(x.id)}${ITEM[x.id].nome}</span>`).join('')}</p>` : ''}
    <button class="btn sm" id="btTrilha">Ver a trilha do personagem</button>
  </div>`;
}

// ---- trilha do personagem: os 10 níveis e o que cada um libera ----
function telaTrilha(){
  const c = classeEscolhida, C0 = CLASSES[c], nv = nivelClasse(c);
  const linhas = NIVEIS_XP.map((xp, i) => { const n = i + 1, aberto = nv.nivel >= n, L = n === 1 ? ITENS.filter(it => it.classe === c && !it.fusao && !it.gerado && it.nivel === 1).map(it => ({id:it.id})) : liberadosNo(c, n);
    const cartoes = L.map(x => `<div class="tr-item${aberto ? '' : ' fechado'}" style="--rar:${raridade(x.id).cor}"><span class="pic">${iconeItem(x.id)}</span><span><b>${ITEM[x.id].nome}</b>${x.receita ? `<em>Receita: ${x.receita.map(r => ITEM[r].nome).join(' + ')}</em>` : ''}<small>${ITEM[x.id].texto}</small></span></div>`).join('');
    return `<li class="${aberto ? 'aberto' : ''}${nv.nivel === n ? ' atual' : ''}"><div class="tr-n"><b>${n}</b><small>${xp} XP</small></div><div class="tr-l">${n === 1 ? '<p class="tr-tit">Começa com</p>' : ''}${cartoes}${n === 10 ? `<p class="tr-tit">Prestígio: moldura dourada e uma estrela a cada ${XP_ESTRELA} XP depois do nível 10</p>` : ''}</div></li>`; }).join('');
  return `<section class="trilha-tela" style="--cc:${C0.cor}"><header class="tr-cab">${retrato(c) ? `<img class="rosto" src="${retrato(c)}" alt="">` : ''}<div><h1>${C0.nome}</h1>${selo(nv)} ${barraXp(nv, 'grossa')}<small>${nv.xp} XP no total${PERFIL.mult > 1 ? ` · bônus de experiência ${String(PERFIL.mult).replace('.', ',')}×` : ''}</small></div></header>
    <p class="sub">Experiência por corrida: 2 por rodada, 3 por vitória e 10 ao fechar 7 vitórias. Só conta jogando online, até 250 por dia. Os itens liberados trazem opções novas, não força a mais.</p>
    <ol class="trilha">${linhas}</ol><button class="btn" id="btVoltar">Voltar</button></section>`;
}
function ligarTrilha(){ $('btVoltar').onclick = () => { tela = 'lobby'; desenhar(); }; }

// ---- tela: loja com a mochila ----
let TAM = 44;
function medirCasa(){ const w = Math.min(window.innerWidth, 1100), larg = w > 900 ? Math.min(560, w - 420) : w - 24; TAM = Math.max(30, Math.min(58, Math.floor(larg / LARG))); }
function hud(){
  const c = CLASSES[C.classe];
  return `<header class="hud">${retrato(C.classe) ? `<img class="rosto" src="${retrato(C.classe)}" alt="">` : ''}
    <div class="hinfo"><b>Rodada ${C.rodada}</b><span class="pips">${pips(C.vitorias, VITORIAS_META, 'vit')}</span></div>
    <span class="vidas" title="Derrotas que ainda aguenta">${pips(VIDAS - C.derrotas, VIDAS, 'vida')}</span>
    <span class="ouro">${ic('moeda')} <b>${C.ouro}</b></span>
    <button class="btn sm" id="btSair" title="Voltar ao lobby (a corrida fica guardada)">Sair</button></header>`;
}
function telaLoja(){
  medirCasa();
  const m = C.mochila, N = numeros(m), abertas = casasAbertas(m);
  let grade = '';
  for(let y = 0; y < ALT; y++) for(let x = 0; x < LARG; x++) grade += `<i class="casa${abertas.has(chave(x, y)) ? ' aberta' : ''}" style="left:${x * TAM}px;top:${y * TAM}px;width:${TAM}px;height:${TAM}px"></i>`;
  const ligadas = sel && sel.onde === 'mochila' ? new Set(vizinhos(m, sel.p).map(q => q.uid)) : new Set();
  const pecas = m.pecas.slice().sort((a, b) => ehBolsa(b) - ehBolsa(a)).map(p => `<div class="posto" style="left:${p.x * TAM}px;top:${p.y * TAM}px">${pecaHtml(p, TAM, (sel && sel.p === p ? ' sel' : '') + (ligadas.has(p.uid) ? ' viz' : '') + (N[p.uid] && N[p.uid].recebeu.length ? ' turbinada' : ''))}</div>`).join('');
  const banc = m.bancada.map(p => `<div class="nabanc">${pecaHtml(p, Math.round(TAM * .62), sel && sel.p === p ? ' sel' : '')}</div>`).join('');
  const loja = C.loja.map((id, i) => id ? `<button class="item-loja${sel && sel.onde === 'loja' && sel.i === i ? ' sel' : ''}${ITEM[id].preco > C.ouro ? ' caro' : ''}" data-loja="${i}" style="--rar:${raridade(id).cor}" data-rar="${ITEM[id].rar}">
      <span class="rar-tag">${raridade(id).nome}</span><span class="pic">${iconeItem(id)}</span><b>${ITEM[id].nome}</b><span class="preco">${ic('moeda')} ${ITEM[id].preco}</span></button>` : `<div class="item-loja vazio">vendido</div>`).join('');
  return `<section class="loja-tela">${hud()}
    <div class="area">
      <div class="lado-mochila">
        <div class="mochila" id="mochila" style="width:${LARG * TAM}px;height:${ALT * TAM}px">${grade}${pecas}<div class="previa" id="previa"></div></div>
        <div class="bancada" id="bancada"><small>Bancada · não luta</small>${banc || '<span class="vaziob">Arraste para cá o que não couber</span>'}</div>
      </div>
      <div class="lado-loja">
        <div class="loja" id="loja"><div class="tit"><b>Loja</b><span>${C.loja.filter(Boolean).length} itens</span></div><div class="itens">${loja}</div>
          <div class="venda" id="venda">Solte aqui para vender</div></div>
        <div class="botoes"><button class="btn" id="btTrocar"${C.ouro < custoTroca(C.trocas) ? ' disabled' : ''}>Trocar vitrine<small>${ic('moeda')} ${custoTroca(C.trocas)}</small></button>
          <button class="btn primario grande" id="btLutar">Lutar<small>rodada ${C.rodada}</small></button></div>
        <div class="info" id="info">${infoHtml(N)}</div>
      </div>
    </div></section>`;
}
function infoHtml(N){
  if(!sel) return `<p class="dica">Toque num item para ver o que ele faz. Arraste da loja para a mochila para comprar. Itens só funcionam dentro das bolsas; os que se encostam podem se ajudar.</p>`;
  const id = sel.onde === 'loja' ? C.loja[sel.i] : sel.p.id, d = ITEM[id], s = sel.onde === 'mochila' ? N[sel.p.uid] : null;
  const base = s || {dano:d.dano, cd:d.cd, crit:d.crit || 0};
  const rec = s && s.recebeu.length ? `<p class="bonus">Turbinado por: ${[...new Set(s.recebeu)].map(k => ITEM[k].nome).join(', ')}</p>` : '';
  const receita = RECEITAS.filter(r => r[0] === id || r[1] === id).map(r => `<p class="receita">Encoste em <b>${ITEM[r[0] === id ? r[1] : r[0]].nome}</b> para virar <b>${ITEM[r[2]].nome}</b>.</p>`).join('');
  const botoes = sel.onde === 'loja' ? `<button class="btn primario" id="btComprar"${d.preco > C.ouro ? ' disabled' : ''}>Comprar<small>${ic('moeda')} ${d.preco}</small></button>`
    : `<button class="btn" id="btGirar">Girar</button>${sel.onde === 'mochila' && d.id !== 'mochila' ? '<button class="btn" id="btGuardar">Para a bancada</button>' : ''}${d.inicial ? '' : `<button class="btn" id="btVender">Vender<small>${ic('moeda')} ${precoVenda(id)}</small></button>`}`;
  return `<div class="cab" style="--rar:${raridade(id).cor}"><span class="pic">${iconeItem(id)}</span><div><b>${d.nome}</b><small>${raridade(id).nome} · ${NOME_TIPO[d.tipo] || 'Item'}${d.classe ? ' · ' + CLASSES[d.classe].nome : ''}</small></div></div>
    ${linhaNumeros(id, base) ? `<p class="nums">${linhaNumeros(id, base)}</p>` : ''}<p>${d.texto}</p>${rec}${receita}
    ${sel.onde === 'bancada' ? '<p class="aviso-b">Na bancada o item não luta: arraste para dentro de uma bolsa.</p>' : ''}<div class="bts">${botoes}</div>`;
}
function ligarLoja(){
  $('btSair').onclick = () => { salvarCorrida(); tela = 'lobby'; sel = null; desenhar(); };
  $('btTrocar').onclick = () => { if(trocarLoja()){ sel = null; salvarCorrida(); desenhar(); } };
  $('btLutar').onclick = comecarLuta;
  const b = $('btComprar'); if(b) b.onclick = () => { const p = comprar(sel.i); if(p){ colocarNaMochila(p); sel = {onde:C.mochila.pecas.includes(p) ? 'mochila' : 'bancada', p}; salvarCorrida(); desenhar(); } };
  const g = $('btGirar'); if(g) g.onclick = () => { girar(sel.p); desenhar(); };
  const gu = $('btGuardar'); if(gu) gu.onclick = () => { const fora = tirar(C.mochila, sel.p); C.mochila.bancada.push(...fora); sel = {onde:'bancada', p:sel.p}; salvarCorrida(); desenhar(); };
  const v = $('btVender'); if(v) v.onclick = () => { vender(sel.p); sel = null; salvarCorrida(); desenhar(); };
  ligarArrasto();
}
// comprado pelo botão: tenta o melhor lugar na mochila; se não couber, fica na bancada
function colocarNaMochila(p){ const m = C.mochila, l = melhorLugar(m, p.id); if(l){ m.bancada = m.bancada.filter(q => q !== p); por(m, p, l.x, l.y, l.g); } }
function girar(p){
  const m = C.mochila, g = (p.g + 1) & 3;
  if(!m.pecas.includes(p)){ p.g = g; salvarCorrida(); return; }
  // gira no lugar; se não couber, tenta casas por perto
  for(const [dx, dy] of [[0, 0], [0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) if(por(m, p, p.x + dx, p.y + dy, g)){ salvarCorrida(); return; }
  avisar('Não cabe girado aqui');
}

// ---- arrastar e soltar (mouse e dedo) ----
let arr = null;
function ligarArrasto(){
  const R = raiz();
  R.querySelectorAll('.mochila .peca, .bancada .peca').forEach(el => el.onpointerdown = ev => iniciarArrasto(ev, el, el.closest('.mochila') ? 'mochila' : 'bancada'));
  R.querySelectorAll('[data-loja]').forEach(el => el.onpointerdown = ev => iniciarArrasto(ev, el, 'loja'));
}
function acharPeca(uid){ const m = C.mochila; return m.pecas.concat(m.bancada).find(p => p.uid === uid); }
function iniciarArrasto(ev, el, onde){
  if(ev.button > 0) return;
  const r = el.getBoundingClientRect(), p = onde === 'loja' ? null : acharPeca(+el.dataset.uid), id = p ? p.id : C.loja[+el.dataset.loja];
  const g = p ? p.g : 0, f = forma(id, g), escala = onde === 'mochila' ? 1 : onde === 'bancada' ? .62 : 0;
  // a casa do formato que ficou debaixo do dedo (na loja, o meio)
  const cx = escala ? clamp(Math.floor((ev.clientX - r.left) / (TAM * escala)), 0, f.w - 1) : Math.floor(f.w / 2), cy = escala ? clamp(Math.floor((ev.clientY - r.top) / (TAM * escala)), 0, f.h - 1) : Math.floor(f.h / 2);
  arr = {onde, p, id, g, cx, cy, i:onde === 'loja' ? +el.dataset.loja : null, x0:ev.clientX, y0:ev.clientY, ativo:false, el};
  window.onpointermove = moverArrasto; window.onpointerup = soltarArrasto; window.onpointercancel = () => { cancelarArrasto(); };
}
function moverArrasto(ev){
  if(!arr) return;
  if(!arr.ativo){ if(Math.hypot(ev.clientX - arr.x0, ev.clientY - arr.y0) < 7) return; arr.ativo = true; arr.el.classList.add('levantada'); document.body.classList.add('arrastando', arr.onde === 'loja' ? 'da-loja' : 'da-mochila'); desenharFantasma(); }
  arr.mx = ev.clientX; arr.my = ev.clientY;
  const fa = $('arrasto'); fa.style.transform = `translate(${ev.clientX - (arr.cx + .5) * TAM}px, ${ev.clientY - (arr.cy + .5) * TAM}px)`;
  // prévia na mochila: verde se cabe, vermelho se não
  const alvo = alvoNaMochila(ev), pv = $('previa');
  if(alvo){ const ok = podePor(C.mochila, arr.id, arr.g, alvo.x, alvo.y, arr.p && C.mochila.pecas.includes(arr.p) ? arr.p.uid : null);
    pv.innerHTML = forma(arr.id, arr.g).casas.map(([x, y]) => `<i style="left:${(alvo.x + x) * TAM}px;top:${(alvo.y + y) * TAM}px;width:${TAM}px;height:${TAM}px"></i>`).join(''); pv.className = 'previa ' + (ok ? 'ok' : 'nao'); }
  else { pv.innerHTML = ''; pv.className = 'previa'; }
  const v = $('venda'); if(v){ const sobre = sobreEl(ev, 'loja') && arr.onde !== 'loja' && !ITEM[arr.id].inicial; v.classList.toggle('on', sobre); if(sobre) v.textContent = 'Solte aqui para vender por ' + precoVenda(arr.id); }
}
function desenharFantasma(){ const fa = $('arrasto'); fa.innerHTML = pecaHtml({uid:0, id:arr.id, g:arr.g}, TAM, ' fantasma'); fa.hidden = false; }
const sobreEl = (ev, id) => { const e = $(id); if(!e) return false; const r = e.getBoundingClientRect(); return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom; };
function alvoNaMochila(ev){ const mo = $('mochila'); if(!mo || !sobreEl(ev, 'mochila')) return null; const r = mo.getBoundingClientRect();
  return {x:Math.floor((ev.clientX - r.left) / TAM) - arr.cx, y:Math.floor((ev.clientY - r.top) / TAM) - arr.cy}; }
function soltarArrasto(ev){
  const a = arr; window.onpointermove = window.onpointerup = window.onpointercancel = null;
  if(!a) return;
  if(!a.ativo){ arr = null; tocar(a); return; }
  const m = C.mochila, alvo = alvoNaMochila(ev);
  let mudou = false;
  if(alvo){
    if(a.onde === 'loja'){ if(ITEM[a.id].preco > C.ouro){ avisar('Ouro insuficiente'); }
      else if(podePor(m, a.id, a.g, alvo.x, alvo.y)){ const p = comprar(a.i); m.bancada = m.bancada.filter(q => q !== p); por(m, p, alvo.x, alvo.y, a.g); sel = {onde:'mochila', p}; mudou = true; } else avisar('Não cabe aí'); }
    else { const naMochila = m.pecas.includes(a.p);
      if(naMochila ? por(m, a.p, alvo.x, alvo.y, a.g) : (podePor(m, a.id, a.g, alvo.x, alvo.y) && (m.bancada = m.bancada.filter(q => q !== a.p), por(m, a.p, alvo.x, alvo.y, a.g)))){ sel = {onde:'mochila', p:a.p}; mudou = true; }
      else avisar(ITEM[a.id].tipo === 'bolsa' ? 'Bolsas não podem se sobrepor' : 'Só cabe dentro das bolsas, em casa livre'); }
  } else if(sobreEl(ev, 'bancada')){
    if(a.onde === 'loja'){ const p = comprar(a.i); if(p){ sel = {onde:'bancada', p}; mudou = true; } else avisar('Ouro insuficiente'); }
    else if(a.onde === 'mochila' && a.p.id !== 'mochila'){ m.bancada.push(...tirar(m, a.p)); sel = {onde:'bancada', p:a.p}; mudou = true; }
  } else if(sobreEl(ev, 'loja') && a.onde !== 'loja'){
    if(ITEM[a.id].inicial) avisar('Este item não pode ser vendido');
    else { vender(a.p); sel = null; mudou = true; }
  }
  cancelarArrasto();
  if(mudou){ salvarCorrida(); }
  desenhar();
}
function cancelarArrasto(){ arr = null; document.body.classList.remove('arrastando', 'da-loja', 'da-mochila'); const fa = $('arrasto'); if(fa){ fa.hidden = true; fa.innerHTML = ''; } window.onpointermove = window.onpointerup = window.onpointercancel = null; }
function tocar(a){ sel = a.onde === 'loja' ? {onde:'loja', i:a.i} : {onde:a.onde, p:a.p}; desenhar(); }
if(temDOM && typeof window !== 'undefined') window.addEventListener('keydown', ev => {
  if((ev.key === 'r' || ev.key === 'R') && arr && arr.ativo){ arr.g = (arr.g + 1) & 3; const f = forma(arr.id, arr.g); arr.cx = Math.min(arr.cx, f.w - 1); arr.cy = Math.min(arr.cy, f.h - 1); desenharFantasma(); }
  else if((ev.key === 'r' || ev.key === 'R') && tela === 'loja' && sel && sel.p){ girar(sel.p); desenhar(); }
});
if(temDOM && typeof window !== 'undefined') window.addEventListener('contextmenu', ev => { if(arr && arr.ativo){ ev.preventDefault(); arr.g = (arr.g + 1) & 3; const f = forma(arr.id, arr.g); arr.cx = Math.min(arr.cx, f.w - 1); arr.cy = Math.min(arr.cy, f.h - 1); desenharFantasma(); } });

// ---- a luta ----
async function comecarLuta(){
  const bt = $('btLutar'); if(bt){ bt.disabled = true; bt.innerHTML = 'Procurando adversário…'; }
  const feitas = fundir(C.mochila, C.nivel || 1);
  // a ferramenta do ofício trabalha uma vez por rodada
  const ofi = C.oficioRodada === C.rodada ? [] : oficio(C.mochila, C.rodada); C.oficioRodada = C.rodada;
  const avisos = feitas.map(id => 'Fusão: ' + ITEM[id].nome).concat(ofi); if(avisos.length) avisar(avisos.slice(0, 3).join(' · '), 3000);
  const foto = fotoMochila(C.mochila), vidas = VIDAS - C.derrotas;
  let adv = null;
  if(C.corrida == null && corridaPendente) await Promise.race([corridaPendente, new Promise(r => setTimeout(r, 3000))]);
  const modo = C.modo || 'ranqueada', comNivel = C.mochila.pecas.filter(p => !ehBolsa(p)), media = comNivel.length ? comNivel.reduce((a, p) => a + (p.n || 0), 0) / comNivel.length : 0;
  ultimoEnvio = onlineEnviar(C.rodada, C.classe, foto, C.vitorias, vidas, C.corrida, modo);
  // robôs até haver jogadores suficientes nesta rodada (o mínimo fica no servidor: supabase/02-amostra-robos.sql)
  const amostra = await onlineAmostra(C.rodada, modo), o = querJogador(amostra, Math.random()) ? await onlineAdversario(C.rodada, C.vitorias, modo, media) : null;
  if(o && CLASSES[o.classe]) adv = {nome:o.nome, classe:o.classe, mochila:deFoto(o.itens), online:true};
  if(!adv) adv = adversarioRobo(C.rodada, misturar(C.sem, C.rodada * 31 + C.trocas), modo === 'normal' ? media : 0);
  const sem = misturar(C.sem, C.rodada * 7 + 3), r = lutar(C.mochila, C.classe, PERFIL.nome || 'Você', adv.mochila, adv.classe, adv.nome, sem);
  lutaAtual = {r, adv, venceu:r.vencedor === 0, tempo:0, vel:1, i:0, ultimo:null, pontos:null, fechada:false};
  if(adv.online && modo === 'ranqueada') onlineLuta(lutaAtual.venceu, C.vitorias + (lutaAtual.venceu ? 1 : 0)).then(p => { if(lutaAtual && p != null){ lutaAtual.pontos = p; PERFIL.pontos = p; gravarPerfil(); } });
  for(const pc of C.mochila.pecas) PERFIL.colecao[pc.id] = 1; gravarPerfil();
  sel = null; tela = 'luta'; desenhar(); tocarLuta();
}
const NOME_EST = {forca:'Força', queima:'Queimadura', veneno:'Veneno', regen:'Regeneração', esquiva:'Esquiva', gelo:'Gelo', espinhos:'Espinhos', mana:'Mana'};
const COR_EST = {forca:'#d9483b', queima:'#f08a2a', veneno:'#5aa84a', regen:'#7ad06a', esquiva:'#8ab4d8', gelo:'#7ad0f0', espinhos:'#b07a4a', mana:'#7a6ad8'};
function ladoHtml(k){
  const L = lutaAtual.r.lados[k], adv = k === 1, tam = Math.max(16, Math.min(44, Math.floor((Math.min(480, window.innerWidth - 24) - 30) / LARG)));
  const mini = {pecas:L.itens.map((s, i) => ({uid:1000 + i, id:s.id, x:s.x, y:s.y, g:s.g}))};
  const bolsas = (k === 0 ? C.mochila : lutaAtual.adv.mochila).pecas.filter(ehBolsa);
  const pecas = bolsas.concat(mini.pecas).map(p => `<div class="posto" style="left:${p.x * tam}px;top:${p.y * tam}px">${pecaHtml(p, tam, '')}</div>`).join('');
  return `<div class="lutador${adv ? ' adv' : ''}" id="lado${k}">
    <div class="topo-l">${retrato(L.classe) ? `<img class="rosto" src="${retrato(L.classe)}" alt="">` : ''}<div><b>${L.nome}</b><small>${CLASSES[L.classe].nome}${adv ? (lutaAtual.adv.online ? ' · jogador online' : ' · mochila do jogo') : ''}</small></div></div>
    <div class="vidabar"><i class="v"></i><i class="b"></i><span class="txt"></span></div>
    <div class="ests"></div><div class="vigor"></div>
    <div class="mini" style="width:${LARG * tam}px;height:${ALT * tam}px">${pecas}</div><div class="flutuantes"></div></div>`;
}
function telaLuta(){
  return `<section class="luta-tela"><header class="lcab"><b>Rodada ${C.rodada}</b><span>${pips(C.vitorias, VITORIAS_META, 'vit')}</span><span class="vidas">${pips(VIDAS - C.derrotas, VIDAS, 'vida')}</span></header>
    <div class="ringue">${ladoHtml(1)}<div class="versus">contra</div>${ladoHtml(0)}</div>
    <div class="controles"><button class="btn sm${lutaAtual.vel === 1 ? ' on' : ''}" data-vel="1">1×</button><button class="btn sm${lutaAtual.vel === 2 ? ' on' : ''}" data-vel="2">2×</button><button class="btn sm${lutaAtual.vel === 4 ? ' on' : ''}" data-vel="4">4×</button><button class="btn sm" id="btPular">Pular</button></div>
    <div class="resultado" id="resultado" hidden></div></section>`;
}
function ligarLuta(){
  raiz().querySelectorAll('[data-vel]').forEach(b => b.onclick = () => { lutaAtual.vel = +b.dataset.vel; raiz().querySelectorAll('[data-vel]').forEach(x => x.classList.toggle('on', x === b)); });
  $('btPular').onclick = () => { lutaAtual.tempo = 1e9; };
  aplicarFoto(lutaAtual.r.eventos[0].foto);
}
function aplicarFoto(f){
  [0, 1].forEach(k => { const L = f[k], el = $('lado' + k); if(!el) return;
    el.querySelector('.v').style.width = (L.vida / L.max * 100) + '%';
    el.querySelector('.b').style.width = Math.min(100, L.bloq / L.max * 100) + '%';
    el.querySelector('.txt').innerHTML = `${L.vida}/${L.max}${L.bloq ? ` <em>${ic('escudo')} ${L.bloq}</em>` : ''}`;
    el.querySelector('.ests').innerHTML = Object.keys(NOME_EST).filter(e => L[e] > 0).map(e => `<span style="--c:${COR_EST[e]}">${NOME_EST[e]} ${L[e]}</span>`).join('');
    el.querySelector('.vigor').innerHTML = `<small>Vigor</small>${pips(L.vigor, VIGOR_MAX, 'vg')}`; });
}
function numeroFlutuante(k, txt, cls){ const el = $('lado' + k); if(!el) return; const n = document.createElement('span'); n.className = 'flut ' + cls; n.textContent = txt; n.style.left = (30 + Math.random() * 40) + '%'; el.querySelector('.flutuantes').appendChild(n); setTimeout(() => n.remove(), 1000); }
function piscar(k, item){ const el = $('lado' + k); if(!el) return; const p = el.querySelectorAll('.mini .peca:not(.bolsa)')[item]; if(p){ p.classList.remove('age'); void p.offsetWidth; p.classList.add('age'); } }
function tocarLuta(){
  let ant = performance.now();
  const passo = agora => {
    if(tela !== 'luta' || !lutaAtual || lutaAtual.fechada) return;
    const L = lutaAtual, dt = Math.min(.1, (agora - ant) / 1000); ant = agora; L.tempo += dt * L.vel;
    const ev = L.r.eventos; let ultimaFoto = null;
    while(L.i < ev.length && ev[L.i].t <= L.tempo){ const e = ev[L.i++]; ultimaFoto = e.foto;
      if(L.tempo < 1e8){
        if(e.tipo === 'ataque' || e.tipo === 'magia' || e.tipo === 'ativa') piscar(e.lado, e.item);
        else if(['dano', 'magia', 'queimadura', 'venenoDano', 'cansaco', 'espinhos'].includes(e.tipo) && e.valor) numeroFlutuante(e.lado, '-' + e.valor, e.crit ? 'crit' : e.tipo);
        else if(e.tipo === 'cura') numeroFlutuante(e.lado, '+' + e.valor, 'cura');
        else if(e.tipo === 'bloqueio') numeroFlutuante(e.lado, '+' + e.valor, 'bloq');
        else if(e.tipo === 'esquivou') numeroFlutuante(e.lado, 'Esquivou', 'esq'); } }
    if(ultimaFoto) aplicarFoto(ultimaFoto);
    if(L.i >= ev.length){ mostrarResultado(); return; }
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}
// estatísticas da luta, pelos eventos: dano (com o que o bloqueio segurou), cura e bloqueio de cada item, dos dois lados
const EFEITOS_SEM_ITEM = {queimadura:'Queimadura', venenoDano:'Veneno', espinhos:'Espinhos'};
function estatisticas(r){
  const S = [0, 1].map(k => ({itens:r.lados[k].itens.map(s => ({id:s.id, dano:0, cura:0, bloq:0})), extra:{}, cura:0}));
  for(const e of r.eventos){
    if(['dano', 'magia'].includes(e.tipo) && e.valor != null && e.item != null){ const it = S[1 - e.lado].itens[e.item]; if(it) it.dano += e.valor + (e.bloqueado || 0); }
    else if(EFEITOS_SEM_ITEM[e.tipo] && e.valor != null){ const x = S[1 - e.lado].extra; x[e.tipo] = (x[e.tipo] || 0) + e.valor + (e.bloqueado || 0); }
    else if(e.tipo === 'cura'){ if(e.item != null && S[e.lado].itens[e.item]) S[e.lado].itens[e.item].cura += e.valor; else S[e.lado].cura += e.valor; }
    else if(e.tipo === 'bloqueio' && e.item != null && S[e.lado].itens[e.item]) S[e.lado].itens[e.item].bloq += e.valor;
  }
  return S;
}
function statsHtml(r){
  const S = estatisticas(r), lado = k => { const s = S[k], linhas = s.itens.filter(i => i.dano || i.cura || i.bloq).sort((a, b) => (b.dano + b.cura + b.bloq) - (a.dano + a.cura + a.bloq));
    const tot = {dano:linhas.reduce((a, i) => a + i.dano, 0) + Object.values(s.extra).reduce((a, v) => a + v, 0), cura:linhas.reduce((a, i) => a + i.cura, 0) + s.cura, bloq:linhas.reduce((a, i) => a + i.bloq, 0)};
    return `<div class="st-lado"><h3>${r.lados[k].nome}</h3><table><tr><th></th><th>Dano</th><th>Cura</th><th>Bloq.</th></tr>
      ${linhas.map(i => `<tr><td><span class="st-ic">${iconeItem(i.id)}</span>${ITEM[i.id].nome}</td><td>${i.dano || ''}</td><td>${i.cura || ''}</td><td>${i.bloq || ''}</td></tr>`).join('')}
      ${Object.entries(s.extra).map(([t, v]) => `<tr class="st-ef"><td>${EFEITOS_SEM_ITEM[t]}</td><td>${v}</td><td></td><td></td></tr>`).join('')}
      ${s.cura ? `<tr class="st-ef"><td>Regeneração</td><td></td><td>${s.cura}</td><td></td></tr>` : ''}
      <tr class="st-tot"><td>Total</td><td>${tot.dano}</td><td>${tot.cura}</td><td>${tot.bloq}</td></tr></table></div>`; };
  return lado(0) + lado(1);
}
function mostrarResultado(){
  const L = lutaAtual; if(L.fechada) return; L.fechada = true;
  const el = $('resultado'); el.hidden = false;
  el.className = 'resultado ' + (L.venceu ? 'venceu' : 'perdeu');
  el.innerHTML = `<h2>${L.venceu ? 'Vitória!' : 'Derrota'}</h2><p>${L.venceu ? 'Sua tralha deu conta.' : 'Desta vez a mochila do outro foi melhor.'}${L.adv.online ? ' <b>Contra um jogador online</b>' + (L.venceu && C.modo !== 'normal' ? ': +10 pontos no ranking.' : '.') : ''}</p><div class="res-btns"><button class="btn" id="btStats">Estatísticas</button><button class="btn primario grande" id="btSeguir">Continuar</button></div><div class="stats" id="stats" hidden>${statsHtml(L.r)}</div>`;
  $('btStats').onclick = () => { const st = $('stats'); st.hidden = !st.hidden; el.classList.toggle('largo', !st.hidden); };
  $('btSeguir').onclick = () => {
    fecharRodada(L.venceu, L.adv.nome); lutaAtual = null;
    if(C.fim){ PERFIL.corridas++; if(C.vitorias >= VITORIAS_META) PERFIL.vitoriasCorrida++; PERFIL.melhor = Math.max(PERFIL.melhor, C.vitorias); gravarPerfil(); tela = 'fim'; fecharNoServidor(); }
    else tela = 'loja';
    salvarCorrida(); desenhar(); };
}

// ---- fim da corrida ----
// a experiência é calculada no servidor; offline (ou sem o número da corrida) a corrida não dá experiência
async function fecharNoServidor(){
  const alvo = C, antes = nivelClasse(C.classe);
  C.xpRes = C.corrida ? 'calculando' : 'offline';
  if(C.corrida){
    if(ultimoEnvio) await ultimoEnvio;
    const r = await onlineFechar(C.corrida, C.vitorias);
    if(r){ PERFIL.xp[alvo.classe] = Number(r.xp) || 0; gravarPerfil();
      const depois = nivelClasse(alvo.classe), lib = [];
      for(let n = antes.nivel + 1; n <= depois.nivel; n++) lib.push(...liberadosNo(alvo.classe, n));
      alvo.xpRes = {ganho:Number(r.ganho), base:Number(r.base), mult:Number(r.multiplicador), limite:Number(r.limite_hoje), antes, depois, lib, bronze:Number(r.bronze) || 0, cartas:r.cartas || {}};
      sincronizarColecao(); }
    else alvo.xpRes = 'offline';
  }
  if(tela === 'fim' && alvo === C) desenhar();
}
function blocoXp(){
  const x = C.xpRes;
  if(!x || x === 'offline') return `<div class="xpfim"><p>Sem conexão: esta corrida não deu experiência.</p></div>`;
  if(x === 'calculando') return `<div class="xpfim"><p>Calculando a experiência…</p></div>`;
  const subiu = x.depois.nivel > x.antes.nivel || x.depois.estrelas > x.antes.estrelas;
  return `<div class="xpfim${subiu ? ' subiu' : ''}" style="--cc:${CLASSES[C.classe].cor}"><div class="pl-topo">${selo(x.depois)}<b>+${x.ganho} de experiência</b>${x.mult > 1 ? `<span class="pl-xp">bônus ${String(x.mult).replace('.', ',')}×</span>` : ''}</div>${barraXp(x.depois, 'grossa')}
    ${x.ganho < Math.floor(x.base * x.mult) ? `<p class="pl-nota">Limite de experiência de hoje atingido.</p>` : ''}
    ${subiu ? `<p class="xp-subiu">${x.depois.nivel > x.antes.nivel ? `Nível ${x.depois.nivel}!` : 'Nova estrela de prestígio!'}</p>` : ''}
    ${x.lib.length ? `<p class="pl-prox">Liberado: ${x.lib.map(l => `<span class="mini-item">${iconeItem(l.id)}${ITEM[l.id].nome}</span>`).join('')}</p>` : ''}
    ${x.bronze || Object.keys(x.cartas).length ? `<p class="pl-prox">Ganhou: <span class="mini-item bronze">${ic('moeda')} ${x.bronze} de bronze</span>${Object.entries(x.cartas).map(([id, q]) => ITEM[id] ? `<span class="mini-item">${iconeItem(id)}${q}× ${ITEM[id].nome}</span>` : '').join('')}</p>` : ''}</div>`;
}
function telaFim(){
  const venceu = C.vitorias >= VITORIAS_META;
  return `<section class="fim-tela ${venceu ? 'venceu' : 'perdeu'}"><h1>${venceu ? 'Corrida vencida!' : 'Fim da corrida'}</h1>
    <p>${venceu ? `Sete vitórias com o ${CLASSES[C.classe].nome}. A tralha certa, no lugar certo.` : `${C.vitorias} ${C.vitorias === 1 ? 'vitória' : 'vitórias'} antes das 3 derrotas.`}</p>
    <div class="dadosfim"><div><b>${C.vitorias}</b><small>vitórias</small></div><div><b>${C.derrotas}</b><small>derrotas</small></div><div><b>${C.historico.length}</b><small>rodadas</small></div></div>
    ${blocoXp()}
    <div class="mochila final" style="width:${LARG * 26}px;height:${ALT * 26}px">${C.mochila.pecas.slice().sort((a, b) => ehBolsa(b) - ehBolsa(a)).map(p => `<div class="posto" style="left:${p.x * 26}px;top:${p.y * 26}px">${pecaHtml(p, 26, '')}</div>`).join('')}</div>
    <div class="acoes"><button class="btn primario grande" id="btDeNovo">Nova corrida</button><button class="btn" id="btRanking">Ranking</button><button class="btn" id="btLobby">Lobby</button></div></section>`;
}
function ligarFim(){
  $('btDeNovo').onclick = () => comecarCorrida(C.classe);
  $('btRanking').onclick = abrirRanking; $('btLobby').onclick = () => { tela = 'lobby'; desenhar(); };
}

// ---- cartas dos itens: coleção e loja (PROGRESSAO.md, seção 10; servidor em supabase/04-cartas.sql) ----
// as mesmas contas do servidor (custo_cartas e custo_bronze)
const CUSTO_CARTAS = [2, 4, 6, 10, 15, 20, 30, 40, 50, 75], CUSTO_BRONZE = [5, 10, 20, 35, 50, 75, 100, 150, 200, 300];
const DESCONTO_RAR = {rara:.8, epica:.6, lendaria:.4};
const custoCartas = (id, n) => Math.ceil(CUSTO_CARTAS[n - 1] * (DESCONTO_RAR[ITEM[id].rar] || 1));
const cartaDe = id => PERFIL.cartas[id] || {nivel:0, cartas:0};
let colecaoOk = null, carrinhoDados = null, carrinhoTipo = 'dia', ocupado = false;
async function sincronizarColecao(){
  const L = await onlineColecao(); if(!Array.isArray(L)) return false;
  PERFIL.cartas = {}; for(const l of L){ if(l.bronze != null) PERFIL.bronze = Number(l.bronze); if(l.item && ITEM[l.item]) PERFIL.cartas[l.item] = {nivel:Number(l.nivel), cartas:Number(l.cartas)}; }
  if(!L.some(l => l.bronze != null)) PERFIL.bronze = 0;
  gravarPerfil(); return true;
}
async function abrirColecao(){ colecaoOk = 'carregando'; tela = 'colecao'; desenhar(); colecaoOk = await sincronizarColecao(); if(tela === 'colecao') desenhar(); }
async function abrirLojaCartas(tipo){ carrinhoTipo = tipo; carrinhoDados = 'carregando'; tela = 'cartas'; desenhar();
  const [L] = await Promise.all([onlineCarrinho(tipo), sincronizarColecao()]); carrinhoDados = L; if(tela === 'cartas') desenhar(); }
const saldoHtml = () => `<span class="saldo">${ic('moeda')} <b>${PERFIL.bronze}</b> de bronze</span>`;
function cartaHtml(id, extra){
  const c = cartaDe(id), d = ITEM[id], prox = c.nivel < 10 ? custoCartas(id, c.nivel + 1) : 0;
  const pode = c.nivel < 10 && c.cartas >= prox && PERFIL.bronze >= CUSTO_BRONZE[c.nivel];
  return `<div class="carta${c.cartas || c.nivel ? '' : ' vazia'}" style="--rar:${raridade(id).cor}"><span class="nv">${c.nivel ? 'Nv ' + c.nivel : 'Nv 0'}</span><span class="pic">${iconeItem(id)}</span><b>${d.nome}</b>
    ${c.nivel < 10 ? `<span class="cbar"><i style="width:${Math.min(100, c.cartas / prox * 100)}%"></i><em>${c.cartas}/${prox}</em></span>
      ${extra === false ? '' : `<button class="btn sm${pode ? ' primario' : ''}" data-subir="${id}" ${pode ? '' : 'disabled'}>Subir · ${ic('moeda')} ${CUSTO_BRONZE[c.nivel]}</button>`}` : '<span class="max">Nível máximo</span>'}</div>`;
}
function telaColecao(){
  const grupos = [['Comuns a todos', it => !it.classe && !it.fusao], ...Object.keys(CLASSES).map(c => [CLASSES[c].nome, it => it.classe === c && !it.fusao]), ['Fusões', it => it.fusao]];
  return `<section class="colecao-tela"><header class="cab-cartas"><h1>Coleção</h1>${saldoHtml()}</header>
    <p class="sub">Cartas sobem o item do nível 0 ao 10 (+5% por nível). O nível só vale nas partidas <b>normais</b>; na ranqueada todos lutam no nível 0. Ganhe cartas e bronze jogando, ou compre na loja de cartas.</p>
    ${colecaoOk === 'carregando' ? '<p class="nota">Carregando…</p>' : colecaoOk === false ? '<p class="nota">Sem conexão: mostrando a última coleção guardada. Para subir itens, conecte-se.</p>' : ''}
    ${grupos.map(([nome, f]) => { const L = ITENS.filter(it => it.tipo !== 'bolsa' && f(it)); return `<h2>${nome}</h2><div class="cartas">${L.map(it => cartaHtml(it.id)).join('')}</div>`; }).join('')}
    <div class="acoes-fim"><button class="btn" id="btLojaCartas">Loja de cartas</button><button class="btn" id="btVoltar">Voltar</button></div></section>`;
}
function ligarColecao(){
  $('btVoltar').onclick = () => { tela = 'lobby'; desenhar(); }; $('btLojaCartas').onclick = () => abrirLojaCartas('dia');
  raiz().querySelectorAll('[data-subir]').forEach(b => b.onclick = async () => { if(ocupado) return; ocupado = true; b.disabled = true;
    const n = await onlineSubir(b.dataset.subir); ocupado = false;
    if(n == null) avisar('Não deu para subir agora'); else { avisar(`${ITEM[b.dataset.subir].nome}: nível ${n}!`); await sincronizarColecao(); }
    if(tela === 'colecao') desenhar(); });
}
function relogio(ate){ const ms = new Date(ate) - Date.now(); if(!(ms > 0)) return 'agora'; const h = Math.floor(ms / 36e5), d = Math.floor(h / 24); return d ? `${d} d ${h % 24} h` : `${h} h ${Math.floor(ms / 6e4) % 60} min`; }
function telaCartas(){
  const L = Array.isArray(carrinhoDados) ? carrinhoDados : null;
  return `<section class="colecao-tela"><header class="cab-cartas"><h1>Loja de cartas</h1>${saldoHtml()}</header>
    <div class="abas">${[['dia', 'Diário'], ['semana', 'Semanal']].map(([k, n]) => `<button class="chip${carrinhoTipo === k ? ' on' : ''}" data-carrinho="${k}"><b>${n}</b><span>${k === 'dia' ? '6 ofertas, troca à meia-noite' : '4 pacotes grandes, troca na segunda'}</span></button>`).join('')}</div>
    ${carrinhoDados === 'carregando' ? '<p class="nota">Carregando…</p>' : !L ? '<p class="nota">Sem conexão com o servidor agora. A loja de cartas precisa de internet.</p>'
      : `<p class="sub">Troca em ${relogio(L[0] && L[0].troca_em)}. Cada oferta pode ser comprada uma vez.</p><div class="cartas">${L.map(o => ITEM[o.item] ? `<div class="oferta${o.comprado ? ' comprada' : ''}">${cartaHtml(o.item, false)}<span class="qtd">${o.qtd} ${o.qtd === 1 ? 'carta' : 'cartas'}</span>
        <button class="btn sm${!o.comprado && PERFIL.bronze >= o.preco ? ' primario' : ''}" data-oferta="${o.vaga}" ${o.comprado || PERFIL.bronze < o.preco ? 'disabled' : ''}>${o.comprado ? 'Comprado' : `${ic('moeda')} ${o.preco}`}</button></div>` : '').join('')}</div>`}
    <div class="acoes-fim"><button class="btn" id="btColecao">Coleção</button><button class="btn" id="btVoltar">Voltar</button></div></section>`;
}
function ligarCartas(){
  $('btVoltar').onclick = () => { tela = 'lobby'; desenhar(); }; $('btColecao').onclick = abrirColecao;
  raiz().querySelectorAll('[data-carrinho]').forEach(b => b.onclick = () => abrirLojaCartas(b.dataset.carrinho));
  raiz().querySelectorAll('[data-oferta]').forEach(b => b.onclick = async () => { if(ocupado) return; ocupado = true; b.disabled = true;
    const s = await onlineComprar(carrinhoTipo, +b.dataset.oferta); ocupado = false;
    if(s == null) avisar('Não deu para comprar agora'); else { avisar('Cartas compradas!'); PERFIL.bronze = Number(s); }
    abrirLojaCartas(carrinhoTipo); });
}

// ---- ranking ----
async function abrirRanking(){ rankingDados = 'carregando'; tela = 'ranking'; desenhar(); rankingDados = await onlineRanking(); if(tela === 'ranking') desenhar(); }
function telaRanking(){
  const L = Array.isArray(rankingDados) ? rankingDados : null;
  return `<section class="ranking-tela"><h1>Ranking da temporada</h1><p class="sub">10 pontos por vitória contra jogadores online. Derrota não tira pontos.</p>
    ${rankingDados === 'carregando' ? '<p class="nota">Carregando…</p>' : !L ? '<p class="nota">Sem conexão com o servidor agora. O jogo continua offline; tente de novo mais tarde.</p>'
      : !L.length ? '<p class="nota">Ninguém pontuou ainda nesta temporada. Seja o primeiro!</p>'
      : `<ol class="lista">${L.map(l => `<li class="${PERFIL.nome && l.nome === PERFIL.nome ? 'eu' : ''}"><span class="pos">${l.posicao}</span><b>${String(l.nome).replace(/</g, '&lt;')}</b><span>${l.vitorias} vitórias</span><em>${l.pontos}</em></li>`).join('')}</ol>`}
    <button class="btn" id="btVoltar">Voltar</button></section>`;
}
function ligarRanking(){ $('btVoltar').onclick = () => { tela = 'lobby'; desenhar(); }; }

// ---- desenhar a tela atual ----
const TELAS = {colecao:[telaColecao, ligarColecao], cartas:[telaCartas, ligarCartas], trilha:[telaTrilha, ligarTrilha], lobby:[telaLobby, ligarLobby], loja:[telaLoja, ligarLoja], luta:[telaLuta, ligarLuta], fim:[telaFim, ligarFim], ranking:[telaRanking, ligarRanking]};
function desenhar(){
  if(!uiAtiva) return;
  const [h, l] = TELAS[tela] || TELAS.lobby;
  document.body.dataset.tela = tela;
  // o fundo pintado de cada tela, bem apagado atrás dos painéis
  const fundo = urlArte(tela === 'luta' ? 'fundo-luta' : 'fundo-lobby'); document.body.classList.toggle('com-fundo', !!fundo); if(fundo) document.body.style.setProperty('--fundo-img', `url("${fundo}")`);
  raiz().innerHTML = h(); l();
}
