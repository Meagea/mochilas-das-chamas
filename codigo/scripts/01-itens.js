// ---------- Itens, classes e receitas ----------
// forma: linhas de texto, '#' é casa ocupada (antes de girar). uso:
//   arma     → ataca sozinha a cada cd segundos, gastando vigor; dano [mín, máx]; crit (0 a 1); acerto: o que faz ao acertar
//   ativo    → age a cada cd segundos (ao: o que faz); gastaMana: só age com mana (semMana: o que faz sem ela)
//   passivo  → age uma vez no começo da luta (inicio)
//   gatilho  → age uma vez quando a condição acontece (quando: 'vidaBaixa' abaixo de 50%, 'tempo' após t segundos)
//   bolsa    → abre casas na mochila (dentro: bônus para o que estiver nela)
// viz: bônus por vizinhança (casas lado a lado). modo 'da': dá o bônus a cada vizinho que combina com alvo;
//      modo 'recebe': este item ganha o bônus uma vez para cada vizinho que combina.
// Efeitos (ao, acerto, inicio): dano, bloqueio, cura, vigor, forca, queimar, envenenar, esquiva, mana, regen, gelo, espinhos, vida, perfura, golpes,
//   atordoar (segundos em que os itens do inimigo param), danoPorGelo (dano a mais por ponto de gelo do inimigo), multVeneno (o veneno do inimigo
//   cresce nessa fração), raiva (inicio: +1 de força a cada N de vida perdida). Outros campos: furia (arma: até +N de dano conforme a vida cai),
//   primeirosCrit (arma: os N primeiros golpes são críticos), aleatorio (ativo: sorteia um dos efeitos da lista), aoCritico (cada crítico seu aplica isto).
// nivel: itens da classe só aparecem na loja a partir desse nível do personagem (PROGRESSAO.md). Cada personagem é único: não há especializações.
const RARIDADES = {
  comum:    {nome:'Comum',    cor:'#9a9488', preco:3},
  incomum:  {nome:'Incomum',  cor:'#5aa84a', preco:5},
  rara:     {nome:'Rara',     cor:'#3d8fb5', preco:7},
  epica:    {nome:'Épica',    cor:'#9a5ad0', preco:10},
  lendaria: {nome:'Lendária', cor:'#e8b130', preco:14},
};
const ORDEM_RAR = ['comum', 'incomum', 'rara', 'epica', 'lendaria'];
const NOME_TIPO = {arma:'Arma', escudo:'Defesa', comida:'Comida', pocao:'Poção', acessorio:'Acessório', bolsa:'Bolsa', magia:'Magia'};

const CLASSES = {
  guerreiro:{nome:'Guerreiro', vida:59, cor:'#d9483b', inicial:'insignia', desc:'Força e bloqueio. Aguenta a pancada e devolve mais forte.'},
  mago:     {nome:'Mago', vida:58, cor:'#3d8fb5', inicial:'grimorio', desc:'Junta mana e solta magias fortes de fogo e gelo.'},
  ladino:   {nome:'Ladino', vida:48, cor:'#5aa84a', inicial:'kitVeneno', desc:'Golpes rápidos, veneno e esquiva. Vence pelo cansaço.'},
  // classes de ofício (ferramentas de artesão): a ferramenta inicial trabalha os itens encostados nela a cada rodada (oficio em 04-corrida.js)
  ferreiro:  {nome:'Ferreiro', vida:55, cor:'#c8783a', inicial:'bigorna', oficio:true, desc:'A Bigorna tempera as armas e armaduras de metal encostadas, rodada após rodada.'},
  herbalista:{nome:'Herbalista', vida:57, cor:'#4fae6a', inicial:'kitHerbal', oficio:true, desc:'As ervas encostadas no Kit criam brotos e ficam mais fortes a cada rodada.'},
  alquimista:{nome:'Alquimista', vida:57, cor:'#d8603a', inicial:'kitAlquimia', oficio:true, desc:'O Kit de Alquimia fabrica um frasco instável a cada rodada: fogo, gelo ou ácido.'},
  coureiro:  {nome:'Coureiro', vida:60, cor:'#a0703a', inicial:'ferramentasCouro', oficio:true, desc:'As Ferramentas de Couro costuram as bolsas: itens dentro de bolsa costurada ficam mais fortes.'},
  joalheiro: {nome:'Joalheiro', vida:61, cor:'#7a9ad8', inicial:'lupa', oficio:true, desc:'A Lupa lapida as gemas encostadas; gemas dão bônus às armas vizinhas, mais a cada lapidação.'},
  cozinheiro:{nome:'Cozinheiro', vida:64, cor:'#e0a040', inicial:'panela', oficio:true, desc:'A comida encostada na Panela vira um prato melhor depois de 2 rodadas.'},
};
// experiência total para chegar a cada nível (o índice 0 é o nível 1); depois do 10, cada estrela de prestígio custa mais XP_ESTRELA
const NIVEIS_XP = [0, 40, 120, 250, 450, 750, 1150, 1700, 2400, 3300], XP_ESTRELA = 3300;
function nivelDe(xp){
  xp = Math.max(0, xp || 0); let n = 1; while(n < NIVEIS_XP.length && xp >= NIVEIS_XP[n]) n++;
  const estrelas = xp >= NIVEIS_XP[9] ? Math.floor((xp - NIVEIS_XP[9]) / XP_ESTRELA) : 0;
  const de = n < 10 ? NIVEIS_XP[n - 1] : NIVEIS_XP[9] + estrelas * XP_ESTRELA, ate = n < 10 ? NIVEIS_XP[n] : de + XP_ESTRELA;
  return {nivel:n, estrelas, xp, de, ate, fracao:(xp - de) / (ate - de)};
}

