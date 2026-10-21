// ---------- Base: sorteio com semente, imagens embutidas e ícones ----------
const temDOM = typeof document !== 'undefined' && typeof Image !== 'undefined';
const uiAtiva = temDOM && !(typeof window !== 'undefined' && window.__semUI);
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// sorteio com semente: a mesma semente repete os mesmos resultados (a luta e os testes dependem disso)
function semente(s){ let x = s >>> 0 || 1; const f = () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  f.estado = () => x; f.por = v => { x = v >>> 0 || 1; }; return f; }
let rng = semente(Date.now() & 0xffffff);
const sortear = (L, r) => L[((r || rng)() * L.length) | 0];
const entre = (a, b, r) => a + (((r || rng)() * (b - a + 1)) | 0);
const misturar = (s, n) => (Math.imul(s ^ (n * 2654435761), 1597334677) >>> 0) || 1;   // semente derivada (para cada rodada, cada luta)

// ---- arte embutida pelo build ----
const ARTE = '__ARTE__';
const urls = {};
function urlArte(nome){
  if(!ARTE[nome]) return null;
  if(urls[nome]) return urls[nome];
  if(!temDOM) return ARTE[nome];
  try{ const [cab, dados] = ARTE[nome].split(','), bin = atob(dados), b = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return urls[nome] = URL.createObjectURL(new Blob([b], {type:cab.slice(5, cab.indexOf(';'))})); }
  catch(e){ return urls[nome] = ARTE[nome]; }
}
// ícone pintado; sem a pintura, um losango no lugar (nunca emoji)
function ic(nome, classe){
  const src = urlArte('ic-' + nome) || urlArte(nome);
  return src ? `<img class="ic${classe ? ' ' + classe : ''}" src="${src}" alt="" draggable="false">` : `<i class="ic losango${classe ? ' ' + classe : ''}"></i>`;
}
function avisar(txt, ms){ if(!uiAtiva) return; const a = $('aviso'); a.textContent = txt; a.hidden = false; clearTimeout(avisar.t); avisar.t = setTimeout(() => { a.hidden = true; }, ms || 1900); }
const guardar = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){ /* sem armazenamento: só não guarda */ } };
const ler = (k, padrao) => { try{ const s = localStorage.getItem(k); return s ? JSON.parse(s) : padrao; }catch(e){ return padrao; } };
// uma vez só: o progresso guardado com as chaves do nome antigo do jogo passa para as chaves bdg- (Bornal de Guerra)
try{ if(typeof localStorage !== 'undefined') for(const k of ['perfil', 'corrida', 'sessao']){ const v = localStorage.getItem('td' + 'g-' + k); if(v != null){ if(localStorage.getItem('bdg-' + k) == null) localStorage.setItem('bdg-' + k, v); localStorage.removeItem('td' + 'g-' + k); } } }catch(e){}
