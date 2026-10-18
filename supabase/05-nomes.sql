-- Tralha de Guerra · nomes permitidos e bloqueio de jogadores (tolerância zero para conteúdo sexual, +18 ou ofensivo)
-- Rodar no SQL Editor depois dos anteriores. Pode rodar de novo sem estragar nada.
-- Ele substitui definir_nome, registrar_luta, ranking_temporada e sortear_adversario: se rodar o esquema.sql de novo, rode este logo depois.
--
-- Como funciona:
--  * definir_nome agora recusa nomes com termos proibidos (tabela nomes_proibidos), mesmo disfarçados:
--    sem acento, maiúsculas, letras repetidas, números no lugar de letras (p0rn0, s3x0), separadores (p.u.t.a) e palavras coladas;
--  * termos de modo 'parte' são proibidos em qualquer lugar do nome; os de modo 'palavra' (curtos, que aparecem dentro de
--    nomes inocentes, como "pau" em "Paulo") só quando são uma palavra inteira do nome;
--  * para proibir mais um termo (sem mexer no jogo): insert into public.nomes_proibidos values ('termo', 'parte');
--  * jogador bloqueado (jogadores.bloqueado) não muda o nome, não envia mochila, não pontua e some do ranking e dos sorteios:
--      update public.jogadores set bloqueado = true, nome = 'Aventureiro' where nome ilike '%algo%';
--  * no fim, os nomes já gravados que não passam na regra viram 'Aventureiro'.

create table if not exists public.nomes_proibidos (
  termo text primary key,
  modo text not null default 'parte' check (modo in ('parte', 'palavra'))
);
alter table public.nomes_proibidos enable row level security;
revoke all on public.nomes_proibidos from anon, authenticated;

insert into public.nomes_proibidos (termo, modo) values
  -- português
  ('porno', 'parte'), ('putaria', 'parte'), ('putinha', 'parte'), ('putona', 'parte'), ('prostitut', 'parte'), ('buceta', 'parte'), ('boceta', 'parte'),
  ('xoxota', 'parte'), ('xereca', 'parte'), ('xota', 'parte'), ('siririca', 'parte'), ('punheta', 'parte'), ('boquete', 'parte'), ('caralho', 'parte'),
  ('piroca', 'parte'), ('pirocao', 'parte'), ('rola', 'palavra'), ('pica', 'palavra'), ('pau', 'palavra'), ('cu', 'palavra'), ('cuzao', 'parte'), ('cuzinho', 'parte'),
  ('bunda', 'palavra'), ('bundinha', 'parte'), ('peitao', 'parte'), ('peitos', 'palavra'), ('peituda', 'parte'), ('tesao', 'parte'), ('tesuda', 'parte'), ('tesudo', 'parte'),
  ('gostosa', 'parte'), ('gostosao', 'parte'), ('safada', 'parte'), ('safadao', 'parte'), ('safadinha', 'parte'), ('vadia', 'parte'), ('vagabunda', 'parte'),
  ('piranha', 'palavra'), ('puta', 'palavra'), ('puto', 'palavra'), ('foder', 'parte'), ('fuder', 'parte'), ('fodase', 'parte'), ('fodendo', 'parte'), ('fudido', 'parte'),
  ('transar', 'parte'), ('trepar', 'parte'), ('trepada', 'parte'), ('gozar', 'parte'), ('gozada', 'parte'), ('gozo', 'palavra'), ('orgasmo', 'parte'), ('orgia', 'parte'),
  ('suruba', 'parte'), ('sexo', 'parte'), ('sexual', 'parte'), ('pelada', 'palavra'), ('pelado', 'palavra'), ('nudes', 'parte'), ('estupr', 'parte'), ('pedofil', 'parte'),
  ('incesto', 'parte'), ('viado', 'parte'), ('bicha', 'palavra'), ('traveco', 'parte'), ('pentelho', 'parte'), ('rapariga', 'parte'), ('meretriz', 'parte'),
  ('pinto', 'palavra'), ('pirok', 'parte'), ('xvideos', 'parte'), ('brasileirinhas', 'parte'), ('camgirl', 'parte'),
  -- inglês
  ('sex', 'parte'), ('porn', 'parte'), ('fuck', 'parte'), ('dick', 'palavra'), ('cock', 'palavra'), ('pussy', 'parte'), ('penis', 'parte'), ('vagina', 'parte'),
  ('boobs', 'palavra'), ('tits', 'palavra'), ('titties', 'parte'), ('nipple', 'parte'), ('horny', 'parte'), ('hentai', 'parte'), ('milf', 'parte'), ('anal', 'palavra'),
  ('rape', 'palavra'), ('rapist', 'parte'), ('slut', 'parte'), ('whore', 'parte'), ('blowjob', 'parte'), ('handjob', 'parte'), ('dildo', 'parte'), ('bdsm', 'parte'),
  ('fetish', 'parte'), ('onlyfans', 'parte'), ('nsfw', 'parte'), ('xxx', 'palavra'), ('cum', 'palavra'), ('cumshot', 'parte'), ('nude', 'palavra'), ('naked', 'parte'),
  ('orgy', 'parte'), ('pedo', 'palavra'), ('pedophil', 'parte'), ('incest', 'parte'), ('bitch', 'parte'), ('hooker', 'parte'), ('stripper', 'parte'), ('erotic', 'parte'),
  ('erotico', 'parte'), ('erotica', 'parte'), ('ass', 'palavra'), ('asshole', 'parte'), ('butt', 'palavra'), ('booty', 'palavra'), ('twerk', 'parte'), ('fap', 'palavra'),
  -- números e marcas de conteúdo adulto
  ('69', 'palavra'), ('18+', 'palavra'), ('+18', 'palavra'), ('24h', 'palavra')
