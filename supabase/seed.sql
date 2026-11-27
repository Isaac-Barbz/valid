-- Starter communities for a fresh database (safe to re-run).
insert into public.communities (slug, name, description) values
  ('general', 'General', 'Anything and everything.'),
  ('tech', 'Tech', 'Gadgets, apps, code, and the future.'),
  ('music', 'Music', 'New drops, old favorites, and hot takes.'),
  ('gaming', 'Gaming', 'Every platform, every genre.'),
  ('style', 'Style', 'Fashion, hair, beauty, and fits.'),
  ('sports', 'Sports', 'Scores, trades, and highlights.'),
  ('food', 'Food', 'Recipes, restaurants, and late-night snacks.'),
  ('askvalid', 'Ask Valid', 'Ask anything. Get real answers.')
on conflict (slug) do nothing;
