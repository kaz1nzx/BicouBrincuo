# Bicou Brincou by Peck Fun

Sistema Next.js para administrar um ateliê de brinquedos artesanais para aves, com loja pública integrada. Interface em português, valores em reais, layout responsivo e PWA.

## Começar no seu computador

1. Instale o **Node.js 24 LTS**. Abra novamente o VS Code depois da instalação.
2. Extraia o ZIP. No VS Code, escolha **Arquivo → Abrir pasta → bicou-brincou**. A pasta correta contém `package.json`.
3. Abra **Terminal → Novo terminal** e execute:

```bash
npm install
npm run dev
```

4. Abra **http://localhost:3000**. O painel abre em modo demonstração, sem senha ou banco.

Se `npm` não for reconhecido, reinstale o Node.js com a opção de adicionar ao PATH e reinicie o terminal. Não é necessário enviar `node_modules` ou `.next` ao GitHub.

### Endereços

| Área         | Endereço                     |
| ------------ | ---------------------------- |
| Painel       | http://localhost:3000/painel |
| Login        | http://localhost:3000/login  |
| Loja pública | http://localhost:3000/loja   |

No modo demonstração os dados são fictícios e ficam no navegador. Fechar e reabrir preserva os cadastros. Outro navegador/dispositivo terá sua própria demonstração. Pedidos feitos na loja aparecem no painel desse mesmo navegador. Para restaurar os exemplos, abra o console do navegador e execute `localStorage.removeItem('bicou-brincou-demo-v1')`, depois atualize a página.

## Usar com Supabase e dados reais

**A conexão real precisa ser configurada por você; nenhuma credencial foi incluída.** O modo real começa vazio, sem importar automaticamente os exemplos.

1. No seu projeto Supabase, abra **SQL Editor**, copie todo o conteúdo de `supabase/setup.sql` e execute uma vez em um projeto vazio. Este arquivo cria tabelas, políticas RLS, funções transacionais e o bucket público `products`.
2. Em **Authentication → Users → Add user**, crie o usuário da proprietária com e-mail e senha. Copie o **User UID**.
3. Abra `supabase/grant-admin.sql`, substitua `COLE-O-UUID-DO-USUARIO-AQUI` pelo UID e execute no SQL Editor. Somente usuários listados em `shop_admins` acessam o painel. Criar um usuário Auth sozinho não concede acesso.
4. Na raiz do projeto, copie `.env.example` para `.env.local`:

PowerShell (Windows):

```powershell
Copy-Item .env.example .env.local
```

Linux/macOS:

```bash
cp .env.example .env.local
```

5. Preencha:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE
SUPABASE_SECRET_KEY=sb_secret_SUA_CHAVE_SECRETA
SHOP_ID=00000000-0000-4000-8000-000000000001
APP_ORIGIN=http://localhost:3000
CHECKOUT_HOURLY_LIMIT=100
```

Obtenha URL e chave publishable no diálogo **Connect** ou em **Settings → API Keys** do Supabase. A chave secret fica **somente no servidor**. Nunca coloque a chave secret em uma variável `NEXT_PUBLIC_`, no GitHub ou em mensagens públicas. Chaves legadas `anon` / `service_role` podem ser usadas respectivamente nos mesmos campos quando necessárias.

6. Em **Authentication → URL Configuration**, defina **Site URL** como `http://localhost:3000` e autorize `http://localhost:3000/auth/callback` nos redirects. Para recuperar senha, configure o envio de e-mail/SMTP no Supabase. O app utiliza fluxo PKCE; abra o link no mesmo navegador em que iniciou a recuperação.
7. Pare o servidor com **Ctrl+C** e execute `npm run dev` novamente. Entre em `/login` com o usuário criado.

Não é preciso desabilitar confirmações de e-mail para o público: a loja não cria contas de clientes. A criação administrativa do usuário pode ser feita com e-mail confirmado no Supabase.

### Primeiros cadastros

