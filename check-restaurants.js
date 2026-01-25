// Check restaurants in database
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRestaurants() {
  console.log('Checking restaurants...\n');

  // Check restaurants table
  const { data: restaurants, error: restError } = await supabase
    .from('restaurants')
    .select('*');

  if (restError) {
    console.error('❌ Error loading restaurants:', restError.message);
    return;
  }

  console.log('✅ Restaurants in database:', restaurants.length);
  restaurants.forEach(r => console.log(`   - ${r.name} (${r.ski_area_id})`));

  // Check restaurant_stats view
  const { data: stats, error: statsError } = await supabase
    .from('restaurant_stats')
    .select('*');

  if (statsError) {
    console.error('\n❌ Error loading restaurant_stats:', statsError.message);
    return;
  }

  console.log('\n✅ Restaurant stats view:', stats.length);
  stats.forEach(s => console.log(`   - ${s.name}: score=${s.avg_total_score}, count=${s.rating_count}`));

  // Get Sölden ID
  const { data: soelden } = await supabase
    .from('ski_areas')
    .select('id, name')
    .eq('name', 'Sölden')
    .single();

  if (soelden) {
    console.log('\n✅ Sölden ID:', soelden.id);

    const { data: soeldenRestaurants } = await supabase
      .from('restaurant_stats')
      .select('*')
      .eq('ski_area_id', soelden.id);

    console.log('✅ Restaurants in Sölden:', soeldenRestaurants?.length || 0);
  }
}

checkRestaurants().catch(console.error);
