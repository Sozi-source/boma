-- Public fund pages need the anon role to read public fund fields.
-- The existing RLS policy continues to restrict rows to public funds.
GRANT SELECT (
  id,
  title,
  slug,
  description,
  category,
  target_amount,
  current_amount,
  currency,
  creator_id,
  creator_name,
  status,
  deadline,
  image_url,
  is_public,
  contributors_count,
  verified,
  created_at,
  updated_at
) ON public.bomas TO anon;
