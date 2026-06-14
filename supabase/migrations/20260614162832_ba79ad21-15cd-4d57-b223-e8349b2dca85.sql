
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS joined_date date DEFAULT CURRENT_DATE;

INSERT INTO public.villages (name, district, region)
SELECT v.name, 'Tuman', 'Viloyat'
FROM (VALUES ('Shamsiko''l'), ('Sho''rqo''rg''on'), ('Elatan')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM public.villages WHERE villages.name = v.name);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fn text := NEW.raw_user_meta_data->>'first_name';
  ln text := NEW.raw_user_meta_data->>'last_name';
  full_name text := trim(coalesce(fn,'') || ' ' || coalesce(ln,''));
  v_id uuid;
  bd date;
  jd date;
BEGIN
  IF full_name = '' THEN
    full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1), 'Foydalanuvchi');
  END IF;

  BEGIN v_id := NULLIF(NEW.raw_user_meta_data->>'village_id','')::uuid; EXCEPTION WHEN others THEN v_id := NULL; END;
  BEGIN bd := NULLIF(NEW.raw_user_meta_data->>'birth_date','')::date; EXCEPTION WHEN others THEN bd := NULL; END;
  BEGIN jd := NULLIF(NEW.raw_user_meta_data->>'joined_date','')::date; EXCEPTION WHEN others THEN jd := CURRENT_DATE; END;
  IF jd IS NULL THEN jd := CURRENT_DATE; END IF;

  INSERT INTO public.profiles (id, name, first_name, last_name, phone, village_id, birth_date, joined_date, avatar_url)
  VALUES (
    NEW.id, full_name, fn, ln,
    NEW.raw_user_meta_data->>'phone',
    v_id, bd, jd,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    village_id = COALESCE(EXCLUDED.village_id, public.profiles.village_id),
    birth_date = COALESCE(EXCLUDED.birth_date, public.profiles.birth_date),
    joined_date = COALESCE(EXCLUDED.joined_date, public.profiles.joined_date);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
