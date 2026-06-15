import 'react-native-gesture-handler';
import React from 'react';
import { Platform, View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import { Ionicons } from '@expo/vector-icons';
import HomeIcon from './src/assets/icons/home.svg';
import EventIcon from './src/assets/icons/event.svg';
import ShootIcon from './src/assets/icons/shoot.svg';
import OrderIcon from './src/assets/icons/order.svg';
import ProfileIcon from './src/assets/icons/profile.svg';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SetupScreen from './src/screens/SetupScreen';
import CameraScreen from './src/screens/CameraScreen';
import SelectionScreen from './src/screens/SelectionScreen';
import CollageScreen from './src/screens/CollageScreen';
import CollageDetailScreen from './src/screens/CollageDetailScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import EventsScreen from './src/screens/EventsScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import { RootStackParamList, AuthStackParamList, MainTabParamList } from './src/types';

enableScreens();

const MainStack = createStackNavigator<RootStackParamList>();
const AuthStack  = createStackNavigator<AuthStackParamList>();
const MainTab    = createBottomTabNavigator<MainTabParamList>();

const NAV_THEME = {
  dark: true,
  colors: {
    primary: '#FFFFFF',
    background: '#0A0A0A',
    card: '#0A0A0A',
    text: '#FFFFFF',
    border: '#222222',
    notification: '#FF453A',
  },
};

// ── Tab bar ───────────────────────────────────────────────────────────────────
// Visual slot index for each real tab (slot 2 is Shoot — not a route)
const VISUAL_SLOT: Record<string, number> = { Home: 0, Events: 1, Orders: 3, Profile: 4 };
const HIGHLIGHT_W = 46;
const CARD_PAD_H  = 6;
const CARD_PAD_V  = 10;

function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const parentNav = navigation.getParent();
  const active = state.routeNames[state.index];
  const is = (name: string) => active === name;

  // ── Burst animation (scale per tab) ───────────────────────────────────────
  const scales = React.useRef({
    Home:    new Animated.Value(1),
    Events:  new Animated.Value(1),
    Orders:  new Animated.Value(1),
    Profile: new Animated.Value(1),
  }).current;

  const burst = (key: keyof typeof scales) => {
    const anim = scales[key];
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.4, duration: 90, useNativeDriver: true }),
      Animated.spring(anim,  { toValue: 1,   useNativeDriver: true, bounciness: 10, speed: 14 }),
    ]).start();
  };

  const pressTab = (name: keyof typeof scales, nav: () => void) => {
    burst(name);
    nav();
  };

  // ── Sliding highlight ──────────────────────────────────────────────────────
  const [cardW, setCardW] = React.useState(0);
  const slideX     = React.useRef(new Animated.Value(0)).current;
  const isFirstLayout = React.useRef(true);

  React.useEffect(() => {
    if (cardW === 0) return;
    const tabW    = (cardW - CARD_PAD_H * 2) / 5;
    const slot    = VISUAL_SLOT[active] ?? 0;
    const targetX = CARD_PAD_H + slot * tabW + (tabW - HIGHLIGHT_W) / 2;

    if (isFirstLayout.current) {
      // Snap to position on first render — no animation
      slideX.setValue(targetX);
      isFirstLayout.current = false;
      return;
    }

    Animated.spring(slideX, {
      toValue: targetX,
      useNativeDriver: true,
      bounciness: 6,
      speed: 16,
    }).start();
  }, [active, cardW]);

  return (
    <View style={tabStyles.outer} pointerEvents="box-none">
      <View style={tabStyles.shadow}>
        <View
          style={tabStyles.card}
          onLayout={e => setCardW(e.nativeEvent.layout.width)}
        >
          {/* Sliding highlight — sits behind all tab icons */}
          <Animated.View
            pointerEvents="none"
            style={[tabStyles.slideHighlight, { transform: [{ translateX: slideX }] }]}
          />

          {/* Home */}
          <TouchableOpacity style={tabStyles.tabBtn} onPress={() => pressTab('Home', () => navigation.navigate('Home'))} activeOpacity={0.7}>
            <Animated.View style={[tabStyles.iconWrap, { transform: [{ scale: scales.Home }] }]}>
              <HomeIcon width={20} height={20} color={is('Home') ? '#FFFFFF' : 'rgba(255,255,255,0.38)'} />
            </Animated.View>
            <Text style={[tabStyles.label, is('Home') && tabStyles.labelActive]}>Home</Text>
          </TouchableOpacity>

          {/* Events */}
          <TouchableOpacity style={tabStyles.tabBtn} onPress={() => pressTab('Events', () => navigation.navigate('Events'))} activeOpacity={0.7}>
            <Animated.View style={[tabStyles.iconWrap, { transform: [{ scale: scales.Events }] }]}>
              <EventIcon width={20} height={20} color={is('Events') ? '#BF5AF2' : 'rgba(255,255,255,0.38)'} />
            </Animated.View>
            <Text style={[tabStyles.label, is('Events') && { color: '#BF5AF2' }]}>Events</Text>
          </TouchableOpacity>

          {/* Shoot */}
          <TouchableOpacity style={tabStyles.tabBtn} onPress={() => parentNav?.navigate('Setup')} activeOpacity={0.82}>
            <View style={tabStyles.shootCircle}>
              <ShootIcon width={20} height={20} color="#FFFFFF" />
            </View>
            <Text style={tabStyles.shootLabel}>Shoot</Text>
          </TouchableOpacity>

          {/* Orders */}
          <TouchableOpacity style={tabStyles.tabBtn} onPress={() => pressTab('Orders', () => navigation.navigate('Orders'))} activeOpacity={0.7}>
            <Animated.View style={[tabStyles.iconWrap, { transform: [{ scale: scales.Orders }] }]}>
              <OrderIcon width={20} height={20} color={is('Orders') ? '#FFFFFF' : 'rgba(255,255,255,0.38)'} />
            </Animated.View>
            <Text style={[tabStyles.label, is('Orders') && tabStyles.labelActive]}>Orders</Text>
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity style={tabStyles.tabBtn} onPress={() => pressTab('Profile', () => navigation.navigate('Profile'))} activeOpacity={0.7}>
            <Animated.View style={[tabStyles.iconWrap, { transform: [{ scale: scales.Profile }] }]}>
              <ProfileIcon width={20} height={20} color={is('Profile') ? '#FFFFFF' : 'rgba(255,255,255,0.38)'} />
            </Animated.View>
            <Text style={[tabStyles.label, is('Profile') && tabStyles.labelActive]}>Profile</Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
  },

  shadow: {
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: 26,
    paddingHorizontal: CARD_PAD_H,
    paddingVertical: CARD_PAD_V,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'visible',
  },

  // Single sliding highlight — absolutely positioned, moves via translateX
  slideHighlight: {
    position: 'absolute',
    top: CARD_PAD_V,
    left: 0,
    width: HIGHLIGHT_W,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#252538',
  },

  tabBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 46,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#FFFFFF',
  },

  // Shoot — solid circle, 20% bigger, shifted 30% higher
  shootCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    marginTop: -23,
    backgroundColor: '#3C3CBF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3C3CBF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  shootLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

