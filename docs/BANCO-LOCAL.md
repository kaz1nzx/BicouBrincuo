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

## Na Vercel

O `.env.local` não é enviado ao GitHub e não configura o ambiente publicado.
No projeto da Vercel, abra **Settings > Environment Variables** e configure
estas variáveis no ambiente **Production**:

| Variável | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do mesmo projeto Supabase usado pelo usuário administrador |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave publishable desse projeto |
| `SUPABASE_SECRET_KEY` | Chave secret desse projeto, com tipo Secret |
| `SHOP_ID` | `00000000-0000-4000-8000-000000000001` |
| `APP_ORIGIN` | Endereço HTTPS exato da loja, sem caminho ou barra final |

Depois faça um **Redeploy**. As alterações nas variáveis só são aplicadas aos
novos deployments. Os valores `NEXT_PUBLIC_` são incorporados ao aplicativo
durante o build.

Para recuperação de senha, configure também **Authentication > URL Configuration**
no Supabase: **Site URL** deve ser o endereço da loja e **Redirect URLs** deve
incluir o endereço da loja seguido de `/auth/callback`.

Se a senha for aceita e o painel não abrir, confira especialmente `SHOP_ID` e
se o usuário está na tabela `shop_admins` do mesmo projeto. A tela do painel
mostra falhas de configuração e de autorização sem redirecioná-las para o login.

Referência: https://vercel.com/docs/environment-variables
