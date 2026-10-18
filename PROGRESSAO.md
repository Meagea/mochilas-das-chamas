# Tralha de Guerra: progressão dos personagens e classes de ofício

Planejamento para aprovar antes de programar. Os números de cada item são definidos na hora de programar e ajustados no simulador. Aqui ficam o nome, a raridade e a ideia de cada um.

## 1. A regra de ouro: opções, não poder
- Cada personagem tem a sua **experiência** e o seu **nível (1 a 10)**. Os níveis liberam **itens novos na loja daquele personagem**. Nenhum item desbloqueado é mais forte que os do nível 1, só faz outra coisa.
- O **nível 1 já tem pelo menos um item da classe em cada raridade** (comum, incomum, rara, épica e lendária). Assim, um jogador novo nunca fica com a loja "vazia" nas rodadas altas.
- Tudo o que existe hoje no jogo continua liberado no nível 1. Ninguém perde nada.
- Conferência no simulador: robôs de nível 1 contra robôs de nível 10 da mesma classe precisam ficar entre 47% e 53% de vitórias.

## 2. Três tipos de item
| Tipo | Quem vê na loja |
|---|---|
| **Comuns** (bolsas, comida básica, armas simples, poções) | todas as classes, sempre |
| **Da classe, iniciais** | só aquela classe, desde o nível 1 |
| **Da classe, desbloqueáveis** | só aquela classe, a partir do nível indicado |

## 3. Experiência
**Ganho por partida:**
- 2 pontos por rodada jogada;
- 3 pontos por vitória;
- mais 10 pontos ao fechar 7 vitórias.

**Valores medidos no simulador** (300 partidas de robô): a partida média tem 5,7 rodadas e 2,8 vitórias e dá **20 pontos de experiência**. A pior partida dá 6 pontos e a melhor, 49.

**Curva lenta**, com o nível 10 em cerca de **160 partidas**, ou umas 45 horas por personagem:

| Nível | Experiência total | Partidas (média) | O que libera |
|---|---|---|---|
| 1 | 0 | 0 | ferramenta + itens iniciais |
| 2 | 40 | 2 | 1 item |
| 3 | 120 | 6 | 1 item |
| 4 | 250 | 12 | 1 item |
| 5 | 450 | 22 | **especialização** (2 caminhos, 2 itens cada) |
| 6 | 750 | 37 | receita exclusiva |
| 7 | 1.150 | 56 | 1 item |
| 8 | 1.700 | 83 | receita exclusiva |
| 9 | 2.400 | 118 | item lendário |
| 10 | 3.300 | 162 | **prestígio**: moldura dourada e título no ranking |

**Depois do nível 10:**
- **Prestígio sem fim:** cada estrela custa mais 3.300 pontos e dá só recompensas cosméticas, como uma cor do nome no ranking, uma moldura ou um título.
- **Especialização:** a partir do nível 5, o jogador escolhe o caminho **no começo de cada partida**. Por isso trocar de caminho não custa nada.

**Limite diário:**
- até **250 pontos por dia** em cada conta, o que dá umas 12 partidas;
- passando disso, a partida ainda conta para o ranking, mas não dá experiência;
- o multiplicador (seção 7) aumenta esse limite junto.

## 4. Onde a experiência fica guardada (contra trapaça)
**No Supabase, nunca no aparelho:**
- A tabela `experiencia` tem uma linha por jogador e classe, com a experiência, o nível e as estrelas de prestígio.
- Ninguém escreve direto nessa tabela. A experiência só sobe pela função `fechar_corrida(corrida)`, chamada no fim da partida.

**Como o servidor calcula:**
- As **rodadas** vêm das mochilas que o jogo já envia a cada rodada, agora com o número da partida.
- As **vitórias** contra jogadores vêm de `registrar_luta`.
- As **vitórias contra robôs** são informadas pelo jogo, mas limitadas pelo número de rodadas.
- No pior caso, um trapaceiro ganha uns 30 pontos a mais por partida, ainda preso ao limite diário.

**Sem internet:**
- O jogo funciona normalmente, mas a partida não dá experiência, do mesmo jeito que não conta para o ranking. O jogo avisa isso no começo.
- O nível fica salvo no aparelho como cópia, para mostrar a loja certa mesmo offline.

## 5. As classes atuais
Os itens atuais ficam todos no nível 1. Os novos vão sendo liberados.

