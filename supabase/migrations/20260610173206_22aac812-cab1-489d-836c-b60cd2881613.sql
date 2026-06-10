
-- =================== ENUMS ===================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'village_admin', 'moderator', 'verified', 'user');
CREATE TYPE public.announcement_type AS ENUM ('official', 'public', 'event', 'urgent');
CREATE TYPE public.product_status AS ENUM ('active', 'sold', 'reserved', 'archived');
CREATE TYPE public.price_type AS ENUM ('hourly', 'project', 'negotiable', 'fixed');
CREATE TYPE public.issue_type AS ENUM ('road', 'electricity', 'water', 'gas', 'garbage', 'lighting', 'other');
CREATE TYPE public.issue_status AS ENUM ('pending', 'reviewing', 'in_progress', 'resolved', 'rejected');

-- =================== VILLAGES ===================
CREATE TABLE public.villages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  district TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.villages TO anon, authenticated;
GRANT ALL ON public.villages TO service_role;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "villages_select_all" ON public.villages FOR SELECT USING (true);

-- =================== PROFILES ===================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Foydalanuvchi',
  avatar_url TEXT,
  phone TEXT,
  village_id UUID REFERENCES public.villages(id),
  verified BOOLEAN NOT NULL DEFAULT false,
  bio TEXT,
  language TEXT NOT NULL DEFAULT 'uz',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =================== USER ROLES ===================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =================== UPDATED_AT TRIGGER ===================
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =================== AUTO PROFILE ON SIGNUP ===================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Foydalanuvchi'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================== ANNOUNCEMENTS ===================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type public.announcement_type NOT NULL DEFAULT 'public',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  village_id UUID REFERENCES public.villages(id),
  images TEXT[] NOT NULL DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann_select_all" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "ann_insert_auth" ON public.announcements FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "ann_update_own" ON public.announcements FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "ann_delete_own" ON public.announcements FOR DELETE USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'moderator'));
CREATE TRIGGER ann_set_updated BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =================== PRODUCTS ===================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC,
  unit TEXT,
  category TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  village_id UUID REFERENCES public.villages(id),
  status public.product_status NOT NULL DEFAULT 'active',
  views INTEGER NOT NULL DEFAULT 0,
  is_barter BOOLEAN NOT NULL DEFAULT false,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_select_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "p_insert_auth" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "p_update_own" ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "p_delete_own" ON public.products FOR DELETE USING (auth.uid() = seller_id);
CREATE TRIGGER p_set_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =================== SERVICES ===================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price_from NUMERIC,
  price_to NUMERIC,
  price_type public.price_type NOT NULL DEFAULT 'negotiable',
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  village_id UUID REFERENCES public.villages(id),
  experience_years INTEGER,
  rating NUMERIC NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  contact_phone TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "s_select_all" ON public.services FOR SELECT USING (true);
CREATE POLICY "s_insert_auth" ON public.services FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "s_update_own" ON public.services FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "s_delete_own" ON public.services FOR DELETE USING (auth.uid() = provider_id);
CREATE TRIGGER s_set_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =================== ISSUES ===================
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type public.issue_type NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  address TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  status public.issue_status NOT NULL DEFAULT 'pending',
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  village_id UUID REFERENCES public.villages(id),
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.issues TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.issues TO authenticated;
GRANT ALL ON public.issues TO service_role;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "i_select_all" ON public.issues FOR SELECT USING (true);
CREATE POLICY "i_insert_auth" ON public.issues FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "i_update_own" ON public.issues FOR UPDATE USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'village_admin'));
CREATE POLICY "i_delete_own" ON public.issues FOR DELETE USING (auth.uid() = reporter_id);
CREATE TRIGGER i_set_updated BEFORE UPDATE ON public.issues FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =================== FORUM POSTS ===================
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  village_id UUID REFERENCES public.villages(id),
  upvotes INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;
GRANT ALL ON public.forum_posts TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "f_select_all" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "f_insert_auth" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "f_update_own" ON public.forum_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "f_delete_own" ON public.forum_posts FOR DELETE USING (auth.uid() = author_id);
CREATE TRIGGER f_set_updated BEFORE UPDATE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =================== NOTIFICATIONS ===================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "n_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "n_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- =================== SEED VILLAGES ===================
INSERT INTO public.villages (name, region, district) VALUES
  ('Oltinko''l', 'Andijon', 'Oltinko''l tumani'),
  ('Quvasoy', 'Farg''ona', 'Quvasoy shahri'),
  ('Chust', 'Namangan', 'Chust tumani'),
  ('Bog''ishamol', 'Toshkent', 'Toshkent tumani');
