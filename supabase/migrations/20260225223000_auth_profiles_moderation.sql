/*
  # Auth + Profiles + Moderation (Invite-only + Approval workflow)

  What this migration adds:
  - profiles table (display_name, phone, role)
  - moderation fields on properties & vehicles (pending/approved)
  - contact fields on properties & vehicles (contact_name, contact_phone)
  - stronger RLS: public sees ONLY approved listings
  - authenticated users can create listings but they go to pending
  - super admins (MustafaErtugKaya@gmail.com, umaykutay@gmail.com) can approve/edit everything
*/

-- Helper: super admin check (by email in JWT)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email','')) in (lower('MustafaErtugKaya@gmail.com'), lower('umaykutay@gmail.com'));
$$;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  phone text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger for profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_profile'
  ) THEN
    CREATE TRIGGER on_auth_user_created_profile
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_profile();
  END IF;
END $$;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can manage profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users can upsert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

-- Moderation + contact fields for properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_phone text;

-- Moderation + contact fields for vehicles
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_phone text;

-- Replace properties policies
DROP POLICY IF EXISTS "Anyone can view published properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;

CREATE POLICY "Public can view approved properties"
  ON public.properties
  FOR SELECT
  TO anon, authenticated
  USING (moderation_status = 'approved' OR user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users can insert properties (pending)"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (public.is_super_admin() OR moderation_status = 'pending')
  );

CREATE POLICY "Users can update own properties (pending)"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (
    (user_id = auth.uid() OR public.is_super_admin())
    AND (public.is_super_admin() OR moderation_status = 'pending')
  );

CREATE POLICY "Users can delete own properties"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

-- Replace vehicles policies
DROP POLICY IF EXISTS "Anyone can view published vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated users can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON public.vehicles;

CREATE POLICY "Public can view approved vehicles"
  ON public.vehicles
  FOR SELECT
  TO anon, authenticated
  USING (moderation_status = 'approved' OR user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Users can insert vehicles (pending)"
  ON public.vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (public.is_super_admin() OR moderation_status = 'pending')
  );

CREATE POLICY "Users can update own vehicles (pending)"
  ON public.vehicles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (
    (user_id = auth.uid() OR public.is_super_admin())
    AND (public.is_super_admin() OR moderation_status = 'pending')
  );

CREATE POLICY "Users can delete own vehicles"
  ON public.vehicles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_properties_moderation_status ON public.properties(moderation_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_moderation_status ON public.vehicles(moderation_status);