### Guerreiro (texugo-do-mel), ferramenta: Insígnia do Guerreiro
| Nível | Item | Raridade | Ideia |
|---|---|---|---|
| 1 | Trombeta, Escudo Torre, Armadura de Espinhos, Machado da Fúria, Estandarte | atuais | |
| 1 | **Cantil de Campanha** (novo) | comum | vigor e uma cura pequena; preenche a falta de um item comum da classe |
| 2 | Manopla de Ferro | incomum | cada acerto de arma vizinha dá 1 de bloqueio |
| 3 | Grito de Guerra | rara | uma vez: com a vida baixa, ganha 3 de força |
| 4 | Cota de Malha | rara | bloqueio a cada 5 s, mais forte com metal vizinho |
| 5 | **Berserker:** Machado Duplo (épica, mais dano quanto menos vida) e Colar de Dentes (incomum, força ao apanhar) | | |
| 5 | **Escudeiro:** Pavês (épica, bloqueio grande que devolve dano) e Brasão (incomum, o bloqueio dura mais) | | |
| 6 | Receita: Machado da Fúria + Trombeta = **Machado do Clamor** | | |
| 7 | Martelo de Cerco | épica | lento; cada acerto atordoa um item inimigo |
| 8 | Receita: Escudo Torre + Estandarte = **Muralha** | | |
| 9 | Coroa do Campeão | lendária | força para cada vitória da partida atual |

### Mago (coruja), ferramenta: Grimório Gasto
| Nível | Item | Raridade | Ideia |
|---|---|---|---|
| 1 | Faísca, Varinha, Cristal de Mana, Orbe de Gelo, Cajado de Fogo, Bola de Fogo, Olho Arcano | atuais | |
| 2 | Vela de Estudo | comum | mana lenta; magias vizinhas agem um pouco mais rápido |
| 3 | Runa de Gelo | incomum | magias de gelo vizinhas aplicam +1 de gelo |
| 4 | Ampola de Éter | rara | uma vez: com a mana zerada, recupera 5 |
| 5 | **Piromante:** Meteorito (épica, dano em área de fogo) e Brasa Viva (incomum, a queimadura não diminui) | | |
| 5 | **Criomante:** Lança de Gelo (épica, dano a mais em inimigo congelado) e Coroa de Geada (incomum, começa com gelo no inimigo) | | |
| 6 | Receita: Orbe de Gelo + Cristal de Mana = **Prisma Gelado** | | |
| 7 | Espelho Arcano | rara | devolve parte das magias recebidas |
| 8 | Receita: Cajado de Fogo + Faísca = **Cajado Infernal** | | |
| 9 | Tomo Proibido | lendária | magias não gastam mana por 5 s, a cada 15 s |

### Ladino (hiena), ferramenta: Kit de Venenos
| Nível | Item | Raridade | Ideia |
|---|---|---|---|
| 1 | Adaga, Zarabatana, Capa das Sombras, Bomba de Fumaça, Adagas Gêmeas, Presa da Jararaca | atuais | |
| 2 | Gazua | comum | armas vizinhas ganham 10% de crítico |
| 3 | Facas de Arremesso | incomum | arma rápida que perfura bloqueio |
| 4 | Máscara de Ladrão | rara | começa a luta com esquiva |
| 5 | **Assassino:** Lâmina Oculta (épica, o primeiro golpe é crítico) e Luvas Leves (incomum, armas vizinhas mais rápidas) | | |
| 5 | **Envenenador:** Alambique (épica, o veneno do inimigo dobra a cada 8 s) e Cogumelo Tóxico (incomum, veneno barato) | | |
| 6 | Receita: Zarabatana + Frasco de Veneno = **Zarabatana da Peçonha** | | |
| 7 | Bolsa de Truques | rara | a cada 6 s, um efeito aleatório: esquiva, veneno ou crítico |
| 8 | Receita: Capa das Sombras + Bomba de Fumaça = **Véu da Noite** | | |
| 9 | Sorriso da Jaguatirica | lendária | críticos envenenam e dão esquiva |

## 6. Classes de ofício (ferramentas de artesão do D&D)
Cada classe de ofício começa com a sua **ferramenta** na mochila, e a mecânica da classe gira em torno dela e dos itens encostados.

### Onda 1

**Ferreiro (urso), ferramenta: Bigorna (2×2).**
*Têmpera:* ao fim de cada rodada, a arma ou armadura de metal mais fraca encostada na Bigorna ganha 1 nível de têmpera, que vale até o fim da partida (máximo 3 por item). Cada nível dá +1 de dano na arma ou +2 de bloqueio na armadura.

