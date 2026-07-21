
CREATE TYPE public.conversation_type AS ENUM ('dm', 'group', 'channel');
CREATE TYPE public.participant_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.message_kind AS ENUM ('text', 'image', 'file');

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.conversation_type NOT NULL,
  title TEXT,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.participant_role NOT NULL DEFAULT 'member',
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversation_participants TO service_role;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cp_user ON public.conversation_participants(user_id);
CREATE INDEX idx_cp_conv ON public.conversation_participants(conversation_id);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.message_kind NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  media_name TEXT,
  media_size BIGINT,
  media_mime TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_msg_conv_created ON public.messages(conversation_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conv UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conv AND user_id = _user)
$$;

CREATE OR REPLACE FUNCTION public.participant_role_in(_conv UUID, _user UUID)
RETURNS public.participant_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.conversation_participants
    WHERE conversation_id = _conv AND user_id = _user LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_create_channel(_user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user AND role IN ('super_admin','village_admin','moderator'))
$$;

CREATE POLICY "conv_select_participant_or_channel" ON public.conversations
  FOR SELECT TO authenticated
  USING (type = 'channel' OR public.is_conversation_participant(id, auth.uid()));

CREATE POLICY "conv_insert_by_self" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (type <> 'channel' OR public.can_create_channel(auth.uid()))
  );

CREATE POLICY "conv_update_by_admin" ON public.conversations
  FOR UPDATE TO authenticated
  USING (public.participant_role_in(id, auth.uid()) IN ('owner','admin'))
  WITH CHECK (public.participant_role_in(id, auth.uid()) IN ('owner','admin'));

CREATE POLICY "conv_delete_by_owner" ON public.conversations
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "cp_select_own_or_same_conv" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "cp_insert_self_or_admin" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.participant_role_in(conversation_id, auth.uid()) IN ('owner','admin')
  );

CREATE POLICY "cp_update_admin_or_self" ON public.conversation_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.participant_role_in(conversation_id, auth.uid()) IN ('owner','admin'))
  WITH CHECK (user_id = auth.uid() OR public.participant_role_in(conversation_id, auth.uid()) IN ('owner','admin'));

CREATE POLICY "cp_delete_self_or_admin" ON public.conversation_participants
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.participant_role_in(conversation_id, auth.uid()) IN ('owner','admin'));

CREATE POLICY "msg_select_participant_or_channel" ON public.messages
  FOR SELECT TO authenticated
  USING (
    public.is_conversation_participant(conversation_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.type = 'channel')
  );

CREATE POLICY "msg_insert_participant" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_participant(conversation_id, auth.uid())
    AND (
      (SELECT type FROM public.conversations WHERE id = conversation_id) <> 'channel'
      OR public.participant_role_in(conversation_id, auth.uid()) IN ('owner','admin')
    )
  );

CREATE POLICY "msg_delete_own_or_admin" ON public.messages
  FOR DELETE TO authenticated
  USING (
    sender_id = auth.uid()
    OR public.participant_role_in(conversation_id, auth.uid()) IN ('owner','admin')
  );

CREATE OR REPLACE FUNCTION public.bump_conversation_last_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at, updated_at = now()
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_bump_conv_last_msg
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_last_message();

CREATE TRIGGER trg_conv_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
