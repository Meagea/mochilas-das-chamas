// Uso: cd mochila-da-fogueira/supabase && npm install && node testar.mjs esquema.sql   (Postgres embutido, nada a instalar no sistema)
// Testa o esquema.sql num Postgres embutido (PGlite), imitando o que o Supabase tem: os papéis anon e authenticated,
// o esquema auth com auth.users e auth.uid(), e as permissões padrão nas tabelas (quem protege é a RLS).
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
const SQL = fs.readFileSync(process.argv[2], 'utf8');
const db = new PGlite();
let falhas = 0;
const ok = (c, m) => { console.log((c ? 'ok    ' : 'FALHA ') + m); if(!c) falhas++; };
const erro = async (sql, m) => { try{ await db.exec(sql); ok(false, m + ' (deveria ter sido barrado)'); }catch(e){ ok(true, m + ' → barrado: ' + e.message.split('\n')[0]); } };

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  -- como no projeto criado sem "Automatically expose new tables": nenhuma permissão automática nas tabelas

`);
await db.exec(SQL); ok(true, 'esquema.sql rodou');
const AMOSTRA = fs.readFileSync(new URL('./02-amostra-robos.sql', import.meta.url), 'utf8'); await db.exec(AMOSTRA); await db.exec(AMOSTRA); ok(true, '02-amostra-robos.sql rodou (duas vezes)');
const XP = fs.readFileSync(new URL('./03-experiencia.sql', import.meta.url), 'utf8'); await db.exec(XP); await db.exec(XP); ok(true, '03-experiencia.sql rodou (duas vezes)');
const CARTAS = fs.readFileSync(new URL('./04-cartas.sql', import.meta.url), 'utf8'); await db.exec(CARTAS); await db.exec(CARTAS); ok(true, '04-cartas.sql rodou (duas vezes)');
await db.exec(SQL); ok(true, 'esquema.sql rodou de novo (pode repetir sem estragar)');
const NOMES = fs.readFileSync(new URL('./05-nomes.sql', import.meta.url), 'utf8'); await db.exec(NOMES); await db.exec(NOMES); ok(true, '05-nomes.sql rodou (duas vezes)');
const RANKED = fs.readFileSync(new URL('./06-ranked.sql', import.meta.url), 'utf8'); await db.exec(RANKED); await db.exec(RANKED); ok(true, '06-ranked.sql rodou (duas vezes)');

const U1 = '11111111-1111-1111-1111-111111111111', U2 = '22222222-2222-2222-2222-222222222222';
await db.exec(`insert into auth.users values ('${U1}'), ('${U2}')`);
const como = async (uid, sql, params) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid || ''}', false); set role ${uid ? 'authenticated' : 'anon'};`);
  try{ return (await db.query(sql, params || [])).rows; } finally { await db.exec('reset role'); }
};
const itens = JSON.stringify([{id:'espada', x:0, y:1, giro:0}, {id:'escudo', x:2, y:0, giro:90}]);

await como(U1, `select definir_nome('Mirelle')`);
await como(U2, `select definir_nome('Torvald')`);
ok((await como(null, `select nome from jogadores order by nome`)).map(r => r.nome).join(',') === 'Mirelle,Torvald', 'nomes gravados e visíveis');
const id1 = (await como(U1, `select enviar_mochila(3, 'guerreiro', 1, $1::jsonb, 2, 5) as id`, [itens]))[0].id;
ok(id1 > 0, 'Mirelle enviou a mochila da rodada 3');
ok((await como(U1, `select * from sortear_adversario(3, 1, 2)`)).length === 0, 'ninguém luta contra a própria mochila');
const adv = await como(U2, `select * from sortear_adversario(3, 1, 2)`);
ok(adv.length === 1 && adv[0].nome === 'Mirelle' && adv[0].itens.length === 2, 'Torvald recebe a mochila da Mirelle');
ok((await como(U2, `select * from sortear_adversario(4, 1, 0)`)).length === 0, 'rodada sem mochilas: nada (o jogo usa as do próprio jogo)');
let pts; for(let i = 0; i < 3; i++) pts = (await como(U2, `select registrar_luta(true, 3) as p`))[0].p;
await como(U2, `select registrar_luta(false, 3)`);
{ const l = (await db.query(`select vitorias, derrotas, pontos from ranking where jogador_id = '${U2}'`)).rows[0];
  ok(l.vitorias === 3 && l.derrotas === 1 && l.pontos === 0, 'luta online conta vitórias e derrotas, sem pontos de liga (' + JSON.stringify(l) + ')'); }
