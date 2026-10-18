// Teste do jogo sem navegador: confere a mochila, a luta (sempre igual com a mesma semente) e o balanceamento das classes.
// O robô monta mochilas jogando a loja; elas lutam entre si por rodada.
// Uso: node codigo/testes/simulacao.js [lutas por confronto, padrão 60]
const t = require('./carregar')('oficio, POR_TEMPERA, ehBolsa, nivelDe, lugarLivre, C, CLASSES, ITENS, ITEM, RECEITAS, novaCorrida, comprar, vender, trocarLoja, fecharRodada, mochilaNova, peca, por, tirar, podePor, forma, numeros, fundir, fotoMochila, deFoto, lutar, montarRobo, adversarioRobo, vizinhos, casasAbertas, CATALISADORES');
const N = +(process.argv[2] || 60);
let falhas = 0; const confere = (c, m) => { if(!c){ falhas++; if(falhas < 25) console.log('  FALHA: ' + m); } };

// formatos e giros
confere(t.forma('martelo', 0).w === 2 && t.forma('martelo', 0).h === 3 && t.forma('martelo', 1).w === 3 && t.forma('martelo', 1).h === 2, 'giro do martelo');
for(const it of t.ITENS) for(let g = 0; g < 4; g++) confere(t.forma(it.id, g).casas.length === t.forma(it.id, 0).casas.length, 'giro muda o tamanho de ' + it.id);
// mochila: começa com a bolsa 3x3 e o item da classe
for(const c of Object.keys(t.CLASSES)){ const m = t.mochilaNova(c); confere(t.casasAbertas(m).size === 16 && m.pecas.length === 2, 'mochila inicial de ' + c); }
{ const m = t.mochilaNova('guerreiro'), b = t.peca('bolsaCouro');
  confere(!t.por(m, b, 4, 3, 0), 'bolsa por cima de outra bolsa deveria ser recusada');
  confere(t.por(m, b, 7, 2, 0), 'bolsa ao lado deveria caber');
  const e = t.peca('espadaCurta'); confere(t.por(m, e, 7, 2, 0), 'espada em cima da bolsa nova');
  confere(t.por(m, b, 7, 4, 0) && e.y === 4, 'mover a bolsa leva a espada junto');
  confere(!t.por(m, t.peca('espadaLonga'), 0, 0, 0), 'item fora das bolsas deveria ser recusado');
  const fora = t.tirar(m, b); confere(fora.length === 2, 'tirar a bolsa leva o que está em cima'); }
// vizinhança e fusão
{ const m = t.mochilaNova('guerreiro'); m.pecas = m.pecas.filter(p => p.id === 'mochila');
  const e = t.peca('espadaCurta'), a = t.peca('amolar'); t.por(m, e, 3, 2, 0); t.por(m, a, 4, 2, 0);
  const n = t.numeros(m); confere(n[e.uid].dano[0] === 3 && n[e.uid].dano[1] === 5, 'pedra de amolar dá +1 de dano à espada vizinha');
  const f = t.peca('pedraFogo'); t.por(m, f, 3, 4, 0);
  const feitas = t.fundir(m); confere(feitas.includes('laminaFogo') && m.pecas.some(p => p.id === 'laminaFogo'), 'espada + pedra de fogo viram Lâmina Flamejante'); }
// foto de ida e volta
{ const m = t.montarRobo('mago', 6, 77), f = t.fotoMochila(m), m2 = t.deFoto(JSON.parse(JSON.stringify(f)));
  confere(JSON.stringify(t.fotoMochila(m2)) === JSON.stringify(f), 'a foto da mochila volta igual'); }
// a luta é sempre igual com a mesma semente
{ const a = t.montarRobo('guerreiro', 5, 11), b = t.montarRobo('ladino', 5, 12);
  const r1 = t.lutar(a, 'guerreiro', 'A', b, 'ladino', 'B', 999), r2 = t.lutar(t.deFoto(t.fotoMochila(a)), 'guerreiro', 'A', t.deFoto(t.fotoMochila(b)), 'ladino', 'B', 999);
  confere(r1.vencedor === r2.vencedor && r1.eventos.length === r2.eventos.length && r1.duracao === r2.duracao, 'mesma semente, mesma luta');
  confere(r1.eventos.every(e => e.foto.every(f => Number.isFinite(f.vida))), 'valores inválidos na luta'); }
