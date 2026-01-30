import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Constants from 'expo-constants';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function AccordionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={toggle} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>
      {expanded && <Text style={styles.sectionText}>{children}</Text>}
    </TouchableOpacity>
  );
}

export default function InfoScreen() {
  const appVersion = Constants.expoConfig?.version ?? '–';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AccordionCard title="Info">
        Test Info
      </AccordionCard>

      <AccordionCard title="Impressum">
        Wer das liest, muss dem Pfeffy ein Bier ausgeben.
      </AccordionCard>

      <AccordionCard title="Datenschutz">
        Test Datenschutz
      </AccordionCard>

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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  chevron: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  sectionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginTop: 12,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 32,
  },
});
