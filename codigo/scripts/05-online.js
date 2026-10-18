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
// nomes: tolerância zero para conteúdo sexual, +18 ou ofensivo. A regra que vale é a do servidor (supabase/05-nomes.sql);
// aqui o jogo usa a mesma lista (o build copia) só para avisar na hora, antes de enviar.
const NOMES_PROIBIDOS = '__NOMES__';
const TROCA_NOME = {'0':'o', '1':'i', '3':'e', '4':'a', '5':'s', '7':'t', '8':'b', '@':'a', '$':'s', '!':'i', '|':'i'};
const nomeNormal = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[0134578@$!|]/g, c => TROCA_NOME[c]).replace(/([a-z])\1+/g, '$1');
function nomePermitido(nome){
  if(!Array.isArray(NOMES_PROIBIDOS)) return true;
  const partes = nomeNormal(String(nome || '').replace(/([a-z])([A-Z])/g, '$1 $2')), junto = partes.replace(/[^a-z0-9]/g, '');
  const palavras = partes.split(/[^a-z0-9+]+/).filter(Boolean), digitos = String(nome || '').toLowerCase().split(/[^0-9+]+/).filter(Boolean);
  return !NOMES_PROIBIDOS.some(([t, modo]) => { const n = nomeNormal(t); return modo === 'parte' ? junto.includes(n) : palavras.includes(n) || digitos.includes(t) || junto === n; });
}
// devolve true (salvo), 'proibido' (o servidor recusou o nome) ou null (sem conexão)
const onlineNome = async nome => { try{ await rpc('definir_nome', {novo_nome:nome}, true); return true; }catch(e){ return /permitido|bloqueado/.test(e.message || '') ? 'proibido' : null; } };
// corrida: o número da partida no servidor (de onlineIniciar); com ele, a rodada conta para a experiência
const onlineEnviar = (rodada, classe, foto, vitorias, vidas, corrida, modo) => tentar(() => rpc('enviar_mochila', {p_rodada:rodada, p_classe:classe, p_versao:versaoModo(modo), p_itens:foto, p_vitorias:vitorias, p_vidas:vidas, ...(corrida ? {p_corrida:corrida} : {})}, true));
// experiência (supabase/03-experiencia.sql): o servidor conta as rodadas e calcula o ganho; o jogo só informa as vitórias
const onlineIniciar = classe => tentar(() => rpc('iniciar_corrida', {p_classe:classe}, true));
const onlineFechar = (corrida, vitorias) => tentar(async () => { const L = await rpc('fechar_corrida', {p_corrida:corrida, p_vitorias:vitorias}, true); return L && L[0] || null; });
const onlineExperiencia = () => tentar(() => rpc('minha_experiencia', {}, true));
// quantos jogadores diferentes já deixaram mochila nesta rodada e o mínimo para lutar só contra gente (guardado no servidor)
const onlineAmostra = (rodada, modo) => tentar(async () => { const L = await rpc('amostra_rodada', {p_rodada:rodada, p_versao:versaoModo(modo)}, true); return L && L[0] ? {jogadores:Number(L[0].jogadores), minimo:Number(L[0].minimo)} : null; });
// jogador ou robô? Com amostra cheia, sempre jogador; abaixo dela, a chance de pegar um jogador é jogadores ÷ mínimo
const querJogador = (a, sorte) => !!a && a.jogadores > 0 && (a.minimo <= 0 || a.jogadores >= a.minimo || sorte < a.jogadores / a.minimo);
// no modo normal, o sorteio também procura nível médio de itens parecido
const onlineAdversario = (rodada, vitorias, modo, nivelMedio) => tentar(async () => { const L = await rpc('sortear_adversario', {p_rodada:rodada, p_versao:versaoModo(modo), p_vitorias:vitorias, ...(modo === 'normal' ? {p_nivel:Math.round(nivelMedio || 0)} : {})}, true); return L && L[0] || null; });
// cartas, moedas e loja (supabase/04-cartas.sql)
const onlineColecao = () => tentar(() => rpc('minha_colecao', {}, true));
const onlineSubir = item => tentar(() => rpc('subir_item', {p_item:item}, true));
const onlineCarrinho = tipo => tentar(() => rpc('meu_carrinho', {p_tipo:tipo}, true));
const onlineComprar = (tipo, vaga) => tentar(() => rpc('comprar_oferta', {p_tipo:tipo, p_vaga:vaga}, true));
const onlineLuta = (venceu, campanha) => tentar(() => rpc('registrar_luta', {p_venceu:venceu, p_campanha:campanha}, true));
const onlineRanking = () => tentar(() => rpc('ranking_temporada', {p_limite:100}, false));