on conflict (termo) do update set modo = excluded.modo;

alter table public.jogadores add column if not exists bloqueado boolean not null default false;

-- deixa o nome comparável: minúsculas, sem acento, números trocados por letras, letras repetidas juntadas
create or replace function public.nome_normal(p text) returns text
language sql immutable as $$
  select regexp_replace(
    translate(lower(coalesce(p, '')),
      'áàâãäéèêëíìîïóòôõöúùûüçñ0134578@$!|',
      'aaaaaeeeeiiiiooooouuuucnoieastbasii'),
    '([a-z])\1+', '\1', 'g')
$$;

-- o nome passa na regra? (modo 'parte': em qualquer lugar do nome sem separadores; 'palavra': palavra inteira)
create or replace function public.nome_permitido(p text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  -- separa palavras coladas em maiúsculas (BigPau → Big Pau) antes de normalizar
  partes text := public.nome_normal(regexp_replace(coalesce(p, ''), '([a-z])([A-Z])', '\1 \2', 'g'));
  junto text := regexp_replace(partes, '[^a-z0-9]', '', 'g');
  palavras text[] := array_remove(regexp_split_to_array(partes, '[^a-z0-9+]+'), '');
  digitos text[] := array_remove(regexp_split_to_array(lower(coalesce(p, '')), '[^0-9+]+'), '');
begin
  if exists (select 1 from nomes_proibidos n where n.modo = 'parte' and position(public.nome_normal(n.termo) in junto) > 0) then return false; end if;
  if exists (select 1 from nomes_proibidos n where n.modo = 'palavra' and (public.nome_normal(n.termo) = any(palavras) or n.termo = any(digitos) or public.nome_normal(n.termo) = junto)) then return false; end if;
  return true;
end $$;

-- definir_nome com a regra de nomes (substitui a do esquema.sql)
create or replace function public.definir_nome(novo_nome text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  novo_nome := btrim(novo_nome);
  if char_length(novo_nome) not between 2 and 20 then raise exception 'nome deve ter de 2 a 20 letras'; end if;
  if exists (select 1 from jogadores where id = auth.uid() and bloqueado) then raise exception 'jogador bloqueado'; end if;
  if not nome_permitido(novo_nome) then raise exception 'nome não permitido'; end if;
  insert into jogadores (id, nome) values (auth.uid(), novo_nome)
  on conflict (id) do update set nome = excluded.nome;
end $$;

-- jogador bloqueado: não envia mochila nem pontua; some do sorteio e do ranking
create or replace function public.esta_bloqueado() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select bloqueado from jogadores where id = auth.uid()), false)
$$;
create or replace function public.registrar_luta(p_venceu boolean, p_campanha int) returns integer
language plpgsql security definer set search_path = public as $$
declare t smallint := temporada_atual(); r ranking;
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  if esta_bloqueado() then return 0; end if;
  if t is null then return 0; end if;
  insert into jogadores (id) values (auth.uid()) on conflict (id) do nothing;
  insert into ranking (temporada, jogador_id) values (t, auth.uid()) on conflict do nothing;
  select * into r from ranking where temporada = t and jogador_id = auth.uid() for update;
  if r.dia <> current_date then r.lutas_hoje := 0; end if;
  if r.lutas_hoje >= 60 then return r.pontos; end if;
  update ranking set
    pontos = pontos + case when p_venceu then 10 else 0 end,
    vitorias = vitorias + case when p_venceu then 1 else 0 end,
    derrotas = derrotas + case when p_venceu then 0 else 1 end,
    melhor_campanha = greatest(melhor_campanha, least(p_campanha, 30)),
    lutas_hoje = r.lutas_hoje + 1, dia = current_date, atualizado_em = now()
  where temporada = t and jogador_id = auth.uid()
  returning pontos into r.pontos;
  return r.pontos;
