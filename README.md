# Gestão BM Inteligente

Fase 1 — Fundação do produto

Prompt 1 — Criar o projeto base

Plain Text

Crie um novo aplicativo web chamado Gestão BMs, do zero, para uma empresa que vende e produz BMs.

O sistema será interno, em português do Brasil, responsivo para computador, tablet e celular, com aparência de SaaS financeiro profissional. Use autenticação com Supabase Auth e banco de dados Supabase. Não use dados mockados como fonte permanente e não crie números fictícios no dashboard.

Estruture o projeto com uma navegação lateral contendo:

- Visão geral;

- Vendas;

- Produção;

- Estoque;

- Entregas;

- Financeiro;

- Contas a receber;

- Contas a pagar;

- Clientes;

- Fornecedores;

- Equipe;

- Relatórios;

- Configurações.

Crie inicialmente o layout, o sistema de rotas, a autenticação, o perfil do usuário, os estados de carregamento, erro e vazio, o tema visual e os componentes reutilizáveis. Não implemente ainda regras financeiras complexas antes da estrutura de banco ser criada.

Use português do Brasil em todos os textos. Use BRL para valores, dd/MM/yyyy para datas e uma interface limpa, profissional e objetiva. Não use lorem ipsum, textos genéricos ou gráficos decorativos.

Prompt 2 — Identidade visual e experiência do usuário

Plain Text

Defina a identidade visual do Gestão BMs como um aplicativo financeiro operacional confiável.

Use uma paleta profissional com fundo claro, azul-marinho ou grafite para navegação, verde para resultados positivos, vermelho para perdas ou atrasos e amarelo para alertas. Não dependa apenas de cores para indicar estados: use textos, ícones e badges.

Crie componentes padronizados para cards de indicadores, tabelas, filtros, abas, modais, formulários, confirmações, toasts, badges de status, paginação e gráficos.

O menu lateral deve mostrar a página atual. O topo deve exibir empresa, usuário logado, papel de acesso e botão de sair. Em telas pequenas, o menu deve virar drawer.

Toda tela deve possuir estado de carregamento, estado vazio com orientação útil, estado de erro com opção de tentar novamente e feedback após salvar. Use skeletons em vez de telas brancas durante o carregamento.

Fase 2 — Banco de dados e segurança

Prompt 3 — Criar o modelo inicial do banco

Plain Text

Crie uma migration Supabase completa para o novo projeto Gestão BMs. Não crie dados fake e não coloque valores financeiros fixos no frontend.

Crie as tabelas abaixo com UUID, created_at, updated_at quando aplicável, foreign keys, índices e constraints:

1. `empresas`: id, razao_social, nome_fantasia, cnpj, telefone, email, endereco, logo_url, ativo, created_at, updated_at.

2. `perfis`: id vinculado a auth.users, empresa_id, nome, email, telefone, cargo, ativo, created_at, updated_at.

3. `papeis_usuario`: id, nome, descricao.

4. `usuarios_papeis`: usuario_id, papel_id, empresa_id, created_at.

5. `clientes`: id, empresa_id, nome, documento, telefone, email, endereco, observacoes, ativo, created_at, updated_at.

6. `fornecedores`: id, empresa_id, nome, documento, telefone, email, observacoes, ativo, created_at, updated_at.

7. `modalidades_bm`: id, empresa_id, nome, codigo, descricao, preco_venda_padrao, custo_producao_padrao, ativo, created_at, updated_at.

8. `vendas`: id, empresa_id, cliente_id, numero, data_venda, data_entrega_prevista, status, subtotal, desconto, acrescimo, valor_total, observacoes, criado_por, created_at, updated_at.

9. `venda_itens`: id, venda_id, modalidade_id, quantidade, preco_unitario, desconto, valor_total, created_at.

10. `fornecedores` e `clientes` devem ser reutilizáveis por vendas, pagamentos e recebimentos.

Use `numeric(14,2)` para valores monetários. Não use float para dinheiro. Crie constraints para impedir quantidades negativas, preços negativos e valores totais inválidos.

Use enums ou tabelas de domínio para status. Garanta que todos os registros tenham `empresa_id` para permitir isolamento entre empresas.

Prompt 4 — RLS e papéis de acesso

Plain Text

Implemente segurança no Supabase para o Gestão BMs.

