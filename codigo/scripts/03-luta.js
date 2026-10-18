// ---------- A luta: automática e determinística ----------
// Duas mochilas, uma semente: o resultado é sempre o mesmo (o servidor pode conferir uma luta no futuro).
// A luta anda em passos de 0,1 s. Cada item conta o seu tempo e age quando chega a vez; armas gastam vigor.
// Efeitos: bloqueio (absorve dano), força (+1 de dano por golpe de arma), queimadura (fere a cada 1 s e diminui 1),
// veneno (fere a cada 2 s e não diminui, passa por cima do bloqueio), regeneração (cura a cada 2 s), esquiva (desvia um golpe de arma),
// gelo (cada ponto deixa os itens 5% mais lentos; some 1 a cada 2 s), espinhos (devolve dano a cada golpe de arma recebido), mana.
// Depois de 30 s vem o cansaço: os dois perdem vida a cada segundo, cada vez mais.
const PASSO_LUTA = .1, CANSACO = 30, LIMITE_LUTA = 90, VIGOR_MAX = 5;
function lutador(m, classe, nome){
  const N = numeros(m), C = CLASSES[classe];
  const L = {nome, classe, vida:C.vida, max:C.vida, vigor:3, bloq:0, forca:0, queima:0, veneno:0, regen:0, esquiva:0, gelo:0, espinhos:0, mana:0,
    atord:0, raiva:0, perdeu:0, aoCrit:[], semRessaca:m.pecas.some(p => ITEM[p.id].semRessaca), itens:[]};
  for(const p of m.pecas){ const s = N[p.uid]; if(!s) continue;
    L.itens.push(Object.assign(s, {x:p.x, y:p.y, g:p.g, t:0, usado:false, golpes:0, usou:0, espera:0}));
    if(s.inicio) aplicarInicio(L, s.inicio);   // passivos, e também têmpera ou prato em itens que agem
    if(s.aoCritico) L.aoCrit.push({ao:s.aoCritico, k:L.itens.length - 1}); }
  L.vida = L.max; L.vigor = Math.min(VIGOR_MAX + 2, L.vigor);
  return L;
}
function aplicarInicio(L, ini){
  if(ini.vida){ L.max += ini.vida; }
  if(ini.raiva) L.raiva = L.raiva ? Math.min(L.raiva, ini.raiva) : ini.raiva;
  for(const k of ['bloq', 'forca', 'esquiva', 'mana', 'espinhos', 'vigor', 'regen']) { const de = k === 'bloq' ? 'bloqueio' : k; if(ini[de]) L[k] += ini[de]; }
}
function lutar(mA, classeA, nomeA, mB, classeB, nomeB, sem){
  const r = semente(sem), A = lutador(mA, classeA, nomeA), B = lutador(mB, classeB, nomeB), ev = [];
  let t = 0, fim = null, cansaco = 0;
  const foto = () => [A, B].map(L => ({vida:Math.max(0, Math.round(L.vida)), max:L.max, bloq:L.bloq, vigor:Math.floor(L.vigor), forca:L.forca, queima:L.queima, veneno:L.veneno, regen:L.regen, esquiva:L.esquiva, gelo:L.gelo, espinhos:L.espinhos, mana:L.mana}));
  const marca = (lado, tipo, o) => ev.push(Object.assign({t:Math.round(t * 100) / 100, lado, tipo}, o, {foto:foto()}));
  // fere um lado: o bloqueio absorve antes (menos o que a arma atravessa); veneno e cansaço passam por cima
  function ferir(alvo, lado, v, o){
    o = o || {}; v = Math.max(0, Math.round(v)); if(!v) return 0;
    let bl = 0;
    if(!o.direto){ const pode = Math.max(0, alvo.bloq - (o.perfura || 0)); bl = Math.min(pode, v); alvo.bloq -= bl; v -= bl; }
    alvo.vida -= v;
    marca(lado, o.tipo || 'dano', {valor:v, bloqueado:bl, item:o.item, crit:o.crit});
    // raiva: cada tanto de vida perdida vira força
    if(alvo.raiva && v > 0){ alvo.perdeu += v; while(alvo.perdeu >= alvo.raiva){ alvo.perdeu -= alvo.raiva; alvo.forca++; marca(lado, 'forca', {valor:1}); } }
    return v;
  }
  function curar(L, lado, v, item){ v = Math.round(v); const antes = L.vida; L.vida = Math.min(L.max, L.vida + v); if(L.vida > antes) marca(lado, 'cura', {valor:Math.round(L.vida - antes), item}); }
  function efeito(eu, ini, ladoEu, ao, item){
    const ladoIni = 1 - ladoEu;
    if(ao.bloqueio){ eu.bloq += ao.bloqueio; marca(ladoEu, 'bloqueio', {valor:ao.bloqueio, item}); }
    if(ao.cura) curar(eu, ladoEu, ao.cura, item);
    if(ao.vigor) eu.vigor = Math.min(VIGOR_MAX + 3, eu.vigor + ao.vigor);
    if(ao.forca){ eu.forca += ao.forca; marca(ladoEu, 'forca', {valor:ao.forca, item}); }
    if(ao.esquiva){ eu.esquiva += ao.esquiva; marca(ladoEu, 'esquiva', {valor:ao.esquiva, item}); }
    if(ao.mana) eu.mana += ao.mana;
    if(ao.regen) eu.regen += ao.regen;
    if(ao.espinhos) eu.espinhos += ao.espinhos;
    if(ao.queimar){ ini.queima += ao.queimar; marca(ladoIni, 'queima', {valor:ao.queimar, item}); }
    if(ao.envenenar){ ini.veneno += ao.envenenar; marca(ladoIni, 'veneno', {valor:ao.envenenar, item}); }
    if(ao.gelo){ ini.gelo += ao.gelo; marca(ladoIni, 'gelo', {valor:ao.gelo, item}); }
    if(ao.ressaca && !eu.semRessaca) ferir(eu, ladoEu, ao.ressaca, {tipo:'ressaca', direto:true});
    if(ao.corroer && ini.bloq > 0){ const v = Math.min(ini.bloq, ao.corroer); ini.bloq -= v; marca(ladoIni, 'corroeu', {valor:v, item}); }
    if(ao.atordoar){ ini.atord = Math.max(ini.atord, ao.atordoar); marca(ladoIni, 'atordoado', {valor:ao.atordoar, item}); }
    if(ao.multVeneno && ini.veneno > 0){ const mais = Math.floor(ini.veneno * ao.multVeneno); if(mais){ ini.veneno += mais; marca(ladoIni, 'veneno', {valor:mais, item}); } }
    if(ao.dano) ferir(ini, ladoIni, ao.dano + (ao.danoPorGelo ? ao.danoPorGelo * ini.gelo : 0), {item, tipo:'magia'});
  }
  function golpe(eu, ini, ladoEu, s, k){
    const ladoIni = 1 - ladoEu, golpes = (s.acerto && s.acerto.golpes) || 1;
    for(let i = 0; i < golpes && ini.vida > 0; i++){
      if(ini.esquiva > 0){ ini.esquiva--; marca(ladoIni, 'esquivou', {item:k}); continue; }
      const fur = s.furia ? Math.floor(s.furia * (1 - Math.max(0, eu.vida) / eu.max)) : 0;
      const crit = s.golpes++ < s.primeirosCrit || r() < s.crit, base = entre(s.dano[0], s.dano[1], r) + eu.forca + fur, v = base * (crit ? 2 : 1);
      const feito = ferir(ini, ladoIni, v, {item:k, crit, perfura:s.acerto && s.acerto.perfura});
      if(s.acerto){ const a = Object.assign({}, s.acerto); delete a.perfura; delete a.golpes; efeito(eu, ini, ladoEu, a, k); }
      if(crit){ if(s.noCrit) efeito(eu, ini, ladoEu, s.noCrit, k); for(const c of eu.aoCrit) efeito(eu, ini, ladoEu, c.ao, c.k); }
      if(ini.espinhos && feito >= 0) ferir(eu, ladoEu, ini.espinhos, {tipo:'espinhos', direto:false});
    }
  }
  function agir(eu, ini, lado){
    if(eu.atord > 0){ eu.atord = Math.max(0, eu.atord - PASSO_LUTA); return; }   // atordoado: nada anda
    const lento = 1 + eu.gelo * .05;
    eu.itens.forEach((s, k) => {
      if(s.uso === 'arma' || s.uso === 'ativo'){
        s.t += PASSO_LUTA / lento;
        if(s.t + 1e-9 < s.cd) return;
        if(s.uso === 'arma'){
          if(eu.vigor < s.custo) return;          // espera o vigor
          eu.vigor -= s.custo; s.t = 0; marca(lado, 'ataque', {item:k}); golpe(eu, ini, lado, s, k);
        } else {
          s.t = 0;
          if(s.gastaMana){ if(eu.mana >= s.gastaMana){ eu.mana -= s.gastaMana; marca(lado, 'magia', {item:k}); efeito(eu, ini, lado, s.ao, k); }
            else if(s.semMana){ marca(lado, 'magia', {item:k, fraca:true}); efeito(eu, ini, lado, s.semMana, k); } }
          else { marca(lado, 'ativa', {item:k}); efeito(eu, ini, lado, s.aleatorio ? s.aleatorio[Math.floor(r() * s.aleatorio.length)] : s.ao, k); }
        }
      } else if(s.uso === 'gatilho' && !s.usado && t >= s.espera){
        // poção perto do Kit de Herbalismo (usos 2) volta a funcionar 5 s depois
        if((s.quando === 'vidaBaixa' && eu.vida < eu.max / 2) || (s.quando === 'tempo' && t >= s.t)){ s.usou++; s.usado = s.usou >= (s.usos || 1); s.espera = t + 5; marca(lado, 'ativa', {item:k}); efeito(eu, ini, lado, s.ao, k); }
      }
    });
  }
  // começo da luta: o que alguns itens põem direto no inimigo (Coroa do Inverno)
  [A, B].forEach((L, lado) => { for(const s of L.itens) if(s.inicioInimigo){ const o = lado ? A : B; for(const k in s.inicioInimigo) o[k] = (o[k] || 0) + s.inicioInimigo[k]; } });
  marca(-1, 'inicio', {});
  for(let passo = 1; t < LIMITE_LUTA && fim === null; passo++){
    t = passo * PASSO_LUTA;
    for(const L of [A, B]) L.vigor = Math.min(VIGOR_MAX, L.vigor + PASSO_LUTA);
    agir(A, B, 0); if(A.vida > 0 && B.vida > 0) agir(B, A, 1);
    // a cada segundo: queimadura, regeneração; a cada 2 s: veneno, o gelo derrete
    if(passo % 10 === 0){
      [A, B].forEach((L, lado) => {
        if(L.queima > 0){ ferir(L, lado, L.queima, {tipo:'queimadura'}); L.queima--; }
        if(passo % 20 === 0){ if(L.veneno > 0) ferir(L, lado, L.veneno, {tipo:'venenoDano', direto:true}); if(L.regen > 0) curar(L, lado, L.regen); if(L.gelo > 0) L.gelo--; }
      });
      if(t > CANSACO){ cansaco++; [A, B].forEach((L, lado) => ferir(L, lado, cansaco, {tipo:'cansaco', direto:true})); }
    }
    // Semente do Mundo: quem cai volta uma vez com metade da vida
    [A, B].forEach((L, lado) => { if(L.vida > 0) return; const k = L.itens.findIndex(s => s.uso === 'gatilho' && s.quando === 'morte' && !s.usado);
      if(k >= 0){ L.itens[k].usado = true; L.vida = Math.round(L.max / 2); marca(lado, 'ativa', {item:k}); marca(lado, 'cura', {valor:L.vida, item:k}); } });
    if(A.vida <= 0 || B.vida <= 0) fim = A.vida <= 0 && B.vida <= 0 ? (A.vida >= B.vida ? 0 : 1) : (A.vida > 0 ? 0 : 1);
  }
  if(fim === null) fim = A.vida / A.max >= B.vida / B.max ? 0 : 1;
  marca(fim, 'fim', {});
  return {vencedor:fim, duracao:t, eventos:ev, lados:[A, B].map(L => ({nome:L.nome, classe:L.classe, max:L.max, itens:L.itens.map(s => ({id:s.id, x:s.x, y:s.y, g:s.g, cd:s.cd}))}))};
}
