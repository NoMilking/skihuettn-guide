import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/welcome.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('MainTabs')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Ski Hüttn Guide</Text>
          <Text style={styles.buttonArrow}>{'>'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginRight: 12,
  },
  buttonArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#10B981',
  },
});
