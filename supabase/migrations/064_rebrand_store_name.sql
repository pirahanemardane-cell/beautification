-- Rebrand store display name: جواهر شاد → اکسسوری شاد
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.site_settings') IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.site_settings
  SET
    value = jsonb_set(
      COALESCE(value, '{}'::jsonb),
      '{name}',
      to_jsonb('اکسسوری شاد'::text),
      true
    ),
    updated_at = now()
  WHERE key = 'store'
    AND (
      value->>'name' IS NULL
      OR value->>'name' = 'جواهر شاد'
    );
END $$;

COMMIT;