Crie os papéis: administrador, gestor, financeiro, supervisor_producao, funcionario e visualizacao.

Regras:

- Administrador pode administrar empresa, usuários, configurações, vendas, produção, estoque e financeiro.

- Gestor pode consultar e operar vendas, clientes, fornecedores, produção, estoque e relatórios.

- Financeiro pode operar contas a receber, contas a pagar, lançamentos e relatórios financeiros.

- Supervisor de produção pode criar ordens, distribuir produção, aprovar apontamentos e consultar estoque operacional.

- Funcionário pode consultar somente suas ordens e registrar sua própria produção.

- Visualização pode consultar somente as telas liberadas, sem criar ou alterar registros.

Aplique Row Level Security em todas as tabelas. O isolamento por `empresa_id` deve ser obrigatório. As permissões devem ser verificadas no banco com funções como `has_role`, nunca somente no frontend.

Crie uma função segura para obter o usuário atual e sua empresa. Não exponha chaves secretas no frontend. Registre criado_por, atualizado_por e usuário responsável nas operações sensíveis.

Prompt 5 — Auditoria e padrão de dados

Plain Text

Crie uma estrutura de auditoria para o Gestão BMs.

Crie a tabela `auditoria_eventos` com id, empresa_id, usuario_id, entidade, entidade_id, acao, dados_anteriores, dados_novos, motivo, created_at.

Registre auditoria em criação, alteração, cancelamento, exclusão lógica, mudança de valor, aprovação de produção, ajuste de estoque, recebimento, pagamento, alteração de permissões e fechamento financeiro.

Não apague fisicamente registros financeiros, vendas, produção ou estoque. Use status cancelado ou ativo=false quando for necessário retirar algo da operação.

Crie triggers updated_at e funções para padronizar auditoria. Datas devem ser salvas em UTC e exibidas no fuso configurado da empresa. Valores monetários devem ser numeric e sempre formatados como moeda brasileira no frontend.

Fase 3 — Vendas, clientes e entregas

Prompt 6 — Clientes e fornecedores

Plain Text

Implemente as telas de Clientes e Fornecedores usando o Supabase real.

Cada tela deve permitir listar, pesquisar, filtrar por ativo/inativo, cadastrar, editar, visualizar detalhes e desativar registros. Não exclua fisicamente clientes ou fornecedores que tenham vendas, pagamentos ou histórico associado.

Valide nome obrigatório, documento em formato válido quando preenchido, telefone, email e duplicidade dentro da mesma empresa.

Na tela de detalhes, mostre histórico de vendas, valores recebidos, pendências, entregas e observações relacionadas. Use paginação e ordenação no banco.

Prompt 7 — Cadastro de modalidades e preços

Plain Text

Crie a tela de Configurações para administrar modalidades de BM.

Cada modalidade deve possuir nome, código, descrição, preço de venda padrão, custo de produção padrão, valor de pagamento por unidade quando aplicável e status ativo.

Ao alterar um preço, não altere retroativamente vendas existentes. Salve o preço usado no momento da venda dentro de `venda_itens`.

Somente administrador ou gestor autorizado pode alterar preços e custos padrão. Registre toda alteração na auditoria.

Prompt 8 — Vendas e pedidos

Plain Text

Implemente o módulo de Vendas com dados persistidos no Supabase.

Permita criar uma venda com cliente, data, previsão de entrega, observações e vários itens. Cada item deve possuir modalidade, quantidade, preço unitário, desconto e valor total.

Calcule subtotal, desconto, acréscimo e valor total de forma consistente. O valor crítico deve ser recalculado no banco ou em uma função segura, não aceitando cegamente o valor enviado pelo navegador.

Use os status: rascunho, confirmada, em_producao, pronta, parcialmente_entregue, entregue, cancelada.

Permita duplicar uma venda como nova venda, mas nunca duplique pagamentos ou movimentações antigas. Gere um número sequencial por empresa. Mostre detalhes, linha do tempo, produção relacionada, entregas, recebimentos e saldo a receber.

Prompt 9 — Entregas

Plain Text

Crie o módulo de Entregas vinculado às vendas.

Permita registrar entrega total ou parcial, quantidade por item, data, responsável, comprovante opcional e observações. Não permita entregar quantidade maior que a quantidade vendida ou que o estoque disponível.

