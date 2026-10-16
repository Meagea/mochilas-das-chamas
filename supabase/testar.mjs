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
await db.exec(SQL); ok(true, 'esquema.sql rodou de novo (pode repetir sem estragar)');

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
ok(pts === 30, '3 vitórias = 30 pontos (' + pts + ')');
const rk = await como(null, `select * from ranking_temporada(10)`);
ok(rk.length === 1 && rk[0].nome === 'Torvald' && rk[0].pontos === 30 && Number(rk[0].posicao) === 1, 'ranking: Torvald em 1º com 30');
for(let i = 0; i < 70; i++) pts = (await como(U1, `select registrar_luta(true, 1) as p`))[0].p;
ok(pts === 600, 'teto de 60 lutas por dia (' + pts + ' pontos)');
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
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
