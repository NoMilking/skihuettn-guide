-- Skigebiet Lenggries-Brauneck mit allen Hütten hinzufügen
-- Führe dieses KOMPLETTE Script im Supabase SQL Editor aus

DO $$
DECLARE
    new_ski_area_id UUID;
BEGIN
    -- Skigebiet einfügen und ID speichern
    INSERT INTO ski_areas (name, flag_emoji, map_image)
    VALUES ('Lenggries-Brauneck', '🇩🇪', 'lenggries-brauneck.svg')
    RETURNING id INTO new_ski_area_id;

    -- Alle 17 Hütten einfügen
    INSERT INTO restaurants (ski_area_id, name, x, y) VALUES
    (new_ski_area_id, 'Alte Mulistation', 0.864507, 0.753305),
    (new_ski_area_id, 'Anderl Alm', 0.234003, 0.467036),
    (new_ski_area_id, 'Bayernhütte', 0.195998, 0.349963),
    (new_ski_area_id, 'Brauneck-Gipfelhaus', 0.561575, 0.227173),
    (new_ski_area_id, 'Draxlstüberl', 0.555764, 0.887778),
    (new_ski_area_id, 'Finstermünz-Alm', 0.265674, 0.418133),
    (new_ski_area_id, 'Florihütte', 0.330477, 0.448512),
    (new_ski_area_id, 'Jaegers', 0.875501, 0.73993),
    (new_ski_area_id, 'Jaudenstadl', 0.597903, 0.854454),
    (new_ski_area_id, 'Kotalm', 0.491754, 0.472964),
    (new_ski_area_id, 'Milchhäusl', 0.48736, 0.674568),
    (new_ski_area_id, 'Panoramarestaurant Brauneck', 0.535675, 0.226948),
    (new_ski_area_id, 'Quenger Alm', 0.203794, 0.312174),
    (new_ski_area_id, 'Reiseralm', 0.773037, 0.562626),
    (new_ski_area_id, 'Stie-Alm', 0.096113, 0.273644),
    (new_ski_area_id, 'Strasser Alm', 0.174559, 0.315138),
    (new_ski_area_id, 'Tölzer Hütte', 0.255441, 0.285499);

    RAISE NOTICE 'Skigebiet Lenggries-Brauneck mit ID % und 17 Hütten erfolgreich hinzugefügt!', new_ski_area_id;
END $$;
