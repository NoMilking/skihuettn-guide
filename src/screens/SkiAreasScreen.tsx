import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getSkiAreas } from '../api/skiAreas';
import { toggleFavorite, isFavorite } from '../api/favorites';
import { useDevice } from '../hooks/useDevice';
import { SkiArea } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SkiAreasScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { deviceId } = useDevice();
  const [skiAreas, setSkiAreas] = useState<SkiArea[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<SkiArea[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load ski areas on mount
  useEffect(() => {
    loadSkiAreas();
  }, []);

  // Load favorites when deviceId or skiAreas change
  useEffect(() => {
    if (deviceId && skiAreas.length > 0) {
      loadFavorites();
    }
  }, [deviceId, skiAreas]);

  // Filter ski areas when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAreas(skiAreas);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = skiAreas.filter(area =>
        area.name.toLowerCase().includes(query)
      );
      setFilteredAreas(filtered);
    }
  }, [searchQuery, skiAreas]);

  const loadSkiAreas = async () => {
    try {
      setLoading(true);
      const areas = await getSkiAreas();
      setSkiAreas(areas);
      setFilteredAreas(areas);
    } catch (error) {
      console.error('Error loading ski areas:', error);
      Alert.alert('Fehler', 'Skigebiete konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!deviceId) return;

    try {
      const favSet = new Set<string>();
      for (const area of skiAreas) {
        const isFav = await isFavorite(area.id, deviceId);
        if (isFav) {
          favSet.add(area.id);
        }
      }
      setFavorites(favSet);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleToggleFavorite = async (skiAreaId: string) => {
    if (!deviceId) {
      Alert.alert('Fehler', 'Device ID nicht verfügbar');
      return;
    }

    try {
      const isNowFavorite = await toggleFavorite(skiAreaId, deviceId);

      setFavorites(prev => {
        const newSet = new Set(prev);
        if (isNowFavorite) {
          newSet.add(skiAreaId);
        } else {
          newSet.delete(skiAreaId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Fehler', 'Favorit konnte nicht gespeichert werden.');
    }
  };

  const renderSkiArea = ({ item }: { item: SkiArea }) => {
    const isFav = favorites.has(item.id);

    return (
      <TouchableOpacity
        style={styles.skiAreaItem}
        onPress={() => {
          navigation.navigate('SkiAreaDetail', { skiAreaId: item.id });
        }}
      >
        <View style={styles.skiAreaInfo}>
          <Text style={styles.flagEmoji}>{item.flag_emoji}</Text>
          <Text style={styles.skiAreaName}>{item.name}</Text>
        </View>

        <TouchableOpacity
          onPress={() => handleToggleFavorite(item.id)}
          style={styles.favoriteButton}
        >
          <Text style={styles.favoriteIcon}>{isFav ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Lade Skigebiete...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Skigebiet suchen..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Ski Areas List */}
      {filteredAreas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Keine Skigebiete gefunden' : 'Keine Skigebiete vorhanden'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAreas}
          renderItem={renderSkiArea}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    padding: 16,
  },
  skiAreaItem: {
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
  skiAreaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  skiAreaName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    fontSize: 28,
    color: '#F59E0B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