1. Fornecedores e matérias-primas, com unidade, saldo inicial e custo unitário.
2. Peças de madeira (material de origem em **cm**, dimensões em **cm**).
3. Brinquedos e fichas técnicas, mão de obra e custos proporcionais.
4. Clientes, compras e pedidos.
5. Transformação de madeira para fabricar peças; produção para montar brinquedos.
6. Marque um pedido como **Enviado** para registrar a venda e baixar os brinquedos acabados. **Entregue** apenas finaliza a entrega.

## O que está implementado

- Dashboard com faturamento, lucro estimado, pedidos, produtos vendidos, valor em estoque, produção, alertas e gráficos.
- Cadastro e edição de materiais, peças, brinquedos, clientes, fornecedores e despesas.
- Compras com frete e outros custos, custo médio ponderado e movimentações automáticas.
- Corte de madeira com múltiplas saídas, conservação do comprimento, perdas e rateio do custo entre as peças úteis.
- Perdas de material, peça ou brinquedo, motivo, responsável e custo.
- Ficha técnica editável e custo teórico que acompanha os custos médios dos componentes.
- Pedidos com múltiplos produtos, desconto em reais, frete, pagamento, prazo e status.
- Planejamento acumulado, reservas FIFO de produtos acabados, peças a fabricar e matérias-primas a comprar.
- Ordens de produção com quantidade, prioridade, responsável, prazo e status. Conclusão consome componentes e adiciona brinquedos de forma atômica.
- Histórico de movimentações com custo e saldo após cada operação.
- Venda confirmada no envio, com custo histórico, faturamento, taxas estimadas e lucro.
- Simulador de preço com margem sobre venda, impostos, taxas, comissão e desconto previsto.
- Relatórios filtrados por data: financeiro, vendas, produção, estoque atual, compras e perdas. Exportação em **PDF**, **CSV** e **XLSX**.
- Loja pública: catálogo, filtros de espécie/tamanho/categoria/preço, detalhes, carrinho e checkout que grava pedidos no painel.
- Login, recuperação/atualização de senha, autorização de administrador e imagens via Supabase Storage.
- Busca global, notificações de estoque/pedidos, ações rápidas no celular, menu adaptável.
- PWA com ícones, manifesto e tela informativa sem conexão.

## Regras importantes

- **Unidades:** registre cada material numa unidade canônica. Se comprar uma barra de 2 metros e a madeira estiver cadastrada em cm, registre **200 cm**. O custo da compra é dividido por essa quantidade. Não há conversão automática entre barras, chapas, metros e centímetros.
- **Transformação:** soma das peças em cm + perda em cm precisa fechar o comprimento consumido. Exemplo: 20 peças de 5 cm + 5 de 10 cm + 2 de 15 cm + 20 cm de perda = 200 cm. O custo integral dos 200 cm é distribuído pelos 180 cm aproveitados, proporcionalmente ao comprimento de cada peça.
- **Perda de corte:** o relatório mostra o custo perdido, mas ele já foi absorvido pelas peças; não é subtraído novamente do lucro. Perdas registradas separadamente são consideradas no lucro estimado do período.
- **Estoque:** não pode ficar negativo. A unidade fica fixa após o cadastro; peças em estoque ou fichas não mudam de origem/comprimento. Editar cadastro não altera saldo/custo histórico. Entrada inicial fica na movimentação; entradas posteriores usam compra, transformação ou produção. Dados com histórico não podem ser excluídos.
- **Pedido:** reserva produtos acabados pela ordem do número. Pedidos anteriores têm prioridade. Componentes e matérias-primas são planejados pela demanda acumulada; não há reserva física individual desses componentes.
- **Planejamento:** considera perda percentual estimada configurável. O corte real registra os comprimentos e perdas efetivos. Não inclui otimizador de plano de corte 2D, espessura de serra automática ou cálculo por volume da madeira.
- **Produção:** custo real registrado = custo médio dos componentes no momento da conclusão + mão de obra/custos adicionais da ficha naquele momento. Não mede tempo efetivo de trabalho, consumo parcial ou produção parcialmente concluída. Uma ordem é concluída por inteiro.
- **Margem:** `preço = custo / (1 − margem − taxas) / (1 − desconto)`, percentuais convertidos para frações. Margem + taxas deve ser menor que 100%.
- **Financeiro:** faturamento de produtos não inclui frete. Lucro é estimado após custo histórico do produto, taxas, despesas e perdas avulsas. Evite lançar uma mesma despesa que já está rateada no custo fixo do brinquedo para não duplicar custos. Não é contabilidade fiscal.
- **Checkout:** confirma uma solicitação; não cobra, calcula transportadora, envia mensagem automaticamente ou emite nota fiscal. O frete é o valor fixo configurado. A loja confirma prazo/disponibilidade/pagamento; valores são recalculados no servidor. Há idempotência, honeypot e limite persistente por hora da loja, não um sistema antifraude completo.
- **Cancelamentos:** antes do envio, liberam a reserva; pedidos enviados só podem ser marcados entregues. Devoluções, estornos e retorno ao estoque exigem um módulo posterior.
- **PWA:** instalável em HTTPS (ou localhost). Não grava operações offline nem cacheia dados administrativos. Ao perder internet, exibe uma tela de reconexão.
- **Logo:** o anexo recebido era textual, sem os bytes da logo. Há uma identidade vetorial provisória em coral/madeira e ilustrações vetoriais de brinquedos. Substitua a logo em Configurações e envie fotos reais no cadastro dos produtos.

