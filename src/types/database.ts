// Hand-written to match supabase/schema.sql.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CourseStatus = "draft" | "published";
/** notes = note practice, song = song, bonus = optional extra song */
export type CourseItemKind = "notes" | "song" | "bonus";
export type OrderStatus = "paid" | "refunded";

type Table<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      admin_users: Table<{ user_id: string; created_at: string }, { user_id: string }>;
      courses: Table<
        {
          id: string;
          slug: string;
          title: string;
          subtitle: string;
          total_days: number;
          status: CourseStatus;
          created_at: string;
          updated_at: string;
        },
        { id?: string; slug: string; title: string; subtitle?: string; total_days?: number; status?: CourseStatus }
      >;
      course_lessons: Table<
        {
          id: string;
          course_id: string;
          day: number;
          title: string;
          is_free: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        },
        { id?: string; course_id: string; day: number; title?: string; is_free?: boolean; is_published?: boolean }
      >;
      course_items: Table<
        {
          id: string;
          lesson_id: string;
          kind: CourseItemKind;
          position: number;
          title: string;
          subtitle: string;
          created_at: string;
          updated_at: string;
        },
        { id?: string; lesson_id: string; kind: CourseItemKind; position?: number; title?: string; subtitle?: string }
      >;
      course_item_content: Table<
        { item_id: string; score: Json; file_name: string; video_url: string; updated_at: string },
        { item_id: string; score: Json; file_name?: string; video_url?: string }
      >;
      course_lesson_guides: Table<{ lesson_id: string; guide: string; updated_at: string }, { lesson_id: string; guide?: string }>;
      course_enrollments: Table<
        { course_id: string; user_id: string; note: string; created_at: string },
        { course_id: string; user_id: string; note?: string }
      >;
      course_item_progress: Table<
        { user_id: string; item_id: string; best_score: number; stars: number; attempts: number; updated_at: string },
        { user_id?: string; item_id: string; best_score: number; stars: number; attempts?: number }
      >;
      orders: Table<
        {
          id: string;
          provider: string;
          provider_order_id: string;
          course_id: string;
          user_id: string | null;
          email: string;
          amount_cents: number;
          currency: string;
          status: OrderStatus;
          raw: Json;
          created_at: string;
          updated_at: string;
        },
        {
          provider: string;
          provider_order_id: string;
          course_id: string;
          user_id?: string | null;
          email: string;
          amount_cents?: number;
          currency?: string;
          status: OrderStatus;
          raw?: Json;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      has_course_access: { Args: { p_course: string }; Returns: boolean };
      can_open_lesson: { Args: { p_lesson: string }; Returns: boolean };
      claim_orders: { Args: Record<string, never>; Returns: number };
      record_order: {
        Args: {
          p_provider: string;
          p_provider_order_id: string;
          p_course_slug: string;
          p_user: string | null;
          p_email: string;
          p_amount_cents: number;
          p_currency: string;
          p_status: OrderStatus;
          p_raw: Json;
        };
        Returns: { order: string; user: string | null };
      };
      admin_grant_course: { Args: { p_course: string; p_email: string; p_note?: string }; Returns: string };
      admin_course_students: {
        Args: { p_course: string };
        Returns: {
          user_id: string;
          email: string;
          note: string;
          granted_at: string;
          lessons_done: number;
          last_activity: string | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
