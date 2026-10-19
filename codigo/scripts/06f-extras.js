// ---------- Histórico de corridas, livro de receitas e conquistas (tudo guardado no perfil do aparelho) ----------
if(PERFIL){ PERFIL.historico = PERFIL.historico || []; PERFIL.receitas = PERFIL.receitas || {}; PERFIL.conq = PERFIL.conq || {}; PERFIL.fusoes = PERFIL.fusoes || 0; PERFIL.vit7 = PERFIL.vit7 || {}; }
const miniMochila = (m, tam) => `<div class="mochila final" style="width:${LARG * tam}px;height:${ALT * tam}px">${m.pecas.slice().sort((a, b) => ehBolsa(b) - ehBolsa(a)).map(p => `<div class="posto" style="left:${p.x * tam}px;top:${p.y * tam}px">${pecaHtml(p, tam, '')}</div>`).join('')}</div>`;
const voltarLobby = () => { const b = $('btVoltar'); if(b) b.onclick = () => { tela = 'lobby'; desenhar(); }; };

// ---- histórico: as últimas 10 corridas, com a mochila final de cada uma ----
function registrarFimCorrida(){
  PERFIL.historico.unshift({classe:C.classe, v:C.vitorias, d:C.derrotas, modo:C.modo || 'ranqueada', quando:Date.now(), foto:fotoMochila(C.mochila)});
  PERFIL.historico = PERFIL.historico.slice(0, 10);
  if(C.vitorias >= VITORIAS_META) PERFIL.vit7[C.classe] = 1;
  gravarPerfil(); checarConquistas({semPerder:C.vitorias >= VITORIAS_META && C.derrotas === 0});
}
function telaHistorico(){
  const H = PERFIL.historico, tam = Math.max(14, Math.min(22, Math.floor((Math.min(window.innerWidth, 560) - 150) / LARG)));
  return `<section class="ranking-tela historico-tela"><h1>Histórico</h1><p class="sub">As suas últimas ${H.length || ''} corridas, com a mochila que terminou cada uma.</p>
    ${H.length ? `<ol class="lista hist">${H.map(h => { const K = CLASSES[h.classe] || {nome:h.classe, cor:'#888'};
      return `<li style="--cc:${K.cor}"><div class="h-cab">${retrato(h.classe) ? `<img class="mini-ret" src="${retrato(h.classe)}" alt="">` : ''}<span><b>${K.nome}</b><small>${h.v} ${h.v === 1 ? 'vitória' : 'vitórias'} · ${h.d} ${h.d === 1 ? 'derrota' : 'derrotas'} · ${h.modo === 'normal' ? 'Normal' : 'Ranqueada'} · ${new Date(h.quando).toLocaleDateString('pt-BR')}</small></span>${h.v >= VITORIAS_META ? '<em class="h-sete">7 vitórias</em>' : ''}</div>
        ${miniMochila(deFoto(h.foto), tam)}</li>`; }).join('')}</ol>` : '<p class="nota">Nenhuma corrida terminada ainda.</p>'}
    <button class="btn" id="btVoltar">Voltar</button></section>`;
}

