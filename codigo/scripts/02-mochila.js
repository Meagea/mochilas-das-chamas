// ---------- A mochila: grade, formatos girados, bolsas, vizinhança e fusões ----------
// A área da mochila tem LARG × ALT casas. Só as casas abertas por bolsas aceitam itens. Cada peça na mochila é
// {uid, id, x, y, g}: (x, y) é o canto de cima à esquerda do formato já girado; g é o giro (0 a 3, de 90 em 90 graus).
const LARG = 9, ALT = 7;
let proxUid = 1;
// n: nível do item pelas cartas (0 a 10); só existe no modo normal (PROGRESSAO.md, seção 10)
const peca = (id, x, y, g, n) => { const p = {uid:proxUid++, id, x:x || 0, y:y || 0, g:g || 0}; if(n > 0) p.n = Math.min(10, n | 0); return p; };
// cada nível do item soma 5% nos números dele (dano, cura, bloqueio, queimadura, veneno...)
const POR_NIVEL_ITEM = .05, ESCALA_NIVEL = ['dano', 'bloqueio', 'cura', 'queimar', 'envenenar', 'regen', 'vida', 'espinhos', 'danoPorGelo'];
function escalarNivel(s, n){
  const f = 1 + POR_NIVEL_ITEM * n, esc = o => { if(!o) return o; const c = Object.assign({}, o); for(const k of ESCALA_NIVEL) if(typeof c[k] === 'number') c[k] = Math.max(c[k], Math.round(c[k] * f)); return c; };
  if(s.dano) s.dano = s.dano.map(v => Math.round(v * f));
  s.ao = esc(s.ao); s.semMana = esc(s.semMana); s.acerto = esc(s.acerto); s.inicio = esc(s.inicio); s.aoCritico = esc(s.aoCritico);
  if(s.aleatorio) s.aleatorio = s.aleatorio.map(esc);
}
// as casas do formato, giradas g vezes no sentido do relógio, com o canto em (0, 0)
const cacheForma = {};
function forma(id, g){
  const k = id + ':' + g; if(cacheForma[k]) return cacheForma[k];
  let cs = []; ITEM[id].forma.forEach((linha, y) => [...linha].forEach((c, x) => { if(c === '#') cs.push([x, y]); }));
  for(let i = 0; i < (g & 3); i++){ const h = Math.max(...cs.map(c => c[1])) + 1; cs = cs.map(([x, y]) => [h - 1 - y, x]); }
  const mx = Math.min(...cs.map(c => c[0])), my = Math.min(...cs.map(c => c[1]));
  cs = cs.map(([x, y]) => [x - mx, y - my]);
  return cacheForma[k] = {casas:cs, w:Math.max(...cs.map(c => c[0])) + 1, h:Math.max(...cs.map(c => c[1])) + 1};
}
const casasDe = p => forma(p.id, p.g).casas.map(([x, y]) => [p.x + x, p.y + y]);
const chave = (x, y) => x + ',' + y;
const ehBolsa = p => ITEM[p.id].tipo === 'bolsa';
function casasAbertas(m, semUid){ const S = new Set(); for(const p of m.pecas) if(ehBolsa(p) && p.uid !== semUid) for(const [x, y] of casasDe(p)) S.add(chave(x, y)); return S; }
const dentroDaArea = cs => cs.every(([x, y]) => x >= 0 && y >= 0 && x < LARG && y < ALT);

// pode pôr esta peça (id e giro) em (x, y)? ignora a própria peça (uid) quando ela está sendo movida
function podePor(m, id, g, x, y, uid){
  const cs = forma(id, g).casas.map(([a, b]) => [x + a, y + b]);
  if(!dentroDaArea(cs)) return false;
  if(ITEM[id].tipo === 'bolsa'){
    const outras = casasAbertas(m, uid);
    return cs.every(([a, b]) => !outras.has(chave(a, b)));
  }
  const abertas = casasAbertas(m), ocupadas = new Set();
  for(const p of m.pecas) if(!ehBolsa(p) && p.uid !== uid) for(const [a, b] of casasDe(p)) ocupadas.add(chave(a, b));
  return cs.every(([a, b]) => abertas.has(chave(a, b)) && !ocupadas.has(chave(a, b)));
}
// as peças que estão inteiras em cima de uma bolsa (andam junto com ela)
function carregadas(m, bolsa){ const S = new Set(casasDe(bolsa).map(c => chave(...c))); return m.pecas.filter(p => !ehBolsa(p) && casasDe(p).every(c => S.has(chave(...c)))); }
// põe ou move uma peça; bolsas levam o que está em cima. Devolve false se não couber
function por(m, pc, x, y, g){
  const ja = m.pecas.includes(pc);
  if(!podePor(m, pc.id, g, x, y, ja ? pc.uid : null)) return false;
  if(ja && ehBolsa(pc)){
    if(g !== pc.g) { if(carregadas(m, pc).length) return false; }   // bolsa cheia não gira
    const dx = x - pc.x, dy = y - pc.y; for(const q of carregadas(m, pc)){ q.x += dx; q.y += dy; }
  }
  pc.x = x; pc.y = y; pc.g = g;
  if(!ja) m.pecas.push(pc);
  return true;
}
// tira uma peça da mochila (uma bolsa leva junto o que está em cima); devolve as peças tiradas
function tirar(m, pc){
  const fora = [pc].concat(ehBolsa(pc) ? carregadas(m, pc) : []);
  m.pecas = m.pecas.filter(p => !fora.includes(p));
  return fora;
}
// o primeiro lugar onde a peça cabe (tentando os 4 giros); para o robô e para fusões
function lugarLivre(m, id, preferG){
  for(const g of [preferG || 0, 1, 2, 3, 0]) for(let y = 0; y < ALT; y++) for(let x = 0; x < LARG; x++) if(podePor(m, id, g, x, y)) return {x, y, g};
  return null;
}

