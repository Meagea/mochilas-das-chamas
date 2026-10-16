// ---------- Online: o servidor no Supabase (mochilas dos outros jogadores e o ranking) ----------
// Só a chave pública vai no jogo: a segurança está nas regras do banco (supabase/esquema.sql). Sem internet, tudo segue offline.
const SB_URL = 'https://cmcjktczxevgmjurmmmy.supabase.co', SB_CHAVE = 'sb_publishable_F8TM9T4wqTFZTRBdp2xTrA_Ma6Fl8_-';
let sessao = temDOM ? ler('tdg-sessao', null) : null;
const conexao = {ok:null};   // null: ainda não tentou; true/false: o último pedido deu certo ou não
async function sb(caminho, corpo, token){
  if(typeof fetch === 'undefined') throw new Error('sem rede');
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, t = setTimeout(() => ctl && ctl.abort(), 6000);
  try{
    const r = await fetch(SB_URL + caminho, {method:'POST', signal:ctl && ctl.signal, headers:{apikey:SB_CHAVE, 'Content-Type':'application/json', ...(token ? {Authorization:'Bearer ' + token} : {})}, body:JSON.stringify(corpo || {})});
    const txt = await r.text(); let dado = null; try{ dado = txt ? JSON.parse(txt) : null; }catch(e){ dado = txt; }
    conexao.ok = true;
    if(r.status >= 400) throw Object.assign(new Error((dado && (dado.message || dado.msg)) || 'erro ' + r.status), {status:r.status});
    return dado;
  }catch(e){ if(!e.status) conexao.ok = false; throw e; }
  finally{ clearTimeout(t); }
}
// entra sem cadastro (uma vez) e renova a sessão quando vence
async function entrar(){
  const agora = Date.now() / 1000;
  if(sessao && sessao.exp > agora + 60) return sessao.token;
  let d = null;
  if(sessao && sessao.refresh){ try{ d = await sb('/auth/v1/token?grant_type=refresh_token', {refresh_token:sessao.refresh}); }catch(e){ if(!e.status) throw e; d = null; } }
  if(!d) d = await sb('/auth/v1/signup', {});
  sessao = {token:d.access_token, refresh:d.refresh_token, exp:agora + (d.expires_in || 3600), id:d.user && d.user.id};
  guardar('tdg-sessao', sessao);
  return sessao.token;
}
const rpc = async (nome, args, login) => sb('/rest/v1/rpc/' + nome, args, login ? await entrar() : null);
// cada função devolve null quando não deu (sem internet, servidor fora): quem chama segue offline
const tentar = async f => { try{ return await f(); }catch(e){ return null; } };
const onlineNome = nome => tentar(() => rpc('definir_nome', {novo_nome:nome}, true).then(() => true));
// corrida: o número da partida no servidor (de onlineIniciar); com ele, a rodada conta para a experiência
const onlineEnviar = (rodada, classe, foto, vitorias, vidas, corrida) => tentar(() => rpc('enviar_mochila', {p_rodada:rodada, p_classe:classe, p_versao:VERSAO_REGRAS, p_itens:foto, p_vitorias:vitorias, p_vidas:vidas, ...(corrida ? {p_corrida:corrida} : {})}, true));
// experiência (supabase/03-experiencia.sql): o servidor conta as rodadas e calcula o ganho; o jogo só informa as vitórias
const onlineIniciar = classe => tentar(() => rpc('iniciar_corrida', {p_classe:classe}, true));
const onlineFechar = (corrida, vitorias) => tentar(async () => { const L = await rpc('fechar_corrida', {p_corrida:corrida, p_vitorias:vitorias}, true); return L && L[0] || null; });
const onlineExperiencia = () => tentar(() => rpc('minha_experiencia', {}, true));
// quantos jogadores diferentes já deixaram mochila nesta rodada e o mínimo para lutar só contra gente (guardado no servidor)
const onlineAmostra = rodada => tentar(async () => { const L = await rpc('amostra_rodada', {p_rodada:rodada, p_versao:VERSAO_REGRAS}, true); return L && L[0] ? {jogadores:Number(L[0].jogadores), minimo:Number(L[0].minimo)} : null; });
// jogador ou robô? Com amostra cheia, sempre jogador; abaixo dela, a chance de pegar um jogador é jogadores ÷ mínimo
const querJogador = (a, sorte) => !!a && a.jogadores > 0 && (a.minimo <= 0 || a.jogadores >= a.minimo || sorte < a.jogadores / a.minimo);
const onlineAdversario = (rodada, vitorias) => tentar(async () => { const L = await rpc('sortear_adversario', {p_rodada:rodada, p_versao:VERSAO_REGRAS, p_vitorias:vitorias}, true); return L && L[0] || null; });
const onlineLuta = (venceu, campanha) => tentar(() => rpc('registrar_luta', {p_venceu:venceu, p_campanha:campanha}, true));
const onlineRanking = () => tentar(() => rpc('ranking_temporada', {p_limite:100}, false));
