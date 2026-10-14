-- Courts and starting rates. Owners can change rates later from the app (Settings → Rates).
insert into public.courts (slug, name_i18n, sports, sort) values
  ('turf', '{"en":"Turf (Cricket & Football)","gu":"ટર્ફ (ક્રિકેટ અને ફૂટબોલ)","hi":"टर्फ (क्रिकेट और फ़ुटबॉल)"}', '{cricket,football}', 1),
  ('pickleball', '{"en":"Pickleball Court","gu":"પિકલબોલ કોર્ટ","hi":"पिकलबॉल कोर्ट"}', '{}', 2)
on conflict (slug) do nothing;

-- TODO: replace with real rates (₹ per hour). Minutes from midnight: 360 = 6 AM, 1080 = 6 PM.
insert into public.rate_rules (court_slug, day_type, start_minute, end_minute, price_per_hour) values
  ('turf', 'all', 360, 1080, 800),      -- Day: 6 AM – 6 PM
  ('turf', 'all', 1080, 360, 1000),     -- Night: 6 PM – 6 AM (lights)
  ('turf', 'weekend', 1080, 360, 1200), -- Weekend night
  ('pickleball', 'all', 360, 1080, 400),
  ('pickleball', 'all', 1080, 360, 500);