// ---- vizinhança ----
const combina = (def, alvo) => def.tipo !== 'bolsa' && (!alvo.tipo || (Array.isArray(alvo.tipo) ? alvo.tipo.includes(def.tipo) : alvo.tipo === def.tipo))
  && (!alvo.tag || def.tags.includes(alvo.tag)) && (!alvo.id || alvo.id === def.id);
function vizinhos(m, p){
  const minhas = new Set(casasDe(p).map(c => chave(...c))), perto = new Set();
  for(const k of minhas){ const [x, y] = k.split(',').map(Number); for(const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const kk = chave(x + dx, y + dy); if(!minhas.has(kk)) perto.add(kk); } }
  return m.pecas.filter(q => q !== p && !ehBolsa(q) && casasDe(q).some(c => perto.has(chave(...c))));
}
// os números de cada peça depois dos bônus de bolsa e de vizinhança
function somarBonus(s, b){
  if(b.dano && s.dano) s.dano = [s.dano[0] + b.dano, s.dano[1] + b.dano];
  if(b.crit) s.crit = (s.crit || 0) + b.crit;
  if(b.cd) s.rapidez += b.cd;
  if(b.cura && s.ao && s.ao.cura) s.ao = Object.assign({}, s.ao, {cura:s.ao.cura + b.cura});
  if(b.bloqueio && s.ao && s.ao.bloqueio) s.ao = Object.assign({}, s.ao, {bloqueio:s.ao.bloqueio + b.bloqueio});
  if(b.aoMais && s.ao) for(const k in b.aoMais) if(s.ao[k]) s.ao = Object.assign({}, s.ao, {[k]:s.ao[k] + b.aoMais[k]});
  if(b.acerto && s.uso === 'arma'){ s.acerto = Object.assign({}, s.acerto); for(const k in b.acerto) s.acerto[k] = (s.acerto[k] || 0) + b.acerto[k]; }
}
function numeros(m){
  const R = {};
  for(const p of m.pecas){ if(ehBolsa(p)) continue; const d = ITEM[p.id];
    R[p.uid] = {uid:p.uid, id:p.id, uso:d.uso, cd:d.cd, custo:d.custo || 0, dano:d.dano ? d.dano.slice() : null, crit:d.crit || 0, acerto:Object.assign({}, d.acerto), ao:d.ao && Object.assign({}, d.ao),
      semMana:d.semMana, gastaMana:d.gastaMana || 0, inicio:d.inicio, quando:d.quando, t:d.t, rapidez:0, recebeu:[],
      furia:d.furia || 0, primeirosCrit:d.primeirosCrit || 0, aleatorio:d.aleatorio, aoCritico:d.aoCritico, n:p.n || 0};
    if(p.n > 0) escalarNivel(R[p.uid], p.n);
    oficioNumeros(m, p, R[p.uid]); }
  for(const b of m.pecas){ if(!ehBolsa(b) || !ITEM[b.id].dentro) continue; const D = ITEM[b.id].dentro;
    for(const p of carregadas(m, b)) if(combina(ITEM[p.id], D.alvo)){ somarBonus(R[p.uid], D.bonus); R[p.uid].recebeu.push(b.id); } }
  for(const p of m.pecas){ if(ehBolsa(p)) continue; const V = ITEM[p.id].viz; if(!V) continue;
    const viz = vizinhos(m, p).filter(q => combina(ITEM[q.id], V.alvo));
    if(V.modo === 'da') for(const q of viz){ somarBonus(R[q.uid], V.bonus); R[q.uid].recebeu.push(p.id); }
    else for(let i = 0; i < viz.length; i++) somarBonus(R[p.uid], V.bonus); }
  for(const k in R){ const s = R[k]; if(s.cd) s.cd = Math.max(s.cd * .4, s.cd * (1 - s.rapidez)); s.crit = Math.min(.75, s.crit); }
  return R;
}