// ── Tab navigator ─────────────────────────────────────────────────────────────
const TabNavigator = () => (
  <MainTab.Navigator
    initialRouteName="Home"
    tabBar={(props: BottomTabBarProps) => <GlassTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <MainTab.Screen name="Home"    component={HomeScreen} />
    <MainTab.Screen name="Profile" component={ProfileScreen} />
    <MainTab.Screen name="Orders"  component={OrdersScreen} />
    <MainTab.Screen name="Events"  component={EventsScreen} />
  </MainTab.Navigator>
);

// ── Stack navigators ──────────────────────────────────────────────────────────
const MainNavigator = () => (
  <MainStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#0A0A0A' },
      gestureEnabled: true,
    }}
  >
    <MainStack.Screen name="MainTabs" component={TabNavigator} />
    <MainStack.Screen name="Setup"    component={SetupScreen} />
    <MainStack.Screen
      name="Camera"
      component={CameraScreen}
      options={{ gestureEnabled: false }}
    />
    <MainStack.Screen name="Selection"    component={SelectionScreen} />
    <MainStack.Screen name="Collage"      component={CollageScreen} />
    <MainStack.Screen name="CollageDetail" component={CollageDetailScreen} />
    <MainStack.Screen name="Payment"      component={PaymentScreen} />
    <MainStack.Screen name="EventDetail"  component={EventDetailScreen} />
  </MainStack.Navigator>
);

const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#0A0A0A' },
    }}
  >
    <AuthStack.Screen name="Login"  component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
  </AuthStack.Navigator>
);

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={NAV_THEME}>
      <StatusBar style="light" />
      {user ? (
        <AppProvider>
          <MainNavigator />
        </AppProvider>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

// ── Phone shell (web) ─────────────────────────────────────────────────────────
const PHONE_W = 390;
const PHONE_H = 820;

export default function App() {
  const isWeb = Platform.OS === 'web';

  return (
    <GestureHandlerRootView style={[styles.root, isWeb && styles.webRoot]}>
      <AuthProvider>
        {isWeb ? (
          <View style={styles.webShell}>
            <View style={styles.bgDots as any} pointerEvents="none" />
            <View style={styles.phoneFrame}>
              <View style={styles.notchBar}>
                <View style={styles.notch} />
              </View>
              <View style={styles.phoneScreen}>
                <AppContent />
              </View>
              <View style={styles.homeBar}>
                <View style={styles.homeIndicator} />
              </View>
            </View>
            <View style={styles.wordmark}>
              <View style={styles.wordmarkDot} />
              <View style={styles.wordmarkLines}>
                <View style={[styles.wordmarkLine, { width: 32 }]} />
                <View style={[styles.wordmarkLine, { width: 20 }]} />
              </View>
            </View>
          </View>
        ) : (
          <AppContent />
        )}
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  webRoot: { backgroundColor: '#060606' },
  webShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#060606',
    gap: 24,
  },
  bgDots: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle, #1A1A1A 1px, transparent 1px)',
    backgroundSize: '28px 28px',
  },
  phoneFrame: {
    width: PHONE_W,
    height: PHONE_H,
    backgroundColor: '#0A0A0A',
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.7,
    shadowRadius: 48,
    elevation: 48,
  },
  notchBar: {
    height: 44,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#141414',
  },
  notch: { width: 120, height: 20, backgroundColor: '#000', borderRadius: 12 },
  phoneScreen: { flex: 1, overflow: 'hidden' },
  homeBar: {
    height: 28,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#141414',
  },
  homeIndicator: { width: 120, height: 4, backgroundColor: '#333', borderRadius: 2 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmarkDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#333' },
  wordmarkLines: { gap: 4 },
  wordmarkLine: { height: 1.5, backgroundColor: '#282828', borderRadius: 1 },
});
