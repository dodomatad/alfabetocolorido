# Plano de Melhoria Visual: Produção & Contingência

O objetivo é transformar a visualização da tela de Produção & Contingência, tornando-a mais moderna, visualmente rica e alinhada com o dashboard principal, utilizando ícones, gradientes e uma hierarquia de informações mais clara.

## Alterações Visuais

### 1. Reestilização dos KPIs
- Adaptar o layout dos cartões de métricas para o novo padrão (maiores, com sombreado forte e ícones em destaque).
- Aplicar cores dinâmicas para o KPI de **Taxa de Aproveitamento** (Verde > 50%, Vermelho < 30%).

### 2. Modernização do Gráfico de Barras
- Substituir o gráfico simples de barras por um com cantos arredondados, gradientes e interatividade aprimorada (Tooltips customizados).
- Utilizar a paleta de cores azul elétrico e verde neon para distinguir "Criadas" de "Viradas".

### 3. Visualização da Esteira (Funil)
- Transformar a lista de etapas da contingência em um gráfico visual de funil ou área para ilustrar a perda de volume entre as fases (Criadas -> Aquecidas -> Subidas -> Viradas).
- Adicionar indicadores visuais de "gargalo" onde a queda for mais acentuada.

### 4. Tabela de Registros
- Melhorar a leitura da tabela com Badges coloridos para motivos de queda e status de aproveitamento.
- Adicionar ícones de ação (editar/excluir) mais sutis e bem posicionados.

## Detalhes Técnicos

- **Componentes:** Atualizar `Pagina` em `src/routes/_authenticated/producao.tsx`.
- **Gráficos:** Utilizar `Recharts` (`AreaChart` para funil, `BarChart` com gradientes para produção).
- **Estilos:** Utilizar as classes de utilidade do Tailwind CSS v4 e as variáveis de tema definidas em `src/styles.css`.
- **Acessibilidade:** Garantir que todos os estados (hover, foco) e tooltips sejam amigáveis e informativos.
