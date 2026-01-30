import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getRatingsByDeviceWithRestaurants, getTotalCommentVotes } from '../api/ratings';
import { getTotalPhotoLikes } from '../api/photos';
import { useDevice } from '../hooks/useDevice';
import { calculateTotalScore } from '../logic/scoring';
import { getScoreColor, getScoreBackgroundColor } from '../logic/color';
import { Rating } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RatingWithRestaurant extends Rating {
  restaurants?: {
    id: string;
    name: string;
    ski_area_id: string;
  };
}

export default function MyRatingsScreen() {
  const { deviceId } = useDevice();
  const navigation = useNavigation<NavigationProp>();
  const [ratings, setRatings] = useState<RatingWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ commentVotes: 0, photoLikes: 0 });

  // Reload ratings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (deviceId) {
        loadRatings();
      }
    }, [deviceId])
  );

  const loadRatings = async () => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [userRatings, commentVotes, photoLikes] = await Promise.all([
        getRatingsByDeviceWithRestaurants(deviceId),
        getTotalCommentVotes(deviceId),
        getTotalPhotoLikes(deviceId),
      ]);
      setRatings(userRatings);
      setStats({ commentVotes, photoLikes });
    } catch (error) {
      console.error('Error loading ratings:', error);
      Alert.alert('Fehler', 'Bewertungen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderRating = ({ item }: { item: RatingWithRestaurant }) => {
    const totalScore = calculateTotalScore(item);
    const scoreColor = getScoreColor(totalScore);
    const scoreBgColor = getScoreBackgroundColor(totalScore);
    const restaurantName = item.restaurants?.name || 'Unbekannte Hütte';

    return (
      <TouchableOpacity
        style={styles.ratingItem}
        onPress={() => {
          navigation.navigate('RestaurantDetail', { restaurantId: item.restaurant_id });
        }}
      >
        <View style={styles.ratingContent}>
          {/* Restaurant Name */}
          <Text style={styles.restaurantName}>
            {restaurantName}
          </Text>

          {/* Date */}
          <Text style={styles.ratingDate}>
            Bewertet am {formatDate(item.created_at)}
          </Text>

          {/* Updated badge */}
          {item.updated_at !== item.created_at && (
            <Text style={styles.updatedBadge}>
              ✏️ Bearbeitet am {formatDate(item.updated_at)}
            </Text>
          )}

          {/* Comment preview (if exists) */}
          {item.comment && (
            <Text style={styles.commentPreview} numberOfLines={2}>
              "{item.comment}"
            </Text>
          )}
        </View>

        {/* Score Display */}
        <View style={[styles.scoreContainer, { backgroundColor: scoreBgColor }]}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>
            {totalScore.toFixed(1)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatsHeader = () => (
    <View style={styles.statsCard}>
      <View style={styles.statColumn}>
        <Text style={styles.statValue}>{ratings.length}</Text>
        <Text style={styles.statLabel}>Bewertungen</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statColumn}>
        <Text style={styles.statValue}>{stats.commentVotes}</Text>
        <Text style={styles.statLabel}>Hilfreich</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statColumn}>
        <Text style={styles.statValue}>{stats.photoLikes}</Text>
        <Text style={styles.statLabel}>Foto-Likes</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Lade Bewertungen...</Text>
      </View>
    );
  }

  if (!deviceId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Device ID nicht verfügbar</Text>
      </View>
    );
  }

  if (ratings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>Keine Bewertungen</Text>
        <Text style={styles.emptyText}>
          Du hast noch keine Hütten bewertet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ratings}
        renderItem={renderRating}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderStatsHeader}
      />
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
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    padding: 16,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
  },
  ratingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingContent: {
    flex: 1,
    marginRight: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  ratingDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  updatedBadge: {
    fontSize: 12,
    color: '#10B981',
    marginBottom: 8,
  },
  commentPreview: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 4,
  },
  scoreContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
});