// ---- livro de receitas: as descobertas aparecem inteiras; as outras mostram só a silhueta do resultado ----
let livroClasse = null;
function descobrirReceitas(ids){ let novas = 0; for(const id of ids) if(!PERFIL.receitas[id]){ PERFIL.receitas[id] = 1; novas++; } PERFIL.fusoes += ids.length; gravarPerfil(); checarConquistas(); return novas; }
function telaReceitas(){
  const c = livroClasse || classeEscolhida, L = RECEITAS.filter(r => !r[3] ? !ITEM[r[2]].classe || ITEM[r[2]].classe === c : ITEM[r[2]].classe === c);
  const achadas = L.filter(r => PERFIL.receitas[r[2]]).length, total = RECEITAS.filter(r => PERFIL.receitas[r[2]]).length;
  const linha = r => { const sabe = PERFIL.receitas[r[2]], it = id => `<span class="rc-it">${iconeItem(id)}<small>${ITEM[id].nome}</small></span>`;
    return `<li class="${sabe ? 'sabe' : 'falta'}">${sabe ? it(r[0]) + '<b>+</b>' + it(r[1]) : '<span class="rc-it oculto"><i>?</i><small>???</small></span><b>+</b><span class="rc-it oculto"><i>?</i><small>???</small></span>'}<b>→</b>
      <span class="rc-it res${sabe ? '' : ' sombra'}">${iconeItem(r[2])}<small>${sabe ? ITEM[r[2]].nome : 'A descobrir'}</small></span>${r[3] ? `<em class="rc-nv">Nv ${r[3]}</em>` : ''}</li>`; };
  return `<section class="ranking-tela receitas-tela"><h1>Livro de receitas</h1>
    <p class="sub">Encoste os itens certos na mochila para descobrir. ${achadas} de ${L.length} do ${CLASSES[c].nome} (com as gerais) · ${total} de ${RECEITAS.length} no total.</p>
    <div class="filtros">${Object.keys(CLASSES).map(k => `<button class="chip${k === c ? ' on' : ''}" data-livro="${k}">${CLASSES[k].nome}</button>`).join('')}</div>
    <ol class="lista receitas">${L.map(linha).join('')}</ol><button class="btn" id="btVoltar">Voltar</button></section>`;
}
function ligarReceitas(){ voltarLobby(); raiz().querySelectorAll('[data-livro]').forEach(b => b.onclick = () => { livroClasse = b.dataset.livro; desenhar(); }); }

// ---- conquistas ----
const nivelMax = () => Math.max(1, ...Object.keys(CLASSES).map(c => nivelClasse(c).nivel));
const CONQUISTAS = [
  {id:'fusao1', nome:'Primeira faísca', desc:'Faça a primeira fusão.', ok:() => PERFIL.fusoes >= 1},
  {id:'fusao25', nome:'Ferreiro de mão cheia', desc:'Faça 25 fusões.', ok:() => PERFIL.fusoes >= 25, prog:() => [PERFIL.fusoes, 25]},
  {id:'fusao100', nome:'Mestre da forja', desc:'Faça 100 fusões.', ok:() => PERFIL.fusoes >= 100, prog:() => [PERFIL.fusoes, 100]},
  {id:'receitas20', nome:'Caderno de receitas', desc:'Descubra 20 receitas.', ok:() => Object.keys(PERFIL.receitas).length >= 20, prog:() => [Object.keys(PERFIL.receitas).length, 20]},
  {id:'receitas60', nome:'Livro completo de bolso', desc:'Descubra 60 receitas.', ok:() => Object.keys(PERFIL.receitas).length >= 60, prog:() => [Object.keys(PERFIL.receitas).length, 60]},
  {id:'corrida1', nome:'Pé na estrada', desc:'Termine a primeira corrida.', ok:() => PERFIL.corridas >= 1},
  {id:'sete', nome:'Sete de sete', desc:'Feche uma corrida com 7 vitórias.', ok:() => PERFIL.vitoriasCorrida >= 1},
  {id:'semPerder', nome:'Invicto', desc:'Feche 7 vitórias sem nenhuma derrota.', ok:x => !!(x && x.semPerder)},
  {id:'todos7', nome:'Elenco completo', desc:'Feche 7 vitórias com cada um dos personagens.', ok:() => Object.keys(CLASSES).every(c => PERFIL.vit7[c]), prog:() => [Object.keys(PERFIL.vit7).length, Object.keys(CLASSES).length]},
  {id:'nivel5', nome:'Veterano', desc:'Chegue ao nível 5 com um personagem.', ok:() => nivelMax() >= 5},
  {id:'nivel10', nome:'Lenda da mochila', desc:'Chegue ao nível 10 com um personagem.', ok:() => nivelMax() >= 10},
  {id:'ouro', nome:'Liga de Ouro', desc:'Chegue à liga de Ouro na ranqueada.', ok:() => !!(PERFIL.rank && PERFIL.rank.pontos >= 800)},
  {id:'diamante', nome:'Brilho de Diamante', desc:'Chegue à liga de Diamante na ranqueada.', ok:() => !!(PERFIL.rank && PERFIL.rank.pontos >= 1600)},
  {id:'colecao100', nome:'Acumulador', desc:'Use 100 itens diferentes nas suas mochilas.', ok:() => Object.keys(PERFIL.colecao || {}).length >= 100, prog:() => [Object.keys(PERFIL.colecao || {}).length, 100]},
];
function checarConquistas(extra){
  const novas = CONQUISTAS.filter(q => !PERFIL.conq[q.id] && q.ok(extra));
  if(!novas.length) return; for(const q of novas) PERFIL.conq[q.id] = Date.now(); gravarPerfil();
  if(temDOM){ avisar('Conquista: ' + novas.map(q => q.nome).join(', '), 3200); som('festa'); }
  sincronizarConquistas();
}
function telaConquistas(){
  const feitas = CONQUISTAS.filter(q => PERFIL.conq[q.id]).length;
  return `<section class="ranking-tela conq-tela"><h1>Conquistas</h1><p class="sub">${feitas} de ${CONQUISTAS.length}</p>
    <ol class="lista conq">${CONQUISTAS.map(q => { const f = PERFIL.conq[q.id], p = !f && q.prog ? q.prog() : null;
      return `<li class="${f ? 'feita' : ''}"><span class="cq-selo">${ic(f ? 'trofeu' : 'estrela')}</span><span><b>${q.nome}</b><small>${q.desc}${f ? ` · ${new Date(f).toLocaleDateString('pt-BR')}` : p ? ` · ${Math.min(p[0], p[1])} de ${p[1]}` : ''}</small></span></li>`; }).join('')}</ol>
    <button class="btn" id="btVoltar">Voltar</button></section>`;
}
TELAS.historico = [telaHistorico, voltarLobby]; TELAS.receitas = [telaReceitas, ligarReceitas]; TELAS.conquistas = [telaConquistas, voltarLobby];

