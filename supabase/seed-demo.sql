-- =============================================================================
-- Genza demo marketplace seed (safe to re-run)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor (postgres / service role).
-- Prerequisites: migrations 002–018 applied.
--
-- Option A: public data only — no auth.users / auth.identities changes.
-- Demo profiles use fixed UUIDs (prefix a1000001-0001-4001-8001-…).
-- They are browse-only personas for marketplace demos; no login required.
--
-- Safe to re-run: clears only the fixed demo UUIDs below.
-- Real users and QA accounts are never touched.
-- =============================================================================

-- Fixed demo user IDs (clients 001–003, taskers 011–023)
DO $$
DECLARE
  demo_ids uuid[] := ARRAY[
    'a1000001-0001-4001-8001-000000000001'::uuid,
    'a1000001-0001-4001-8001-000000000002'::uuid,
    'a1000001-0001-4001-8001-000000000003'::uuid,
    'a1000001-0001-4001-8001-000000000011'::uuid,
    'a1000001-0001-4001-8001-000000000012'::uuid,
    'a1000001-0001-4001-8001-000000000013'::uuid,
    'a1000001-0001-4001-8001-000000000014'::uuid,
    'a1000001-0001-4001-8001-000000000015'::uuid,
    'a1000001-0001-4001-8001-000000000016'::uuid,
    'a1000001-0001-4001-8001-000000000017'::uuid,
    'a1000001-0001-4001-8001-000000000018'::uuid,
    'a1000001-0001-4001-8001-000000000019'::uuid,
    'a1000001-0001-4001-8001-000000000020'::uuid,
    'a1000001-0001-4001-8001-000000000021'::uuid,
    'a1000001-0001-4001-8001-000000000022'::uuid,
    'a1000001-0001-4001-8001-000000000023'::uuid
  ];
BEGIN
  DELETE FROM public.notifications
  WHERE user_id = ANY(demo_ids)
     OR task_id IN (
       SELECT id FROM public.tasks
       WHERE user_id = ANY(demo_ids) OR assigned_tasker_id = ANY(demo_ids)
     );

  DELETE FROM public.messages
  WHERE chat_id IN (
    SELECT c.id FROM public.chats c
    JOIN public.tasks t ON t.id = c.task_id
    WHERE t.user_id = ANY(demo_ids)
       OR t.assigned_tasker_id = ANY(demo_ids)
       OR c.user_id = ANY(demo_ids)
       OR c.tasker_id = ANY(demo_ids)
  );

  DELETE FROM public.chats
  WHERE user_id = ANY(demo_ids)
     OR tasker_id = ANY(demo_ids)
     OR task_id IN (
       SELECT id FROM public.tasks
       WHERE user_id = ANY(demo_ids) OR assigned_tasker_id = ANY(demo_ids)
     );

  DELETE FROM public.reviews
  WHERE reviewer_id = ANY(demo_ids)
     OR reviewed_user_id = ANY(demo_ids)
     OR task_id IN (SELECT id FROM public.tasks WHERE user_id = ANY(demo_ids));

  DELETE FROM public.offers
  WHERE tasker_id = ANY(demo_ids)
     OR task_id IN (SELECT id FROM public.tasks WHERE user_id = ANY(demo_ids));

  DELETE FROM public.tasks
  WHERE user_id = ANY(demo_ids) OR assigned_tasker_id = ANY(demo_ids);

  DELETE FROM public.profiles WHERE id = ANY(demo_ids);
END $$;

-- Bypass auth.users FK checks for orphan demo profile rows (postgres seed pattern).
SET session_replication_role = replica;

-- ---------------------------------------------------------------------------
-- 1. Demo profiles (3 clients + 13 taskers)
-- ---------------------------------------------------------------------------

