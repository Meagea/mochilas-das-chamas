# Tralha de Guerra: pintura dos itens

Um item por imagem, no mesmo estilo da coruja (`retrato-mago.png`). Só os que ainda não têm pintura: 72 itens (os outros já estão no jogo).

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

## Guerreiro (1)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-brasao.png` | Brasão | A small heraldic crest badge with a golden jaguar head on red enamel. |

## Ladino (1)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-sorrisoHiena.png` | Sorriso da Jaguatirica | A grinning ocelot skull amulet with emerald eyes on a chain. |

## Alquimista (1)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-elixirDragao.png` | Elixir do Boitatá | An ornate flask of fiery red elixir with a stopper shaped like the boitata, the glowing fire serpent of Brazilian folklore. |

## Cervejeiro (2)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-cervejaDragao.png` | Cerveja do Boitatá | A mug of fiery red beer with foam and a small glowing fire serpent (boitata) coiling around it. |
| `item-elixirFuria.png` | Elixir da Fúria | A fierce red elixir bottle with a peccary skull stopper. |

## Evoluções gerais (23)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-laminaSorte.png` | Lâmina da Sorte | A short steel sword with a four-leaf clover engraved on the blade and a golden lucky shine. |
| `item-macaCruzado.png` | Maça do Cruzado | A holy crusader flanged mace with a small round shield emblem and white cloth wrapped on the grip. |
| `item-tocha.png` | Tocha | A burning wooden torch with cloth wrap and bright flames. |
| `item-machadosArremesso.png` | Machados de Arremesso | Two small throwing axes crossed together with leather-wrapped handles. |
| `item-lancaFalange.png` | Lança de Falange | A long phalanx spear leaning on a small round bronze shield. |
| `item-arcoPeconhento.png` | Arco Peçonhento | A short dark wooden bow wrapped in thorny vines with green poison dripping from an arrow tip. |
| `item-arcoCacador.png` | Arco do Caçador | An elegant hunter longbow with a feathered quiver and a golden target emblem. |
| `item-espadaVampirica.png` | Espada Vampírica | A dark longsword with a blood-red glowing blade and bat-wing crossguard. |
| `item-marteloJuizo.png` | Martelo do Juízo | A massive silver war hammer of judgement with golden scales engraved and holy light. |
| `item-escudoCastelo.png` | Escudo do Castelo | A huge heavy shield shaped like a stone castle gate with iron towers. |
| `item-escudoChamas.png` | Escudo em Chamas | A round wooden shield with an iron rim engulfed in orange flames. |
| `item-escudoLaminas.png` | Escudo de Lâminas | An iron shield with sharp steel blades sticking out of its rim. |
| `item-armaduraCompleta.png` | Armadura Completa | A full suit of plate armor chest piece with a matching iron helmet on top. |
| `item-couracaViva.png` | Couraça Viva | A leather cuirass with a glowing red heart gem in the center and living vines. |
| `item-mantoTempo.png` | Manto do Tempo | A flowing grey cloak with a brass hourglass clasp and swirling golden sand. |
| `item-tortaFarta.png` | Torta Farta | A big golden meat pie with a thick crust and steam. |
| `item-tabuaFrios.png` | Tábua de Frios | A wooden board with cheese wedges, apple slices and sausage. |
| `item-sopaFarta.png` | Sopa Farta | A large steaming bowl of hearty soup with a bread loaf on the side. |
| `item-pocaoGrande.png` | Poção Grande | A large round glass potion flask with glowing red liquid and a big cork. |
| `item-elixirFolego.png` | Elixir de Fôlego | A tall slender glass bottle with bubbling bright yellow liquid and wind swirls. |
| `item-frascoPeconhento.png` | Frasco Peçonhento | A glass flask full of thick bubbling dark green poison with a skull stopper. |
| `item-bombaIncendiaria.png` | Bomba Incendiária | A round black bomb wrapped in flames with a burning fuse. |
| `item-amuletoSorte.png` | Amuleto da Sorte | A lucky amulet made of an iron horseshoe with a four-leaf clover in the center on a cord. |

## Evoluções: Guerreiro (6)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-insigniaCapitao.png` | Insígnia do Capitão | A golden captain medal with a red ribbon and crossed swords. |
| `item-racaoCampanha.png` | Ração de Campanha | A soldier field ration pack with bread, dried meat and a canteen tied with a strap. |
| `item-manoplaCravada.png` | Manopla Cravada | A heavy iron gauntlet with sharp spikes on the knuckles. |
| `item-bradoCampeao.png` | Brado do Campeão | A great golden war horn with a jaguar head and shockwaves of golden light. |
| `item-cotaReforcada.png` | Cota Reforçada | A reinforced chainmail shirt with steel plates on the shoulders and chest. |
| `item-trofeuBatalha.png` | Troféu de Batalha | A battle trophy made of a beast skull with horns mounted on a wooden plaque with fangs. |

