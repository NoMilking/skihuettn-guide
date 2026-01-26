-- Skigebiet Lenggries-Brauneck hinzufügen
-- Führe dieses Script im Supabase SQL Editor aus

-- Schritt 1: Skigebiet einfügen
INSERT INTO ski_areas (name, flag_emoji, map_image)
VALUES ('Lenggries-Brauneck', '🇩🇪', 'lenggries-brauneck.svg')
RETURNING id;

-- Schritt 2: Hütten einfügen (ersetze SKI_AREA_ID mit der ID von oben)
-- WICHTIG: Kopiere die ID aus dem Ergebnis von Schritt 1 und ersetze alle 'SKI_AREA_ID'

INSERT INTO restaurants (ski_area_id, name, x, y) VALUES
('SKI_AREA_ID', 'Alte Mulistation', 0.864507, 0.753305),
('SKI_AREA_ID', 'Anderl Alm', 0.234003, 0.467036),
('SKI_AREA_ID', 'Bayernhütte', 0.195998, 0.349963),
('SKI_AREA_ID', 'Brauneck-Gipfelhaus', 0.561575, 0.227173),
('SKI_AREA_ID', 'Draxlstüberl', 0.555764, 0.887778),
('SKI_AREA_ID', 'Finstermünz-Alm', 0.265674, 0.418133),
('SKI_AREA_ID', 'Florihütte', 0.330477, 0.448512),
('SKI_AREA_ID', 'Jaegers', 0.875501, 0.73993),
('SKI_AREA_ID', 'Jaudenstadl', 0.597903, 0.854454),
('SKI_AREA_ID', 'Kotalm', 0.491754, 0.472964),
('SKI_AREA_ID', 'Milchhäusl', 0.48736, 0.674568),
('SKI_AREA_ID', 'Panoramarestaurant Brauneck', 0.535675, 0.226948),
('SKI_AREA_ID', 'Quenger Alm', 0.203794, 0.312174),
('SKI_AREA_ID', 'Reiseralm', 0.773037, 0.562626),
('SKI_AREA_ID', 'Stie-Alm', 0.096113, 0.273644),
('SKI_AREA_ID', 'Strasser Alm', 0.174559, 0.315138),
('SKI_AREA_ID', 'Tölzer Hütte', 0.255441, 0.285499);
