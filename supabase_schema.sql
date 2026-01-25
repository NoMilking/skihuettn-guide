-- SkiHüttn Guide - Datenbank Schema
-- Führe dieses SQL-Script im Supabase SQL Editor aus

-- ========================================
-- TABELLEN ERSTELLEN
-- ========================================

-- Tabelle: Skigebiete
CREATE TABLE ski_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  flag_emoji TEXT NOT NULL,
  map_image TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabelle: Restaurants / Hütten
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ski_area_id UUID NOT NULL REFERENCES ski_areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  x FLOAT4 NOT NULL CHECK (x >= 0 AND x <= 1),
  y FLOAT4 NOT NULL CHECK (y >= 0 AND y <= 1),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabelle: Bewertungen
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,

  -- Pflichtfeld: Selbstbedienung
  self_service INT2 NOT NULL CHECK (self_service IN (-20, -10, 0)),

  -- Optionale Slider (0-5, Schritt 0.5)
  service FLOAT4 DEFAULT 0 CHECK (service >= 0 AND service <= 5),
  ski_haserl FLOAT4 DEFAULT 0 CHECK (ski_haserl >= 0 AND ski_haserl <= 5),
  food FLOAT4 DEFAULT 0 CHECK (food >= 0 AND food <= 5),
  sun_terrace FLOAT4 DEFAULT 0 CHECK (sun_terrace >= 0 AND sun_terrace <= 5),
  interior FLOAT4 DEFAULT 0 CHECK (interior >= 0 AND interior <= 5),
  apres_ski FLOAT4 DEFAULT 0 CHECK (apres_ski >= 0 AND apres_ski <= 5),

  -- Bonus
  eggnog BOOLEAN DEFAULT false,

  -- Kommentar
  comment TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ein Gerät kann pro Restaurant nur 1x bewerten
  UNIQUE (restaurant_id, device_id)
);

-- Tabelle: Fotos
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabelle: Kommentar-Votes ("Hilfreich")
CREATE TABLE comment_votes (
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Ein Gerät kann pro Kommentar nur 1x voten
  PRIMARY KEY (rating_id, device_id)
);

-- Tabelle: Favoriten
CREATE TABLE favorites (
  device_id TEXT NOT NULL,
  ski_area_id UUID NOT NULL REFERENCES ski_areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  PRIMARY KEY (device_id, ski_area_id)
);

-- ========================================
-- MATERIALIZED VIEW FÜR AGGREGATIONEN
-- ========================================

CREATE MATERIALIZED VIEW restaurant_stats AS
SELECT
  r.id AS restaurant_id,
  r.name,
  r.ski_area_id,
  r.x,
  r.y,

  -- Anzahl Bewertungen
  COUNT(rat.id) AS rating_count,

  -- Durchschnitte je Kategorie
  COALESCE(AVG(rat.service), 0) AS avg_service,
  COALESCE(AVG(rat.ski_haserl), 0) AS avg_ski_haserl,
  COALESCE(AVG(rat.food), 0) AS avg_food,
  COALESCE(AVG(rat.sun_terrace), 0) AS avg_sun_terrace,
  COALESCE(AVG(rat.interior), 0) AS avg_interior,
  COALESCE(AVG(rat.apres_ski), 0) AS avg_apres_ski,

  -- Eierlikör Prozentsatz (0-1)
  COALESCE(AVG(CASE WHEN rat.eggnog THEN 1 ELSE 0 END), 0) AS eggnog_percentage,

  -- Durchschnittlicher Gesamtscore
  COALESCE(AVG(
    rat.self_service +
    COALESCE(rat.service, 0) +
    COALESCE(rat.ski_haserl, 0) +
    COALESCE(rat.food, 0) +
    COALESCE(rat.sun_terrace, 0) +
    COALESCE(rat.interior, 0) +
    COALESCE(rat.apres_ski, 0) +
    CASE WHEN rat.eggnog THEN 5 ELSE 0 END
  ), 0) AS avg_total_score,

  -- Häufigster Selbstbedienungs-Wert
  MODE() WITHIN GROUP (ORDER BY rat.self_service) AS most_common_self_service

FROM restaurants r
LEFT JOIN ratings rat ON rat.restaurant_id = r.id
GROUP BY r.id, r.name, r.ski_area_id, r.x, r.y;

-- Index für concurrent refresh
CREATE UNIQUE INDEX idx_restaurant_stats_id ON restaurant_stats(restaurant_id);
CREATE INDEX idx_restaurant_stats_ski_area ON restaurant_stats(ski_area_id);

-- ========================================
-- AUTO-REFRESH TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION refresh_restaurant_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY restaurant_stats;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_stats_insert
AFTER INSERT ON ratings
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_restaurant_stats();

CREATE TRIGGER trigger_refresh_stats_update
AFTER UPDATE ON ratings
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_restaurant_stats();

CREATE TRIGGER trigger_refresh_stats_delete
AFTER DELETE ON ratings
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_restaurant_stats();

-- ========================================
-- RLS DEAKTIVIEREN (keine Auth!)
-- ========================================

ALTER TABLE ski_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;

-- ========================================
-- TEST-DATEN: SKIGEBIETE
-- ========================================

INSERT INTO ski_areas (name, flag_emoji) VALUES
  ('Sölden', '🇦🇹'),
  ('Ischgl', '🇦🇹'),
  ('St. Anton', '🇦🇹'),
  ('Zermatt', '🇨🇭'),
  ('Verbier', '🇨🇭'),
  ('Cortina d''Ampezzo', '🇮🇹');

-- ========================================
-- TEST-DATEN: BEISPIEL-HÜTTEN FÜR SÖLDEN
-- ========================================

INSERT INTO restaurants (ski_area_id, name, x, y)
SELECT
  (SELECT id FROM ski_areas WHERE name = 'Sölden'),
  name,
  x,
  y
FROM (VALUES
  ('Gampe Alm', 0.3, 0.4),
  ('Eugens Obstlerhütte', 0.5, 0.3),
  ('Heidis Hütte', 0.7, 0.5),
  ('Bergrestaurant Giggijoch', 0.4, 0.6),
  ('Silberbrunnalm', 0.6, 0.7),
  ('Hühnersteign Alm', 0.2, 0.5),
  ('Gaislachalm', 0.8, 0.4),
  ('Sonneck', 0.5, 0.8)
) AS t(name, x, y);

-- ========================================
-- FERTIG!
-- ========================================

-- Überprüfe die Tabellen
SELECT 'ski_areas' as table_name, COUNT(*) as count FROM ski_areas
UNION ALL
SELECT 'restaurants', COUNT(*) FROM restaurants
UNION ALL
SELECT 'ratings', COUNT(*) FROM ratings
UNION ALL
SELECT 'photos', COUNT(*) FROM photos
UNION ALL
SELECT 'comment_votes', COUNT(*) FROM comment_votes
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites;