end $$;
create or replace function public.ranking_temporada(p_limite int default 100)
returns table (posicao bigint, nome text, pontos integer, vitorias integer, melhor_campanha smallint)
language sql stable security definer set search_path = public as $$
  select rank() over (order by r.pontos desc, r.vitorias desc), j.nome, r.pontos, r.vitorias, r.melhor_campanha
  from ranking r join jogadores j on j.id = r.jogador_id
  where r.temporada = temporada_atual() and not j.bloqueado
  order by r.pontos desc, r.vitorias desc
  limit least(p_limite, 200)
$$;
create or replace function public.sortear_adversario(p_rodada int, p_versao int, p_vitorias int)
returns table (id bigint, nome text, classe text, itens jsonb, vitorias smallint, vidas smallint)
language sql security definer set search_path = public as $$
  select m.id, j.nome, m.classe, m.itens, m.vitorias, m.vidas
  from mochilas m join jogadores j on j.id = m.jogador_id
  where m.versao = p_versao and m.rodada = p_rodada and not j.bloqueado and m.jogador_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
  order by abs(m.vitorias - p_vitorias), random()
  limit 1
$$;
create or replace function public.sortear_adversario(p_rodada int, p_versao int, p_vitorias int, p_nivel int)
returns table (id bigint, nome text, classe text, itens jsonb, vitorias smallint, vidas smallint)
language sql security definer set search_path = public as $$
  select m.id, j.nome, m.classe, m.itens, m.vitorias, m.vidas
  from mochilas m join jogadores j on j.id = m.jogador_id
  where m.versao = p_versao and m.rodada = p_rodada and not j.bloqueado and m.jogador_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
  order by abs(m.nivel_medio - p_nivel) * 2 + abs(m.vitorias - p_vitorias), random()
  limit 1
$$;

revoke all on function public.nome_permitido(text), public.esta_bloqueado() from public, anon, authenticated;
grant execute on function public.definir_nome(text), public.registrar_luta(boolean, int) to authenticated;
grant execute on function public.ranking_temporada(int), public.sortear_adversario(int, int, int) to anon, authenticated;
grant execute on function public.sortear_adversario(int, int, int, int) to authenticated;

-- limpeza: nomes já gravados que não passam na regra viram 'Aventureiro'
update public.jogadores set nome = 'Aventureiro' where not public.nome_permitido(nome);
