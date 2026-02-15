import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';

import GameScreen from './GameScreen';

// --- КАТЕГОРИИ ---
const CATEGORIES = [
  {
    id: 'wit',
    title: '«Тапқырлық» миссиясы ойыны',
    img: require('./imgs/1.png'),
  },
  { id: 'situ', title: '«Жағдаят желісі» ойыны', img: require('./imgs/2.png') },
  { id: 'trip', title: '«Сюжетке сапар» ойыны', img: require('./imgs/3.png') },
  {
    id: 'adv',
    title: '«Шытырман оқиғаға» ойыны',
    img: require('./imgs/4.png'),
  },
];

// --- ИСТОРИИ ---
const CATEGORY_STORIES = {
  wit: [
    { id: "quyrdaq", title: "Quyrdaq", img: require('./imgs/quyrdaq.png') },
  ],
  situ: [
    { id: "dastarkhan", title: "Дастархан басында", img: require('./imgs/meal.png') },
  ],
  trip: [
    { id: "koja", title: "Сырттандар", img: require('./imgs/wolf.png') },
  ],
  adv: [
    { id: "treasure", title: "Қазына іздеу", img: require('./imgs/treasure.png') },
  ],
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---
export default function App() {
  const [screen, setScreen] = useState('home'); // home | category | game
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentStoryId, setCurrentStoryId] = useState(null);

  const openCategory = (cat) => {
    setCurrentCategory(cat);
    setScreen('category');
  };

  const goBackHome = () => {
    setScreen('home');
    setCurrentCategory(null);
  };

  const openStory = (storyId) => {
    setCurrentStoryId(storyId);
    setScreen('game');
  };

  const exitGame = () => {
    setScreen('category');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#10B5B8"
        translucent={false}
      />

      {/* === Главный экран === */}
      {screen === 'home' && (
        <>
          <AppBar title="Ойындар тізімі" rightText="0" />
          <FlatList
            contentContainerStyle={styles.list}
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CategoryCard
                title={item.title}
                img={item.img}
                onPress={() => openCategory(item)}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          />
        </>
      )}

      {/* === Экран категории === */}
      {screen === 'category' && currentCategory && (
        <>
          <AppBar
            title={currentCategory.title.replace(/\"/g, '"')}
            onBack={goBackHome}
          />
          <FlatList
            contentContainerStyle={styles.list}
            data={CATEGORY_STORIES[currentCategory.id] || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StoryRow
                title={item.title}
                img={item.img}
                onPress={() => openStory(item.id)}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          />
        </>
      )}

      {/* === Экран игры === */}
      {screen === 'game' && (
        <GameScreen storyId={currentStoryId} onExit={exitGame} />
      )}
    </SafeAreaView>
  );
}

// --- ВЕРХНЯЯ ПАНЕЛЬ ---
function AppBar({ title, rightText, onBack }) {
  return (
    <View style={styles.appbar}>
      {onBack ? (
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backTxt}>❮</Text>
        </Pressable>
      ) : (
        <View style={{ width: 32 }} />
      )}

      <Text style={styles.appTitle} numberOfLines={1}>
        {title}
      </Text>

      {rightText ? (
        <Text style={styles.score}>{rightText}</Text>
      ) : (
        <View style={{ width: 32 }} />
      )}
    </View>
  );
}

// --- КАРТОЧКА КАТЕГОРИИ ---
function CategoryCard({ title, img, onPress }) {
  return (
    <View style={styles.card}>
      <Image source={img} style={styles.thumbLarge} resizeMode="cover" />
      <Pressable style={styles.bigButton} onPress={onPress}>
        <Text
          style={styles.bigButtonText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}>
          {title}
        </Text>
      </Pressable>
    </View>
  );
}

// --- КАРТОЧКА ИСТОРИИ ---
function StoryRow({ title, img, onPress }) {
  return (
    <View style={styles.card}>
      <Image source={img} style={styles.thumbSmall} resizeMode="cover" />
      <Pressable style={styles.bigButton} onPress={onPress}>
        <Text
          style={styles.bigButtonText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}>
          {title}
        </Text>
      </Pressable>
    </View>
  );
}

// --- СТИЛИ ---
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  appbar: {
    minHeight: 56,
    backgroundColor: '#10B5B8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  appTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  score: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    width: 32,
    textAlign: 'right',
  },

  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  backTxt: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: -2 },

  list: { padding: 16 },

  card: {
    backgroundColor: '#EEDCD7',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
  },

  thumbLarge: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  thumbSmall: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },

  bigButton: {
    alignSelf: 'stretch',
    backgroundColor: '#10B5B8',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 56,
  },
  bigButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
