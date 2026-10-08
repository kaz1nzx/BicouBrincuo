# Bicou Brincou — especificação e plano de execução

Implementação do briefing fornecido: sistema administrativo móvel para uma fábrica artesanal de brinquedos para aves, com loja pública. Next.js App Router, TypeScript, Tailwind, Zod e Supabase. O pacote é local, sem publicação automática.

## Módulos

Materiais, compras, peças, transformação, perdas, brinquedos e fichas técnicas, produção, estoque e movimentações, pedidos, clientes, fornecedores, vendas, custos, precificação, relatórios, configurações e loja com carrinho/checkout.

## Regras

Unidades são canônicas por material: compras informam quantidades na unidade cadastrada; madeira e cortes usam cm. Custo médio ponderado inclui frete e despesas. Transformação exige conservação do comprimento (saídas + perdas = consumo) e rateia o custo total entre saídas úteis pelo comprimento. Custo da perda é informativo: já absorvido nas peças, não somado novamente ao custo de produção. Ficha técnica distingue peças e materiais. Embalagem entra na ficha OU no adicional, para evitar contagem dupla. Preço considera margem, taxas, impostos e comissão sobre venda, e desconto percentual. Produção baixa componentes atomicamente e calcula custo médio do produto final. Envio registra a venda e baixa produtos; cancelamento antes do envio libera reservas. Pedido enviado não pode ser cancelado pelo fluxo simplificado, exigindo devolução fora deste pacote.

## Dados e segurança

Uma loja por instalação. Cadastro de administradores exclusivamente no SQL: clientes e usuários Auth comuns não acessam o painel. API verifica Auth e autorização em todas as operações. Dados operacionais são um agregado JSONB versionado em PostgreSQL (trade-off explícito para loja pequena), com histórico separado e controle otimista de concorrência por RPC transacional. Atualizações são permitidas somente ao backend com chave secret; RLS protege leituras. O engine TypeScript é a única interface de escrita e usa comandos Zod. Catálogo público retorna somente campos necessários, sem custos/PII. Checkout recalcula preços no servidor e registra pedidos sem cobrar pagamento. Storage permite imagens públicas, escrita restrita aos administradores. Nenhuma chave secreta chega ao navegador.

## Demonstração

Sem configuração Supabase, estado fictício persiste somente no navegador. Mesmo engine de cálculos. A demonstração não tem proteção de autenticação nem sincronização entre dispositivos, sendo explicitamente identificada. Não se transforma em modo demo se uma configuração real estiver parcialmente preenchida.

## Execução e verificação

1. Modelos, dados demonstrativos e engine puro.
2. API autenticada, repository versionado, SQL/RLS e Storage.
3. Componentes, formulários e páginas administrativas; loja e checkout.
4. Manifesto e offline informativo, exportação CSV/Excel/PDF.
5. Testes de conservação, margem, custo médio, estoque, reservas e idempotência; typecheck e build; smoke tests de rotas; empacotar código, lockfile, SQL e instruções.

Não inclui integração com transportadora, cobrança automática, emissão fiscal ou devoluções. PDF é relatório gerado em arquivo; Excel utiliza XLSX. PWA instala em HTTPS; operações reais precisam de internet, sem fila offline. A logo original não veio neste anexo textual: marca vetorial provisória substituível.