Atualize automaticamente o status da venda para parcialmente_entregue ou entregue conforme as quantidades. Registre cada entrega no histórico e na auditoria.

Crie filtros por período, cliente, status, responsável e venda. Mostre entregas atrasadas e próximas do vencimento.

Fase 4 — Produção e funcionários

Prompt 10 — Ordens de produção

Plain Text

Crie o módulo de Produção.

Crie as tabelas `ordens_producao`, `apontamentos_producao` e `regras_pagamento_producao`.

Uma ordem deve conter empresa_id, venda_id opcional, modalidade, quantidade_planejada, quantidade_produzida, quantidade_aprovada, quantidade_perdida, prioridade, prazo, status, supervisor_id e observações.

Crie uma tela de quadro de produção com os status: aguardando, planejada, em_producao, aguardando_conferencia, aprovada, concluida e cancelada.

Permita distribuir uma ordem entre funcionários. Um funcionário deve conseguir registrar somente sua própria produção, com data, quantidade produzida, quantidade perdida e motivo da perda.

Não permita quantidade aprovada maior que a produzida. Toda perda deve exigir motivo. Somente supervisor ou gestor pode aprovar produção.

Prompt 11 — Produtividade e remuneração

Plain Text

Implemente o controle de produtividade dos funcionários.

Crie indicadores por funcionário: quantidade produzida, quantidade aprovada, quantidade perdida, taxa de perda, ordens concluídas, produção por período e valor previsto de remuneração.

As regras de pagamento devem ser configuráveis por modalidade e vigência. O valor do apontamento deve ser congelado quando aprovado, para não mudar caso a regra futura seja alterada.

Crie uma tela de aprovação de produção para o supervisor. Apontamentos aprovados podem gerar contas a pagar ou pagamentos de produção, conforme configuração da empresa.

Não mostre dados financeiros de outros funcionários para um funcionário comum. Garanta a restrição no banco e no frontend.

Fase 5 — Estoque e custos

Prompt 12 — Estoque de BMs e materiais

Plain Text

Crie o módulo de Estoque com rastreabilidade.

Crie as tabelas `produtos_estoque`, `lotes_estoque` e `movimentos_estoque`. Cada movimento deve registrar tipo, quantidade, lote, origem, venda ou ordem de produção relacionada, usuário, data e motivo.

Tipos de movimento: entrada, reserva, consumo, devolução, perda, ajuste e estorno.

Nunca permita estoque negativo. Todas as baixas devem ser transacionais e protegidas contra duplicidade. Registre qual lote foi consumido e calcule o custo real pelo método configurável, inicialmente FIFO.

Mostre saldo atual, reservado, disponível, custo médio, custo por lote, perdas, ajustes e itens abaixo do estoque mínimo.

Prompt 13 — Integração entre produção, vendas e estoque

Plain Text

Integre vendas, produção, estoque e custos sem criar duplicidades.

Ao confirmar uma venda, gere a necessidade de produção ou reserva de estoque conforme a disponibilidade.

Ao aprovar uma produção, atualize o estoque produzido. Ao entregar uma venda, consuma ou reserve os itens corretos. Se houver entrega parcial, faça baixa parcial.

Cada operação deve ser idempotente: repetir a requisição não pode gerar duas baixas, dois recebimentos ou duas contas. Use funções transacionais no Supabase quando a operação envolver mais de uma tabela.

Mostre na venda o custo real, a margem bruta estimada e o vínculo com lotes e ordens de produção.

Fase 6 — Financeiro

Prompt 14 — Plano financeiro e contas

Plain Text

Crie o módulo Financeiro completo.

Crie as tabelas `categorias_financeiras`, `contas_financeiras`, `lancamentos_financeiros`, `contas_receber`, `contas_pagar`, `parcelas` e `periodos_financeiros`.

Categorias mínimas: venda, recebimento de cliente, compra de material, pagamento de fornecedor, produção, salários, comissão, transporte, embalagem, manutenção, imposto, taxa, perda, devolução, desconto e outros.

Contas financeiras devem representar caixa, banco ou carteira. Cada lançamento deve ter tipo, categoria, conta, valor, data de competência, data de vencimento, data de pagamento, status, entidade relacionada, descrição e usuário responsável.