// ---- a mochila do adversário, depois da luta ----
function mochilaAdversarioHtml(){
  const m = lutaAtual.adv.mochila, tam = Math.max(16, Math.min(30, Math.floor((Math.min(window.innerWidth, 640) - 60) / LARG)));
  const ids = [...new Set(m.pecas.filter(p => !ehBolsa(p)).map(p => p.id))];
  return `<h3>Mochila de ${lutaAtual.adv.nome}</h3>${miniMochila(m, tam)}
    <ul class="adv-itens">${ids.map(id => `<li style="--rar:${raridade(id).cor}"><span class="pic">${iconeItem(id)}</span><span><b>${ITEM[id].nome}</b><small>${textoIcones(ITEM[id].texto)}</small></span></li>`).join('')}</ul>`;
}

// ---- missões diárias (supabase/08-missoes.sql): o servidor confere e paga em bronze ----
let missoesDados = null, missoesEm = 0;
const TEXTO_MISSAO = m => ({vitorias:`Vença ${m.meta} lutas`, classe:`Vença ${m.meta} lutas com o ${(CLASSES[m.classe] || {}).nome || m.classe}`, corridas:`Termine ${m.meta} corridas`,
  ranqueada:'Feche uma corrida ranqueada com 4 ou mais vitórias', campanha:`Chegue a ${m.meta} vitórias numa corrida`})[m.tipo] || m.tipo;
