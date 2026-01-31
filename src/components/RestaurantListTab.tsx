import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RestaurantStats } from '../types';
import { getScoreColor, getScoreBackgroundColor } from '../logic/color';
import { getSelfServiceLabel } from '../logic/scoring';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  restaurants: RestaurantStats[];
}

export default function RestaurantListTab({ restaurants }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const [sortBy, setSortBy] = useState<keyof RestaurantStats>('avg_total_score');
  const [onlyService, setOnlyService] = useState(false);
  const [onlyEggnog, setOnlyEggnog] = useState(false);
  const [onlySchirmbar, setOnlySchirmbar] = useState(false);

  // Filter and sort restaurants (memoized)
  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter(r => {
        if (onlyService && r.most_common_self_service !== 0) return false;
        if (onlyEggnog && r.eggnog_percentage < 0.5) return false;
        if (onlySchirmbar && r.schirmbar_percentage < 0.5) return false;
        return true;
      })
      .sort((a, b) => {
        // Unbewertete Hütten (rating_count = 0) immer ganz unten
        if (a.rating_count === 0 && b.rating_count !== 0) return 1;
        if (a.rating_count !== 0 && b.rating_count === 0) return -1;

        // Normale Sortierung nach ausgewähltem Kriterium
        const aValue = a[sortBy] as number;
        const bValue = b[sortBy] as number;
        return bValue - aValue; // Descending
      });
  }, [restaurants, onlyService, onlyEggnog, onlySchirmbar, sortBy]);

  const handleNavigate = useCallback((restaurantId: string) => {
    navigation.navigate('RestaurantDetail', { restaurantId });
  }, [navigation]);

  const renderRestaurant = useCallback(({ item }: { item: RestaurantStats }) => {
    const scoreColor = getScoreColor(item.avg_total_score, item.rating_count);
    const scoreBgColor = getScoreBackgroundColor(item.avg_total_score, item.rating_count);
    const serviceLabel = item.most_common_self_service !== null
      ? getSelfServiceLabel(item.most_common_self_service)
      : 'Keine Bewertungen';
    const hasEggnog = item.eggnog_percentage >= 0.5;
    const hasSchirmbar = item.schirmbar_percentage >= 0.5;

    return (
      <TouchableOpacity
        style={styles.restaurantItem}
        onPress={() => handleNavigate(item.restaurant_id)}
      >
        {/* Info Column (left) */}
        <View style={styles.infoColumn}>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <Text style={styles.serviceInfo}>{serviceLabel}</Text>
          {item.rating_count > 0 && (
            <Text style={styles.eggnogInfo}>
              🥚🥛 {hasEggnog ? 'Eierlikör' : 'Kein Eierlikör'}
            </Text>
          )}
          {item.rating_count > 0 && (
            <Text style={styles.eggnogInfo}>
              🎪 {hasSchirmbar ? 'Schirmbar' : 'Keine Schirmbar'}
            </Text>
          )}
          <Text style={styles.ratingCount}>
            {item.rating_count} {item.rating_count === 1 ? 'Bewertung' : 'Bewertungen'}
          </Text>
        </View>

        {/* Score Column (middle) */}
        <View style={[styles.scoreContainer, { backgroundColor: scoreBgColor }]}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>
            {item.avg_total_score.toFixed(1)}
          </Text>
        </View>

        {/* Category Bars Column (right) */}
        <CategoryBars stats={item} highlightKey={sortBy} />
      </TouchableOpacity>
    );
  }, [handleNavigate, sortBy]);

  return (
    <View style={styles.container}>
      {/* Filter Panel */}
      <View style={styles.filterPanel}>
          {/* Sortierung */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sortieren nach:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipGroup}>
                <SortChip
                  label="Gesamtscore"
                  active={sortBy === 'avg_total_score'}
                  onPress={() => setSortBy('avg_total_score')}
                />
                <SortChip
                  label="🛎️ Service"
                  active={sortBy === 'avg_service'}
                  onPress={() => setSortBy('avg_service')}
                />
                <SortChip
                  label="💃 Ski-Haserl"
                  active={sortBy === 'avg_ski_haserl'}
                  onPress={() => setSortBy('avg_ski_haserl')}
                />
                <SortChip
                  label="🍽️ Essen"
                  active={sortBy === 'avg_food'}
                  onPress={() => setSortBy('avg_food')}
                />
                <SortChip
                  label="☀️ Terrasse"
                  active={sortBy === 'avg_sun_terrace'}
                  onPress={() => setSortBy('avg_sun_terrace')}
                />
                <SortChip
                  label="🛖 Einrichtung"
                  active={sortBy === 'avg_interior'}
                  onPress={() => setSortBy('avg_interior')}
                />
                <SortChip
                  label="🍾 Après-Ski"
                  active={sortBy === 'avg_apres_ski'}
                  onPress={() => setSortBy('avg_apres_ski')}
                />
              </View>
            </ScrollView>
          </View>

          {/* Filter-Checkboxen */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.checkboxRow}>
              <TouchableOpacity style={styles.checkboxItem} onPress={() => setOnlyService(!onlyService)}>
                <View style={[styles.checkbox, onlyService && styles.checkboxChecked]}>
                  {onlyService && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Mit Bedienung</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkboxItem} onPress={() => setOnlyEggnog(!onlyEggnog)}>
                <View style={[styles.checkbox, onlyEggnog && styles.checkboxChecked]}>
                  {onlyEggnog && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>🥚🥛 Eierlikör</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.checkboxItem} onPress={() => setOnlySchirmbar(!onlySchirmbar)}>
                <View style={[styles.checkbox, onlySchirmbar && styles.checkboxChecked]}>
                  {onlySchirmbar && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>🎪 Schirmbar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

      {/* Content: List or Empty State */}
      {filteredRestaurants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏔️</Text>
          <Text style={styles.emptyText}>Keine Hütten gefunden</Text>
          <Text style={styles.emptySubtext}>Versuche andere Filter-Einstellungen</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          renderItem={renderRestaurant}
          keyExtractor={item => item.restaurant_id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

interface SortChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const SortChip = memo(function SortChip({ label, active, onPress }: SortChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const CategoryBars = memo(function CategoryBars({ stats, highlightKey }: { stats: RestaurantStats; highlightKey: keyof RestaurantStats }) {
  if (stats.rating_count === 0) return null;

  const categories = [
    { key: 'avg_service', emoji: '🛎️', value: stats.avg_service },
    { key: 'avg_ski_haserl', emoji: '💃', value: stats.avg_ski_haserl },
    { key: 'avg_food', emoji: '🍽️', value: stats.avg_food },
    { key: 'avg_sun_terrace', emoji: '☀️', value: stats.avg_sun_terrace },
    { key: 'avg_interior', emoji: '🛖', value: stats.avg_interior },
    { key: 'avg_apres_ski', emoji: '🍾', value: stats.avg_apres_ski },
  ];

  return (
    <View style={styles.categoryBars}>
      {categories.map((cat) => {
        const isHighlighted = cat.key === highlightKey;
        return (
          <View key={cat.key} style={styles.categoryBarRow}>
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <View style={[styles.barContainer, isHighlighted && styles.barContainerHighlighted]}>
              <View style={[
                styles.barFill,
                { width: `${(cat.value / 5) * 100}%` },
                isHighlighted && styles.barFillHighlighted
              ]} />
            </View>
            <Text style={[
              styles.categoryValue,
              isHighlighted && styles.categoryValueHighlighted
            ]}>
              {cat.value.toFixed(1)}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterToggle: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  resultCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterPanel: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: 16,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  scoreSlider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  resetButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
  },
  restaurantItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoColumn: {
    flex: 1,
    marginRight: 8,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  serviceInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  eggnogInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  ratingCount: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  scoreContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 54,
    alignItems: 'center',
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  categoryBars: {
    width: 100,
  },
  categoryBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryEmoji: {
    fontSize: 10,
    width: 16,
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginHorizontal: 4,
  },
  barContainerHighlighted: {
    height: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  barFillHighlighted: {
    backgroundColor: '#059669',
  },
  categoryValue: {
    fontSize: 9,
    color: '#6B7280',
    width: 20,
    textAlign: 'right',
  },
  categoryValueHighlighted: {
    fontWeight: '700',
    color: '#111827',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