// uma corrida completa com o robô no lugar do jogador
{ t.novaCorrida('mago', 5); let guarda = 0;
  while(!t.C.fim && guarda++ < 20){
    const mob = t.montarRobo('mago', t.C.rodada, 100 + t.C.rodada); t.C.mochila = mob;
    const adv = t.adversarioRobo(t.C.rodada, 200 + t.C.rodada), r = t.lutar(t.C.mochila, 'mago', 'eu', adv.mochila, adv.classe, adv.nome, 300 + t.C.rodada);
    t.fecharRodada(r.vencedor === 0, adv.nome); }
  confere(t.C.fim && (t.C.vitorias === 7 || t.C.derrotas === 3), 'a corrida termina em 7 vitórias ou 3 derrotas'); }
// loja: comprar, vender e trocar
{ t.novaCorrida('ladino', 9); const ouro = t.C.ouro, i = t.C.loja.findIndex(id => t.ITEM[id].preco <= ouro), p = t.comprar(i);
  confere(p && t.C.ouro === ouro - t.ITEM[p.id].preco && t.C.mochila.bancada.includes(p), 'comprar põe na bancada e cobra');
  const o2 = t.C.ouro; t.vender(p); confere(t.C.ouro > o2 && !t.C.mochila.bancada.includes(p), 'vender devolve ouro');
  const o3 = t.C.ouro, antes = t.C.loja.join(); t.trocarLoja(); confere(t.C.ouro === o3 - 1, 'trocar a vitrine custa 1'); }

// balanceamento: mochilas do robô na mesma rodada, cada classe contra cada classe
const classes = Object.keys(t.CLASSES), vit = {}, dur = [];
for(const c of classes) vit[c] = {v:0, n:0};
let id = 0;
for(const rodada of [2, 4, 6, 8]) for(const a of classes) for(const b of classes){ if(a === b) continue;
  for(let i = 0; i < N / 4; i++){ id++;
    const ma = t.montarRobo(a, rodada, 1000 + id * 3), mb = t.montarRobo(b, rodada, 2000 + id * 7), r = t.lutar(ma, a, a, mb, b, b, id);
    vit[a].n++; vit[b].n++; if(r.vencedor === 0) vit[a].v++; else vit[b].v++; dur.push(r.duracao); } }