const rk = await como(null, `select * from ranking_temporada(10)`);
ok(rk.length === 0, 'ranking só mostra quem já fez corrida ranqueada');
for(let i = 0; i < 70; i++) pts = (await como(U1, `select registrar_luta(true, 1) as p`))[0].p;
ok(Number((await db.query(`select lutas_hoje from ranking where jogador_id = '${U1}'`)).rows[0].lutas_hoje) === 60, 'teto de 60 lutas por dia');
for(let i = 0; i < 305; i++) await como(U1, `select enviar_mochila(5, 'mago', 1, $1::jsonb, 0, 5)`, [itens]);
ok(Number((await db.query(`select count(*) c from mochilas where rodada = 5`)).rows[0].c) === 300, 'só as 300 mochilas mais recentes da rodada ficam');

{ const a = await como(U2, `select * from amostra_rodada(3, 1)`); ok(Number(a[0].jogadores) === 1 && a[0].minimo === 20, 'amostra da rodada: 1 jogador, mínimo 20'); }
{ const a = await como(U1, `select * from amostra_rodada(3, 1)`); ok(Number(a[0].jogadores) === 0, 'a própria mochila não conta na amostra'); }
// o que não pode
await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; update config set valor = 0;`, 'jogador mudando o mínimo de robôs'); await db.exec('reset role');
await erro(`select set_config('request.jwt.claim.sub', '', false); set role anon; select enviar_mochila(1, 'mago', 1, '[]'::jsonb, 0, 5);`, 'visitante sem login enviando mochila');
await db.exec('reset role');
await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; insert into ranking (temporada, jogador_id, pontos) values (1, '${U1}', 99999);`, 'escrever pontos direto no ranking');
await db.exec('reset role');
await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; update jogadores set nome = 'Hacker' where id = '${U2}';`.replace("update", "update"), 'renomear outro jogador');
await db.exec('reset role');
ok((await db.query(`select nome from jogadores where id = '${U2}'`)).rows[0].nome === 'Torvald', 'o nome do outro continua igual');
{ let n = null; try{ n = (await como(U1, `select count(*) c from mochilas`))[0].c; }catch(e){ n = 'barrado'; } ok(n === 'barrado' || n == 0, 'mochilas não são lidas direto, só pelo sorteio (' + n + ')'); }
await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; select definir_nome('x');`, 'nome com 1 letra');
await db.exec('reset role');
await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; select enviar_mochila(99, 'mago', 1, '[]'::jsonb, 0, 5);`, 'rodada impossível (99)');
await db.exec('reset role');

// ---- experiência (03-experiencia.sql) ----
{
  const voltarRelogio = async c => db.exec(`update corridas set ultima_rodada_em = now() - interval '1 minute' where id = ${c}`);
  const jogarCorrida = async (uid, classe, rodadas, vit) => {
    const c = (await como(uid, `select iniciar_corrida($1) as c`, [classe]))[0].c;
    for(let r = 1; r <= rodadas; r++){ await como(uid, `select enviar_mochila($1, $2, 1, $3::jsonb, 0, 3, $4)`, [r, classe, itens, c]); await voltarRelogio(c); }
    return {c, f:(await como(uid, `select * from fechar_corrida($1, $2)`, [c, vit]))[0]};
  };
  const rodadasDe = async c => Number((await db.query(`select rodadas from corridas where id = ${c}`)).rows[0].rodadas);
  const c = (await como(U2, `select iniciar_corrida('guerreiro') as c`))[0].c;
  for(const r of [1, 2]){ await como(U2, `select enviar_mochila($1, 'guerreiro', 1, $2::jsonb, 0, 3, $3)`, [r, itens, c]); await voltarRelogio(c); }
  await como(U2, `select enviar_mochila(3, 'guerreiro', 1, $1::jsonb, 0, 3, $2)`, [itens, c]);
  await como(U2, `select enviar_mochila(4, 'guerreiro', 1, $1::jsonb, 0, 3, $2)`, [itens, c]);
  ok(await rodadasDe(c) === 3, 'rodada enviada logo em seguida da anterior (menos de 3 s) não conta');
  await voltarRelogio(c);
  await como(U2, `select enviar_mochila(6, 'guerreiro', 1, $1::jsonb, 0, 3, $2)`, [itens, c]);
  await como(U2, `select enviar_mochila(4, 'mago', 1, $1::jsonb, 0, 3, $2)`, [itens, c]);
  ok(await rodadasDe(c) === 3, 'rodada pulada ou de outra classe não conta');
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; select fechar_corrida(${c}, 7);`, 'fechar a partida de outro jogador'); await db.exec('reset role');
  const f = (await como(U2, `select * from fechar_corrida($1, 9)`, [c]))[0];
  ok(f.ganho === 15 && f.xp === 15, '3 rodadas com "9 vitórias" viram 3 vitórias: 6 + 9 = 15 (' + f.ganho + ')');
  await erro(`select set_config('request.jwt.claim.sub', '${U2}', false); set role authenticated; select fechar_corrida(${c}, 1);`, 'fechar a mesma partida duas vezes'); await db.exec('reset role');
  const g = (await jogarCorrida(U2, 'guerreiro', 9, 0)).f;
  ok(g.ganho === 36, '9 rodadas com "0 vitórias" contam 6 (no máximo 3 derrotas): 18 + 18 = 36 (' + g.ganho + ')');
  const h = (await jogarCorrida(U2, 'mago', 9, 7)).f;
  ok(h.ganho === 49 && h.xp === 49, '7 vitórias em 9 rodadas: 18 + 21 + 10 = 49 (' + h.ganho + ')');
  const ex = await como(U2, `select * from minha_experiencia() order by classe`);
  ok(ex.length === 2 && ex[0].classe === 'guerreiro' && ex[0].xp === 51 && ex[0].partidas === 2 && ex[1].xp === 49 && Number(ex[0].multiplicador) === 1, 'minha_experiencia: guerreiro 51, mago 49, multiplicador 1');
  ok((await como(U1, `select * from minha_experiencia()`)).length === 0, 'cada um só vê a própria experiência');
  ok((await jogarCorrida(U2, 'ladino', 0, 7)).f.ganho === 0, 'partida sem rodadas não dá experiência');
  // boost: 2× por 2 partidas
  await db.exec(`update multiplicadores set boost_partidas = 2 where jogador_id = '${U2}'`);
  const b1 = (await jogarCorrida(U2, 'ladino', 5, 3)).f;
  ok(b1.ganho === 38 && Number(b1.multiplicador) === 2, 'boost dobra: (10 + 9) × 2 = 38 (' + b1.ganho + ')');
  await jogarCorrida(U2, 'ladino', 5, 3);
  const b3 = (await jogarCorrida(U2, 'ladino', 5, 3)).f;
  ok(b3.ganho === 19 && Number(b3.multiplicador) === 1, 'boost acaba depois das 2 partidas (' + b3.ganho + ')');
  // limite do dia: 250
  let ult; for(let i = 0; i < 6; i++) ult = (await jogarCorrida(U2, 'mago', 9, 7)).f;
  const hoje = Number((await db.query(`select xp_hoje from multiplicadores where jogador_id = '${U2}'`)).rows[0].xp_hoje);
  ok(hoje === 250 && ult.ganho === 0 && ult.limite_hoje === 0, 'limite de 250 por dia (' + hoje + ')');
  await db.exec(`update multiplicadores set dia = current_date - 1 where jogador_id = '${U2}'`);
  ok((await jogarCorrida(U2, 'mago', 9, 7)).f.ganho === 49, 'no dia seguinte volta a ganhar');
  // assinatura 1,5× também sobe o limite
  await db.exec(`update multiplicadores set assinatura_ate = now() + interval '30 days', dia = current_date - 1 where jogador_id = '${U2}'`);
  const s1 = (await jogarCorrida(U2, 'mago', 9, 7)).f;
  ok(s1.ganho === 73 && s1.limite_hoje === 375 - 73, 'assinatura: 49 × 1,5 = 73 e limite de 375 (' + s1.ganho + ', resta ' + s1.limite_hoje + ')');
  // o que não pode
  await erro(`select set_config('request.jwt.claim.sub', '${U2}', false); set role authenticated; update experiencia set xp = 99999;`, 'escrever experiência direto'); await db.exec('reset role');
  await erro(`select set_config('request.jwt.claim.sub', '${U2}', false); set role authenticated; update multiplicadores set boost_partidas = 99;`, 'dar boost a si mesmo'); await db.exec('reset role');
  await erro(`select set_config('request.jwt.claim.sub', '${U2}', false); set role authenticated; select xp from experiencia;`, 'ler a tabela de experiência direto'); await db.exec('reset role');
  await erro(`select set_config('request.jwt.claim.sub', '', false); set role anon; select iniciar_corrida('mago');`, 'visitante sem login começando partida'); await db.exec('reset role');
  await erro(`select set_config('request.jwt.claim.sub', '${U2}', false); set role authenticated; select iniciar_corrida('Mago; drop');`, 'classe inválida'); await db.exec('reset role');
  ok((await como(U1, `select enviar_mochila(2, 'mago', 1, $1::jsonb, 0, 5) as id`, [itens]))[0].id > 0, 'enviar_mochila antiga (jogo V2) continua funcionando');
}

