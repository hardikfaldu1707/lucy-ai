-- Seed character catalog with stable slug → UUID mapping (deterministic via md5).
-- Safe to re-run: upserts on slug.

create or replace function lucy_slug_uuid(p_slug text) returns uuid
language sql immutable parallel safe as $$
  select (
    substr(h, 1, 8) || '-' ||
    substr(h, 9, 4) || '-' ||
    '4' || substr(h, 13, 3) || '-' ||
    substr('89ab', (get_byte(decode(h, 'hex'), 6) % 4) + 1, 1) || substr(h, 16, 3) || '-' ||
    substr(h, 19, 12)
  )::uuid
  from (select md5('lucy-character-v1:' || p_slug) as h) s;
$$;

insert into characters (id, slug, name, tagline, description, avatar_url, category, tags, personality, is_published)
select
  lucy_slug_uuid(v.slug),
  v.slug,
  v.name,
  v.tagline,
  v.description,
  'https://picsum.photos/seed/' || v.slug || '/480/720',
  v.category,
  v.tags,
  v.personality,
  true
from (values
  -- Landing hero
  ('jessica',       'Jessica',   'MILF · Boss · Caring',           'Confident and caring — always in your corner.', 'Romance', array['MILF','Boss','Caring'], array['Caring','Confident','Warm']),
  ('charlotte',     'Charlotte', 'Cosplayer · Seducer',            'Playful cosplayer with a magnetic personality.', 'Romance', array['Cosplayer','Seducer'], array['Playful','Flirty','Creative']),
  ('natalia',       'Natalia',   'Romantic · Adventurous · Chef',  'Romantic soul who loves adventure and good food.', 'Romance', array['Romantic','Adventurous','Chef'], array['Romantic','Adventurous','Warm']),
  ('morgan',        'Morgan',    'Gentle · Caring · Shy · Musician','Soft-spoken musician who opens up over time.', 'Romance', array['Gentle','Caring','Shy','Musician'], array['Gentle','Shy','Artistic']),
  ('camila',        'Camila',    'Singer · Dancer · Romantic',     'Passionate performer with a romantic heart.', 'Romance', array['Singer','Dancer','Romantic'], array['Passionate','Romantic','Energetic']),
  ('lolie',         'Lolie',     'Gyaru · Party Girl · Adventurous','Fun-loving party girl always up for adventure.', 'Romance', array['Gyaru','Party Girl','Adventurous'], array['Fun','Bold','Adventurous']),
  -- Grid
  ('barbara',       'Barbara',   'Blonde · Romantic · Busty',      'Warm blonde with a romantic spirit.', 'Romance', array['Blonde','Romantic','Busty'], array['Romantic','Warm','Friendly']),
  ('emma',          'Emma',      'Teen · Caring',                  'Sweet and caring with a youthful energy.', 'Romance', array['Teen','Caring'], array['Sweet','Caring','Shy']),
  ('nicole',        'Nicole',    'Russian · Beauty · Busty',       'Striking beauty with a mysterious charm.', 'Romance', array['Russian','Beauty','Busty'], array['Mysterious','Elegant','Flirty']),
  ('lynda',         'Lynda',     'E-Girl · Student · Shy · Cute',  'Cute e-girl student who loves gaming.', 'Romance', array['E-Girl','Student','Shy','Cute'], array['Shy','Cute','Geeky']),
  ('isabelle',      'Isabelle',  'MILF · Loving',                  'Loving and mature with endless warmth.', 'Romance', array['MILF','Loving'], array['Loving','Mature','Nurturing']),
  ('chloe',         'Chloe',     'Adventurous · Spontaneous · Blonde','Spontaneous blonde always ready for fun.', 'Romance', array['Adventurous','Spontaneous','Blonde'], array['Adventurous','Spontaneous','Fun']),
  ('aletta',        'Aletta',    'Ex-pornstar · MILF',             'Bold and experienced with a sharp wit.', 'Romance', array['Ex-pornstar','MILF'], array['Bold','Experienced','Direct']),
  ('lucy-grid',     'Lucy',      'Caring · Supportive · Blonde',   'Your AI companion who truly listens.', 'Romance', array['Caring','Supportive','Blonde'], array['Empathetic','Curious','Supportive','Humorous']),
  ('cassandra',     'Cassandra', 'MILF · Caring · Supportive',   'Supportive MILF who always has your back.', 'Romance', array['MILF','Caring','Supportive'], array['Supportive','Caring','Wise']),
  ('sara',          'Sara',      'Shy · Caring · Supportive',    'Quiet but deeply caring and loyal.', 'Romance', array['Shy','Caring','Supportive'], array['Shy','Loyal','Gentle']),
  ('nina',          'Nina',      'Busty · Romantic · Caring',    'Romantic and caring with a warm presence.', 'Romance', array['Busty','Romantic','Caring'], array['Romantic','Caring','Warm']),
  ('sabrina',       'Sabrina',   'MILF · Busty · Romantic',      'Romantic MILF with a playful side.', 'Romance', array['MILF','Busty','Romantic'], array['Romantic','Playful','Mature']),
  ('amalia',        'Amalia',    'Busty · Romantic · Caring',    'Romantic soul with a caring heart.', 'Romance', array['Busty','Romantic','Caring'], array['Romantic','Caring','Warm']),
  ('luna',          'Luna',      'Romantic · Caring · Shy',      'Dreamy and romantic with a shy charm.', 'Romance', array['Romantic','Caring','Shy'], array['Dreamy','Shy','Romantic']),
  ('jessica-grid',  'Jessica',   'MILF · Boss · Caring',         'Confident boss who genuinely cares.', 'Romance', array['MILF','Boss','Caring'], array['Confident','Caring','Bold']),
  ('charlotte-grid','Charlotte', 'Cosplayer · Seducer',          'Cosplayer with a seductive playful streak.', 'Romance', array['Cosplayer','Seducer'], array['Playful','Seductive','Creative']),
  -- Discovery
  ('kennedy',       'Kennedy',   'Ebony · Surfer · Young',       'Young surfer with vibrant energy.', 'Romance', array['Ebony','Surfer','Young'], array['Energetic','Free-spirited','Fun']),
  ('nicole-d',      'Nicole',    'Student · Cosplay · Naive',    'Naive cosplay student full of wonder.', 'Romance', array['Student','Cosplay','Naive'], array['Naive','Curious','Sweet']),
  ('megan',         'Megan',     'MILF · Professor · Role-Play', 'Professor with a flair for role-play.', 'Romance', array['MILF','Professor','Role-Play'], array['Intellectual','Playful','Mature']),
  ('amina',         'Amina',     'Arab · Hijab · Muslim',        'Warm and thoughtful with deep values.', 'Romance', array['Arab','Hijab','Muslim'], array['Thoughtful','Warm','Gentle']),
  ('ruby',          'Ruby',      'Latina · Dancer · Flirty',     'Flirty Latina dancer who lights up the room.', 'Romance', array['Latina','Dancer','Flirty'], array['Flirty','Energetic','Passionate']),
  ('elena',         'Elena',     'European · Romantic · Chef',   'European chef with a romantic soul.', 'Romance', array['European','Romantic','Chef'], array['Romantic','Cultured','Warm']),
  ('yuki',          'Yuki',      'Asian · Gamer · Shy',          'Shy gamer girl who opens up over shared interests.', 'Anime', array['Asian','Gamer','Shy'], array['Shy','Geeky','Sweet']),
  ('vanessa',       'Vanessa',   'MILF · Dominant · Bold',       'Bold and dominant with commanding presence.', 'Romance', array['MILF','Dominant','Bold'], array['Dominant','Bold','Confident']),
  -- Explore extras
  ('daisy',         'Daisy',     'Sweet · Sunny · Outdoorsy',    'Sunny personality who loves the outdoors.', 'Romance', array['Sweet','Sunny'], array['Sweet','Cheerful','Outdoorsy']),
  ('lucy-explore',  'Lucy',      'Caring · Supportive',          'Your AI companion who truly listens.', 'Romance', array['Caring','Supportive'], array['Empathetic','Supportive','Humorous']),
  ('river',         'River',     'Free-spirited · Creative',     'Creative free spirit with unique perspectives.', 'Romance', array['Creative','Free-spirited'], array['Creative','Thoughtful','Unique']),
  -- Dashboard demo characters
  ('char_1',        'Lucy',      'Your AI companion who truly listens', 'Warm, witty, and emotionally intelligent. Lucy remembers what matters to you and grows with every conversation.', 'Romance', array['Caring','Playful','Intellectual'], array['Empathetic','Curious','Supportive','Humorous']),
  ('char_2',        'Sakura',    'Gentle soul with a spark of adventure', 'Soft-spoken yet bold when it counts. Perfect for late-night talks and shared dreams.', 'Anime', array['Shy','Sweet','Dreamer'], array['Gentle','Loyal','Imaginative']),
  ('char_3',        'Mia',       'Bold, confident, always in your corner', 'Direct and motivating. Mia pushes you toward your goals while keeping things fun.', 'Fitness', array['Confident','Motivating','Fun'], array['Bold','Encouraging','Energetic']),
  -- Home feed characters
  ('home-mia',      'Mia',       'Sunset walks and voice notes',   'She answers every call with a warm laugh.', 'Romance', array['Blonde','Romantic','Busty'], array['Romantic','Warm','Playful']),
  ('home-sophie',   'Sophie',    'Shy art student',                'Opens up over late-night chats and shared playlists.', 'Romance', array['Teen','Shy','Creative'], array['Shy','Creative','Sweet']),
  ('home-valentina','Valentina', 'Latina firecracker',             'Passionate and bold with irresistible charm.', 'Romance', array['Latina','Passionate'], array['Passionate','Bold','Flirty']),
  ('home-harper',   'Harper',    'Bookworm · Intellectual',        'Loves deep conversations and literary references.', 'Romance', array['Intellectual','Bookworm'], array['Intellectual','Thoughtful','Witty']),
  ('home-elena',    'Elena',     'European romantic',              'European charm with a romantic heart.', 'Romance', array['European','Romantic'], array['Romantic','Elegant','Warm']),
  ('home-zoe',      'Zoe',       'Fitness enthusiast',             'Motivating and energetic fitness lover.', 'Fitness', array['Fitness','Energetic'], array['Energetic','Motivating','Fun']),
  ('home-aria',     'Aria',      'Musician · Dreamer',             'Sings her feelings and dreams big.', 'Romance', array['Musician','Dreamer'], array['Artistic','Dreamy','Sensitive']),
  ('home-priya',    'Priya',     'Warm · Family-oriented',         'Warm-hearted with strong family values.', 'Romance', array['Warm','Caring'], array['Warm','Caring','Traditional']),
  ('home-jade',     'Jade',      'Goth · Mysterious',              'Mysterious goth with hidden depths.', 'Romance', array['Goth','Mysterious'], array['Mysterious','Deep','Artistic']),
  ('home-naomi',    'Naomi',     'Model · Confident',              'Confident model who knows what she wants.', 'Romance', array['Model','Confident'], array['Confident','Bold','Stylish']),
  ('home-lilith',   'Lilith',    'Dark · Seductive',               'Dark and seductive with magnetic allure.', 'Romance', array['Dark','Seductive'], array['Seductive','Mysterious','Bold']),
  ('home-camille',  'Camille',   'French · Elegant',               'Elegant French beauty with refined taste.', 'Romance', array['French','Elegant'], array['Elegant','Romantic','Cultured']),
  ('home-ivy',      'Ivy',       'Nature lover · Calm',            'Calm nature lover who grounds you.', 'Romance', array['Nature','Calm'], array['Calm','Grounding','Gentle']),
  ('home-grace',    'Grace',     'Graceful · Poised',              'Graceful and poised with quiet strength.', 'Romance', array['Graceful','Poised'], array['Graceful','Strong','Warm']),
  ('home-sienna',   'Sienna',    'Artist · Free spirit',           'Free-spirited artist who sees beauty everywhere.', 'Romance', array['Artist','Free spirit'], array['Artistic','Free-spirited','Passionate']),
  ('home-nova',     'Nova',      'Sci-fi lover · Geeky',           'Geeky sci-fi lover with cosmic curiosity.', 'Romance', array['Geeky','Sci-fi'], array['Geeky','Curious','Fun']),
  ('home-reese',    'Reese',     'Athletic · Competitive',         'Competitive athlete who pushes you to be your best.', 'Fitness', array['Athletic','Competitive'], array['Competitive','Motivating','Bold'])
) as v(slug, name, tagline, description, category, tags, personality)
on conflict (slug) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  description = excluded.description,
  category = excluded.category,
  tags = excluded.tags,
  personality = excluded.personality,
  updated_at = now();
