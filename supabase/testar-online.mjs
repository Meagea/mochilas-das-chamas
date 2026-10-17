// Testa o banco de verdade no Supabase, pela internet, do jeito que o jogo vai usar (só com a chave pública).
// Cria dois jogadores anônimos de teste, faz uma rodada completa e confere o que deve ser barrado.
// No fim imprime o SQL para apagar os dois jogadores de teste (rodar no SQL Editor do Supabase).
// Uso: node testar-online.mjs
const URL_BASE = 'https://cmcjktczxevgmjurmmmy.supabase.co', CHAVE = 'sb_publishable_F8TM9T4wqTFZTRBdp2xTrA_Ma6Fl8_-';
let falhas = 0;
const ok = (c, m) => { console.log((c ? 'ok    ' : 'FALHA ') + m); if(!c) falhas++; };
async function chamar(caminho, corpo, token, metodo){
  const r = await fetch(URL_BASE + caminho, {method:metodo || 'POST', headers:{apikey:CHAVE, 'Content-Type':'application/json', ...(token ? {Authorization:'Bearer ' + token} : {})}, body:corpo == null ? undefined : JSON.stringify(corpo)});
  const txt = await r.text(); let dado = null; try{ dado = JSON.parse(txt); }catch(e){ dado = txt; }
  return {status:r.status, dado};
}
const entrar = async () => { const r = await chamar('/auth/v1/signup', {}); return {token:r.dado.access_token, id:r.dado.user && r.dado.user.id, status:r.status, erro:r.dado.msg || r.dado.error_description || r.dado.message}; };

