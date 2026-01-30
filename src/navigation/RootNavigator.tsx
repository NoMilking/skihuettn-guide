import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import SkiAreasScreen from '../screens/SkiAreasScreen';
import MySkiAreasScreen from '../screens/MySkiAreasScreen';
import MyRatingsScreen from '../screens/MyRatingsScreen';
import SkiAreaDetailScreen from '../screens/SkiAreaDetailScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import RatingScreen from '../screens/RatingScreen';
import ActivityFeedScreen from '../screens/ActivityFeedScreen';

// Types for navigation
export type RootTabParamList = {
  SkiAreas: undefined;
  MySkiAreas: undefined;
  MyRatings: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  SkiAreaDetail: { skiAreaId: string };
  RestaurantDetail: { restaurantId: string };
  Rating: { restaurantId: string };
  ActivityFeed: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Bottom Tab Navigator
 * 3 main tabs: Skigebiete, Meine Skigebiete, Meine Bewertungen
 */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#10B981', // green-500
        tabBarInactiveTintColor: '#9CA3AF', // gray-400
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="SkiAreas"
        component={SkiAreasScreen}
        options={{
          title: 'Skigebiete',
          tabBarLabel: 'Skigebiete',
          tabBarIcon: ({ color }) => <TabIcon emoji="⛷️" />,
        }}
      />
      <Tab.Screen
        name="MySkiAreas"
        component={MySkiAreasScreen}
        options={{
          title: 'Meine Skigebiete',
          tabBarLabel: 'Favoriten',
          tabBarIcon: ({ color }) => <TabIcon emoji="⭐" />,
        }}
      />
      <Tab.Screen
        name="MyRatings"
        component={MyRatingsScreen}
        options={{
          title: 'Meine Bewertungen',
          tabBarLabel: 'Bewertungen',
          tabBarIcon: ({ color }) => <TabIcon emoji="📝" />,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Simple emoji-based tab icon component
 */
function TabIcon({ emoji }: { emoji: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 24 }}>{emoji}</Text>;
}

/**
 * Root Navigator
 * Currently just contains the main tabs.
 * Will be extended with detail screens later.
 */
export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false, title: 'Skigebiete' }}
        />
        <Stack.Screen
          name="SkiAreaDetail"
          component={SkiAreaDetailScreen}
          options={{ title: 'Skigebiet' }}
        />
        <Stack.Screen
          name="RestaurantDetail"
          component={RestaurantDetailScreen}
          options={{ title: 'Hütte' }}
        />
        <Stack.Screen
          name="Rating"
          component={RatingScreen}
          options={{ title: 'Bewerten', gestureEnabled: false }}
        />
        <Stack.Screen
          name="ActivityFeed"
          component={ActivityFeedScreen}
          options={{ title: 'Aktivität', headerBackTitle: 'Bewertungen' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
