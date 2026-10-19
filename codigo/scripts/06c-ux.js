// ---------- Experiência de jogo: opções, sons, vibração, tutorial, prévia de fusões, destaques e cartão do item ----------

// ---- opções do jogador (guardadas no perfil) ----
const OPC_PADRAO = {som:true, vibrar:true, textoGrande:false, daltonico:false, vel:1};
function opcoes(){ if(!PERFIL.opc) PERFIL.opc = Object.assign({}, OPC_PADRAO); return PERFIL.opc; }
function aplicarOpcoes(){ if(!temDOM) return; const o = opcoes(); document.body.classList.toggle('texto-grande', !!o.textoGrande); document.body.classList.toggle('daltonico', !!o.daltonico); }
// quem já jogou não vê o tutorial; quem chega agora começa da primeira dica
if(PERFIL && PERFIL.tutorial == null) PERFIL.tutorial = PERFIL.corridas ? 99 : 0;

// ---- sons feitos na hora pelo navegador (sem arquivos de áudio) ----
let audioCtx = null;
function ctxAudio(){
  if(!temDOM || typeof window === 'undefined') return null;
  const A = window.AudioContext || window.webkitAudioContext; if(!A) return null;
  if(!audioCtx) audioCtx = new A(); if(audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function somTom(c, t0, freq, dur, tipo, vol, freqFim){
  const o = c.createOscillator(), g = c.createGain(); o.type = tipo || 'sine';
  o.frequency.setValueAtTime(freq, t0); if(freqFim) o.frequency.exponentialRampToValueAtTime(freqFim, t0 + dur);
  g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .008); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + .02);
}
function somRuido(c, t0, dur, vol, filtro, freq){
  const n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for(let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = b; f.type = filtro || 'highpass'; f.frequency.value = freq || 2000; g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination); s.start(t0);
}
// uma martelada na bigorna: parciais metálicas fora da série harmônica que somem rápido, mais o estalo do golpe
function somMartelada(c, t0, forca){
  for(const [m, v, d] of [[1, .22, .9], [2.76, .12, .6], [5.4, .07, .4], [8.93, .04, .25]]) somTom(c, t0, 520 * m, d, 'sine', v * forca);
  somRuido(c, t0, .05, .25 * forca, 'highpass', 3000);
}
const SONS = {
  comprar: (c, t) => { somTom(c, t, 880, .08, 'triangle', .12); somTom(c, t + .07, 1320, .12, 'triangle', .1); },
  vender: (c, t) => { somTom(c, t, 1200, .07, 'triangle', .1); somTom(c, t + .06, 800, .12, 'triangle', .08); },
  encaixar: (c, t) => { somTom(c, t, 220, .07, 'square', .05, 140); somRuido(c, t, .03, .08, 'lowpass', 900); },
  golpe: (c, t) => { somRuido(c, t, .06, .12, 'bandpass', 1400); somTom(c, t, 160, .08, 'sine', .08, 90); },
  // fusão na forja: duas marteladas na bigorna e o chiado do metal quente na água
  fundir: (c, t) => { somMartelada(c, t, 1); somMartelada(c, t + .28, .8); somRuido(c, t + .55, .7, .08, 'highpass', 4500); },
  vitoria: (c, t) => [523, 659, 784, 1046].forEach((f, i) => somTom(c, t + i * .1, f, .35, 'triangle', .12)),
  derrota: (c, t) => [392, 330, 262].forEach((f, i) => somTom(c, t + i * .14, f, .4, 'triangle', .1)),
  festa: (c, t) => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => somTom(c, t + i * .09, f, .3, 'triangle', .12)),
};
const ultimoSom = {};
function som(nome){
  try{ if(!opcoes().som || !SONS[nome]) return; const c = ctxAudio(); if(!c) return;
    const agora = performance.now(); if(ultimoSom[nome] && agora - ultimoSom[nome] < 70) return; ultimoSom[nome] = agora;
    SONS[nome](c, c.currentTime + .01); }catch(e){}
}
function vibrar(ms){ try{ if(opcoes().vibrar && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms); }catch(e){} }

// ---- ícones de efeito no meio dos textos dos itens ----
const EFX_RE = /\b(queim\w*|envenen\w*|veneno|gelo|bloqueio|cura|curam|vida|força|mana|esquiva|vigor)/gi;
const EFX_IC = w => /^queim/i.test(w) ? 'chama' : /^(envenen|veneno)/i.test(w) ? 'caveira' : /^gelo/i.test(w) ? 'gelo' : /^bloqueio/i.test(w) ? 'escudo'
  : /^(cura|vida)/i.test(w) ? 'coracao' : /^força/i.test(w) ? 'martelo' : /^mana/i.test(w) ? 'cristal' : /^esquiva/i.test(w) ? 'vento' : 'raio';
