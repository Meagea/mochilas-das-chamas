// ---------- Computador: atalhos de teclado, mouse (girar, comprar com duplo clique, vender com Shift) e a lista de atalhos ----------
const digitando = () => { const a = typeof document !== 'undefined' && document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); };
const ATALHOS = [
  ['Loja', [['Espaço ou Enter', 'Lutar'], ['1 a 5', 'Comprar o item da vaga'], ['T', 'Trocar a vitrine'], ['R ou clique direito', 'Girar a peça'], ['V ou Shift + clique', 'Vender a peça'], ['Duplo clique na vitrine', 'Comprar e encaixar'], ['Roda do mouse', 'Girar a peça que está sendo arrastada'], ['Esc', 'Soltar a seleção']]],
  ['Luta', [['1, 2 ou 4', 'Velocidade'], ['Espaço', 'Pular para o resultado'], ['Enter', 'Continuar']]],
  ['Geral', [['?', 'Mostrar ou esconder esta lista'], ['F11', 'Tela cheia (no aplicativo)']]],
];
function painelAtalhos(){
  let p = $('atalhos'); if(p){ p.remove(); return; }
  p = document.createElement('div'); p.id = 'atalhos';
  p.innerHTML = `<div class="at-caixa"><h2>Atalhos</h2>${ATALHOS.map(([t, L]) => `<h3>${t}</h3><dl>${L.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`).join('')}<button class="btn" id="btFecharAtalhos">Fechar</button></div>`;
  document.body.appendChild(p); p.onclick = ev => { if(ev.target === p || ev.target.id === 'btFecharAtalhos') p.remove(); };
}
function comprarDaVaga(i){
  if(!C || !C.loja[i]) return;
  if(ITEM[C.loja[i]].preco > C.ouro){ avisar('Ouro insuficiente'); return; }
  const p = comprar(i); if(!p) return;
  colocarNaMochila(p); sel = {onde:C.mochila.pecas.includes(p) ? 'mochila' : 'bancada', p};
  som('comprar'); avancarTutorial(0); salvarCorrida(); desenhar();
}
function venderSel(p){
  if(!p || ITEM[p.id].inicial){ if(p) avisar('Este item não pode ser vendido'); return; }
  vender(p); sel = null; som('vender'); salvarCorrida(); desenhar();
}
if(temDOM && typeof window !== 'undefined'){
  window.addEventListener('keydown', ev => {
    if(digitando() || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if(ev.key === '?'){ painelAtalhos(); return; }
    if(ev.key === 'Escape'){ const a = $('atalhos'); if(a){ a.remove(); return; } if(arr){ cancelarArrasto(); desenhar(); return; } if(tela === 'loja' && sel){ sel = null; desenhar(); } return; }
    if(tela === 'loja' && !(arr && arr.ativo)){
      if(ev.key === ' ' || ev.key === 'Enter'){ ev.preventDefault(); const b = $('btLutar'); if(b && !b.disabled) b.click(); }
      else if(ev.key === 't' || ev.key === 'T'){ const b = $('btTrocar'); if(b && !b.disabled) b.click(); }
      else if((ev.key === 'v' || ev.key === 'V') && sel && sel.p) venderSel(sel.p);
      else if(/^[1-9]$/.test(ev.key) && +ev.key <= C.loja.length) comprarDaVaga(+ev.key - 1);
    } else if(tela === 'luta' && lutaAtual){
      const vel = {'1':1, '2':2, '4':4}[ev.key];
      if(vel){ const b = raiz().querySelector(`[data-vel="${vel}"]`); if(b) b.click(); }
      else if(ev.key === ' '){ ev.preventDefault(); if(!lutaAtual.fechada) lutaAtual.tempo = 1e9; }
      else if(ev.key === 'Enter'){ const b = $('btSeguir'); if(b) b.click(); }
    } else if(tela === 'fim' && ev.key === 'Enter'){ const b = $('btDeNovo'); if(b) b.click(); }
  });
  // clique direito numa peça da mochila gira (durante o arrasto, o 06-telas já gira a peça segurada)
  window.addEventListener('contextmenu', ev => {
    if(tela !== 'loja' || (arr && arr.ativo)) return;
    const el = ev.target.closest && ev.target.closest('.mochila .peca, .bancada .peca'); if(!el) return;
    ev.preventDefault(); const p = acharPeca(+el.dataset.uid); if(p){ sel = {onde:C.mochila.pecas.includes(p) ? 'mochila' : 'bancada', p}; girar(p); desenhar(); }
  });
  // roda do mouse gira a peça que está sendo arrastada
  window.addEventListener('wheel', ev => {
    if(!(arr && arr.ativo)) return; ev.preventDefault();
    arr.g = (arr.g + (ev.deltaY > 0 ? 1 : 3)) & 3; const f = forma(arr.id, arr.g); arr.cx = Math.min(arr.cx, f.w - 1); arr.cy = Math.min(arr.cy, f.h - 1); desenharFantasma();
  }, {passive:false});
  // Shift + clique numa peça vende na hora (antes de começar o arrasto)
  window.addEventListener('pointerdown', ev => {
    if(tela !== 'loja' || !ev.shiftKey || ev.button > 0) return;
    const el = ev.target.closest && ev.target.closest('.mochila .peca, .bancada .peca'); if(!el) return;
    ev.stopPropagation(); ev.preventDefault(); venderSel(acharPeca(+el.dataset.uid));
  }, true);
}
// duplo clique (ou dois toques) no mesmo item da vitrine: compra e encaixa no melhor lugar
let ultimoToqueLoja = null;
function duploNaVitrine(i){
  const agora = Date.now(), d = ultimoToqueLoja && ultimoToqueLoja.i === i && agora - ultimoToqueLoja.t < 380;
  ultimoToqueLoja = d ? null : {i, t:agora};
  return d;
}
