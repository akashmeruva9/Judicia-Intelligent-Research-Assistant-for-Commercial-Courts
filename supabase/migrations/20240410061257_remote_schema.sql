-- Set session parameters
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SELECT pg_catalog.set_config('search_path', '', false);

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Comment on schema
COMMENT ON SCHEMA "public" IS 'standard public schema';

-- Create tables
CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "content" text,
    "room_code" text NOT NULL,
    "role" text NOT NULL,
    "email" text NOT NULL,
    "is_public" boolean DEFAULT true NOT NULL,
    "is_context" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" uuid NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "email" text NOT NULL,
    "display_name" text,
    "updated_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "public"."room_joined_users" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "room_code" text NOT NULL,
    "is_input_enable" boolean DEFAULT true NOT NULL,
    "email" text NOT NULL,
    "status" text DEFAULT 'init' NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "room_code" text NOT NULL,
    "description" text NOT NULL,
    "is_chat_ended" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone,
    "creator_email" text NOT NULL,
    "mediator_type" text NOT NULL,
    "parent_room_code" text
);

-- Set table owners
ALTER TABLE "public"."messages" OWNER TO "postgres";
ALTER TABLE "public"."profiles" OWNER TO "postgres";
ALTER TABLE "public"."room_joined_users" OWNER TO "postgres";
ALTER TABLE "public"."rooms" OWNER TO "postgres";

-- Add constraints
ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "chat_room_room_code_key" UNIQUE ("room_code");

ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id", "email");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profile_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profile_pkey" PRIMARY KEY ("id", "email");

ALTER TABLE ONLY "public"."room_joined_users"
    ADD CONSTRAINT "room_joined_users_pkey" PRIMARY KEY ("id", "email");

ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id", "room_code", "creator_email");

ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "public_messages_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."profiles"("email") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "public_messages_room_id_fkey" FOREIGN KEY ("room_code") REFERENCES "public"."rooms"("room_code");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "public_profile_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."room_joined_users"
    ADD CONSTRAINT "public_room_joined_users_email_fkey" FOREIGN KEY ("email") REFERENCES "public"."profiles"("email") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."room_joined_users"
    ADD CONSTRAINT "public_room_joined_users_room_code_fkey" FOREIGN KEY ("room_code") REFERENCES "public"."rooms"("room_code") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "public_rooms_creator_email_fkey" FOREIGN KEY ("creator_email") REFERENCES "public"."profiles"("email") ON DELETE CASCADE;

-- Create trigger function
CREATE OR REPLACE FUNCTION "public"."create_profile"() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        substring(NEW.email from 1 for position('@' in NEW.email) - 1)
    )
    ON CONFLICT (email) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        updated_at = now();
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."create_profile"() OWNER TO "postgres";

-- Create trigger for automatic profile creation
CREATE TRIGGER "create_profile_trigger"
    AFTER INSERT ON "auth"."users"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."create_profile"();

-- Publication for real-time updates
ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."room_joined_users";
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rooms";

-- Grant usage and privileges
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."create_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile"() TO "service_role";

GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON TABLE "public"."room_joined_users" TO "anon";
GRANT ALL ON TABLE "public"."room_joined_users" TO "authenticated";
GRANT ALL ON TABLE "public"."room_joined_users" TO "service_role";

GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" 
    GRANT ALL ON SEQUENCES TO "postgres", "anon", "authenticated", "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" 
    GRANT ALL ON FUNCTIONS TO "postgres", "anon", "authenticated", "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" 
    GRANT ALL ON TABLES TO "postgres", "anon", "authenticated", "service_role";

-- Reset session parameters
RESET ALL;