// ---- classes de ofício: o que a têmpera, os brotos e o prato fazem nos números da peça ----
const ERVA = it => it.tags.includes('erva');
const POR_TEMPERA = 2, BLOQ_TEMPERA = 3;   // cada nível de têmpera: arma +2 de dano, armadura +3 de bloqueio
function oficioNumeros(m, p, s){
  const d = ITEM[p.id];
  if(p.tempera > 0){   // arma +POR_TEMPERA de dano por nível; armadura +BLOQ_TEMPERA de bloqueio
    if(s.dano) s.dano = s.dano.map(v => v + POR_TEMPERA * p.tempera);
    else if(s.ao && s.ao.bloqueio) s.ao = Object.assign({}, s.ao, {bloqueio:s.ao.bloqueio + BLOQ_TEMPERA * p.tempera});
    else s.inicio = Object.assign({}, s.inicio, {bloqueio:((s.inicio && s.inicio.bloqueio) || 0) + BLOQ_TEMPERA * p.tempera}); }
  if(p.brotos > 0) escalarPor(s, 1 + .25 * p.brotos);
  if(p.prato){ escalarPor(s, 1.6); s.inicio = Object.assign({}, s.inicio, {vida:((s.inicio && s.inicio.vida) || 0) + 4}); }
  if(d.porTempera && s.dano){ const t = m.pecas.reduce((a, q) => a + (q.tempera || 0), 0); s.dano = s.dano.map(v => v + t * d.porTempera); }
  if(d.porComida){ const n = m.pecas.filter(q => ITEM[q.id].tipo === 'comida').length; s.inicio = Object.assign({}, s.inicio); for(const k in d.porComida) s.inicio[k] = (s.inicio[k] || 0) + d.porComida[k] * n; }
  // poção de gatilho encostada no Kit de Herbalismo funciona duas vezes
  if(d.uso === 'gatilho' && d.tipo === 'pocao' && vizinhos(m, p).some(q => ITEM[q.id].oficio === 'cultivo')) s.usos = 2;
}
function escalarPor(s, f){
  const esc = o => { if(!o) return o; const c = Object.assign({}, o); for(const k of ESCALA_NIVEL.concat(['vigor', 'mana'])) if(typeof c[k] === 'number') c[k] = Math.max(c[k], Math.round(c[k] * f)); return c; };
  if(s.dano) s.dano = s.dano.map(v => Math.round(v * f));
  s.ao = esc(s.ao); s.semMana = esc(s.semMana); s.acerto = esc(s.acerto);
}

// ---- fusões: duas peças da receita encostadas viram uma só (as receitas com nível só a partir dele) ----
function fundir(m, nivel){
  const pode = RECEITAS.filter(r => !r[3] || (nivel == null ? 99 : nivel) >= r[3]);
  const feitas = [];
  for(let guarda = 0; guarda < 10; guarda++){
    let achou = null;
    for(const p of m.pecas){ if(ehBolsa(p)) continue;
      for(const q of vizinhos(m, p)){ const r = pode.find(([a, b]) => (a === p.id && b === q.id) || (a === q.id && b === p.id)); if(r){ achou = {p, q, r}; break; } }
      if(achou) break; }
    if(!achou) break;
    const {p, q, r} = achou; m.pecas = m.pecas.filter(x => x !== p && x !== q);
    const nova = peca(r[2], 0, 0, 0, Math.round(((p.n || 0) + (q.n || 0)) / 2)), pr = [p, q].map(x => ({x:x.x, y:x.y, g:x.g})).concat([lugarLivre(m, r[2])].filter(Boolean)).find(l => podePor(m, r[2], l.g, l.x, l.y));
    if(pr) por(m, nova, pr.x, pr.y, pr.g); else m.bancada.push(nova);
    feitas.push(r[2]);
  }
  return feitas;
}

// ---- foto da mochila (o que vai para o servidor e volta como adversário) ----
// a foto leva também o que o ofício fez na peça (têmpera, brotos, cozimento)
const fotoMochila = m => m.pecas.slice().sort((a, b) => ehBolsa(b) - ehBolsa(a)).map(p => { const f = {id:p.id, x:p.x, y:p.y, g:p.g};
  for(const k of ['n', 'tempera', 'brotos', 'cozido']) if(p[k] > 0) f[k] = p[k]; if(p.prato) f.prato = 1; return f; });
function deFoto(L){
  const m = {pecas:[], bancada:[]};
  for(const f of L || []) if(ITEM[f.id] && Number.isInteger(f.x) && Number.isInteger(f.y)){ const p = peca(f.id, 0, 0, 0, Number(f.n) || 0);
    const lim = (v, mx) => Math.max(0, Math.min(mx, Number(v) || 0) | 0);
    if(f.tempera) p.tempera = lim(f.tempera, 5); if(f.brotos) p.brotos = lim(f.brotos, 5); if(f.cozido) p.cozido = lim(f.cozido, 3); if(f.prato && ITEM[f.id].tipo === 'comida') p.prato = true;
    por(m, p, f.x, f.y, (f.g || 0) & 3); }
  return m;
}
function mochilaNova(classe){
  const m = {pecas:[], bancada:[]};
  por(m, peca('mochila'), 3, 2, 0);
  por(m, peca(CLASSES[classe].inicial), 3, 2, 0) || m.bancada.push(peca(CLASSES[classe].inicial));
  return m;
}
