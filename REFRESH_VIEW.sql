-- ANLEITUNG: Führe diesen Befehl in Supabase SQL Editor aus
-- (supabase.com → Dein Projekt → SQL Editor → "New Query")

REFRESH MATERIALIZED VIEW restaurant_stats;

-- Überprüfung (optional):
SELECT COUNT(*) FROM restaurant_stats;
SELECT * FROM restaurant_stats ORDER BY name;
