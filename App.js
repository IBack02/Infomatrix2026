import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import LevelMenu from './LevelMenu';
import MainGame from './MainGame';

import Level1Home from './Level1Home';
import Level1OrderGame from './Level1OrderGame';

import Level2Home from './Level2Home';
import Level2BranchGame from './Level2BranchGame';

export default function App() {
  const [level, setLevel] = useState(null);

  // Level 1
  const [l1Screen, setL1Screen] = useState('home');
  const [l1StoryId, setL1StoryId] = useState(null);

  // Level 2
  const [l2Screen, setL2Screen] = useState('home');
  const [l2StoryId, setL2StoryId] = useState(null);

  useEffect(() => {
    if (!level) {
      setL1Screen('home');
      setL1StoryId(null);
      setL2Screen('home');
      setL2StoryId(null);
      return;
    }
    

    if (level !== 1) {
      setL1Screen('home');
      setL1StoryId(null);
    }

    if (level !== 2) {
      setL2Screen('home');
      setL2StoryId(null);
    }
  }, [level]);

  // ---- ROUTER ----
  const renderScreen = () => {
    if (!level) return <LevelMenu onSelectLevel={setLevel} />;

    if (level === 3) return <MainGame />;

    if (level === 1) {
      if (l1Screen === 'home') {
        return (
          <Level1Home
            onBack={() => setLevel(null)}
            onOpenStory={(id) => {
              setL1StoryId(id);
              setL1Screen('game');
            }}
          />
        );
      }
      return (
        <Level1OrderGame
          storyId={l1StoryId}
          onBack={() => setL1Screen('home')}
        />
      );
    }

    if (level === 2) {
      if (l2Screen === 'home') {
        return (
          <Level2Home
            onBack={() => setLevel(null)}
            onOpenStory={(id) => {
              setL2StoryId(id);
              setL2Screen('game');
            }}
          />
        );
      }
      return (
        <Level2BranchGame
          storyId={l2StoryId}
          onBack={() => setL2Screen('home')}
        />
      );
    }

    // fallback (на случай неожиданных значений)
    return <LevelMenu onSelectLevel={setLevel} />;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {renderScreen()}
    </GestureHandlerRootView>
  );
}
