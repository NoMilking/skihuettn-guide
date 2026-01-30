import { supabase } from './supabase';

export interface ActivityFeedItem {
  type: 'vote' | 'like';
  restaurantName: string;
  restaurantId: string;
  createdAt: string;
}

/**
 * Fetches all comment votes and photo likes for a user's ratings,
 * merged and sorted chronologically (newest first).
 */
export async function getActivityFeed(deviceId: string): Promise<ActivityFeedItem[]> {
  // 1. Get all rating IDs for this device
  const { data: ratings, error: ratingsError } = await supabase
    .from('ratings')
    .select('id, restaurant_id, restaurants ( id, name )')
    .eq('device_id', deviceId);

  if (ratingsError || !ratings || ratings.length === 0) return [];

  const ratingIds = ratings.map(r => r.id);

  // Build a lookup: ratingId -> restaurant info
  const restaurantByRatingId = new Map<string, { id: string; name: string }>();
  for (const r of ratings) {
    const rest = r.restaurants as any;
    if (rest) {
      restaurantByRatingId.set(r.id, { id: rest.id, name: rest.name });
    }
  }

  // 2. Get all comment votes on this user's ratings
  const { data: votes, error: votesError } = await supabase
    .from('comment_votes')
    .select('rating_id, created_at')
    .in('rating_id', ratingIds);

  if (votesError) {
    console.error('[API] Error loading comment votes:', votesError);
  }

  // 3. Get all photos for this user's ratings, then their likes
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('id, rating_id')
    .in('rating_id', ratingIds);

  if (photosError) {
    console.error('[API] Error loading photos:', photosError);
  }

  let likesItems: ActivityFeedItem[] = [];
  if (photos && photos.length > 0) {
    const photoIds = photos.map(p => p.id);
    // Build lookup: photoId -> ratingId
    const ratingByPhotoId = new Map<string, string>();
    for (const p of photos) {
      ratingByPhotoId.set(p.id, p.rating_id);
    }

    const { data: likes, error: likesError } = await supabase
      .from('photo_likes')
      .select('photo_id, created_at')
      .in('photo_id', photoIds);

    if (likesError) {
      console.error('[API] Error loading photo likes:', likesError);
    }

    if (likes) {
      likesItems = likes
        .map(like => {
          const ratingId = ratingByPhotoId.get(like.photo_id);
          const restaurant = ratingId ? restaurantByRatingId.get(ratingId) : undefined;
          if (!restaurant) return null;
          return {
            type: 'like' as const,
            restaurantName: restaurant.name,
            restaurantId: restaurant.id,
            createdAt: like.created_at,
          };
        })
        .filter((item): item is ActivityFeedItem => item !== null);
    }
  }

  // 4. Build vote items
  const voteItems: ActivityFeedItem[] = (votes || [])
    .map(vote => {
      const restaurant = restaurantByRatingId.get(vote.rating_id);
      if (!restaurant) return null;
      return {
        type: 'vote' as const,
        restaurantName: restaurant.name,
        restaurantId: restaurant.id,
        createdAt: vote.created_at,
      };
    })
    .filter((item): item is ActivityFeedItem => item !== null);

  // 5. Merge and sort by date descending
  const allItems = [...voteItems, ...likesItems];
  allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return allItems;
}
