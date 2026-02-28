-- Update handle_new_user function to sync phone number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email, NEW.phone),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), NEW.phone),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
