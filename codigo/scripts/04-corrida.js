// ---------- A corrida: rodadas de loja e luta, até 7 vitórias ou 3 derrotas ----------
const VITORIAS_META = 7, VIDAS = 3, TAM_LOJA = 5, OURO_INICIAL = 12;
// chance de cada raridade na loja, por rodada (comum, incomum, rara, épica, lendária)
const CHANCES = [[85, 15, 0, 0, 0], [70, 27, 3, 0, 0], [55, 32, 12, 1, 0], [45, 33, 18, 4, 0], [35, 33, 23, 8, 1], [28, 32, 26, 11, 3], [22, 30, 28, 15, 5]];
const renda = (rodada, perdeuAntes) => 7 + Math.min(rodada, 6) + (perdeuAntes ? 2 : 0);
const precoVenda = id => ITEM[id].inicial ? 0 : Math.max(1, Math.floor(ITEM[id].preco / 2));
const custoTroca = trocas => trocas < 4 ? 1 : 2;
// nivel e caminho do personagem: itens da classe acima do nível, ou de outro caminho, não aparecem
const naLoja = (it, classe, nivel, caminho) => !it.inicial && !it.fusao && (!it.classe || (it.classe === classe && it.nivel <= (nivel || 1) && (!it.caminho || it.caminho === caminho)));
function sortearLoja(classe, rodada, r, nivel, caminho){
  const ch = CHANCES[Math.min(rodada, CHANCES.length) - 1], L = [];
  for(let i = 0; i < TAM_LOJA; i++){
    let x = r() * 100, rar = 'comum'; for(let k = 0; k < 5; k++){ if(x < ch[k]){ rar = ORDEM_RAR[k]; break; } x -= ch[k]; }
    // os itens da classe aparecem 3 vezes mais que os comuns a todos
    const pool = ITENS.filter(it => naLoja(it, classe, nivel, caminho) && it.rar === rar && !L.includes(it.id)).flatMap(it => it.classe ? [it, it, it] : [it]);
    L.push(sortear(pool.length ? pool : ITENS.filter(it => naLoja(it, classe, nivel, caminho) && it.rar === 'comum'), r).id);
  }
  return L;
}

// ---- a corrida do jogador ----
let C = null;   // corrida em andamento
function novaCorrida(classe, sem, nivel, caminho){
  const s = sem == null ? (Date.now() & 0xffffff) : sem;
  nivel = nivel || 1; caminho = nivel >= NIVEL_CAMINHO ? caminho || null : null;
  C = {classe, nivel, caminho, sem:s, rodada:1, vitorias:0, derrotas:0, ouro:OURO_INICIAL, perdeuAntes:false, trocas:0, mochila:mochilaNova(classe), loja:[], historico:[], fim:false, corrida:null};
  C.loja = sortearLoja(classe, 1, semente(misturar(s, 1)), nivel, caminho);
  return C;
}
function comprar(i){
  const id = C.loja[i]; if(!id) return null;
  if(C.ouro < ITEM[id].preco) return null;
  C.ouro -= ITEM[id].preco; C.loja[i] = null;
  const p = peca(id); C.mochila.bancada.push(p); return p;
}
function vender(p){
  if(ITEM[p.id].inicial) return false;
  const m = C.mochila;
  if(m.pecas.includes(p)){ const fora = tirar(m, p); for(const q of fora) if(q !== p) m.bancada.push(q); }
  else m.bancada = m.bancada.filter(q => q !== p);
  C.ouro += precoVenda(p.id); return true;
}
function trocarLoja(){
  const c = custoTroca(C.trocas); if(C.ouro < c) return false;
  C.ouro -= c; C.trocas++; C.loja = sortearLoja(C.classe, C.rodada, semente(misturar(C.sem, C.rodada * 100 + C.trocas)), C.nivel, C.caminho); return true;
}
// depois da luta: soma a vitória ou a derrota, paga a renda e abre a loja da rodada seguinte
function fecharRodada(venceu, adversario){
  C.historico.push({rodada:C.rodada, venceu, adversario});
  if(venceu) C.vitorias++; else C.derrotas++;
  C.perdeuAntes = !venceu;
  if(C.vitorias >= VITORIAS_META || C.derrotas >= VIDAS){ C.fim = true; return; }
  C.rodada++; C.trocas = 0; C.ouro += renda(C.rodada, C.perdeuAntes);
  C.loja = sortearLoja(C.classe, C.rodada, semente(misturar(C.sem, C.rodada)), C.nivel, C.caminho);
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
  // item que só ajuda os vizinhos vale pouco sem ninguém para ajudar
  if(it.viz && it.viz.modo === 'da' && !fere(it) && !m.pecas.some(p => combina(ITEM[p.id], it.viz.alvo))) v -= 3;
  return v;
}
// o melhor lugar para a peça: o que mais encosta em vizinhos que combinam (e, para bolsas, encostado nas outras bolsas)
function melhorLugar(m, id){
  let melhor = null, nota = -1;
  for(let g = 0; g < 4; g++) for(let y = 0; y < ALT; y++) for(let x = 0; x < LARG; x++){
    if(!podePor(m, id, g, x, y)) continue;
    const tmp = {pecas:m.pecas.concat([{uid:-1, id, x, y, g}]), bancada:[]}, eu = tmp.pecas[tmp.pecas.length - 1];
    let n = 0;
    if(ITEM[id].tipo === 'bolsa'){ const S = casasAbertas(m); n = casasDe(eu).filter(([a, b]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => S.has(chave(a + dx, b + dy)))).length * 2 - Math.abs(x + 1 - LARG / 2) * .1 - Math.abs(y + 1 - ALT / 2) * .1; }
    else { const V = ITEM[id].viz; for(const q of vizinhos(tmp, eu)){ if(V && combina(ITEM[q.id], V.alvo)) n += 2; const W = ITEM[q.id].viz; if(W && combina(ITEM[id], W.alvo)) n += 2; n += .1; } }
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
// nivel e caminho: os do personagem que o robô imita (padrão: nível 10, caminho sorteado)
function montarRobo(classe, rodada, sem, nivel, caminho){
  const r = semente(sem), m = mochilaNova(classe); m.bancada = [];
  nivel = nivel || 10; if(nivel >= NIVEL_CAMINHO && !caminho) caminho = sortear(Object.keys(CLASSES[classe].caminhos), r);
  let ouro = OURO_INICIAL;
  for(let rd = 1; rd <= rodada; rd++){
    if(rd > 1) ouro += renda(rd, r() < .4);
    for(let troca = 0; troca < 3; troca++){
      ouro = roboCompra(m, classe, sortearLoja(classe, rd, r, nivel, caminho), ouro, r);
      if(ouro < 4) break;
      ouro -= 1;
    }
    fundir(m, nivel);
  }
  return m;
}
const NOMES_ROBO = ['Brutus', 'Dona Sálvia', 'Zé Fivela', 'Mestre Pintas', 'Gorda Berta', 'Velho Tobias', 'Lia Cortês', 'Capitão Rolha', 'Frei Borralho', 'Nina Faísca', 'Bento Bigorna', 'Rosa Ferrugem'];
function adversarioRobo(rodada, sem){
  const r = semente(sem), classe = sortear(Object.keys(CLASSES), r);
  return {nome:sortear(NOMES_ROBO, r), classe, mochila:montarRobo(classe, rodada, misturar(sem, 7)), robo:true};
}
