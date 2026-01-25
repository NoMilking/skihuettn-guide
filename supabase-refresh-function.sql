-- SQL Function to refresh the materialized view
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION refresh_restaurant_stats_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY restaurant_stats;
END;
$$;

-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION refresh_restaurant_stats_view() TO anon;
GRANT EXECUTE ON FUNCTION refresh_restaurant_stats_view() TO authenticated;