Não permita lançamento em período fechado. Não exclua lançamentos pagos; use cancelamento com justificativa e estorno auditável.

Prompt 15 — Contas a receber

Plain Text

Implemente Contas a Receber.

Ao confirmar uma venda, permita gerar uma conta a receber com uma ou mais parcelas, vencimentos e valores. Permita recebimento total e parcial.

Mostre cliente, venda, parcela, vencimento, valor original, valor recebido, saldo, status e dias em atraso.

Ao registrar recebimento, crie uma entrada na conta financeira escolhida e atualize a parcela de forma transacional. Não aceite recebimento maior que o saldo sem criar um ajuste explícito.

Crie filtros por período, cliente, status, vencimento e atraso. Mostre total vencido, a vencer, recebido no período e previsão de recebimento.

Prompt 16 — Contas a pagar

Plain Text

Implemente Contas a Pagar para fornecedores, funcionários e despesas gerais.

Permita criar contas a pagar manualmente ou a partir de uma compra, produção aprovada, despesa ou pagamento ao fornecedor. Permita parcelamento, pagamento parcial, vencimento, juros, desconto e observação.

Ao pagar, crie uma saída financeira vinculada à conta correta e atualize a parcela. A operação deve ser transacional e idempotente.

Mostre total vencido, a vencer, pago no período, próximos vencimentos e despesas por categoria.

Prompt 17 — Dashboard financeiro

Plain Text

Crie um dashboard executivo baseado exclusivamente em dados reais do Supabase.

Cards: faturamento bruto, faturamento líquido, recebimentos, custos diretos, despesas, perdas, margem bruta, resultado líquido, saldo de caixa, contas a receber e contas a pagar.

Diferencie claramente regime de competência e regime de caixa. O indicador de resultado deve usar competência; o saldo de caixa deve usar pagamentos e recebimentos efetivos.

Inclua filtros hoje, semana, mês atual, mês anterior, trimestre, ano e período personalizado. Inclua gráficos de entradas e saídas, vendas por modalidade, despesas por categoria, produção por funcionário, estoque e evolução das contas em aberto.

Se não houver dados, exiba zero ou estado vazio com orientação. Nunca invente números para preencher o dashboard.

Fase 7 — Relatórios e controle gerencial

Prompt 18 — Relatórios

Plain Text

Crie a área de Relatórios com consultas reais e filtros por período.

Relatórios obrigatórios:

- DRE gerencial;

- fluxo de caixa;

- vendas por cliente;

- vendas por modalidade;

- margem por venda;

- produção por funcionário;

- perdas e refugos;

- estoque por lote;

- contas a receber;

- contas a pagar;

- despesas por categoria.

Todos os relatórios devem mostrar período, data de atualização, filtros aplicados e origem dos dados. Permita exportação CSV. Respeite as permissões de cada papel.

Prompt 19 — Fechamento financeiro e auditoria

Plain Text

Implemente fechamento financeiro mensal.

Crie períodos com status aberto ou fechado. Ao fechar um período, bloqueie novos lançamentos, alterações, cancelamentos, pagamentos e recebimentos com data de competência naquele período.

Somente administrador pode reabrir período, sempre exigindo justificativa. Registre a reabertura na auditoria.

Crie uma tela de conferência antes do fechamento mostrando faturamento, recebimentos, pagamentos, despesas, perdas, saldo, contas em aberto e divergências.

Fase 8 — Qualidade, segurança e acabamento

Prompt 20 — Revisão geral de segurança

Plain Text

Faça uma auditoria técnica de segurança no projeto inteiro.

Verifique RLS em todas as tabelas, isolamento por empresa_id, permissões por papel, exposição de dados financeiros, uso de chaves públicas e secretas, validação de entradas, duplicidade de operações, valores monetários, acesso a registros por ID e proteção contra edição indevida.

Corrija qualquer risco de IDOR, privilege escalation, SQL injection, XSS, alteração de valor pelo frontend, estoque negativo, pagamento duplicado ou acesso de funcionário a dados de outras pessoas.

Não considere segurança concluída apenas porque os botões estão escondidos. Teste as políticas diretamente no banco.

Prompt 21 — Testes de ponta a ponta

Plain Text

Crie e execute uma revisão de ponta a ponta com este cenário:

1. Cadastrar cliente e fornecedor.

2. Cadastrar uma modalidade de BM.

