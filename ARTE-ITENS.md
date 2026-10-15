# Tralha de Guerra: pintura dos itens

Um item por imagem, no mesmo estilo da coruja (`retrato-mago.png`). São 60 itens.

## Como gerar
- Quadrado **1:1** (ex.: **1024 × 1024**), o item no centro ocupando quase tudo.
- **Fundo magenta puro (#FF00FF)**, liso: eu recorto para o item ficar solto em cima das casas da mochila.
- **Anexe `retrato-mago.png` como referência de estilo** em todos os pedidos.
- Salvar em `tralha-de-guerra/codigo/arte/originais/itens/` com o nome da tabela.
- Dá para gerar aos poucos: enquanto a pintura de um item não existir, ele usa o ícone provisório.

### Estilo base (cole no começo de todo prompt)
```
Single fantasy game item painted in the same style as the reference image: stylized painterly rendering with realistic textures (wood grain, leather, polished metal, glass), warm cinematic lighting with a soft colored rim light, a few small magical glints, vibrant but harmonious colors, clean readable silhouette, the object centered and filling most of the frame, isolated on a flat pure magenta (#FF00FF) background, no shadow on the background, no text, no letters, no logo, no watermark.
```

## Bolsas (5)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-mochila.png` | Mochila Velha | An old worn leather backpack with brass buckles, slightly open. |
| `item-bolsaCouro.png` | Bolsa de Couro | A small square leather pouch with a brass clasp. |
| `item-bolsaLonga.png` | Bolsa Comprida | A long narrow canvas bag rolled with leather straps. |
| `item-bolsaErvas.png` | Bolsa de Ervas | A leather herb pouch overflowing with green herbs and little flowers. |
| `item-bolsaArmas.png` | Bainha Larga | A wide leather weapon sheath holding several hilts. |

## Comuns a todas as classes (28)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-graveto.png` | Graveto | A crooked wooden stick with a few leaves. |
| `item-espadaCurta.png` | Espada Curta | A short steel sword with a leather-wrapped grip. |
| `item-clava.png` | Clava | A heavy wooden club with iron studs. |
| `item-machadinha.png` | Machadinha | A small hand axe with a curved steel blade. |
| `item-lanca.png` | Lança | A long spear with a leaf-shaped steel tip and red ribbon. |
| `item-arcoCurto.png` | Arco Curto | A short wooden bow with a quiver of three arrows. |
| `item-espadaLonga.png` | Espada Longa | A long knightly sword with a brass crossguard. |
| `item-martelo.png` | Martelo de Guerra | A big two-handed war hammer with a steel head. |
| `item-escudoMadeira.png` | Escudo de Madeira | A round wooden shield with iron rim. |
| `item-escudoFerro.png` | Escudo de Ferro | A sturdy iron heater shield with rivets. |
| `item-elmo.png` | Elmo Amassado | A dented iron helmet. |
| `item-couraca.png` | Couraça de Couro | A leather cuirass chest armor with buckles. |
| `item-manto.png` | Manto Leve | A light flowing grey travel cloak. |
| `item-maca.png` | Maçã | A shiny red apple. |
| `item-pao.png` | Pão Duro | A crusty loaf of bread. |
| `item-queijo.png` | Queijo Furado | A wedge of holey yellow cheese. |
| `item-ensopado.png` | Ensopado | A steaming wooden bowl of stew with a spoon. |
| `item-pocaoCura.png` | Poção de Cura | A round glass potion bottle with glowing red liquid and a cork. |
| `item-pocaoVigor.png` | Poção de Vigor | A tall glass potion bottle with glowing yellow liquid. |
| `item-frascoVeneno.png` | Frasco de Veneno | A small glass vial with bubbling green poison and a skull label. |
| `item-bomba.png` | Bomba | A round black bomb with a lit sparking fuse. |
| `item-amolar.png` | Pedra de Amolar | A grey whetstone sharpening stone. |
| `item-pedraFogo.png` | Pedra de Fogo | A glowing ember stone with small flames. |
| `item-trevo.png` | Trevo de Quatro Folhas | A lucky four-leaf clover with a golden shine. |
| `item-gemaVida.png` | Gema da Vida | A heart-shaped red gem glowing softly. |
| `item-ampulheta.png` | Ampulheta | A brass hourglass with glowing golden sand. |
| `item-ferradura.png` | Ferradura | A lucky iron horseshoe. |
| `item-coracaoPedra.png` | Coração de Pedra | A big stone heart with glowing cracks. |

## Guerreiro (6)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-insignia.png` | Insígnia do Guerreiro | A bronze warrior medal with a red ribbon. |
| `item-trombeta.png` | Trombeta de Guerra | A brass war horn decorated with red cloth. |
| `item-escudoTorre.png` | Escudo Torre | A tall rectangular tower shield with a painted yellow star. |
| `item-espinheira.png` | Armadura de Espinhos | A leather armor covered with sharp iron spikes. |
| `item-machadoFuria.png` | Machado da Fúria | A huge double-bladed battle axe with red runes. |
| `item-estandarte.png` | Estandarte Rasgado | A torn red war banner on a wooden pole. |

## Mago (8)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-grimorio.png` | Grimório Gasto | An old worn spellbook bound with chains and a brass star clasp. |
| `item-faisca.png` | Faísca | A small crackling orange spark of magic fire. |
| `item-varinha.png` | Varinha | A slender wooden magic wand with a glowing tip. |
| `item-cristalMana.png` | Cristal de Mana | A floating blue mana crystal. |
| `item-orbeGelo.png` | Orbe de Gelo | A frosty glowing ice orb. |
| `item-cajadoFogo.png` | Cajado de Fogo | A gnarled wooden staff with a burning orange crystal on top. |
| `item-bolaFogo.png` | Pergaminho da Bola de Fogo | A rolled magic scroll with a fireball bursting out of it. |
| `item-olhoArcano.png` | Olho Arcano | A mystical floating eye made of purple arcane energy and brass rings. |

## Ladino (7)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-kitVeneno.png` | Kit de Venenos | A small leather kit with poison vials and a coiled snake emblem. |
| `item-adaga.png` | Adaga | A curved steel dagger. |
| `item-zarabatana.png` | Zarabatana | A bamboo blowgun with green-tipped darts. |
| `item-capaSombras.png` | Capa das Sombras | A dark hooded shadow cloak with wisps of smoke. |
| `item-fumaca.png` | Bomba de Fumaça | A round smoke bomb releasing grey smoke. |
| `item-adagasGemeas.png` | Adagas Gêmeas | Two crossed curved daggers with emerald gems. |
| `item-presaSerpente.png` | Presa da Serpente | A large curved serpent fang dripping green venom. |

## Fusões (6)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-laminaFogo.png` | Lâmina Flamejante | A short sword with a burning flaming blade. |
| `item-escudoReforcado.png` | Escudo Reforçado | A round wooden shield reinforced with thick iron plates. |
| `item-torta.png` | Torta de Maçã | A golden apple pie. |
| `item-adagaVeneno.png` | Adaga Envenenada | A dagger with a blade dripping green poison. |
| `item-varinhaArcana.png` | Varinha Arcana | An ornate magic wand with a glowing purple crystal and brass spirals. |
| `item-macaCravejada.png` | Maça Cravejada | A spiked iron mace. |

