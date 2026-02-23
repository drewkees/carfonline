import { NumericKeys } from "node_modules/react-hook-form/dist/types/path/common"

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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      customerdata: {
        Row: {
          id: string
          requestfor: string
          boscode: string | null
          soldtoparty: string
          tin: string | null
          shiptoparty: string | null
          storecode: string | null
          busstyle: string | null
          saletype: string | null
          deladdress: string | null
          billaddress: string | null
          contactperson: string | null
          contactnumber: string | null
          email: string | null
          bucenter: string | null
          region: string | null
          district: string | null
          datestart: string | null
          terms: string | null
          creditlimit: string | null
          bccode: string | null
          bcname: string | null
          saocode: string | null
          saoname: string | null
          supcode: string | null
          custtype: string | null
          approvestatus: string | null
          nextapprover: string | null
          finalapprover: string | null
          maker: string | null
          datecreated: string | null
          initialapprover: string | null
          initialapprovedate: string | null
          secondapprover: string | null
          secondapproverdate: string | null
          thirdapprover: string | null
          thirdapproverdate: string | null
          fourthapprover: string | null
          fourthapproverdate: string | null
          fifthapprover: string | null
          fifthapproverdate: string | null
          sixthapprover: string | null
          sixthapproverdate: string | null
          checkcaprow1: string | null
          checkcaprow2: string | null
          checkcaprow3: string | null
          checkcaprow4: string | null
          checkcaprow5: string | null
          checkcaprow6: string | null
          targetvolumeday: string | null
          targetvolumemonth: string | null
          salessupervisor: string | null
          typecustomer: string | null
          firstname: string | null
          middlename: string | null
          lastname: string | null
          fullname: string | null
          type: string | null
          position: string | null
          supname: string | null
          docowner: string | null
          boscusttype: string | null
          firstapprovername: string | null
          secondapprovername: string | null
          thirdapprovername: string | null
          finalapprovername: string | null
          gencode: string | null
          remarks: string | null
          ismother: string | null
          company: string | null
          pdfexported: string | null
          salesinfosalesorg: string | null
          salesinfodistributionchannel: string | null
          salesinfodivision: string | null
          salesinfobucenter: string | null
          idtype: string | null
        }
        Insert: {
          id?: string
          requestfor: string
          boscode?: string | null
          soldtoparty: string
          tin?: string | null
          shiptoparty?: string | null
          storecode?: string | null
          busstyle?: string | null
          saletype?: string | null
          deladdress?: string | null
          billaddress?: string | null
          contactperson?: string | null
          contactnumber?: string | null
          email?: string | null
          bucenter?: string | null
          region?: string | null
          district?: string | null
          datestart?: string | null
          terms?: string | null
          creditlimit?: string | null
          bccode?: string | null
          bcname?: string | null
          saocode?: string | null
          saoname?: string | null
          supcode?: string | null
          custtype?: string | null
          approvestatus?: string | null
          nextapprover?: string | null
          finalapprover?: string | null
          maker?: string | null
          datecreated?: string | null
          initialapprover?: string | null
          initialapprovedate?: string | null
          secondapprover?: string | null
          secondapproverdate?: string | null
          thirdapprover?: string | null
          thirdapproverdate?: string | null
          fourthapprover?: string | null
          fourthapproverdate?: string | null
          fifthapprover?: string | null
          fifthapproverdate?: string | null
          sixthapprover?: string | null
          sixthapproverdate?: string | null
          checkcaprow1?: string | null
          checkcaprow2?: string | null
          checkcaprow3?: string | null
          checkcaprow4?: string | null
          checkcaprow5?: string | null
          checkcaprow6?: string | null
          targetvolumeday?: string | null
          targetvolumemonth?: string | null
          salessupervisor?: string | null
          typecustomer?: string | null
          firstname?: string | null
          middlename?: string | null
          lastname?: string | null
          fullname?: string | null
          type?: string | null
          position?: string | null
          supname?: string | null
          docowner?: string | null
          boscusttype?: string | null
          firstapprovername?: string | null
          secondapprovername?: string | null
          thirdapprovername?: string | null
          finalapprovername?: string | null
          gencode?: string | null
          remarks?: string | null
          ismother?: string | null
          company?: string | null
          pdfexported?: string | null
          salesinfosalesorg?: string | null
          salesinfodistributionchannel?: string | null
          salesinfodivision?: string | null
          salesinfobucenter?: string | null
          idtype?: string | null
        }
        Update: {
          id?: string
          requestfor?: string
          boscode?: string | null
          soldtoparty?: string
          tin?: string | null
          shiptoparty?: string | null
          storecode?: string | null
          busstyle?: string | null
          saletype?: string | null
          deladdress?: string | null
          billaddress?: string | null
          contactperson?: string | null
          contactnumber?: string | null
          email?: string | null
          bucenter?: string | null
          region?: string | null
          district?: string | null
          datestart?: string | null
          terms?: string | null
          creditlimit?: string | null
          bccode?: string | null
          bcname?: string | null
          saocode?: string | null
          saoname?: string | null
          supcode?: string | null
          custtype?: string | null
          approvestatus?: string | null
          nextapprover?: string | null
          finalapprover?: string | null
          maker?: string | null
          datecreated?: string | null
          initialapprover?: string | null
          initialapprovedate?: string | null
          secondapprover?: string | null
          secondapproverdate?: string | null
          thirdapprover?: string | null
          thirdapproverdate?: string | null
          fourthapprover?: string | null
          fourthapproverdate?: string | null
          fifthapprover?: string | null
          fifthapproverdate?: string | null
          sixthapprover?: string | null
          sixthapproverdate?: string | null
          checkcaprow1?: string | null
          checkcaprow2?: string | null
          checkcaprow3?: string | null
          checkcaprow4?: string | null
          checkcaprow5?: string | null
          checkcaprow6?: string | null
          targetvolumeday?: string | null
          targetvolumemonth?: string | null
          salessupervisor?: string | null
          typecustomer?: string | null
          firstname?: string | null
          middlename?: string | null
          lastname?: string | null
          fullname?: string | null
          type?: string | null
          position?: string | null
          supname?: string | null
          docowner?: string | null
          boscusttype?: string | null
          firstapprovername?: string | null
          secondapprovername?: string | null
          thirdapprovername?: string | null
          finalapprovername?: string | null
          gencode?: string | null
          remarks?: string | null
          ismother?: string | null
          company?: string | null
          pdfexported?: string | null
          salesinfosalesorg?: string | null
          salesinfodistributionchannel?: string | null
          salesinfodivision?: string | null
          salesinfobucenter?: string | null
          idtype?: string | null
        }
        Relationships: []
      },users: {
        Row: {
          userid: string
          email: string
          fullname: string 
          approver: boolean 
          allaccess: boolean 
          editaccess: boolean 
          customlimitaccess: boolean 
          usergroup: string 
          company: string 
          allcompanyaccess: boolean
          complianceandfinalapprover:boolean
        }
        Insert: {
          userid: string
          email: string
          fullname: string | null
          approver: boolean 
          allaccess: boolean 
          editaccess: boolean 
          customlimitaccess: boolean 
          usergroup: string 
          company: string 
          allcompanyaccess: boolean
          complianceandfinalapprover:boolean
        }
        Update: {
          userid?: string
          email?: string
          fullname: string | null
          approver: boolean 
          allaccess: boolean 
          editaccess: boolean 
          customlimitaccess: boolean 
          usergroup: string 
          company: string 
          allcompanyaccess: boolean
          complianceandfinalapprover:boolean
        }
        Relationships: []
      },employees: {
        Row: {
          employeeno: string
          employeename: string
          employeetype: string 
        }
        Insert: {
          employeeno: string
          employeename: string
          employeetype: string 
        }
        Update: {
          employeeno: string
          employeename: string
          employeetype: string 
        }
        Relationships: []
      },schemas: {
        Row: {
          itemid:number
          menuid: string
          menuname: string
          menucmd: string
          objectcode:string
          menutype:string
          menuicon:string
          udfmaintained:boolean
        }
        Insert: {
          itemid?: number
          menuid: string
          menuname: string
          menucmd: string
          objectcode:string
          menutype:string
          menuicon:string 
          udfmaintained:boolean
          
        }
        Update: {
          itemid?: number
          menuid: string
          menuname: string
          menucmd: string
          objectcode:string
          menutype:string
          menuicon:string
          udfmaintained:boolean
        }
        Relationships: []
      },udfmaintainance: {
        Row: {
          id: number
          objectcode: string
          datatype: string 
          fieldid: string 
          fieldnames: string 
          visible: boolean 
          truncatecolumn: boolean
        }
        Insert: {
          id?: number
          objectcode: string
          datatype: string 
          fieldid: string 
          fieldnames: string 
          visible: boolean 
          truncatecolumn: boolean
        }
        Update: {
          id?: number
          objectcode: string
          datatype: string 
          fieldid: string 
          fieldnames: string 
          visible: boolean 
          truncatecolumn: boolean
        }
        Relationships: []
      },messages: {
        Row: {
          id: number
          sender_id: string
          receiver_id: string 
          content: string 
          created_at: Date 
          is_read?: boolean
  read_at?: string
        }
        Insert: {
           id?: number
           sender_id: string
           receiver_id: string 
           content: string 
           created_at?: Date
           is_read?: boolean
  read_at?: string
        }
       Update: {
          id?: number
          sender_id?: string
          receiver_id?: string 
          content?: string 
          created_at?: Date
          is_read?: boolean
          read_at?: string
        }

        Relationships: []
      },customertypeseries: {
        Row: {
          id: string
          carftype: string | null
          bostype: string | null
          defaulttin: string | null
          defaultvolumeday: number | null
          defaultvolumemonth: number | null
          defaultcreditlimit: number | null
          defaultcreditterms: string | null
          defaultsalestype: string | null
          defaulttype: string | null
          defaultapplyfor: string | null
          defaultsoldto: string | null
          defaultbillingaddress: string | null
        }
        Insert: {
          id?: string
          carftype: string | null
          bostype: string | null
          defaulttin?: string | null
          defaultvolumeday?: number | null
          defaultvolumemonth?: number | null
          defaultcreditlimit?: number | null
          defaultcreditterms?: string | null
          defaultsalestype?: string | null
          defaulttype?: string | null
          defaultapplyfor?: string | null
          defaultsoldto?: string | null
          defaultbillingaddress?: string | null
        }
        Update: {
          id?: string
          carftype: string | null
          bostype: string | null
          defaulttin?: string | null
          defaultvolumeday?: number | null
          defaultvolumemonth?: number | null
          defaultcreditlimit?: number | null
          defaultcreditterms?: string | null
          defaultsalestype?: string | null
          defaulttype?: string | null
          defaultapplyfor?: string | null
          defaultsoldto?: string | null
          defaultbillingaddress?: string | null
        }
        Relationships: []
      },regionbu: {
        Row: {
          id: string
          region: string | null
          bucenter: string | null
          district: string | null
        }
        Insert: {
          id?: string
          region: string | null
          bucenter: string | null
          district: string | null
        }
        Update: {
          id?: string
          region: string | null
          bucenter: string | null
          district: string | null
        }
        Relationships: []
      },salesinfosalesorg: {
        Row: {
          id: string
          salesorganization: string | null
        }
        Insert: {
          id?: string
          salesorganization: string | null
        }
        Update: {
          id?: string
          salesorganization: string | null
        }
        Relationships: []
      },salesinfodistributionchannel: {
        Row: {
          id: string
          distributionchannel: string | null
        }
        Insert: {
          id?: string
          distributionchannel: string | null
        }
        Update: {
          id?: string
          distributionchannel: string | null
        }
        Relationships: []
      },salesinfodivision: {
        Row: {
          id: string
          division: string | null
        }
        Insert: {
          id?: string
          division: string | null
        }
        Update: {
          id?: string
          division: string | null
        }
        Relationships: []
      },salesinfobucenter: {
        Row: {
          id: string
          bucenter: string | null
        }
        Insert: {
          id?: string
          bucenter: string | null
        }
        Update: {
          id?: string
          bucenter: string | null
        }
        Relationships: []
      },system_settings: {
        Row: {
          id:string
          project_id: string
          publishable_key: string
          url: string 
          customer_source: string 
          attachment_link: string 
          sheet_id: string
          sheet_apikey: string
          sheet_range: string
          environment:string
        }
        Insert: {
          id:string
          project_id: string
          publishable_key: string
          url: string 
          customer_source: string
          attachment_link: string 
          sheet_id: string
          sheet_apikey: string
          sheet_range: string
          environment:string
        }
        Update: {
          id?:string
          project_id: string
          publishable_key: string
          url: string 
          customer_source: string 
          attachment_link: string 
          sheet_id: string
          sheet_apikey: string
          sheet_range: string
          environment:string
        }
        Relationships: []
      },paymentterms: {
        Row: {
          id: string
          paymentterm: string | null
          paymenttermname: string | null
          limittype: string | null
          limitgroup: string | null
        }
        Insert: {
          id?: string
          paymentterm: string | null
          paymenttermname: string | null
          limittype: string | null
          limitgroup: string | null
        }
        Update: {
          id?: string
          paymentterm: string | null
          paymenttermname: string | null
          limittype: string | null
          limitgroup: string | null
        }
        Relationships: []
      },paymentlimit: {
        Row: {
          id: string
          paymentlimit: string | null
          limittype: string | null
          limitgroup: string | null
        }
        Insert: {
          id?: string
          paymentlimit: string | null
          limittype: string | null
          limitgroup: string | null
        }
        Update: {
          id?: string
          paymentlimit: string | null
          limittype: string | null
          limitgroup: string | null
        }
        Relationships: []
      },approvalmatrix: {
        Row: {
          id: string
          approvaltype: string | null
          firstapprover: string | null
          secondapprover: string | null
          thirdapprover: string | null
          complianceandfinalapprover:boolean
          company: string | null
        }
        Insert: {
          id?: string
          approvaltype: string | null
          firstapprover: string | null
          secondapprover: string | null
          thirdapprover: string | null
          complianceandfinalapprover:boolean
          company: string | null
        }
        Update: {
          id?: string
          approvaltype: string | null
          firstapprover: string | null
          secondapprover: string | null
          thirdapprover: string | null
          complianceandfinalapprover:boolean
          company: string | null
        }
        Relationships: []
      },formfields: {
        Row: {
          id: string
          fields: string | null
          isrequired: boolean | null
        }
        Insert: {
          id?: string
          fields: string | null
          isrequired: boolean | null
        }
        Update: {
          id?: string
          fields: string | null
          isrequired: boolean | null
        }
        Relationships: []
      },usergroups: {
        Row: {
          id: string
          groupcode: string | null
          groupname: string | null
        }
        Insert: {
          id?: string
          groupcode: string | null
          groupname: string | null
        }
        Update: {
          id?: string
          groupcode: string | null
          groupname: string | null
        }
        Relationships: []
      },groupauthorizations: {
        Row: {
          id: number
          groupcode: string
          menucmd: string
          accesslevel: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          groupcode: string
          menucmd: string
          accesslevel: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          groupcode?: string
          menucmd?: string
          accesslevel?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      },ccemail: {
        Row: {
          id: string
          email: string
          customergroup: string | null
          bc: string | null
          allcarf: boolean
        }
        Insert: {
          id?: string
          email: string
          customergroup?: string | null
          bc?: string | null
          allcarf?: boolean
        }
        Update: {
          id?: string
          email?: string
          customergroup?: string | null
          bc?: string | null
          allcarf?: boolean
        }
        Relationships: []
      },execemail: {
        Row: {
          id: string
          userid: string
          email: string
          fullname: string | null
          exception: string | null
          allaccess: boolean
        }
        Insert: {
          id?: string
          userid: string
          email: string
          fullname?: string | null
          exception?: string | null
          allaccess?: boolean
        }
        Update: {
          id?: string
          userid?: string
          email?: string
          fullname?: string | null
          exception?: string | null
          allaccess?: boolean
        }
        Relationships: []
      },bcapprovalmatrix: {
        Row: {
          id: string
          approvaltype: string | null
          firstapprover: string | null
          exception: string | null
          exceptionapprover: string | null
          company: string | null
        }
        Insert: {
          id?: string
          approvaltype: string | null
          firstapprover: string | null
          exception: string | null
          exceptionapprover: string | null
          company: string | null
        }
        Update: {
          id?: string
          approvaltype: string | null
          firstapprover: string | null
          exception: string | null
          exceptionapprover: string | null
          company: string | null
        }
        Relationships: []
      },notifications: {
        Row: {
          id: number
          gencode: string
          refid: number
          notification_type: string
          action: string
          actor_userid: string
          actor_name: string
          recipient_userid: string | null
          recipient_name: string | null
          approval_level: string | null
          custtype: string | null
          title: string
          message: string
          remarks: string | null
          is_read: boolean
          is_sent_email: boolean
          read_at: string | null
          form_data: Json | null
          previous_status: string | null
          new_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          gencode: string
          refid: number
          notification_type: string
          action: string
          actor_userid: string
          actor_name: string
          recipient_userid?: string | null
          recipient_name?: string | null
          approval_level?: string | null
          custtype?: string | null
          title: string
          message: string
          remarks?: string | null
          is_read?: boolean
          is_sent_email?: boolean
          read_at?: string | null
          form_data?: Json | null
          previous_status?: string | null
          new_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          gencode?: string
          refid?: number
          notification_type?: string
          action?: string
          actor_userid?: string
          actor_name?: string
          recipient_userid?: string | null
          recipient_name?: string | null
          approval_level?: string | null
          custtype?: string | null
          title?: string
          message?: string
          remarks?: string | null
          is_read?: boolean
          is_sent_email?: boolean
          read_at?: string | null
          form_data?: Json | null
          previous_status?: string | null
          new_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      },company: {
        Row: {
          id: number
          company: string
          company_name: string 
        }
        Insert: {
          id?: number
          company: string
          company_name: string 
        }
        Update: {
          id?: number
          company: string
          company_name: string 
        }
        Relationships: []
      },

 

    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_carf_doc_no: {
        Args: Record<string, never>
        Returns: string
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
  public: {
    Enums: {},
  },
} as const
