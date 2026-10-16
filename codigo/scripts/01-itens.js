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
// nivel: itens da classe só aparecem na loja a partir desse nível do personagem (PROGRESSAO.md); caminho: só na especialização escolhida.
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
  guerreiro:{nome:'Guerreiro', vida:57, cor:'#d9483b', inicial:'insignia', desc:'Força e bloqueio. Aguenta a pancada e devolve mais forte.',
    caminhos:{berserker:{nome:'Berserker', desc:'Quanto mais apanha, mais forte bate.'}, escudeiro:{nome:'Escudeiro', desc:'Uma muralha de bloqueio que devolve o dano.'}}},
  mago:     {nome:'Mago', vida:58, cor:'#3d8fb5', inicial:'grimorio', desc:'Junta mana e solta magias fortes de fogo e gelo.',
    caminhos:{piromante:{nome:'Piromante', desc:'Fogo que não apaga e meteoros.'}, criomante:{nome:'Criomante', desc:'Congela o inimigo e quebra o gelo com força.'}}},
  ladino:   {nome:'Ladino', vida:47, cor:'#5aa84a', inicial:'kitVeneno', desc:'Golpes rápidos, veneno e esquiva. Vence pelo cansaço.',
    caminhos:{assassino:{nome:'Assassino', desc:'Críticos certeiros logo no começo da luta.'}, envenenador:{nome:'Envenenador', desc:'Veneno que cresce sem parar.'}}},
};
// experiência total para chegar a cada nível (o índice 0 é o nível 1); depois do 10, cada estrela de prestígio custa mais XP_ESTRELA
const NIVEIS_XP = [0, 40, 120, 250, 450, 750, 1150, 1700, 2400, 3300], XP_ESTRELA = 3300, NIVEL_CAMINHO = 5;
function nivelDe(xp){
  xp = Math.max(0, xp || 0); let n = 1; while(n < NIVEIS_XP.length && xp >= NIVEIS_XP[n]) n++;
  const estrelas = xp >= NIVEIS_XP[9] ? Math.floor((xp - NIVEIS_XP[9]) / XP_ESTRELA) : 0;
  const de = n < 10 ? NIVEIS_XP[n - 1] : NIVEIS_XP[9] + estrelas * XP_ESTRELA, ate = n < 10 ? NIVEIS_XP[n] : de + XP_ESTRELA;
  return {nivel:n, estrelas, xp, de, ate, fracao:(xp - de) / (ate - de)};
}

