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
console.log(falhas ? `\n${falhas} falha(s)` : '\nTudo certo');