3. Criar uma venda com dois itens.

4. Gerar conta a receber parcelada.

5. Criar ordem de produção.

6. Distribuir a ordem para funcionário.

7. Registrar produção aprovada e perda justificada.

8. Atualizar estoque.

9. Registrar entrega parcial.

10. Registrar recebimento parcial.

11. Criar uma conta a pagar de fornecedor.

12. Registrar pagamento.

13. Lançar uma despesa operacional.

14. Conferir dashboard, fluxo de caixa, DRE, estoque e auditoria.

Teste também cancelamento, estorno, pagamento duplicado, recebimento maior que o saldo, período fechado, funcionário tentando acessar dados financeiros e estoque insuficiente.

Corrija todos os problemas encontrados e entregue uma lista objetiva do que foi testado, do que passou e do que ainda depende de configuração da empresa.

Prompt 22 — Preparação para lançamento

Plain Text

Prepare o Gestão BMs para uso real.

Remova dados de demonstração, textos genéricos, telas sem conexão, logs desnecessários e componentes não utilizados. Garanta que as migrations estejam organizadas e que o projeto possa ser configurado em um novo ambiente Supabase.

Crie uma tela inicial de configuração da empresa para cadastrar nome, logotipo, modalidades, contas financeiras, categorias e usuários.

Crie uma rotina de backup ou exportação dos dados permitidos, documentação das variáveis de ambiente e instruções de implantação. Não exponha secrets no frontend.

Execute build, lint e verificação de tipos. Corrija todos os erros. O sistema só deve ser considerado pronto quando os dados permanecerem após recarregar a página, sair e entrar novamente e consultar o app em outro dispositivo autorizado.

Prompts auxiliares para problemas recorrentes

Quando o Lovable criar apenas telas

Plain Text

Esta funcionalidade não pode ser apenas visual. Conecte-a ao Supabase real, crie a migration necessária, aplique RLS, implemente as queries e mutations, valide os dados no banco e atualize as queries após salvar. Não use mock, localStorage ou array estático como fonte principal. Mostre quais tabelas, políticas e funções foram criadas.

Quando os números estiverem errados

Plain Text

Audite a origem deste indicador. Explique se ele representa competência ou caixa, quais lançamentos entram no cálculo e quais são excluídos. Corrija a função ou consulta no Supabase, não apenas o texto do frontend. Teste venda cancelada, recebimento parcial, pagamento parcial, despesa, perda, estorno e período fechado.

Quando houver erro de banco

Plain Text

Analise o erro sem apagar dados ou migrations anteriores. Identifique se a causa é coluna, tipo, foreign key, RLS, função, trigger ou query. Crie uma migration incremental e segura. Preserve compatibilidade com os registros existentes e confirme o resultado com uma consulta real.

Quando a interface parecer genérica

Plain Text

Melhore a interface sem alterar as regras de negócio. O produto deve parecer um SaaS financeiro profissional: hierarquia visual clara, sidebar consistente, cards objetivos, tabelas legíveis, filtros úteis, responsividade, estados de carregamento e mensagens em português do Brasil. Remova dados fake e elementos decorativos sem função.

Ordem recomendada de construção

Ordem

Entrega

Resultado esperado

1

Fundação, layout e autenticação

Aplicação navegável e usuários autenticados.

2

Banco, empresa e papéis

Dados isolados e permissões protegidas.

3

Clientes, fornecedores e modalidades

Cadastros básicos persistidos.

4

Vendas e entregas

Pedidos reais com histórico.

5

Produção e funcionários

Produção rastreável por pessoa.

6

Estoque e custos

Saldos e custos reais por lote.

7

Financeiro

Caixa, contas a receber, contas a pagar e despesas.

8

Dashboard e relatórios

Indicadores confiáveis para decisão.

9

Auditoria e fechamento

Controle e segurança operacional.

10

Testes e lançamento

Sistema pronto para uso real.

Critério de conclusão

O aplicativo estará funcionando de verdade quando uma venda criada por um usuário puder passar por produção, aprovação, estoque, entrega, recebimento e análise financeira, mantendo todos os dados após recarregar a página, respeitando o papel do usuário e apresentando valores coerentes no dashboard e nos relatórios.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gestao-bm-central.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/69986925-7363-4ca0-bff6-b77837fde7c1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