const textoIcones = t => String(t || '').replace(EFX_RE, w => ic(EFX_IC(w), 'efx') + w);

// ---- prévia das fusões: pares de receita já encostados na mochila ----
function paresFusao(m){
  const M = new Map(), pode = RECEITAS.filter(r => receitaVale(r, C.nivel || 1, C.classe));
  for(const p of m.pecas){ if(ehBolsa(p) || M.has(p.uid)) continue;
    for(const q of vizinhos(m, p)){ if(M.has(q.uid)) continue;
      const r = pode.find(([a, b]) => (a === p.id && b === q.id) || (a === q.id && b === p.id));
      if(r){ M.set(p.uid, {vira:r[2], mostra:true}); M.set(q.uid, {vira:r[2], mostra:false}); break; } } }
  return M;
}
// o que um item (segurado ou escolhido na vitrine) tem com uma peça da mochila: 'par' (fundem) ou 'ajuda' (um melhora o outro)
function relacaoCom(id, q){
  if(RECEITAS.some(r => ((r[0] === id && r[1] === q.id) || (r[1] === id && r[0] === q.id)) && receitaVale(r, C.nivel || 1, C.classe))) return 'par';
  const A = ITEM[id], B = ITEM[q.id];
  return (A.viz && combina(B, A.viz.alvo)) || (B.viz && combina(A, B.viz.alvo)) ? 'ajuda' : null;
}
function marcarRelacoes(id, semUid){
  esconderCartao();
  raiz().querySelectorAll('.mochila .peca').forEach(el => { el.classList.remove('rel-par', 'rel-ajuda'); if(!id) return;
    const p = C.mochila.pecas.find(q => q.uid === +el.dataset.uid); if(!p || p.uid === semUid || ehBolsa(p)) return;
    const r = relacaoCom(id, p); if(r) el.classList.add('rel-' + r); });
}

// ---- o ouro subindo e descendo ----
let ouroVisto = null;
function animarOuro(){
  const el = raiz().querySelector('.ph-acoes .ouro'); if(!el || !C) return;
  if(ouroVisto != null && C.ouro !== ouroVisto){ const d = C.ouro - ouroVisto, n = document.createElement('span');
    n.className = 'ouro-flut ' + (d > 0 ? 'mais' : 'menos'); n.textContent = (d > 0 ? '+' : '−') + Math.abs(d); el.appendChild(n); setTimeout(() => n.remove(), 900); }
  ouroVisto = C.ouro;
}

// ---- tutorial da primeira corrida ----
const PASSOS_TUT = [
  'Arraste um item da vitrine para dentro da mochila, nas casas com borda dourada. Só o que está na mochila luta.',
  'Toque num item para ver o que ele faz. Itens encostados se ajudam: ao segurar um item, os vizinhos que combinam acendem.',
  'Brilho dourado entre duas peças é fusão: no começo da luta elas viram um item melhor.',
  'Quando estiver pronto, toque em Lutar. A luta é automática: você só assiste.',
];
const tutorialAtivo = () => PERFIL.tutorial != null && PERFIL.tutorial < PASSOS_TUT.length;
function dicaTutorial(){
  if(!tutorialAtivo()) return ''; const k = PERFIL.tutorial;
  return `<div class="dica-tut"><span class="dt-passo">Dica ${k + 1} de ${PASSOS_TUT.length}</span><p>${PASSOS_TUT[k]}</p>
    <div class="dt-bts">${k >= 2 ? `<button class="btn sm" id="btTutOk">${k === PASSOS_TUT.length - 1 ? 'Entendi' : 'Próxima'}</button>` : ''}<button class="btn sm" id="btTutFim">Pular dicas</button></div></div>`;
}
function avancarTutorial(de){ if(PERFIL.tutorial === de){ PERFIL.tutorial++; gravarPerfil(); } }
function ligarTutorial(){
  const ok = $('btTutOk'); if(ok) ok.onclick = () => { PERFIL.tutorial++; gravarPerfil(); desenhar(); };
  const f = $('btTutFim'); if(f) f.onclick = () => { PERFIL.tutorial = 99; gravarPerfil(); desenhar(); };
}

