-- Add UPDATE policy for messages so users can mark messages as read
CREATE POLICY "Users can update messages in their chats"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = public.messages.chat_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = public.messages.chat_id AND user_id = auth.uid()
    )
  );
