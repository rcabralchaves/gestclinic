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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          created_at: string
          data: string
          duracao: number
          hora_inicio: string
          id: string
          paciente_id: string | null
          paciente_nome: string
          procedimento: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data: string
          duracao?: number
          hora_inicio: string
          id?: string
          paciente_id?: string | null
          paciente_nome: string
          procedimento?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          duracao?: number
          hora_inicio?: string
          id?: string
          paciente_id?: string | null
          paciente_nome?: string
          procedimento?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimentos: {
        Row: {
          created_at: string
          data: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          paciente_id: string
          procedimento: string
          realizado: boolean
          updated_at: string
          user_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          paciente_id: string
          procedimento?: string
          realizado?: boolean
          updated_at?: string
          user_id?: string | null
          valor?: number
        }
        Update: {
          created_at?: string
          data?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          paciente_id?: string
          procedimento?: string
          realizado?: boolean
          updated_at?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          assinado: boolean
          conteudo: string
          created_at: string
          id: string
          paciente_id: string
          template_nome: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assinado?: boolean
          conteudo?: string
          created_at?: string
          id?: string
          paciente_id: string
          template_nome?: string
          titulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assinado?: boolean
          conteudo?: string
          created_at?: string
          id?: string
          paciente_id?: string
          template_nome?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          categoria: string
          created_at: string
          data: string
          descricao: string
          id: string
          tipo: string
          updated_at: string
          user_id: string | null
          valor: number
        }
        Insert: {
          categoria?: string
          created_at?: string
          data: string
          descricao: string
          id?: string
          tipo?: string
          updated_at?: string
          user_id?: string | null
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          tipo?: string
          updated_at?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      estoque: {
        Row: {
          categoria: string | null
          created_at: string
          custo_unitario: number
          descricao: string | null
          id: string
          minimo: number
          nome: string
          quantidade: number
          unidade: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          custo_unitario?: number
          descricao?: string | null
          id?: string
          minimo?: number
          nome: string
          quantidade?: number
          unidade?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          custo_unitario?: number
          descricao?: string | null
          id?: string
          minimo?: number
          nome?: string
          quantidade?: number
          unidade?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      metas: {
        Row: {
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
          user_id: string
          valor_atual: number
          valor_meta: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          tipo?: string
          updated_at?: string
          user_id: string
          valor_atual?: number
          valor_meta?: number
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_atual?: number
          valor_meta?: number
        }
        Relationships: []
      }
      pacientes: {
        Row: {
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          historico_medico: string | null
          id: string
          nome: string
          observacoes: string | null
          retorno_data: string | null
          retorno_tipo: string | null
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          historico_medico?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          retorno_data?: string | null
          retorno_tipo?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          historico_medico?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          retorno_data?: string | null
          retorno_tipo?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      procedimentos: {
        Row: {
          cor: string
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cor?: string
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cnpj: string | null
          consultorio_nome: string | null
          created_at: string
          cro: string | null
          email: string | null
          endereco: string | null
          especialidade: string | null
          especialidade_secundaria: string | null
          id: string
          nome: string
          plano: string
          taxa_antecipacao: number | null
          taxa_credito: number | null
          taxa_debito: number | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cnpj?: string | null
          consultorio_nome?: string | null
          created_at?: string
          cro?: string | null
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          especialidade_secundaria?: string | null
          id?: string
          nome?: string
          plano?: string
          taxa_antecipacao?: number | null
          taxa_credito?: number | null
          taxa_debito?: number | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cnpj?: string | null
          consultorio_nome?: string | null
          created_at?: string
          cro?: string | null
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          especialidade_secundaria?: string | null
          id?: string
          nome?: string
          plano?: string
          taxa_antecipacao?: number | null
          taxa_credito?: number | null
          taxa_debito?: number | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receitas: {
        Row: {
          created_at: string
          data: string
          forma_pagamento: string
          id: string
          paciente: string
          paciente_id: string | null
          parcelas: number | null
          procedimento: string
          updated_at: string
          user_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          forma_pagamento?: string
          id?: string
          paciente: string
          paciente_id?: string | null
          parcelas?: number | null
          procedimento?: string
          updated_at?: string
          user_id?: string | null
          valor?: number
        }
        Update: {
          created_at?: string
          data?: string
          forma_pagamento?: string
          id?: string
          paciente?: string
          paciente_id?: string | null
          parcelas?: number | null
          procedimento?: string
          updated_at?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "receitas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
