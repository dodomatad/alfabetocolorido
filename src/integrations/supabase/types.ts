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
      convites_equipe: {
        Row: {
          cargo: string
          created_at: string | null
          criado_por: string | null
          email: string | null
          empresa_id: string | null
          expires_at: string | null
          id: string
          papel: string
          permissoes: Json
          status: string
          token: string
          usado_por: string | null
        }
        Insert: {
          cargo?: string
          created_at?: string | null
          criado_por?: string | null
          email?: string | null
          empresa_id?: string | null
          expires_at?: string | null
          id?: string
          papel?: string
          permissoes?: Json
          status?: string
          token?: string
          usado_por?: string | null
        }
        Update: {
          cargo?: string
          created_at?: string | null
          criado_por?: string | null
          email?: string | null
          empresa_id?: string | null
          expires_at?: string | null
          id?: string
          papel?: string
          permissoes?: Json
          status?: string
          token?: string
          usado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convites_equipe_empresa_id_fkey"
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
      entregas: {
        Row: {
          atualizado_por: string | null
          cliente_id: string | null
          created_at: string
          criado_por: string | null
          custo_reposicao: number | null
          data_prevista: string | null
          data_realizada: string | null
          destinatario: string | null
          empresa_id: string
          endereco: string | null
          id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["entrega_status"]
          transportadora: string | null
          updated_at: string
          venda_id: string | null
        }
        Insert: {
          atualizado_por?: string | null
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          custo_reposicao?: number | null
          data_prevista?: string | null
          data_realizada?: string | null
          destinatario?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["entrega_status"]
          transportadora?: string | null
          updated_at?: string
          venda_id?: string | null
        }
        Update: {
          atualizado_por?: string | null
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          custo_reposicao?: number | null
          data_prevista?: string | null
          data_realizada?: string | null
          destinatario?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["entrega_status"]
          transportadora?: string | null
          updated_at?: string
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entregas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      equipe_membros: {
        Row: {
          cargo: string
          created_at: string | null
          email: string
          empresa_id: string
          id: string
          nome: string
          papel: string
          permissoes: Json | null
          status: string
          status_senha: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cargo: string
          created_at?: string | null
          email: string
          empresa_id: string
          id?: string
          nome: string
          papel?: string
          permissoes?: Json | null
          status?: string
          status_senha?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cargo?: string
          created_at?: string | null
          email?: string
          empresa_id?: string
          id?: string
          nome?: string
          papel?: string
          permissoes?: Json | null
          status?: string
          status_senha?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipe_membros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
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
      itens_estoque: {
        Row: {
          ativo: boolean
          atualizado_por: string | null
          codigo: string | null
          created_at: string
          criado_por: string | null
          custo_unitario: number
          empresa_id: string
          id: string
          localizacao: string | null
          nome: string
          observacoes: string | null
          quantidade_atual: number
          quantidade_minima: number
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          atualizado_por?: string | null
          codigo?: string | null
          created_at?: string
          criado_por?: string | null
          custo_unitario?: number
          empresa_id: string
          id?: string
          localizacao?: string | null
          nome: string
          observacoes?: string | null
          quantidade_atual?: number
          quantidade_minima?: number
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          atualizado_por?: string | null
          codigo?: string | null
          created_at?: string
          criado_por?: string | null
          custo_unitario?: number
          empresa_id?: string
          id?: string
          localizacao?: string | null
          nome?: string
          observacoes?: string | null
          quantidade_atual?: number
          quantidade_minima?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_estoque_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_financeiros: {
        Row: {
          atualizado_por: string | null
          categoria: string | null
          cliente_id: string | null
          created_at: string
          criado_por: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          forma_pagamento: string | null
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          quantidade_unidades: number | null
          situacao: Database["public"]["Enums"]["financeiro_situacao"]
          subcategoria: string | null
          tipo: Database["public"]["Enums"]["financeiro_tipo"]
          updated_at: string
          valor: number
          valor_pago: number
          venda_id: string | null
        }
        Insert: {
          atualizado_por?: string | null
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao: string
          empresa_id: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          quantidade_unidades?: number | null
          situacao?: Database["public"]["Enums"]["financeiro_situacao"]
          subcategoria?: string | null
          tipo: Database["public"]["Enums"]["financeiro_tipo"]
          updated_at?: string
          valor?: number
          valor_pago?: number
          venda_id?: string | null
        }
        Update: {
          atualizado_por?: string | null
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string
          criado_por?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          quantidade_unidades?: number | null
          situacao?: Database["public"]["Enums"]["financeiro_situacao"]
          subcategoria?: string | null
          tipo?: Database["public"]["Enums"]["financeiro_tipo"]
          updated_at?: string
          valor?: number
          valor_pago?: number
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_financeiros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_acesso: {
        Row: {
          created_at: string | null
          dispositivo: string
          empresa_id: string
          id: string
          ip: string
          status: string
          usuario_email: string | null
          usuario_id: string | null
          usuario_nome: string
        }
        Insert: {
          created_at?: string | null
          dispositivo: string
          empresa_id: string
          id?: string
          ip: string
          status?: string
          usuario_email?: string | null
          usuario_id?: string | null
          usuario_nome: string
        }
        Update: {
          created_at?: string | null
          dispositivo?: string
          empresa_id?: string
          id?: string
          ip?: string
          status?: string
          usuario_email?: string | null
          usuario_id?: string | null
          usuario_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_acesso_empresa_id_fkey"
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
      ordens_producao: {
        Row: {
          atualizado_por: string | null
          created_at: string
          criado_por: string | null
          data_inicio: string | null
          data_prazo: string | null
          descricao: string
          empresa_id: string
          id: string
          modalidade_id: string | null
          observacoes: string | null
          quantidade: number
          quantidade_concluida: number
          responsavel: string | null
          status: Database["public"]["Enums"]["producao_status"]
          updated_at: string
          venda_id: string | null
        }
        Insert: {
          atualizado_por?: string | null
          created_at?: string
          criado_por?: string | null
          data_inicio?: string | null
          data_prazo?: string | null
          descricao: string
          empresa_id: string
          id?: string
          modalidade_id?: string | null
          observacoes?: string | null
          quantidade?: number
          quantidade_concluida?: number
          responsavel?: string | null
          status?: Database["public"]["Enums"]["producao_status"]
          updated_at?: string
          venda_id?: string | null
        }
        Update: {
          atualizado_por?: string | null
          created_at?: string
          criado_por?: string | null
          data_inicio?: string | null
          data_prazo?: string | null
          descricao?: string
          empresa_id?: string
          id?: string
          modalidade_id?: string | null
          observacoes?: string | null
          quantidade?: number
          quantidade_concluida?: number
          responsavel?: string | null
          status?: Database["public"]["Enums"]["producao_status"]
          updated_at?: string
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_producao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades_bm"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_producao_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
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
      permissoes_acesso: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          modulo: Database["public"]["Enums"]["modulo_sistema"]
          ocultar_valores: boolean | null
          pode_criar: boolean | null
          pode_editar: boolean | null
          pode_excluir: boolean | null
          pode_visualizar: boolean | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          modulo: Database["public"]["Enums"]["modulo_sistema"]
          ocultar_valores?: boolean | null
          pode_criar?: boolean | null
          pode_editar?: boolean | null
          pode_excluir?: boolean | null
          pode_visualizar?: boolean | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          modulo?: Database["public"]["Enums"]["modulo_sistema"]
          ocultar_valores?: boolean | null
          pode_criar?: boolean | null
          pode_editar?: boolean | null
          pode_excluir?: boolean | null
          pode_visualizar?: boolean | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissoes_acesso_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      producao_diaria: {
        Row: {
          atualizado_por: string | null
          bloqueios: number
          bms_aquecidas: number
          bms_criadas: number
          contas_subidas: number
          contas_viradas: number
          created_at: string
          criado_por: string | null
          data_registro: string
          empresa_id: string
          id: string
          meta_diaria: number
          motivo_queda: Database["public"]["Enums"]["motivo_queda"] | null
          observacoes: string | null
          operador: string
          operador_id: string | null
          updated_at: string
        }
        Insert: {
          atualizado_por?: string | null
          bloqueios?: number
          bms_aquecidas?: number
          bms_criadas?: number
          contas_subidas?: number
          contas_viradas?: number
          created_at?: string
          criado_por?: string | null
          data_registro?: string
          empresa_id: string
          id?: string
          meta_diaria?: number
          motivo_queda?: Database["public"]["Enums"]["motivo_queda"] | null
          observacoes?: string | null
          operador: string
          operador_id?: string | null
          updated_at?: string
        }
        Update: {
          atualizado_por?: string | null
          bloqueios?: number
          bms_aquecidas?: number
          bms_criadas?: number
          contas_subidas?: number
          contas_viradas?: number
          created_at?: string
          criado_por?: string | null
          data_registro?: string
          empresa_id?: string
          id?: string
          meta_diaria?: number
          motivo_queda?: Database["public"]["Enums"]["motivo_queda"] | null
          observacoes?: string | null
          operador?: string
          operador_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "producao_diaria_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      reposicoes: {
        Row: {
          atualizado_por: string | null
          cliente_id: string
          created_at: string
          criado_por: string | null
          data_reposicao: string
          empresa_id: string
          id: string
          modalidade_id: string
          motivo: string | null
          observacoes: string | null
          quantidade: number
          status: string
          updated_at: string
          venda_id: string | null
        }
        Insert: {
          atualizado_por?: string | null
          cliente_id: string
          created_at?: string
          criado_por?: string | null
          data_reposicao?: string
          empresa_id: string
          id?: string
          modalidade_id: string
          motivo?: string | null
          observacoes?: string | null
          quantidade?: number
          status?: string
          updated_at?: string
          venda_id?: string | null
        }
        Update: {
          atualizado_por?: string | null
          cliente_id?: string
          created_at?: string
          criado_por?: string | null
          data_reposicao?: string
          empresa_id?: string
          id?: string
          modalidade_id?: string
          motivo?: string | null
          observacoes?: string | null
          quantidade?: number
          status?: string
          updated_at?: string
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reposicoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposicoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposicoes_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades_bm"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposicoes_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      reposicoes_perfis: {
        Row: {
          cliente_nome: string
          created_at: string | null
          custo_reposicao: number
          empresa_id: string
          id: string
          motivo_reposicao: string
          responsavel_id: string | null
          status: string
          tipo_perfil: string
          venda_id: string | null
        }
        Insert: {
          cliente_nome: string
          created_at?: string | null
          custo_reposicao?: number
          empresa_id?: string
          id?: string
          motivo_reposicao: string
          responsavel_id?: string | null
          status?: string
          tipo_perfil: string
          venda_id?: string | null
        }
        Update: {
          cliente_nome?: string
          created_at?: string | null
          custo_reposicao?: number
          empresa_id?: string
          id?: string
          motivo_reposicao?: string
          responsavel_id?: string | null
          status?: string
          tipo_perfil?: string
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reposicoes_perfis_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
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
          numero_venda: number
          observacoes: string | null
          status: Database["public"]["Enums"]["venda_status"]
          status_entrega: string | null
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
          numero_venda?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["venda_status"]
          status_entrega?: string | null
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
          numero_venda?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["venda_status"]
          status_entrega?: string | null
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
      check_permission:
        | {
            Args: {
              _acao?: string
              _modulo: Database["public"]["Enums"]["modulo_sistema"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: { _acao: string; _modulo: string; _user_id: string }
            Returns: boolean
          }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      onboarding_novo_usuario: {
        Args: { _nome_usuario: string }
        Returns: Json
      }
      pode_gerenciar: { Args: never; Returns: boolean }
      proximo_numero_venda:
        | { Args: never; Returns: number }
        | { Args: { _empresa?: string }; Returns: number }
    }
    Enums: {
      app_role:
        | "administrador"
        | "gestor"
        | "financeiro"
        | "supervisor_producao"
        | "funcionario"
        | "visualizacao"
      entrega_status:
        | "pendente"
        | "em_rota"
        | "entregue"
        | "falhou"
        | "cancelada"
      financeiro_situacao:
        | "aberto"
        | "parcial"
        | "pago"
        | "atrasado"
        | "cancelado"
      financeiro_tipo: "receber" | "pagar"
      modulo_sistema:
        | "dashboard"
        | "vendas"
        | "producao"
        | "estoque"
        | "entregas"
        | "financeiro"
        | "clientes"
        | "fornecedores"
        | "equipe"
        | "configuracoes"
      motivo_queda:
        | "erro_cartao"
        | "checkpoint_identidade"
        | "bloqueio_ip"
        | "restricao_imediata"
        | "outros"
      producao_status:
        | "planejada"
        | "em_producao"
        | "pausada"
        | "concluida"
        | "cancelada"
      venda_status:
        | "rascunho"
        | "confirmada"
        | "em_producao"
        | "pronta"
        | "parcialmente_entregue"
        | "entregue"
        | "cancelada"
        | "reembolsada"
        | "em_andamento"
        | "efetuada"
        | "falta_pagamento"
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
      entrega_status: [
        "pendente",
        "em_rota",
        "entregue",
        "falhou",
        "cancelada",
      ],
      financeiro_situacao: [
        "aberto",
        "parcial",
        "pago",
        "atrasado",
        "cancelado",
      ],
      financeiro_tipo: ["receber", "pagar"],
      modulo_sistema: [
        "dashboard",
        "vendas",
        "producao",
        "estoque",
        "entregas",
        "financeiro",
        "clientes",
        "fornecedores",
        "equipe",
        "configuracoes",
      ],
      motivo_queda: [
        "erro_cartao",
        "checkpoint_identidade",
        "bloqueio_ip",
        "restricao_imediata",
        "outros",
      ],
      producao_status: [
        "planejada",
        "em_producao",
        "pausada",
        "concluida",
        "cancelada",
      ],
      venda_status: [
        "rascunho",
        "confirmada",
        "em_producao",
        "pronta",
        "parcialmente_entregue",
        "entregue",
        "cancelada",
        "reembolsada",
        "em_andamento",
        "efetuada",
        "falta_pagamento",
      ],
    },
  },
} as const
