# Tralha de Guerra: pintura dos itens

Um item por imagem, no mesmo estilo da coruja (`retrato-mago.png`). Só os que ainda não têm pintura: 32 itens (os outros já estão no jogo).

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
| `item-tonel.png` | Tonel de Carvalho | A wooden oak cask with iron hoops. |

## Inventor (14)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-bancadaInventor.png` | Bancada de Funileiro | A tinker workbench with gears, springs, screwdrivers and a small vise. |
| `item-catapultinha.png` | Catapultinha | A tiny wooden clockwork catapult with brass gears. |
| `item-torreta.png` | Torreta de Molas | A small brass spring-loaded turret with a crank. |
| `item-automato.png` | Autômato | A cute small brass clockwork automaton robot with glowing eyes. |
| `item-canhaoVapor.png` | Canhão a Vapor | A brass steam cannon with pipes and a puff of steam. |
| `item-golem.png` | Golem de Engrenagens | A large clockwork golem made of brass gears and iron plates with glowing core. |
| `item-chaveInglesa.png` | Chave Inglesa | A big steel adjustable wrench. |
| `item-mola.png` | Mola Reforçada | A heavy reinforced steel coil spring. |
| `item-bateria.png` | Bateria de Raios | A brass lightning battery jar with blue electric sparks. |
| `item-armadilha.png` | Armadilha de Molas | A steel bear-trap style spring trap with gears. |
| `item-escudoMecanico.png` | Escudo Mecânico | A mechanical shield with rotating brass gears. |
| `item-lancaChamas.png` | Lança-Chamas | A brass flamethrower nozzle with a fuel tank and fire. |
| `item-drone.png` | Drone Batedor | A small flying brass clockwork drone with propellers and a lens eye. |
| `item-oficinaMestre.png` | Oficina do Mestre | A master inventor workshop desk with blueprints, gears and tools. |

## Cervejeiro (14)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-barril.png` | Barril | A big oak beer barrel with a brass tap. |
| `item-caneca.png` | Caneca de Cerveja | A wooden beer mug overflowing with foam. |
| `item-hidromel.png` | Hidromel | A bottle of golden honey mead. |
| `item-aguardente.png` | Aguardente | A small bottle of strong clear spirit with a cork. |
| `item-cervejaDragao.png` | Cerveja de Dragão | A mug of fiery red dragon beer with flames and foam. |
| `item-elixirFuria.png` | Elixir da Fúria | A fierce red elixir bottle with a boar skull stopper. |
| `item-canecao.png` | Canecão de Ferro | A heavy iron tankard mug used as a club. |
| `item-lupulo.png` | Lúpulo | A bunch of fresh green hop cones. |
| `item-tonel.png` | Tonel de Carvalho | A wooden oak cask with iron hoops. |
| `item-garrafada.png` | Garrafada | A thrown glass bottle flying with liquid splashing. |
| `item-barrigaDura.png` | Barriga Dura | A sturdy leather belly armor plate. |
| `item-barrilRolante.png` | Barril Rolante | A wooden barrel rolling with iron bands. |
| `item-brindeGuerra.png` | Brinde de Guerra | Two clinking beer mugs in a war toast with foam splashing. |
| `item-cervejariaMestre.png` | Cervejaria do Mestre | A master brewery with copper kettles, barrels and pipes. |

## Fusões (4)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-morteiro.png` | Morteiro | A small brass mortar cannon with a smoking shell. |
| `item-bastiao.png` | Bastião Mecânico | A fortified mechanical turret tower with brass armor plates. |
| `item-rodada.png` | Rodada para Todos | A wooden tray with several foamy beer mugs. |
| `item-bafoDragao.png` | Bafo de Dragão | A bottle of dragon breath liquor with fire bursting from the neck. |

