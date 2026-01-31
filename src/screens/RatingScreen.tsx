import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Rating, CreateRatingInput, UpdateRatingInput } from '../types';
import { getRestaurantById } from '../api/restaurants';
import { getUserRatingForRestaurant, createRating, updateRating, deleteRating } from '../api/ratings';
import { uploadPhoto, getPhotosByRating, deletePhoto } from '../api/photos';
import { supabase } from '../api/supabase';
import { useDevice } from '../hooks/useDevice';
import { calculateTotalScore } from '../logic/scoring';
import { getScoreColor, getScoreBackgroundColor } from '../logic/color';
import { RootStackParamList } from '../navigation/RootNavigator';
import { showAlert, showConfirm } from '../utils/alert';

interface Props {
  route: {
    params: {
      restaurantId: string;
    };
  };
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type SelfServiceValue = -20 | -10 | 0;

export default function RatingScreen({ route }: Props) {
  const { restaurantId } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const { deviceId, loading: deviceLoading } = useDevice();

  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);

  const [restaurantName, setRestaurantName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);

  // Rating state
  const [selfService, setSelfService] = useState<SelfServiceValue>(0);
  const [service, setService] = useState<number>(0);
  const [skiHaserl, setSkiHaserl] = useState<number>(0);
  const [food, setFood] = useState<number>(0);
  const [sunTerrace, setSunTerrace] = useState<number>(0);
  const [interior, setInterior] = useState<number>(0);
  const [apresSki, setApresSki] = useState<number>(0);
  const [eggnog, setEggnog] = useState<boolean>(false);
  const [schirmbar, setSchirmbar] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');
  const [photos, setPhotos] = useState<Array<{ uri: string; photoId?: string }>>([]);

  // CRITICAL: Live score calculation using useMemo
  const totalScore = useMemo(() => {
    return calculateTotalScore({
      self_service: selfService,
      service,
      ski_haserl: skiHaserl,
      food,
      sun_terrace: sunTerrace,
      interior,
      apres_ski: apresSki,
      eggnog,
    });
  }, [selfService, service, skiHaserl, food, sunTerrace, interior, apresSki, eggnog]);

  const scoreColor = useMemo(() => getScoreColor(totalScore), [totalScore]);
  const scoreBgColor = useMemo(() => getScoreBackgroundColor(totalScore), [totalScore]);

  useEffect(() => {
    loadData();
  }, [restaurantId, deviceId]);

