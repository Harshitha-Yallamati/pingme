
-- Create chats table
CREATE TABLE public.chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_id UUID
);

-- Create chat_participants table
CREATE TABLE public.chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key to chats for last_message_id
ALTER TABLE public.chats 
ADD CONSTRAINT fk_last_message 
FOREIGN KEY (last_message_id) 
REFERENCES public.messages(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for chats
CREATE POLICY "Users can view chats they are participants of"
  ON public.chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = public.chats.id AND user_id = auth.uid()
    )
  );

-- Policies for chat_participants
CREATE POLICY "Users can view participants of their own chats"
  ON public.chat_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants AS internal
      WHERE internal.chat_id = public.chat_participants.chat_id AND internal.user_id = auth.uid()
    )
  );

-- Policies for messages
CREATE POLICY "Users can view messages in their chats"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = public.messages.chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages into their chats"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = public.messages.chat_id AND user_id = auth.uid()
    )
  );
