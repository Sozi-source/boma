-- Keep the database category constraint aligned with the application category list.
ALTER TABLE public.bomas
  DROP CONSTRAINT IF EXISTS bomas_category_check;

ALTER TABLE public.bomas
  ADD CONSTRAINT bomas_category_check
  CHECK (category IN (
    'medical', 'education', 'chama', 'funeral', 'wedding', 'community',
    'emergency', 'business', 'family', 'housing', 'food', 'travel',
    'religious', 'sports', 'technology', 'other'
  ));
