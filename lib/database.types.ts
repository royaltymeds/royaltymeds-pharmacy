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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          added_at: string | null
          drug_id: string
          id: string
          quantity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          drug_id: string
          id?: string
          quantity: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          drug_id?: string
          id?: string
          quantity?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "otc_drugs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          conversation_type: string | null
          created_at: string | null
          created_by: string
          id: string
          participant_ids: string[]
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          conversation_type?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          participant_ids: string[]
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          conversation_type?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          participant_ids?: string[]
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_patient_links: {
        Row: {
          created_at: string | null
          doctor_id: string
          id: string
          patient_id: string
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          id?: string
          patient_id: string
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: []
      }
      doctor_prescriptions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          doctor_email: string | null
          doctor_id: string
          doctor_name: string | null
          doctor_phone: string | null
          dosage: string | null
          duration: string | null
          file_name: string | null
          file_url: string | null
          filled_at: string | null
          id: string
          instructions: string | null
          is_refillable: boolean | null
          last_refilled_at: string | null
          medication_name: string | null
          notes: string | null
          patient_id: string | null
          pharmacist_name: string | null
          practice_city: string | null
          practice_country: string | null
          practice_name: string | null
          practice_postal_code: string | null
          practice_state: string | null
          practice_street_line_1: string | null
          practice_street_line_2: string | null
          prescription_number: string
          refill_count: number | null
          refill_limit: number | null
          refill_status: string | null
          refills_allowed: number | null
          rejection_reason: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          doctor_email?: string | null
          doctor_id: string
          doctor_name?: string | null
          doctor_phone?: string | null
          dosage?: string | null
          duration?: string | null
          file_name?: string | null
          file_url?: string | null
          filled_at?: string | null
          id?: string
          instructions?: string | null
          is_refillable?: boolean | null
          last_refilled_at?: string | null
          medication_name?: string | null
          notes?: string | null
          patient_id?: string | null
          pharmacist_name?: string | null
          practice_city?: string | null
          practice_country?: string | null
          practice_name?: string | null
          practice_postal_code?: string | null
          practice_state?: string | null
          practice_street_line_1?: string | null
          practice_street_line_2?: string | null
          prescription_number?: string
          refill_count?: number | null
          refill_limit?: number | null
          refill_status?: string | null
          refills_allowed?: number | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          doctor_email?: string | null
          doctor_id?: string
          doctor_name?: string | null
          doctor_phone?: string | null
          dosage?: string | null
          duration?: string | null
          file_name?: string | null
          file_url?: string | null
          filled_at?: string | null
          id?: string
          instructions?: string | null
          is_refillable?: boolean | null
          last_refilled_at?: string | null
          medication_name?: string | null
          notes?: string | null
          patient_id?: string | null
          pharmacist_name?: string | null
          practice_city?: string | null
          practice_country?: string | null
          practice_name?: string | null
          practice_postal_code?: string | null
          practice_state?: string | null
          practice_street_line_1?: string | null
          practice_street_line_2?: string | null
          prescription_number?: string
          refill_count?: number | null
          refill_limit?: number | null
          refill_status?: string | null
          refills_allowed?: number | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_prescriptions_items: {
        Row: {
          brand_choice: string | null
          created_at: string | null
          doctor_prescription_id: string
          dosage: string | null
          duration: string | null
          frequency: string | null
          id: string
          medication_id: string | null
          medication_name: string
          notes: string | null
          price: number | null
          quantity: number | null
          quantity_filled: number | null
          total_amount: number | null
        }
        Insert: {
          brand_choice?: string | null
          created_at?: string | null
          doctor_prescription_id: string
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          medication_id?: string | null
          medication_name: string
          notes?: string | null
          price?: number | null
          quantity?: number | null
          quantity_filled?: number | null
          total_amount?: number | null
        }
        Update: {
          brand_choice?: string | null
          created_at?: string | null
          doctor_prescription_id?: string
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          medication_id?: string | null
          medication_name?: string
          notes?: string | null
          price?: number | null
          quantity?: number | null
          quantity_filled?: number | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_prescriptions_items_doctor_prescription_id_fkey"
            columns: ["doctor_prescription_id"]
            isOneToOne: false
            referencedRelation: "doctor_prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          failurereason: string | null
          id: string
          messageid: string | null
          metadata: Json | null
          recipientemail: string
          sentat: string | null
          status: string | null
          subject: string
          templatetype: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          failurereason?: string | null
          id?: string
          messageid?: string | null
          metadata?: Json | null
          recipientemail: string
          sentat?: string | null
          status?: string | null
          subject: string
          templatetype?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          failurereason?: string | null
          id?: string
          messageid?: string | null
          metadata?: Json | null
          recipientemail?: string
          sentat?: string | null
          status?: string | null
          subject?: string
          templatetype?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          created_at: string | null
          id: string
          orderupdates: boolean | null
          prescriptionupdates: boolean | null
          promotionalemails: boolean | null
          updated_at: string | null
          user_id: string
          weeklynewsletter: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          orderupdates?: boolean | null
          prescriptionupdates?: boolean | null
          promotionalemails?: boolean | null
          updated_at?: string | null
          user_id: string
          weeklynewsletter?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          orderupdates?: boolean | null
          prescriptionupdates?: boolean | null
          promotionalemails?: boolean | null
          updated_at?: string | null
          user_id?: string
          weeklynewsletter?: boolean | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          htmlcontent: string
          id: string
          name: string
          subject: string
          textcontent: string | null
          type: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          htmlcontent: string
          id?: string
          name: string
          subject: string
          textcontent?: string | null
          type: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          htmlcontent?: string
          id?: string
          name?: string
          subject?: string
          textcontent?: string | null
          type?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          drug_id: string
          drug_type: string
          id: string
          notes: string | null
          quantity_after: number
          quantity_before: number
          quantity_change: number
          transaction_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          drug_id: string
          drug_type: string
          id?: string
          notes?: string | null
          quantity_after: number
          quantity_before: number
          quantity_change: number
          transaction_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          drug_id?: string
          drug_type?: string
          id?: string
          notes?: string | null
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          transaction_type?: string
        }
        Relationships: []
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          read_by: string[] | null
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          read_by?: string[] | null
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          read_by?: string[] | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          drug_id: string | null
          drug_name: string
          id: string
          pharm_confirm: boolean | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          drug_id?: string | null
          drug_name: string
          id?: string
          pharm_confirm?: boolean | null
          order_id: string
          quantity: number
          total_price: number
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          drug_id?: string | null
          drug_name?: string
          id?: string
          pharm_confirm?: boolean | null
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_drug_id_fkey"
            columns: ["drug_id"]
            isOneToOne: false
            referencedRelation: "otc_drugs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          billing_street_line_1: string | null
          billing_street_line_2: string | null
          created_at: string | null
          doctor_prescription_id: string | null
          id: string
          is_prescription_order: boolean | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          prescription_id: string | null
          receipt_url: string | null
          shipping_amount: number | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          shipping_street_line_1: string | null
          shipping_street_line_2: string | null
          status: string | null
          subtotal_amount: number
          tax_amount: number | null
          total_amount: number
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_line_1?: string | null
          billing_street_line_2?: string | null
          created_at?: string | null
          doctor_prescription_id?: string | null
          id?: string
          is_prescription_order?: boolean | null
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          prescription_id?: string | null
          receipt_url?: string | null
          shipping_amount?: number | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          shipping_street_line_1?: string | null
          shipping_street_line_2?: string | null
          status?: string | null
          subtotal_amount: number
          tax_amount?: number | null
          total_amount: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_line_1?: string | null
          billing_street_line_2?: string | null
          created_at?: string | null
          doctor_prescription_id?: string | null
          id?: string
          is_prescription_order?: boolean | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          prescription_id?: string | null
          receipt_url?: string | null
          shipping_amount?: number | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          shipping_street_line_1?: string | null
          shipping_street_line_2?: string | null
          status?: string | null
          subtotal_amount?: number
          tax_amount?: number | null
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_doctor_prescription_id_fkey"
            columns: ["doctor_prescription_id"]
            isOneToOne: false
            referencedRelation: "doctor_prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      otc_drugs: {
        Row: {
          active_ingredient: string | null
          category: string
          category_type: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          dosage: string | null
          expiration_date: string | null
          file_url: string | null
          id: string
          indications: string | null
          is_on_sale: boolean | null
          lot_number: string | null
          low_stock_alert: boolean | null
          manufacturer: string | null
          name: string
          pharm_confirm: boolean | null
          notes: string | null
          pack_size: string | null
          quantity_on_hand: number
          reorder_level: number
          reorder_quantity: number
          sale_discount_percent: number | null
          sale_end_date: string | null
          sale_price: number | null
          sale_start_date: string | null
          side_effects: string | null
          sku: string
          status: string | null
          strength: string | null
          sub_category: string
          unit_price: number
          updated_at: string | null
          warnings: string | null
        }
        Insert: {
          active_ingredient?: string | null
          category: string
          category_type?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          dosage?: string | null
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          indications?: string | null
          is_on_sale?: boolean | null
          lot_number?: string | null
          low_stock_alert?: boolean | null
          manufacturer?: string | null
          name: string
          pharm_confirm?: boolean | null
          notes?: string | null
          pack_size?: string | null
          quantity_on_hand?: number
          reorder_level?: number
          reorder_quantity?: number
          sale_discount_percent?: number | null
          sale_end_date?: string | null
          sale_price?: number | null
          sale_start_date?: string | null
          side_effects?: string | null
          sku: string
          status?: string | null
          strength?: string | null
          sub_category: string
          unit_price: number
          updated_at?: string | null
          warnings?: string | null
        }
        Update: {
          active_ingredient?: string | null
          category?: string
          category_type?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          dosage?: string | null
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          indications?: string | null
          is_on_sale?: boolean | null
          lot_number?: string | null
          low_stock_alert?: boolean | null
          manufacturer?: string | null
          name?: string
          pharm_confirm?: boolean | null
          notes?: string | null
          pack_size?: string | null
          quantity_on_hand?: number
          reorder_level?: number
          reorder_quantity?: number
          sale_discount_percent?: number | null
          sale_end_date?: string | null
          sale_price?: number | null
          sale_start_date?: string | null
          side_effects?: string | null
          sku?: string
          status?: string | null
          strength?: string | null
          sub_category?: string
          unit_price?: number
          updated_at?: string | null
          warnings?: string | null
        }
        Relationships: []
      }
      payment_config: {
        Row: {
          account_number: string
          additional_instructions: string | null
          bank_account_holder: string
          bank_name: string
          created_at: string | null
          iban: string | null
          id: string
          kingston_delivery_cost: number | null
          routing_number: string | null
          swift_code: string | null
          tax_rate: number | null
          tax_type: string | null
          updated_at: string | null
        }
        Insert: {
          account_number: string
          additional_instructions?: string | null
          bank_account_holder: string
          bank_name: string
          created_at?: string | null
          iban?: string | null
          id?: string
          kingston_delivery_cost?: number | null
          routing_number?: string | null
          swift_code?: string | null
          tax_rate?: number | null
          tax_type?: string | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string
          additional_instructions?: string | null
          bank_account_holder?: string
          bank_name?: string
          created_at?: string | null
          iban?: string | null
          id?: string
          kingston_delivery_cost?: number | null
          routing_number?: string | null
          swift_code?: string | null
          tax_rate?: number | null
          tax_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prescription_drugs: {
        Row: {
          active_ingredient: string | null
          category: string
          category_type: string | null
          controlled_substance: boolean | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          dosage: string | null
          expiration_date: string | null
          file_url: string | null
          id: string
          indications: string | null
          is_on_sale: boolean | null
          lot_number: string | null
          low_stock_alert: boolean | null
          manufacturer: string | null
          name: string
          notes: string | null
          pack_size: string | null
          quantity_on_hand: number
          reorder_level: number
          reorder_quantity: number
          requires_refrigeration: boolean | null
          sale_discount_percent: number | null
          sale_end_date: string | null
          sale_price: number | null
          sale_start_date: string | null
          side_effects: string | null
          sku: string
          status: string | null
          strength: string | null
          sub_category: string
          unit_price: number
          updated_at: string | null
          warnings: string | null
        }
        Insert: {
          active_ingredient?: string | null
          category: string
          category_type?: string | null
          controlled_substance?: boolean | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          dosage?: string | null
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          indications?: string | null
          is_on_sale?: boolean | null
          lot_number?: string | null
          low_stock_alert?: boolean | null
          manufacturer?: string | null
          name: string
          notes?: string | null
          pack_size?: string | null
          quantity_on_hand?: number
          reorder_level?: number
          reorder_quantity?: number
          requires_refrigeration?: boolean | null
          sale_discount_percent?: number | null
          sale_end_date?: string | null
          sale_price?: number | null
          sale_start_date?: string | null
          side_effects?: string | null
          sku: string
          status?: string | null
          strength?: string | null
          sub_category: string
          unit_price: number
          updated_at?: string | null
          warnings?: string | null
        }
        Update: {
          active_ingredient?: string | null
          category?: string
          category_type?: string | null
          controlled_substance?: boolean | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          dosage?: string | null
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          indications?: string | null
          is_on_sale?: boolean | null
          lot_number?: string | null
          low_stock_alert?: boolean | null
          manufacturer?: string | null
          name?: string
          notes?: string | null
          pack_size?: string | null
          quantity_on_hand?: number
          reorder_level?: number
          reorder_quantity?: number
          requires_refrigeration?: boolean | null
          sale_discount_percent?: number | null
          sale_end_date?: string | null
          sale_price?: number | null
          sale_start_date?: string | null
          side_effects?: string | null
          sku?: string
          status?: string | null
          strength?: string | null
          sub_category?: string
          unit_price?: number
          updated_at?: string | null
          warnings?: string | null
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          brand_choice: string | null
          created_at: string | null
          doctor_prescription_id: string | null
          dosage: string | null
          id: string
          medication_id: string | null
          medication_name: string | null
          notes: string | null
          prescription_id: string
          price: number | null
          quantity: number
          quantity_filled: number | null
          total_amount: number | null
        }
        Insert: {
          brand_choice?: string | null
          created_at?: string | null
          doctor_prescription_id?: string | null
          dosage?: string | null
          id?: string
          medication_id?: string | null
          medication_name?: string | null
          notes?: string | null
          prescription_id: string
          price?: number | null
          quantity: number
          quantity_filled?: number | null
          total_amount?: number | null
        }
        Update: {
          brand_choice?: string | null
          created_at?: string | null
          doctor_prescription_id?: string | null
          dosage?: string | null
          id?: string
          medication_id?: string | null
          medication_name?: string | null
          notes?: string | null
          prescription_id?: string
          price?: number | null
          quantity?: number
          quantity_filled?: number | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_doctor_prescription_id_fkey"
            columns: ["doctor_prescription_id"]
            isOneToOne: false
            referencedRelation: "doctor_prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          doctor_email: string | null
          doctor_id: string | null
          doctor_name: string | null
          doctor_phone: string | null
          file_url: string
          filled_at: string | null
          id: string
          is_refillable: boolean | null
          last_refilled_at: string | null
          notes: string | null
          patient_id: string
          pharmacist_name: string | null
          practice_city: string | null
          practice_country: string | null
          practice_name: string | null
          practice_postal_code: string | null
          practice_state: string | null
          practice_street_line_1: string | null
          practice_street_line_2: string | null
          prescription_number: string
          quantity: number | null
          refill_count: number | null
          refill_limit: number | null
          refill_status: string | null
          refills_allowed: number | null
          rejection_reason: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          doctor_email?: string | null
          doctor_id?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          file_url: string
          filled_at?: string | null
          id?: string
          is_refillable?: boolean | null
          last_refilled_at?: string | null
          notes?: string | null
          patient_id: string
          pharmacist_name?: string | null
          practice_city?: string | null
          practice_country?: string | null
          practice_name?: string | null
          practice_postal_code?: string | null
          practice_state?: string | null
          practice_street_line_1?: string | null
          practice_street_line_2?: string | null
          prescription_number?: string
          quantity?: number | null
          refill_count?: number | null
          refill_limit?: number | null
          refill_status?: string | null
          refills_allowed?: number | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          doctor_email?: string | null
          doctor_id?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          file_url?: string
          filled_at?: string | null
          id?: string
          is_refillable?: boolean | null
          last_refilled_at?: string | null
          notes?: string | null
          patient_id?: string
          pharmacist_name?: string | null
          practice_city?: string | null
          practice_country?: string | null
          practice_name?: string | null
          practice_postal_code?: string | null
          practice_state?: string | null
          practice_street_line_1?: string | null
          practice_street_line_2?: string | null
          prescription_number?: string
          quantity?: number | null
          refill_count?: number | null
          refill_limit?: number | null
          refill_status?: string | null
          refills_allowed?: number | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refill_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          prescription_id: string
          reason: string | null
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          prescription_id: string
          reason?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          prescription_id?: string
          reason?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refill_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refill_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refill_requests_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      refills: {
        Row: {
          approved_at: string | null
          created_at: string | null
          id: string
          patient_id: string
          prescription_id: string
          refill_number: number
          rejection_reason: string | null
          requested_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          id?: string
          patient_id: string
          prescription_id: string
          refill_number: number
          rejection_reason?: string | null
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string
          prescription_id?: string
          refill_number?: number
          rejection_reason?: string | null
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refills_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refills_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          access_token: string | null
          created_at: string | null
          expires_at: string
          id: string
          last_accessed_at: string | null
          refresh_token: string | null
          token: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          last_accessed_at?: string | null
          refresh_token?: string | null
          token: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          refresh_token?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          name: string
          patient_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          name: string
          patient_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          name?: string
          patient_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          description: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          method: string
          order_id: string | null
          reference_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          method: string
          order_id?: string | null
          reference_id?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          method?: string
          order_id?: string | null
          reference_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          full_name: string
          id: string
          license_number: string | null
          license_state: string | null
          phone: string | null
          postal_code: string | null
          specialty: string | null
          state: string | null
          street_address_line_1: string | null
          street_address_line_2: string | null
          updated_at: string | null
          user_id: string
          zip: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name: string
          id?: string
          license_number?: string | null
          license_state?: string | null
          phone?: string | null
          postal_code?: string | null
          specialty?: string | null
          state?: string | null
          street_address_line_1?: string | null
          street_address_line_2?: string | null
          updated_at?: string | null
          user_id: string
          zip?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string
          id?: string
          license_number?: string | null
          license_state?: string | null
          phone?: string | null
          postal_code?: string | null
          specialty?: string | null
          state?: string | null
          street_address_line_1?: string | null
          street_address_line_2?: string | null
          updated_at?: string | null
          user_id?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          password_hash: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          password_hash?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          password_hash?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      audit_log_action: {
        Args: {
          p_action: string
          p_changes?: Json
          p_entity_id: string
          p_entity_type: string
          p_user_id: string
        }
        Returns: string
      }
      can_refill_prescription: {
        Args: { p_prescription_id: string }
        Returns: boolean
      }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      current_user_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      expire_completed_sales: { Args: never; Returns: undefined }
      expire_old_refill_requests: { Args: never; Returns: undefined }
      get_conversations_with_latest_message: {
        Args: { p_user_id: string }
        Returns: {
          conversation_type: string
          created_at: string
          id: string
          latest_message_content: string
          latest_message_created_at: string
          latest_message_sender_id: string
          participant_ids: string[]
          subject: string
          unread_count: number
          updated_at: string
        }[]
      }
      get_monthly_transaction_summary: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: {
          completed_count: number
          failed_count: number
          total_adjustments: number
          total_payments: number
          total_refunds: number
          transaction_count: number
        }[]
      }
      get_transaction_stats: {
        Args: { p_days?: number }
        Returns: {
          average_transaction: number
          net_revenue: number
          payment_methods: string[]
          total_refunds: number
          total_revenue: number
          transaction_count: number
        }[]
      }
      mark_conversation_as_read: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
