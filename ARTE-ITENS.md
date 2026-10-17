# Tralha de Guerra: pintura dos itens

Um item por imagem, no mesmo estilo da coruja (`retrato-mago.png`). Só os que ainda não têm pintura: 53 itens (os outros já estão no jogo).

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

## Bolsas (3)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-bolsaCintura.png` | Bolsa de Cintura | A small leather belt pouch with a buckle. |
| `item-mochilaExpedicao.png` | Mochila de Expedição | A big expedition backpack with bedroll, lantern and many pockets. |
| `item-alforje.png` | Alforje do Mestre | A masterwork double leather saddlebag with gold stitching. |

## Alquimista (18)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-kitAlquimia.png` | Kit de Alquimia | An alchemy kit case with bubbling colorful flasks, a small burner and copper tubes. |
| `item-polvora.png` | Pólvora Negra | A small leather pouch of black gunpowder with a fuse. |
| `item-acido.png` | Ácido Corrosivo | A thick glass flask of glowing yellow-green corrosive acid eating its cork. |
| `item-caldeira.png` | Caldeira Borbulhante | A small bubbling copper alchemy boiler with three-colored steam. |
| `item-pedraFilosofal.png` | Pedra Filosofal | A glowing crimson philosopher stone with golden light. |
| `item-elixirDragao.png` | Elixir do Dragão | An ornate flask of fiery red dragon elixir with a dragon-shaped stopper. |
| `item-funil.png` | Funil de Cobre | A copper alchemy funnel. |
| `item-saisVolateis.png` | Sais Voláteis | A small jar of sparkling volatile smelling salts. |
| `item-catalisador.png` | Catalisador | A glowing violet catalyst crystal in a brass cage. |
| `item-bombaGelo.png` | Bomba de Gelo | A round glass ice bomb filled with frost and snowflakes. |
| `item-nevoaToxica.png` | Névoa Tóxica | A corked flask releasing a swirl of toxic green mist. |
| `item-canhaoAlquimico.png` | Canhão Alquímico | A small brass hand cannon with alchemical tubes and a smoking barrel. |
| `item-homunculo.png` | Homúnculo | A tiny cute homunculus creature inside a glass jar with glowing eyes. |
| `item-mascaraGas.png` | Máscara de Gás | A leather plague-doctor gas mask with brass filters. |
| `item-atanor.png` | Atanor | A small alchemist furnace athanor with a glowing tower chimney. |
| `item-frascoFogo.png` | Frasco Instável de Fogo | A cracked unstable glass flask with roaring orange fire inside. |
| `item-frascoGelo.png` | Frasco Instável de Gelo | A cracked unstable glass flask with swirling blue ice and frost inside. |
| `item-frascoAcido.png` | Frasco Instável de Ácido | A cracked unstable glass flask with bubbling green acid inside. |

## Coureiro (14)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-ferramentasCouro.png` | Ferramentas de Couro | A leatherworking tool roll with an awl, needles, thread and a round knife. |
| `item-agulhao.png` | Agulhão | A long thick leatherworker awl needle used as a weapon. |
| `item-bolsaCintura.png` | Bolsa de Cintura | A small leather belt pouch with a buckle. |
| `item-gibao.png` | Gibão de Couro | A padded brown leather doublet armor. |
| `item-mochilaExpedicao.png` | Mochila de Expedição | A big expedition backpack with bedroll, lantern and many pockets. |
| `item-alforje.png` | Alforje do Mestre | A masterwork double leather saddlebag with gold stitching. |
| `item-dedal.png` | Dedal | A brass sewing thimble. |
| `item-chicote.png` | Chicote | A coiled leather whip. |
| `item-botas.png` | Botas de Couro | A pair of sturdy leather boots with buckles. |
| `item-cinto.png` | Cinto de Fivelas | A leather belt with many brass buckles. |
| `item-luvasCouro.png` | Luvas de Couro Grosso | A pair of thick leather work gloves. |
| `item-broquel.png` | Broquel de Couro Fervido | A small round boiled-leather buckler with a metal boss. |
| `item-capaViajante.png` | Capa de Viajante | A brown hooded traveler cloak with a brooch. |
| `item-mesaCoureiro.png` | Mesa do Mestre Coureiro | A master leatherworker table with tools, leather sheets and a stitching pony. |

## Joalheiro (15)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-lupa.png` | Lupa e Pinças | A brass jeweler magnifying loupe with fine tweezers. |
| `item-martelinho.png` | Martelinho de Joalheiro | A tiny jeweler hammer with a polished head. |
| `item-quartzo.png` | Quartzo | A clear faceted quartz crystal. |
| `item-rubi.png` | Rubi | A brilliant cut red ruby gem. |
| `item-safira.png` | Safira | A brilliant cut deep blue sapphire gem. |
| `item-esmeralda.png` | Esmeralda | A brilliant cut green emerald gem. |
| `item-diamante.png` | Diamante | A large brilliant cut sparkling diamond. |
| `item-pincas.png` | Pinças Finas | A pair of fine silver jeweler tweezers holding a tiny gem. |
| `item-ametista.png` | Ametista | A purple amethyst crystal cluster. |
| `item-colarOuro.png` | Colar de Ouro | A golden necklace with small gems. |
| `item-topazio.png` | Topázio | A brilliant cut golden topaz gem. |
| `item-onix.png` | Ônix | A polished black onyx stone. |
| `item-adagaCravejada.png` | Adaga Cravejada | A dagger with a hilt encrusted with colorful gems. |
| `item-cetro.png` | Cetro de Joias | A royal scepter topped with a large jewel. |
| `item-coroaJoias.png` | Coroa de Joias | A jeweled crown encrusted with many colorful gems. |

## Fusões (6)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-barrilPolvora.png` | Barril de Pólvora | A small wooden powder keg with a lit fuse. |
| `item-acidoReal.png` | Ácido Real | A royal flask of glowing aqua regia acid with a golden crown stopper. |
| `item-sovela.png` | Sovela | A fine sharp leather awl blade. |
| `item-couracaReforcada.png` | Couraça Reforçada | A reinforced leather cuirass with metal studs and plates. |
| `item-espadaJoias.png` | Espada de Joias | A short sword with a jeweled hilt and a glowing ruby. |
| `item-pedraPrisma.png` | Pedra Prisma | A glowing rainbow prism gemstone splitting light into colors. |

