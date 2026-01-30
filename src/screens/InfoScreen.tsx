import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

export default function InfoScreen() {
  const appVersion = Constants.expoConfig?.version ?? '–';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Info</Text>
        <Text style={styles.sectionText}>Test Info</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Impressum</Text>
        <Text style={styles.sectionText}>
          Wer das liest, muss dem Pfeffy ein Bier ausgeben.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Datenschutz</Text>
        <Text style={styles.sectionText}>Test Datenschutz</Text>
      </View>

      <Text style={styles.versionText}>Version {appVersion}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 32,
  },
});
