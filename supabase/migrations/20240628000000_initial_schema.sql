


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."gallery_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "year_id" "uuid",
    "src" "text" NOT NULL,
    "alt" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."gallery_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gallery_years" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "year" "text" NOT NULL,
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."gallery_years" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_days" (
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."schedule_days" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schedule_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day" "text" NOT NULL,
    "start_hour" numeric NOT NULL,
    "end_hour" numeric NOT NULL,
    "label" "text" NOT NULL,
    "color" "text" DEFAULT 'violet'::"text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "schedule_events_day_check" CHECK (("day" = ANY (ARRAY['fri'::"text", 'sat'::"text", 'sun'::"text"])))
);


ALTER TABLE "public"."schedule_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "title" "text" NOT NULL,
    "photo_url" "text" NOT NULL,
    "badge_url" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "linkedin_url" "text",
    "github_url" "text"
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


ALTER TABLE ONLY "public"."gallery_photos"
    ADD CONSTRAINT "gallery_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_years"
    ADD CONSTRAINT "gallery_years_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_years"
    ADD CONSTRAINT "gallery_years_year_key" UNIQUE ("year");



ALTER TABLE ONLY "public"."schedule_days"
    ADD CONSTRAINT "schedule_days_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."schedule_events"
    ADD CONSTRAINT "schedule_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_photos"
    ADD CONSTRAINT "gallery_photos_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "public"."gallery_years"("id") ON DELETE CASCADE;



CREATE POLICY "Public read gallery_photos" ON "public"."gallery_photos" FOR SELECT USING (true);



CREATE POLICY "Public read gallery_years" ON "public"."gallery_years" FOR SELECT USING (true);



CREATE POLICY "Public read schedule_days" ON "public"."schedule_days" FOR SELECT USING (true);



CREATE POLICY "Public read schedule_events" ON "public"."schedule_events" FOR SELECT USING (true);



CREATE POLICY "Public read team_members" ON "public"."team_members" FOR SELECT USING (true);



CREATE POLICY "Service role full access gallery_photos" ON "public"."gallery_photos" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access gallery_years" ON "public"."gallery_years" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access schedule_days" ON "public"."schedule_days" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access schedule_events" ON "public"."schedule_events" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access team_members" ON "public"."team_members" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."gallery_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gallery_years" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_days" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedule_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON TABLE "public"."gallery_photos" TO "anon";
GRANT ALL ON TABLE "public"."gallery_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_photos" TO "service_role";



GRANT ALL ON TABLE "public"."gallery_years" TO "anon";
GRANT ALL ON TABLE "public"."gallery_years" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_years" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_days" TO "anon";
GRANT ALL ON TABLE "public"."schedule_days" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_days" TO "service_role";



GRANT ALL ON TABLE "public"."schedule_events" TO "anon";
GRANT ALL ON TABLE "public"."schedule_events" TO "authenticated";
GRANT ALL ON TABLE "public"."schedule_events" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































