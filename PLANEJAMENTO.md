# Tralha de Guerra: planejamento

Jogo próprio, fora da Bonfire Tales. Inspirado em Backpack Battles: entre as rodadas você compra itens e encaixa na mochila; depois a luta acontece sozinha, contra a mochila que outro jogador montou naquela mesma rodada. Online assíncrono com ranking, e offline quando não houver internet.

## 1. Uma corrida
- Você escolhe uma **classe** e começa com uma mochila pequena, um pouco de ouro e o item inicial da classe.
- Cada **rodada** tem duas partes:
  1. **Loja:** aparecem 5 itens à venda. Você compra, vende, gira e arruma os itens na mochila. Pode trocar a vitrine pagando 1 de ouro (o preço sobe a cada troca na mesma rodada).
  2. **Luta:** contra a mochila de outro jogador que estava na mesma rodada (ou uma do próprio jogo, offline). A luta é automática e dura até um dos dois cair.
- A corrida termina com **10 vitórias** (você venceu a corrida) ou **5 derrotas** (as 5 vidas acabam). Cada rodada dá ouro, e um pouco mais a cada derrota seguida, para quem está perdendo se recuperar.
- No máximo 18 rodadas por corrida.

## 2. A mochila
- É uma **grade**. Começa com 3 × 3 casas usáveis.
- **Bolsas** são itens que aumentam o espaço: uma Bolsa de Couro abre um bloco de casas novas onde for colocada. Itens só funcionam dentro do espaço aberto.
- Cada item tem um **formato** (1 × 1, 1 × 2, 2 × 2, em L…) e pode ser **girado** em 90°.
- **Vizinhança:** muitos itens têm estrelas nas bordas. Um item que encosta numa estrela ganha um efeito (ex.: Pedra de Amolar ao lado de uma arma dá +1 de dano a ela). É o coração das escolhas.
- **Arrastar e soltar** no computador e no celular; no celular, tocar no item mostra o que ele faz.

## 3. Os itens (cerca de 60 na primeira versão)
Cada item tem raridade (comum, incomum, rara, épica, lendária), preço, formato e uma das funções:
- **Armas:** atacam sozinhas a cada X segundos (o tempo de recarga), gastando vigor. Espada, machado, adaga, arco, cajado…
- **Defesa:** escudos e armaduras dão bloqueio ou reduzem dano.
- **Comida e poções:** curam, dão vigor ou tiram efeitos ruins, de tempos em tempos ou uma vez só.
- **Acessórios:** amuletos, anéis e pedras que dão efeitos contínuos ou fortalecem os vizinhos.
- **Bolsas:** aumentam a mochila; algumas fortalecem o que está dentro delas.
- **Combinações:** dois itens certos encostados podem ser **fundidos** na loja num item mais forte (ex.: Espada + Pedra de Fogo = Lâmina Flamejante). Algumas receitas são secretas.

Itens só da classe aparecem na loja daquela classe. Itens mais raros só começam a aparecer nas rodadas mais avançadas.

## 4. As classes (3 na primeira versão)
Fantasia clássica, sem o mundo de Cinéria. A arte do Baralho entra só como provisória, até os personagens próprios:
- **Guerreiro:** bloqueio, força e armas pesadas. Item inicial: Brasa no Peito (cura ao longo da luta).
- **Mago:** queimadura e magia em área, com recarga lenta e golpes fortes. Item inicial: Cajado Antigo.
- **Ladino:** veneno, golpes rápidos e críticos. Item inicial: Bolsa de Adagas.

Cada classe também escolhe uma **especialização** na rodada 8, que traz itens únicos (ex.: Guerreiro → Escudeiro ou Berserker).

## 5. A luta
- Os dois personagens ficam frente a frente, com a vida e os efeitos em cima. Os itens das duas mochilas "trabalham" sozinhos, cada um no seu tempo, e piscam ao agir.
- Efeitos: **Bloqueio**, **Força**, **Queimadura** (dano ao longo do tempo), **Veneno**, **Vigor** (energia das armas), **Cura**, **Atordoar**, **Esquiva**.
- **Cansaço:** depois de 30 segundos de luta, os dois começam a perder vida cada vez mais, para nenhuma luta durar para sempre.
- A luta é **determinística a partir de uma semente**: a mesma mochila contra a mesma mochila com a mesma semente dá sempre o mesmo resultado. Isso deixa o servidor conferir lutas suspeitas no futuro.
- Botões para acelerar (1×, 2×, 4×) e pular a luta.

