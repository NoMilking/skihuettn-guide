import React, { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RestaurantStats, SkiArea } from '../types';
import { getScoreColor, getScoreBackgroundColor } from '../logic/color';
import { getSelfServiceLabel } from '../logic/scoring';
import { RootStackParamList } from '../navigation/RootNavigator';
import { supabase } from '../api/supabase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SortKey = 'avg_total_score' | 'avg_service' | 'avg_ski_haserl' | 'avg_food' | 'avg_sun_terrace' | 'avg_interior' | 'avg_apres_ski';

interface Props {
  restaurants: RestaurantStats[];
  skiArea: SkiArea | null;
}

interface MapPinProps {
  restaurant: RestaurantStats;
  onPress: () => void;
  x: number;
  y: number;
  rank?: number;
  isGrayedOut: boolean;
  zoomLevel: number;
}

const MapPin = memo(function MapPin({ restaurant, onPress, x, y, rank, isGrayedOut, zoomLevel }: MapPinProps) {
  const color = isGrayedOut
    ? '#6B7280'
    : getScoreColor(restaurant.avg_total_score, restaurant.rating_count);

  // On native: sqrt for gentler scaling (ScrollView also scales content)
  // On web: fourth root for even gentler scaling (no container zoom multiplier)
  const inverseScale = Platform.OS === 'web'
    ? 1 / Math.pow(zoomLevel, 0.25)
    : 1 / Math.sqrt(zoomLevel);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pin, { left: x - 8, top: y - 8 }]}
    >
      <View style={[
        styles.hutIcon,
        {
          opacity: isGrayedOut ? 0.5 : 1,
          transform: [{ scale: inverseScale }]
        }
      ]}>
        {/* Black outline roof (slightly larger) */}
        <View style={styles.hutRoofOutline} />
        {/* Colored roof */}
        <View style={[styles.hutRoof, { borderBottomColor: color }]} />
        {/* Colored body with black border */}
        <View style={[styles.hutBody, { backgroundColor: color }]}>
          {rank !== undefined && !isGrayedOut && (
            <Text style={styles.hutRank}>{rank}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

interface MapPopupProps {
  restaurant: RestaurantStats;
  onClose: () => void;
  onNavigate: () => void;
  highlightKey: SortKey;
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

const CategoryBars = memo(function CategoryBars({ stats, highlightKey }: { stats: RestaurantStats; highlightKey: SortKey }) {
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

function MapPopup({ restaurant, onClose, onNavigate, highlightKey }: MapPopupProps) {
  const scoreColor = getScoreColor(restaurant.avg_total_score, restaurant.rating_count);
  const scoreBgColor = getScoreBackgroundColor(restaurant.avg_total_score, restaurant.rating_count);
  const serviceLabel = restaurant.most_common_self_service !== null
    ? getSelfServiceLabel(restaurant.most_common_self_service)
    : 'Keine Bewertungen';
  const hasEggnog = restaurant.eggnog_percentage >= 0.5;

  return (
    <View style={styles.popupOverlay}>
      <TouchableOpacity style={styles.popupBackdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.popup}>
        <TouchableOpacity onPress={onNavigate} style={styles.popupContent}>
          <View style={styles.infoColumn}>
            <Text style={styles.popupName}>{restaurant.name}</Text>
            <Text style={styles.popupService}>{serviceLabel}</Text>
            {restaurant.rating_count > 0 && (
              <Text style={styles.popupEggnog}>
                🥚🥛 {hasEggnog ? 'Eierlikör' : 'Kein Eierlikör'}
              </Text>
            )}
            <Text style={styles.popupRatings}>
              {restaurant.rating_count} {restaurant.rating_count === 1 ? 'Bewertung' : 'Bewertungen'}
            </Text>
          </View>
          <View style={[styles.popupScoreContainer, { backgroundColor: scoreBgColor }]}>
            <Text style={[styles.popupScore, { color: scoreColor }]}>
              {restaurant.avg_total_score.toFixed(1)}
            </Text>
          </View>
          <CategoryBars stats={restaurant} highlightKey={highlightKey} />
        </TouchableOpacity>
        <Text style={styles.popupHint}>Antippen für Details →</Text>
      </View>
    </View>
  );
}

export default function RestaurantMapTab({ restaurants, skiArea }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { width: screenWidth } = useWindowDimensions();
  const [showPins, setShowPins] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantStats | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [sortBy, setSortBy] = useState<SortKey>('avg_total_score');
  const [onlyService, setOnlyService] = useState(false);
  const [onlyEggnog, setOnlyEggnog] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const webMapRef = useRef<View>(null);
  const pinchRef = useRef<{ initialDistance: number; initialZoom: number; centerX: number; centerY: number } | null>(null);

  // Web: Pinch-to-zoom via touch events, zoom centered on pinch point
  useEffect(() => {
    if (Platform.OS !== 'web' || !webMapRef.current) return;
    const element = webMapRef.current as unknown as HTMLElement;

    const getDistance = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const getCenter = (t1: Touch, t2: Touch) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const center = getCenter(e.touches[0], e.touches[1]);
        const rect = element.getBoundingClientRect();
        pinchRef.current = {
          initialDistance: getDistance(e.touches[0], e.touches[1]),
          initialZoom: zoomLevel,
          // Point on map under the pinch center
          centerX: element.scrollLeft + (center.x - rect.left),
          centerY: element.scrollTop + (center.y - rect.top),
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / pinchRef.current.initialDistance;
        const newZoom = Math.min(5, Math.max(1, pinchRef.current.initialZoom * scale));

        // Adjust scroll so pinch center stays in place
        const center = getCenter(e.touches[0], e.touches[1]);
        const rect = element.getBoundingClientRect();
        const zoomRatio = newZoom / pinchRef.current.initialZoom;
        const newScrollX = pinchRef.current.centerX * zoomRatio - (center.x - rect.left);
        const newScrollY = pinchRef.current.centerY * zoomRatio - (center.y - rect.top);

        setZoomLevel(newZoom);

        // Apply scroll after React re-render
        requestAnimationFrame(() => {
          element.scrollLeft = newScrollX;
          element.scrollTop = newScrollY;
        });
      }
    };

    const handleTouchEnd = () => {
      pinchRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  });

  const mapUrl = skiArea?.map_image
    ? supabase.storage.from('maps').getPublicUrl(skiArea.map_image).data.publicUrl
    : null;

  const rankingMap = useMemo(() => {
    const filtered = restaurants.filter(r => {
      if (r.rating_count === 0) return false;
      if (onlyService && r.most_common_self_service !== 0) return false;
      if (onlyEggnog && r.eggnog_percentage < 0.5) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
    const map = new Map<string, number>();
    sorted.forEach((r, i) => map.set(r.restaurant_id, i + 1));
    return map;
  }, [restaurants, sortBy, onlyService, onlyEggnog]);

  const isGrayedOut = useCallback((r: RestaurantStats) => {
    if (r.rating_count === 0) return true;
    if (onlyService && r.most_common_self_service !== 0) return true;
    if (onlyEggnog && r.eggnog_percentage < 0.5) return true;
    return false;
  }, [onlyService, onlyEggnog]);

  const handlePinPress = useCallback((restaurant: RestaurantStats) => {
    setSelectedRestaurant(restaurant);
  }, []);

  const handleNavigateToDetail = useCallback(() => {
    if (selectedRestaurant) {
      navigation.navigate('RestaurantDetail', {
        restaurantId: selectedRestaurant.restaurant_id,
      });
      setSelectedRestaurant(null);
    }
  }, [selectedRestaurant, navigation]);

  if (!mapUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>🗺️</Text>
          <Text style={styles.placeholderTitle}>Kein Pistenplan</Text>
          <Text style={styles.placeholderText}>
            Für dieses Skigebiet ist noch{'\n'}
            kein Pistenplan verfügbar
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Switch
          value={showPins}
          onValueChange={setShowPins}
          trackColor={{ false: '#D1D5DB', true: '#10B981' }}
          thumbColor="#FFFFFF"
        />
        <Text style={styles.headerTitle}>Ski Hüttn Guide</Text>
      </View>

      {/* Filter Panel */}
      <View style={styles.filterPanel}>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Sortieren nach:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipGroup}>
              <SortChip label="Gesamtscore" active={sortBy === 'avg_total_score'} onPress={() => setSortBy('avg_total_score')} />
              <SortChip label="🛎️ Service" active={sortBy === 'avg_service'} onPress={() => setSortBy('avg_service')} />
              <SortChip label="💃 Ski-Haserl" active={sortBy === 'avg_ski_haserl'} onPress={() => setSortBy('avg_ski_haserl')} />
              <SortChip label="🍽️ Essen" active={sortBy === 'avg_food'} onPress={() => setSortBy('avg_food')} />
              <SortChip label="☀️ Terrasse" active={sortBy === 'avg_sun_terrace'} onPress={() => setSortBy('avg_sun_terrace')} />
              <SortChip label="🛖 Einrichtung" active={sortBy === 'avg_interior'} onPress={() => setSortBy('avg_interior')} />
              <SortChip label="🍾 Après-Ski" active={sortBy === 'avg_apres_ski'} onPress={() => setSortBy('avg_apres_ski')} />
            </View>
          </ScrollView>
        </View>

        <View style={styles.checkboxRowContainer}>
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setOnlyService(!onlyService)}>
            <View style={[styles.checkbox, onlyService && styles.checkboxChecked]}>
              {onlyService && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Mit Bedienung</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setOnlyEggnog(!onlyEggnog)}>
            <View style={[styles.checkbox, onlyEggnog && styles.checkboxChecked]}>
              {onlyEggnog && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>🥚🥛 Eierlikör</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map with Zoom */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          /* Web: physically resize content, native scroll for panning */
          <View
            ref={webMapRef}
            style={{
              flex: 1,
              overflow: 'auto',
              touchAction: 'pan-x pan-y',
            } as any}
          >
            <View style={{
              width: (imageSize.width || screenWidth) * zoomLevel,
              height: (imageSize.height || screenWidth * 0.707) * zoomLevel,
            }}>
              <Image
                source={{ uri: mapUrl }}
                style={{
                  width: (imageSize.width || screenWidth) * zoomLevel,
                  height: (imageSize.height || screenWidth * 0.707) * zoomLevel,
                }}
                contentFit="contain"
                onLoad={(e) => {
                  const { width, height } = e.source;
                  const aspectRatio = height / width;
                  setImageSize({
                    width: screenWidth,
                    height: screenWidth * aspectRatio,
                  });
                }}
              />

              {showPins && imageSize.width > 0 && (
                <View style={[StyleSheet.absoluteFill, {
                  width: (imageSize.width) * zoomLevel,
                  height: (imageSize.height) * zoomLevel,
                }]}>
                  {restaurants.map((r) => (
                    <MapPin
                      key={r.restaurant_id}
                      restaurant={r}
                      x={r.x * imageSize.width * zoomLevel}
                      y={r.y * imageSize.height * zoomLevel}
                      onPress={() => handlePinPress(r)}
                      isGrayedOut={isGrayedOut(r)}
                      rank={rankingMap.get(r.restaurant_id)}
                      zoomLevel={zoomLevel}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Native: ScrollView with built-in zoom */
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            maximumZoomScale={10}
            minimumZoomScale={1}
            bouncesZoom={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              const newZoom = e.nativeEvent.zoomScale || 1;
              if (Math.abs(newZoom - zoomLevel) > 0.05) {
                setZoomLevel(newZoom);
              }
            }}
            scrollEventThrottle={16}
          >
            <View>
              <Image
                source={{ uri: mapUrl }}
                style={{ width: imageSize.width || screenWidth, height: imageSize.height || screenWidth * 0.707 }}
                contentFit="contain"
                onLoad={(e) => {
                  const { width, height } = e.source;
                  const aspectRatio = height / width;
                  setImageSize({
                    width: screenWidth,
                    height: screenWidth * aspectRatio,
                  });
                }}
              />

              {showPins && imageSize.width > 0 && (
                <View style={[StyleSheet.absoluteFill, { width: imageSize.width, height: imageSize.height }]}>
                  {restaurants.map((r) => (
                    <MapPin
                      key={r.restaurant_id}
                      restaurant={r}
                      x={r.x * imageSize.width}
                      y={r.y * imageSize.height}
                      onPress={() => handlePinPress(r)}
                      isGrayedOut={isGrayedOut(r)}
                      rank={rankingMap.get(r.restaurant_id)}
                      zoomLevel={zoomLevel}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {selectedRestaurant && (
          <MapPopup
            restaurant={selectedRestaurant}
            onClose={() => setSelectedRestaurant(null)}
            onNavigate={handleNavigateToDetail}
            highlightKey={sortBy}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
  checkboxRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#374151',
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
  },
  hutIcon: {
    alignItems: 'center',
  },
  hutRoofOutline: {
    position: 'absolute',
    top: -1,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#000000',
  },
  hutRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  hutBody: {
    width: 12,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    marginTop: -1,
  },
  hutRank: {
    fontSize: 7,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  popupBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  popupContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoColumn: {
    flex: 1,
    marginRight: 8,
  },
  popupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  popupService: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  popupEggnog: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  popupRatings: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  popupScoreContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 54,
    alignItems: 'center',
    marginRight: 8,
  },
  popupScore: {
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
  barFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  categoryValue: {
    fontSize: 9,
    color: '#6B7280',
    width: 20,
    textAlign: 'right',
  },
  barContainerHighlighted: {
    height: 8,
  },
  barFillHighlighted: {
    backgroundColor: '#059669',
  },
  categoryValueHighlighted: {
    fontWeight: '700',
    color: '#111827',
  },
  popupHint: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});
