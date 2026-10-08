# Banco do BicouBrincou

O `.env.local` está preparado para o projeto Supabase `BicouBrincou`.
As tabelas e funções de persistência já existem nesse projeto. Não execute
`supabase/setup.sql` novamente nesse banco.

1. No Supabase, abra **Settings > API Keys** e copie a chave **secret** para
   `SUPABASE_SECRET_KEY` no `.env.local`. Não envie essa chave ao GitHub ou ao chat.
2. Crie seu usuário em **Authentication > Users** e copie o UID.
3. Substitua o marcador de `supabase/grant-admin.sql` pelo UID e execute esse
   arquivo no SQL Editor para conceder acesso ao painel.
4. Execute `npm.cmd run db:check`. O comando verifica a conexão e a presença
   de administrador sem modificar os dados.
5. Reinicie o servidor com `npm.cmd run dev` e entre em `/login`.

O modo real começa vazio. Os dados da demonstração que estavam no navegador
não são enviados automaticamente ao banco.

Referência: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