## 6. Online e ranking (servidor já pronto no Supabase)
- O jogador entra sem cadastro e escolhe um nome.
- Ao terminar a loja de cada rodada, a mochila é enviada; o jogo recebe a de outro jogador da mesma rodada, com campanha parecida.
- Cada vitória online vale **10 pontos** no **ranking da temporada** (60 dias). Derrota não tira pontos. Até 60 lutas pontuadas por dia.
- Tela de ranking com os 100 primeiros e a sua posição.
- **Sem internet** (ou se o servidor estiver fora do ar): o jogo segue sozinho, contra mochilas montadas pelo próprio jogo, e avisa que essas lutas não contam para o ranking.

## 7. Contra quem se luta quando ainda não há jogadores
Um **robô** joga a loja com as mesmas regras e monta mochilas para cada rodada e classe. Ele serve para três coisas: o modo offline, as primeiras semanas online (quando ainda há poucas mochilas de gente) e os testes de balanceamento (como no simulador do Baralho).

## 8. Progressão entre corridas
- **Coleção:** cada item novo encontrado entra no compêndio.
- **Conquistas** simples (vencer com cada classe, fundir 10 receitas, chegar a 10 vitórias sem derrota).
- Sem moeda de compra e sem vantagem permanente: no ranking, todo mundo começa igual a cada corrida.

## 9. Visual e telas
- Identidade própria, colorida e bem-humorada (proposta abaixo), sem ligação com a Bonfire Tales. Sem emojis: ícones desenhados.
- Telas: lobby (classe, jogar, ranking, coleção), loja + mochila (a tela principal), luta e fim de corrida.
- Arte: começa com os ícones pintados que já temos nos outros jogos; depois, uma pintura por item (prompts meus, você gera), no mesmo estilo dos emblemas do Baralho.
- Celular em pé como prioridade: a mochila em cima, a loja embaixo.

## 10. Tecnologia
- Mesmo padrão dos outros jogos: partes em `codigo/`, montadas num HTML único por `node codigo/build.js`; esteira com artefato, APK, instalador de Windows e Release no GitHub.
- Online pelo Supabase (projeto `cmcjktczxevgmjurmmmy`), só com a chave pública. Testes do banco em `supabase/testar.mjs` (local) e `supabase/testar-online.mjs` (no ar).
- Testes do jogo: simulador de corridas com o robô (balanceamento por classe) e conferência da luta determinística.

## 11. Ordem de construção
1. Grade da mochila, itens com formato, girar, arrastar, bolsas e vizinhança.
2. Loja e ouro.
3. Luta automática com os efeitos, e o robô.
4. Corrida completa offline (10 vitórias ou 5 derrotas).
5. Online: envio e sorteio de mochilas, ranking.
6. Lobby, coleção, conquistas e polimento; depois a arte própria.

## Decisões em aberto
- **Classes:** começar com as 3 do Baralho ou outras.
- **Duração da corrida:** 10 vitórias / 5 derrotas, como no jogo de referência, ou mais curta para o celular (ex.: 7 vitórias / 3 derrotas).

## Identidade visual (proposta)
- **Clima:** aventura de taverna, com humor. Os itens parecem adesivos: contorno grosso, cores chapadas e um brilho simples.
- **Paleta:** couro e pergaminho na base, com cores vivas nos destaques.
  - fundo e madeira:  (madeira escura) e  (couro);
  - painéis:  (pergaminho);
  - destaques:  (ouro),  (vermelho),  (azul aço),  (verde);
  - texto:  sobre pergaminho,  sobre madeira.
- **Raridades:** comum cinza, incomum verde, rara azul, épica roxa, lendária dourada (borda do item na mochila e na loja).
- **Fontes (Google Fonts):** Lilita One nos títulos (gorda e divertida) e Nunito no texto.
- **Logo:** "TRALHA DE GUERRA" numa etiqueta de couro costurada, presa numa mochila estufada com o cabo de uma espada saindo pela tampa.
- **Ícone do app:** a mochila com a espada, sem texto.
