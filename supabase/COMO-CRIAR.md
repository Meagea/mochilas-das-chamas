# Supabase do Tralha de Guerra: como criar (plano gratuito)

Leva uns 10 minutos. Só você cria a conta e o projeto; depois eu cuido do resto.

## 1. Conta
1. Abra https://supabase.com e clique em **Start your project**.
2. Entre com o **GitHub** (a conta Meagea). Não precisa cartão.

## 2. Projeto
1. Se pedir uma organização, crie uma com o plano **Free**.
2. **New project**:
   - **Name:** `mochila-da-fogueira`
   - **Database Password:** gere uma senha forte e guarde no seu gerenciador de senhas. **Não me mande essa senha**: eu não preciso dela.
   - **Region:** `South America (São Paulo)`, a mais perto dos jogadores.
3. Clique em **Create new project** e espere uns 2 minutos até ficar pronto.

## 3. Entrada sem cadastro
1. No menu da esquerda: **Authentication** → **Sign In / Providers**.
2. Ligue **Allow anonymous sign-ins** e salve.

Assim o jogador entra direto, sem e-mail e sem senha. Login com Discord dá para ligar depois, sem perder nada.

## 4. Banco de dados
1. No menu da esquerda: **SQL Editor** → **New query**.
2. Abra o arquivo `esquema.sql` (nesta mesma pasta), copie tudo, cole e clique em **Run**.
3. Deve aparecer **Success. No rows returned**.

## 5. O que me mandar
No menu: **Project Settings** → **API** (ou **API Keys**). Me mande só estes dois:
- **Project URL** (algo como `https://abcdefgh.supabase.co`);
- a chave **anon** / **publishable** (começa com `eyJ...` ou `sb_publishable_...`).

Essas duas são públicas de propósito: vão dentro do jogo, e a segurança vem das regras do `esquema.sql`.

**Nunca me mande** (nem coloque em lugar nenhum do jogo):
- a chave **service_role** / **secret**;
- a senha do banco.

## Cuidados do plano grátis
- **Pausa:** o projeto pausa depois de 1 semana sem nenhum acesso. Se acontecer, o jogo segue no modo offline; para voltar, clique em **Restore** no painel.
- **Cópia de segurança:** o plano grátis não faz backup. Eu vou deixar uma exportação semanal do ranking pronta quando o jogo estiver no ar.