## Evoluções: Mago (6)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-grimorioDesperto.png` | Grimório Desperto | An awakened spellbook floating open with glowing blue runes and an eye on the cover. |
| `item-coracaoFogo.png` | Coração de Fogo | A living heart made of fire and molten rock with flames pulsing out. |
| `item-coroaInverno.png` | Coroa do Inverno | A tall regal crown of sharp ice crystals with snowflakes and cold mist. |
| `item-elixirArcano.png` | Elixir Arcano | An ornate crystal potion bottle with swirling violet and blue arcane liquid and stars. |
| `item-espelhoPrismatico.png` | Espelho Prismático | An oval mirror with a brass frame whose surface splits light into a rainbow prism. |
| `item-nevasca.png` | Nevasca | A swirling blizzard orb of snow and ice shards with frosty wind. |

## Evoluções: Ladino (7)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-kitEnvenenador.png` | Kit do Envenenador | An open leather poisoner case with many small poison vials, needles and a snake emblem. |
| `item-luvasGatuno.png` | Luvas do Gatuno | A pair of black thief gloves with hidden lockpicks and small blades on the fingers. |
| `item-lequeLaminas.png` | Leque de Lâminas | A fan of five throwing knives spread out in a half circle. |
| `item-mascaraFantasma.png` | Máscara do Fantasma | A pale white ghost mask with dark eye holes and wisps of smoke. |
| `item-baralhoMarcado.png` | Baralho Marcado | A deck of marked playing cards fanned out with a sly golden glint. |
| `item-ferrao.png` | Ferrão | A curved dagger shaped like a scorpion stinger dripping green venom. |
| `item-soproMorte.png` | Sopro da Morte | A dark carved bone blowgun with a skull mouthpiece and green toxic mist. |

## Evoluções: Ferreiro (1)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-tinaTempera.png` | Tina de Têmpera | A wooden quenching tub full of water with a hot glowing blade hissing steam. |

## Evoluções: Herbalista (3)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-nectarVital.png` | Néctar Vital | A small glass jar of glowing golden flower nectar with petals and a honey dipper. |
| `item-unguentoEspinhos.png` | Unguento de Espinhos | A clay pot of green healing ointment with thorny brambles around it. |
| `item-orvalhoVida.png` | Orvalho da Vida | A giant glowing dewdrop resting on a green leaf with tiny sparkles of life. |

## Evoluções: Alquimista (5)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-bombaVapor.png` | Bomba de Vapor | A brass and glass flask splitting into fire and ice halves with hissing steam. |
| `item-fogoGrego.png` | Fogo Grego | A clay flask with green-orange liquid fire bursting out and dripping acid. |
| `item-nevoaGelida.png` | Névoa Gélida | A frosted glass flask releasing pale blue-green icy toxic mist. |
| `item-bombaGlacial.png` | Bomba Glacial | A round bomb made of solid blue ice with a frozen fuse and frost cracks. |
| `item-nuvemCorrosiva.png` | Nuvem Corrosiva | A cracked glass flask releasing a thick yellow-green corrosive cloud. |

## Evoluções: Coureiro (1)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-chicoteDomador.png` | Chicote de Domador | A coiled beast tamer leather whip with a brass handle and a small paw emblem. |

## Evoluções: Joalheiro (3)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-geodo.png` | Geodo | A split-open geode rock full of purple and white sparkling crystals. |
| `item-granada.png` | Granada | A deep red garnet gemstone cut into a sharp faceted shape with a burning glint. |
| `item-colarReal.png` | Colar Real | A royal golden necklace with a large purple amethyst and small gems around it. |

## Evoluções: Inventor (3)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-balista.png` | Balista | A small wooden clockwork ballista with brass gears and a loaded bolt. |
| `item-mina.png` | Mina | A round iron spring-loaded landmine with spikes and a red trigger button. |
| `item-escudoGiratorio.png` | Escudo Giratório | A round mechanical shield with spinning brass gears and rotating blades on the rim. |

## Evoluções: Cervejeiro (4)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-bafoDragao.png` | Bafo do Boitatá | A bottle of liquor with a glowing fire serpent (boitata) bursting out of the neck in flames. |
| `item-canecoGuerra.png` | Caneco de Guerra | A heavy iron war tankard with spikes on the side and foam spilling over. |
| `item-coquetel.png` | Coquetel Incendiário | A glass bottle with a burning cloth rag in the neck. |
| `item-pancaBlindada.png` | Pança Blindada | A round armored iron belly plate with rivets and a beer foam stain. |

## Evoluções: Cozinheiro (5)
| Arquivo | Item | Prompt (depois do estilo base) |
|---|---|---|
| `item-colherMel.png` | Colher de Mel | A wooden spoon dripping with golden honey. |
| `item-aventalMestre.png` | Avental do Mestre | A clean white master chef apron with a golden embroidered spoon. |
| `item-cutelo.png` | Cutelo | A big butcher cleaver with a wide steel blade and wooden handle. |
| `item-macaCaramelada.png` | Maçã Caramelada | A shiny red caramel apple on a stick. |
| `item-caldoPicante.png` | Caldo Picante | A steaming bowl of spicy red broth with chili peppers and small flames. |