const I = (id, nome, o) => Object.assign({id, nome, rar:'comum', tipo:'acessorio', tags:[], classe:null, forma:['#'], arte:'estrela'}, o);
const ITENS = [
  // ---- bolsas ----
  I('mochila', 'Mochila Velha', {tipo:'bolsa', forma:['####', '####', '####', '####'], arte:'etiqueta', inicial:true, preco:0, texto:'A sua mochila. Não pode ser vendida.'}),
  I('bolsaCouro', 'Bolsa de Couro', {tipo:'bolsa', forma:['##', '##'], arte:'etiqueta', preco:4, texto:'Abre 4 casas na mochila.'}),
  I('bolsaLonga', 'Bolsa Comprida', {tipo:'bolsa', forma:['###'], arte:'etiqueta', preco:3, texto:'Abre 3 casas em fila.'}),
  I('bolsaErvas', 'Bolsa de Ervas', {tipo:'bolsa', rar:'incomum', forma:['##', '##'], arte:'folha', preco:6, dentro:{alvo:{tipo:['comida', 'pocao']}, bonus:{cd:.2}}, texto:'Abre 4 casas. Comida e poções dentro dela agem 20% mais rápido.'}),
  I('bolsaArmas', 'Bainha Larga', {tipo:'bolsa', rar:'rara', forma:['###', '###'], arte:'espadas', preco:8, dentro:{alvo:{tipo:'arma'}, bonus:{dano:1}}, texto:'Abre 6 casas. Armas dentro dela causam +1 de dano.'}),

  // ---- armas comuns a todos ----
  I('graveto', 'Graveto', {tipo:'arma', forma:['#', '#'], arte:'folha', cd:1.5, custo:1, dano:[1, 3], texto:'Melhor que nada.'}),
  I('espadaCurta', 'Espada Curta', {tipo:'arma', forma:['#', '#'], arte:'espada', tags:['metal'], cd:1.6, custo:1, dano:[2, 4], texto:'Rápida e confiável.'}),
  I('clava', 'Clava', {tipo:'arma', forma:['#', '#'], arte:'osso', cd:2, custo:2, dano:[3, 6], texto:'Pesada e sem frescura.'}),
  I('machadinha', 'Machadinha', {tipo:'arma', rar:'incomum', forma:['##', '#.'], arte:'machado', tags:['metal'], cd:2, custo:2, dano:[4, 7], texto:'Corta madeira e o que mais aparecer.'}),
  I('lanca', 'Lança', {tipo:'arma', rar:'incomum', forma:['#', '#', '#'], arte:'tridente', tags:['metal'], cd:2.2, custo:2, dano:[4, 7], acerto:{perfura:3}, texto:'Atravessa 3 de bloqueio.'}),
  I('arcoCurto', 'Arco Curto', {tipo:'arma', rar:'incomum', forma:['#', '#', '#'], arte:'arco', cd:1.8, custo:1, dano:[2, 5], crit:.25, texto:'25% de chance de crítico (dano dobrado).'}),
  I('espadaLonga', 'Espada Longa', {tipo:'arma', rar:'rara', forma:['#', '#', '#'], arte:'espada', tags:['metal'], cd:2, custo:2, dano:[6, 9], texto:'A arma de quem leva a luta a sério.'}),
  I('martelo', 'Martelo de Guerra', {tipo:'arma', rar:'rara', forma:['##', '##', '.#'], arte:'martelo', tags:['metal'], cd:2.8, custo:3, dano:[9, 14], acerto:{perfura:4}, texto:'Lento, mas amassa até 4 de bloqueio.'}),

  // ---- defesa ----
  I('escudoMadeira', 'Escudo de Madeira', {tipo:'escudo', forma:['##', '##'], arte:'escudo', cd:3, ao:{bloqueio:4}, texto:'Ganha 4 de bloqueio a cada 3 s.'}),
  I('escudoFerro', 'Escudo de Ferro', {tipo:'escudo', rar:'incomum', forma:['##', '##'], arte:'escudo', tags:['metal'], cd:3.5, ao:{bloqueio:7}, texto:'Ganha 7 de bloqueio a cada 3,5 s.'}),
  I('elmo', 'Elmo Amassado', {tipo:'escudo', forma:['##'], arte:'coroa', tags:['metal'], uso:'passivo', inicio:{bloqueio:6}, texto:'Começa a luta com 6 de bloqueio.'}),
  I('couraca', 'Couraça de Couro', {tipo:'escudo', rar:'incomum', forma:['##', '##'], arte:'escudo', uso:'passivo', inicio:{vida:12}, texto:'+12 de vida máxima.'}),
  I('manto', 'Manto Leve', {tipo:'escudo', rar:'incomum', forma:['##'], arte:'vento', uso:'passivo', inicio:{esquiva:2}, texto:'Começa com 2 de esquiva (cada uma desvia um golpe).'}),

  // ---- comida e poções ----
  I('maca', 'Maçã', {tipo:'comida', forma:['#'], arte:'comida', preco:1, cd:4, ao:{cura:2}, viz:{modo:'recebe', alvo:{tipo:'comida'}, bonus:{cura:1}}, texto:'Cura 2 a cada 4 s. +1 de cura para cada comida vizinha.'}),
  I('pao', 'Pão Duro', {tipo:'comida', forma:['##'], arte:'comida', preco:2, cd:5, ao:{cura:3, vigor:1}, texto:'Cura 3 e dá 1 de vigor a cada 5 s.'}),
  I('queijo', 'Queijo Furado', {tipo:'comida', forma:['#'], arte:'comida', preco:2, cd:3.5, ao:{vigor:1}, texto:'Dá 1 de vigor a cada 3,5 s.'}),
  I('ensopado', 'Ensopado', {tipo:'comida', rar:'rara', forma:['##', '##'], arte:'xicara', cd:3, ao:{cura:4, regen:1}, texto:'Cura 4 e soma 1 de regeneração a cada 3 s.'}),
  I('pocaoCura', 'Poção de Cura', {tipo:'pocao', rar:'incomum', forma:['#'], arte:'frasco', preco:4, uso:'gatilho', quando:'vidaBaixa', ao:{cura:14}, texto:'Uma vez: quando a vida cai abaixo da metade, cura 14.'}),
  I('pocaoVigor', 'Poção de Vigor', {tipo:'pocao', rar:'incomum', forma:['#'], arte:'frasco', preco:4, cd:6, ao:{vigor:2}, texto:'Dá 2 de vigor a cada 6 s.'}),
  I('frascoVeneno', 'Frasco de Veneno', {tipo:'pocao', rar:'incomum', forma:['#'], arte:'gota', tags:['veneno'], cd:4, ao:{envenenar:2}, texto:'Envenena o inimigo em 2 a cada 4 s.'}),
  I('bomba', 'Bomba', {tipo:'pocao', rar:'incomum', forma:['#'], arte:'bomba', preco:4, uso:'gatilho', quando:'tempo', t:3, ao:{dano:10}, texto:'Uma vez: depois de 3 s, causa 10 de dano.'}),

  // ---- acessórios ----
  I('amolar', 'Pedra de Amolar', {forma:['#'], arte:'pedra', preco:2, uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{dano:1}}, texto:'Armas vizinhas causam +1 de dano.'}),
  I('pedraFogo', 'Pedra de Fogo', {rar:'incomum', forma:['#'], arte:'chama', tags:['fogo'], cd:3, ao:{queimar:1}, viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{acerto:{queimar:1}}}, texto:'Queima o inimigo em 1 a cada 3 s. Armas vizinhas queimam 1 ao acertar.'}),
  I('trevo', 'Trevo de Quatro Folhas', {rar:'incomum', forma:['#'], arte:'folha', uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{crit:.15}}, texto:'Armas vizinhas ganham 15% de chance de crítico.'}),
  I('gemaVida', 'Gema da Vida', {rar:'rara', forma:['#'], arte:'coracao', uso:'passivo', inicio:{vida:10}, viz:{modo:'da', alvo:{tipo:['comida', 'pocao']}, bonus:{cura:2}}, texto:'+10 de vida máxima. Comida e poções vizinhas curam +2.'}),
  I('ampulheta', 'Ampulheta', {rar:'rara', forma:['#', '#'], arte:'ampulheta', uso:'passivo', viz:{modo:'da', alvo:{}, bonus:{cd:.15}}, texto:'Todos os vizinhos agem 15% mais rápido.'}),
  I('ferradura', 'Ferradura', {forma:['#'], arte:'medalha', tags:['metal'], uso:'passivo', inicio:{vigor:2}, texto:'Começa a luta com 2 de vigor a mais.'}),
  I('coracaoPedra', 'Coração de Pedra', {rar:'epica', forma:['##', '##'], arte:'cristal', uso:'passivo', inicio:{vida:25, bloqueio:10}, texto:'+25 de vida máxima e começa com 10 de bloqueio.'}),

  // ---- Guerreiro: força e bloqueio ----
  I('insignia', 'Insígnia do Guerreiro', {classe:'guerreiro', forma:['#'], arte:'medalha', inicial:true, preco:0, uso:'passivo', inicio:{forca:1, vida:5}, texto:'Começa com 1 de força e +5 de vida. Cada ponto de força soma 1 ao dano das armas.'}),
  I('trombeta', 'Trombeta de Guerra', {classe:'guerreiro', rar:'incomum', forma:['##'], arte:'sino', cd:6, ao:{forca:1}, texto:'Ganha 1 de força a cada 6 s.'}),
  I('escudoTorre', 'Escudo Torre', {classe:'guerreiro', rar:'rara', tipo:'escudo', forma:['##', '##', '##'], arte:'escudo', tags:['metal'], cd:4, ao:{bloqueio:11}, viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{dano:1}}, texto:'Ganha 11 de bloqueio a cada 4 s. Armas vizinhas +1 de dano.'}),
  I('espinheira', 'Armadura de Espinhos', {classe:'guerreiro', rar:'rara', tipo:'escudo', forma:['##', '##'], arte:'escudo', uso:'passivo', inicio:{bloqueio:5, espinhos:2}, texto:'Começa com 5 de bloqueio. Quem bater em você leva 2 de dano por golpe.'}),
  I('machadoFuria', 'Machado da Fúria', {classe:'guerreiro', rar:'epica', tipo:'arma', forma:['##', '##', '#.'], arte:'machado', tags:['metal'], cd:2.4, custo:2, dano:[7, 11], acerto:{forca:1}, texto:'Cada acerto dá 1 de força.'}),
  I('estandarte', 'Estandarte Rasgado', {classe:'guerreiro', rar:'lendaria', forma:['#', '#', '#'], arte:'coroa', uso:'passivo', inicio:{forca:3, bloqueio:8}, viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{cd:.15}}, texto:'Começa com 3 de força e 8 de bloqueio. Armas vizinhas atacam 15% mais rápido.'}),

  // ---- Mago: mana, fogo e gelo ----
  I('grimorio', 'Grimório Gasto', {classe:'mago', tipo:'magia', forma:['#', '#'], arte:'livro', tags:['magia'], inicial:true, preco:0, cd:2, ao:{mana:1}, texto:'Ganha 1 de mana a cada 2 s. As magias gastam mana.'}),
  I('faisca', 'Faísca', {classe:'mago', tipo:'magia', forma:['#'], arte:'raio', tags:['magia', 'fogo'], cd:2, gastaMana:1, ao:{dano:5}, semMana:{dano:1}, texto:'Gasta 1 de mana: 5 de dano. Sem mana, só 1.'}),
  I('varinha', 'Varinha', {classe:'mago', tipo:'arma', forma:['#', '#'], arte:'raio', tags:['magia'], cd:1.6, custo:1, dano:[2, 4], acerto:{mana:1}, texto:'Cada acerto dá 1 de mana.'}),
  I('cristalMana', 'Cristal de Mana', {classe:'mago', rar:'incomum', forma:['#'], arte:'cristal', tags:['magia'], uso:'passivo', inicio:{mana:3}, viz:{modo:'da', alvo:{tag:'magia'}, bonus:{cd:.1}}, texto:'Começa com 3 de mana. Magias vizinhas agem 10% mais rápido.'}),
  I('orbeGelo', 'Orbe de Gelo', {classe:'mago', rar:'incomum', tipo:'magia', forma:['#'], arte:'gelo', tags:['magia', 'gelo'], cd:4, gastaMana:1, ao:{gelo:2, dano:2}, texto:'Gasta 1 de mana: 2 de dano e 2 de gelo (cada gelo deixa os itens do inimigo 5% mais lentos).'}),
  I('cajadoFogo', 'Cajado de Fogo', {classe:'mago', rar:'rara', tipo:'magia', forma:['#', '#', '#'], arte:'chama', tags:['magia', 'fogo'], cd:2.5, gastaMana:2, ao:{dano:8, queimar:2}, semMana:{dano:3}, texto:'Gasta 2 de mana: 8 de dano e queima 2. Sem mana, só 3 de dano.'}),
  I('bolaFogo', 'Pergaminho da Bola de Fogo', {classe:'mago', rar:'epica', tipo:'magia', forma:['##', '##'], arte:'pergaminho', tags:['magia', 'fogo'], cd:6, gastaMana:4, ao:{dano:18, queimar:3}, texto:'Gasta 4 de mana: 18 de dano e queima 3.'}),
  I('olhoArcano', 'Olho Arcano', {classe:'mago', rar:'lendaria', forma:['##', '##'], arte:'olho', tags:['magia'], cd:2, ao:{mana:2}, viz:{modo:'da', alvo:{tag:'magia'}, bonus:{cd:.2}}, texto:'Ganha 2 de mana a cada 2 s. Magias vizinhas agem 20% mais rápido.'}),

  // ---- Ladino: veneno, esquiva e crítico ----
  I('kitVeneno', 'Kit de Venenos', {classe:'ladino', forma:['#'], arte:'serpente', tags:['veneno'], inicial:true, preco:0, uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{acerto:{envenenar:1}}}, texto:'Armas vizinhas envenenam 1 ao acertar. O veneno fere a cada 2 s e não some.'}),
  I('adaga', 'Adaga', {classe:'ladino', tipo:'arma', forma:['#', '#'], arte:'espada', tags:['metal'], cd:1.3, custo:1, dano:[1, 3], crit:.2, texto:'Muito rápida. 20% de chance de crítico.'}),
  I('zarabatana', 'Zarabatana', {classe:'ladino', rar:'incomum', tipo:'arma', forma:['#', '#'], arte:'vento', tags:['veneno'], cd:2, custo:1, dano:[1, 2], acerto:{envenenar:2}, texto:'Cada acerto envenena 2.'}),
  I('capaSombras', 'Capa das Sombras', {classe:'ladino', rar:'rara', tipo:'escudo', forma:['##', '##'], arte:'nevoa', cd:5, ao:{esquiva:1}, texto:'Ganha 1 de esquiva a cada 5 s.'}),
  I('fumaca', 'Bomba de Fumaça', {classe:'ladino', rar:'incomum', tipo:'pocao', forma:['#'], arte:'bomba', preco:4, uso:'gatilho', quando:'vidaBaixa', ao:{esquiva:3}, texto:'Uma vez: quando a vida cai abaixo da metade, ganha 3 de esquiva.'}),
  I('adagasGemeas', 'Adagas Gêmeas', {classe:'ladino', rar:'epica', tipo:'arma', forma:['##', '##'], arte:'espadas', tags:['metal'], cd:1.6, custo:1, dano:[2, 4], crit:.2, acerto:{golpes:2}, texto:'Golpeia duas vezes. 20% de chance de crítico.'}),
  I('presaSerpente', 'Presa da Serpente', {classe:'ladino', rar:'lendaria', forma:['#', '#'], arte:'serpente', tags:['veneno'], cd:3, ao:{envenenar:3}, viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{crit:.2}}, texto:'Envenena 3 a cada 3 s. Armas vizinhas ganham 20% de crítico.'}),

  // ---- liberados pelo nível do personagem (PROGRESSAO.md) ----
  I('cantil', 'Cantil de Campanha', {classe:'guerreiro', tipo:'comida', forma:['#', '#'], arte:'xicara', cd:4, ao:{cura:2, vigor:1}, texto:'Cura 2 e dá 1 de vigor a cada 4 s.'}),
  I('manopla', 'Manopla de Ferro', {classe:'guerreiro', nivel:2, rar:'incomum', tipo:'escudo', forma:['#'], arte:'escudo', tags:['metal'], uso:'passivo', inicio:{bloqueio:3}, viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{acerto:{bloqueio:1}}}, texto:'Começa com 3 de bloqueio. Armas vizinhas dão 1 de bloqueio a cada acerto.'}),
  I('gritoGuerra', 'Grito de Guerra', {classe:'guerreiro', nivel:3, rar:'rara', forma:['##'], arte:'sino', uso:'gatilho', quando:'vidaBaixa', ao:{forca:3, bloqueio:6}, texto:'Uma vez: quando a vida cai abaixo da metade, ganha 3 de força e 6 de bloqueio.'}),
  I('cotaMalha', 'Cota de Malha', {classe:'guerreiro', nivel:4, rar:'rara', tipo:'escudo', forma:['##', '##'], arte:'escudo', tags:['metal'], cd:4, ao:{bloqueio:5}, viz:{modo:'recebe', alvo:{tag:'metal'}, bonus:{bloqueio:1}}, texto:'Ganha 5 de bloqueio a cada 4 s. +1 para cada item de metal vizinho.'}),
  I('machadoDuplo', 'Machado Duplo', {classe:'guerreiro', nivel:6, rar:'epica', tipo:'arma', forma:['#.', '##', '#.'], arte:'machado', tags:['metal'], cd:2.4, custo:2, dano:[6, 9], furia:8, texto:'Até +8 de dano conforme a sua vida cai.'}),
  I('colarDentes', 'Colar de Dentes', {classe:'guerreiro', nivel:5, rar:'incomum', forma:['#'], arte:'osso', uso:'passivo', inicio:{raiva:14}, texto:'Ganha 1 de força a cada 14 de vida perdida.'}),
  I('paves', 'Pavês', {classe:'guerreiro', nivel:7, rar:'epica', tipo:'escudo', forma:['##', '##', '##'], arte:'escudo', tags:['metal'], cd:4, ao:{bloqueio:10, espinhos:1}, texto:'Ganha 10 de bloqueio e 1 de espinhos a cada 4 s.'}),
  I('brasao', 'Brasão', {classe:'guerreiro', nivel:5, rar:'incomum', forma:['#'], arte:'medalha', uso:'passivo', inicio:{bloqueio:5, espinhos:1}, viz:{modo:'da', alvo:{tipo:'escudo'}, bonus:{bloqueio:2}}, texto:'Começa com 5 de bloqueio e 1 de espinhos. Escudos vizinhos dão +2 de bloqueio.'}),
  I('marteloCerco', 'Martelo de Cerco', {classe:'guerreiro', nivel:7, rar:'epica', tipo:'arma', forma:['##', '##', '.#'], arte:'martelo', tags:['metal'], cd:3.2, custo:3, dano:[10, 14], acerto:{atordoar:.7}, texto:'Lento. Cada acerto atordoa o inimigo por 0,7 s (os itens dele param).'}),
  I('coroaCampeao', 'Coroa do Campeão', {classe:'guerreiro', nivel:9, rar:'lendaria', forma:['##'], arte:'coroa', cd:5, ao:{forca:1, bloqueio:5}, texto:'Ganha 1 de força e 5 de bloqueio a cada 5 s.'}),

  I('vela', 'Vela de Estudo', {classe:'mago', nivel:2, tipo:'magia', forma:['#'], arte:'chama', tags:['magia', 'fogo'], cd:2.5, ao:{mana:1, queimar:1}, viz:{modo:'da', alvo:{tag:'magia'}, bonus:{cd:.1}}, texto:'Ganha 1 de mana e queima 1 a cada 2,5 s. Magias vizinhas agem 10% mais rápido.'}),
  I('runaGelo', 'Runa de Gelo', {classe:'mago', nivel:3, rar:'incomum', tipo:'magia', forma:['#'], arte:'gelo', tags:['magia', 'gelo'], cd:3.5, ao:{gelo:1, dano:1}, viz:{modo:'da', alvo:{tag:'gelo'}, bonus:{aoMais:{gelo:1}}}, texto:'A cada 3,5 s: 1 de dano e 1 de gelo. Magias de gelo vizinhas aplicam +1 de gelo.'}),
  I('ampolaEter', 'Ampola de Éter', {classe:'mago', nivel:4, rar:'rara', tipo:'pocao', forma:['#'], arte:'frasco', tags:['magia'], uso:'gatilho', quando:'tempo', t:5, ao:{mana:8, bloqueio:5}, texto:'Uma vez: depois de 5 s, ganha 8 de mana e 5 de bloqueio.'}),
  I('meteorito', 'Meteorito', {classe:'mago', nivel:6, rar:'epica', tipo:'magia', forma:['##', '##'], arte:'chama', tags:['magia', 'fogo'], cd:7, gastaMana:4, ao:{dano:14, queimar:5}, texto:'Gasta 4 de mana: 14 de dano e queima 5.'}),
  I('brasaViva', 'Brasa Viva', {classe:'mago', nivel:5, rar:'incomum', tipo:'magia', forma:['#'], arte:'chama', tags:['magia', 'fogo'], cd:2.5, ao:{queimar:1}, viz:{modo:'da', alvo:{tag:'fogo'}, bonus:{aoMais:{queimar:1}}}, texto:'Queima 1 a cada 2,5 s. Magias de fogo vizinhas queimam +1.'}),
  I('lancaGelo', 'Lança de Gelo', {classe:'mago', nivel:7, rar:'epica', tipo:'magia', forma:['#', '#', '#'], arte:'gelo', tags:['magia', 'gelo'], cd:2.8, gastaMana:2, ao:{dano:6, gelo:1, danoPorGelo:1}, semMana:{dano:2, gelo:1}, texto:'Gasta 2 de mana: 6 de dano, +1 para cada gelo do inimigo, e 1 de gelo. Sem mana: 2 de dano e 1 de gelo.'}),
  I('coroaGeada', 'Coroa de Geada', {classe:'mago', nivel:5, rar:'incomum', forma:['##'], arte:'gelo', tags:['magia', 'gelo'], uso:'gatilho', quando:'tempo', t:.1, ao:{gelo:3}, texto:'No começo da luta, põe 3 de gelo no inimigo.'}),
  I('espelhoArcano', 'Espelho Arcano', {classe:'mago', nivel:7, rar:'rara', tipo:'escudo', forma:['#', '#'], arte:'cristal', tags:['magia'], cd:4, ao:{bloqueio:7, mana:2, dano:3}, texto:'A cada 4 s: 7 de bloqueio, 2 de mana e 3 de dano no inimigo.'}),
  I('tomoProibido', 'Tomo Proibido', {classe:'mago', nivel:9, rar:'lendaria', tipo:'magia', forma:['##', '##'], arte:'livro', tags:['magia'], cd:3, ao:{mana:3}, viz:{modo:'da', alvo:{tag:'magia'}, bonus:{cd:.25}}, texto:'Ganha 3 de mana a cada 3 s. Magias vizinhas agem 25% mais rápido.'}),

  I('gazua', 'Gazua', {classe:'ladino', nivel:2, forma:['#'], arte:'espada', tags:['metal'], uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{crit:.12, dano:1}}, texto:'Armas vizinhas ganham 12% de crítico e +1 de dano.'}),
  I('facas', 'Facas de Arremesso', {classe:'ladino', nivel:3, rar:'incomum', tipo:'arma', forma:['#', '#'], arte:'espada', tags:['metal'], cd:1.5, custo:1, dano:[3, 4], crit:.1, acerto:{perfura:3}, texto:'Rápidas. Atravessam 3 de bloqueio. 10% de crítico.'}),
  I('mascara', 'Máscara de Ladrão', {classe:'ladino', nivel:4, rar:'rara', tipo:'escudo', forma:['##'], arte:'nevoa', uso:'passivo', inicio:{esquiva:2}, viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{crit:.1}}, texto:'Começa com 2 de esquiva. Armas vizinhas ganham 10% de crítico.'}),
  I('laminaOculta', 'Lâmina Oculta', {classe:'ladino', nivel:6, rar:'epica', tipo:'arma', forma:['#', '#'], arte:'espada', tags:['metal'], cd:1.6, custo:1, dano:[6, 9], crit:.2, primeirosCrit:3, texto:'Os 3 primeiros golpes são críticos. Depois, 20% de crítico.'}),
  I('luvas', 'Luvas Leves', {classe:'ladino', nivel:5, rar:'incomum', forma:['#'], arte:'vento', uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{cd:.2, crit:.08}}, texto:'Armas vizinhas atacam 20% mais rápido e ganham 8% de crítico.'}),
  I('alambique', 'Alambique', {classe:'ladino', nivel:7, rar:'epica', tipo:'pocao', forma:['##', '##'], arte:'frasco', tags:['veneno'], cd:5, ao:{envenenar:4, multVeneno:.6}, texto:'A cada 5 s, envenena 4 e o veneno do inimigo cresce 60%.'}),
  I('cogumelo', 'Cogumelo Tóxico', {classe:'ladino', nivel:5, rar:'incomum', tipo:'pocao', forma:['#'], arte:'gota', tags:['veneno'], preco:3, cd:1.8, ao:{envenenar:1}, viz:{modo:'da', alvo:{tag:'veneno'}, bonus:{cd:.15}}, texto:'Envenena 1 a cada 1,8 s. Itens de veneno vizinhos agem 15% mais rápido.'}),
  I('bolsaTruques', 'Bolsa de Truques', {classe:'ladino', nivel:7, rar:'rara', forma:['##'], arte:'bomba', cd:5, ao:{}, aleatorio:[{esquiva:2}, {envenenar:4}, {forca:1, vigor:2}], texto:'A cada 5 s, um truque: 2 de esquiva, envenenar 4, ou 1 de força e 2 de vigor.'}),
  I('sorrisoHiena', 'Sorriso da Hiena', {classe:'ladino', nivel:9, rar:'lendaria', forma:['#', '#'], arte:'serpente', uso:'passivo', aoCritico:{envenenar:2, esquiva:1}, viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{crit:.1}}, texto:'Cada crítico seu envenena 2 e dá 1 de esquiva. Armas vizinhas +10% de crítico.'}),

  // ---- Ferreiro: têmpera (cada nível: arma +1 de dano, armadura +2 de bloqueio) ----
  I('bigorna', 'Bigorna', {classe:'ferreiro', forma:['##', '##'], arte:'ferramenta', tags:['metal'], inicial:true, preco:0, uso:'passivo', oficio:'tempera', viz:{modo:'da', alvo:{tag:'metal'}, bonus:{}}, texto:'A cada rodada, tempera a arma ou armadura de metal mais fraca encostada nela (até 3 vezes cada): arma +2 de dano, armadura +3 de bloqueio.'}),
  I('marteloForja', 'Martelo de Forja', {classe:'ferreiro', tipo:'arma', forma:['#', '#'], arte:'martelo', tags:['metal'], cd:1.8, custo:1, dano:[2, 4], acerto:{bloqueio:1}, texto:'Cada acerto dá 1 de bloqueio.'}),
  I('lingote', 'Lingote de Ferro', {classe:'ferreiro', rar:'incomum', forma:['#'], arte:'pedra', tags:['metal'], uso:'passivo', viz:{modo:'da', alvo:{tag:'metal'}, bonus:{dano:1, bloqueio:1}}, texto:'Itens de metal vizinhos: +1 de dano ou +1 de bloqueio.'}),
  I('fole', 'Fole', {classe:'ferreiro', rar:'rara', forma:['##'], arte:'vento', uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{acerto:{queimar:1}}}, inicio:{vigor:1}, texto:'Armas vizinhas queimam 1 ao acertar. Começa com 1 de vigor a mais.'}),
  I('armaduraPlacas', 'Armadura de Placas', {classe:'ferreiro', rar:'epica', tipo:'escudo', forma:['##', '##', '##'], arte:'escudo', tags:['metal'], uso:'passivo', inicio:{bloqueio:16, vida:6}, texto:'Começa com 16 de bloqueio e +6 de vida.'}),
  I('laminaMestre', 'Lâmina do Mestre', {classe:'ferreiro', rar:'lendaria', tipo:'arma', forma:['#', '#', '#'], arte:'espada', tags:['metal'], cd:2, custo:2, dano:[6, 9], porTempera:1, texto:'+1 de dano para cada nível de têmpera na mochila.'}),
  I('tenaz', 'Tenaz', {classe:'ferreiro', nivel:2, forma:['#', '#'], arte:'ferramenta', tags:['metal'], uso:'passivo', viz:{modo:'da', alvo:{tag:'metal'}, bonus:{bloqueio:1}}, texto:'Encostada na Bigorna, ela tempera mais um item nas rodadas pares. Metal vizinho +1 de bloqueio.'}),
  I('rebites', 'Rebites', {classe:'ferreiro', nivel:3, rar:'incomum', forma:['#'], arte:'medalha', tags:['metal'], uso:'passivo', inicio:{espinhos:1}, viz:{modo:'da', alvo:{tipo:'escudo'}, bonus:{bloqueio:1}}, texto:'1 de espinhos. Escudos vizinhos dão +1 de bloqueio.'}),
  I('baldeTempera', 'Balde de Têmpera', {classe:'ferreiro', nivel:4, rar:'rara', forma:['##'], arte:'xicara', tags:['metal'], uso:'gatilho', quando:'vidaBaixa', ao:{bloqueio:10, forca:1}, texto:'Uma vez: quando a vida cai abaixo da metade, ganha 10 de bloqueio e 1 de força.'}),
  I('montante', 'Montante', {classe:'ferreiro', nivel:6, rar:'epica', tipo:'arma', forma:['#', '#', '#'], arte:'espada', tags:['metal'], cd:2.6, custo:3, dano:[10, 15], texto:'Espada enorme.'}),
  I('pedraAfiar', 'Pedra de Afiar Fina', {classe:'ferreiro', nivel:5, rar:'incomum', forma:['#'], arte:'pedra', uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{dano:2, crit:.1}}, texto:'Armas vizinhas: +2 de dano e 10% de crítico.'}),
  I('elmoFechado', 'Elmo Fechado', {classe:'ferreiro', nivel:7, rar:'epica', tipo:'escudo', forma:['##', '##'], arte:'coroa', tags:['metal'], cd:3.5, ao:{bloqueio:10, espinhos:1}, inicio:{bloqueio:5}, texto:'Começa com 5 de bloqueio. A cada 3,5 s: 10 de bloqueio e 1 de espinhos.'}),
  I('escarpas', 'Escarpas', {classe:'ferreiro', nivel:5, rar:'incomum', tipo:'escudo', forma:['##'], arte:'escudo', tags:['metal'], uso:'passivo', inicio:{vida:9, bloqueio:3}, texto:'+9 de vida e começa com 3 de bloqueio.'}),
  I('forjaPortatil', 'Forja Portátil', {classe:'ferreiro', nivel:7, rar:'epica', forma:['##', '##'], arte:'chama', tags:['metal', 'fogo'], cd:7, ao:{forca:1, bloqueio:4}, texto:'A cada 7 s: 1 de força e 4 de bloqueio.'}),
  I('bigornaAncestral', 'Bigorna Ancestral', {classe:'ferreiro', nivel:9, rar:'lendaria', forma:['##', '##'], arte:'ferramenta', tags:['metal'], uso:'passivo', oficio:'tempera', viz:{modo:'da', alvo:{tag:'metal'}, bonus:{}}, inicio:{bloqueio:6}, texto:'Tempera como a Bigorna, e a têmpera de toda a mochila vai até 4. Começa com 6 de bloqueio.'}),

  // ---- Herbalista: cultivo (cada broto: +20% no efeito da erva, até 5) ----
  I('kitHerbal', 'Kit de Herbalismo', {classe:'herbalista', forma:['#', '#'], arte:'folha', inicial:true, preco:0, uso:'passivo', oficio:'cultivo', viz:{modo:'da', alvo:{tag:'erva'}, bonus:{}}, texto:'A cada rodada, as ervas encostadas ganham 1 broto (até 5; cada broto +25% no efeito). Poções encostadas funcionam duas vezes.'}),
  I('salvia', 'Folha de Sálvia', {classe:'herbalista', tipo:'comida', forma:['#'], arte:'folha', tags:['erva'], cd:2.2, ao:{cura:2}, texto:'Cura 2 a cada 2,2 s.'}),
  I('raizAmarga', 'Raiz Amarga', {classe:'herbalista', rar:'incomum', tipo:'pocao', forma:['#'], arte:'gota', tags:['erva', 'veneno'], cd:2.5, ao:{envenenar:1}, texto:'Envenena 1 a cada 2,5 s.'}),
  I('florVigor', 'Flor de Vigor', {classe:'herbalista', rar:'rara', tipo:'comida', forma:['#'], arte:'sol', tags:['erva'], cd:3, ao:{vigor:1, cura:2}, texto:'A cada 3 s: 1 de vigor e cura 2.'}),
  I('cogumeloGigante', 'Cogumelo Gigante', {classe:'herbalista', rar:'epica', tipo:'comida', forma:['##', '##'], arte:'comida', tags:['erva'], cd:4, ao:{cura:4, regen:1}, texto:'A cada 4 s: cura 4 e soma 1 de regeneração.'}),
  I('arvoreAncia', 'Árvore Anciã', {classe:'herbalista', rar:'lendaria', forma:['#', '#', '#'], arte:'folha', tags:['erva'], uso:'passivo', inicio:{vida:10}, texto:'Todas as ervas da mochila ganham 1 broto a mais por rodada. +10 de vida.'}),
  I('regador', 'Regador', {classe:'herbalista', nivel:2, forma:['##'], arte:'xicara', tags:['metal'], uso:'passivo', viz:{modo:'da', alvo:{tag:'erva'}, bonus:{}}, texto:'Ervas encostadas nele ganham 1 broto a mais por rodada.'}),
  I('pilao', 'Pilão', {classe:'herbalista', nivel:3, rar:'incomum', forma:['#'], arte:'pedra', uso:'passivo', viz:{modo:'da', alvo:{tag:'erva'}, bonus:{aoMais:{cura:1, envenenar:1, vigor:1}, cd:.1}}, texto:'Ervas vizinhas: +1 no efeito e agem 10% mais rápido.'}),
  I('musgo', 'Musgo Curativo', {classe:'herbalista', nivel:4, rar:'rara', tipo:'pocao', forma:['#'], arte:'folha', tags:['erva'], uso:'gatilho', quando:'vidaBaixa', ao:{cura:14, regen:1}, texto:'Uma vez: quando a vida cai abaixo da metade, cura 14 e soma 1 de regeneração.'}),
  I('chaCamomila', 'Chá de Camomila', {classe:'herbalista', nivel:6, rar:'epica', tipo:'comida', forma:['##'], arte:'xicara', tags:['erva'], cd:3.5, ao:{cura:4, regen:1}, texto:'A cada 3,5 s: cura 4 e soma 1 de regeneração.'}),
  I('balsamo', 'Bálsamo', {classe:'herbalista', nivel:5, rar:'incomum', tipo:'pocao', forma:['#'], arte:'frasco', tags:['erva'], cd:4, ao:{cura:2, bloqueio:3}, texto:'A cada 4 s: cura 2 e 3 de bloqueio.'}),
  I('beladona', 'Beladona', {classe:'herbalista', nivel:7, rar:'epica', tipo:'pocao', forma:['#', '#'], arte:'gota', tags:['erva', 'veneno'], cd:3.5, ao:{envenenar:2}, texto:'Envenena 2 a cada 3,5 s.'}),
  I('espinheiro', 'Espinheiro', {classe:'herbalista', nivel:5, rar:'incomum', forma:['#'], arte:'folha', tags:['erva'], uso:'passivo', inicio:{espinhos:1}, viz:{modo:'da', alvo:{tag:'erva'}, bonus:{cd:.1}}, texto:'1 de espinhos. Ervas vizinhas agem 10% mais rápido.'}),
  I('estufa', 'Estufa de Vidro', {classe:'herbalista', nivel:7, rar:'epica', tipo:'bolsa', forma:['##', '##'], arte:'cristal', preco:9, dentro:{alvo:{tag:'erva'}, bonus:{cd:.25}}, texto:'Abre 4 casas. Ervas dentro dela agem 25% mais rápido.'}),
  I('sementeMundo', 'Semente do Mundo', {classe:'herbalista', nivel:9, rar:'lendaria', forma:['#'], arte:'brilho', tags:['erva'], uso:'gatilho', quando:'morte', ao:{cura:999}, texto:'Uma vez: ao cair, volta com metade da vida.'}),

  // ---- Cozinheiro: cozimento (prato: +60% no efeito e +4 de vida) ----
  I('panela', 'Panela', {classe:'cozinheiro', forma:['##', '##'], arte:'xicara', tags:['metal'], inicial:true, preco:0, uso:'passivo', oficio:'cozinha', viz:{modo:'da', alvo:{tipo:'comida'}, bonus:{cd:.15}}, texto:'A comida encostada nela age 15% mais rápido e, depois de 2 rodadas, vira um prato: +60% no efeito e +4 de vida.'}),
  I('colherPau', 'Colher de Pau', {classe:'cozinheiro', tipo:'arma', forma:['#', '#'], arte:'osso', cd:1.6, custo:1, dano:[3, 5], acerto:{cura:1}, texto:'Cada acerto cura 1.'}),
  I('temperos', 'Temperos', {classe:'cozinheiro', rar:'incomum', forma:['#'], arte:'folha', uso:'passivo', viz:{modo:'da', alvo:{tipo:'comida'}, bonus:{cura:1, cd:.1}}, texto:'Comida vizinha cura +1 e age 10% mais rápido.'}),
  I('caldeirao', 'Caldeirão de Sopa', {classe:'cozinheiro', rar:'rara', tipo:'comida', forma:['##', '##'], arte:'xicara', tags:['fogo'], cd:4, ao:{cura:3, regen:1, queimar:2}, texto:'Sopa fervente. A cada 4 s: cura 3, soma 1 de regeneração e queima o inimigo em 2.'}),
  I('banquete', 'Banquete', {classe:'cozinheiro', rar:'epica', tipo:'comida', forma:['###', '###'], arte:'comida', cd:4, ao:{cura:6, vigor:1}, inicio:{vida:8}, texto:'+8 de vida. A cada 4 s: cura 6 e 1 de vigor.'}),
  I('livroReceitas', 'Livro de Receitas', {classe:'cozinheiro', rar:'lendaria', forma:['#', '#'], arte:'livro', uso:'passivo', inicio:{vida:8, forca:1}, viz:{modo:'da', alvo:{tipo:'comida'}, bonus:{cura:1}}, texto:'Os pratos ficam prontos em 1 rodada. +8 de vida e 1 de força. Comida vizinha cura +1.'}),
  I('avental', 'Avental', {classe:'cozinheiro', nivel:2, tipo:'escudo', forma:['##'], arte:'nevoa', uso:'passivo', inicio:{bloqueio:3}, porComida:{bloqueio:1}, texto:'Começa com 3 de bloqueio, mais 1 para cada comida na mochila.'}),
  I('facaCozinha', 'Faca de Cozinha', {classe:'cozinheiro', nivel:3, rar:'incomum', tipo:'arma', forma:['#', '#'], arte:'espada', tags:['metal'], cd:1.5, custo:1, dano:[2, 4], viz:{modo:'recebe', alvo:{tipo:'comida'}, bonus:{dano:1}}, texto:'Rápida. +1 de dano para cada comida vizinha.'}),
  I('pimenta', 'Pimenta Ardida', {classe:'cozinheiro', nivel:4, rar:'rara', tipo:'comida', forma:['#'], arte:'chama', tags:['fogo'], cd:7, ao:{forca:1, cura:2}, texto:'A cada 7 s: 1 de força e cura 2.'}),
  I('bolo', 'Bolo de Festa', {classe:'cozinheiro', nivel:6, rar:'epica', tipo:'comida', forma:['##', '##'], arte:'comida', cd:4, ao:{cura:6, esquiva:1}, texto:'A cada 4 s: cura 6 e 1 de esquiva.'}),
  I('mel', 'Mel', {classe:'cozinheiro', nivel:5, rar:'incomum', tipo:'comida', forma:['#'], arte:'frasco', cd:5, ao:{regen:1}, texto:'Soma 1 de regeneração a cada 5 s.'}),
  I('espeto', 'Espeto Flamejante', {classe:'cozinheiro', nivel:7, rar:'epica', tipo:'arma', forma:['#', '#', '#'], arte:'chama', tags:['metal', 'fogo'], cd:2, custo:2, dano:[7, 10], acerto:{queimar:3}, texto:'Cada acerto queima 3.'}),
  I('carvao', 'Carvão', {classe:'cozinheiro', nivel:5, rar:'incomum', forma:['#'], arte:'pedra', tags:['fogo'], cd:2.5, ao:{queimar:1}, viz:{modo:'da', alvo:{tipo:'comida'}, bonus:{cd:.1}}, texto:'Queima 1 a cada 2,5 s. Comida vizinha age 10% mais rápido.'}),
  I('roloMassa', 'Rolo de Massa', {classe:'cozinheiro', nivel:7, rar:'rara', tipo:'arma', forma:['#', '#'], arte:'osso', cd:3, custo:2, dano:[4, 6], acerto:{atordoar:.4}, texto:'Cada acerto atordoa o inimigo por 0,4 s.'}),
  I('fogao', 'Fogão de Ferro', {classe:'cozinheiro', nivel:9, rar:'lendaria', forma:['##', '##'], arte:'chama', tags:['metal', 'fogo'], uso:'passivo', oficio:'cozinha', rapido:true, viz:{modo:'da', alvo:{tipo:'comida'}, bonus:{cura:2}}, inicio:{bloqueio:6}, texto:'Cozinha a comida encostada em 1 rodada. Comida vizinha cura +2. Começa com 6 de bloqueio.'}),

  // ---- Alquimista: transmutação (o Kit fabrica frascos instáveis; até 3 na mochila) ----
  I('kitAlquimia', 'Kit de Alquimia', {classe:'alquimista', forma:['#', '#'], arte:'frasco', inicial:true, preco:0, uso:'passivo', oficio:'alquimia', viz:{modo:'da', alvo:{tag:'frasco'}, bonus:{}}, texto:'A cada rodada, fabrica um frasco instável (fogo, gelo ou ácido) numa casa livre. Até 3 frascos na mochila.'}),
  I('polvora', 'Pólvora Negra', {classe:'alquimista', tipo:'pocao', forma:['#'], arte:'bomba', tags:['frasco', 'fogo'], cd:4, ao:{dano:3, queimar:1}, texto:'A cada 4 s: 3 de dano e queima 1.'}),
  I('acido', 'Ácido Corrosivo', {classe:'alquimista', rar:'incomum', tipo:'pocao', forma:['#'], arte:'gota', tags:['frasco', 'veneno'], cd:4, ao:{envenenar:1, corroer:4}, texto:'A cada 4 s: envenena 1 e corrói 4 de bloqueio do inimigo.'}),
  I('caldeira', 'Caldeira Borbulhante', {classe:'alquimista', rar:'rara', tipo:'magia', forma:['##', '##'], arte:'xicara', tags:['frasco'], cd:5, ao:{dano:4, queimar:2, gelo:1}, texto:'A cada 5 s: 4 de dano, queima 2 e 1 de gelo.'}),
  I('pedraFilosofal', 'Pedra Filosofal', {classe:'alquimista', rar:'epica', forma:['#'], arte:'cristal', uso:'passivo', inicio:{vida:6}, viz:{modo:'da', alvo:{tag:'frasco'}, bonus:{aoMais:{dano:3, queimar:1, envenenar:1, gelo:1}}}, texto:'+6 de vida. Frascos vizinhos ficam mais fortes.'}),
  I('elixirDragao', 'Elixir do Dragão', {classe:'alquimista', rar:'lendaria', tipo:'pocao', forma:['#', '#'], arte:'frasco', tags:['frasco', 'fogo'], uso:'gatilho', quando:'vidaBaixa', ao:{cura:16, forca:2, queimar:4}, texto:'Uma vez: com a vida abaixo da metade, cura 16, ganha 2 de força e queima o inimigo em 4.'}),
  I('funil', 'Funil de Cobre', {classe:'alquimista', nivel:2, forma:['#'], arte:'xicara', tags:['metal'], uso:'passivo', viz:{modo:'da', alvo:{tag:'frasco'}, bonus:{cd:.1}}, texto:'Encostado no Kit, fabrica mais um frasco nas rodadas pares. Frascos vizinhos agem 10% mais rápido.'}),
  I('saisVolateis', 'Sais Voláteis', {classe:'alquimista', nivel:3, rar:'incomum', forma:['#'], arte:'pedra', tags:['frasco'], uso:'passivo', viz:{modo:'da', alvo:{tag:'frasco'}, bonus:{cd:.25}}, texto:'Frascos vizinhos agem 25% mais rápido.'}),
  I('catalisador', 'Catalisador', {classe:'alquimista', nivel:4, rar:'rara', forma:['#'], arte:'brilho', uso:'passivo', viz:{modo:'da', alvo:{tag:'frasco'}, bonus:{aoMais:{dano:2, queimar:1, corroer:2}}}, texto:'Frascos vizinhos: +2 de dano, +1 de queimadura e +2 de corrosão.'}),
  I('bombaGelo', 'Bomba de Gelo', {classe:'alquimista', nivel:5, rar:'incomum', tipo:'pocao', forma:['#'], arte:'gelo', tags:['frasco', 'gelo'], uso:'gatilho', quando:'tempo', t:4, ao:{gelo:5, dano:7}, texto:'Uma vez: depois de 4 s, 7 de dano e 5 de gelo.'}),
  I('nevoaToxica', 'Névoa Tóxica', {classe:'alquimista', nivel:5, rar:'incomum', tipo:'pocao', forma:['#'], arte:'nevoa', tags:['frasco', 'veneno'], cd:3.5, ao:{envenenar:2}, texto:'Envenena 2 a cada 3,5 s.'}),
  I('canhaoAlquimico', 'Canhão Alquímico', {classe:'alquimista', nivel:6, rar:'epica', tipo:'arma', forma:['##', '#.'], arte:'bomba', tags:['metal', 'fogo'], cd:2.5, custo:2, dano:[8, 12], acerto:{queimar:2, corroer:2}, texto:'Cada acerto queima 2 e corrói 2 de bloqueio.'}),
  I('homunculo', 'Homúnculo', {classe:'alquimista', nivel:7, rar:'epica', forma:['#', '#'], arte:'olho', cd:3, ao:{dano:4, cura:3}, texto:'A cada 3 s: 4 de dano e cura 3.'}),
  I('mascaraGas', 'Máscara de Gás', {classe:'alquimista', nivel:7, rar:'rara', tipo:'escudo', forma:['##'], arte:'nevoa', uso:'passivo', inicio:{bloqueio:9, regen:1}, texto:'Começa com 9 de bloqueio e 1 de regeneração.'}),
  I('atanor', 'Atanor', {classe:'alquimista', nivel:9, rar:'lendaria', forma:['##', '##'], arte:'chama', tags:['fogo'], uso:'passivo', oficio:'alquimia', inicio:{bloqueio:6}, viz:{modo:'da', alvo:{tag:'frasco'}, bonus:{aoMais:{dano:2}}}, texto:'Fabrica frascos como o Kit, e a mochila comporta até 5. Começa com 6 de bloqueio.'}),
  // os frascos instáveis só nascem do Kit (não aparecem na loja e não valem ouro)
  I('frascoFogo', 'Frasco Instável de Fogo', {classe:'alquimista', gerado:true, tipo:'pocao', forma:['#'], arte:'chama', tags:['frasco', 'fogo'], uso:'gatilho', quando:'tempo', t:2.5, ao:{dano:6, queimar:2}, texto:'Explode depois de 2,5 s: 6 de dano e queima 2.'}),
  I('frascoGelo', 'Frasco Instável de Gelo', {classe:'alquimista', gerado:true, tipo:'pocao', forma:['#'], arte:'gelo', tags:['frasco', 'gelo'], uso:'gatilho', quando:'tempo', t:2, ao:{gelo:4, dano:3}, texto:'Explode depois de 2 s: 3 de dano e 4 de gelo.'}),
  I('frascoAcido', 'Frasco Instável de Ácido', {classe:'alquimista', gerado:true, tipo:'pocao', forma:['#'], arte:'gota', tags:['frasco', 'veneno'], uso:'gatilho', quando:'tempo', t:3, ao:{corroer:8, envenenar:2}, texto:'Explode depois de 3 s: corrói 8 de bloqueio e envenena 2.'}),

  // ---- Coureiro: costura (bolsa costurada: +20% nos itens dentro dela por nível, até 3) ----
  I('ferramentasCouro', 'Ferramentas de Couro', {classe:'coureiro', forma:['##'], arte:'ferramenta', inicial:true, preco:0, uso:'passivo', oficio:'costura', texto:'A cada rodada, costura as bolsas em que encosta (até 3 vezes cada): os itens dentro delas ficam 20% mais fortes por costura.'}),
  I('agulhao', 'Agulhão', {classe:'coureiro', tipo:'arma', forma:['#', '#'], arte:'espada', tags:['metal'], cd:1.4, custo:1, dano:[2, 4], acerto:{perfura:1}, texto:'Rápido. Atravessa 1 de bloqueio.'}),
  I('bolsaCintura', 'Bolsa de Cintura', {classe:'coureiro', rar:'incomum', tipo:'bolsa', forma:['##'], arte:'etiqueta', preco:2, dentro:{alvo:{}, bonus:{cd:.1}}, texto:'Abre 2 casas. O que estiver dentro age 10% mais rápido.'}),
  I('gibao', 'Gibão de Couro', {classe:'coureiro', rar:'rara', tipo:'escudo', forma:['##', '##'], arte:'escudo', uso:'passivo', inicio:{bloqueio:8, vida:8}, texto:'Começa com 8 de bloqueio e +8 de vida.'}),
  I('mochilaExpedicao', 'Mochila de Expedição', {classe:'coureiro', rar:'epica', tipo:'bolsa', forma:['###', '###', '###'], arte:'etiqueta', preco:9, dentro:{alvo:{}, bonus:{cd:.05}}, texto:'Abre 9 casas. O que estiver dentro age 5% mais rápido.'}),
  I('alforje', 'Alforje do Mestre', {classe:'coureiro', rar:'lendaria', tipo:'bolsa', forma:['##', '##', '##'], arte:'etiqueta', preco:12, dentro:{alvo:{}, bonus:{dano:1, cura:1, bloqueio:1}}, texto:'Abre 6 casas. Dentro dele: +1 de dano, de cura e de bloqueio.'}),
  I('dedal', 'Dedal', {classe:'coureiro', nivel:2, forma:['#'], arte:'medalha', tags:['metal'], uso:'passivo', inicio:{bloqueio:2}, texto:'Encostado nas Ferramentas, costura mais uma vez nas rodadas pares. Começa com 2 de bloqueio.'}),
  I('chicote', 'Chicote', {classe:'coureiro', nivel:3, rar:'incomum', tipo:'arma', forma:['#', '#', '#'], arte:'vento', cd:1.8, custo:1, dano:[3, 5], acerto:{atordoar:.2}, texto:'Cada acerto atordoa o inimigo por 0,2 s.'}),
  I('botas', 'Botas de Couro', {classe:'coureiro', nivel:4, rar:'rara', tipo:'escudo', forma:['##'], arte:'escudo', uso:'passivo', inicio:{esquiva:2, vida:10}, texto:'+10 de vida e começa com 2 de esquiva.'}),
  I('cinto', 'Cinto de Fivelas', {classe:'coureiro', nivel:5, rar:'incomum', forma:['##'], arte:'medalha', uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{cd:.15}}, texto:'Armas vizinhas atacam 15% mais rápido.'}),
  I('luvasCouro', 'Luvas de Couro Grosso', {classe:'coureiro', nivel:5, rar:'incomum', tipo:'escudo', forma:['#'], arte:'mao', uso:'passivo', inicio:{bloqueio:7}, viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{acerto:{bloqueio:1}}}, texto:'Começa com 7 de bloqueio. Armas vizinhas dão 1 de bloqueio por acerto.'}),
  I('broquel', 'Broquel de Couro Fervido', {classe:'coureiro', nivel:6, rar:'epica', tipo:'escudo', forma:['##', '##'], arte:'escudo', cd:3, ao:{bloqueio:10}, texto:'Ganha 10 de bloqueio a cada 3 s.'}),
  I('capaViajante', 'Capa de Viajante', {classe:'coureiro', nivel:7, rar:'epica', tipo:'escudo', forma:['##', '##'], arte:'vento', cd:4, ao:{esquiva:1, regen:1}, texto:'A cada 4 s: 1 de esquiva e 1 de regeneração.'}),
  I('mesaCoureiro', 'Mesa do Mestre Coureiro', {classe:'coureiro', nivel:9, rar:'lendaria', forma:['##', '##'], arte:'ferramenta', uso:'passivo', oficio:'costura', inicio:{vida:10}, texto:'Costura como as Ferramentas, e a costura de toda a mochila vai até 5. +10 de vida.'}),

  // ---- Joalheiro: lapidação (cada nível soma de novo o bônus original da gema, até 3) ----
  I('lupa', 'Lupa e Pinças', {classe:'joalheiro', forma:['#'], arte:'olho', inicial:true, preco:0, uso:'passivo', oficio:'lapida', viz:{modo:'da', alvo:{tag:'gema'}, bonus:{}}, texto:'A cada rodada, lapida a gema encostada menos lapidada (até 3 vezes cada): cada lapidação dobra o bônus original dela.'}),
  I('martelinho', 'Martelinho de Joalheiro', {classe:'joalheiro', tipo:'arma', forma:['#', '#'], arte:'martelo', tags:['metal'], cd:1.6, custo:1, dano:[2, 4], viz:{modo:'recebe', alvo:{tag:'gema'}, bonus:{dano:1}}, texto:'+1 de dano para cada gema vizinha.'}),
  I('quartzo', 'Quartzo', {classe:'joalheiro', forma:['#'], arte:'cristal', tags:['gema'], uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{dano:2}}, texto:'Armas vizinhas: +2 de dano.'}),
  I('rubi', 'Rubi', {classe:'joalheiro', rar:'incomum', forma:['#'], arte:'coracao', tags:['gema', 'fogo'], uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{acerto:{queimar:1}}}, texto:'Armas vizinhas queimam 1 ao acertar.'}),
  I('safira', 'Safira', {classe:'joalheiro', rar:'rara', forma:['#'], arte:'gelo', tags:['gema', 'gelo'], uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{acerto:{gelo:1}, dano:1}}, texto:'Armas vizinhas: +1 de dano e 1 de gelo ao acertar.'}),
  I('esmeralda', 'Esmeralda', {classe:'joalheiro', rar:'epica', forma:['#'], arte:'cristal', tags:['gema', 'veneno'], uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{acerto:{envenenar:1}, crit:.1}}, texto:'Armas vizinhas envenenam 1 ao acertar e ganham 10% de crítico.'}),
  I('diamante', 'Diamante', {classe:'joalheiro', rar:'lendaria', forma:['#'], arte:'brilho', tags:['gema'], uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{dano:2, crit:.15}}, texto:'Armas vizinhas: +2 de dano e 15% de crítico.'}),
  I('pincas', 'Pinças Finas', {classe:'joalheiro', nivel:2, forma:['#'], arte:'ferramenta', tags:['metal'], uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{crit:.05}}, texto:'Encostadas na Lupa, lapidam mais uma vez nas rodadas pares. Armas vizinhas +5% de crítico.'}),
  I('ametista', 'Ametista', {classe:'joalheiro', nivel:3, rar:'incomum', forma:['#'], arte:'cristal', tags:['gema'], uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{cd:.15}}, texto:'Armas vizinhas atacam 15% mais rápido.'}),
  I('colarOuro', 'Colar de Ouro', {classe:'joalheiro', nivel:4, rar:'rara', forma:['##'], arte:'medalha', uso:'passivo', inicio:{vida:12, bloqueio:6}, texto:'+12 de vida e começa com 6 de bloqueio.'}),
  I('topazio', 'Topázio', {classe:'joalheiro', nivel:5, rar:'incomum', forma:['#'], arte:'sol', tags:['gema'], uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{acerto:{bloqueio:2}}}, texto:'Armas vizinhas dão 2 de bloqueio a cada acerto.'}),
  I('onix', 'Ônix', {classe:'joalheiro', nivel:5, rar:'incomum', forma:['#'], arte:'lua', tags:['gema'], uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{acerto:{perfura:3}, dano:1}}, texto:'Armas vizinhas: +1 de dano e atravessam 3 de bloqueio.'}),
  I('adagaCravejada', 'Adaga Cravejada', {classe:'joalheiro', nivel:6, rar:'epica', tipo:'arma', forma:['#', '#'], arte:'espada', tags:['metal'], cd:1.5, custo:1, dano:[4, 6], crit:.15, viz:{modo:'recebe', alvo:{tag:'gema'}, bonus:{dano:1}}, texto:'Rápida. 15% de crítico. +1 de dano para cada gema vizinha.'}),
  I('cetro', 'Cetro de Joias', {classe:'joalheiro', nivel:7, rar:'epica', tipo:'arma', forma:['#', '#', '#'], arte:'raio', cd:2.2, custo:2, dano:[7, 11], viz:{modo:'recebe', alvo:{tag:'gema'}, bonus:{dano:1}}, texto:'+1 de dano para cada gema vizinha.'}),
  I('coroaJoias', 'Coroa de Joias', {classe:'joalheiro', nivel:9, rar:'lendaria', forma:['##'], arte:'coroa', uso:'passivo', oficio:'lapida', inicio:{vida:8}, viz:{modo:'da', alvo:{tag:'gema'}, bonus:{}}, texto:'Lapida como a Lupa, e a lapidação de toda a mochila vai até 5. +8 de vida.'}),

  // ---- fusões (não aparecem na loja: nascem de duas peças encostadas) ----
  I('laminaFogo', 'Lâmina Flamejante', {rar:'epica', tipo:'arma', forma:['#', '#'], arte:'chama', tags:['metal', 'fogo'], fusao:true, cd:1.6, custo:1, dano:[4, 6], acerto:{queimar:1}, texto:'Cada acerto queima 1.'}),
  I('escudoReforcado', 'Escudo Reforçado', {rar:'rara', tipo:'escudo', forma:['##', '##'], arte:'escudo', tags:['metal'], fusao:true, cd:3, ao:{bloqueio:9}, texto:'Ganha 9 de bloqueio a cada 3 s.'}),
  I('torta', 'Torta de Maçã', {rar:'incomum', tipo:'comida', forma:['#'], arte:'comida', fusao:true, cd:4, ao:{cura:6}, texto:'Cura 6 a cada 4 s.'}),
  I('adagaVeneno', 'Adaga Envenenada', {classe:'ladino', rar:'rara', tipo:'arma', forma:['#', '#'], arte:'gota', tags:['metal', 'veneno'], fusao:true, cd:1.1, custo:1, dano:[2, 4], crit:.2, acerto:{envenenar:1}, texto:'Rápida, envenena 1 a cada acerto. 20% de crítico.'}),
  I('varinhaArcana', 'Varinha Arcana', {classe:'mago', rar:'epica', tipo:'arma', forma:['#', '#'], arte:'brilho', tags:['magia'], fusao:true, cd:1.4, custo:1, dano:[3, 5], acerto:{mana:1}, texto:'Rápida. Cada acerto dá 1 de mana.'}),
  I('machadoClamor', 'Machado do Clamor', {classe:'guerreiro', rar:'epica', tipo:'arma', forma:['##', '##', '#.'], arte:'machado', tags:['metal'], fusao:true, cd:2.2, custo:2, dano:[8, 12], acerto:{forca:1, bloqueio:2}, texto:'Cada acerto dá 1 de força e 2 de bloqueio.'}),
  I('muralha', 'Muralha', {classe:'guerreiro', rar:'lendaria', tipo:'escudo', forma:['##', '##', '##'], arte:'escudo', tags:['metal'], fusao:true, cd:4, ao:{bloqueio:13, forca:1}, viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{dano:1}}, texto:'Ganha 13 de bloqueio e 1 de força a cada 4 s. Armas vizinhas +1 de dano.'}),
  I('prismaGelado', 'Prisma Gelado', {classe:'mago', rar:'rara', tipo:'magia', forma:['#'], arte:'gelo', tags:['magia', 'gelo'], fusao:true, cd:4, ao:{gelo:2, dano:3, mana:1}, texto:'A cada 4 s: 3 de dano, 2 de gelo e 1 de mana.'}),
  I('cajadoInfernal', 'Cajado Infernal', {classe:'mago', rar:'epica', tipo:'magia', forma:['#', '#', '#'], arte:'chama', tags:['magia', 'fogo'], fusao:true, cd:2.2, gastaMana:2, ao:{dano:10, queimar:3}, semMana:{dano:4, queimar:1}, texto:'Gasta 2 de mana: 10 de dano e queima 3. Sem mana: 4 de dano e queima 1.'}),
  I('zarabatanaPeconha', 'Zarabatana da Peçonha', {classe:'ladino', rar:'rara', tipo:'arma', forma:['#', '#'], arte:'vento', tags:['veneno'], fusao:true, cd:1.8, custo:1, dano:[1, 3], acerto:{envenenar:3}, texto:'Cada acerto envenena 3.'}),
  I('veuNoite', 'Véu da Noite', {classe:'ladino', rar:'epica', tipo:'escudo', forma:['##', '##'], arte:'nevoa', fusao:true, cd:4, ao:{esquiva:1, bloqueio:3}, texto:'Ganha 1 de esquiva e 3 de bloqueio a cada 4 s.'}),
  I('marteloRunico', 'Martelo Rúnico', {classe:'ferreiro', rar:'epica', tipo:'arma', forma:['#', '#'], arte:'martelo', tags:['metal'], fusao:true, cd:1.8, custo:1, dano:[5, 8], acerto:{bloqueio:2}, texto:'Cada acerto dá 2 de bloqueio.'}),
  I('armaduraErica', 'Armadura Eriçada', {classe:'ferreiro', rar:'lendaria', tipo:'escudo', forma:['##', '##', '##'], arte:'escudo', tags:['metal'], fusao:true, uso:'passivo', inicio:{bloqueio:20, espinhos:3, vida:6}, texto:'Começa com 20 de bloqueio, 3 de espinhos e +6 de vida.'}),
  I('elixirVerde', 'Elixir Verde', {classe:'herbalista', rar:'rara', tipo:'pocao', forma:['#'], arte:'frasco', tags:['erva'], fusao:true, uso:'gatilho', quando:'vidaBaixa', ao:{cura:22, regen:2}, texto:'Uma vez: quando a vida cai abaixo da metade, cura 22 e soma 2 de regeneração.'}),
  I('extratoMortal', 'Extrato Mortal', {classe:'herbalista', rar:'epica', tipo:'pocao', forma:['#'], arte:'gota', tags:['erva', 'veneno'], fusao:true, cd:3, ao:{envenenar:3, multVeneno:.15}, texto:'A cada 3 s, envenena 3 e o veneno do inimigo cresce 15%.'}),
  I('sanduiche', 'Sanduíche', {classe:'cozinheiro', rar:'rara', tipo:'comida', forma:['##'], arte:'comida', fusao:true, cd:4, ao:{cura:5, vigor:1}, texto:'A cada 4 s: cura 5 e 1 de vigor.'}),
  I('ensopadoVovo', 'Ensopado da Vovó', {classe:'cozinheiro', rar:'epica', tipo:'comida', forma:['##', '##'], arte:'xicara', fusao:true, cd:3, ao:{cura:6, regen:1}, texto:'A cada 3 s: cura 6 e soma 1 de regeneração.'}),
  I('barrilPolvora', 'Barril de Pólvora', {classe:'alquimista', rar:'epica', tipo:'pocao', forma:['#'], arte:'bomba', tags:['frasco', 'fogo'], fusao:true, uso:'gatilho', quando:'tempo', t:5, ao:{dano:20, queimar:3}, texto:'Uma vez: depois de 5 s, 20 de dano e queima 3.'}),
  I('acidoReal', 'Ácido Real', {classe:'alquimista', rar:'epica', tipo:'pocao', forma:['#'], arte:'gota', tags:['frasco', 'veneno'], fusao:true, cd:3.5, ao:{envenenar:2, corroer:5}, texto:'A cada 3,5 s: envenena 2 e corrói 5 de bloqueio.'}),
  I('sovela', 'Sovela', {classe:'coureiro', rar:'epica', tipo:'arma', forma:['#', '#'], arte:'espada', tags:['metal'], fusao:true, cd:1.3, custo:1, dano:[4, 6], acerto:{perfura:3}, texto:'Muito rápida. Atravessa 3 de bloqueio.'}),
  I('couracaReforcada', 'Couraça Reforçada', {classe:'coureiro', rar:'lendaria', tipo:'escudo', forma:['##', '##'], arte:'escudo', fusao:true, uso:'passivo', inicio:{bloqueio:16, vida:10, espinhos:1}, texto:'Começa com 16 de bloqueio, +10 de vida e 1 de espinhos.'}),
  I('espadaJoias', 'Espada de Joias', {classe:'joalheiro', rar:'epica', tipo:'arma', forma:['#', '#'], arte:'espada', tags:['metal'], fusao:true, cd:1.6, custo:1, dano:[4, 7], crit:.15, acerto:{queimar:1}, texto:'15% de crítico. Cada acerto queima 1.'}),
  I('pedraPrisma', 'Pedra Prisma', {classe:'joalheiro', rar:'lendaria', forma:['#'], arte:'brilho', tags:['gema', 'fogo', 'gelo'], fusao:true, uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{dano:1, acerto:{queimar:1, gelo:1}}}, texto:'Armas vizinhas: +1 de dano, queimam 1 e dão 1 de gelo ao acertar.'}),
  I('macaCravejada', 'Maça Cravejada', {rar:'rara', tipo:'arma', forma:['#', '#'], arte:'martelo', tags:['metal'], fusao:true, cd:2, custo:2, dano:[5, 8], acerto:{perfura:2}, texto:'Atravessa 2 de bloqueio.'}),
];
const ITEM = {}; for(const it of ITENS){ if(it.classe && !it.nivel) it.nivel = 1; it.preco = it.preco != null ? it.preco : RARIDADES[it.rar].preco; it.uso = it.uso || (it.tipo === 'bolsa' ? 'bolsa' : it.tipo === 'arma' ? 'arma' : 'ativo'); ITEM[it.id] = it; }
// receitas: as duas peças encostadas viram o resultado no começo da próxima luta
const RECEITAS = [
  ['espadaCurta', 'pedraFogo', 'laminaFogo'], ['escudoMadeira', 'escudoMadeira', 'escudoReforcado'], ['maca', 'maca', 'torta'],
  ['adaga', 'frascoVeneno', 'adagaVeneno'], ['varinha', 'cristalMana', 'varinhaArcana'], ['clava', 'amolar', 'macaCravejada'],
  // as da classe com nível: só fundem quando o personagem já chegou nele
  ['machadoFuria', 'trombeta', 'machadoClamor', 6], ['escudoTorre', 'estandarte', 'muralha', 8],
  ['orbeGelo', 'cristalMana', 'prismaGelado', 6], ['cajadoFogo', 'faisca', 'cajadoInfernal', 8],
  ['zarabatana', 'frascoVeneno', 'zarabatanaPeconha', 6], ['capaSombras', 'fumaca', 'veuNoite', 8],
  ['marteloForja', 'lingote', 'marteloRunico', 6], ['armaduraPlacas', 'rebites', 'armaduraErica', 8],
  ['salvia', 'pocaoCura', 'elixirVerde', 6], ['raizAmarga', 'frascoVeneno', 'extratoMortal', 8],
  ['queijo', 'pao', 'sanduiche', 6], ['ensopado', 'temperos', 'ensopadoVovo', 8],
  ['polvora', 'bomba', 'barrilPolvora', 6], ['acido', 'frascoVeneno', 'acidoReal', 8],
  ['agulhao', 'amolar', 'sovela', 6], ['gibao', 'escudoMadeira', 'couracaReforcada', 8],
  ['quartzo', 'espadaCurta', 'espadaJoias', 6], ['rubi', 'safira', 'pedraPrisma', 8],
];
const VERSAO_REGRAS = 6;   // sobe quando itens ou regras mudam: mochilas de versões antigas não são sorteadas