| Nível | Item | Raridade | Ideia |
|---|---|---|---|
| 1 | Martelo de Forja | comum | arma; cada acerto dá 1 de bloqueio |
| 1 | Lingote de Ferro | incomum | itens de metal vizinhos +1 de dano ou bloqueio |
| 1 | Fole | rara | armas vizinhas queimam ao acertar |
| 1 | Armadura de Placas | épica | muito bloqueio no começo, mas deixa as armas mais lentas |
| 1 | Lâmina do Mestre | lendária | +1 de dano para cada têmpera da mochila |
| 2 | Tenaz | comum | a Bigorna tempera mais um item por rodada |
| 3 | Rebites | incomum | escudos vizinhos ganham espinhos |
| 4 | Balde de Têmpera | rara | uma vez: com a vida baixa, todo o metal ganha bloqueio |
| 5 | **Armeiro:** Montante (épica, arma enorme) e Pedra de Afiar Fina (incomum, crítico em metal) | | |
| 5 | **Couraceiro:** Elmo Fechado (épica, bloqueio não some) e Escarpas (incomum, vida extra) | | |
| 6 | Receita: Martelo de Forja + Lingote de Ferro = **Martelo Rúnico** | | |
| 7 | Forja Portátil | épica | a cada 8 s, tempera um item durante a luta |
| 8 | Receita: Armadura de Placas + Rebites = **Armadura Eriçada** | | |
| 9 | Bigorna Ancestral | lendária | a têmpera vai até 5 |

**Herbalista (sapo), ferramenta: Kit de Herbalismo (1×2).**
*Cultivo:* cada erva encostada no kit ganha 1 broto por rodada, até 5. Os brotos aumentam o efeito dela (cura, veneno ou vigor). Poções encostadas no kit voltam a funcionar uma vez por luta.

| Nível | Item | Raridade | Ideia |
|---|---|---|---|
| 1 | Folha de Sálvia | comum | cura pequena e frequente |
| 1 | Raiz Amarga | incomum | veneno lento |
| 1 | Flor de Vigor | rara | vigor para as armas |
| 1 | Cogumelo Gigante | épica | regeneração crescente |
| 1 | Árvore Anciã (vaso) | lendária | todas as ervas da mochila ganham +1 broto por rodada |
| 2 | Regador | comum | ervas vizinhas crescem duas vezes mais rápido |
| 3 | Pilão | incomum | transforma a erva vizinha numa poção na próxima rodada |
| 4 | Musgo Curativo | rara | uma vez: cura bastante com a vida baixa |
| 5 | **Curandeiro:** Chá de Camomila (épica, cura em área) e Bálsamo (incomum, a cura também dá bloqueio) | | |
| 5 | **Peçonheiro:** Beladona (épica, veneno forte) e Espinheiro (incomum, espinhos venenosos) | | |
| 6 | Receita: Folha de Sálvia + Poção de Cura = **Elixir Verde** | | |
| 7 | Estufa de Vidro | épica | bolsa: ervas dentro dela não param de crescer durante a luta |
| 8 | Receita: Raiz Amarga + Frasco de Veneno = **Extrato Mortal** | | |
| 9 | Semente do Mundo | lendária | ressuscita uma vez com metade da vida |

**Cozinheiro (panda), ferramenta: Panela (2×2).**
*Cozimento:* comida encostada na Panela por 2 rodadas vira o **prato** dela, uma versão melhor: maçã vira Maçã Assada, e pão vira Torrada. Cada prato também dá um efeito que dura a luta inteira.

| Nível | Item | Raridade | Ideia |
|---|---|---|---|
| 1 | Colher de Pau | comum | arma fraca; cada acerto cura 1 |
| 1 | Temperos | incomum | comida vizinha cura +1 |
| 1 | Caldeirão de Sopa | rara | regeneração para a luta toda |
| 1 | Banquete | épica | ocupa bastante espaço; cura muito no começo |
| 1 | Livro de Receitas | lendária | todos os pratos ficam prontos em 1 rodada |
| 2 | Avental | comum | começa com bloqueio igual ao número de comidas |
| 3 | Faca de Cozinha | incomum | arma rápida que fica mais forte com comida vizinha |
| 4 | Pimenta Ardida | rara | come e ganha força, mas queima um pouco |
| 5 | **Confeiteiro:** Bolo de Festa (épica, cura e esquiva) e Mel (incomum, regeneração) | | |
| 5 | **Churrasqueiro:** Espeto Flamejante (épica, arma de fogo) e Carvão (incomum, comida vizinha queima o inimigo) | | |
| 6 | Receita: Queijo + Pão Duro = **Sanduíche** | | |
| 7 | Rolo de Massa | rara | arma lenta que atordoa |
| 8 | Receita: Ensopado + Temperos = **Ensopado da Vovó** | | |
| 9 | Fogão de Ferro | lendária | cozinha 2 comidas por rodada e cada prato cura em dobro |