const I = (id, nome, o) => Object.assign({id, nome, rar:'comum', tipo:'acessorio', tags:[], classe:null, forma:['#'], arte:'estrela'}, o);
const ITENS = [
  // ---- bolsas ----
  I('mochila', 'Mochila Velha', {tipo:'bolsa', forma:['###', '###', '###'], arte:'etiqueta', inicial:true, preco:0, texto:'A sua mochila. Não pode ser vendida.'}),
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
  I('cotaMalha', 'Cota de Malha', {classe:'guerreiro', nivel:4, rar:'rara', tipo:'escudo', forma:['##', '##'], arte:'escudo', tags:['metal'], cd:4, ao:{bloqueio:6}, viz:{modo:'recebe', alvo:{tag:'metal'}, bonus:{bloqueio:1}}, texto:'Ganha 6 de bloqueio a cada 4 s. +1 para cada item de metal vizinho.'}),
  I('machadoDuplo', 'Machado Duplo', {classe:'guerreiro', nivel:5, caminho:'berserker', rar:'epica', tipo:'arma', forma:['#.', '##', '#.'], arte:'machado', tags:['metal'], cd:2.4, custo:2, dano:[6, 9], furia:8, texto:'Até +8 de dano conforme a sua vida cai.'}),
  I('colarDentes', 'Colar de Dentes', {classe:'guerreiro', nivel:5, caminho:'berserker', rar:'incomum', forma:['#'], arte:'osso', uso:'passivo', inicio:{raiva:10}, texto:'Ganha 1 de força a cada 10 de vida perdida.'}),
  I('paves', 'Pavês', {classe:'guerreiro', nivel:5, caminho:'escudeiro', rar:'epica', tipo:'escudo', forma:['##', '##', '##'], arte:'escudo', tags:['metal'], cd:4, ao:{bloqueio:10, espinhos:1}, texto:'Ganha 10 de bloqueio e 1 de espinhos a cada 4 s.'}),
  I('brasao', 'Brasão', {classe:'guerreiro', nivel:5, caminho:'escudeiro', rar:'incomum', forma:['#'], arte:'medalha', uso:'passivo', inicio:{bloqueio:7, espinhos:1}, viz:{modo:'da', alvo:{tipo:'escudo'}, bonus:{bloqueio:3}}, texto:'Começa com 7 de bloqueio e 1 de espinhos. Escudos vizinhos dão +3 de bloqueio.'}),
  I('marteloCerco', 'Martelo de Cerco', {classe:'guerreiro', nivel:7, rar:'epica', tipo:'arma', forma:['##', '##', '.#'], arte:'martelo', tags:['metal'], cd:3.2, custo:3, dano:[10, 14], acerto:{atordoar:1}, texto:'Lento. Cada acerto atordoa o inimigo por 1 s (os itens dele param).'}),
  I('coroaCampeao', 'Coroa do Campeão', {classe:'guerreiro', nivel:9, rar:'lendaria', forma:['##'], arte:'coroa', cd:4, ao:{forca:1, bloqueio:7}, texto:'Ganha 1 de força e 7 de bloqueio a cada 4 s.'}),

  I('vela', 'Vela de Estudo', {classe:'mago', nivel:2, tipo:'magia', forma:['#'], arte:'chama', tags:['magia', 'fogo'], cd:2.5, ao:{mana:1, queimar:1}, viz:{modo:'da', alvo:{tag:'magia'}, bonus:{cd:.1}}, texto:'Ganha 1 de mana e queima 1 a cada 2,5 s. Magias vizinhas agem 10% mais rápido.'}),
  I('runaGelo', 'Runa de Gelo', {classe:'mago', nivel:3, rar:'incomum', tipo:'magia', forma:['#'], arte:'gelo', tags:['magia', 'gelo'], cd:3.5, ao:{gelo:1, dano:1}, viz:{modo:'da', alvo:{tag:'gelo'}, bonus:{aoMais:{gelo:1}}}, texto:'A cada 3,5 s: 1 de dano e 1 de gelo. Magias de gelo vizinhas aplicam +1 de gelo.'}),
  I('ampolaEter', 'Ampola de Éter', {classe:'mago', nivel:4, rar:'rara', tipo:'pocao', forma:['#'], arte:'frasco', tags:['magia'], uso:'gatilho', quando:'tempo', t:5, ao:{mana:8, bloqueio:5}, texto:'Uma vez: depois de 5 s, ganha 8 de mana e 5 de bloqueio.'}),
  I('meteorito', 'Meteorito', {classe:'mago', nivel:5, caminho:'piromante', rar:'epica', tipo:'magia', forma:['##', '##'], arte:'chama', tags:['magia', 'fogo'], cd:7, gastaMana:4, ao:{dano:14, queimar:5}, texto:'Gasta 4 de mana: 14 de dano e queima 5.'}),
  I('brasaViva', 'Brasa Viva', {classe:'mago', nivel:5, caminho:'piromante', rar:'incomum', tipo:'magia', forma:['#'], arte:'chama', tags:['magia', 'fogo'], cd:2.5, ao:{queimar:1}, viz:{modo:'da', alvo:{tag:'fogo'}, bonus:{aoMais:{queimar:1}}}, texto:'Queima 1 a cada 2,5 s. Magias de fogo vizinhas queimam +1.'}),
  I('lancaGelo', 'Lança de Gelo', {classe:'mago', nivel:5, caminho:'criomante', rar:'epica', tipo:'magia', forma:['#', '#', '#'], arte:'gelo', tags:['magia', 'gelo'], cd:2.8, gastaMana:2, ao:{dano:6, gelo:1, danoPorGelo:1}, semMana:{dano:2, gelo:1}, texto:'Gasta 2 de mana: 6 de dano, +1 para cada gelo do inimigo, e 1 de gelo. Sem mana: 2 de dano e 1 de gelo.'}),
  I('coroaGeada', 'Coroa de Geada', {classe:'mago', nivel:5, caminho:'criomante', rar:'incomum', forma:['##'], arte:'gelo', tags:['magia', 'gelo'], uso:'gatilho', quando:'tempo', t:.1, ao:{gelo:3}, texto:'No começo da luta, põe 3 de gelo no inimigo.'}),
  I('espelhoArcano', 'Espelho Arcano', {classe:'mago', nivel:7, rar:'rara', tipo:'escudo', forma:['#', '#'], arte:'cristal', tags:['magia'], cd:4, ao:{bloqueio:7, mana:2, dano:3}, texto:'A cada 4 s: 7 de bloqueio, 2 de mana e 3 de dano no inimigo.'}),
  I('tomoProibido', 'Tomo Proibido', {classe:'mago', nivel:9, rar:'lendaria', tipo:'magia', forma:['##', '##'], arte:'livro', tags:['magia'], cd:3, ao:{mana:3}, viz:{modo:'da', alvo:{tag:'magia'}, bonus:{cd:.25}}, texto:'Ganha 3 de mana a cada 3 s. Magias vizinhas agem 25% mais rápido.'}),

  I('gazua', 'Gazua', {classe:'ladino', nivel:2, forma:['#'], arte:'espada', tags:['metal'], uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{crit:.12, dano:1}}, texto:'Armas vizinhas ganham 12% de crítico e +1 de dano.'}),
  I('facas', 'Facas de Arremesso', {classe:'ladino', nivel:3, rar:'incomum', tipo:'arma', forma:['#', '#'], arte:'espada', tags:['metal'], cd:1.5, custo:1, dano:[3, 4], crit:.1, acerto:{perfura:3}, texto:'Rápidas. Atravessam 3 de bloqueio. 10% de crítico.'}),
  I('mascara', 'Máscara de Ladrão', {classe:'ladino', nivel:4, rar:'rara', tipo:'escudo', forma:['##'], arte:'nevoa', uso:'passivo', inicio:{esquiva:2}, viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{crit:.1}}, texto:'Começa com 2 de esquiva. Armas vizinhas ganham 10% de crítico.'}),
  I('laminaOculta', 'Lâmina Oculta', {classe:'ladino', nivel:5, caminho:'assassino', rar:'epica', tipo:'arma', forma:['#', '#'], arte:'espada', tags:['metal'], cd:1.6, custo:1, dano:[6, 8], crit:.2, primeirosCrit:3, texto:'Os 3 primeiros golpes são críticos. Depois, 20% de crítico.'}),
  I('luvas', 'Luvas Leves', {classe:'ladino', nivel:5, caminho:'assassino', rar:'incomum', forma:['#'], arte:'vento', uso:'passivo', viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{cd:.18, crit:.08}}, texto:'Armas vizinhas atacam 18% mais rápido e ganham 8% de crítico.'}),
  I('alambique', 'Alambique', {classe:'ladino', nivel:5, caminho:'envenenador', rar:'epica', tipo:'pocao', forma:['##', '##'], arte:'frasco', tags:['veneno'], cd:5, ao:{envenenar:4, multVeneno:.6}, texto:'A cada 5 s, envenena 4 e o veneno do inimigo cresce 60%.'}),
  I('cogumelo', 'Cogumelo Tóxico', {classe:'ladino', nivel:5, caminho:'envenenador', rar:'incomum', tipo:'pocao', forma:['#'], arte:'gota', tags:['veneno'], preco:3, cd:2, ao:{envenenar:1}, viz:{modo:'da', alvo:{tag:'veneno'}, bonus:{cd:.15}}, texto:'Envenena 1 a cada 2 s. Itens de veneno vizinhos agem 15% mais rápido.'}),
  I('bolsaTruques', 'Bolsa de Truques', {classe:'ladino', nivel:7, rar:'rara', forma:['##'], arte:'bomba', cd:5, ao:{}, aleatorio:[{esquiva:2}, {envenenar:4}, {forca:1, vigor:2}], texto:'A cada 5 s, um truque: 2 de esquiva, envenenar 4, ou 1 de força e 2 de vigor.'}),
  I('sorrisoHiena', 'Sorriso da Hiena', {classe:'ladino', nivel:9, rar:'lendaria', forma:['#', '#'], arte:'serpente', uso:'passivo', aoCritico:{envenenar:2, esquiva:1}, viz:{modo:'da', alvo:{tipo:'arma'}, bonus:{crit:.1}}, texto:'Cada crítico seu envenena 2 e dá 1 de esquiva. Armas vizinhas +10% de crítico.'}),

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
];
const VERSAO_REGRAS = 2;   // sobe quando itens ou regras mudam: mochilas de versões antigas não são sorteadas