console.log('Itens: ' + t.ITENS.length + ' · receitas: ' + t.RECEITAS.length);
console.log('Vitórias por classe (robô contra robô): ' + classes.map(c => `${t.CLASSES[c].nome} ${(vit[c].v / vit[c].n * 100).toFixed(0)}%`).join(' · '));
dur.sort((a, b) => a - b);
console.log(`Duração das lutas: mediana ${dur[dur.length >> 1].toFixed(1)} s, 90% até ${dur[Math.floor(dur.length * .9)].toFixed(1)} s, máximo ${dur[dur.length - 1].toFixed(1)} s`);
// ---- níveis (PROGRESSAO.md) ----
{ const nv = x => t.nivelDe(x).nivel;
  confere(nv(0) === 1 && nv(39) === 1 && nv(40) === 2 && nv(449) === 4 && nv(450) === 5 && nv(3299) === 9 && nv(3300) === 10 && nv(99999) === 10, 'curva de níveis');
  confere(t.nivelDe(3300 + 3300 * 2 + 5).estrelas === 2, 'estrelas de prestígio depois do nível 10');
  for(const c of Object.keys(t.CLASSES)){
    const raras = new Set(t.ITENS.filter(it => it.classe === c && !it.fusao && !it.inicial && it.nivel === 1).map(it => it.rar));
    confere(['comum', 'incomum', 'rara', 'epica', 'lendaria'].every(r => raras.has(r)), c + ' tem item de toda raridade já no nível 1');
    confere(!t.ITENS.some(it => it.caminho) && !t.CLASSES[c].caminhos, c + ' é um personagem único (sem caminhos)');
    confere([2, 3, 4, 5, 6, 7, 9].every(n => t.ITENS.some(it => it.classe === c && !it.fusao && it.nivel === n)), c + ' libera item nos níveis 2 a 7 e 9'); }
  // loja de nível 1 só tem itens de nível 1; a de nível 6 mostra os do 5 e do 6, nunca os do 7
  let errado = 0, viuNivel = 0;
  for(let i = 0; i < 400; i++){ t.novaCorrida('guerreiro', i, 1); t.C.rodada = 7; t.trocarLoja(); t.C.ouro = 99;
    for(const id of t.C.loja) if(id && t.ITEM[id].nivel > 1) errado++; }
  for(let i = 0; i < 400; i++){ t.novaCorrida('guerreiro', i, 6); t.C.rodada = 7; t.C.ouro = 99; t.trocarLoja();
    for(const id of t.C.loja) if(id){ if(t.ITEM[id].nivel > 6) errado++; if(t.ITEM[id].nivel === 6) viuNivel++; } }
  confere(!errado, 'loja mostrou item acima do nível (' + errado + ')');
  confere(viuNivel > 0, 'a loja de nível 6 mostra os itens do nível 6');
  // receita com nível: só funde a partir dele
  const fazer = nivel => { const m = t.mochilaNova('guerreiro'); m.pecas = m.pecas.filter(p => p.id === 'mochila');
    t.por(m, t.peca('machadoFuria'), 3, 2, 0); t.por(m, t.peca('trombeta'), 5, 2, 1); return t.fundir(m, nivel); };
  confere(!fazer(5).length && fazer(6).includes('machadoClamor'), 'Machado do Clamor só funde no nível 6');
  // mecânicas novas
  const so = (ids, classe) => { const m = t.mochilaNova(classe); m.pecas = m.pecas.filter(p => p.id === 'mochila'); t.por(m, t.peca('bolsaCouro'), 7, 2, 0); t.por(m, t.peca('bolsaCouro'), 0, 2, 0);
    for(const id of ids){ const l = t.lugarLivre(m, id); if(l) t.por(m, t.peca(id), l.x, l.y, l.g); } return m; };
  const alvo = so(['escudoMadeira'], 'mago');
  { const r = t.lutar(so(['marteloCerco'], 'guerreiro'), 'guerreiro', 'A', alvo, 'mago', 'B', 5); confere(r.eventos.some(e => e.tipo === 'atordoado' && e.lado === 1), 'Martelo de Cerco atordoa'); }
  { const r = t.lutar(so(['laminaOculta'], 'ladino'), 'ladino', 'A', alvo, 'mago', 'B', 5); const d = r.eventos.filter(e => e.tipo === 'dano' && e.lado === 1 && e.item != null);
    confere(d.length >= 2 && d[0].crit && d[1].crit, 'Lâmina Oculta: 2 primeiros golpes críticos'); }
  { const r = t.lutar(so(['colarDentes', 'clava'], 'guerreiro'), 'guerreiro', 'A', so(['martelo', 'espadaLonga'], 'guerreiro'), 'guerreiro', 'B', 5); confere(r.eventos.some(e => e.tipo === 'forca' && e.lado === 0), 'Colar de Dentes dá força ao apanhar'); }
  { const r = t.lutar(so(['alambique', 'frascoVeneno'], 'ladino'), 'ladino', 'A', alvo, 'mago', 'B', 5); confere(r.eventos.filter(e => e.tipo === 'veneno' && e.lado === 1).length >= 3, 'Alambique faz o veneno crescer'); }
  { const r = t.lutar(so(['sorrisoHiena', 'adaga', 'adaga'], 'ladino'), 'ladino', 'A', alvo, 'mago', 'B', 5); confere(r.eventos.some(e => e.tipo === 'esquiva' && e.lado === 0), 'Sorriso da Hiena: crítico dá esquiva'); }
  { const r = t.lutar(so(['bolsaTruques'], 'ladino'), 'ladino', 'A', alvo, 'mago', 'B', 5); confere(r.eventos.some(e => e.tipo === 'ativa' && e.lado === 0), 'Bolsa de Truques age'); }
}
// ---- evoluções (EVOLUCOES.md): cada receita funde com as duas peças encostadas, no personagem certo ----
{ const classeDe = r => t.ITEM[r[2]].classe || t.ITEM[r[0]].classe || t.ITEM[r[1]].classe || 'guerreiro';
  let falhou = [];
  for(const r of t.RECEITAS){
    const c = classeDe(r), m = t.mochilaNova(c); m.pecas = m.pecas.filter(p => p.id === 'mochila'); m.bancada = [];
    t.por(m, t.peca('bolsaCouro'), 7, 2, 0); t.por(m, t.peca('bolsaCouro'), 1, 2, 0);
    const a = t.peca(r[0]), la = t.lugarLivre(m, r[0]); t.por(m, a, la.x, la.y, la.g);
    const b = t.peca(r[1]); let pos = false;
    for(let g = 0; g < 4 && !pos; g++) for(let y = 0; y < 7 && !pos; y++) for(let x = 0; x < 9 && !pos; x++)
      if(t.podePor(m, r[1], g, x, y)){ t.por(m, b, x, y, g); if(t.vizinhos(m, b).includes(a)) pos = true; else m.pecas = m.pecas.filter(p => p !== b); }
    const feitas = pos ? t.fundir(m, 10, c) : [];
    const cat = t.CATALISADORES.has(r[0]) ? r[0] : t.CATALISADORES.has(r[1]) ? r[1] : null;
    if(!feitas.includes(r[2]) || (cat && !m.pecas.some(p => p.id === cat)) || !m.pecas.concat(m.bancada).some(p => p.id === r[2])) falhou.push(r.slice(0, 3).join('+'));
    // receita de classe não funde em outro personagem
    if(r[3] && t.ITEM[r[2]].classe){ const outra = c === 'mago' ? 'ladino' : 'mago', m2 = t.mochilaNova(outra); m2.pecas = m2.pecas.filter(p => p.id === 'mochila'); m2.bancada = [];
      const a2 = t.peca(r[0]); t.por(m2, a2, a.x - 0, a.y, a.g); const b2 = t.peca(r[1]); t.por(m2, b2, b.x, b.y, b.g);
      if(t.fundir(m2, 10, outra).includes(r[2])) falhou.push('fora da classe: ' + r[2]); }
  }
  confere(!falhou.length, 'receitas que não fundiram: ' + falhou.join(', '));
  // catalisador: a Pedra de Amolar fica e funde de novo com a próxima arma
  { const m = t.mochilaNova('guerreiro'); m.pecas = m.pecas.filter(p => p.id === 'mochila'); m.bancada = [];
    t.por(m, t.peca('amolar'), 4, 3, 0); t.por(m, t.peca('clava'), 3, 2, 0); t.por(m, t.peca('clava'), 5, 2, 0);
    const f = t.fundir(m, 10, 'guerreiro'); confere(f.filter(x => x === 'macaCravejada').length === 2 && m.pecas.some(p => p.id === 'amolar'), 'Pedra de Amolar funde duas clavas e continua (' + f + ')'); }
  // efeitos novos
  const so = (ids, classe) => { const m = t.mochilaNova(classe); m.pecas = m.pecas.filter(p => p.id === 'mochila'); t.por(m, t.peca('bolsaCouro'), 7, 2, 0); t.por(m, t.peca('bolsaCouro'), 0, 2, 0);
    for(const id of ids){ const l = t.lugarLivre(m, id); if(l) t.por(m, t.peca(id), l.x, l.y, l.g); } return m; };
  const alvo = so(['escudoMadeira'], 'mago');
  { const r = t.lutar(so(['arcoCacador'], 'guerreiro'), 'guerreiro', 'A', alvo, 'mago', 'B', 5); const d = r.eventos.filter(e => e.tipo === 'dano' && e.lado === 1 && e.item != null);
    confere(d.length >= 2 && d[0].crit && d[1].crit, 'Arco do Caçador: 2 primeiros golpes críticos'); }
  { const r = t.lutar(so(['ferrao'], 'ladino'), 'ladino', 'A', alvo, 'mago', 'B', 9); const crit = r.eventos.findIndex(e => e.tipo === 'dano' && e.lado === 1 && e.crit);
    confere(crit >= 0 && r.eventos.slice(crit, crit + 4).filter(e => e.tipo === 'veneno' && e.lado === 1).length >= 2, 'Ferrão: crítico envenena a mais'); }
  { const r = t.lutar(so(['coroaInverno'], 'mago'), 'mago', 'A', alvo, 'mago', 'B', 5); confere(r.eventos[0].foto[1].gelo === 5, 'Coroa do Inverno começa com 5 de gelo no inimigo'); }
  { const L = t.lutar(so(['pancaBlindada'], 'cervejeiro'), 'cervejeiro', 'A', alvo, 'mago', 'B', 5); confere(L.eventos[0].foto[0].regen === 1 && L.lados[0].max === t.CLASSES.cervejeiro.vida + 22, 'Pança Blindada: vida e regeneração no começo'); }
  { const m = so(['colarReal'], 'joalheiro'), c = m.pecas.find(p => p.id === 'colarReal'), g = t.peca('quartzo');
    for(let y = 0; y < 7; y++) for(let x = 0; x < 9; x++) if(!m.pecas.includes(g) && t.podePor(m, 'quartzo', 0, x, y)){ t.por(m, g, x, y, 0); if(!t.vizinhos(m, g).includes(c)) m.pecas = m.pecas.filter(p => p !== g); }
    confere(t.numeros(m)[c.uid].inicio.forca === 1, 'Colar Real: +1 de força por gema vizinha'); }
}
// ---- classes de ofício ----
{ const base = c => { const m = t.mochilaNova(c); t.por(m, t.peca('bolsaCouro'), 7, 2, 0); t.por(m, t.peca('bolsaCouro'), 1, 2, 0); return m; };
  // Bigorna (3,2 até 4,3) tempera a espada encostada, até 3
  { const m = base('ferreiro'), e = t.peca('espadaCurta'); confere(t.por(m, e, 5, 2, 0), 'espada ao lado da bigorna');
    for(let i = 0; i < 5; i++) t.oficio(m); confere(e.tempera === 3, 'Bigorna tempera até 3 (' + e.tempera + ')');
    const n = t.numeros(m); confere(n[e.uid].dano[0] === 2 + 3 * t.POR_TEMPERA, 'têmpera soma dano (' + n[e.uid].dano + ')');
    const f = t.deFoto(JSON.parse(JSON.stringify(t.fotoMochila(m)))); confere(f.pecas.find(p => p.id === 'espadaCurta').tempera === 3, 'a foto leva a têmpera'); }
  // Kit (3,2 e 3,3): sálvia encostada ganha brotos; poção encostada funciona duas vezes
  { const m = base('herbalista'), s = t.peca('salvia'), p = t.peca('pocaoCura'); t.por(m, s, 4, 2, 0); t.por(m, p, 4, 3, 0);
    t.oficio(m); t.oficio(m); confere(s.brotos === 2, 'sálvia com 2 brotos (' + s.brotos + ')');
    const n = t.numeros(m); confere(n[s.uid].ao.cura === 3 && n[p.uid].usos === 2, 'brotos aumentam a cura e a poção no kit tem 2 usos'); }
  // Panela (3,2 até 4,3): maçã vira prato em 2 rodadas
  { const m = base('cozinheiro'), a = t.peca('maca'); t.por(m, a, 5, 2, 0); t.oficio(m); confere(!a.prato && a.cozido === 1, 'maçã cozinhando');
    t.oficio(m); confere(a.prato, 'maçã virou prato'); const n = t.numeros(m); confere(n[a.uid].ao.cura >= 3 && n[a.uid].inicio.vida === 4, 'prato cura mais e dá vida'); }
  // Kit de Alquimia: fabrica frascos instáveis, até 3; eles não valem ouro e explodem na luta
  { const m = base('alquimista'); for(let i = 0; i < 6; i++) t.oficio(m, i + 1);
    const fr = m.pecas.concat(m.bancada).filter(p => t.ITEM[p.id].gerado); confere(fr.length === 3, 'Kit de Alquimia: 3 frascos no máximo (' + fr.length + ')');
    const r = t.lutar(m, 'alquimista', 'A', base('guerreiro'), 'guerreiro', 'B', 4); confere(r.eventos.some(e => e.tipo === 'ativa' && e.lado === 0), 'frascos explodem na luta'); }
  // Ferramentas de Couro (3,2 e 4,2): costuram a mochila embaixo e a bolsa ao lado; o item dentro fica mais forte
  { const m = base('coureiro'), e = t.peca('espadaCurta'); t.por(m, e, 5, 2, 0); for(let i = 0; i < 8; i++) t.oficio(m, 1);
    const mo = m.pecas.find(p => p.id === 'mochila'); confere(mo.costura === 3, 'mochila costurada 3 vezes (' + mo.costura + ')');
    const n = t.numeros(m); confere(n[e.uid].dano[1] > 4, 'item em bolsa costurada fica mais forte (' + n[e.uid].dano + ')'); }
  // Lupa (3,2): lapida o quartzo encostado; o bônus dele na espada cresce
  { const m = base('joalheiro'), q = t.peca('quartzo'), e = t.peca('espadaCurta'); t.por(m, q, 4, 2, 0); t.por(m, e, 5, 2, 0);
    const antes = t.numeros(m)[e.uid].dano[0]; t.oficio(m, 1); t.oficio(m, 1); confere(q.lapida === 2, 'quartzo lapidado 2 vezes');
    confere(t.numeros(m)[e.uid].dano[0] === antes + 4, 'lapidação aumenta o bônus da gema (' + antes + ' → ' + t.numeros(m)[e.uid].dano[0] + ')'); }
  // Bancada (3,2 e 4,2): aprimora a engenhoca encostada; ela fica mais rápida e ataca sem vigor
  { const m = base('inventor'), e = t.peca('catapultinha'); t.por(m, e, 5, 2, 0); const cd0 = t.numeros(m)[e.uid].cd;
    for(let i = 0; i < 5; i++) t.oficio(m, 1); confere(e.engrenagem === 3, 'engenhoca aprimorada até 3 (' + e.engrenagem + ')');
    confere(t.numeros(m)[e.uid].cd < cd0, 'aprimorada fica mais rápida');
    const r = t.lutar(m, 'inventor', 'A', base('guerreiro'), 'guerreiro', 'B', 4); confere(r.eventos.some(x => x.tipo === 'magia' && x.lado === 1 && x.valor > 0), 'engenhoca causa dano sozinha'); }
  // Barril (3,2 a 4,3): fermenta a bebida encostada; o gole dá ressaca, menos com a Cervejaria do Mestre
  { const m = base('cervejeiro'), c = t.peca('caneca'); t.por(m, c, 5, 2, 0); t.oficio(m, 1); t.oficio(m, 2); confere(c.fermento === 2, 'caneca com 2 fermentações');
    confere(t.numeros(m)[c.uid].ao.cura === 3, 'fermentação aumenta o efeito (' + t.numeros(m)[c.uid].ao.cura + ')');
    const r = t.lutar(m, 'cervejeiro', 'A', base('guerreiro'), 'guerreiro', 'B', 4); confere(r.eventos.some(x => x.tipo === 'ressaca' && x.lado === 0), 'a caneca dá ressaca');
    t.por(m, t.peca('cervejariaMestre'), 3, 4, 0); const r2 = t.lutar(m, 'cervejeiro', 'A', base('guerreiro'), 'guerreiro', 'B', 4); confere(!r2.eventos.some(x => x.tipo === 'ressaca'), 'Cervejaria do Mestre tira a ressaca'); }
  // Ácido corrói bloqueio
  { const a = base('alquimista'); t.por(a, t.peca('acido'), 5, 2, 0); const d = base('guerreiro'); t.por(d, t.peca('escudoFerro'), 6, 2, 0);
    const r = t.lutar(a, 'alquimista', 'A', d, 'guerreiro', 'B', 9); confere(r.eventos.some(e => e.tipo === 'corroeu' && e.lado === 1), 'Ácido corrói o bloqueio'); }
  // Semente do Mundo: volta uma vez
  { const m = base('herbalista'); t.por(m, t.peca('sementeMundo'), 5, 2, 0); const a = base('guerreiro'); t.por(a, t.peca('martelo'), 5, 2, 0); t.por(a, t.peca('espadaLonga'), 1, 2, 0);
    const r = t.lutar(a, 'guerreiro', 'A', m, 'herbalista', 'B', 3); confere(r.eventos.some(e => e.tipo === 'cura' && e.lado === 1 && e.valor >= 20), 'Semente do Mundo ressuscita'); }
}
// ---- nível dos itens pelas cartas (modo normal) ----
{ const m = t.mochilaNova('guerreiro'); m.pecas = m.pecas.filter(p => p.id === 'mochila');
  const e = t.peca('espadaLonga', 0, 0, 0, 10), b = t.peca('escudoMadeira', 0, 0, 0, 4); t.por(m, e, 3, 2, 0); t.por(m, b, 4, 2, 0);
  const n = t.numeros(m); confere(n[e.uid].dano[0] === 9 && n[e.uid].dano[1] === 14, 'espada longa nível 10: 6–9 vira 9–14 (' + n[e.uid].dano + ')');
  confere(n[b.uid].ao.bloqueio === 5, 'escudo de madeira nível 4: bloqueio 4 vira 5 (' + n[b.uid].ao.bloqueio + ')');
  confere(t.ITEM.espadaLonga.dano[0] === 6, 'o nível não mexe na tabela de itens');
  const f = t.fotoMochila(m), m2 = t.deFoto(JSON.parse(JSON.stringify(f)));
  confere(m2.pecas.find(p => p.id === 'espadaLonga').n === 10 && !('n' in f.find(x => x.id === 'mochila')), 'a foto leva o nível dos itens');
  t.novaCorrida('guerreiro', 3, 1, 'normal', {insignia:3, clava:5});
  confere(t.C.mochila.pecas.find(p => p.id === 'insignia').n === 3, 'modo normal: item inicial no nível da coleção');
  t.C.loja[0] = 'clava'; t.C.ouro = 99; confere(t.comprar(0).n === 5, 'modo normal: item comprado no nível da coleção');
  t.novaCorrida('guerreiro', 3, 1, 'ranqueada', {insignia:3, clava:5}); t.C.loja[0] = 'clava'; t.C.ouro = 99;
  confere(!t.comprar(0).n && !t.C.mochila.pecas.some(p => p.n), 'ranqueada: todos no nível 0');
  // a mesma mochila do robô no nível 10 contra ela mesma no nível 0
  let v = 0; for(let i = 0; i < 60; i++){ const c = classes[i % 3], a = t.montarRobo(c, 6, 400 + i), b2 = t.deFoto(t.fotoMochila(a)); for(const p of a.pecas) if(!t.ehBolsa(p)) p.n = 10;
    if(t.lutar(a, c, 'n10', b2, c, 'n0', i).vencedor === 0) v++; }
  console.log('Mesma mochila, itens nível 10 contra nível 0: ' + Math.round(v / 60 * 100) + '% de vitórias do nível 10'); }
// nível 1 contra nível 10 da mesma classe (regra de ouro: opções, não poder)
{ const lin = [];
  for(const c of classes){ let v = 0, n = 0;
    for(const rodada of [3, 5, 7, 9]) for(let i = 0; i < N / 2; i++){ id++;
      const a = t.montarRobo(c, rodada, 5000 + id * 3, 1), b = t.montarRobo(c, rodada, 6000 + id * 7, 10);
      const r = t.lutar(a, c, 'n1', b, c, 'n10', id); n++; if(r.vencedor === 0) v++; }
    lin.push(`${t.CLASSES[c].nome} ${(v / n * 100).toFixed(0)}%`); }
  console.log('Nível 1 contra nível 10 (vitórias do nível 1): ' + lin.join(' · '));
}
console.log(falhas ? `\n✘ ${falhas} falha(s)` : '\n✔ Tudo certo');
process.exit(falhas ? 1 : 0);
