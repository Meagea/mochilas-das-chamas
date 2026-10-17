# Tralha de Guerra: pintura dos itens

Um item por imagem, no mesmo estilo da coruja (`retrato-mago.png`). Só os que ainda não têm pintura: 85 itens (os outros já estão no jogo).

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

## Bolsas (1)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-estufa.png` | Estufa de Vidro | A tiny glass greenhouse case full of green sprouts. |

## Guerreiro (10)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-cantil.png` | Cantil de Campanha | A dented leather-wrapped metal canteen with a brass cap and a strap. |
| `item-manopla.png` | Manopla de Ferro | A heavy riveted iron gauntlet. |
| `item-gritoGuerra.png` | Grito de Guerra | A carved bone war horn with red cloth, sound waves of golden light bursting out. |
| `item-cotaMalha.png` | Cota de Malha | A chainmail shirt of interlocking steel rings. |
| `item-machadoDuplo.png` | Machado Duplo | A brutal double-headed axe with notched blades and bone grip. |
| `item-colarDentes.png` | Colar de Dentes | A tribal necklace of big beast fangs on a leather cord. |
| `item-paves.png` | Pavês | A huge tall rectangular pavise shield with iron spikes on the rim. |
| `item-brasao.png` | Brasão | A small heraldic crest badge with a gold lion on red enamel. |
| `item-marteloCerco.png` | Martelo de Cerco | A massive siege maul with a huge iron head and chains. |
| `item-coroaCampeao.png` | Coroa do Campeão | A golden champion crown with red gems and a laurel wreath. |

## Mago (9)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-vela.png` | Vela de Estudo | A melting candle in a brass holder with a small magic flame and runes floating. |
| `item-runaGelo.png` | Runa de Gelo | A flat stone rune tablet carved with a glowing icy blue rune. |
| `item-ampolaEter.png` | Ampola de Éter | A delicate glass ampoule with swirling violet ether and silver stopper. |
| `item-meteorito.png` | Meteorito | A blazing meteor rock with molten cracks and a fiery tail. |
| `item-brasaViva.png` | Brasa Viva | A glowing living ember coal with tiny flames and a little smiling spirit face. |
| `item-lancaGelo.png` | Lança de Gelo | A long spear made of solid sharp ice crystal with frost mist. |
| `item-coroaGeada.png` | Coroa de Geada | A crown made of icicles and frost crystals glowing pale blue. |
| `item-espelhoArcano.png` | Espelho Arcano | An oval hand mirror with brass frame and a glowing purple arcane surface. |
| `item-tomoProibido.png` | Tomo Proibido | A forbidden dark tome with an eye on the cover, chains and glowing green runes. |

## Ladino (9)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-gazua.png` | Gazua | A ring of thin lockpicks and a small key. |
| `item-facas.png` | Facas de Arremesso | Three throwing knives fanned out with leather-wrapped handles. |
| `item-mascara.png` | Máscara de Ladrão | A dark leather thief mask covering the eyes. |
| `item-laminaOculta.png` | Lâmina Oculta | A hidden wrist blade sliding out of a leather bracer. |
| `item-luvas.png` | Luvas Leves | A pair of thin supple dark leather gloves. |
| `item-alambique.png` | Alambique | A small copper alchemy still with bubbling green poison and glass tubes. |
| `item-cogumelo.png` | Cogumelo Tóxico | A toxic purple-spotted mushroom glowing faintly green. |
| `item-bolsaTruques.png` | Bolsa de Truques | A small trickster pouch spilling marbles, smoke and playing cards. |
| `item-sorrisoHiena.png` | Sorriso da Hiena | A grinning hyena skull amulet with emerald eyes on a chain. |

## Ferreiro (15)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-bigorna.png` | Bigorna | A heavy black iron blacksmith anvil with a glowing orange-hot spot. |
| `item-marteloForja.png` | Martelo de Forja | A sturdy blacksmith forging hammer with a wooden handle. |
| `item-lingote.png` | Lingote de Ferro | A shiny stack of iron ingots. |
| `item-fole.png` | Fole | A leather blacksmith bellows with a brass nozzle puffing a little flame. |
| `item-armaduraPlacas.png` | Armadura de Placas | A full shining steel plate armor chest piece with gold trim. |
| `item-laminaMestre.png` | Lâmina do Mestre | A masterwork longsword with a rippled damascus blade and a gold-inlaid hilt. |
| `item-tenaz.png` | Tenaz | A pair of long blacksmith tongs holding a glowing hot metal piece. |
| `item-rebites.png` | Rebites | A handful of big iron rivets and a small rivet hammer. |
| `item-baldeTempera.png` | Balde de Têmpera | A wooden quenching bucket of water with steam rising. |
| `item-montante.png` | Montante | A huge two-handed greatsword with a long steel blade. |
| `item-pedraAfiar.png` | Pedra de Afiar Fina | A fine blue sharpening whetstone in a small wooden holder. |
| `item-elmoFechado.png` | Elmo Fechado | A closed great helm of polished steel with a narrow visor and red plume. |
| `item-escarpas.png` | Escarpas | A pair of armored steel sabatons boots. |
| `item-forjaPortatil.png` | Forja Portátil | A small portable brick forge with glowing coals. |
| `item-bigornaAncestral.png` | Bigorna Ancestral | An ancient anvil carved with glowing golden runes. |

