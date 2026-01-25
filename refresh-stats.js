// Refresh restaurant_stats materialized view
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function refreshStats() {
  console.log('Refreshing restaurant_stats materialized view...\n');

  // Execute the refresh command
  const { data, error } = await supabase.rpc('refresh_restaurant_stats_view');

  if (error) {
    console.error('❌ Error refreshing view:', error.message);
    console.log('\nTrying alternative method...\n');

    // Alternative: Use raw SQL
    const { error: sqlError } = await supabase
      .from('restaurant_stats')
      .select('count');

    if (sqlError) {
      console.error('❌ SQL Error:', sqlError.message);
    }
  } else {
    console.log('✅ View refreshed successfully!');
  }

  // Verify the refresh worked
  const { data: stats, error: statsError } = await supabase
    .from('restaurant_stats')
    .select('*');

  if (statsError) {
    console.error('❌ Error loading stats:', statsError.message);
  } else {
    console.log(`\n✅ Restaurant stats now contains ${stats.length} entries`);
    stats.forEach(s => {
      console.log(`   - ${s.name}: score=${s.avg_total_score}, ratings=${s.rating_count}`);
    });
  }
}

refreshStats().catch(console.error);
