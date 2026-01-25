import React, { useState, useEffect, useCallback } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getFavorites, toggleFavorite } from '../api/favorites';
import { useDevice } from '../hooks/useDevice';
import { SkiArea } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MySkiAreasScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { deviceId } = useDevice();
  const [favorites, setFavorites] = useState<SkiArea[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload favorites when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (deviceId) {
        loadFavorites();
      }
    }, [deviceId])
  );

  const loadFavorites = async () => {
    if (!deviceId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const favs = await getFavorites(deviceId);
      setFavorites(favs);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Fehler', 'Favoriten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (skiAreaId: string) => {
    if (!deviceId) return;

    try {
      await toggleFavorite(skiAreaId, deviceId);
      setFavorites(prev => prev.filter(area => area.id !== skiAreaId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Fehler', 'Favorit konnte nicht entfernt werden.');
    }
  };

  const renderFavorite = ({ item }: { item: SkiArea }) => (
    <TouchableOpacity
      style={styles.favoriteItem}
      onPress={() => {
        navigation.navigate('SkiAreaDetail', { skiAreaId: item.id });
      }}
    >
      <View style={styles.favoriteInfo}>
        <Text style={styles.flagEmoji}>{item.flag_emoji}</Text>
        <Text style={styles.favoriteName}>{item.name}</Text>
      </View>

      <TouchableOpacity
        onPress={() => handleRemoveFavorite(item.id)}
        style={styles.removeButton}
      >
        <Text style={styles.removeIcon}>★</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Lade Favoriten...</Text>
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

  if (favorites.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>⭐</Text>
        <Text style={styles.emptyTitle}>Keine Favoriten</Text>
        <Text style={styles.emptyText}>
          Markiere deine Lieblings-Skigebiete{'\n'}
          mit dem Stern-Symbol
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={renderFavorite}
        keyExtractor={item => item.id}
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
  favoriteItem: {
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
  favoriteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  removeButton: {
    padding: 8,
  },
  removeIcon: {
    fontSize: 28,
    color: '#F59E0B',
  },
});