const rk0 = await chamar('/rest/v1/rpc/ranking_temporada', {p_limite:10});
ok(rk0.status === 200 && Array.isArray(rk0.dado), 'o banco responde e o ranking abre sem login (' + rk0.status + ')');
const A = await entrar(), B = await entrar();
ok(!!A.token && !!B.token, 'entrada sem cadastro funcionando' + (A.token ? '' : ' — ' + A.status + ' ' + A.erro));
if(!A.token){ console.log('\nLigue "Allow anonymous sign-ins" em Authentication > Sign In / Providers e rode de novo.'); process.exit(1); }
ok((await chamar('/rest/v1/rpc/definir_nome', {novo_nome:'Teste Claude A'}, A.token)).status < 300, 'jogador A escolheu o nome');
ok((await chamar('/rest/v1/rpc/definir_nome', {novo_nome:'Teste Claude B'}, B.token)).status < 300, 'jogador B escolheu o nome');
const itens = [{id:'espada', x:0, y:1, giro:0}, {id:'escudo', x:2, y:0, giro:90}];
const env = await chamar('/rest/v1/rpc/enviar_mochila', {p_rodada:30, p_classe:'guerreiro', p_versao:0, p_itens:itens, p_vitorias:2, p_vidas:5}, A.token);
ok(env.status === 200 && Number(env.dado) > 0, 'A enviou uma mochila (id ' + JSON.stringify(env.dado) + ')');
const adv = await chamar('/rest/v1/rpc/sortear_adversario', {p_rodada:30, p_versao:0, p_vitorias:2}, B.token);
ok(adv.status === 200 && adv.dado.length === 1 && adv.dado[0].nome === 'Teste Claude A', 'B recebeu a mochila de A no sorteio');
const proprio = await chamar('/rest/v1/rpc/sortear_adversario', {p_rodada:30, p_versao:0, p_vitorias:2}, A.token);
ok(proprio.status === 200 && !proprio.dado.some(m => Number(m.id) === Number(env.dado)), 'A não cai contra a própria mochila');  // pode vir a de um teste antigo
const luta = await chamar('/rest/v1/rpc/registrar_luta', {p_venceu:true, p_campanha:1}, B.token);
ok(luta.status === 200 && luta.dado === 10, 'B venceu e ganhou 10 pontos');
const rk = await chamar('/rest/v1/rpc/ranking_temporada', {p_limite:50});
ok(rk.dado.some(l => l.nome === 'Teste Claude B' && l.pontos === 10), 'B aparece no ranking');
// o que tem de ser barrado
const lerMochilas = await chamar('/rest/v1/mochilas?select=*', null, A.token, 'GET');
ok(lerMochilas.status >= 400 || (Array.isArray(lerMochilas.dado) && !lerMochilas.dado.length), 'ler as mochilas direto é barrado (' + lerMochilas.status + ')');
const forjar = await chamar('/rest/v1/ranking', {temporada:1, jogador_id:A.id, pontos:99999}, A.token);
ok(forjar.status >= 400, 'escrever pontos direto no ranking é barrado (' + forjar.status + ')');
const semLogin = await chamar('/rest/v1/rpc/enviar_mochila', {p_rodada:30, p_classe:'mago', p_versao:0, p_itens:[], p_vitorias:0, p_vidas:5});
ok(semLogin.status >= 400, 'enviar mochila sem login é barrado (' + semLogin.status + ')');
// experiência (03-experiencia.sql): uma partida de 1 rodada com 1 vitória vale 2 + 3 = 5
const ini = await chamar('/rest/v1/rpc/iniciar_corrida', {p_classe:'mago'}, A.token);
if(ini.status === 404) console.log('--    03-experiencia.sql ainda não rodou no Supabase: testes de experiência pulados');
else {
  ok(ini.status === 200 && Number(ini.dado) > 0, 'A começou uma partida (número ' + JSON.stringify(ini.dado) + ')');
  const env2 = await chamar('/rest/v1/rpc/enviar_mochila', {p_rodada:1, p_classe:'mago', p_versao:0, p_itens:itens, p_vitorias:0, p_vidas:3, p_corrida:ini.dado}, A.token);
  ok(env2.status === 200 && Number(env2.dado) > 0, 'mochila enviada com o número da partida');
  const fe = await chamar('/rest/v1/rpc/fechar_corrida', {p_corrida:ini.dado, p_vitorias:5}, A.token);
  ok(fe.status === 200 && fe.dado[0].ganho === 5 && fe.dado[0].xp === 5, 'fechou a partida: 1 rodada, vitórias limitadas a 1, ganhou 5 (' + JSON.stringify(fe.dado) + ')');
  const de = await chamar('/rest/v1/rpc/fechar_corrida', {p_corrida:ini.dado, p_vitorias:5}, A.token);
  ok(de.status >= 400, 'fechar a mesma partida de novo é barrado (' + de.status + ')');
  const mx = await chamar('/rest/v1/rpc/minha_experiencia', {}, A.token);
  ok(mx.status === 200 && mx.dado.length === 1 && mx.dado[0].classe === 'mago' && mx.dado[0].xp === 5, 'minha_experiencia: mago com 5');
  const outro = await chamar('/rest/v1/rpc/minha_experiencia', {}, B.token);
  ok(outro.status === 200 && outro.dado.length === 0, 'B não vê a experiência de A');
  const lerXp = await chamar('/rest/v1/experiencia?select=*', null, A.token, 'GET');
  ok(lerXp.status >= 400 || (Array.isArray(lerXp.dado) && !lerXp.dado.length), 'ler a tabela de experiência direto é barrado (' + lerXp.status + ')');
  const boost = await chamar('/rest/v1/multiplicadores?jogador_id=eq.' + A.id, {boost_partidas:99}, A.token, 'PATCH');
  ok(boost.status >= 400 || (Array.isArray(boost.dado) && !boost.dado.length), 'dar boost a si mesmo é barrado (' + boost.status + ')');
}
// cartas e loja (04-cartas.sql)
const car = await chamar('/rest/v1/rpc/meu_carrinho', {p_tipo:'dia'}, A.token);
if(car.status === 404) console.log('--    04-cartas.sql ainda não rodou no Supabase: testes de cartas pulados');
else {
  ok(car.status === 200 && car.dado.length === 6, 'carrinho diário com 6 ofertas (' + car.status + ')');
  const sem = await chamar('/rest/v1/rpc/meu_carrinho', {p_tipo:'semana'}, A.token);
  ok(sem.status === 200 && sem.dado.length === 4, 'carrinho semanal com 4 ofertas');
  const col = await chamar('/rest/v1/rpc/minha_colecao', {}, A.token);
  ok(col.status === 200 && col.dado.some(l => l.bronze > 0), 'A ganhou moedas na partida de teste (' + JSON.stringify(col.dado.find(l => !l.item)) + ')');
  const cp = await chamar('/rest/v1/rpc/comprar_oferta', {p_tipo:'semana', p_vaga:4}, A.token);
  ok(cp.status >= 400, 'comprar a lendária sem moedas é barrado (' + cp.status + ')');
  const mo = await chamar('/rest/v1/carteira', {bronze:999999}, A.token, 'POST');
  ok(mo.status >= 400, 'escrever moedas direto é barrado (' + mo.status + ')');
}
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
console.log(`\nPara apagar os jogadores de teste, rode no SQL Editor:\ndelete from auth.users where id in ('${A.id}', '${B.id}');`);
