export interface ProducaoDiaria {
  id: string;
  empresa_id: string;
  created_at: string;
  updated_at?: string;
  criado_por?: string | null;
  atualizado_por?: string | null;

  // Datas
  data_registro: string;
  data_criacao?: string | null;

  // Funcionário / Operador
  funcionario_id?: string | null;
  funcionario_nome?: string | null;
  operador: string;
  operador_id?: string | null;

  // Ativo & Classificação
  tipo_ativo?: string | null;
  tipo_bm?: string | null;

  // Métricas Operacionais
  recebidas_fornecedor: number;
  bms_criadas: number;
  contas_viradas: number;
  bloqueios: number;
  prontas_estoque?: number;
  aproveitamento?: number;

  // Indicadores adicionais legados
  bms_aquecidas?: number;
  contas_subidas?: number;
  meta_diaria?: number;

  // Perdas & Detalhes
  motivo_queda: string | null;
  observacoes: string | null;

  // Metadados opcionais de BM para estoque
  nome_bm?: string | null;
  limite_bm?: string | null;
  tem_template?: boolean;
  destinatario?: string | null;
  status_envio?: string;
  quantidade?: number;
}

export type MotivoQuedaProducao =
  | "erro_cartao"
  | "checkpoint_identidade"
  | "bloqueio_ip"
  | "restricao_imediata"
  | "outros";
