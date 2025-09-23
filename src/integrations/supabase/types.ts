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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          client_type: string | null
          company: string | null
          contact_person: string | null
          contact_person_email: string | null
          contact_person_phone: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          facebook_profile: string | null
          first_name: string | null
          gender: string | null
          id: string
          industry: string | null
          instagram_profile: string | null
          job_title: string | null
          last_name: string | null
          linkedin_profile: string | null
          name: string | null
          notes: string | null
          phone: string | null
          registration_number: string | null
          state: string | null
          status: string | null
          tax_number: string | null
          twitter_profile: string | null
          updated_at: string | null
          user_id: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_type?: string | null
          company?: string | null
          contact_person?: string | null
          contact_person_email?: string | null
          contact_person_phone?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          facebook_profile?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          industry?: string | null
          instagram_profile?: string | null
          job_title?: string | null
          last_name?: string | null
          linkedin_profile?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string | null
          tax_number?: string | null
          twitter_profile?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          client_type?: string | null
          company?: string | null
          contact_person?: string | null
          contact_person_email?: string | null
          contact_person_phone?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          facebook_profile?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          industry?: string | null
          instagram_profile?: string | null
          job_title?: string | null
          last_name?: string | null
          linkedin_profile?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string | null
          tax_number?: string | null
          twitter_profile?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          phone: string | null
          registration_number: string | null
          state: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          registration_number?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          registration_number?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      debt_collection_activities: {
        Row: {
          activity_type: string
          amount: number | null
          contact_method: string | null
          created_at: string
          debt_collection_id: string
          description: string
          id: string
          next_action: string | null
          next_action_date: string | null
          outcome: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          amount?: number | null
          contact_method?: string | null
          created_at?: string
          debt_collection_id: string
          description: string
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          outcome?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          amount?: number | null
          contact_method?: string | null
          created_at?: string
          debt_collection_id?: string
          description?: string
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          outcome?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_collection_activities_debt_collection_id_fkey"
            columns: ["debt_collection_id"]
            isOneToOne: false
            referencedRelation: "debt_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_collection_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          template_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          template_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          template_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debt_collections: {
        Row: {
          amount_collected: number | null
          assigned_to: string | null
          collection_fees: number | null
          collection_notes: string | null
          contact_attempts: number | null
          created_at: string
          external_agency: string | null
          id: string
          invoice_id: string
          last_contact_date: string | null
          next_action_date: string | null
          priority: string
          settlement_amount: number | null
          settlement_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_collected?: number | null
          assigned_to?: string | null
          collection_fees?: number | null
          collection_notes?: string | null
          contact_attempts?: number | null
          created_at?: string
          external_agency?: string | null
          id?: string
          invoice_id: string
          last_contact_date?: string | null
          next_action_date?: string | null
          priority?: string
          settlement_amount?: number | null
          settlement_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_collected?: number | null
          assigned_to?: string | null
          collection_fees?: number | null
          collection_notes?: string | null
          contact_attempts?: number | null
          created_at?: string
          external_agency?: string | null
          id?: string
          invoice_id?: string
          last_contact_date?: string | null
          next_action_date?: string | null
          priority?: string
          settlement_amount?: number | null
          settlement_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_collections_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_budgets: {
        Row: {
          budget_amount: number
          category_id: string | null
          created_at: string
          end_date: string
          id: string
          period_type: string
          spent_amount: number | null
          start_date: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_amount?: number
          category_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          period_type: string
          spent_amount?: number | null
          start_date: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_amount?: number
          category_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          period_type?: string
          spent_amount?: number | null
          start_date?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          budget_limit: number | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_limit?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_limit?: number | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_insights: {
        Row: {
          action_items: Json | null
          created_at: string
          description: string
          id: string
          insight_type: string
          is_read: boolean | null
          potential_savings: number | null
          priority: string | null
          title: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          action_items?: Json | null
          created_at?: string
          description: string
          id?: string
          insight_type: string
          is_read?: boolean | null
          potential_savings?: number | null
          priority?: string | null
          title: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          action_items?: Json | null
          created_at?: string
          description?: string
          id?: string
          insight_type?: string
          is_read?: boolean | null
          potential_savings?: number | null
          priority?: string | null
          title?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string | null
          description: string
          expense_date: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          recurring_end_date: string | null
          recurring_frequency: string | null
          status: string | null
          subcategory: string | null
          tags: string[] | null
          tax_amount: number | null
          updated_at: string
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          currency?: string | null
          description: string
          expense_date?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          tax_amount?: number | null
          updated_at?: string
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string | null
          description?: string
          expense_date?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          tax_amount?: number | null
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: []
      }
      fbr_submissions: {
        Row: {
          created_at: string
          fbr_reference: string | null
          fbr_response: Json
          id: string
          invoice_id: string
          submission_data: Json
          submission_status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fbr_reference?: string | null
          fbr_response?: Json
          id?: string
          invoice_id: string
          submission_data?: Json
          submission_status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fbr_reference?: string | null
          fbr_response?: Json
          id?: string
          invoice_id?: string
          submission_data?: Json
          submission_status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_products: {
        Row: {
          allow_backorder: boolean | null
          barcode: string | null
          category_id: string | null
          cost_price: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          maximum_stock_level: number | null
          minimum_stock_level: number | null
          name: string
          quantity_in_stock: number
          sku: string | null
          tax_rate: number | null
          track_inventory: boolean | null
          unit_of_measure: string | null
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_backorder?: boolean | null
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          maximum_stock_level?: number | null
          minimum_stock_level?: number | null
          name: string
          quantity_in_stock?: number
          sku?: string | null
          tax_rate?: number | null
          track_inventory?: boolean | null
          unit_of_measure?: string | null
          unit_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_backorder?: boolean | null
          barcode?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          maximum_stock_level?: number | null
          minimum_stock_level?: number | null
          name?: string
          quantity_in_stock?: number
          sku?: string | null
          tax_rate?: number | null
          track_inventory?: boolean | null
          unit_of_measure?: string | null
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          total_cost: number | null
          transaction_date: string
          transaction_type: string
          unit_cost: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          total_cost?: number | null
          transaction_date?: string
          transaction_type: string
          unit_cost?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          total_cost?: number | null
          transaction_date?: string
          transaction_type?: string
          unit_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          invoice_id: string | null
          product_name: string
          quantity: number
          rate: number
          unit: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          product_name: string
          quantity?: number
          rate?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          product_name?: string
          quantity?: number
          rate?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          discount_percentage: number | null
          due_date: string
          id: string
          invoice_number: string
          is_recurring: boolean | null
          issue_date: string
          last_viewed_at: string | null
          notes: string | null
          paid_amount: number | null
          payment_link_expires_at: string | null
          payment_link_id: string | null
          payment_methods_enabled: Json | null
          payment_status: string | null
          recurring_end_date: string | null
          recurring_frequency: string | null
          reminder_count: number | null
          sent_at: string | null
          shipping_charge: number | null
          status: string | null
          status_history: Json | null
          subtotal: number | null
          tax_amount: number | null
          tax_percentage: number | null
          template_id: number | null
          terms: string | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date: string
          id?: string
          invoice_number: string
          is_recurring?: boolean | null
          issue_date: string
          last_viewed_at?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_link_expires_at?: string | null
          payment_link_id?: string | null
          payment_methods_enabled?: Json | null
          payment_status?: string | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          reminder_count?: number | null
          sent_at?: string | null
          shipping_charge?: number | null
          status?: string | null
          status_history?: Json | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_percentage?: number | null
          template_id?: number | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          is_recurring?: boolean | null
          issue_date?: string
          last_viewed_at?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_link_expires_at?: string | null
          payment_link_id?: string | null
          payment_methods_enabled?: Json | null
          payment_status?: string | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          reminder_count?: number | null
          sent_at?: string | null
          shipping_charge?: number | null
          status?: string | null
          status_history?: Json | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_percentage?: number | null
          template_id?: number | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          created_at: string
          id: string
          max_clients: number | null
          max_emails: number | null
          max_invoices: number | null
          max_pdfs: number | null
          plan_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_clients?: number | null
          max_emails?: number | null
          max_invoices?: number | null
          max_pdfs?: number | null
          plan_name: string
        }
        Update: {
          created_at?: string
          id?: string
          max_clients?: number | null
          max_emails?: number | null
          max_invoices?: number | null
          max_pdfs?: number | null
          plan_name?: string
        }
        Relationships: []
      }
      pos_sale_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          id: string
          line_total: number
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          sku: string | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          line_total?: number
          product_id: string
          product_name: string
          quantity?: number
          sale_id: string
          sku?: string | null
          tax_rate?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          line_total?: number
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          sku?: string | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          amount_paid: number
          change_amount: number
          created_at: string
          currency: string
          customer_id: string | null
          discount_amount: number
          id: string
          invoice_id: string | null
          notes: string | null
          payment_method: string
          payment_status: string
          sale_date: string
          sale_number: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          change_amount?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_number: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          change_amount?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_method?: string
          payment_status?: string
          sale_date?: string
          sale_number?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          crypto_wallet_address: string | null
          date_format: string | null
          email: string | null
          full_name: string | null
          id: string
          language_preference: string | null
          last_reminder_sent: string | null
          reminder_count: number | null
          status: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          crypto_wallet_address?: string | null
          date_format?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          language_preference?: string | null
          last_reminder_sent?: string | null
          reminder_count?: number | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          crypto_wallet_address?: string | null
          date_format?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          language_preference?: string | null
          last_reminder_sent?: string | null
          reminder_count?: number | null
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          quantity_received: number | null
          sku: string | null
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          quantity_received?: number | null
          sku?: string | null
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          quantity_received?: number | null
          sku?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          currency: string
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          received_date: string | null
          status: string
          subtotal: number
          supplier_email: string | null
          supplier_name: string | null
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          received_date?: string | null
          status?: string
          subtotal?: number
          supplier_email?: string | null
          supplier_name?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          received_date?: string | null
          status?: string
          subtotal?: number
          supplier_email?: string | null
          supplier_name?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotation_emails: {
        Row: {
          created_at: string
          id: string
          message: string | null
          quotation_id: string
          recipient_email: string
          sent_at: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          quotation_id: string
          recipient_email: string
          sent_at?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          quotation_id?: string
          recipient_email?: string
          sent_at?: string
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_emails_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          product_name: string
          quantity: number
          quotation_id: string | null
          rate: number
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          product_name: string
          quantity?: number
          quotation_id?: string | null
          rate?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          product_name?: string
          quantity?: number
          quotation_id?: string | null
          rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          accepted_at: string | null
          attachments: Json | null
          client_id: string | null
          converted_to_invoice_id: string | null
          created_at: string
          currency: string | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          issue_date: string
          notes: string | null
          quotation_number: string
          sent_at: string | null
          shipping_charge: number | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_percentage: number | null
          template_id: number | null
          terms: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
          valid_until: string
        }
        Insert: {
          accepted_at?: string | null
          attachments?: Json | null
          client_id?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          issue_date: string
          notes?: string | null
          quotation_number: string
          sent_at?: string | null
          shipping_charge?: number | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_percentage?: number | null
          template_id?: number | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
          valid_until: string
        }
        Update: {
          accepted_at?: string | null
          attachments?: Json | null
          client_id?: string | null
          converted_to_invoice_id?: string | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          issue_date?: string
          notes?: string | null
          quotation_number?: string
          sent_at?: string | null
          shipping_charge?: number | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_percentage?: number | null
          template_id?: number | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_logs: {
        Row: {
          attempt: number
          created_at: string
          error: string | null
          function_name: string
          id: string
          invoice_id: string | null
          message: string | null
          metadata: Json
          scheduled_for: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          error?: string | null
          function_name?: string
          id?: string
          invoice_id?: string | null
          message?: string | null
          metadata?: Json
          scheduled_for?: string | null
          status: string
          type?: string
          user_id: string
        }
        Update: {
          attempt?: number
          created_at?: string
          error?: string | null
          function_name?: string
          id?: string
          invoice_id?: string | null
          message?: string | null
          metadata?: Json
          scheduled_for?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_invoice_fk"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          role: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by: string
          role?: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          company_id: string
          created_at: string | null
          email: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          role: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          email: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_configs: {
        Row: {
          branding: Json
          created_at: string
          custom_domain: string | null
          features: Json
          id: string
          is_active: boolean
          limits: Json
          plan_type: string
          subdomain: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          branding?: Json
          created_at?: string
          custom_domain?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          plan_type?: string
          subdomain?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          branding?: Json
          created_at?: string
          custom_domain?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          plan_type?: string
          subdomain?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          invoice_id: string | null
          payment_method: string | null
          reference_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          payment_method?: string | null
          reference_id?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          payment_method?: string | null
          reference_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reminder_logs: {
        Row: {
          created_at: string
          email_error: string | null
          email_sent: boolean | null
          id: string
          reminder_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_error?: string | null
          email_sent?: boolean | null
          id?: string
          reminder_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_error?: string | null
          email_sent?: boolean | null
          id?: string
          reminder_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          settings_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          settings_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          settings_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          secret: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          secret: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          secret?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_owner: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
