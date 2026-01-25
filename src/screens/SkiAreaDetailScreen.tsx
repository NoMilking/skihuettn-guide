import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { getRestaurantsBySkiArea } from '../api/restaurants';
import { getSkiAreaById } from '../api/skiAreas';
import { RestaurantStats, SkiArea } from '../types';
import RestaurantListTab from '../components/RestaurantListTab';
import RestaurantMapTab from '../components/RestaurantMapTab';

interface Props {
  route: {
    params: {
      skiAreaId: string;
    };
  };
}

export default function SkiAreaDetailScreen({ route }: Props) {
  const { skiAreaId } = route.params;
  const layout = useWindowDimensions();

  const [skiArea, setSkiArea] = useState<SkiArea | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'list', title: 'Liste' },
    { key: 'map', title: 'Karte' },
  ]);

  // Reload data when screen comes into focus (e.g., after returning from restaurant detail)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [skiAreaId])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [areaData, restaurantData] = await Promise.all([
        getSkiAreaById(skiAreaId),
        getRestaurantsBySkiArea(skiAreaId),
      ]);
      setSkiArea(areaData);
      setRestaurants(restaurantData);
    } catch (error) {
      console.error('Error loading ski area:', error);
      Alert.alert('Fehler', 'Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const renderScene = SceneMap({
    list: () => <RestaurantListTab restaurants={restaurants} />,
    map: () => <RestaurantMapTab restaurants={restaurants} skiArea={skiArea} />,
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Lade Hütten...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={styles.tabIndicator}
            style={styles.tabBar}
            activeColor="#10B981"
            inactiveColor="#6B7280"
          />
        )}
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabIndicator: {
    backgroundColor: '#10B981',
    height: 3,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'none',
  },
});