async function carregarMissoes(forcar){
  if(!forcar && Date.now() - missoesEm < 60000) return;
  missoesEm = Date.now(); const L = await onlineMissoes();
  missoesDados = Array.isArray(L) ? L : null; if(tela === 'lobby') desenhar();
}
function blocoMissoes(){
  if(!missoesDados) return '';
  return `<div class="missoes"><h3>Missões de hoje</h3>${missoesDados.map(m => { const p = Number(m.progresso), meta = Number(m.meta), pronta = p >= meta && !m.resgatada;
    return `<div class="missao${m.resgatada ? ' feita' : ''}"><span class="ms-txt">${TEXTO_MISSAO(m)}<small>${m.resgatada ? 'Resgatada' : `${p} de ${meta}`} · ${ic('moeda')} ${m.bronze} de bronze</small></span>
      ${pronta ? `<button class="btn sm primario" data-missao="${m.n}">Resgatar</button>` : `<span class="ms-barra"><i style="width:${Math.round(Math.min(1, p / meta) * 100)}%"></i></span>`}</div>`; }).join('')}</div>`;
}
function ligarMissoes(){
  raiz().querySelectorAll('[data-missao]').forEach(b => b.onclick = async () => { b.disabled = true;
    const s = await onlineResgatar(+b.dataset.missao);
    if(s != null){ PERFIL.bronze = Number(s); gravarPerfil(); som('vender'); avisar('Bronze recebido!'); } else avisar('Não deu para resgatar agora. Tente de novo.');
    carregarMissoes(true); });
}

