# Auditoria e Correção Geral (E2E) - Gestão BMs

Este plano visa garantir a estabilidade completa do sistema através de uma auditoria de ponta a ponta e a correção de erros identificados nas políticas de segurança, integração de dados e interface.

## 1. Auditoria e Estabilidade do Dashboard
- **Validação de Cálculos:** Revisar fórmulas de ROI, Lucro e Taxa de Acertos em `src/routes/_authenticated/index.tsx` para tratar divisões por zero ou valores nulos (uso de `|| 0`).
- **Cards de Métricas:** Garantir que o componente `CartaoMetrica` oculte valores corretamente quando a permissão `ocultar_valores` estiver ativa.

## 2. Correção de Segurança e RLS
- **Funções SQL:** Garantir a existência e visibilidade das funções `has_role` e `proximo_numero_venda` no schema `public`.
- **Políticas de Acesso:** Revisar o middleware de rota em `src/routes/_authenticated/route.tsx` para garantir que o redirecionamento em caso de falta de permissão seja suave e informativo.
- **Grants:** Verificar se todas as tabelas possuem `GRANT ALL` para `authenticated` e `service_role`.

## 3. Fluxos de CRUD e Relacionamentos
- **Vendas:** Validar o cálculo de subtotais e a geração de número sequencial no `FormularioVenda`.
- **Cadastros Rápidos:** Melhorar a experiência de criação rápida de clientes/fornecedores via Combobox em `ModuloRegistros` e `entregas.tsx`.
- **Isenções em Cadastros:** Ajustar o componente `CadastroPessoas` para tratar corretamente as isenções de CPF/CNPJ, E-mail e Telefone, garantindo que valores nulos sejam aceitos pelo banco.

## 4. Interface e Responsividade
- **Modais:** Garantir que todos os modais (Vendas, Equipe, Produção) tenham rolagem adequada e não quebrem em telas pequenas.
- **Botões de Retorno:** Padronizar o comportamento do botão `ChevronLeft` em `CabecalhoPagina` para sempre retornar ao Dashboard (`/`) de forma segura.
- **Console:** Eliminar warnings de chaves duplicadas ou propriedades inválidas observadas durante a navegação.

## Detalhes Técnicos
- Uso de `supabase.rpc` para chamadas de funções específicas.
- Refatoração de componentes comuns para maior robustez contra dados inconsistentes.
- Aplicação de skeletons em todos os estados de carregamento pendentes.