// ---- cartas, moedas e loja (04-cartas.sql) ----
{
  const col = async uid => { const L = await como(uid, `select * from minha_colecao()`); return {bronze:L[0] ? L[0].bronze : null, itens:Object.fromEntries(L.filter(l => l.item).map(l => [l.item, l]))}; };
  const c2 = await col(U2);
  ok(c2.bronze > 0 && Object.keys(c2.itens).length > 0, 'as corridas fechadas deram moedas (' + c2.bronze + ') e cartas (' + Object.values(c2.itens).reduce((a, l) => a + l.cartas, 0) + ')');
  ok((await col(U1)).bronze === null, 'quem não jogou ainda não tem carteira, mas a coleção abre');
  // uma corrida com mochila de itens de verdade: as cartas vêm das peças dela
  const cc = (await como(U1, `select iniciar_corrida('guerreiro') as c`))[0].c;
  const reais = JSON.stringify([{id:'mochila', x:3, y:2, g:0}, {id:'clava', x:3, y:2, g:0}, {id:'maca', x:4, y:2, g:0}]);
  await como(U1, `select enviar_mochila(1, 'guerreiro', 2, $1::jsonb, 0, 3, $2)`, [reais, cc]);
  const fc = (await como(U1, `select * from fechar_corrida($1, 1)`, [cc]))[0];
  ok(fc.bronze === 15 && Object.keys(fc.cartas).every(k => k === 'clava' || k === 'maca') && Object.values(fc.cartas).reduce((a, b) => a + b, 0) === 4, '1 rodada e 1 vitória: 15 moedas e 4 cartas da clava/maçã (' + JSON.stringify(fc.cartas) + ')');
  // loja
  const d1 = await como(U1, `select * from meu_carrinho('dia')`), d2 = await como(U1, `select * from meu_carrinho('dia')`);
  ok(d1.length === 6 && JSON.stringify(d1.map(o => o.item)) === JSON.stringify(d2.map(o => o.item)), 'carrinho diário: 6 ofertas, iguais até a troca');
  ok(new Set(d1.map(o => o.item)).size === 6, 'carrinho sem item repetido');
  const s1 = await como(U1, `select * from meu_carrinho('semana')`);
  ok(s1.length === 4 && s1[3].qtd === 4 && s1[0].qtd === 40, 'carrinho semanal: 4 pacotes grandes, com lendária (' + s1.map(o => o.qtd).join(',') + ')');
  ok((await como(U2, `select * from meu_carrinho('dia')`)).length === 6, 'cada jogador tem o seu carrinho');
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; select comprar_oferta('dia', 1);`, 'comprar sem moedas suficientes'); await db.exec('reset role');
  await db.exec(`update carteira set bronze = 5000 where jogador_id = '${U1}'`);
  const antes = (await col(U1)).itens[d1[0].item], saldo = (await como(U1, `select comprar_oferta('dia', 1) as s`))[0].s;
  const depois = (await col(U1)).itens[d1[0].item];
  ok(saldo === 5000 - d1[0].preco && depois.cartas === (antes ? antes.cartas : 0) + d1[0].qtd, 'comprou a oferta: cobrou ' + d1[0].preco + ' e deu ' + d1[0].qtd + ' cartas');
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; select comprar_oferta('dia', 1);`, 'comprar a mesma oferta duas vezes'); await db.exec('reset role');
  // subir de nível
  await db.exec(`insert into colecao (jogador_id, item, cartas) values ('${U1}', 'espadaLonga', 3) on conflict (jogador_id, item) do update set cartas = 3`);
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; select subir_item('espadaLonga'), subir_item('espadaLonga');`, 'subir sem cartas suficientes (rara: 2 e depois 4)'); await db.exec('reset role');
  const nv = (await como(U1, `select subir_item('espadaLonga') as n`))[0].n, ce = (await col(U1)).itens.espadaLonga;
  ok(nv === 1 && ce.nivel === 1 && ce.cartas === 1, 'espada longa no nível 1: gastou 2 cartas (sobrou ' + ce.cartas + ')');
  await db.exec(`update colecao set cartas = 9999 where jogador_id = '${U1}' and item = 'clava'`);
  for(let i = 0; i < 10; i++) await como(U1, `select subir_item('clava')`);
  ok((await col(U1)).itens.clava.nivel === 10, 'clava chegou ao nível 10');
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; select subir_item('clava');`, 'passar do nível 10'); await db.exec('reset role');
  // modo normal: o nível da mochila é cortado pela coleção; ranqueada não leva nível
  await db.exec(`update colecao set nivel = 2 where jogador_id = '${U1}' and item = 'clava'`);
  const nm = JSON.stringify([{id:'mochila', x:3, y:2, g:0}, {id:'clava', x:3, y:2, g:0, n:9}, {id:'maca', x:4, y:2, g:0, n:3}]);
  const idn = (await como(U1, `select enviar_mochila(4, 'guerreiro', 1002, $1::jsonb, 0, 3, null) as id`, [nm]))[0].id;
  const gn = (await db.query(`select itens, nivel_medio from mochilas where id = ${idn}`)).rows[0];
  ok(gn.itens.find(e => e.id === 'clava').n === 2 && gn.itens.find(e => e.id === 'maca').n === 0 && gn.nivel_medio === 1, 'normal: clava "9" vira 2, maçã "3" vira 0, média 1');
  const idr = (await como(U1, `select enviar_mochila(4, 'guerreiro', 2, $1::jsonb, 0, 3, null) as id`, [nm]))[0].id;
  ok((await db.query(`select itens from mochilas where id = ${idr}`)).rows[0].itens.every(e => !('n' in e)), 'ranqueada: a mochila não leva nível');
  const sn = await como(U2, `select * from sortear_adversario(4, 1002, 0, 1)`);
  ok(sn.length === 1 && sn[0].itens.some(e => e.n === 2), 'sorteio do modo normal só pega mochila do modo normal');
  ok((await como(U2, `select * from sortear_adversario(4, 2, 0)`)).every(m => m.itens.every(e => !('n' in e))), 'sorteio da ranqueada não mistura com o normal');
  // o que não pode
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; update carteira set bronze = 999999;`, 'escrever moedas direto'); await db.exec('reset role');
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; insert into colecao (jogador_id, item, nivel) values ('${U1}', 'martelo', 10);`, 'escrever coleção direto'); await db.exec('reset role');
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; select dar_cartas('${U1}', 'martelo', 999);`, 'chamar dar_cartas de fora'); await db.exec('reset role');
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; update carrinho set preco = 0;`, 'mudar preço do carrinho'); await db.exec('reset role');
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; select * from meu_carrinho('mes');`, 'carrinho que não existe'); await db.exec('reset role');
}

// ---- nomes permitidos e bloqueio (05-nomes.sql) ----
{
  const pode = async n => (await db.query(`select nome_permitido($1) as ok`, [n])).rows[0].ok;
  const bons = ['Mirelle', 'Torvald', 'Paulo', 'Bob', 'Alex', 'Lucas', 'Paulo Brasil Jr', 'Mestre Pintas', 'Ana Clara', 'Rolando', 'Picasso', 'Cupido', 'Mundinho', 'Assis', 'Computador', 'Disputa', 'Teste Claude A'];
  const ruins = ['P0rn0', 's3x0', 'Putaria', 'BigPau', 'p.u.t.a', 'Sexy Girl', 'XOXOTA', 'Buceeeeta', 'Gostosa22', 'Lucas69', '+18 gamer', 'F u c k', 'Puta', 'pica doce', 'OnlyFans', 'hentai', 'nudes', 'Safadinha', 'C4r4lh0'];
  const errosBons = []; for(const n of bons) if(!(await pode(n))) errosBons.push(n);
  const errosRuins = []; for(const n of ruins) if(await pode(n)) errosRuins.push(n);
  ok(!errosBons.length, 'nomes normais passam' + (errosBons.length ? ' (barrou: ' + errosBons.join(', ') + ')' : ''));
  ok(!errosRuins.length, 'nomes proibidos são barrados, mesmo disfarçados' + (errosRuins.length ? ' (passou: ' + errosRuins.join(', ') + ')' : ''));
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; select definir_nome('S3xy Lady');`, 'definir nome proibido'); await db.exec('reset role');
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; insert into nomes_proibidos values ('teste', 'parte');`, 'jogador mexendo na lista de nomes'); await db.exec('reset role');
  await db.exec(`update jogadores set bloqueado = true where id = '${U2}'`);
  await erro(`select set_config('request.jwt.claim.sub', '${U2}', false); set role authenticated; select definir_nome('Novo Nome');`, 'jogador bloqueado mudando o nome'); await db.exec('reset role');
  ok(!(await como(null, `select * from ranking_temporada(50)`)).some(r => r.nome === 'Torvald'), 'jogador bloqueado some do ranking');
  ok((await como(U2, `select registrar_luta(true, 1) as p`))[0].p === 0, 'jogador bloqueado não pontua');
  await db.exec(`update jogadores set bloqueado = false where id = '${U2}'`);
}

// ---- ranked com ligas (06-ranked.sql) ----
{
  const relogio = async c => db.exec(`update corridas set ultima_rodada_em = now() - interval '1 minute' where id = ${c}`);
  const corrida = async (uid, modo, rodadas, vit) => {
    const c = (await como(uid, `select iniciar_corrida('mago', $1) as c`, [modo]))[0].c;
    for(let r = 1; r <= rodadas; r++){ await como(uid, `select enviar_mochila($1, 'mago', 9, '[]'::jsonb, 0, 3, $2)`, [r, c]); await relogio(c); }
    return (await como(uid, `select * from fechar_corrida($1, $2)`, [c, vit]))[0];
  };
  const meu = async uid => (await como(uid, `select * from meu_rank()`))[0];
  await db.exec(`update multiplicadores set dia = current_date - 1, xp_hoje = 0`);
  const f1 = await corrida(U1, 'ranqueada', 9, 7);
  ok(f1.rank_antes === 0 && f1.rank_depois === 104, 'Bronze, 7 vitórias: 84 + 20 = 104 pontos (' + f1.rank_antes + ' → ' + f1.rank_depois + ')');
  const f2 = await corrida(U1, 'normal', 9, 7);
  ok(f2.rank_antes === null && Number((await meu(U1)).pontos) === 104, 'corrida normal não mexe nos pontos de liga');
  await db.exec(`update ranking set pontos = 900 where jogador_id = '${U1}' and temporada = temporada_atual()`);
  const f3 = await corrida(U1, 'ranqueada', 5, 2);
  ok(f3.rank_depois === 894 && (await meu(U1)).liga === 2, 'Ouro, 2 vitórias: 24 − 30 = −6 (' + f3.rank_depois + ')');
  await db.exec(`update ranking set pontos = 410 where jogador_id = '${U1}' and temporada = temporada_atual()`);
  const f4 = await corrida(U1, 'ranqueada', 3, 0);
  ok(f4.rank_depois === 390 && (await meu(U1)).liga === 0, 'Prata sem vitórias: −20 e cai para o Bronze (' + f4.rank_depois + ')');
  await db.exec(`update ranking set pontos = 10 where jogador_id = '${U1}' and temporada = temporada_atual()`);
  ok((await corrida(U1, 'ranqueada', 3, 0)).rank_depois === 10, 'Bronze sem entrada: nunca perde abaixo do começo');
  await db.exec(`update ranking set pontos = 1700 where jogador_id = '${U1}' and temporada = temporada_atual()`);
  const idm = (await como(U1, `select enviar_mochila(3, 'mago', 9, '[]'::jsonb, 0, 3) as id`))[0].id;
  ok(Number((await db.query(`select liga from mochilas where id = ${idm}`)).rows[0].liga) === 4, 'mochila guarda a liga de quem montou (Diamante)');
  const rk = await como(null, `select * from ranking_temporada(10)`);
  ok(rk.length >= 1 && rk[0].pontos === 1700 && rk[0].liga === 4, 'ranking mostra a liga');
  const eu = await meu(U1); ok(Number(eu.posicao) === 1 && eu.melhor_pontos >= 894, 'meu_rank: posição e melhor da temporada');
  // temporada nova: começa com metade
  await db.exec(`insert into temporadas (id, nome, inicio, fim) values (99, 'Teste', current_date, current_date + 60)`);
  await como(U1, `select registrar_luta(true, 1)`);
  ok(Number((await meu(U1)).pontos) === 850, 'temporada nova começa com metade dos pontos (1700 → 850)');
  await db.exec(`delete from ranking where temporada = 99; delete from temporadas where id = 99`);
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; select aplicar_rank(1, 7);`, 'jogador chamando aplicar_rank direto'); await db.exec('reset role');
  await erro(`select set_config('request.jwt.claim.sub', '${U1}', false); set role authenticated; update ranking set pontos = 9999;`, 'jogador escrevendo pontos de liga'); await db.exec('reset role');
}
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
