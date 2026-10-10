
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "customers": {
                  Row: {
                    "id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string
                  }
                  Update: {
                    "id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"groups": {
                  Row: {
                    "created_at": string,"created_by": string | null,"customer_id": string | null,"deleted": boolean | null,"id": string,"name": string | null,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"customer_id"?: string | null,"deleted"?: boolean | null,"id"?: string,"name"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"customer_id"?: string | null,"deleted"?: boolean | null,"id"?: string,"name"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "groups_customer_fk"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"issue_categories": {
                  Row: {
                    "id": string,"locale_tag": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"locale_tag": string
                  }
                  Update: {
                    "id"?: string,"locale_tag"?: string
                  }
                  Relationships: [
                    
                  ]
                },"portfolio_projects": {
                  Row: {
                    "portfolio_id": string,"project_id": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "portfolio_id": string,"project_id": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "portfolio_id"?: string,"project_id"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"portfolios": {
                  Row: {
                    "created_at": string,"created_by": string | null,"customer_id": string | null,"deleted": boolean | null,"id": string,"name": string | null,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"customer_id"?: string | null,"deleted"?: boolean | null,"id": string,"name"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"customer_id"?: string | null,"deleted"?: boolean | null,"id"?: string,"name"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "portfolios_createdby_fk"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "portfolios_customer_fk"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "portfolios_updatedby_fk"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"project_issues": {
                  Row: {
                    "action_plan": string | null,"actual_date": string | null,"category_id": string | null,"created_at": string,"created_by": string | null,"currency": string | null,"deleted": boolean | null,"description": string | null,"estimated_cost_impact": number | null,"estimated_days_delayed": number | null,"has_budget_impact": boolean | null,"has_schedule_impact": boolean | null,"has_scope_impact": boolean | null,"id": string,"issue_id": string | null,"issue_number": number,"owner_id": string | null,"priority": string | null,"project_id": string,"raised_by": string | null,"raised_date": string,"resolution": string | null,"severity": string | null,"status": string | null,"target_date": string | null,"title": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action_plan"?: string | null,"actual_date"?: string | null,"category_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string | null,"deleted"?: boolean | null,"description"?: string | null,"estimated_cost_impact"?: number | null,"estimated_days_delayed"?: number | null,"has_budget_impact"?: boolean | null,"has_schedule_impact"?: boolean | null,"has_scope_impact"?: boolean | null,"id"?: string,"issue_id"?: never,"issue_number": number,"owner_id"?: string | null,"priority"?: string | null,"project_id": string,"raised_by"?: string | null,"raised_date"?: string,"resolution"?: string | null,"severity"?: string | null,"status"?: string | null,"target_date"?: string | null,"title": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "action_plan"?: string | null,"actual_date"?: string | null,"category_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string | null,"deleted"?: boolean | null,"description"?: string | null,"estimated_cost_impact"?: number | null,"estimated_days_delayed"?: number | null,"has_budget_impact"?: boolean | null,"has_schedule_impact"?: boolean | null,"has_scope_impact"?: boolean | null,"id"?: string,"issue_id"?: never,"issue_number"?: number,"owner_id"?: string | null,"priority"?: string | null,"project_id"?: string,"raised_by"?: string | null,"raised_date"?: string,"resolution"?: string | null,"severity"?: string | null,"status"?: string | null,"target_date"?: string | null,"title"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_issues_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "issue_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_issues_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_issues_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_issues_raised_by_fkey"
      columns: ["raised_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"project_permissions": {
                  Row: {
                    "id": string,"level": string | null,"project_id": string | null,"target_id": string | null,"type": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id": string,"level"?: string | null,"project_id"?: string | null,"target_id"?: string | null,"type"?: string | null
                  }
                  Update: {
                    "id"?: string,"level"?: string | null,"project_id"?: string | null,"target_id"?: string | null,"type"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"project_risks": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted": boolean,"description": string | null,"due_date": string | null,"id": string,"impact": string,"mitigation": string | null,"owner_id": string | null,"probability": string,"project_id": string,"risk_id": string | null,"risk_number": number,"status": string,"title": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted"?: boolean,"description"?: string | null,"due_date"?: string | null,"id": string,"impact"?: string,"mitigation"?: string | null,"owner_id"?: string | null,"probability"?: string,"project_id": string,"risk_id"?: never,"risk_number": number,"status"?: string,"title": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted"?: boolean,"description"?: string | null,"due_date"?: string | null,"id"?: string,"impact"?: string,"mitigation"?: string | null,"owner_id"?: string | null,"probability"?: string,"project_id"?: string,"risk_id"?: never,"risk_number"?: number,"status"?: string,"title"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_risks_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_risks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_status_reports": {
                  Row: {
                    "comments": string | null,"created_at": string,"created_by": string | null,"id": string,"project_id": string | null,"project_status_id": string | null,"published_at": string | null,"range_end": string | null,"range_start": string | null,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "comments"?: string | null,"created_at"?: string,"created_by"?: string | null,"id": string,"project_id"?: string | null,"project_status_id"?: string | null,"published_at"?: string | null,"range_end"?: string | null,"range_start"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "comments"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"project_id"?: string | null,"project_status_id"?: string | null,"published_at"?: string | null,"range_end"?: string | null,"range_start"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"project_types": {
                  Row: {
                    "active": boolean | null,"description": string | null,"id": string,"name": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean | null,"description"?: string | null,"id": string,"name"?: string | null
                  }
                  Update: {
                    "active"?: boolean | null,"description"?: string | null,"id"?: string,"name"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"projects": {
                  Row: {
                    "created_at": string,"created_by": string | null,"customer_id": string | null,"deleted": boolean | null,"end_date": string | null,"id": string,"name": string | null,"owner_id": string | null,"start_date": string | null,"type_id": string | null,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"customer_id"?: string | null,"deleted"?: boolean | null,"end_date"?: string | null,"id": string,"name"?: string | null,"owner_id"?: string | null,"start_date"?: string | null,"type_id"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"customer_id"?: string | null,"deleted"?: boolean | null,"end_date"?: string | null,"id"?: string,"name"?: string | null,"owner_id"?: string | null,"start_date"?: string | null,"type_id"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_createdby_fk"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_customer_fk"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_owner_fk"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_type_fk"
      columns: ["type_id"]
isOneToOne: false
      referencedRelation: "project_types"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_updatedby_fk"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"user_groups": {
                  Row: {
                    "group_id": string,"updated_at": string,"updated_by": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "group_id": string,"updated_at"?: string,"updated_by"?: string | null,"user_id": string
                  }
                  Update: {
                    "group_id"?: string,"updated_at"?: string,"updated_by"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_groups_group_fk"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_groups_user_fk"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"users": {
                  Row: {
                    "active": boolean | null,"city": string | null,"country": string | null,"created_at": string,"created_by": string | null,"customer_id": string | null,"deleted": boolean | null,"display_name": string | null,"email": string | null,"full_name": string | null,"id": string,"locale": string | null,"role": string,"timezone": string | null,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean | null,"city"?: string | null,"country"?: string | null,"created_at"?: string,"created_by"?: string | null,"customer_id"?: string | null,"deleted"?: boolean | null,"display_name"?: string | null,"email"?: string | null,"full_name"?: string | null,"id": string,"locale"?: string | null,"role"?: string,"timezone"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "active"?: boolean | null,"city"?: string | null,"country"?: string | null,"created_at"?: string,"created_by"?: string | null,"customer_id"?: string | null,"deleted"?: boolean | null,"display_name"?: string | null,"email"?: string | null,"full_name"?: string | null,"id"?: string,"locale"?: string | null,"role"?: string,"timezone"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "users_createdby_fk"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "users_customer_fk"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "users_updatedby_fk"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "current_user_role":
{ Args: Record<PropertyKey, never>; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
