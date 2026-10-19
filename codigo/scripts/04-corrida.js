// ---------- A corrida: rodadas de loja e luta, até 7 vitórias ou 3 derrotas ----------
const VITORIAS_META = 7, VIDAS = 3, TAM_LOJA = 5, OURO_INICIAL = 12;
// chance de cada raridade na loja, por rodada (comum, incomum, rara, épica, lendária)
const CHANCES = [[85, 15, 0, 0, 0], [70, 27, 3, 0, 0], [55, 32, 12, 1, 0], [45, 33, 18, 4, 0], [35, 33, 23, 8, 1], [28, 32, 26, 11, 3], [22, 30, 28, 15, 5]];
const renda = (rodada, perdeuAntes) => 7 + Math.min(rodada, 6) + (perdeuAntes ? 2 : 0);
const precoVenda = id => ITEM[id].inicial || ITEM[id].gerado ? 0 : Math.max(1, Math.floor(ITEM[id].preco / 2));
const custoTroca = trocas => trocas < 4 ? 1 : 2;
// nivel do personagem: itens da classe acima dele não aparecem
const naLoja = (it, classe, nivel) => !it.inicial && !it.fusao && !it.gerado && (!it.classe || (it.classe === classe && it.nivel <= (nivel || 1)));
function sortearLoja(classe, rodada, r, nivel){
  const ch = CHANCES[Math.min(rodada, CHANCES.length) - 1], L = [];
  for(let i = 0; i < TAM_LOJA; i++){
    let x = r() * 100, rar = 'comum'; for(let k = 0; k < 5; k++){ if(x < ch[k]){ rar = ORDEM_RAR[k]; break; } x -= ch[k]; }
    // os itens da classe aparecem 3 vezes mais que os comuns a todos
    const pool = ITENS.filter(it => naLoja(it, classe, nivel) && it.rar === rar && !L.includes(it.id)).flatMap(it => it.classe ? [it, it, it] : [it]);
    L.push(sortear(pool.length ? pool : ITENS.filter(it => naLoja(it, classe, nivel) && it.rar === 'comum'), r).id);
  }
  return L;
}

// ---- a corrida do jogador ----
let C = null;   // corrida em andamento
// modo: 'ranqueada' (todos os itens no nível 0, vale ranking) ou 'normal' (cada item no nível da coleção: niveis = {id: nível})
const VERSAO_NORMAL = 1000;
const versaoModo = modo => VERSAO_REGRAS + (modo === 'normal' ? VERSAO_NORMAL : 0);
function novaCorrida(classe, sem, nivel, modo, niveis){
  const s = sem == null ? (Date.now() & 0xffffff) : sem;
  nivel = nivel || 1; modo = modo === 'normal' ? 'normal' : 'ranqueada';
  C = {classe, nivel, modo, niveis:modo === 'normal' ? Object.assign({}, niveis) : {}, sem:s, rodada:1, vitorias:0, derrotas:0, ouro:OURO_INICIAL, perdeuAntes:false, trocas:0, mochila:mochilaNova(classe), loja:[], historico:[], fim:false, corrida:null};
  for(const p of C.mochila.pecas.concat(C.mochila.bancada)) if(C.niveis[p.id] > 0) p.n = C.niveis[p.id];
  C.loja = sortearLoja(classe, 1, semente(misturar(s, 1)), nivel);
  return C;
}
function comprar(i){
  const id = C.loja[i]; if(!id) return null;
  if(C.ouro < ITEM[id].preco) return null;
  C.ouro -= ITEM[id].preco; C.loja[i] = null; if(C.travas) C.travas[i] = false;
  const p = peca(id, 0, 0, 0, C.niveis && C.niveis[id] || 0); C.mochila.bancada.push(p); return p;
}
function vender(p){
  if(ITEM[p.id].inicial) return false;
  const m = C.mochila;
  if(m.pecas.includes(p)){ const fora = tirar(m, p); for(const q of fora) if(q !== p) m.bancada.push(q); }
  else m.bancada = m.bancada.filter(q => q !== p);
  C.ouro += precoVenda(p.id); return true;
}
// a vitrine nova mantém o que o jogador travou (vaga vendida destrava)
function manterTravadas(nova){ if(!C.travas) return nova; return nova.map((id, i) => C.travas[i] && C.loja[i] ? C.loja[i] : (C.travas[i] = false, id)); }
function trocarLoja(){
  const c = custoTroca(C.trocas); if(C.ouro < c) return false;
  C.ouro -= c; C.trocas++; C.loja = manterTravadas(sortearLoja(C.classe, C.rodada, semente(misturar(C.sem, C.rodada * 100 + C.trocas)), C.nivel)); return true;
}
// depois da luta: soma a vitória ou a derrota, paga a renda e abre a loja da rodada seguinte
function fecharRodada(venceu, adversario){
  C.historico.push({rodada:C.rodada, venceu, adversario});
  if(venceu) C.vitorias++; else C.derrotas++;
  C.perdeuAntes = !venceu;
  if(C.vitorias >= VITORIAS_META || C.derrotas >= VIDAS){ C.fim = true; return; }
  C.rodada++; C.trocas = 0; C.ouro += renda(C.rodada, C.perdeuAntes);
  C.loja = manterTravadas(sortearLoja(C.classe, C.rodada, semente(misturar(C.sem, C.rodada)), C.nivel));
}

