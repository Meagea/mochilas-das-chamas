// ---------- Celular: aplicativo Android (botão voltar, tela acesa na luta, aviso da vitrine) e arrasto com o dedo ----------
const nativo = () => typeof window !== 'undefined' && !!window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();
const plugin = nome => nativo() && window.Capacitor.Plugins ? window.Capacitor.Plugins[nome] : null;
const celularEmPe = () => typeof window !== 'undefined' && window.innerWidth <= 900 && window.innerHeight > window.innerWidth;

// ---- botão voltar do Android: fecha o que estiver aberto e volta uma tela; no lobby, minimiza em vez de fechar ----
function voltarAndroid(){
  const at = $('atalhos'); if(at){ at.remove(); return; }
  if(arr){ cancelarArrasto(); desenhar(); return; }
  if(tela === 'loja' && sel){ sel = null; desenhar(); return; }
  if(tela === 'luta'){ if(lutaAtual && !lutaAtual.fechada) lutaAtual.tempo = 1e9; else { const b = $('btSeguir'); if(b) b.click(); } return; }
  if(tela === 'loja'){ salvarCorrida(); tela = 'lobby'; desenhar(); return; }
  if(tela !== 'lobby'){ tela = 'lobby'; desenhar(); return; }
  const A = plugin('App'); if(A && A.minimizeApp) A.minimizeApp();
}
// ---- tela acesa só durante a luta ----
let telaAcesa = false;
function cuidarTelaAcesa(){
  const K = plugin('KeepAwake'); if(!K) return; const quer = tela === 'luta';
  if(quer === telaAcesa) return; telaAcesa = quer;
  try{ (quer ? K.keepAwake() : K.allowSleep()).catch(() => {}); }catch(e){}
}
// ---- aviso quando a vitrine diária de cartas renovar (notificação local, sem servidor) ----
async function agendarAvisoVitrine(){
  const N = plugin('LocalNotifications'); if(!N || !opcoes().avisos) return;
  try{
    await N.cancel({notifications:[{id:1}]});
    const L = await onlineCarrinho('dia'), quando = L && L[0] && L[0].troca_em ? new Date(L[0].troca_em) : null;
    if(!quando || quando <= new Date()) return;
    await N.schedule({notifications:[{id:1, title:'Bornal de Guerra', body:'A vitrine de cartas do dia renovou. Venha ver as ofertas!', schedule:{at:new Date(quando.getTime() + 60000), allowWhileIdle:true}}]});
  }catch(e){}
}
async function ligarAvisos(liga){
  const N = plugin('LocalNotifications'); if(!N) return false;
  if(liga){ try{ const p = await N.requestPermissions(); if(p.display !== 'granted'){ avisar('Sem permissão para avisos. Libere nas configurações do celular.', 3200); return false; } }catch(e){ return false; } }
  opcoes().avisos = liga; gravarPerfil();
  if(liga) agendarAvisoVitrine(); else { try{ await N.cancel({notifications:[{id:1}]}); }catch(e){} }
  return true;
}
if(temDOM && typeof window !== 'undefined'){
  // o Capacitor injeta os plugins quando o aplicativo abre; espera um pouco e liga o botão voltar
  setTimeout(() => {
    const A = plugin('App'); if(A && A.addListener) A.addListener('backButton', voltarAndroid);
    if(A && A.addListener) A.addListener('appStateChange', s => { if(s.isActive) agendarAvisoVitrine(); });
    agendarAvisoVitrine();
  }, 800);
}

// ---- arrasto com o dedo: a peça aparece acima do dedo e um botão Girar flutua enquanto arrasta ----
const DEDO = () => -Math.round(TAM * 1.3);
const comDedo = ev => arr && arr.toque ? {clientX:ev.clientX, clientY:ev.clientY + DEDO()} : ev;
function botaoGirarArrasto(mostra){
  let b = $('btGirarArrasto');
  if(!mostra){ if(b) b.hidden = true; return; }
  if(!b){ b = document.createElement('button'); b.id = 'btGirarArrasto'; b.className = 'btn'; b.textContent = 'Girar'; document.body.appendChild(b);
    b.addEventListener('pointerdown', ev => { ev.stopPropagation(); ev.preventDefault(); if(!(arr && arr.ativo)) return;
      arr.g = (arr.g + 1) & 3; const f = forma(arr.id, arr.g); arr.cx = Math.min(arr.cx, f.w - 1); arr.cy = Math.min(arr.cy, f.h - 1); desenharFantasma(); }); }
  b.hidden = false;
}
