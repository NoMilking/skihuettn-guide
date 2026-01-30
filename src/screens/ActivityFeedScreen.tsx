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
import { getActivityFeed, ActivityFeedItem } from '../api/activityFeed';
import { useDevice } from '../hooks/useDevice';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ActivityFeedScreen() {
  const { deviceId } = useDevice();
  const navigation = useNavigation<NavigationProp>();
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (deviceId) {
        loadFeed();
      }
    }, [deviceId])
  );

  const loadFeed = async () => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const feed = await getActivityFeed(deviceId);
      setItems(feed);
    } catch (error) {
      console.error('Error loading activity feed:', error);
      Alert.alert('Fehler', 'Aktivitaeten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const time = date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${day} um ${time} Uhr`;
  };

  const renderItem = ({ item }: { item: ActivityFeedItem }) => {
    const icon = item.type === 'vote' ? '💬' : '❤️';
    const description =
      item.type === 'vote'
        ? 'Kommentar als hilfreich bewertet'
        : 'Foto geliked';

    return (
      <TouchableOpacity
        style={styles.feedItem}
        onPress={() =>
          navigation.navigate('RestaurantDetail', { restaurantId: item.restaurantId })
        }
      >
        <Text style={styles.feedIcon}>{icon}</Text>
        <View style={styles.feedContent}>
          <Text style={styles.feedDescription}>
            {description} bei{' '}
            <Text style={styles.restaurantName}>{item.restaurantName}</Text>
          </Text>
          <Text style={styles.feedDate}>{formatDateTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Lade Aktivitaeten...</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>Keine Aktivitaeten</Text>
        <Text style={styles.emptyText}>
          Noch keine Votes oder Likes erhalten
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${item.createdAt}-${index}`}
        contentContainerStyle={styles.listContent}
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
  feedItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  feedIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  feedContent: {
    flex: 1,
  },
  feedDescription: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  restaurantName: {
    fontWeight: '700',
    color: '#111827',
  },
  feedDate: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
