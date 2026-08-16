export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      auditoria_eventos: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          empresa_id: string | null
          entidade: string
          entidade_id: string | null
          id: string
          motivo: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          empresa_id?: string | null
          entidade: string
          entidade_id?: string | null
          id?: string
          motivo?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          empresa_id?: string | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          motivo?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_eventos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean
          atualizado_por: string | null
          created_at: string
          criado_por: string | null
          documento: string | null
          email: string | null
          empresa_id: string
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          atualizado_por?: string | null
          created_at?: string
          criado_por?: string | null
          documento?: string | null
          email?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          atualizado_por?: string | null
          created_at?: string
          criado_por?: string | null
          documento?: string | null
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          fuso_horario: string
          id: string
          logo_url: string | null
          nome_fantasia: string | null
          razao_social: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          fuso_horario?: string
          id?: string
          logo_url?: string | null
          nome_fantasia?: string | null
          razao_social: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          fuso_horario?: string
          id?: string
          logo_url?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          ativo: boolean
          atualizado_por: string | null
          created_at: string
          criado_por: string | null
          documento: string | null
          email: string | null
          empresa_id: string
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          atualizado_por?: string | null
          created_at?: string
          criado_por?: string | null
          documento?: string | null
          email?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          atualizado_por?: string | null
          created_at?: string
          criado_por?: string | null
          documento?: string | null
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      modalidades_bm: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          custo_producao_padrao: number
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          preco_venda_padrao: number
          updated_at: string
          valor_pagamento_unidade: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          custo_producao_padrao?: number
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          preco_venda_padrao?: number
          updated_at?: string
          valor_pagamento_unidade?: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          custo_producao_padrao?: number
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          preco_venda_padrao?: number
          updated_at?: string
          valor_pagamento_unidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "modalidades_bm_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      papeis_usuario: {
        Row: {
          descricao: string
          id: string
          nome: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          descricao: string
          id?: string
          nome: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          descricao?: string
          id?: string
          nome?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      perfis: {
        Row: {
          ativo: boolean
          cargo: string | null
          created_at: string
          email: string | null
          empresa_id: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_papeis: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          papel: Database["public"]["Enums"]["app_role"]
          usuario_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          papel: Database["public"]["Enums"]["app_role"]
          usuario_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          papel?: Database["public"]["Enums"]["app_role"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_papeis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_itens: {
        Row: {
          created_at: string
          desconto: number
          id: string
          modalidade_id: string | null
          preco_unitario: number
          quantidade: number
          valor_total: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          desconto?: number
          id?: string
          modalidade_id?: string | null
          preco_unitario: number
          quantidade: number
          valor_total: number
          venda_id: string
        }
        Update: {
          created_at?: string
          desconto?: number
          id?: string
          modalidade_id?: string | null
          preco_unitario?: number
          quantidade?: number
          valor_total?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venda_itens_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades_bm"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          acrescimo: number
          atualizado_por: string | null
          cliente_id: string | null
          created_at: string
          criado_por: string | null
          data_entrega_prevista: string | null
          data_venda: string
          desconto: number
          empresa_id: string
          id: string
          numero: number
          observacoes: string | null
          status: Database["public"]["Enums"]["venda_status"]
          subtotal: number
          updated_at: string
          valor_total: number
        }
        Insert: {
          acrescimo?: number
          atualizado_por?: string | null
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          data_entrega_prevista?: string | null
          data_venda?: string
          desconto?: number
          empresa_id: string
          id?: string
          numero: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["venda_status"]
          subtotal?: number
          updated_at?: string
          valor_total?: number
        }
        Update: {
          acrescimo?: number
          atualizado_por?: string | null
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          data_entrega_prevista?: string | null
          data_venda?: string
          desconto?: number
          empresa_id?: string
          id?: string
          numero?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["venda_status"]
          subtotal?: number
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      criar_empresa_inicial: {
        Args: {
          _cnpj?: string
          _nome_fantasia?: string
          _nome_usuario?: string
          _razao_social: string
        }
        Returns: string
      }
      empresa_atual: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      pode_gerenciar: { Args: never; Returns: boolean }
      proximo_numero_venda: { Args: { _empresa: string }; Returns: number }
    }
    Enums: {
      app_role:
        | "administrador"
        | "gestor"
        | "financeiro"
        | "supervisor_producao"
        | "funcionario"
        | "visualizacao"
      venda_status:
        | "rascunho"
        | "confirmada"
        | "em_producao"
        | "pronta"
        | "parcialmente_entregue"
        | "entregue"
        | "cancelada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "administrador",
        "gestor",
        "financeiro",
        "supervisor_producao",
        "funcionario",
        "visualizacao",
      ],
      venda_status: [
        "rascunho",
        "confirmada",
        "em_producao",
        "pronta",
        "parcialmente_entregue",
        "entregue",
        "cancelada",
      ],
    },
  },
} as const