### Ondas seguintes
Serão detalhadas depois que a Onda 1 estiver no jogo e equilibrada:
- **Onda 2:** Alquimista (salamandra), Coureiro (castor) e Joalheiro (pega).
- **Onda 3:** Inventor (guaxinim) e Cervejeiro (javali).
- **Outras futuras:** Necromante, Paladino, Marinheiro, Caçador e Ocultista seguem a mesma estrutura de níveis.

## 7. Preparado para vender aceleração de experiência (no futuro)
- A tabela `multiplicadores` guarda, por jogador, um multiplicador fixo (assinatura, com data de fim) e as partidas de boost restantes.
- `fechar_corrida` aplica `experiência × multiplicador`, e o limite diário sobe na mesma proporção. Hoje todos têm 1×.
- Valores de exemplo:

| Opção | Multiplicador | Nível 10 em |
|---|---|---|
| Grátis | 1× | cerca de 160 partidas |
| Assinatura | 1,5× | cerca de 105 partidas |
| Boost | 2× por 10 partidas | soma com a assinatura |

- **Só quando for vender:**
  - login com Google ou e-mail, convertendo a conta anônima sem perder o progresso;
  - Google Play Billing no celular;
  - Stripe ou Mercado Pago no PC e no navegador;
  - uma Edge Function do Supabase que confere cada compra antes de ativar o multiplicador.
- Nada disso dá força na luta, então o ranking continua justo.

## 8. Telas novas
- **Escolha de personagem:** retrato, nível, barra de experiência e o caminho escolhido (a partir do nível 5).
- **Trilha do personagem:** os níveis de 1 a 10 em coluna, com o item de cada nível, cinza enquanto bloqueado (no estilo da tela de evoluções do Baralho).
- **Fim da partida:** a experiência ganha somando na barra e o aviso "Novo item liberado!" ao subir de nível.

## 9. Ordem de construção (para depois da aprovação)
1. **Servidor:** tabelas `experiencia` e `multiplicadores`, função `fechar_corrida`, número da partida nas mochilas. Testes no PGlite e depois ao vivo. Esforço **médio**.
2. **Itens novos das 3 classes atuais** (24 itens e 6 receitas), loja filtrada por nível e robô sabendo usar. Medição de nível 1 contra nível 10. Esforço **alto**.
3. **Telas:** escolha, trilha e fim da partida. Esforço **médio**.
4. **Onda 1 das classes de ofício:** Ferreiro, Herbalista e Cozinheiro, com as mecânicas de têmpera, cultivo e cozimento. Esforço **alto**.
5. **Prompts das artes:**
   - 3 retratos;
   - 3 ferramentas;
   - cerca de 75 itens novos;
   - pintura dos 30 itens que ainda faltam da V2.

   Esforço **baixo**.

## 10. Cartas dos itens (níveis 0 a 10), planejado em 16/10/2026
Decisões do usuário:
- O nível do item **só vale fora do ranking**.
- Os carrinhos vendem por **moeda do jogo**.

**Dois modos de partida online:**
| Modo | Nível dos itens | Pontos no ranking | Experiência do personagem |
|---|---|---|---|
| **Ranqueada** | todos lutam no nível 0, como hoje | sim (10 por vitória) | sim |
| **Normal** | cada item luta no nível da sua coleção | não | sim |

**Cartas:**
- Cada item da loja tem a sua carta. As cartas sobem o item do nível 0 até o 10.
- Custo em cartas para subir cada nível: 2, 4, 6, 10, 15, 20, 30, 40, 50, 75 (252 no total).
  - A raridade muda o custo: épicos e lendários pedem menos cartas, mas as cartas deles aparecem menos.
  - Subir também custa um pouco de moeda.
