// Teste do jogo sem navegador: confere a mochila, a luta (sempre igual com a mesma semente) e o balanceamento das classes.
// O robô monta mochilas jogando a loja; elas lutam entre si por rodada.
// Uso: node codigo/testes/simulacao.js [lutas por confronto, padrão 60]
const t = require('./carregar')('nivelDe, lugarLivre, C, CLASSES, ITENS, ITEM, RECEITAS, novaCorrida, comprar, vender, trocarLoja, fecharRodada, mochilaNova, peca, por, tirar, podePor, forma, numeros, fundir, fotoMochila, deFoto, lutar, montarRobo, adversarioRobo, vizinhos, casasAbertas');
const N = +(process.argv[2] || 60);
let falhas = 0; const confere = (c, m) => { if(!c){ falhas++; if(falhas < 25) console.log('  FALHA: ' + m); } };

// formatos e giros
confere(t.forma('martelo', 0).w === 2 && t.forma('martelo', 0).h === 3 && t.forma('martelo', 1).w === 3 && t.forma('martelo', 1).h === 2, 'giro do martelo');
for(const it of t.ITENS) for(let g = 0; g < 4; g++) confere(t.forma(it.id, g).casas.length === t.forma(it.id, 0).casas.length, 'giro muda o tamanho de ' + it.id);
// mochila: começa com a bolsa 3x3 e o item da classe
for(const c of Object.keys(t.CLASSES)){ const m = t.mochilaNova(c); confere(t.casasAbertas(m).size === 9 && m.pecas.length === 2, 'mochila inicial de ' + c); }
{ const m = t.mochilaNova('guerreiro'), b = t.peca('bolsaCouro');
  confere(!t.por(m, b, 4, 3, 0), 'bolsa por cima de outra bolsa deveria ser recusada');
  confere(t.por(m, b, 6, 2, 0), 'bolsa ao lado deveria caber');
  const e = t.peca('espadaCurta'); confere(t.por(m, e, 6, 2, 0), 'espada em cima da bolsa nova');
  confere(t.por(m, b, 6, 4, 0) && e.y === 4, 'mover a bolsa leva a espada junto');
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
    for(const cam of Object.keys(t.CLASSES[c].caminhos)) confere(t.ITENS.filter(it => it.caminho === cam).length === 2, cam + ' tem 2 itens'); }
  // loja de nível 1 só tem itens de nível 1; de nível 5 com caminho, nunca o outro caminho
  let errado = 0, viuCaminho = 0;
  for(let i = 0; i < 400; i++){ t.novaCorrida('guerreiro', i, 1); t.C.rodada = 7; t.trocarLoja(); t.C.ouro = 99;
    for(const id of t.C.loja) if(id && t.ITEM[id].nivel > 1) errado++; }
  for(let i = 0; i < 400; i++){ t.novaCorrida('guerreiro', i, 6, 'berserker'); t.C.rodada = 7; t.C.ouro = 99; t.trocarLoja();
    for(const id of t.C.loja) if(id){ if(t.ITEM[id].caminho === 'escudeiro') errado++; if(t.ITEM[id].caminho === 'berserker') viuCaminho++; } }
  confere(!errado, 'loja mostrou item acima do nível ou de outro caminho (' + errado + ')');
  confere(viuCaminho > 0, 'a loja de nível 6 berserker mostra os itens do caminho');
  // receita com nível: só funde a partir dele
  const fazer = nivel => { const m = t.mochilaNova('guerreiro'); m.pecas = m.pecas.filter(p => p.id === 'mochila');
    t.por(m, t.peca('machadoFuria'), 3, 2, 0); t.por(m, t.peca('trombeta'), 5, 2, 1); return t.fundir(m, nivel); };
  confere(!fazer(5).length && fazer(6).includes('machadoClamor'), 'Machado do Clamor só funde no nível 6');
  // mecânicas novas
  const so = (ids, classe) => { const m = t.mochilaNova(classe); m.pecas = m.pecas.filter(p => p.id === 'mochila'); t.por(m, t.peca('bolsaCouro'), 6, 2, 0); t.por(m, t.peca('bolsaCouro'), 0, 2, 0);
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
// nível 1 contra nível 10 da mesma classe (regra de ouro: opções, não poder) e cada caminho contra todos
{ const lin = [];
  for(const c of classes){ let v = 0, n = 0;
    for(const rodada of [3, 5, 7, 9]) for(let i = 0; i < N / 2; i++){ id++;
      const a = t.montarRobo(c, rodada, 5000 + id * 3, 1), b = t.montarRobo(c, rodada, 6000 + id * 7, 10);
      const r = t.lutar(a, c, 'n1', b, c, 'n10', id); n++; if(r.vencedor === 0) v++; }
    lin.push(`${t.CLASSES[c].nome} ${(v / n * 100).toFixed(0)}%`); }
  console.log('Nível 1 contra nível 10 (vitórias do nível 1): ' + lin.join(' · '));
  const cam = [];
  for(const c of classes) for(const k of Object.keys(t.CLASSES[c].caminhos)){ let v = 0, n = 0;
    for(const rodada of [5, 7, 9]) for(const o of classes) for(let i = 0; i < N / 4; i++){ id++;
      const a = t.montarRobo(c, rodada, 7000 + id * 3, 10, k), b = t.montarRobo(o, rodada, 8000 + id * 7, 10);
      const r = t.lutar(a, c, 'a', b, o, 'b', id); n++; if(r.vencedor === 0) v++; }
    cam.push(`${t.CLASSES[c].caminhos[k].nome} ${(v / n * 100).toFixed(0)}%`); }
  console.log('Caminhos (nível 10) contra todos: ' + cam.join(' · ')); }
console.log(falhas ? `\n✘ ${falhas} falha(s)` : '\n✔ Tudo certo');
process.exit(falhas ? 1 : 0);
