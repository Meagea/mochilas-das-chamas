// Gera ARTE-ITENS.md: um prompt por item do jogo, no estilo da coruja (retrato-mago.png).
// Uso: node codigo/arte/gerar-prompts-itens.js   (depois de node codigo/build.js)
const fs = require('fs'), path = require('path');
const t = require('../testes/carregar')('ITENS, CLASSES');
const DESC = {
  mochila:'an old worn leather backpack with brass buckles, slightly open', bolsaCouro:'a small square leather pouch with a brass clasp', bolsaLonga:'a long narrow canvas bag rolled with leather straps',
  bolsaErvas:'a leather herb pouch overflowing with green herbs and little flowers', bolsaArmas:'a wide leather weapon sheath holding several hilts',
  graveto:'a crooked wooden stick with a few leaves', espadaCurta:'a short steel sword with a leather-wrapped grip', clava:'a heavy wooden club with iron studs',
  machadinha:'a small hand axe with a curved steel blade', lanca:'a long spear with a leaf-shaped steel tip and red ribbon', arcoCurto:'a short wooden bow with a quiver of three arrows',
  espadaLonga:'a long knightly sword with a brass crossguard', martelo:'a big two-handed war hammer with a steel head', escudoMadeira:'a round wooden shield with iron rim',
  escudoFerro:'a sturdy iron heater shield with rivets', elmo:'a dented iron helmet', couraca:'a leather cuirass chest armor with buckles', manto:'a light flowing grey travel cloak',
  maca:'a shiny red apple', pao:'a crusty loaf of bread', queijo:'a wedge of holey yellow cheese', ensopado:'a steaming wooden bowl of stew with a spoon',
  pocaoCura:'a round glass potion bottle with glowing red liquid and a cork', pocaoVigor:'a tall glass potion bottle with glowing yellow liquid', frascoVeneno:'a small glass vial with bubbling green poison and a skull label',
  bomba:'a round black bomb with a lit sparking fuse', amolar:'a grey whetstone sharpening stone', pedraFogo:'a glowing ember stone with small flames', trevo:'a lucky four-leaf clover with a golden shine',
  gemaVida:'a heart-shaped red gem glowing softly', ampulheta:'a brass hourglass with glowing golden sand', ferradura:'a lucky iron horseshoe', coracaoPedra:'a big stone heart with glowing cracks',
  insignia:'a bronze warrior medal with a red ribbon', trombeta:'a brass war horn decorated with red cloth', escudoTorre:'a tall rectangular tower shield with a painted yellow star',
  espinheira:'a leather armor covered with sharp iron spikes', machadoFuria:'a huge double-bladed battle axe with red runes', estandarte:'a torn red war banner on a wooden pole',
  grimorio:'an old worn spellbook bound with chains and a brass star clasp', faisca:'a small crackling orange spark of magic fire', varinha:'a slender wooden magic wand with a glowing tip',
  cristalMana:'a floating blue mana crystal', orbeGelo:'a frosty glowing ice orb', cajadoFogo:'a gnarled wooden staff with a burning orange crystal on top', bolaFogo:'a rolled magic scroll with a fireball bursting out of it',
  olhoArcano:'a mystical floating eye made of purple arcane energy and brass rings', kitVeneno:'a small leather kit with poison vials and a coiled snake emblem', adaga:'a curved steel dagger',
  zarabatana:'a bamboo blowgun with green-tipped darts', capaSombras:'a dark hooded shadow cloak with wisps of smoke', fumaca:'a round smoke bomb releasing grey smoke',
  adagasGemeas:'two crossed curved daggers with emerald gems', presaSerpente:'a large curved serpent fang dripping green venom', laminaFogo:'a short sword with a burning flaming blade',
  escudoReforcado:'a round wooden shield reinforced with thick iron plates', torta:'a golden apple pie', adagaVeneno:'a dagger with a blade dripping green poison',
  varinhaArcana:'an ornate magic wand with a glowing purple crystal and brass spirals', macaCravejada:'a spiked iron mace',
  // liberados por nível (PROGRESSAO.md)
  cantil:'a dented leather-wrapped metal canteen with a brass cap and a strap', manopla:'a heavy riveted iron gauntlet', gritoGuerra:'a carved bone war horn with red cloth, sound waves of golden light bursting out',
  cotaMalha:'a chainmail shirt of interlocking steel rings', machadoDuplo:'a brutal double-headed axe with notched blades and bone grip', colarDentes:'a tribal necklace of big beast fangs on a leather cord',
  paves:'a huge tall rectangular pavise shield with iron spikes on the rim', brasao:'a small heraldic crest badge with a gold lion on red enamel', marteloCerco:'a massive siege maul with a huge iron head and chains',
  coroaCampeao:'a golden champion crown with red gems and a laurel wreath', vela:'a melting candle in a brass holder with a small magic flame and runes floating', runaGelo:'a flat stone rune tablet carved with a glowing icy blue rune',
  ampolaEter:'a delicate glass ampoule with swirling violet ether and silver stopper', meteorito:'a blazing meteor rock with molten cracks and a fiery tail', brasaViva:'a glowing living ember coal with tiny flames and a little smiling spirit face',
  lancaGelo:'a long spear made of solid sharp ice crystal with frost mist', coroaGeada:'a crown made of icicles and frost crystals glowing pale blue', espelhoArcano:'an oval hand mirror with brass frame and a glowing purple arcane surface',
  tomoProibido:'a forbidden dark tome with an eye on the cover, chains and glowing green runes', gazua:'a ring of thin lockpicks and a small key', facas:'three throwing knives fanned out with leather-wrapped handles',
  mascara:'a dark leather thief mask covering the eyes', laminaOculta:'a hidden wrist blade sliding out of a leather bracer', luvas:'a pair of thin supple dark leather gloves',
  alambique:'a small copper alchemy still with bubbling green poison and glass tubes', cogumelo:'a toxic purple-spotted mushroom glowing faintly green', bolsaTruques:'a small trickster pouch spilling marbles, smoke and playing cards',
  sorrisoHiena:'a grinning hyena skull amulet with emerald eyes on a chain', machadoClamor:'a great battle axe with a war horn fused to the haft and red runes glowing',
  muralha:'an enormous tower shield like a castle wall with a war banner on top', prismaGelado:'a floating ice prism crystal refracting cold blue light',
  cajadoInfernal:'a blackened staff crowned with roaring hellfire and embers', zarabatanaPeconha:'a dark bamboo blowgun dripping green venom with snake carvings',
  veuNoite:'a flowing midnight-blue hooded veil with stars and wisps of smoke',
  // classes de ofício, Onda 1
  bigorna:'a heavy black iron blacksmith anvil with a glowing orange-hot spot', marteloForja:'a sturdy blacksmith forging hammer with a wooden handle', lingote:'a shiny stack of iron ingots',
  fole:'a leather blacksmith bellows with a brass nozzle puffing a little flame', armaduraPlacas:'a full shining steel plate armor chest piece with gold trim', laminaMestre:'a masterwork longsword with a rippled damascus blade and a gold-inlaid hilt',
  tenaz:'a pair of long blacksmith tongs holding a glowing hot metal piece', rebites:'a handful of big iron rivets and a small rivet hammer', baldeTempera:'a wooden quenching bucket of water with steam rising',
  montante:'a huge two-handed greatsword with a long steel blade', pedraAfiar:'a fine blue sharpening whetstone in a small wooden holder', elmoFechado:'a closed great helm of polished steel with a narrow visor and red plume',
  escarpas:'a pair of armored steel sabatons boots', forjaPortatil:'a small portable brick forge with glowing coals', bigornaAncestral:'an ancient anvil carved with glowing golden runes',
  kitHerbal:'an open herbalism kit with little jars, dried herbs and a tiny sickle in a leather case', salvia:'a fresh sprig of sage leaves glowing softly', raizAmarga:'a twisted bitter purple root dripping a little green juice',
  florVigor:'a bright yellow sun-like flower glowing with energy', cogumeloGigante:'a big plump red-capped mushroom with white spots', arvoreAncia:'a small ancient bonsai tree in a clay pot with glowing leaves',
  regador:'a copper watering can with a few water droplets', pilao:'a stone mortar and pestle with crushed green herbs', musgo:'a soft clump of glowing healing green moss',
  chaCamomila:'a steaming cup of chamomile tea with little daisies', balsamo:'a small round tin of healing balm with a golden lid', beladona:'a deadly nightshade plant with dark purple berries',
  espinheiro:'a thorny hawthorn branch with sharp thorns and small white flowers', estufa:'a tiny glass greenhouse case full of green sprouts', sementeMundo:'a glowing golden seed sprouting a tiny world tree',
  panela:'a sturdy copper cooking pot with a lid and steam', colherPau:'a big wooden cooking spoon', temperos:'a little wooden box of colorful spices and peppercorns',
  caldeirao:'a bubbling iron cauldron of hot soup with steam', banquete:'a lavish feast platter with roast meat, bread, fruit and cheese', livroReceitas:'an old recipe book with a ribbon bookmark and food stains',
  avental:'a clean white cooking apron with a red-checkered pocket', facaCozinha:'a sharp kitchen chef knife', pimenta:'a fiery red chili pepper with tiny flames',
  bolo:'a festive layered cake with cream, strawberries and a candle', mel:'a clay honey pot with a wooden dipper dripping golden honey', espeto:'a skewer of grilled meat with flames',
  carvao:'a few glowing red-hot charcoal lumps', roloMassa:'a wooden rolling pin dusted with flour', fogao:'a small cast-iron wood stove with glowing fire inside',
  marteloRunico:'a blacksmith hammer with glowing blue runes on the head', armaduraErica:'a steel plate armor covered with sharp spikes', elixirVerde:'a round flask of bright glowing green elixir with leaves',
  extratoMortal:'a small dark vial of deadly purple-green extract with a skull cork', sanduiche:'a big tasty sandwich with cheese, ham and lettuce', ensopadoVovo:'a big rustic clay bowl of grandma stew with vegetables and steam',
};
const temPintura = it => fs.existsSync(path.join(__dirname, '..', 'imagens', 'item-' + it.id + '.webp'));
const BASE = 'Single fantasy game item painted in the same style as the reference image: stylized painterly rendering with realistic textures (wood grain, leather, polished metal, glass), warm cinematic lighting with a soft colored rim light, a few small magical glints, vibrant but harmonious colors, clean readable silhouette, the object centered and filling most of the frame, isolated on a flat pure magenta (#FF00FF) background, no shadow on the background, no text, no letters, no logo, no watermark.';
let md = `# Tralha de Guerra: pintura dos itens\n\nUm item por imagem, no mesmo estilo da coruja (\`retrato-mago.png\`). Só os que ainda não têm pintura: ${t.ITENS.filter(it => !temPintura(it)).length} itens (os outros já estão no jogo).\n\n## Como gerar\n- Quadrado **1:1** (ex.: **1024 × 1024**), o item no centro ocupando quase tudo.\n- **Fundo magenta puro (#FF00FF)**, liso: eu recorto para o item ficar solto em cima das casas da mochila.\n- **Anexe \`retrato-mago.png\` como referência de estilo** em todos os pedidos.\n- Salvar em \`tralha-de-guerra/codigo/arte/originais/itens/\` com o nome da tabela.\n- Dá para gerar aos poucos: enquanto a pintura de um item não existir, ele usa o ícone provisório.\n\n### Estilo base (cole no começo de todo prompt)\n\`\`\`\n${BASE}\n\`\`\`\n\n`;
const grupos = [['Bolsas', it => it.tipo === 'bolsa'], ['Comuns a todas as classes', it => !it.classe && it.tipo !== 'bolsa' && !it.fusao], ...Object.keys(t.CLASSES).map(c => [t.CLASSES[c].nome, it => it.classe === c && !it.fusao]), ['Fusões', it => it.fusao]];
for(const [nome, f] of grupos){
  const L = t.ITENS.filter(it => f(it) && !temPintura(it)); if(!L.length) continue;
  md += `## ${nome} (${L.length})\n| Arquivo | Item | Prompt (depois do estilo base) |\n|---|---|---|\n`;
  for(const it of L){ if(!DESC[it.id]) throw new Error('sem descrição: ' + it.id); md += `| \`item-${it.id}.png\` | ${it.nome} | ${DESC[it.id].charAt(0).toUpperCase() + DESC[it.id].slice(1)}. |\n`; }
  md += '\n';
}
fs.writeFileSync(path.join(__dirname, '..', '..', 'ARTE-ITENS.md'), md);
console.log('ok ·', t.ITENS.length, 'itens');
