// Teste do jogo sem navegador: confere a mochila, a luta (sempre igual com a mesma semente) e o balanceamento das classes.
// O robô monta mochilas jogando a loja; elas lutam entre si por rodada.
// Uso: node codigo/testes/simulacao.js [lutas por confronto, padrão 60]
const t = require('./carregar')('C, CLASSES, ITENS, ITEM, RECEITAS, novaCorrida, comprar, vender, trocarLoja, fecharRodada, mochilaNova, peca, por, tirar, podePor, forma, numeros, fundir, fotoMochila, deFoto, lutar, montarRobo, adversarioRobo, vizinhos, casasAbertas');
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
console.log(falhas ? `\n✘ ${falhas} falha(s)` : '\n✔ Tudo certo');
process.exit(falhas ? 1 : 0);