## Arquitetura

```text
app/                 rotas Next.js, APIs, layout e CSS
components/          interface administrativa e loja
lib/engine.ts        regras puras de custos, estoque e produção
lib/schemas.ts       validações Zod dos comandos e checkout
lib/types.ts         contratos de dados
lib/repository.ts    persistência com versão e transação
lib/supabase/        clientes Auth/servidor
supabase/            instalação SQL e autorização do administrador
tests/               testes de regras, SQL/RLS e navegador
docs/                arquitetura e decisões
public/              PWA, ícones e ilustrações
```

A instalação atende **uma loja**. O estado operacional é um agregado JSONB em `shop_state`, versionado, com movimentos e histórico de custos nos registros de domínio e trilha de ações em `shop_history`. A função `commit_shop_state` verifica a versão sob lock antes de salvar; em conflito a API refaz a operação sobre o estado mais recente. Isso impede perda de atualização e estoque parcialmente consumido.

Esta escolha simplifica a entrega para uma loja pequena. Uma operação com muitos registros/concor­rência deve evoluir para tabelas relacionais por módulo e paginação; o estado e o histórico crescem com o uso. Não são as tabelas normalizadas sugeridas no briefing, e as políticas/funcionalidades implementadas estão documentadas aqui.

RLS bloqueia acesso público a dados privados. Administradores podem ler somente a loja autorizada, mas não escrever diretamente no Data API. O backend valida todos os comandos e escreve com chave secret. Catálogo público é sanitizado; não entrega custos, contatos ou informações privadas. O cliente não escolhe a loja de uma operação.

## Verificação e build

```bash
npm test
npm run typecheck
npm run build
npm start
```

`npm test` roda testes do engine e instala/valida o SQL em PostgreSQL local via PGlite, incluindo permissões de leitura/escrita, CAS e limite de pedidos. Isso não substitui validar sua configuração de Auth, Storage, SMTP e URLs no seu Supabase real.

Para testar no navegador, com servidor em `http://127.0.0.1:3000`:

```bash
npx playwright install chromium
npm run test:e2e
```

Os testes de navegador usam o modo demonstração. Um Chromium empacotado em `@sparticuz/chromium` é alternativa para ambientes Linux gerenciados; ele não é necessário para rodar a aplicação.

## Publicar depois

O ZIP não publica o site. Em uma hospedagem Next.js, use `npm run build`, configure as mesmas variáveis do `.env.local` e altere `APP_ORIGIN` para a origem HTTPS exata (sem caminho), como `https://sualoja.com.br`. A origem deve corresponder ao domínio usado no navegador. Atualize também Site URL e redirects de Auth no Supabase. Não habilite a demonstração em produção com dados de negócio: preencha a configuração real e valide login, imagens, compras, produção e checkout antes de abrir a loja ao público.

O pacote não contém `.env.local`, senhas, credenciais, `node_modules` nem `.next`.
