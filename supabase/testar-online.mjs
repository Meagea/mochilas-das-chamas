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
ok(proprio.status === 200 && proprio.dado.length === 0, 'A não cai contra a própria mochila');
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
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
console.log(`\nPara apagar os jogadores de teste, rode no SQL Editor:\ndelete from auth.users where id in ('${A.id}', '${B.id}');`);
