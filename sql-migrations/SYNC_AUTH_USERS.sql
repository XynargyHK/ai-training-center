-- SQL Migration: Sync auth.users to public.users automatically
-- This ensures that every time someone signs up via Supabase Auth, 
-- a record is created in our public.users table for RLS.

-- 1. Create the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_bu_id UUID;
BEGIN
  -- Get a default business unit ID (SkinCoach)
  SELECT id INTO default_bu_id FROM public.business_units WHERE slug = 'skincoach' LIMIT 1;

  INSERT INTO public.users (id, email, full_name, business_unit_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    default_bu_id,
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Sync existing users (one-time)
INSERT INTO public.users (id, email, full_name, role, business_unit_id)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''), 
  'member',
  (SELECT id FROM public.business_units WHERE slug = 'skincoach' LIMIT 1)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

SELECT '✅ User sync trigger and existing users synced!' as status;