// ---- perfil do jogador (supabase/09-perfil.sql): 3 heróis favoritos, título e conquistas; o meu dá para editar ----
// favoritos no formato 'classe' ou 'classe:pele' (as peles/skins entram depois: a pele escolhe outro retrato)
const heroiDe = f => { const [classe, pele] = String(f).split(':'); return {classe, pele}; };
const retratoHeroi = f => { const h = heroiDe(f); return (h.pele && urlArte('retrato-' + h.classe + '-' + h.pele)) || retrato(h.classe); };
const nomeConquista = id => (CONQUISTAS.find(q => q.id === id) || {}).nome || id;
let perfilVer = null;
async function sincronizarConquistas(){ const ids = Object.keys(PERFIL.conq || {}); if(!ids.length) return; const r = await onlineConquistas(ids); if(Array.isArray(r)) PERFIL.conqServidor = r; gravarPerfil(); }
async function abrirPerfil(codigo){
  perfilVer = {carregando:true, meu:!codigo}; tela = 'perfil'; desenhar();
  if(!codigo) await sincronizarConquistas();
  const d = codigo ? await onlinePerfilDe(codigo) : await onlineMeuPerfil();
  perfilVer = {dados:d, meu:!codigo, editando:false, fav:d ? (d.favoritos || []).slice() : [], titulo:d ? d.titulo : null};
  if(tela === 'perfil') desenhar();
}
function telaPerfil(){
  const P = perfilVer || {};
  if(P.carregando) return `<section class="ranking-tela perfil-tela"><h1>Perfil</h1><p class="nota">Carregando…</p></section>`;
  const d = P.dados; if(!d) return `<section class="ranking-tela perfil-tela"><h1>Perfil</h1><p class="nota">Sem conexão com o servidor agora. Tente de novo mais tarde.</p><button class="btn" id="btVoltarPerfil">Voltar</button></section>`;
  const xp = d.experiencia || {}, fav = P.editando ? P.fav : (d.favoritos || []), tem = new Set(d.conquistas || []);
  const card = (f, i) => f ? (() => { const h = heroiDe(f), K = CLASSES[h.classe] || {nome:h.classe, cor:'#888'}, nv = nivelDe(xp[h.classe] || 0);
      return `<div class="heroi-card" style="--cc:${K.cor}">${retratoHeroi(f) ? `<img src="${retratoHeroi(f)}" alt="">` : ''}<b>${K.nome}</b><small>Nível ${nv.nivel}${nv.estrelas ? ' · ' + '★'.repeat(Math.min(nv.estrelas, 5)) : ''}</small></div>`; })()
    : `<div class="heroi-card vazio"><span>${P.meu ? 'Escolha um herói' : 'Vazio'}</span></div>`;
  const escolha = P.editando ? `<p class="sub">Toque em até 3 heróis, na ordem em que quer mostrar.</p><div class="esc-herois">${Object.keys(CLASSES).map(c => { const k = P.fav.findIndex(f => heroiDe(f).classe === c);
      return `<button class="esc-h${k >= 0 ? ' on' : ''}" data-fav="${c}" style="--cc:${CLASSES[c].cor}">${retrato(c) ? `<img src="${retrato(c)}" alt="">` : ''}<small>${CLASSES[c].nome}</small>${k >= 0 ? `<em>${k + 1}</em>` : ''}</button>`; }).join('')}</div>
    <label class="opc"><span><b>Título</b><small>Aparece ao lado do seu nome no ranking</small></span><select id="selTitulo"><option value="">Nenhum</option>${[...tem].map(id => `<option value="${id}"${P.titulo === id ? ' selected' : ''}>${nomeConquista(id)}</option>`).join('')}</select></label>
    <div class="acoes"><button class="btn primario" id="btSalvarPerfil">Salvar</button><button class="btn" id="btCancelarPerfil">Cancelar</button></div>` : '';
  return `<section class="ranking-tela perfil-tela">
    <div class="pf-topo">${seloLiga(d.pontos, 'grande')}<div><h1>${String(d.nome).replace(/</g, '&lt;')}</h1>${d.titulo ? `<p class="pf-titulo">${nomeConquista(d.titulo)}</p>` : ''}
      <small>${ligaDe(d.pontos).nome} · ${d.pontos} pontos${d.melhor_pontos > d.pontos ? ` · melhor ${d.melhor_pontos}` : ''}</small></div></div>
    <h3 class="pf-sec">Heróis favoritos</h3><div class="herois-fav">${[0, 1, 2].map(i => card(fav[i], i)).join('')}</div>
    ${P.meu && !P.editando ? '<button class="btn" id="btEditarPerfil">Editar perfil</button>' : ''}${escolha}
    <h3 class="pf-sec">Conquistas · ${tem.size} de ${CONQUISTAS.length}</h3>
    <div class="pf-conq">${CONQUISTAS.map(q => `<span class="pf-c${tem.has(q.id) ? ' on' : ''}" title="${q.desc}">${ic(tem.has(q.id) ? 'trofeu' : 'estrela')}<small>${q.nome}</small></span>`).join('')}</div>
    <button class="btn" id="btVoltarPerfil">Voltar</button></section>`;
}
function ligarPerfil(){
  const P = perfilVer || {};
  const v = $('btVoltarPerfil'); if(v) v.onclick = () => { tela = P.meu ? 'lobby' : 'ranking'; desenhar(); };
  const e = $('btEditarPerfil'); if(e) e.onclick = () => { P.editando = true; desenhar(); };
  const c = $('btCancelarPerfil'); if(c) c.onclick = () => { P.editando = false; P.fav = (P.dados.favoritos || []).slice(); desenhar(); };
  raiz().querySelectorAll('[data-fav]').forEach(b => b.onclick = () => { const cl = b.dataset.fav, k = P.fav.findIndex(f => heroiDe(f).classe === cl);
    if(k >= 0) P.fav.splice(k, 1); else if(P.fav.length < 3) P.fav.push(cl); else avisar('No máximo 3 heróis'); desenhar(); });
  const t = $('selTitulo'); if(t) t.onchange = () => { P.titulo = t.value || null; };
  const s = $('btSalvarPerfil'); if(s) s.onclick = async () => { s.disabled = true;
    const ok = await onlineDefinirPerfil(P.fav, P.titulo);
    if(ok){ P.dados.favoritos = P.fav.slice(); P.dados.titulo = P.titulo; P.editando = false; avisar('Perfil salvo'); } else avisar('Não deu para salvar agora. Tente de novo.');
    desenhar(); };
}
TELAS.perfil = [telaPerfil, ligarPerfil];
