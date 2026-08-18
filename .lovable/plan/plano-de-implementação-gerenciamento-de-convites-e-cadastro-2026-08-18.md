# Plano de Implementação: Gerenciamento de Convites e Cadastro Automático

Este plano descreve a implementação de um sistema de convites para a equipe, permitindo que administradores gerem links personalizados com permissões pré-definidas, e que novos colaboradores se cadastrem automaticamente com essas configurações.

## 1. Banco de Dados (Supabase Migration)

*   Criar a tabela `public.convites_equipe` para armazenar os tokens de convite, e-mail (opcional), cargo, papel e permissões (JSONB).
*   Configurar RLS:
    *   Administradores podem gerenciar convites.
    *   Acesso anônimo permitido para leitura do convite via token (necessário para a tela de registro).
*   Configurar privilégios (GRANT) para `authenticated`, `anon` e `service_role`.

## 2. Backend (Server Functions / API)

*   **Validação de Convite:** Criar uma Server Function ou API Route para validar se um token de convite é válido e está pendente.
*   **Processamento de Registro:** Atualizar ou criar um fluxo de registro que aceite o token de convite, associe o novo usuário à empresa do convidado e aplique as permissões/papéis definidos no convite.

## 3. Interface (Frontend)

### Aba Gestão de Equipe & Acessos (`equipe.tsx`)
*   Adicionar seção de "Convites Ativos".
*   Criar o componente `ModalGerarConvite`:
    *   Campos: E-mail (opcional), Cargo, Papel.
    *   Checklist de permissões (copiar o padrão do modal de edição de membro).
    *   Gerador de token único e link de convite.
*   Listagem de convites pendentes com opção de revogar.

### Tela de Registro/Convite
*   Criar uma nova rota pública `src/routes/aceitar-convite.tsx` (ou similar):
    *   Recebe o token via URL.
    *   Valida o token.
    *   Exibe informações do convite (Empresa, Cargo).
    *   Formulário de cadastro (Nome, Senha) que utiliza o e-mail do convite se presente.
*   Integrar com o Supabase Auth para criar o usuário e disparar a lógica de vinculação automática.

## Detalhes Técnicos

*   **Tabela `convites_equipe`:**
    *   `token`: TEXT UNIQUE (gerado automaticamente).
    *   `empresa_id`: UUID (referência à empresa do administrador que gerou).
    *   `permissoes`: JSONB (estrutura compatível com `permissoes_acesso`).
*   **Fluxo de Segurança:**
    *   O link de convite terá validade (ex: 7 dias).
    *   Ao aceitar, o status muda para `aceito` e o `usado_por` é preenchido.
    *   Triggers ou Server Functions garantirão a atomicidade da criação do perfil e atribuição de permissões.
