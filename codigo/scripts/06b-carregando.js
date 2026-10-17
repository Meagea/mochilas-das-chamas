// ---------- Tela de carregamento: prepara as imagens e a conexão, com uma luta de robôs passando ao fundo ----------
// O esqueleto da tela já vem no HTML (pagina/corpo.html), para aparecer antes de o jogo terminar de abrir.
const DICAS = [
  'Itens encostados se ajudam: a Pedra de Amolar dá dano às armas vizinhas.',
  'Toque e segure um item para arrastar. No computador, R gira a peça.',
  'Duas peças da mesma receita encostadas viram uma fusão no começo da luta.',
  'Perdeu a rodada? A próxima loja vem com 2 de ouro a mais.',
  'Na Ranqueada todos lutam com os itens no nível 0. Na Normal valem as suas cartas.',
  'A Bigorna do Ferreiro tempera o metal encostado nela a cada rodada.',
  'As ervas do Herbalista crescem quando ficam encostadas no Kit.',
  'Comida encostada na Panela do Cozinheiro vira prato depois de 2 rodadas.',
  'Depois dos 30 segundos de luta vem o cansaço: os dois perdem vida cada vez mais.',
  'Cada personagem sobe de nível sozinho e libera itens novos na loja dele.',
];
// a luta do fundo: dois robôs de classes sorteadas, repetindo sem parar enquanto a tela estiver aberta
function lutaDeFundo(el){
  let viva = true, r = null, i = 0, t0 = 0, lados = null;
  const nova = () => {
    const ks = Object.keys(CLASSES), sem = (Date.now() & 0xffff) + Math.floor(Math.random() * 1e6), rs = semente(sem);
    const a = sortear(ks, rs), b = sortear(ks, rs), rodada = 4 + Math.floor(rs() * 5);
    const ma = montarRobo(a, rodada, sem + 1), mb = montarRobo(b, rodada, sem + 2);
    r = lutar(ma, a, CLASSES[a].nome, mb, b, CLASSES[b].nome, sem + 3); i = 0; t0 = performance.now();
    lados = [ma, mb];
    const tam = Math.max(14, Math.min(30, Math.floor((window.innerWidth / 2 - 40) / LARG)));
    el.innerHTML = [0, 1].map(k => { const c = r.lados[k].classe, m = lados[k];
      const pecas = m.pecas.slice().sort((x, y) => ehBolsa(y) - ehBolsa(x)).map(p => `<div class="posto" style="left:${p.x * tam}px;top:${p.y * tam}px">${pecaHtml(p, tam, '')}</div>`).join('');
      return `<div class="cg-lado cg-l${k}">${retrato(c) ? `<img class="rosto" src="${retrato(c)}" alt="">` : ''}<div class="cg-vida"><i></i></div>
        <div class="mini" style="width:${LARG * tam}px;height:${ALT * tam}px">${pecas}</div></div>`; }).join('');
  };
  const passo = agora => {
    if(!viva) return;
    if(!r) nova();
    const tempo = (agora - t0) / 1000 * 1.5;   // um pouco acelerada
    while(i < r.eventos.length && r.eventos[i].t <= tempo){ const e = r.eventos[i++];
      if(e.tipo === 'ataque' || e.tipo === 'magia' || e.tipo === 'ativa'){ const p = el.querySelectorAll(`.cg-l${e.lado} .mini .peca:not(.bolsa)`)[e.item]; if(p){ p.classList.remove('age'); void p.offsetWidth; p.classList.add('age'); } }
      [0, 1].forEach(k => { const b = el.querySelector(`.cg-l${k} .cg-vida i`); if(b) b.style.width = Math.max(0, e.foto[k].vida / e.foto[k].max * 100) + '%'; }); }
    if(i >= r.eventos.length && tempo > r.duracao + 1.2) r = null;
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
  return () => { viva = false; };
}
// prepara todas as imagens (decodifica uma vez, para nada piscar depois) e testa o servidor; a barra mostra o andamento real
async function carregarJogo(){
  const tela = $('carregando'); if(!tela) return;
  const barra = tela.querySelector('.cg-barra i'), txt = tela.querySelector('.cg-txt'), inicio = performance.now();
  const fundo = urlArte('fundo-luta'); if(fundo) tela.querySelector('.cg-fundo').style.backgroundImage = `url("${fundo}")`;
  tela.querySelector('.cg-dica').textContent = DICAS[Math.floor(Math.random() * DICAS.length)];
  const progresso = (f, msg) => { barra.style.width = Math.round(f * 100) + '%'; if(msg) txt.textContent = msg; };
  let parar = () => {};
  try{ parar = lutaDeFundo(tela.querySelector('.cg-luta')); }catch(e){ /* sem luta ao fundo: só a imagem */ }
  const nomes = Object.keys(ARTE);
  for(let k = 0; k < nomes.length; k += 8){
    await Promise.all(nomes.slice(k, k + 8).map(n => new Promise(ok => { const im = new Image(); im.onload = im.onerror = ok; im.src = urlArte(n); if(im.decode) im.decode().then(ok, ok); })));
    const feitas = Math.min(nomes.length, k + 8);
    progresso(.8 * feitas / nomes.length, `Preparando imagens ${feitas}/${nomes.length}`);
  }
  progresso(.85, 'Conectando ao servidor');
  await Promise.race([onlineAmostra(1), new Promise(ok => setTimeout(ok, 4000))]);
  progresso(1, conexao.ok ? 'Pronto!' : 'Pronto! (sem conexão: jogando offline)');
  // fica pelo menos 2 s, para dar tempo de ver a tela
  await new Promise(ok => setTimeout(ok, Math.max(400, 2000 - (performance.now() - inicio))));
  desenhar();
  tela.classList.add('saindo');
  setTimeout(() => { parar(); tela.remove(); }, 600);
}