// ---- classes de ofício: a cada rodada (antes da luta), a ferramenta trabalha os itens encostados nela ----
// a ferramenta mestre (mestre: true) já traz a peça de apoio embutida: trabalha mais uma vez nas rodadas pares
// devolve as mensagens do que aconteceu, para o aviso na tela
function oficio(m, rodada){
  const msgs = [], tem = id => m.pecas.some(p => p.id === id), naoBolsa = m.pecas.filter(p => !ehBolsa(p));
  // têmpera (Bigorna): a peça de metal mais fraca encostada; a Tenaz encostada tempera mais uma nas rodadas pares
  const maxT = 3;
  for(const b of naoBolsa.filter(p => ITEM[p.id].oficio === 'tempera')){
    const vezes = 1 + ((ITEM[b.id].mestre || vizinhos(m, b).some(q => q.id === 'tenaz')) && !((rodada || 0) % 2) ? 1 : 0);   // Tenaz: mais um nas rodadas pares
    for(let i = 0; i < vezes; i++){
      const alvo = vizinhos(m, b).filter(q => ITEM[q.id].tags.includes('metal') && ['arma', 'escudo'].includes(ITEM[q.id].tipo) && (q.tempera || 0) < maxT)
        .sort((x, y) => (x.tempera || 0) - (y.tempera || 0) || ITEM[x.id].preco - ITEM[y.id].preco)[0];
      if(alvo){ alvo.tempera = (alvo.tempera || 0) + 1; msgs.push(`${ITEM[alvo.id].nome}: têmpera ${alvo.tempera}`); } } }
  // cultivo (Kit de Herbalismo, Regador, Árvore Anciã): cada erva ganha brotos, até 5
  const arvore = tem('arvoreAncia');
  for(const p of naoBolsa.filter(q => ERVA(ITEM[q.id]) && ITEM[q.id].uso !== 'passivo')){
    const v = vizinhos(m, p), mais = (v.some(q => ITEM[q.id].oficio === 'cultivo') ? 1 : 0) + (v.some(q => q.id === 'regador') ? 1 : 0) + (arvore ? 1 : 0);
    if(mais && (p.brotos || 0) < 5){ p.brotos = Math.min(5, (p.brotos || 0) + mais); msgs.push(`${ITEM[p.id].nome}: ${p.brotos} ${p.brotos === 1 ? 'broto' : 'brotos'}`); } }
  // cozimento (Panela, Fogão): 2 rodadas encostada vira prato (1 com o Livro de Receitas ou no Fogão)
  const livro = tem('livroReceitas');
  for(const p of naoBolsa.filter(q => ITEM[q.id].tipo === 'comida' && !q.prato)){
    const panelas = vizinhos(m, p).filter(q => ITEM[q.id].oficio === 'cozinha'); if(!panelas.length) continue;
    p.cozido = (p.cozido || 0) + 1;
    if(p.cozido >= (livro || panelas.some(q => ITEM[q.id].rapido) ? 1 : 2)){ p.prato = true; msgs.push(`${ITEM[p.id].nome} virou prato`); } }
  // aprimoramento (Bancada, Oficina): a engenhoca encostada menos aprimorada, até 3 (5 com a Oficina); a Chave Inglesa aprimora mais uma nas pares
  const maxE = tem('oficinaMestre') ? 5 : 3;
  for(const b of naoBolsa.filter(p => ITEM[p.id].oficio === 'aprimora')){
    const vezes = 1 + ((ITEM[b.id].mestre || vizinhos(m, b).some(q => q.id === 'chaveInglesa')) && !((rodada || 0) % 2) ? 1 : 0);
    for(let i = 0; i < vezes; i++){
      const e = vizinhos(m, b).filter(q => ITEM[q.id].tags.includes('engenhoca') && (q.engrenagem || 0) < maxE).sort((x, y) => (x.engrenagem || 0) - (y.engrenagem || 0))[0];
      if(e){ e.engrenagem = (e.engrenagem || 0) + 1; msgs.push(`${ITEM[e.id].nome}: aprimorado ${e.engrenagem}`); } } }
  // fermentação (Barril, Cervejaria): cada bebida encostada, até 5
  for(const p of naoBolsa.filter(q => ITEM[q.id].tags.includes('bebida') && (q.fermento || 0) < 5)){
    if(vizinhos(m, p).some(q => ITEM[q.id].oficio === 'fermenta')){ p.fermento = (p.fermento || 0) + 1; msgs.push(`${ITEM[p.id].nome}: fermentação ${p.fermento}`); } }
  // transmutação (Kit de Alquimia, Atanor): um frasco instável por ofício, numa casa livre (sem casa: na bancada); o Funil dá mais um nas pares
  const frascos = () => m.pecas.concat(m.bancada || []).filter(q => ITEM[q.id].gerado).length, maxF = tem('atanor') ? 4 : 2;
  for(const k of naoBolsa.filter(p => ITEM[p.id].oficio === 'alquimia')){
    const vezes = 1 + ((ITEM[k.id].mestre || vizinhos(m, k).some(q => q.id === 'funil')) && !((rodada || 0) % 2) ? 1 : 0);
    for(let i = 0; i < vezes && frascos() < maxF; i++){
      const id = ['frascoFogo', 'frascoGelo', 'frascoAcido'][(m.pecas.length + (rodada || 0) + i) % 3], p = peca(id), l = lugarLivre(m, id);
      if(l) por(m, p, l.x, l.y, l.g); else if(m.bancada) m.bancada.push(p); else continue;
      msgs.push(`${ITEM[id].nome} fabricado`); } }
  // costura (Ferramentas de Couro, Mesa): as bolsas em que a ferramenta encosta, até 3 (5 com a Mesa); o Dedal costura mais uma vez nas pares
  const maxC = tem('mesaCoureiro') ? 5 : 2;
  for(const f of naoBolsa.filter(p => ITEM[p.id].oficio === 'costura')){
    const perto = new Set(); for(const [x, y] of casasDe(f)) for(const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) perto.add(chave(x + dx, y + dy));
    const vezes = 1 + ((ITEM[f.id].mestre || vizinhos(m, f).some(q => q.id === 'dedal')) && !((rodada || 0) % 2) ? 1 : 0);
    for(let i = 0; i < vezes; i++){
      const b = m.pecas.filter(q => ehBolsa(q) && (q.costura || 0) < maxC && casasDe(q).some(c => perto.has(chave(...c)))).sort((x, y) => (x.costura || 0) - (y.costura || 0))[0];
      if(b){ b.costura = (b.costura || 0) + 1; msgs.push(`${ITEM[b.id].nome}: costura ${b.costura}`); } } }
  // lapidação (Lupa, Coroa de Joias): a gema encostada menos lapidada, até 3 (5 com a Coroa); as Pinças lapidam mais uma vez nas pares
  const maxL = tem('coroaJoias') ? 5 : 3;
  for(const l of naoBolsa.filter(p => ITEM[p.id].oficio === 'lapida')){
    const vezes = 1 + ((ITEM[l.id].mestre || vizinhos(m, l).some(q => q.id === 'pincas')) && !((rodada || 0) % 2) ? 1 : 0);
    for(let i = 0; i < vezes; i++){
      const g = vizinhos(m, l).filter(q => ITEM[q.id].tags.includes('gema') && (q.lapida || 0) < maxL).sort((x, y) => (x.lapida || 0) - (y.lapida || 0))[0];
      if(g){ g.lapida = (g.lapida || 0) + 1; msgs.push(`${ITEM[g.id].nome}: lapidação ${g.lapida}`); } } }
  return msgs;
}

