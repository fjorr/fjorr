-- Add Swedish, Hindi, and Korean to CMS translation locale enum.

alter type public.app_locale add value if not exists 'sv';
alter type public.app_locale add value if not exists 'hi';
alter type public.app_locale add value if not exists 'ko';