## Herbalista (15)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-kitHerbal.png` | Kit de Herbalismo | An open herbalism kit with little jars, dried herbs and a tiny sickle in a leather case. |
| `item-salvia.png` | Folha de Sálvia | A fresh sprig of sage leaves glowing softly. |
| `item-raizAmarga.png` | Raiz Amarga | A twisted bitter purple root dripping a little green juice. |
| `item-florVigor.png` | Flor de Vigor | A bright yellow sun-like flower glowing with energy. |
| `item-cogumeloGigante.png` | Cogumelo Gigante | A big plump red-capped mushroom with white spots. |
| `item-arvoreAncia.png` | Árvore Anciã | A small ancient bonsai tree in a clay pot with glowing leaves. |
| `item-regador.png` | Regador | A copper watering can with a few water droplets. |
| `item-pilao.png` | Pilão | A stone mortar and pestle with crushed green herbs. |
| `item-musgo.png` | Musgo Curativo | A soft clump of glowing healing green moss. |
| `item-chaCamomila.png` | Chá de Camomila | A steaming cup of chamomile tea with little daisies. |
| `item-balsamo.png` | Bálsamo | A small round tin of healing balm with a golden lid. |
| `item-beladona.png` | Beladona | A deadly nightshade plant with dark purple berries. |
| `item-espinheiro.png` | Espinheiro | A thorny hawthorn branch with sharp thorns and small white flowers. |
| `item-estufa.png` | Estufa de Vidro | A tiny glass greenhouse case full of green sprouts. |
| `item-sementeMundo.png` | Semente do Mundo | A glowing golden seed sprouting a tiny world tree. |

## Cozinheiro (15)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-panela.png` | Panela | A sturdy copper cooking pot with a lid and steam. |
| `item-colherPau.png` | Colher de Pau | A big wooden cooking spoon. |
| `item-temperos.png` | Temperos | A little wooden box of colorful spices and peppercorns. |
| `item-caldeirao.png` | Caldeirão de Sopa | A bubbling iron cauldron of hot soup with steam. |
| `item-banquete.png` | Banquete | A lavish feast platter with roast meat, bread, fruit and cheese. |
| `item-livroReceitas.png` | Livro de Receitas | An old recipe book with a ribbon bookmark and food stains. |
| `item-avental.png` | Avental | A clean white cooking apron with a red-checkered pocket. |
| `item-facaCozinha.png` | Faca de Cozinha | A sharp kitchen chef knife. |
| `item-pimenta.png` | Pimenta Ardida | A fiery red chili pepper with tiny flames. |
| `item-bolo.png` | Bolo de Festa | A festive layered cake with cream, strawberries and a candle. |
| `item-mel.png` | Mel | A clay honey pot with a wooden dipper dripping golden honey. |
| `item-espeto.png` | Espeto Flamejante | A skewer of grilled meat with flames. |
| `item-carvao.png` | Carvão | A few glowing red-hot charcoal lumps. |
| `item-roloMassa.png` | Rolo de Massa | A wooden rolling pin dusted with flour. |
| `item-fogao.png` | Fogão de Ferro | A small cast-iron wood stove with glowing fire inside. |

## Fusões (12)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-machadoClamor.png` | Machado do Clamor | A great battle axe with a war horn fused to the haft and red runes glowing. |
| `item-muralha.png` | Muralha | An enormous tower shield like a castle wall with a war banner on top. |
| `item-prismaGelado.png` | Prisma Gelado | A floating ice prism crystal refracting cold blue light. |
| `item-cajadoInfernal.png` | Cajado Infernal | A blackened staff crowned with roaring hellfire and embers. |
| `item-zarabatanaPeconha.png` | Zarabatana da Peçonha | A dark bamboo blowgun dripping green venom with snake carvings. |
| `item-veuNoite.png` | Véu da Noite | A flowing midnight-blue hooded veil with stars and wisps of smoke. |
| `item-marteloRunico.png` | Martelo Rúnico | A blacksmith hammer with glowing blue runes on the head. |
| `item-armaduraErica.png` | Armadura Eriçada | A steel plate armor covered with sharp spikes. |
| `item-elixirVerde.png` | Elixir Verde | A round flask of bright glowing green elixir with leaves. |
| `item-extratoMortal.png` | Extrato Mortal | A small dark vial of deadly purple-green extract with a skull cork. |
| `item-sanduiche.png` | Sanduíche | A big tasty sandwich with cheese, ham and lettuce. |
| `item-ensopadoVovo.png` | Ensopado da Vovó | A big rustic clay bowl of grandma stew with vegetables and steam. |