// ---- o robô: monta uma mochila jogando a loja com as mesmas regras ----
// usado no modo offline, quando o servidor ainda não tem mochilas daquela rodada, e no simulador de balanceamento
function valorItem(id, m, classe){
  const fere = d => d.tipo === 'arma' || !!(d.ao && d.ao.dano), it = ITEM[id], armas = m.pecas.filter(p => fere(ITEM[p.id])).length;
  let v = 2 + ORDEM_RAR.indexOf(it.rar) * 2.2 + (it.classe === classe ? 1.5 : 0);
  if(fere(it) && armas < 3) v += 4;
  // quem junta mana precisa de onde gastar: com mana sobrando, magias que gastam valem mais
  if(it.gastaMana && m.pecas.some(p => ITEM[p.id].ao && ITEM[p.id].ao.mana || ITEM[p.id].acerto && ITEM[p.id].acerto.mana)) v += 3;
  if(it.tipo === 'bolsa') v -= 1;
  // cada ofício valoriza o que a sua ferramenta trabalha
  const of = CLASSES[classe] && CLASSES[classe].oficio;
  if(of && ((classe === 'ferreiro' && it.tags.includes('metal') && ['arma', 'escudo'].includes(it.tipo)) || (classe === 'herbalista' && ERVA(it)) || (classe === 'cozinheiro' && it.tipo === 'comida') || (classe === 'alquimista' && it.tags.includes('frasco')) || (classe === 'coureiro' && it.tipo === 'bolsa') || (classe === 'joalheiro' && (it.tags.includes('gema') || it.tipo === 'arma')) || (classe === 'inventor' && it.tags.includes('engenhoca')) || (classe === 'cervejeiro' && it.tags.includes('bebida')))) v += 2;
  // item que só ajuda os vizinhos vale pouco sem ninguém para ajudar
  if(it.viz && it.viz.modo === 'da' && !fere(it) && !m.pecas.some(p => combina(ITEM[p.id], it.viz.alvo))) v -= 3;
  return v;
}
// os pares de receita, para o robô encostar um no outro
let PARES = null;
const parReceita = (a, b) => (PARES || (PARES = new Set(RECEITAS.flatMap(r => [r[0] + '+' + r[1], r[1] + '+' + r[0]])))).has(a + '+' + b);
// o melhor lugar para a peça: o que mais encosta em vizinhos que combinam (e, para bolsas, encostado nas outras bolsas)
function melhorLugar(m, id){
  let melhor = null, nota = -1;
  for(let g = 0; g < 4; g++) for(let y = 0; y < ALT; y++) for(let x = 0; x < LARG; x++){
    if(!podePor(m, id, g, x, y)) continue;
    const tmp = {pecas:m.pecas.concat([{uid:-1, id, x, y, g}]), bancada:[]}, eu = tmp.pecas[tmp.pecas.length - 1];
    let n = 0;
    if(ITEM[id].tipo === 'bolsa'){ const S = casasAbertas(m); n = casasDe(eu).filter(([a, b]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => S.has(chave(a + dx, b + dy)))).length * 2 - Math.abs(x + 1 - LARG / 2) * .1 - Math.abs(y + 1 - ALT / 2) * .1; }
    else { const V = ITEM[id].viz; for(const q of vizinhos(tmp, eu)){ if(V && combina(ITEM[q.id], V.alvo)) n += 2; const W = ITEM[q.id].viz; if(W && combina(ITEM[id], W.alvo)) n += 2; n += .1;
      // encostar no par de uma receita: a fusão vale mais que qualquer bônus de vizinhança
      if(parReceita(id, q.id)) n += 3; } }
    if(n > nota){ nota = n; melhor = {x, y, g}; }
  }
  return melhor;
}
function roboCompra(m, classe, loja, ouro, r){
  let gastou = true;
  while(gastou){
    gastou = false;
    const ordem = loja.map((id, i) => ({id, i})).filter(o => o.id && ITEM[o.id].preco <= ouro).sort((a, b) => valorItem(b.id, m, classe) - valorItem(a.id, m, classe));
    for(const o of ordem){
      const lugar = melhorLugar(m, o.id);
      if(lugar && (ITEM[o.id].tipo !== 'bolsa' || casasAbertas(m).size < 24)){ por(m, peca(o.id), lugar.x, lugar.y, lugar.g); ouro -= ITEM[o.id].preco; loja[o.i] = null; gastou = true; break; }
    }
    if(!gastou){   // não coube nada: compra uma bolsa, se houver, e tenta de novo
      const b = loja.findIndex(id => id && ITEM[id].tipo === 'bolsa' && ITEM[id].preco <= ouro);
      if(b >= 0){ const lugar = melhorLugar(m, loja[b]); if(lugar){ por(m, peca(loja[b]), lugar.x, lugar.y, lugar.g); ouro -= ITEM[loja[b]].preco; loja[b] = null; gastou = true; } }
    }
  }
  return ouro;
}
// nivel: o do personagem que o robô imita (padrão: nível 10)
function montarRobo(classe, rodada, sem, nivel){
  const r = semente(sem), m = mochilaNova(classe); m.bancada = [];
  nivel = nivel || 10;
  let ouro = OURO_INICIAL;
  for(let rd = 1; rd <= rodada; rd++){
    if(rd > 1) ouro += renda(rd, r() < .4);
    for(let troca = 0; troca < 3; troca++){
      ouro = roboCompra(m, classe, sortearLoja(classe, rd, r, nivel), ouro, r);
      if(ouro < 4) break;
      ouro -= 1;
    }
    // o que fundiu cai onde couber: o robô, como um jogador, leva a peça nova para o melhor lugar
    const antes = new Set(m.pecas.concat(m.bancada).map(p => p.uid));
    if(fundir(m, nivel, classe).length) for(const p of m.pecas.concat(m.bancada).filter(p => !antes.has(p.uid))){
      m.pecas = m.pecas.filter(q => q !== p); m.bancada = m.bancada.filter(q => q !== p);
      const l = melhorLugar(m, p.id); if(l) por(m, p, l.x, l.y, l.g); else m.bancada.push(p); }
    oficio(m, rd);
  }
  return m;
}
const NOMES_ROBO = ['Brutus', 'Dona Sálvia', 'Zé Fivela', 'Mestre Pintas', 'Gorda Berta', 'Velho Tobias', 'Lia Cortês', 'Capitão Rolha', 'Frei Borralho', 'Nina Faísca', 'Bento Bigorna', 'Rosa Ferrugem'];
// nivelItens: no modo normal, o robô usa itens no nível médio da mochila do jogador
function adversarioRobo(rodada, sem, nivelItens){
  const r = semente(sem), classe = sortear(Object.keys(CLASSES), r), m = montarRobo(classe, rodada, misturar(sem, 7));
  if(nivelItens > 0) for(const p of m.pecas) if(!ehBolsa(p)) p.n = Math.min(10, Math.round(nivelItens));
  return {nome:sortear(NOMES_ROBO, r), classe, mochila:m, robo:true};
}
