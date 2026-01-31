import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RestaurantStats, Rating, Photo } from '../types';
import { getRestaurantStats } from '../api/restaurants';
import { getRatingsByRestaurant, getUserRatingForRestaurant } from '../api/ratings';
import { getCommentVoteCount, hasUserVoted, toggleCommentVote } from '../api/ratings';
import { getPhotosByRatings, getPhotoUrl, togglePhotoLike, hasUserLikedPhoto } from '../api/photos';
import { useDevice } from '../hooks/useDevice';
import { getScoreColor, getScoreBackgroundColor } from '../logic/color';
import { getEmojisForRestaurant } from '../logic/emoji';
import { getSelfServiceLabel } from '../logic/scoring';
import { RootStackParamList } from '../navigation/RootNavigator';

interface Props {
  route: {
    params: {
      restaurantId: string;
    };
  };
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RestaurantDetailScreen({ route }: Props) {
  const { restaurantId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const { deviceId } = useDevice();

  const [restaurant, setRestaurant] = useState<RestaurantStats | null>(null);
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [allRatings, setAllRatings] = useState<Rating[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [likingInProgress, setLikingInProgress] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Reload data when screen comes into focus (e.g., after returning from rating screen)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [restaurantId, deviceId])
  );

  const loadData = async () => {
    try {
      setLoading(true);

      const [restaurantData, ratingsData] = await Promise.all([
        getRestaurantStats(restaurantId),
        getRatingsByRestaurant(restaurantId),
      ]);

      setRestaurant(restaurantData);
      setAllRatings(ratingsData);

      if (deviceId) {
        const userRatingData = await getUserRatingForRestaurant(restaurantId, deviceId);
        setUserRating(userRatingData);
      }

      // Load all photos for all ratings (sorted by likes)
      const ratingIds = ratingsData.map(r => r.id);
      const allPhotos = await getPhotosByRatings(ratingIds);
      setPhotos(allPhotos);

      // Load which photos the user has liked
      if (deviceId && allPhotos.length > 0) {
        const likedSet = new Set<string>();
        await Promise.all(
          allPhotos.map(async (photo) => {
            const liked = await hasUserLikedPhoto(photo.id, deviceId);
            if (liked) likedSet.add(photo.id);
          })
        );
        setLikedPhotos(likedSet);
      }
    } catch (error) {
      console.error('Error loading restaurant:', error);
      Alert.alert('Fehler', 'Restaurant-Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoLike = async () => {
    if (!deviceId || selectedPhotoIndex === null || likingInProgress) return;

    const photo = photos[selectedPhotoIndex];
    if (!photo) return;

    try {
      setLikingInProgress(true);
      const added = await togglePhotoLike(photo.id, deviceId);

      // Update liked photos set
      setLikedPhotos(prev => {
        const newSet = new Set(prev);
        if (added) {
          newSet.add(photo.id);
        } else {
          newSet.delete(photo.id);
        }
        return newSet;
      });

      // Update like count in photos array (no re-sorting to avoid photo switching)
      setPhotos(prev => prev.map(p => {
        if (p.id === photo.id) {
          return { ...p, like_count: (p.like_count ?? 0) + (added ? 1 : -1) };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error toggling photo like:', error);
      Alert.alert('Fehler', 'Like konnte nicht gespeichert werden.');
    } finally {
      setLikingInProgress(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Lade Hütten-Details...</Text>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Hütte nicht gefunden</Text>
      </View>
    );
  }

  const scoreColor = getScoreColor(restaurant.avg_total_score);
  const scoreBgColor = getScoreBackgroundColor(restaurant.avg_total_score);
  const emojis = getEmojisForRestaurant(restaurant);
  const serviceLabel = restaurant.most_common_self_service !== null
    ? getSelfServiceLabel(restaurant.most_common_self_service)
    : 'Keine Bewertungen';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>

          {/* Emojis */}
          {emojis.length > 0 && (
            <Text style={styles.emojis}>{emojis.join(' ')}</Text>
          )}

          {/* Score Display */}
          <View style={[styles.scoreContainer, { backgroundColor: scoreBgColor }]}>
            <Text style={styles.scoreLabel}>Gesamtscore</Text>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {restaurant.avg_total_score.toFixed(1)}
            </Text>
          </View>

          {/* Service Info */}
          <View style={styles.serviceInfoContainer}>
            <Text style={styles.serviceLabel}>Service:</Text>
            <Text style={styles.serviceValue}>{serviceLabel}</Text>
          </View>

          {/* Rating Count */}
          <Text style={styles.ratingCount}>
            {restaurant.rating_count} {restaurant.rating_count === 1 ? 'Bewertung' : 'Bewertungen'}
          </Text>
        </View>

        {/* Categories */}
        {restaurant.rating_count > 0 && (
          <View style={styles.categoriesCard}>
            <Text style={styles.sectionTitle}>Kategorien</Text>

            <CategoryRow label="Service" value={restaurant.avg_service} />
            <CategoryRow label="Ski Haserl Alarm" value={restaurant.avg_ski_haserl} />
            <CategoryRow label="Essen" value={restaurant.avg_food} />
            <CategoryRow label="Sonnenterrasse" value={restaurant.avg_sun_terrace} />
            <CategoryRow label="Einrichtung & Toiletten" value={restaurant.avg_interior} />
            <CategoryRow label="Après-Ski" value={restaurant.avg_apres_ski} />

            {/* Eggnog Status */}
            <View style={styles.eggnog}>
              <Text style={styles.eggnogLabel}>🥚🥛 Eierlikör:</Text>
              <Text style={styles.eggnogValue}>
                {restaurant.eggnog_percentage >= 0.5 ? 'Ja' : 'Nein'} ({Math.round(restaurant.eggnog_percentage * 100)}%)
              </Text>
            </View>

            {/* Schirmbar Status */}
            <View style={styles.eggnog}>
              <Text style={styles.eggnogLabel}>🍹 Schirmbar:</Text>
              <Text style={styles.eggnogValue}>
                {restaurant.schirmbar_percentage >= 0.5 ? 'Ja' : 'Nein'} ({Math.round(restaurant.schirmbar_percentage * 100)}%)
              </Text>
            </View>
          </View>
        )}

        {/* Rate Button */}
        <TouchableOpacity
          style={styles.rateButton}
          onPress={() => {
            navigation.navigate('Rating', { restaurantId });
          }}
        >
          <Text style={styles.rateButtonText}>
            {userRating ? '✏️ Bewertung ändern' : '⭐ Jetzt bewerten'}
          </Text>
        </TouchableOpacity>

        {/* Comments Section */}
        {allRatings.filter(r => r.comment).length > 0 && (
          <View style={styles.commentsCard}>
            <Text style={styles.sectionTitle}>Kommentare</Text>
            {allRatings
              .filter(r => r.comment)
              .map(rating => (
                <CommentItem key={rating.id} rating={rating} deviceId={deviceId} />
              ))}
          </View>
        )}

        {/* Photos Section */}
        {photos.length > 0 && (
          <View style={styles.photosCard}>
            <Text style={styles.sectionTitle}>Fotos ({photos.length})</Text>
            <View style={styles.photoGrid}>
              {photos.slice(0, 3).map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.photoGridItemContainer}
                  onPress={() => {
                    setSelectedPhotoIndex(index);
                    setImageViewerVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: getPhotoUrl(item.storage_path) }}
                    style={styles.photoGridItem}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {photos.length > 3 && (
              <TouchableOpacity
                style={styles.showAllButton}
                onPress={() => {
                  setSelectedPhotoIndex(0);
                  setImageViewerVisible(true);
                }}
              >
                <Text style={styles.showAllButtonText}>
                  Alle {photos.length} Fotos anzeigen
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setImageViewerVisible(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Image Gallery */}
          {selectedPhotoIndex !== null && Platform.OS === 'web' && (
            <>
              <View style={styles.imageViewerPage}>
                <Image
                  source={{ uri: getPhotoUrl(photos[selectedPhotoIndex].storage_path) }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              </View>

              {selectedPhotoIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navArrow, styles.navArrowLeft]}
                  onPress={() => setSelectedPhotoIndex(selectedPhotoIndex - 1)}
                >
                  <Text style={styles.navArrowText}>{'<'}</Text>
                </TouchableOpacity>
              )}
              {selectedPhotoIndex < photos.length - 1 && (
                <TouchableOpacity
                  style={[styles.navArrow, styles.navArrowRight]}
                  onPress={() => setSelectedPhotoIndex(selectedPhotoIndex + 1)}
                >
                  <Text style={styles.navArrowText}>{'>'}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {selectedPhotoIndex !== null && Platform.OS !== 'web' && (
            <FlatList
              ref={flatListRef}
              data={photos}
              horizontal
              pagingEnabled
              initialScrollIndex={selectedPhotoIndex}
              getItemLayout={(data, index) => ({
                length: Dimensions.get('window').width,
                offset: Dimensions.get('window').width * index,
                index,
              })}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.imageViewerPage}>
                  <Image
                    source={{ uri: getPhotoUrl(item.storage_path) }}
                    style={styles.fullscreenImage}
                    resizeMode="contain"
                  />
                </View>
              )}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(
                  event.nativeEvent.contentOffset.x / Dimensions.get('window').width
                );
                setSelectedPhotoIndex(newIndex);
              }}
            />
          )}

          {/* Like Button */}
          {selectedPhotoIndex !== null && (
            <TouchableOpacity
              style={[
                styles.likeButton,
                likedPhotos.has(photos[selectedPhotoIndex]?.id) && styles.likeButtonActive,
              ]}
              onPress={handlePhotoLike}
              disabled={likingInProgress}
            >
              <Text style={styles.likeButtonText}>
                {likedPhotos.has(photos[selectedPhotoIndex]?.id) ? '❤️' : '🤍'}{' '}
                {photos[selectedPhotoIndex]?.like_count ?? 0}
              </Text>
            </TouchableOpacity>
          )}

          {/* Photo Counter */}
          {selectedPhotoIndex !== null && (
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>
                {selectedPhotoIndex + 1} / {photos.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

interface CategoryRowProps {
  label: string;
  value: number;
}

function HalfStar() {
  return (
    <View style={styles.halfStarContainer}>
      <Text style={styles.starBase}>☆</Text>
      <View style={styles.halfStarMask}>
        <Text style={styles.starFilled}>★</Text>
      </View>
    </View>
  );
}

function CategoryRow({ label, value }: CategoryRowProps) {
  const stars = Math.round(value * 2) / 2; // Round to nearest 0.5
  const fullStars = Math.floor(stars);
  const hasHalfStar = stars % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={styles.categoryRow}>
      <Text style={styles.categoryLabel}>{label}</Text>
      <View style={styles.categoryStars}>
        <View style={styles.starsRow}>
          {[...Array(fullStars)].map((_, i) => (
            <Text key={`full-${i}`} style={styles.starFilled}>★</Text>
          ))}
          {hasHalfStar && <HalfStar />}
          {[...Array(emptyStars)].map((_, i) => (
            <Text key={`empty-${i}`} style={styles.starEmpty}>☆</Text>
          ))}
        </View>
        <Text style={styles.categoryValue}>{value.toFixed(1)}</Text>
      </View>
    </View>
  );
}

interface CommentItemProps {
  rating: Rating;
  deviceId: string | null;
}

function CommentItem({ rating, deviceId }: CommentItemProps) {
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVoteData();
  }, [rating.id, deviceId]);

  const loadVoteData = async () => {
    try {
      const count = await getCommentVoteCount(rating.id);
      setVoteCount(count);

      if (deviceId) {
        const voted = await hasUserVoted(rating.id, deviceId);
        setHasVoted(voted);
      }
    } catch (error) {
      console.error('Error loading vote data:', error);
    }
  };

  const handleVote = async () => {
    if (!deviceId) {
      Alert.alert('Fehler', 'Device ID nicht verfügbar');
      return;
    }

    try {
      setLoading(true);
      const added = await toggleCommentVote(rating.id, deviceId);

      // Update local state
      setHasVoted(added);
      setVoteCount(prev => added ? prev + 1 : prev - 1);
    } catch (error: any) {
      console.error('Error toggling vote:', error);
      Alert.alert('Fehler', 'Vote konnte nicht gespeichert werden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.commentItem}>
      <Text style={styles.commentText}>{rating.comment}</Text>
      <View style={styles.commentFooter}>
        <Text style={styles.commentDate}>
          {new Date(rating.created_at).toLocaleDateString('de-DE')}
        </Text>
        <TouchableOpacity
          style={[styles.helpfulButton, hasVoted && styles.helpfulButtonActive]}
          onPress={handleVote}
          disabled={loading}
        >
          <Text style={[styles.helpfulText, hasVoted && styles.helpfulTextActive]}>
            {hasVoted ? '✓ ' : ''}👍 Hilfreich ({voteCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  emojis: {
    fontSize: 32,
    marginBottom: 16,
  },
  scoreContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  serviceInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  serviceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  ratingCount: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  categoriesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  categoryStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  starFilled: {
    fontSize: 16,
    color: '#FBBF24',
  },
  starEmpty: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  starBase: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  halfStarContainer: {
    position: 'relative',
    width: 16,
    height: 20,
  },
  halfStarMask: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '50%',
    overflow: 'hidden',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 35,
    textAlign: 'right',
  },
  eggnog: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  eggnogLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  eggnogValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rateButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  commentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  commentText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 8,
  },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  helpfulButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  helpfulButtonActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  helpfulText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  helpfulTextActive: {
    color: '#10B981',
  },
  photosCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 0,
  },
  photoGridItemContainer: {
    flex: 1,
    aspectRatio: 1,
  },
  photoGridItem: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  showAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  showAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  imageViewerPage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  photoCounter: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  photoCounterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  likeButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  likeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navArrowLeft: {
    left: 16,
  },
  navArrowRight: {
    right: 16,
  },
  navArrowText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
});
