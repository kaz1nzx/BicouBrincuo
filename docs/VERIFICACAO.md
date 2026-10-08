# Verificação da entrega

- `npm run build`: compilação de produção Next.js concluída.
- `npm run typecheck`: aprovado, sem erros TypeScript.
- `npm test`: 23 testes aprovados (regras de negócio e SQL/RLS em PostgreSQL via PGlite).
- `npm run test:e2e`: 3 testes aprovados em Chromium.

Os testes de navegador verificam compra, transformação de madeira, exportações CSV/XLSX/PDF, checkout e pedido no painel; abertura dos módulos; largura e menu no celular; catálogo público sem custos/dados privados; rejeição da API administrativa sem autenticação e de outra origem.

Desktop e celular foram inspecionados visualmente. Credenciais reais não foram fornecidas: conexão ao Supabase hospedado, entrega de e-mail de recuperação e upload a um bucket real precisam ser validados após sua configuração. Os testes SQL usam esquemas simulados de Auth/Storage e verificam as funções, permissões e políticas criadas por `setup.sql`.

A lista de funcionalidades, decisões e limitações está no README e em ARQUITETURA.md. Nenhuma hospedagem ou projeto externo foi criado ou alterado.
