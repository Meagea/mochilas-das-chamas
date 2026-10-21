-- Bornal de Guerra · perfil público de cada jogador: 3 heróis favoritos, título e conquistas
-- Rodar no SQL Editor depois do 08-missoes.sql. Pode rodar de novo sem estragar nada.
-- (este arquivo substitui ranking_temporada, que o 06 também define: se rodar o 06 de novo, rode este logo depois.)
--
-- Como funciona:
--  * cada jogador ganha um código público curto (não é o id da conta) para abrir o perfil a partir do ranking;
--  * favoritos: até 3 heróis, no formato 'classe' ou 'classe:pele' (a pele fica para quando houver skins, ex.: 'guerreiro:pantera');
--  * conquistas: só ids da lista conquistas_lista. As que o servidor consegue conferir (nível, liga, corrida vencida, invicto)
--    só entram se forem verdade; as outras (fusões, receitas, coleção) são cosméticas e o jogo informa;
--  * título: o nome de uma conquista que o jogador já tem.

alter table public.jogadores add column if not exists codigo text default substr(md5(random()::text || clock_timestamp()::text), 1, 8);
update public.jogadores set codigo = substr(md5(random()::text || id::text), 1, 8) where codigo is null;
create unique index if not exists jogadores_codigo_idx on public.jogadores (codigo);
alter table public.jogadores add column if not exists favoritos text[] not null default '{}';
alter table public.jogadores add column if not exists titulo text;

create table if not exists public.conquistas_lista (id text primary key, nome text not null);
insert into public.conquistas_lista (id, nome) values
  ('fusao1', 'Primeira faísca'), ('fusao25', 'Ferreiro de mão cheia'), ('fusao100', 'Mestre da forja'),
  ('receitas20', 'Caderno de receitas'), ('receitas60', 'Livro completo de bolso'),
  ('corrida1', 'Pé na estrada'), ('sete', 'Sete de sete'), ('semPerder', 'Invicto'), ('todos7', 'Elenco completo'),
  ('nivel5', 'Veterano'), ('nivel10', 'Lenda da mochila'), ('ouro', 'Liga de Ouro'), ('diamante', 'Brilho de Diamante'),
  ('colecao100', 'Acumulador')
on conflict (id) do update set nome = excluded.nome;

create table if not exists public.conquistas_jogador (
  jogador_id uuid not null references public.jogadores (id) on delete cascade,
  conquista text not null references public.conquistas_lista (id),
  em timestamptz not null default now(),
  primary key (jogador_id, conquista)
);
alter table public.conquistas_lista enable row level security;
alter table public.conquistas_jogador enable row level security;
revoke all on public.conquistas_lista, public.conquistas_jogador from anon, authenticated;