  const loadData = async () => {
    if (!deviceId) return;

    try {
      setLoading(true);

      // Load restaurant name
      const restaurant = await getRestaurantById(restaurantId);
      setRestaurantName(restaurant.name);

      // Check if user already rated this restaurant
      const existingRating = await getUserRatingForRestaurant(restaurantId, deviceId);

      if (existingRating) {
        setIsEditing(true);
        setExistingRatingId(existingRating.id);

        // Pre-fill form with existing values
        setSelfService(existingRating.self_service);
        setService(existingRating.service);
        setSkiHaserl(existingRating.ski_haserl);
        setFood(existingRating.food);
        setSunTerrace(existingRating.sun_terrace);
        setInterior(existingRating.interior);
        setApresSki(existingRating.apres_ski);
        setEggnog(existingRating.eggnog);
        setSchirmbar(existingRating.schirmbar);
        setComment(existingRating.comment || '');

        // Load existing photos
        try {
          const existingPhotos = await getPhotosByRating(existingRating.id);
          const photoData = existingPhotos.map(p => {
            // For editing, we need the public URLs and photo IDs
            const { data } = supabase.storage.from('photos').getPublicUrl(p.storage_path);
            return { uri: data.publicUrl, photoId: p.id };
          });
          setPhotos(photoData);
        } catch (photoError) {
          console.error('Error loading photos:', photoError);
        }
      }
    } catch (error) {
      console.error('Error loading rating data:', error);
      showAlert('Fehler', 'Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    if (photos.length >= 3) {
      showAlert('Limit erreicht', 'Maximal 3 Fotos erlaubt');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        setPhotos([...photos, { uri: result.assets[0].uri }]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('Fehler', 'Foto konnte nicht ausgewählt werden.');
    }
  };

  const removePhoto = async (index: number) => {
    const photo = photos[index];

    // If photo has a photoId, it's already uploaded - delete from database
    if (photo.photoId) {
      try {
        await deletePhoto(photo.photoId);
      } catch (error) {
        console.error('Error deleting photo:', error);
        showAlert('Fehler', 'Foto konnte nicht gelöscht werden.');
        return;
      }
    }

    // Remove from local state
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!deviceId) {
      showAlert('Fehler', 'Gerät nicht identifiziert.');
      return;
    }

    try {
      setSaving(true);

      const ratingData: CreateRatingInput = {
        restaurant_id: restaurantId,
        device_id: deviceId,
        self_service: selfService,
        service,
        ski_haserl: skiHaserl,
        food,
        sun_terrace: sunTerrace,
        interior,
        apres_ski: apresSki,
        eggnog,
        schirmbar,
        comment: comment.trim() || undefined,
      };

      let ratingId = existingRatingId;

      if (isEditing) {
        const updateData: UpdateRatingInput = {
          self_service: selfService,
          service,
          ski_haserl: skiHaserl,
          food,
          sun_terrace: sunTerrace,
          interior,
          apres_ski: apresSki,
          eggnog,
          schirmbar,
          comment: comment.trim() || undefined,
        };
        await updateRating(restaurantId, deviceId, updateData);
      } else {
        const newRating = await createRating(ratingData);
        ratingId = newRating.id;
      }

      // Upload photos if any (only new local photos, not existing URLs)
      if (photos.length > 0 && ratingId) {
        try {
          // Accept both native (file://) and web (blob:, data:) URIs
          // Exclude only existing Supabase URLs (https://)
          const newPhotos = photos.filter(photo => !photo.uri.startsWith('https://'));
          if (newPhotos.length > 0) {
            await Promise.all(
              newPhotos.map(photo => uploadPhoto(ratingId!, restaurantId, photo.uri))
            );
          }
        } catch (photoError) {
          console.error('Error uploading photos:', photoError);
          showAlert(
            'Warnung',
            'Bewertung wurde gespeichert, aber einige Fotos konnten nicht hochgeladen werden.'
          );
        }
      }

      showAlert(
        'Erfolg',
        isEditing ? 'Bewertung wurde aktualisiert!' : 'Bewertung wurde gespeichert!'
      );
      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving rating:', error);
      showAlert('Fehler', error.message || 'Bewertung konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    showConfirm(
      'Bewertung löschen',
      'Bist du sicher, dass du diese Bewertung löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.',
      async () => {
        if (!deviceId) return;

        try {
          setDeleting(true);
          await deleteRating(restaurantId, deviceId);
          showAlert('Erfolg', 'Bewertung wurde gelöscht.');
          navigation.goBack();
        } catch (error: any) {
          console.error('Error deleting rating:', error);
          showAlert('Fehler', error.message || 'Bewertung konnte nicht gelöscht werden.');
        } finally {
          setDeleting(false);
        }
      }
    );
  };

  if (loading || deviceLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Lade...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* Fixed Score Display at Top */}
      <View style={[styles.scoreBox, { backgroundColor: scoreBgColor }]}>
        <Text style={styles.scoreLabel}>Gesamtscore</Text>
        <Text style={[styles.scoreValue, { color: scoreColor }]}>
          {totalScore.toFixed(1)}
        </Text>
        <Text style={styles.scoreRange}>(-20 bis +35)</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Restaurant Name */}
        <Text style={styles.restaurantName}>{restaurantName}</Text>
        <Text style={styles.subtitle}>
          {isEditing ? 'Bewertung ändern' : 'Jetzt bewerten'}
        </Text>

        {/* MANDATORY: Self-Service Radio Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service-Art (Pflichtfeld) *</Text>
          <View style={styles.radioGroup}>
            <RadioButton
              label="Nur Selbstbedienung"
              value={-20}
              selected={selfService === -20}
              onPress={() => setSelfService(-20)}
              points="-20"
            />
            <RadioButton
              label="Teilweise Bedienung"
              value={-10}
              selected={selfService === -10}
              onPress={() => setSelfService(-10)}
              points="-10"
            />
            <RadioButton
              label="Volle Bedienung"
              value={0}
              selected={selfService === 0}
              onPress={() => setSelfService(0)}
              points="0"
            />
          </View>
        </View>

        {/* OPTIONAL: Category Sliders (0-5, step 0.5) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategorien (Optional, 0-5 Sterne)</Text>

          <SliderCategory
            label="🧑‍🍳 Service"
            value={service}
            onChange={setService}
          />
          <SliderCategory
            label="💃 Ski Haserl Alarm"
            value={skiHaserl}
            onChange={setSkiHaserl}
          />
          <SliderCategory
            label="🍽️ Essen"
            value={food}
            onChange={setFood}
          />
          <SliderCategory
            label="☀️ Sonnenterrasse"
            value={sunTerrace}
            onChange={setSunTerrace}
          />
          <SliderCategory
            label="🛋️ Einrichtung & Toiletten"
            value={interior}
            onChange={setInterior}
          />
          <SliderCategory
            label="🍾 Après-Ski"
            value={apresSki}
            onChange={setApresSki}
          />
        </View>

        {/* BONUS: Eggnog Toggle */}
        <View style={styles.section}>
          <View style={styles.eggnogRow}>
            <Text style={styles.eggnogLabel}>🥚🥛 Gibt es Eierlikör?</Text>
            <View style={styles.eggnogToggle}>
              <Text style={styles.eggnogValue}>{eggnog ? 'Ja (+5)' : 'Nein'}</Text>
              <Switch
                value={eggnog}
                onValueChange={setEggnog}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Schirmbar Toggle (no points) */}
        <View style={styles.section}>
          <View style={styles.eggnogRow}>
            <Text style={styles.eggnogLabel}>🎪 Schirmbar vorhanden?</Text>
            <View style={styles.eggnogToggle}>
              <Text style={styles.eggnogValue}>{schirmbar ? 'Ja' : 'Nein'}</Text>
              <Switch
                value={schirmbar}
                onValueChange={setSchirmbar}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kommentar (Optional)</Text>
          <TextInput
            ref={commentInputRef}
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Teile deine Erfahrung..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            maxLength={500}
            returnKeyType="done"
            blurOnSubmit={true}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fotos (Optional, max 3)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 3 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                <Text style={styles.addPhotoText}>+</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (saving || deleting) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || deleting}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? '✏️ Bewertung aktualisieren' : '⭐ Bewertung speichern'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Delete Button - only shown when editing */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.deleteButton, (saving || deleting) && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={saving || deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#DC2626" />
            ) : (
              <Text style={styles.deleteButtonText}>🗑️ Bewertung löschen</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface RadioButtonProps {
  label: string;
  value: SelfServiceValue;
  selected: boolean;
  onPress: () => void;
  points: string;
}

function RadioButton({ label, value, selected, onPress, points }: RadioButtonProps) {
  return (
    <TouchableOpacity style={styles.radioButton} onPress={onPress}>
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
      <View style={styles.radioLabelContainer}>
        <Text style={styles.radioLabel}>{label}</Text>
        <Text style={[styles.radioPoints, selected && styles.radioPointsSelected]}>
          {points} Punkte
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface SliderCategoryProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function SliderCategory({ label, value, onChange }: SliderCategoryProps) {
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value.toFixed(1)} ⭐</Text>
      </View>
      <Slider
        style={styles.slider}
        value={value}
        minimumValue={0}
        maximumValue={5}
        step={0.5}
        onValueChange={onChange}
        minimumTrackTintColor="#10B981"
        maximumTrackTintColor="#D1D5DB"
        thumbTintColor="#10B981"
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabelText}>0</Text>
        <Text style={styles.sliderLabelText}>5</Text>
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
  scoreBox: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '700',
  },
  scoreRange: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  radioGroup: {
    gap: 12,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#10B981',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  radioLabelContainer: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  radioPoints: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  radioPointsSelected: {
    color: '#10B981',
    fontWeight: '600',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  eggnogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eggnogLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  eggnogToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eggnogValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  photoScroll: {
    marginTop: 12,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  addPhotoText: {
    fontSize: 36,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  deleteButtonDisabled: {
    borderColor: '#D1D5DB',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
});
