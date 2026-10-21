// Gera supabase/04-cartas.sql com a lista de itens do jogo (cada item que não é bolsa tem uma carta).
// Uso (depois de node codigo/build.js): node supabase/gerar-04-cartas.cjs   → depois rodar o 04-cartas.sql no SQL Editor
const fs = require('fs'), path = require('path');
const t = require('../codigo/testes/carregar')('ITENS');
const itens = t.ITENS.filter(i => i.tipo !== 'bolsa').map(i => `('${i.id}', '${i.rar}', ${i.fusao || i.gerado ? 'true' : 'false'})`).join(',\n  ');
const sql = `-- Bornal de Guerra · cartas dos itens (níveis 0 a 10), Moedas de Bronze e a loja de cartas (carrinho diário e semanal)
-- PROGRESSAO.md, seção 10. Rodar no SQL Editor depois do 03-experiencia.sql. Pode rodar de novo sem estragar nada.
-- Arquivo GERADO por supabase/gerar-04-cartas.cjs (a lista de itens vem do jogo): não editar à mão.
-- Este arquivo substitui o enviar_mochila (7 argumentos) e o fechar_corrida do 03: se rodar o 03 de novo, rode este logo depois.
--
-- Como funciona:
--  * cada item (menos as bolsas) tem uma carta; juntar cartas e moedas sobe o item do nível 0 ao 10 (subir_item);
--  * o nível só vale no modo NORMAL; no RANQUEADO todos lutam no nível 0 (o jogo usa versões de mochila separadas:
--    ranqueada = versão das regras, normal = versão + 1000, então os dois modos nunca se misturam no sorteio);
--  * no modo normal, a mochila leva o nível de cada item ("n") e o servidor corta para o nível que o jogador tem de verdade;
--  * fechar_corrida agora também dá Moedas de Bronze (10 por rodada + 5 por vitória) e cartas (3 + 1 por vitória + 2 ao fechar 7),
--    das peças da última mochila daquela corrida; acima do limite diário de experiência, as recompensas caem junto;
--  * a loja tem um carrinho diário (6 ofertas, troca à meia-noite de Brasília) e um semanal (4 ofertas, troca na segunda-feira),
--    sorteados aqui para cada jogador; cada oferta só pode ser comprada uma vez;
--  * ninguém escreve direto nas tabelas.
-- Para dar moedas a alguém (teste): update public.carteira set bronze = bronze + 1000 where jogador_id = '<id>';

create table if not exists public.cartas_itens (
  id text primary key,
  rar text not null check (rar in ('comum', 'incomum', 'rara', 'epica', 'lendaria')),
  fusao boolean not null default false
);
insert into public.cartas_itens (id, rar, fusao) values
  ${itens}
on conflict (id) do update set rar = excluded.rar, fusao = excluded.fusao;

create table if not exists public.colecao (
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  item text not null references public.cartas_itens (id),
  nivel smallint not null default 0 check (nivel between 0 and 10),
  cartas integer not null default 0 check (cartas >= 0),
  primary key (jogador_id, item)
);
create table if not exists public.carteira (
  jogador_id uuid primary key references public.jogadores (id) on delete cascade,
  bronze integer not null default 0 check (bronze >= 0)
);
create table if not exists public.carrinho (
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  tipo text not null check (tipo in ('dia', 'semana')),
  periodo date not null,
  vaga smallint not null,
  item text not null references public.cartas_itens (id),
  qtd smallint not null,
  preco integer not null,
  comprado boolean not null default false,
  primary key (jogador_id, tipo, periodo, vaga)
);
alter table public.mochilas add column if not exists corrida_id bigint;
alter table public.mochilas add column if not exists nivel_medio smallint not null default 0;

alter table public.cartas_itens enable row level security;
alter table public.colecao enable row level security;
alter table public.carteira enable row level security;
alter table public.carrinho enable row level security;
revoke all on public.cartas_itens, public.colecao, public.carteira, public.carrinho from anon, authenticated;

-- ---------- regras (as mesmas do jogo, em 01-itens.js) ----------
-- cartas para ir do nível n-1 ao n; épicas e lendárias pedem menos (e aparecem menos)
create or replace function public.custo_cartas(p_rar text, p_nivel int) returns int
language sql immutable as $$
  select ceil((array[2, 4, 6, 10, 15, 20, 30, 40, 50, 75])[p_nivel]
    * case p_rar when 'rara' then .8 when 'epica' then .6 when 'lendaria' then .4 else 1 end)::int
$$;
create or replace function public.custo_bronze(p_nivel int) returns int
language sql immutable as $$ select (array[5, 10, 20, 35, 50, 75, 100, 150, 200, 300])[p_nivel] $$;
-- período do carrinho: hoje (Brasília) ou a segunda-feira desta semana
create or replace function public.periodo_carrinho(p_tipo text) returns date
language sql stable as $$
  select case when p_tipo = 'dia' then (now() at time zone 'America/Sao_Paulo')::date
              else date_trunc('week', now() at time zone 'America/Sao_Paulo')::date end
$$;

-- soma cartas na coleção do jogador
create or replace function public.dar_cartas(p_jogador uuid, p_item text, p_qtd int) returns void
language sql security definer set search_path = public as $$
  insert into colecao (jogador_id, item, cartas) values (p_jogador, p_item, greatest(p_qtd, 0))
  on conflict (jogador_id, item) do update set cartas = colecao.cartas + greatest(p_qtd, 0)
$$;

-- ---------- mochila do modo normal: corta o nível de cada item para o que o jogador tem ----------
create or replace function public.enviar_mochila(p_rodada int, p_classe text, p_versao int, p_itens jsonb, p_vitorias int, p_vidas int, p_corrida bigint) returns bigint
language plpgsql security definer set search_path = public as $$
declare novo bigint; itens jsonb := p_itens; media int := 0;
begin
  if p_versao >= 1000 and jsonb_typeof(p_itens) = 'array' then
    select coalesce(jsonb_agg(case when e ? 'n' then jsonb_set(e, '{n}', to_jsonb(least(greatest(coalesce((e->>'n')::int, 0), 0), coalesce(c.nivel, 0)))) else e end), '[]'::jsonb),
           coalesce(round(avg(least(greatest(coalesce((e->>'n')::int, 0), 0), coalesce(c.nivel, 0))) filter (where e ? 'n')), 0)
      into itens, media
      from jsonb_array_elements(p_itens) e
      left join colecao c on c.jogador_id = auth.uid() and c.item = e->>'id';
  elsif jsonb_typeof(p_itens) = 'array' then
    -- ranqueada: ninguém leva nível
    select coalesce(jsonb_agg(e - 'n'), '[]'::jsonb) into itens from jsonb_array_elements(p_itens) e;
  end if;
  novo := enviar_mochila(p_rodada, p_classe, p_versao, itens, p_vitorias, p_vidas);
  update mochilas set corrida_id = p_corrida, nivel_medio = media where id = novo;
  update corridas set rodadas = rodadas + 1, ultima_rodada_em = now()
  where id = p_corrida and jogador_id = auth.uid() and not fechada and classe = p_classe
    and rodadas + 1 = p_rodada and rodadas < 9 and criada_em > now() - interval '1 day'
    and (ultima_rodada_em is null or ultima_rodada_em < now() - interval '3 seconds');
  return novo;
end $$;

-- sorteio do modo normal: campanha parecida e nível médio dos itens parecido
create or replace function public.sortear_adversario(p_rodada int, p_versao int, p_vitorias int, p_nivel int)
returns table (id bigint, nome text, classe text, itens jsonb, vitorias smallint, vidas smallint)
language sql security definer set search_path = public as $$
  select m.id, j.nome, m.classe, m.itens, m.vitorias, m.vidas
  from mochilas m join jogadores j on j.id = m.jogador_id
  where m.versao = p_versao and m.rodada = p_rodada and m.jogador_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
  order by abs(m.nivel_medio - p_nivel) * 2 + abs(m.vitorias - p_vitorias), random()
  limit 1
$$;

-- ---------- fim da corrida: experiência (como antes) + moedas e cartas ----------
drop function if exists public.fechar_corrida(bigint, int);
create or replace function public.fechar_corrida(p_corrida bigint, p_vitorias int)
returns table (ganho integer, xp integer, base integer, multiplicador numeric, limite_hoje integer, bronze integer, cartas jsonb, rank_antes integer, rank_depois integer)
language plpgsql security definer set search_path = public as $$
declare c corridas; m multiplicadores; v int; b int; mult numeric := 1; lim int; g int; total int;
        fator numeric; moedas int; n int; pecas text[]; ganhas jsonb := '{}'::jsonb; it text; i int; ra int; rd int;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  select * into c from corridas where id = p_corrida and jogador_id = auth.uid() and not fechada for update;
  if c.id is null then raise exception 'partida não encontrada ou já fechada'; end if;
  update corridas set fechada = true where id = c.id;
  v := greatest(least(coalesce(p_vitorias, 0), 7, c.rodadas), greatest(c.rodadas - 3, 0));
  b := c.rodadas * 2 + v * 3 + case when v >= 7 then 10 else 0 end;
  insert into multiplicadores (jogador_id) values (auth.uid()) on conflict (jogador_id) do nothing;
  select * into m from multiplicadores where jogador_id = auth.uid() for update;
  if m.dia <> current_date then m.xp_hoje := 0; end if;
  if m.assinatura_ate is not null and m.assinatura_ate > now() then mult := mult * m.assinatura_mult; end if;
  if m.boost_partidas > 0 and c.rodadas > 0 then mult := mult * m.boost_mult; end if;
  lim := floor(250 * mult);
  g := least(floor(b * mult)::int, greatest(lim - m.xp_hoje, 0));
  update multiplicadores set xp_hoje = m.xp_hoje + g, dia = current_date,
    boost_partidas = case when m.boost_partidas > 0 and c.rodadas > 0 then m.boost_partidas - 1 else m.boost_partidas end
  where jogador_id = auth.uid();
  insert into experiencia (jogador_id, classe, xp, partidas) values (auth.uid(), c.classe, g, 1)
  on conflict (jogador_id, classe) do update set xp = experiencia.xp + g, partidas = experiencia.partidas + 1, atualizado_em = now()
  returning experiencia.xp into total;
  -- moedas e cartas, na mesma proporção da experiência que coube no limite do dia
  fator := case when b = 0 then 0 else least(g / (b * mult), 1) end;
  moedas := floor((c.rodadas * 10 + v * 5) * fator);
  n := case when c.rodadas = 0 then 0 else floor((3 + v + case when v >= 7 then 2 else 0 end) * fator) end;
  insert into carteira (jogador_id, bronze) values (auth.uid(), moedas)
  on conflict (jogador_id) do update set bronze = carteira.bronze + moedas;
  select array_agg(e->>'id') into pecas
    from mochilas mo, jsonb_array_elements(mo.itens) e
    where mo.id = (select max(id) from mochilas where corrida_id = c.id and jogador_id = auth.uid())
      and exists (select 1 from cartas_itens ci where ci.id = e->>'id');
  if pecas is null then select array_agg(id) into pecas from cartas_itens where not fusao and rar = 'comum'; end if;
  for i in 1 .. n loop
    it := pecas[1 + floor(random() * array_length(pecas, 1))::int];
    perform dar_cartas(auth.uid(), it, 1);
    ganhas := jsonb_set(ganhas, array[it], to_jsonb(coalesce((ganhas->>it)::int, 0) + 1));
  end loop;
  -- pontos de liga (06-ranked.sql), só nas corridas ranqueadas
  if to_regprocedure('public.aplicar_rank(bigint, integer)') is not null then select * into ra, rd from aplicar_rank(c.id, v); end if;
  return query select g, total, b, mult, lim - (m.xp_hoje + g), moedas, ganhas, ra, rd;
end $$;

-- ---------- coleção ----------
create or replace function public.minha_colecao()
returns table (item text, nivel smallint, cartas integer, bronze integer)
language sql stable security definer set search_path = public as $$
  select co.item, co.nivel, co.cartas, (select bronze from carteira where jogador_id = auth.uid())
  from colecao co where co.jogador_id = auth.uid()
  union all
  select null, null, null, (select bronze from carteira where jogador_id = auth.uid())   -- sempre volta o saldo, mesmo sem cartas
$$;

-- sobe um item um nível; devolve o nível novo
create or replace function public.subir_item(p_item text) returns smallint
language plpgsql security definer set search_path = public as $$
declare co colecao; r text; cc int; cb int; saldo int;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  select * into co from colecao where jogador_id = auth.uid() and item = p_item for update;
  if co.item is null then raise exception 'sem cartas deste item'; end if;
  if co.nivel >= 10 then raise exception 'nível máximo'; end if;
  select rar into r from cartas_itens where id = p_item;
  cc := custo_cartas(r, co.nivel + 1); cb := custo_bronze(co.nivel + 1);
  if co.cartas < cc then raise exception 'cartas insuficientes'; end if;
  select bronze into saldo from carteira where jogador_id = auth.uid() for update;
  if coalesce(saldo, 0) < cb then raise exception 'moedas insuficientes'; end if;
  update carteira set bronze = bronze - cb where jogador_id = auth.uid();
  update colecao set cartas = cartas - cc, nivel = nivel + 1 where jogador_id = auth.uid() and item = p_item;
  return co.nivel + 1;
end $$;

-- ---------- loja de cartas ----------
-- sorteia as ofertas do período, se ainda não existem, e devolve o carrinho
create or replace function public.meu_carrinho(p_tipo text)
returns table (vaga smallint, item text, qtd smallint, preco integer, comprado boolean, periodo date, troca_em timestamptz)
language plpgsql security definer set search_path = public as $$
declare per date := periodo_carrinho(p_tipo); raras text[]; k int; rr text; q int; pr int; esc text;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  if p_tipo not in ('dia', 'semana') then raise exception 'carrinho inválido'; end if;
  insert into jogadores (id) values (auth.uid()) on conflict (id) do nothing;
  if not exists (select 1 from carrinho c where c.jogador_id = auth.uid() and c.tipo = p_tipo and c.periodo = per) then
    delete from carrinho c where c.jogador_id = auth.uid() and c.tipo = p_tipo and c.periodo < per;
    raras := case when p_tipo = 'dia' then array['comum', 'comum', 'incomum', 'incomum', 'rara', 'sorte']
                  else array['comum', 'rara', 'epica', 'lendaria'] end;
    for k in 1 .. array_length(raras, 1) loop
      rr := raras[k];
      if rr = 'sorte' then rr := (array['comum', 'incomum', 'incomum', 'rara', 'rara', 'epica'])[1 + floor(random() * 6)::int]; end if;
      select id into esc from cartas_itens where rar = rr and not fusao
        and id not in (select c.item from carrinho c where c.jogador_id = auth.uid() and c.tipo = p_tipo and c.periodo = per)
        order by random() limit 1;
      -- quantidade e preço: semanal vem em pacote maior e 20% mais barato por carta
      q := case rr when 'comum' then 10 when 'incomum' then 6 when 'rara' then 3 when 'epica' then 2 else 1 end * case when p_tipo = 'semana' then 4 else 1 end;
      pr := ceil(q * case rr when 'comum' then 5 when 'incomum' then 10 when 'rara' then 25 when 'epica' then 60 else 150 end * case when p_tipo = 'semana' then .8 else 1 end);
      insert into carrinho (jogador_id, tipo, periodo, vaga, item, qtd, preco) values (auth.uid(), p_tipo, per, k, esc, q, pr);
    end loop;
  end if;
  return query select c.vaga, c.item, c.qtd, c.preco, c.comprado, c.periodo,
    case when p_tipo = 'dia' then ((per + 1)::timestamp at time zone 'America/Sao_Paulo') else ((per + 7)::timestamp at time zone 'America/Sao_Paulo') end
  from carrinho c where c.jogador_id = auth.uid() and c.tipo = p_tipo and c.periodo = per order by c.vaga;
end $$;

-- compra uma oferta do carrinho atual; devolve o saldo que sobrou
create or replace function public.comprar_oferta(p_tipo text, p_vaga int) returns integer
language plpgsql security definer set search_path = public as $$
declare o carrinho; saldo int;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  select * into o from carrinho where jogador_id = auth.uid() and tipo = p_tipo and periodo = periodo_carrinho(p_tipo) and vaga = p_vaga for update;
  if o.item is null then raise exception 'oferta não encontrada'; end if;
  if o.comprado then raise exception 'oferta já comprada'; end if;
  select bronze into saldo from carteira where jogador_id = auth.uid() for update;
  if coalesce(saldo, 0) < o.preco then raise exception 'moedas insuficientes'; end if;
  update carteira set bronze = bronze - o.preco where jogador_id = auth.uid();
  update carrinho set comprado = true where jogador_id = auth.uid() and tipo = p_tipo and periodo = o.periodo and vaga = p_vaga;
  perform dar_cartas(auth.uid(), o.item, o.qtd);
  return saldo - o.preco;
end $$;

revoke all on function public.dar_cartas(uuid, text, int) from public, anon, authenticated;
revoke all on function public.enviar_mochila(int, text, int, jsonb, int, int, bigint), public.fechar_corrida(bigint, int), public.minha_colecao(),
  public.subir_item(text), public.meu_carrinho(text), public.comprar_oferta(text, int), public.sortear_adversario(int, int, int, int) from public, anon;
grant execute on function public.enviar_mochila(int, text, int, jsonb, int, int, bigint), public.fechar_corrida(bigint, int), public.minha_colecao(),
  public.subir_item(text), public.meu_carrinho(text), public.comprar_oferta(text, int), public.sortear_adversario(int, int, int, int) to authenticated;
`;
fs.writeFileSync(path.join(__dirname, '04-cartas.sql'), sql);
console.log('ok · 04-cartas.sql com', t.ITENS.filter(i => i.tipo !== 'bolsa').length, 'cartas');
