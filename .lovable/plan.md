# Plano de Implementação: Checklist de Permissões e Segurança de Acesso

Este plano visa modernizar o controle de acessos do sistema, substituindo a tabela atual por um checklist intuitivo organizado pelas seções da Sidebar e implementando bloqueios de rota rigorosos.

## Alterações Sugeridas

### 1. Modernização do Modal de Permissões (`src/routes/_authenticated/equipe.tsx`)
- **Novo Checklist Visual:** Substituir a tabela de switches por uma lista categorizada (Operação, Financeiro, Cadastros, Gestão).
- **Sub-permissões:** Implementar checkboxes específicos dentro de cada categoria:
  - Dashboard: "Ocultar valores financeiros".
  - Produção: "Ver apenas a própria produção diária".
  - Financeiro: "Permitir criar novos lançamentos e editar".
- **Ações Rápidas:** Adicionar botões "Marcar Todos", "Desmarcar Todos" e "Perfil Operador Padrão".
- **Estado do Formulário:** Refatorar o `useState` de permissões para refletir as sub-permissões e a nova estrutura.

### 2. Segurança e Controle de Acesso (`src/routes/_authenticated/route.tsx`)
- **Bloqueio de Rota:** Adicionar lógica no `beforeLoad` do layout autenticado para verificar se o usuário tem permissão (`pode_visualizar`) para o módulo que está tentando acessar.
- **Redirecionamento:** Se o acesso for negado, redirecionar para `/` com um aviso de "Acesso não autorizado".

### 3. Ajustes de Navegação (`src/components/layout/app-layout.tsx`)
- **Visibilidade Dinâmica:** Ocultar automaticamente itens do menu lateral se o usuário não tiver permissão de visualização para aquele módulo.

### 4. Hook de Sessão (`src/hooks/use-sessao.tsx`)
- **Melhoria do `temPermissao`:** Garantir que a lógica de "Administrador tem tudo" seja mantida, mas que as permissões granulares funcionem corretamente para os demais papéis.

## Detalhes Técnicos
- Utilização de componentes Radix UI (Checkbox/Switch/Accordion).
- Persistência dos dados na tabela `public.permissoes_acesso`.
- Tratamento de sub-permissões via colunas específicas (`ocultar_valores`, `pode_criar`, etc.) ou JSONB se necessário (manteremos o esquema atual de colunas por simplicidade e performance).