// ---- cartão flutuante do item: passando o mouse, ou segurando o dedo no celular ----
function cartaoItem(id){
  const d = ITEM[id], rec = RECEITAS.filter(r => (r[0] === id || r[1] === id) && receitaVale(r, C.nivel || 1, C.classe)).slice(0, 3)
    .map(r => `<li>com <b>${ITEM[r[0] === id ? r[1] : r[0]].nome}</b> vira <b>${ITEM[r[2]].nome}</b></li>`).join('');
  return `<div class="ct-cab" style="--rar:${raridade(id).cor}"><span class="pic">${iconeItem(id)}</span><div><b>${d.nome}</b><small>${raridade(id).nome} · ${NOME_TIPO[d.tipo] || 'Item'}</small></div></div>
    <p>${textoIcones(d.texto)}</p>${rec ? `<ul class="ct-rec">${rec}</ul>` : ''}`;
}
function mostrarCartao(id, x, y){
  let c = $('cartao-item'); if(!c){ c = document.createElement('div'); c.id = 'cartao-item'; document.body.appendChild(c); }
  c.innerHTML = cartaoItem(id); c.hidden = false;
  const w = c.offsetWidth, h = c.offsetHeight;
  c.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x + 16)) + 'px'; c.style.top = Math.max(8, Math.min(window.innerHeight - h - 8, y + 16)) + 'px';
}
function esconderCartao(){ const c = typeof document !== 'undefined' && $('cartao-item'); if(c) c.hidden = true; }
let toqueLongo = null;
function ligarCartoes(){
  raiz().querySelectorAll('.mochila .peca:not(.bolsa), .bancada .peca, [data-loja]').forEach(el => {
    const id = () => el.dataset.loja != null ? C.loja[+el.dataset.loja] : (acharPeca(+el.dataset.uid) || {}).id;
    el.addEventListener('pointermove', ev => { if(ev.pointerType === 'mouse' && !(arr && arr.ativo) && id()) mostrarCartao(id(), ev.clientX, ev.clientY); });
    el.addEventListener('pointerleave', ev => { if(ev.pointerType === 'mouse') esconderCartao(); });
    el.addEventListener('pointerdown', ev => { if(ev.pointerType === 'mouse') return; clearTimeout(toqueLongo);
      toqueLongo = setTimeout(() => { if(!(arr && arr.ativo) && id()) mostrarCartao(id(), ev.clientX - 120, ev.clientY - 170); }, 450); });
  });
}
if(temDOM && typeof window !== 'undefined') window.addEventListener('pointerup', ev => { clearTimeout(toqueLongo); if(ev.pointerType !== 'mouse') setTimeout(esconderCartao, 1400); });

// ---- festa ao fechar 7 vitórias ----
function confete(){
  const c = document.createElement('div'), cores = ['#f2b350', '#e5533f', '#6cc35a', '#7ab8ff', '#c27aff']; c.className = 'confete';
  c.innerHTML = Array.from({length:70}, (_, i) => `<i style="left:${(Math.random() * 100).toFixed(1)}%;background:${cores[i % 5]};animation-delay:${(Math.random() * .9).toFixed(2)}s;animation-duration:${(2 + Math.random() * 1.6).toFixed(2)}s"></i>`).join('');
  document.body.appendChild(c); setTimeout(() => c.remove(), 4600);
}

// ---- tela de opções ----
function telaOpcoes(){
  const o = opcoes(), sw = (k, txt, sub) => `<label class="opc"><span><b>${txt}</b><small>${sub}</small></span><input type="checkbox" data-opc="${k}"${o[k] ? ' checked' : ''}></label>`;
  return `<section class="ranking-tela opcoes-tela"><h1>Opções</h1>
    ${sw('som', 'Sons', 'Compra, fusão na forja, golpes e vitória')}${sw('vibrar', 'Vibração', 'No celular, ao fundir e ao vencer')}
    ${sw('textoGrande', 'Texto maior', 'Letras maiores nas descrições, na loja e nas dicas')}${sw('daltonico', 'Raridade com letra', 'Mostra C, I, R, É ou L nos itens, além da cor')}
    <button class="btn sm" id="btTutDeNovo">Ver as dicas de novo</button><button class="btn" id="btVoltar">Voltar</button></section>`;
}
function ligarOpcoes(){
  raiz().querySelectorAll('[data-opc]').forEach(i => i.onchange = () => { opcoes()[i.dataset.opc] = i.checked; gravarPerfil(); aplicarOpcoes(); if(i.dataset.opc === 'som' && i.checked) som('comprar'); if(i.dataset.opc === 'vibrar' && i.checked) vibrar(60); });
  $('btTutDeNovo').onclick = () => { PERFIL.tutorial = 0; gravarPerfil(); avisar('As dicas aparecem na próxima loja'); };
  $('btVoltar').onclick = () => { tela = 'lobby'; desenhar(); };
}
TELAS.opcoes = [telaOpcoes, ligarOpcoes];