-- a conquista vale para este jogador? as conferíveis olham os dados do servidor; as outras valem como o jogo informou
create or replace function public.conquista_vale(p_jogador uuid, p_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select case p_id
    when 'nivel5' then exists (select 1 from experiencia where jogador_id = p_jogador and nivel_xp(xp) >= 5)
    when 'nivel10' then exists (select 1 from experiencia where jogador_id = p_jogador and nivel_xp(xp) >= 10)
    when 'ouro' then exists (select 1 from ranking where jogador_id = p_jogador and greatest(pontos, melhor_pontos) >= 800)
    when 'diamante' then exists (select 1 from ranking where jogador_id = p_jogador and greatest(pontos, melhor_pontos) >= 1600)
    when 'corrida1' then exists (select 1 from corridas where jogador_id = p_jogador and fechada and rodadas > 0)
      or exists (select 1 from experiencia where jogador_id = p_jogador and partidas > 0)
    when 'sete' then exists (select 1 from corridas where jogador_id = p_jogador and fechada and vitorias >= 7)
    when 'semPerder' then exists (select 1 from corridas where jogador_id = p_jogador and fechada and vitorias >= 7 and rodadas = vitorias)
    else exists (select 1 from conquistas_lista where id = p_id)
  end
$$;

-- o jogo informa as conquistas que tem; devolve as que o servidor aceitou (as novas e as que já estavam)
create or replace function public.registrar_conquistas(p_ids text[]) returns text[]
language plpgsql security definer set search_path = public as $$
declare k text;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  if esta_bloqueado() then return '{}'; end if;
  insert into jogadores (id) values (auth.uid()) on conflict (id) do nothing;
  foreach k in array coalesce(p_ids, '{}') loop
    if exists (select 1 from conquistas_lista where id = k) and conquista_vale(auth.uid(), k) then
      insert into conquistas_jogador (jogador_id, conquista) values (auth.uid(), k) on conflict do nothing;
    end if;
  end loop;
  return array(select conquista from conquistas_jogador where jogador_id = auth.uid() order by em);
end $$;

-- até 3 heróis favoritos (sem repetir) e o título (uma conquista que o jogador tem, ou nenhum)
create or replace function public.definir_perfil(p_favoritos text[], p_titulo text) returns void
language plpgsql security definer set search_path = public as $$
declare f text[] := coalesce(p_favoritos, '{}'); k text;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  if esta_bloqueado() then raise exception 'jogador bloqueado'; end if;
  if cardinality(f) > 3 then raise exception 'no máximo 3 favoritos'; end if;
  if cardinality(f) <> (select count(distinct split_part(x, ':', 1)) from unnest(f) x) then raise exception 'herói repetido'; end if;
  foreach k in array f loop
    if k !~ '^[a-z]{2,20}(:[a-z0-9]{2,20})?$' then raise exception 'favorito inválido'; end if;
  end loop;
  if p_titulo is not null and not exists (select 1 from conquistas_jogador where jogador_id = auth.uid() and conquista = p_titulo) then
    raise exception 'título não conquistado'; end if;
  insert into jogadores (id) values (auth.uid()) on conflict (id) do nothing;
  update jogadores set favoritos = f, titulo = p_titulo where id = auth.uid();
end $$;

-- o perfil público: nome, código, favoritos, título, conquistas, liga e a experiência de cada herói
create or replace function public.perfil_publico(p_jogador uuid)
returns table (nome text, codigo text, favoritos text[], titulo text, conquistas text[], pontos integer, melhor_pontos integer, liga smallint, experiencia jsonb)
language sql stable security definer set search_path = public as $$
  select j.nome, j.codigo, j.favoritos, j.titulo,
    array(select c.conquista from conquistas_jogador c where c.jogador_id = j.id order by c.em),
    coalesce(r.pontos, 0), coalesce(r.melhor_pontos, 0), liga_de(coalesce(r.pontos, 0)),
    coalesce((select jsonb_object_agg(e.classe, e.xp) from experiencia e where e.jogador_id = j.id), '{}'::jsonb)
  from jogadores j left join ranking r on r.jogador_id = j.id and r.temporada = temporada_atual()
  where j.id = p_jogador and not j.bloqueado
$$;
create or replace function public.perfil_jogador(p_codigo text)
returns table (nome text, codigo text, favoritos text[], titulo text, conquistas text[], pontos integer, melhor_pontos integer, liga smallint, experiencia jsonb)
language sql stable security definer set search_path = public as $$
  select * from perfil_publico((select id from jogadores where codigo = p_codigo))
$$;
create or replace function public.meu_perfil()
returns table (nome text, codigo text, favoritos text[], titulo text, conquistas text[], pontos integer, melhor_pontos integer, liga smallint, experiencia jsonb)
language sql stable security definer set search_path = public as $$
  select * from perfil_publico(auth.uid())
$$;

-- o ranking passa a trazer o código (para abrir o perfil) e o título
drop function if exists public.ranking_temporada(int);
create function public.ranking_temporada(p_limite int default 100)
returns table (posicao bigint, nome text, pontos integer, vitorias integer, melhor_campanha smallint, liga smallint, codigo text, titulo text)
language sql stable security definer set search_path = public as $$
  select rank() over (order by r.pontos desc, r.vitorias desc), j.nome, r.pontos, r.vitorias, r.melhor_campanha, liga_de(r.pontos), j.codigo, j.titulo
  from ranking r join jogadores j on j.id = r.jogador_id
  where r.temporada = temporada_atual() and not j.bloqueado and (r.corridas > 0 or r.pontos > 0)
  order by r.pontos desc, r.vitorias desc
  limit least(p_limite, 200)
$$;

revoke all on function public.conquista_vale(uuid, text), public.perfil_publico(uuid) from public, anon, authenticated;
revoke all on function public.registrar_conquistas(text[]), public.definir_perfil(text[], text), public.meu_perfil() from public, anon;
grant execute on function public.registrar_conquistas(text[]), public.definir_perfil(text[], text), public.meu_perfil() to authenticated;
grant execute on function public.perfil_jogador(text), public.ranking_temporada(int) to anon, authenticated;