INSERT INTO public.profiles (id, full_name, avatar_url, role, location, username, bio, skills, verified)
VALUES
  (
    'a1000001-0001-4001-8001-000000000001'::uuid,
    'Sara Bešić',
    'https://api.dicebear.com/7.x/notionists/svg?seed=sara_besic&backgroundColor=dcfce7',
    'client',
    'Mostar, BiH',
    'demo_sara_besic',
    'Radna mama u Mostaru — obično trebam pomoć s čišćenjem i selidbom prije obiteljskih posjeta.',
    '{}',
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000002'::uuid,
    'Marko Čović',
    'https://api.dicebear.com/7.x/notionists/svg?seed=marko_covic&backgroundColor=dcfce7',
    'client',
    'Mostar, BiH',
    'demo_marko_covic',
    'Vlasnik malog posla. Često objavljujem poslove majstora i dostave po gradu.',
    '{}',
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000003'::uuid,
    'Leila Duranović',
    'https://api.dicebear.com/7.x/notionists/svg?seed=leila_duranovic&backgroundColor=dcfce7',
    'client',
    'Mostar, BiH',
    'demo_leila_duranovic',
    'Učiteljica i prvi put vlasnica stana. Tražim pouzdanu pomoć oko kućnih poslova.',
    '{}',
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000011'::uuid,
    'Amira Hodžić',
    'https://api.dicebear.com/7.x/notionists/svg?seed=amira_hodzic&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_amira_hodzic',
    'Profesionalno čišćenje s 6 godina iskustva. Detaljna čišćenja, priprema za selidbu i redovno održavanje u Mostaru.',
    ARRAY['Čišćenje', 'Organizacija', 'Priprema za selidbu'],
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000012'::uuid,
    'Kenan Berbić',
    'https://api.dicebear.com/7.x/notionists/svg?seed=kenan_berbic&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_kenan_berbic',
    'Majstor za manje popravke, bojanje i ugradnju opreme. Vlastiti alat i ljestve.',
    ARRAY['Majstor', 'Bojanje', 'Popravci'],
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000013'::uuid,
    'Lejla Softić',
    'https://api.dicebear.com/7.x/notionists/svg?seed=lejla_softic&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_lejla_softic',
    'Pažljiva selidba — stanovi, uredi i dostava pojedinačnih predmeta. Kombi dostupan vikendom.',
    ARRAY['Selidba', 'Teški predmeti', 'Pakiranje'],
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000014'::uuid,
    'Adnan Kovač',
    'https://api.dicebear.com/7.x/notionists/svg?seed=adnan_kovac&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_adnan_kovac',
    'Dostava isti dan po Mostaru. Namirnice, dokumenti i manji paketi.',
    ARRAY['Dostava', 'Obaveze', 'Isti dan'],
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000015'::uuid,
    'Emina Čilić',
    'https://api.dicebear.com/7.x/notionists/svg?seed=emina_cilic&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_emina_cilic',
    'Čišćenje vrta, sadnja i sezonski radovi. Samo eko proizvodi.',
    ARRAY['Vrtlarstvo', 'Rad u dvorištu', 'Sadnja'],
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000016'::uuid,
    'Haris Memić',
    'https://api.dicebear.com/7.x/notionists/svg?seed=haris_memic&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_haris_memic',
    'IKEA specijalist — ormari, stolovi, police. Brza i uredna montaža svaki put.',
    ARRAY['Montaža', 'Namještaj', 'Alat'],
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000017'::uuid,
    'Selma Durak',
    'https://api.dicebear.com/7.x/notionists/svg?seed=selma_durak&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_selma_durak',
    'Instrukcije iz matematike i engleskog za osnovnoškolce i srednjoškolce. Strpljive i strukturirane sesije.',
    ARRAY['Instrukcije', 'Matematika', 'Engleski'],
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000018'::uuid,
    'Tarik Bajram',
    'https://api.dicebear.com/7.x/notionists/svg?seed=tarik_bajram&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_tarik_bajram',
    'Administrativna pomoć — računi, tablice, sortiranje e-maila i osnovno knjigovodstvo.',
    ARRAY['Admin pomoć', 'Računi', 'Unos podataka'],
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000019'::uuid,
    'Nina Petrović',
    'https://api.dicebear.com/7.x/notionists/svg?seed=nina_petrovic&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_nina_petrovic',
    'Pouzdano čišćenje stanova i kratkoročnih najmova. Fleksibilni večernji termini.',
    ARRAY['Čišćenje', 'Priprema za najam'],
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000020'::uuid,
    'Damir Alić',
    'https://api.dicebear.com/7.x/notionists/svg?seed=damir_alic&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_damir_alic',
    'Osnovna elektrika i vodoinstalacije, gipsani zidovi i opći popravci.',
    ARRAY['Majstor', 'Vodoinstalacije', 'Elektrika'],
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000021'::uuid,
    'Ajla Salkanović',
    'https://api.dicebear.com/7.x/notionists/svg?seed=ajla_salkanovic&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_ajla_salkanovic',
    'Šetnja pasa i briga o kućnim ljubimcima. Iskustvo s anksioznim ljubimcima i vikend boravcima.',
    ARRAY['Briga o ljubimcima', 'Šetnja pasa'],
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000022'::uuid,
    'Vedran Jusić',
    'https://api.dicebear.com/7.x/notionists/svg?seed=vedran_jusic&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_vedran_jusic',
    'Specijalist za selidbe — pakiranje, utovar i vožnja u skladište. Tim dostupan na zahtjev.',
    ARRAY['Selidba', 'Skladište', 'Pakiranje'],
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000023'::uuid,
    'Maja Radić',
    'https://api.dicebear.com/7.x/notionists/svg?seed=maja_radic&backgroundColor=dcfce7',
    'tasker',
    'Mostar, BiH',
    'demo_maja_radic',
    'Kurir i osobna kupovina. Poznaje prečice u Mostaru — brza isporuka.',
    ARRAY['Dostava', 'Kupovina', 'Obaveze'],
    true
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role,
  location = EXCLUDED.location,
  username = EXCLUDED.username,
  bio = EXCLUDED.bio,
  skills = EXCLUDED.skills,
  verified = true;

-- ---------------------------------------------------------------------------
-- 2. Demo tasks (mixed statuses, Mostar-focused)
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE demo_task_seed (
  seed_key text PRIMARY KEY,
  client_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  budget numeric NOT NULL,
  budget_type text NOT NULL,
  currency text NOT NULL DEFAULT 'BAM',
  location text NOT NULL,
  scheduled_offset interval NOT NULL,
  posted_offset interval NOT NULL,
  urgent boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  offer_count int NOT NULL DEFAULT 0,
  assigned_tasker_id uuid,
  accepted_offer_id bigint
);

INSERT INTO demo_task_seed VALUES
  ('open_clean_guests', 'a1000001-0001-4001-8001-000000000001'::uuid, 'Detaljno čišćenje apartmana prije dolaska gostiju', 'Dvosobni stan blizu Starog mosta. Kuhinja, kupaonice, podovi i prozori. Sredstva osigurana.', 'cleaning', 90, 'fixed', 'BAM', 'Mostar, BiH', interval '1 day', interval '5 minutes', true, 'open', 3, NULL, NULL),
  ('open_move_sofa', 'a1000001-0001-4001-8001-000000000002'::uuid, 'Premjestiti kauč u novi stan (2. kat, bez lifta)', 'Težak kutni kauč s Bulevara u oko Ronda. Treba dvoje ljudi i kolica.', 'moving', 70, 'fixed', 'BAM', 'Mostar, BiH', interval '2 days', interval '25 minutes', false, 'open', 4, NULL, NULL),
  ('open_fix_tap', 'a1000001-0001-4001-8001-000000000002'::uuid, 'Popravak slavine koja curi u kuhinji', 'Sporo kapanje ispod sudopera. Vjerojatno zamjena brtve. Materijal se refundira.', 'handyman', 35, 'fixed', 'BAM', 'Mostar, BiH', interval '3 days', interval '1 hour', false, 'open', 2, NULL, NULL),
  ('open_grocery_delivery', 'a1000001-0001-4001-8001-000000000003'::uuid, 'Dostava namirnica iz Mercatora', 'Mala lista (~15 artikala). Ostaviti na ulazu zgrade, nazvati po dolasku.', 'delivery', 20, 'fixed', 'BAM', 'Mostar, BiH', interval '6 hours', interval '2 hours', true, 'open', 1, NULL, NULL),
  ('open_math_tutor', 'a1000001-0001-4001-8001-000000000003'::uuid, 'Instrukcije iz matematike za tinejdžera (algebra)', 'Dva termina ovaj tjedan, po 90 minuta. Mirna kafić ili dolazak na adresu.', 'other', 25, 'hourly', 'BAM', 'Mostar, BiH', interval '4 days', interval '3 hours', false, 'open', 3, NULL, NULL),
  ('open_garden_cleanup', 'a1000001-0001-4001-8001-000000000001'::uuid, 'Proljetno čišćenje vrta i obrezivanje žive ograde', 'Mali dvorište, vrećice za zeleni otpad osigurane. ~3 sata rada.', 'gardening', 55, 'fixed', 'BAM', 'Mostar, BiH', interval '5 days', interval '4 hours', false, 'open', 2, NULL, NULL),
  ('assigned_ikea_desk', 'a1000001-0001-4001-8001-000000000001'::uuid, 'Montaža IKEA stola i police za knjige', 'Dva artikla u kutijama, alat na licu mjesta. Preferiram poslijepodnevni termin.', 'assembly', 40, 'fixed', 'BAM', 'Mostar, BiH', interval '2 days', interval '6 hours', false, 'assigned', 2, 'a1000001-0001-4001-8001-000000000016'::uuid, NULL),
  ('assigned_admin_help', 'a1000001-0001-4001-8001-000000000002'::uuid, 'Pomoć pri organizaciji računa i e-mail sandučića', 'Mali salon — 4 sata sortiranja i čišćenja tablica.', 'other', 30, 'hourly', 'BAM', 'Mostar, BiH', interval '3 days', interval '8 hours', false, 'assigned', 2, 'a1000001-0001-4001-8001-000000000018'::uuid, NULL),
  ('assigned_pet_sitting', 'a1000001-0001-4001-8001-000000000003'::uuid, 'Vikend briga o prijateljskom labradoru', 'Od petka navečer do nedjelje poslijepodne. Hrana i povodac osigurani.', 'pet_care', 80, 'fixed', 'BAM', 'Mostar, BiH', interval '4 days', interval '12 hours', false, 'assigned', 1, 'a1000001-0001-4001-8001-000000000021'::uuid, NULL),
  ('progress_painting', 'a1000001-0001-4001-8001-000000000002'::uuid, 'Dotjerivanje boje u hodniku i spavaćoj sobi', 'Boja već kupljena (bijela). Potrebna manja priprema zidova.', 'handyman', 120, 'fixed', 'BAM', 'Mostar, BiH', interval '1 day', interval '1 day', false, 'in_progress', 3, 'a1000001-0001-4001-8001-000000000012'::uuid, NULL),
  ('progress_moving_boxes', 'a1000001-0001-4001-8001-000000000001'::uuid, 'Premještanje kutija u skladište', 'Oko 20 srednjih kutija, prizemlje do kombija. Posao od ~2 sata.', 'moving', 65, 'fixed', 'BAM', 'Mostar, BiH', interval '12 hours', interval '2 days', false, 'in_progress', 2, 'a1000001-0001-4001-8001-000000000022'::uuid, NULL),
  ('done_weekly_clean', 'a1000001-0001-4001-8001-000000000001'::uuid, 'Tjedno čišćenje stana', 'Redovito čišćenje — kuhinja, kupaonica, dnevni boravak. Naručitelj vrlo zadovoljan.', 'cleaning', 75, 'fixed', 'BAM', 'Mostar, BiH', interval '-3 days', interval '-5 days', false, 'completed', 2, 'a1000001-0001-4001-8001-000000000011'::uuid, NULL),
  ('done_tv_mount', 'a1000001-0001-4001-8001-000000000002'::uuid, 'Montaža TV-a na zid u dnevnoj sobi', 'TV 55", cigleni zid, uključeno uredno vođenje kablova.', 'handyman', 50, 'fixed', 'BAM', 'Mostar, BiH', interval '-5 days', interval '-7 days', false, 'completed', 3, 'a1000001-0001-4001-8001-000000000012'::uuid, NULL),
  ('done_flower_bed', 'a1000001-0001-4001-8001-000000000003'::uuid, 'Preuređenje cvjetnog partera ispred kuće', 'Pljevlje, osvježavanje tla i sadnja sezonskih cvijeća.', 'gardening', 60, 'fixed', 'BAM', 'Mostar, BiH', interval '-4 days', interval '-10 days', false, 'completed', 2, 'a1000001-0001-4001-8001-000000000015'::uuid, NULL),
  ('done_doc_delivery', 'a1000001-0001-4001-8001-000000000002'::uuid, 'Dostava potpisanih dokumenata preko grada', 'Preuzimanje omotnice iz ureda, dostava javnom bilježniku, foto potvrda.', 'delivery', 18, 'fixed', 'BAM', 'Mostar, BiH', interval '-2 days', interval '-4 days', false, 'completed', 2, 'a1000001-0001-4001-8001-000000000014'::uuid, NULL),
  ('done_home_office', 'a1000001-0001-4001-8001-000000000003'::uuid, 'Reorganizacija kućnog ureda i dokumentacije', 'Sortiranje papira, označavanje fascikli, uredan radni stol.', 'other', 45, 'fixed', 'BAM', 'Mostar, BiH', interval '-6 days', interval '-12 days', false, 'completed', 2, 'a1000001-0001-4001-8001-000000000018'::uuid, NULL),
  ('cancelled_window', 'a1000001-0001-4001-8001-000000000001'::uuid, 'Hitni popravak okvira prozora', 'Naručitelj je našao stručnjaka — posao otkazan prije početka.', 'handyman', 90, 'fixed', 'BAM', 'Mostar, BiH', interval '1 day', interval '-1 day', true, 'cancelled', 1, NULL, NULL),
  ('cancelled_furniture_delivery', 'a1000001-0001-4001-8001-000000000002'::uuid, 'Dostava namještaja isti dan iz trgovine', 'Trgovina je organizirala vlastitu dostavu — više nije potrebno.', 'delivery', 40, 'fixed', 'BAM', 'Mostar, BiH', interval '6 hours', interval '-8 hours', true, 'cancelled', 0, NULL, NULL),
  ('open_zagreb_cleaning', 'a1000001-0001-4001-8001-000000000001'::uuid, 'Čišćenje stana prije selidbe (Zagreb)', 'Jednosobni stan u centru — kuhinja, kupaonica i prozori. EUR plaćanje.', 'cleaning', 45, 'fixed', 'EUR', 'Zagreb, Hrvatska', interval '2 days', interval '45 minutes', false, 'open', 2, NULL, NULL);

INSERT INTO public.tasks (
  user_id, title, description, category, budget, budget_type, currency,
  location, scheduled_date, urgent, status, offer_count, images, created_at
)
SELECT
  s.client_id,
  s.title,
  s.description,
  s.category,
  s.budget,
  s.budget_type,
  s.currency,
  s.location,
  now() + s.scheduled_offset,
  s.urgent,
  s.status,
  s.offer_count,
  '{}'::text[],
  now() - s.posted_offset
FROM demo_task_seed s;

CREATE TEMP TABLE demo_task_map AS
SELECT s.seed_key, t.id AS task_id
FROM demo_task_seed s
JOIN public.tasks t ON t.title = s.title AND t.user_id = s.client_id;

-- ---------------------------------------------------------------------------
-- 3. Demo offers (varied prices and response times)
-- ---------------------------------------------------------------------------

INSERT INTO public.offers (task_id, tasker_id, message, price, status, created_at)
SELECT m.task_id, o.tasker_id, o.message, o.price, o.status, now() - o.posted_offset
FROM demo_task_map m
JOIN (
  VALUES
    ('open_clean_guests', 'a1000001-0001-4001-8001-000000000011'::uuid, '[genza:duration:3 sata]\nMogu sutra ujutro detaljno očistiti stan. Donosim eko sredstva i radila sam mnogo selidbenih čišćenja u Mostaru.', 85::numeric, 'pending', interval '4 minutes'),
    ('open_clean_guests', 'a1000001-0001-4001-8001-000000000019'::uuid, '[genza:duration:4 sata]\nDostupna večeras. Posebno pažljiva s kuhinjom i kupaonicama.', 95::numeric, 'pending', interval '12 minutes'),
    ('open_clean_guests', 'a1000001-0001-4001-8001-000000000015'::uuid, '[genza:duration:3 sata]\nRado pomažem — mogu krenuti za 2 sata ako je hitno.', 90::numeric, 'pending', interval '18 minutes'),

    ('open_move_sofa', 'a1000001-0001-4001-8001-000000000013'::uuid, '[genza:duration:2 sata]\nTim od dvoje s trakama i kolica. Radio sam slične selidbe na Bulevaru prošlog mjeseca.', 65::numeric, 'pending', interval '10 minutes'),
    ('open_move_sofa', 'a1000001-0001-4001-8001-000000000022'::uuid, '[genza:duration:2 sata]\nKombi dostupan u subotu. Pažljiv s kutovima i okvirima vrata.', 70::numeric, 'pending', interval '20 minutes'),
    ('open_move_sofa', 'a1000001-0001-4001-8001-000000000020'::uuid, '[genza:duration:2 sata]\nMogu pomoći kao drugi par ruku ako već imate prevoz.', 55::numeric, 'pending', interval '35 minutes'),
    ('open_move_sofa', 'a1000001-0001-4001-8001-000000000016'::uuid, '[genza:duration:2 sata]\nJak sam i slobodan sutra poslijepodne.', 68::numeric, 'pending', interval '40 minutes'),

    ('open_fix_tap', 'a1000001-0001-4001-8001-000000000012'::uuid, '[genza:duration:45 min]\nVjerojatno brtva — mogu danas popraviti s dijelovima iz željezare.', 35::numeric, 'pending', interval '15 minutes'),
    ('open_fix_tap', 'a1000001-0001-4001-8001-000000000020'::uuid, '[genza:duration:1 sat]\nPokrivam osnovne vodoinstalaterske poslove. Mogu poslije 17h.', 40::numeric, 'pending', interval '50 minutes'),

    ('open_grocery_delivery', 'a1000001-0001-4001-8001-000000000014'::uuid, '[genza:duration:1 sat]\nMogu preuzeti u roku od sat vremena i dostaviti s fotografijom računa.', 18::numeric, 'pending', interval '8 minutes'),

    ('open_math_tutor', 'a1000001-0001-4001-8001-000000000017'::uuid, '[genza:duration:90 min]\nIskustvo sa srednjoškolskom algebrom. Miran, strukturiran pristup.', 25::numeric, 'pending', interval '20 minutes'),
    ('open_math_tutor', 'a1000001-0001-4001-8001-000000000023'::uuid, '[genza:duration:90 min]\nAsistent u nastavi — mogu dva termina ovaj tjedan.', 22::numeric, 'pending', interval '45 minutes'),
    ('open_math_tutor', 'a1000001-0001-4001-8001-000000000018'::uuid, '[genza:duration:90 min]\nTakođer jak u matematici — fleksibilan oko lokacije.', 28::numeric, 'pending', interval '1 hour'),

    ('open_garden_cleanup', 'a1000001-0001-4001-8001-000000000015'::uuid, '[genza:duration:3 sata]\nEko čišćenje vrta. Zeleni otpad mogu pravilno odložiti.', 50::numeric, 'pending', interval '30 minutes'),
    ('open_garden_cleanup', 'a1000001-0001-4001-8001-000000000012'::uuid, '[genza:duration:4 sata]\nOpća pomoć oko dvorišta ako treba dodatna snaga za obrezivanje.', 55::numeric, 'pending', interval '1 hour'),

    ('assigned_ikea_desk', 'a1000001-0001-4001-8001-000000000016'::uuid, '[genza:duration:2 sata]\nIKEA specijalist — brza montaža, ambalažu recikliram.', 40::numeric, 'accepted', interval '5 hours'),
    ('assigned_ikea_desk', 'a1000001-0001-4001-8001-000000000020'::uuid, '[genza:duration:3 sata]\nMogu obaviti, ali malo sporije od namještajskog specijaliste.', 45::numeric, 'rejected', interval '5 hours 10 minutes'),

    ('assigned_admin_help', 'a1000001-0001-4001-8001-000000000018'::uuid, '[genza:duration:4 sata]\nOrganizirao sam sandučić i predloške računa za slične salone.', 30::numeric, 'accepted', interval '7 hours'),
    ('assigned_admin_help', 'a1000001-0001-4001-8001-000000000023'::uuid, '[genza:duration:4 sata]\nMogu pomoći i s administrativnim obavezama u terenu.', 28::numeric, 'rejected', interval '7 hours 20 minutes'),

    ('assigned_pet_sitting', 'a1000001-0001-4001-8001-000000000021'::uuid, '[genza:duration:vikend]\nIskustvo s labradorima — uključene dnevne fotografije.', 80::numeric, 'accepted', interval '11 hours'),

    ('progress_painting', 'a1000001-0001-4001-8001-000000000012'::uuid, '[genza:duration:5 sati]\nJučer sam krenuo s hodnikom — danas završavam spavaću.', 115::numeric, 'accepted', interval '1 day'),
    ('progress_painting', 'a1000001-0001-4001-8001-000000000020'::uuid, '[genza:duration:6 sati]\nDostupan ako se promijeni raspored.', 125::numeric, 'rejected', interval '1 day 2 hours'),
    ('progress_painting', 'a1000001-0001-4001-8001-000000000011'::uuid, '[genza:duration:6 sati]\nMogu pomoći s pripremom zidova ako zatreba.', 100::numeric, 'withdrawn', interval '1 day 3 hours'),

    ('progress_moving_boxes', 'a1000001-0001-4001-8001-000000000022'::uuid, '[genza:duration:2 sata]\nKombi rezerviran — trenutno utovar.', 65::numeric, 'accepted', interval '2 days'),
    ('progress_moving_boxes', 'a1000001-0001-4001-8001-000000000013'::uuid, '[genza:duration:2 sata]\nRezervni termin ako treba dodatne ruke.', 60::numeric, 'rejected', interval '2 days 1 hour'),

    ('done_weekly_clean', 'a1000001-0001-4001-8001-000000000011'::uuid, '[genza:duration:3 sata]\nRedovni termin — ista kvaliteta svaki tjedan.', 75::numeric, 'accepted', interval '5 days'),
    ('done_weekly_clean', 'a1000001-0001-4001-8001-000000000019'::uuid, '[genza:duration:3 sata]\nVečernja dostupnost ako vam više odgovara.', 70::numeric, 'rejected', interval '5 days 1 hour'),

    ('done_tv_mount', 'a1000001-0001-4001-8001-000000000012'::uuid, '[genza:duration:90 min]\nMontaža na cigleni zid mi je specijalnost.', 50::numeric, 'accepted', interval '7 days'),
    ('done_tv_mount', 'a1000001-0001-4001-8001-000000000020'::uuid, '[genza:duration:2 sata]\nMogu s nosačem koji već imate.', 55::numeric, 'rejected', interval '7 days 2 hours'),
    ('done_tv_mount', 'a1000001-0001-4001-8001-000000000016'::uuid, '[genza:duration:2 sata]\nVještine montaže prenose se — pažljiv s kablovima.', 48::numeric, 'rejected', interval '7 days 3 hours'),

    ('done_flower_bed', 'a1000001-0001-4001-8001-000000000015'::uuid, '[genza:duration:4 sata]\nUključen plan sezonskog sadnje.', 60::numeric, 'accepted', interval '10 days'),
    ('done_flower_bed', 'a1000001-0001-4001-8001-000000000012'::uuid, '[genza:duration:5 sati]\nMogu pomoći s teškim vrećama zemlje.', 65::numeric, 'rejected', interval '10 days 1 hour'),

    ('done_doc_delivery', 'a1000001-0001-4001-8001-000000000014'::uuid, '[genza:duration:45 min]\nBrza ruta preko Ronda — foto potvrda po dostavi.', 18::numeric, 'accepted', interval '4 days'),
    ('done_doc_delivery', 'a1000001-0001-4001-8001-000000000023'::uuid, '[genza:duration:1 sat]\nDostupan i za povratni put ako zatreba.', 20::numeric, 'rejected', interval '4 days 30 minutes'),

    ('done_home_office', 'a1000001-0001-4001-8001-000000000018'::uuid, '[genza:duration:3 sata]\nSortiran sustav fascikli i označenih mapa.', 45::numeric, 'accepted', interval '12 days'),
    ('done_home_office', 'a1000001-0001-4001-8001-000000000017'::uuid, '[genza:duration:4 sata]\nMogu pomoći i s popisom digitalne arhive.', 40::numeric, 'rejected', interval '12 days 1 hour'),

    ('cancelled_window', 'a1000001-0001-4001-8001-000000000020'::uuid, '[genza:duration:3 sata]\nPopravak okvira prozora i zaptivanje.', 85::numeric, 'withdrawn', interval '1 day')
) AS o(seed_key, tasker_id, message, price, status, posted_offset)
  ON o.seed_key = m.seed_key;

UPDATE public.tasks t
SET
  accepted_offer_id = o.id,
  assigned_tasker_id = o.tasker_id
FROM demo_task_map m
JOIN demo_task_seed s ON s.seed_key = m.seed_key
JOIN public.offers o ON o.task_id = m.task_id AND o.status = 'accepted'
WHERE t.id = m.task_id
  AND s.status IN ('assigned', 'in_progress', 'completed');

-- ---------------------------------------------------------------------------
-- 4. Demo chats + sample messages for active tasks
-- ---------------------------------------------------------------------------

INSERT INTO public.chats (task_id, user_id, tasker_id, offer_id, created_at)
SELECT
  m.task_id,
  s.client_id,
  s.assigned_tasker_id,
  o.id,
  now() - interval '3 hours'
FROM demo_task_map m
JOIN demo_task_seed s ON s.seed_key = m.seed_key
JOIN public.offers o ON o.task_id = m.task_id AND o.status = 'accepted'
WHERE s.status IN ('assigned', 'in_progress', 'completed');

INSERT INTO public.messages (chat_id, sender_id, message, created_at)
SELECT c.id, c.user_id, 'Bok! Samo potvrđujem da vam odgovara termin.', now() - interval '2 hours 30 minutes'
FROM public.chats c
JOIN demo_task_map m ON m.task_id = c.task_id
JOIN demo_task_seed s ON s.seed_key = m.seed_key
WHERE s.status IN ('assigned', 'in_progress');

INSERT INTO public.messages (chat_id, sender_id, message, created_at)
SELECT c.id, c.tasker_id, 'Da, vidimo se tada. Donosim sve što treba.', now() - interval '2 hours'
FROM public.chats c
JOIN demo_task_map m ON m.task_id = c.task_id
JOIN demo_task_seed s ON s.seed_key = m.seed_key
WHERE s.status IN ('assigned', 'in_progress');

-- ---------------------------------------------------------------------------
-- 5. Demo reviews (mixed lengths, realistic text)
-- ---------------------------------------------------------------------------

INSERT INTO public.reviews (task_id, reviewer_id, reviewed_user_id, rating, comment, created_at)
SELECT m.task_id, s.client_id, s.assigned_tasker_id, r.rating, r.comment, now() - r.age
FROM demo_task_map m
JOIN demo_task_seed s ON s.seed_key = m.seed_key
JOIN (
  VALUES
    ('done_weekly_clean', 5::integer, 'Amira je bila fantastična — kuhinja besprijekorna i prilagodila se našem rasporedu. Rezervirat ću ponovo.', interval '4 days'),
    ('done_tv_mount', 5::integer, 'Kenan je savršeno montirao TV i uredno sakrio kablove. Vrlo profesionalno.', interval '6 days'),
    ('done_flower_bed', 4::integer, 'Vrt izgleda odlično. Emina je pažljivo birala biljke za sezonu.', interval '9 days'),
    ('done_doc_delivery', 5::integer, 'Brzo i pouzdano. Foto potvrda je točno ono što mi je trebalo.', interval '3 days'),
    ('done_home_office', 5::integer, 'Tarik je reorganizirao ured za jedno poslijepodne. Računi su konačno pod kontrolom — toplo preporučujem za admin pomoć.', interval '11 days')
) AS r(seed_key, rating, comment, age) ON r.seed_key = m.seed_key
WHERE s.status = 'completed';

INSERT INTO public.reviews (task_id, reviewer_id, reviewed_user_id, rating, comment, created_at)
SELECT m.task_id, s.assigned_tasker_id, s.client_id, 5::integer, 'Jasne upute i ljubaznost — lako za suradnju.', now() - interval '3 days'
FROM demo_task_map m
JOIN demo_task_seed s ON s.seed_key = m.seed_key
WHERE s.seed_key = 'done_weekly_clean';

INSERT INTO public.reviews (task_id, reviewer_id, reviewed_user_id, rating, comment, created_at)
SELECT m.task_id, s.assigned_tasker_id, s.client_id, 5::integer, 'Dobra komunikacija.', now() - interval '5 days'
FROM demo_task_map m
JOIN demo_task_seed s ON s.seed_key = m.seed_key
WHERE s.seed_key = 'done_tv_mount';

SET session_replication_role = DEFAULT;

-- Done. Browse the app while logged out or as a real user — demo content is public.