- Cada nível dá **+5%** nos números do item: dano, cura, bloqueio, veneno e os outros efeitos. No nível 10 o item fica 50% mais forte.
- No modo normal, o adversário é sorteado entre mochilas com **nível médio parecido**.

**Como ganhar cartas:**
- **Partidas:** no fim da partida, cartas de itens que você usou, mais cartas por vitória, com 3 a 12 por partida.
- **Moeda do jogo (Moedas de Bronze):** cerca de 10 por rodada e 5 a mais por vitória, nos dois modos.

**Loja de cartas:**
- **Carrinho diário:** 6 ofertas que trocam à meia-noite. São cartas comuns e incomuns em pacotes pequenos, mais 1 rara.
- **Carrinho semanal:** 4 ofertas que trocam na segunda-feira, com pacotes grandes, épicas e 1 lendária.
- As ofertas são sorteadas pelo servidor para cada jogador, e cada uma só pode ser comprada uma vez.
- Mais adiante, as Moedas de Bronze podem ser vendidas por dinheiro real. Isso não afeta o ranking, porque o ranking não usa o nível dos itens.

**Servidor (tudo lá, contra trapaça):**
- **Tabelas:**
  - `colecao`: jogador, item, nível e cartas;
  - `carteira`: moedas do jogador;
  - `carrinho`: as ofertas de cada jogador no dia e na semana, e quais já foram compradas.
- **Funções:**
  - `fechar_corrida` também dá moedas e cartas;
  - `comprar_oferta`;
  - `subir_item`;
  - `minha_colecao`;
  - `meu_carrinho`.
- **Mochilas:** no modo normal, a mochila guarda o nível de cada item, e o servidor confere se esse nível é o da coleção do jogador.
- **Separação:** mochilas do modo ranqueado e do normal ficam em grupos separados no sorteio.

**Telas novas:**
- **Coleção:** grade com todas as cartas, nível e barra de cartas, e o botão Subir.
- **Loja de cartas:** abas Diário e Semanal, com um relógio até a próxima troca.
- **Lobby:** escolha entre Ranqueada e Normal.
- **Fim da partida:** cartas e moedas ganhas.
- **Itens na loja da partida e na mochila:** mostram o nível no modo normal.

**Ordem de construção:**
1. Servidor (tabelas, funções e testes). Esforço **médio**.
2. Os dois modos e o nível dos itens na luta, com medição no simulador. Esforço **médio**.
3. Telas de coleção, loja de cartas e recompensas. Esforço **alto**.
4. Pinturas das cartas: a pintura do item vira a carta, com moldura de raridade feita em código, sem arte nova. Esforço **baixo**.

## 11. Onda 1 implementada (16/10/2026)
Ferreiro, Herbalista e Cozinheiro estão no jogo, com os itens da seção 6. Mudanças em relação ao plano:
- **Têmpera:** a arma ganha +2 de dano por nível, e a armadura +3 de bloqueio.
  - A Tenaz encostada na Bigorna tempera mais um item por rodada.
  - A Bigorna Ancestral leva a têmpera até 4.
  - A Forja Portátil virou um item que dá força e bloqueio durante a luta.
- **Cultivo:** cada broto dá +25% no efeito da erva, até 5 brotos.
  - Recebem brotos as ervas encostadas no Kit, no Regador e, com a Árvore Anciã, todas as ervas da mochila.
  - Poção encostada no Kit funciona duas vezes, com 5 segundos de intervalo.
  - O Pilão ficou como apoio: +1 no efeito e as ervas vizinhas agem mais rápido.
  - A Estufa é uma bolsa.
- **Cozimento:** a comida encostada na Panela por 2 rodadas vira prato, com +60% no efeito e +4 de vida.
  - Com o Livro de Receitas, ou encostada no Fogão de Ferro, fica pronta em 1 rodada.
- **Prato e ofício na foto:** a têmpera, os brotos e o prato vão na foto da mochila, para valer também contra jogadores online.
- **Equilíbrio:** ajustado no simulador, com os números finais na resposta da publicação.

## 12. Sem especializações (16/10/2026, decisão do usuário)
- Cada personagem é **único**: não existem mais caminhos nem especializações (como Berserker e Escudeiro ou Armeiro e Couraceiro).
- Os 4 itens que eram dos caminhos foram para a trilha de níveis:
  - as duas incomuns no **nível 5**;
  - uma épica no **nível 6** e a outra no **nível 7**.
- Os níveis 5, 6 e 7 agora liberam itens novos.
