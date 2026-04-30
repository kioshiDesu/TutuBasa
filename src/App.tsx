/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { X, Settings, Star, ArrowLeft, ArrowRight, Plus, Trash2, Edit3, BookOpen, ChevronRight, Play, Trophy, Moon, Sun, Shuffle, Mic, Square, Volume2, RotateCcw } from 'lucide-react';
import { saveAudio, getAudio } from './lib/audioDB';
import { TracingCanvas } from './components/TracingCanvas';

interface Flashcard {
  syllable: string;
  image?: string;
  answer?: string;
  options?: string[];
}

interface CardSet {
  id: string;
  name: string;
  cards: Flashcard[];
  isPreset?: boolean;
  type?: 'read-write' | 'fill-in';
  tier?: 'Beginner' | 'Intermediate' | 'Expert' | 'Challenge';
  isChallenge?: boolean;
  isGame?: boolean;
}

const PRESET_SETS: CardSet[] = [
  {
    id: 'abakada-phonetic',
    name: 'ABAKADA',
    isPreset: true,
    tier: 'Beginner',
    cards: [
      { syllable: 'Ba' }, { syllable: 'Da' }, { syllable: 'Fa' },
      { syllable: 'Ga' }, { syllable: 'Ha' }, { syllable: 'Ka' },
      { syllable: 'La' }, { syllable: 'Ma' }, { syllable: 'Na' },
      { syllable: 'Nga' }, { syllable: 'Pa' }, { syllable: 'Ra' },
      { syllable: 'Sa' }, { syllable: 'Ta' }, { syllable: 'Va' },
      { syllable: 'Wa' }, { syllable: 'Ya' }, { syllable: 'Za' }
    ].sort((a, b) => a.syllable.localeCompare(b.syllable)),
  },
  {
    id: 'consonants-only',
    name: 'Consonants',
    isPreset: true,
    tier: 'Beginner',
    cards: [
      { syllable: 'B' }, { syllable: 'C' }, { syllable: 'D' },
      { syllable: 'F' }, { syllable: 'G' }, { syllable: 'H' },
      { syllable: 'J' }, { syllable: 'K' }, { syllable: 'L' },
      { syllable: 'M' }, { syllable: 'N' }, { syllable: 'P' },
      { syllable: 'Q' }, { syllable: 'R' }, { syllable: 'S' },
      { syllable: 'T' }, { syllable: 'V' }, { syllable: 'W' },
      { syllable: 'X' }, { syllable: 'Y' }, { syllable: 'Z' }
    ],
  },
  {
    id: 'vowels',
    name: 'Vowels',
    isPreset: true,
    tier: 'Beginner',
    cards: [
      { syllable: 'A' }, { syllable: 'E' }, { syllable: 'I' },
      { syllable: 'O' }, { syllable: 'U' }
    ],
  },
  {
    id: 'abc-eng',
    name: 'ABC\'s',
    isPreset: true,
    tier: 'Beginner',
    cards: Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(char => ({
      syllable: char
    })),
  },
  {
    id: 'numbers',
    name: 'Numbers',
    isPreset: true,
    tier: 'Beginner',
    cards: Array.from({length: 10}, (_, i) => ({ syllable: String(i + 1) })),
  },
  {
    id: 'animals-read',
    name: 'Animals',
    isPreset: true,
    tier: 'Intermediate',
    cards: [
      { syllable: 'Ant', image: '🐜' }, { syllable: 'Bear', image: '🐻' }, { syllable: 'Cat', image: '🐈' },
      { syllable: 'Dog', image: '🐕' }, { syllable: 'Elephant', image: '🐘' }, { syllable: 'Fish', image: '🐟' },
      { syllable: 'Giraffe', image: '🦒' }, { syllable: 'Horse', image: '🐎' }, { syllable: 'Iguana', image: '🦎' },
      { syllable: 'Jellyfish', image: '🪼' }, { syllable: 'Kangaroo', image: '🦘' }, { syllable: 'Lion', image: '🦁' },
      { syllable: 'Monkey', image: '🐒' }, { syllable: 'Owl', image: '🦉' }, { syllable: 'Penguin', image: '🐧' },
      { syllable: 'Rabbit', image: '🐇' }, { syllable: 'Snake', image: '🐍' }, { syllable: 'Tiger', image: '🐯' },
      { syllable: 'Whale', image: '🐋' }, { syllable: 'Zebra', image: '🦓' }, { syllable: 'Panda', image: '🐼' },
      { syllable: 'Koala', image: '🐨' }, { syllable: 'Fox', image: '🦊' }, { syllable: 'Shark', image: '🦈' },
      { syllable: 'Crab', image: '🦀' }, { syllable: 'Turtle', image: '🐢' }, { syllable: 'Beaver', image: '🦫' },
      { syllable: 'Chicken', image: '🐔' }, { syllable: 'Sheep', image: '🐑' }, { syllable: 'Pig', image: '🐖' }
    ]
  },
  {
    id: 'fruits-read',
    name: 'Fruits',
    isPreset: true,
    tier: 'Intermediate',
    cards: [
      { syllable: 'Apple', image: '🍎' }, { syllable: 'Banana', image: '🍌' }, { syllable: 'Cherry', image: '🍒' },
      { syllable: 'Grape', image: '🍇' }, { syllable: 'Melon', image: '🍈' }, { syllable: 'Peach', image: '🍑' },
      { syllable: 'Pear', image: '🍐' }, { syllable: 'Plum', image: '🫐' }, { syllable: 'Kiwi', image: '🥝' },
      { syllable: 'Lemon', image: '🍋' }, { syllable: 'Mango', image: '🥭' }, { syllable: 'Orange', image: '🍊' },
      { syllable: 'Pineapple', image: '🍍' }, { syllable: 'Strawberry', image: '🍓' }, { syllable: 'Watermelon', image: '🍉' },
      { syllable: 'Avocado', image: '🥑' }, { syllable: 'Coconut', image: '🥥' }, { syllable: 'Tomato', image: '🍅' },
      { syllable: 'Pomegranate', image: '🍎' }
    ]
  },
  {
    id: 'veggies-read',
    name: 'Vegetables',
    isPreset: true,
    tier: 'Intermediate',
    cards: [
      { syllable: 'Carrot', image: '🥕' }, { syllable: 'Potato', image: '🥔' }, { syllable: 'Corn', image: '🌽' },
      { syllable: 'Onion', image: '🧅' }, { syllable: 'Broccoli', image: '🥦' }, { syllable: 'Pumpkin', image: '🎃' },
      { syllable: 'Mushroom', image: '🍄' }, { syllable: 'Eggplant', image: '🍆' }, { syllable: 'Cucumber', image: '🥒' },
      { syllable: 'Pepper', image: '🫑' }, { syllable: 'Garlic', image: '🧄' }, { syllable: 'Peas', image: '🫛' }
    ]
  },
  {
    id: 'foods-read',
    name: 'Foods',
    isPreset: true,
    tier: 'Intermediate',
    cards: [
      { syllable: 'Burger', image: '🍔' }, { syllable: 'Pizza', image: '🍕' }, { syllable: 'Fries', image: '🍟' },
      { syllable: 'Hotdog', image: '🌭' }, { syllable: 'Taco', image: '🌮' }, { syllable: 'Donut', image: '🍩' },
      { syllable: 'Ice Cream', image: '🍦' }, { syllable: 'Pancake', image: '🥞' }, { syllable: 'Sushi', image: '🍣' },
      { syllable: 'Curry', image: '🍛' }, { syllable: 'Bread', image: '🍞' }, { syllable: 'Cheese', image: '🧀' }
    ]
  },
  {
    id: 'flowers-read',
    name: 'Flowers',
    isPreset: true,
    tier: 'Intermediate',
    cards: [
      { syllable: 'Rose', image: '🌹' }, { syllable: 'Sunflower', image: '🌻' }, { syllable: 'Tulip', image: '🌷' },
      { syllable: 'Blossom', image: '🌸' }, { syllable: 'Hibiscus', image: '🌺' }, { syllable: 'Daisy', image: '🌼' }
    ]
  },
  {
    id: 'colors-read',
    name: 'Colors',
    isPreset: true,
    tier: 'Intermediate',
    cards: [
      { syllable: 'Red', image: '🔴' }, { syllable: 'Blue', image: '🔵' }, { syllable: 'Yellow', image: '🟡' },
      { syllable: 'Green', image: '🟢' }, { syllable: 'Orange', image: '🟠' }, { syllable: 'Purple', image: '🟣' }
    ]
  },
  {
    id: 'weather-read',
    name: 'Temperature',
    isPreset: true,
    tier: 'Intermediate',
    cards: [
      { syllable: 'Hot', image: '☀️' }, { syllable: 'Cold', image: '❄️' }, { syllable: 'Rain', image: '🌧️' },
      { syllable: 'Snow', image: '🌨️' }, { syllable: 'Warm', image: '⛅' }, { syllable: 'Storm', image: '⛈️' }
    ]
  },
  {
    id: 'pop-words-game',
    name: 'Pop Words',
    isPreset: true,
    tier: 'Challenge',
    isGame: true,
    cards: [] // Will pull from intermediate sets dynamically
  },
  {
    id: 'numbers-challenge',
    name: 'Numbers',
    isPreset: true,
    type: 'fill-in',
    tier: 'Challenge',
    isChallenge: true,
    cards: [
      { syllable: 'One', answer: '1', options: ['2', '3', '0'] },
      { syllable: 'Two', answer: '2', options: ['1', '3', '4'] },
      { syllable: 'Three', answer: '3', options: ['2', '4', '5'] },
      { syllable: 'Four', answer: '4', options: ['3', '5', '6'] },
      { syllable: 'Five', answer: '5', options: ['4', '6', '7'] },
      { syllable: 'Six', answer: '6', options: ['5', '7', '8'] },
      { syllable: 'Seven', answer: '7', options: ['6', '8', '9'] },
      { syllable: 'Eight', answer: '8', options: ['7', '9', '6'] },
      { syllable: 'Nine', answer: '9', options: ['8', '0', '7'] },
      { syllable: 'Ten', answer: '10', options: ['9', '1', '11'] }
    ]
  },
  {
    id: 'animals-fill',
    name: 'Animals',
    isPreset: true,
    type: 'fill-in',
    tier: 'Challenge',
    isChallenge: true,
    cards: [
      { syllable: 'A_T', answer: 'ANT', image: '🐜', options: ['N', 'M', 'R'] },
      { syllable: 'B_T', answer: 'BAT', image: '🦇', options: ['A', 'E', 'O'] },
      { syllable: 'C_T', answer: 'CAT', image: '🐈', options: ['A', 'U', 'I'] },
      { syllable: 'D_G', answer: 'DOG', image: '🐕', options: ['O', 'A', 'E'] },
      { syllable: 'P_G', answer: 'PIG', image: '🐖', options: ['I', 'U', 'O'] },
      { syllable: 'C_W', answer: 'COW', image: '🐄', options: ['O', 'A', 'E'] },
      { syllable: 'B_G', answer: 'BUG', image: '🐛', options: ['U', 'A', 'I'] },
      { syllable: 'F_X', answer: 'FOX', image: '🦊', options: ['O', 'E', 'A'] },
      { syllable: 'O_L', answer: 'OWL', image: '🦉', options: ['W', 'M', 'B'] },
      { syllable: 'H_N', answer: 'HEN', image: '🐔', options: ['E', 'A', 'I'] },
      { syllable: 'B_AR', answer: 'BEAR', image: '🐻', options: ['E', 'A', 'O'] },
      { syllable: 'B_E', answer: 'BEE', image: '🐝', options: ['E', 'A', 'O'] },
      { syllable: 'R_T', answer: 'RAT', image: '🐀', options: ['A', 'E', 'I'] },
      { syllable: 'M_NKEY', answer: 'MONKEY', image: '🐒', options: ['O', 'A', 'E'] },
      { syllable: 'D_CK', answer: 'DUCK', image: '🦆', options: ['U', 'A', 'O'] },
      { syllable: 'FR_G', answer: 'FROG', image: '🐸', options: ['O', 'A', 'U'] },
      { syllable: 'B_RD', answer: 'BIRD', image: '🐦', options: ['I', 'E', 'A'] },
      { syllable: 'L_ON', answer: 'LION', image: '🦁', options: ['I', 'E', 'A'] },
      { syllable: 'W_LF', answer: 'WOLF', image: '🐺', options: ['O', 'A', 'E'] },
      { syllable: 'P_NDA', answer: 'PANDA', image: '🐼', options: ['A', 'E', 'O'] },
      { syllable: 'SH_RK', answer: 'SHARK', image: '🦈', options: ['A', 'E', 'I'] },
      { syllable: 'CR_B', answer: 'CRAB', image: '🦀', options: ['A', 'E', 'U'] }
    ]
  },
  {
    id: 'fruits-fill',
    name: 'Fruits',
    isPreset: true,
    type: 'fill-in',
    tier: 'Challenge',
    isChallenge: true,
    cards: [
      { syllable: 'AP_LE', answer: 'APPLE', image: '🍎', options: ['P', 'B', 'D'] },
      { syllable: 'B_NANA', answer: 'BANANA', image: '🍌', options: ['A', 'E', 'I'] },
      { syllable: 'CH_RRY', answer: 'CHERRY', image: '🍒', options: ['E', 'A', 'O'] },
      { syllable: 'GR_PE', answer: 'GRAPE', image: '🍇', options: ['A', 'E', 'I'] },
      { syllable: 'M_LON', answer: 'MELON', image: '🍈', options: ['E', 'A', 'O'] },
      { syllable: 'P_ACH', answer: 'PEACH', image: '🍑', options: ['E', 'A', 'I'] },
      { syllable: 'P_AR', answer: 'PEAR', image: '🍐', options: ['E', 'A', 'O'] },
      { syllable: 'PL_M', answer: 'PLUM', image: '🫐', options: ['U', 'A', 'E'] },
      { syllable: 'K_WI', answer: 'KIWI', image: '🥝', options: ['I', 'E', 'A'] },
      { syllable: 'L_MON', answer: 'LEMON', image: '🍋', options: ['E', 'A', 'O'] },
      { syllable: 'M_NGO', answer: 'MANGO', image: '🥭', options: ['A', 'E', 'O'] },
      { syllable: 'OR_NGE', answer: 'ORANGE', image: '🍊', options: ['A', 'E', 'I'] },
      { syllable: 'STR_WBERRY', answer: 'STRAWBERRY', image: '🍓', options: ['A', 'E', 'I'] },
      { syllable: 'W_TERMELON', answer: 'WATERMELON', image: '🍉', options: ['A', 'E', 'U'] }
    ]
  },
  {
    id: 'veggies-fill',
    name: 'Vegetables',
    isPreset: true,
    type: 'fill-in',
    tier: 'Challenge',
    isChallenge: true,
    cards: [
      { syllable: 'C_RROT', answer: 'CARROT', image: '🥕', options: ['A', 'E', 'O'] },
      { syllable: 'P_TATO', answer: 'POTATO', image: '🥔', options: ['O', 'A', 'E'] },
      { syllable: 'C_RN', answer: 'CORN', image: '🌽', options: ['O', 'A', 'U'] },
      { syllable: 'ON_ON', answer: 'ONION', image: '🧅', options: ['I', 'E', 'Y'] },
      { syllable: 'B_OCCOLI', answer: 'BROCCOLI', image: '🥦', options: ['R', 'L', 'P'] },
      { syllable: 'P_MPKIN', answer: 'PUMPKIN', image: '🎃', options: ['U', 'A', 'O'] },
      { syllable: 'M_SHROOM', answer: 'MUSHROOM', image: '🍄', options: ['U', 'A', 'O'] },
      { syllable: 'E_GPLANT', answer: 'EGGPLANT', image: '🍆', options: ['G', 'E', 'I'] },
      { syllable: 'G_RLIC', answer: 'GARLIC', image: '🧄', options: ['A', 'E', 'O'] }
    ]
  },
  {
    id: 'foods-fill',
    name: 'Foods',
    isPreset: true,
    type: 'fill-in',
    tier: 'Challenge',
    isChallenge: true,
    cards: [
      { syllable: 'B_RGER', answer: 'BURGER', image: '🍔', options: ['U', 'A', 'E'] },
      { syllable: 'P_ZZA', answer: 'PIZZA', image: '🍕', options: ['I', 'A', 'E'] },
      { syllable: 'FR_ES', answer: 'FRIES', image: '🍟', options: ['I', 'E', 'A'] },
      { syllable: 'H_TDOG', answer: 'HOTDOG', image: '🌭', options: ['O', 'A', 'E'] },
      { syllable: 'T_CO', answer: 'TACO', image: '🌮', options: ['A', 'O', 'E'] },
      { syllable: 'D_NUT', answer: 'DONUT', image: '🍩', options: ['O', 'A', 'U'] },
      { syllable: 'P_NCAKE', answer: 'PANCAKE', image: '🥞', options: ['A', 'E', 'O'] },
      { syllable: 'S_SHI', answer: 'SUSHI', image: '🍣', options: ['U', 'I', 'O'] }
    ]
  },
  {
    id: 'flowers-fill',
    name: 'Flowers',
    isPreset: true,
    type: 'fill-in',
    tier: 'Challenge',
    isChallenge: true,
    cards: [
      { syllable: 'R_SE', answer: 'ROSE', image: '🌹', options: ['O', 'A', 'E'] },
      { syllable: 'T_LIP', answer: 'TULIP', image: '🌷', options: ['U', 'A', 'O'] },
      { syllable: 'D_ISY', answer: 'DAISY', image: '🌼', options: ['A', 'E', 'I'] }
    ]
  },
  {
    id: 'colors-fill',
    name: 'Colors',
    isPreset: true,
    type: 'fill-in',
    tier: 'Challenge',
    isChallenge: true,
    cards: [
      { syllable: 'R_D', answer: 'RED', image: '🔴', options: ['E', 'A', 'O'] },
      { syllable: 'BL_E', answer: 'BLUE', image: '🔵', options: ['U', 'A', 'O'] },
      { syllable: 'GR_EN', answer: 'GREEN', image: '🟢', options: ['E', 'A', 'I'] },
      { syllable: 'Y_LLOW', answer: 'YELLOW', image: '🟡', options: ['E', 'A', 'O'] }
    ]
  },
  {
    id: 'temp-fill',
    name: 'Temperature',
    isPreset: true,
    type: 'fill-in',
    tier: 'Challenge',
    isChallenge: true,
    cards: [
      { syllable: 'H_T', answer: 'HOT', image: '☀️', options: ['O', 'A', 'U'] },
      { syllable: 'C_LD', answer: 'COLD', image: '❄️', options: ['O', 'A', 'U'] },
      { syllable: 'R_IN', answer: 'RAIN', image: '🌧️', options: ['A', 'E', 'I'] },
      { syllable: 'SN_W', answer: 'SNOW', image: '🌨️', options: ['O', 'A', 'U'] }
    ]
  }
];

type View = 'library' | 'study' | 'editor' | 'congrats' | 'pop-words';

interface GameScore {
  score: number;
  timestamp: number;
}

export default function App() {
  const [view, setView] = useState<View>('library');
  const [activeSet, setActiveSet] = useState<CardSet>(PRESET_SETS[0]);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [userSets, setUserSets] = useState<CardSet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appMode, setAppMode] = useState<'read' | 'write'>('read');
  const [isLowerCase, setIsLowerCase] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [wrongGuessId, setWrongGuessId] = useState<number | null>(null);
  const [selectedVowel, setSelectedVowel] = useState('a');
  const [isVowelMenuOpen, setIsVowelMenuOpen] = useState(false);
  
  const [editingSet, setEditingSet] = useState<CardSet | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [highScores, setHighScores] = useState<GameScore[]>([]);
  const [popWordsState, setPopWordsState] = useState<{
    score: number;
    timeLeft: number;
    currentCard: Flashcard | null;
    currentCategory: string;
    feedbackType: 'none' | 'correct' | 'wrong';
    floatingEmojis: { id: number; emoji: string; x: number; y: number; vx: number; vy: number; isCorrect: boolean }[];
  }>({
    score: 0,
    timeLeft: 30,
    currentCard: null,
    currentCategory: '',
    feedbackType: 'none',
    floatingEmojis: []
  });

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameLoopRef = useRef<number | null>(null);

  useEffect(() => {
    const savedScores = localStorage.getItem('abakada_high_scores');
    if (savedScores) setHighScores(JSON.parse(savedScores));
    // Initial loading / splash duration
    const splashTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    if (Capacitor.isNativePlatform()) {
      StatusBar.show().catch(e => console.warn('StatusBar show failed', e));
    }

    return () => clearTimeout(splashTimer);
  }, []);

  const clearCanvasRef = useRef<(() => void) | null>(null);

  const [hasAudio, setHasAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioUrlRef = useRef<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTriggeredRef = useRef(false);

  useEffect(() => {
    if (view === 'study' && sessionCards[currentIndex]) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audioId = `${activeSet.id}_${sessionCards[currentIndex].syllable}`;
      getAudio(audioId).then(blob => {
        if (blob) {
          setHasAudio(true);
          if (currentAudioUrlRef.current) URL.revokeObjectURL(currentAudioUrlRef.current);
          currentAudioUrlRef.current = URL.createObjectURL(blob);
        } else {
          setHasAudio(false);
          if (currentAudioUrlRef.current) URL.revokeObjectURL(currentAudioUrlRef.current);
          currentAudioUrlRef.current = null;
        }
        setIsPlaying(false);
        setIsRecording(false);
      });
    }
  }, [currentIndex, sessionCards, activeSet.id, view]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioId = `${activeSet.id}_${sessionCards[currentIndex].syllable}`;
        await saveAudio(audioId, audioBlob);
        setHasAudio(true);
        if (currentAudioUrlRef.current) URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = URL.createObjectURL(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // release mic
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Microphone access is needed to record audio.");
    }
  };

  const handleAudioAction = (forceRecord = false, playOnly = false) => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (hasAudio && !forceRecord) {
      if (!audioPlayerRef.current) {
         audioPlayerRef.current = new Audio();
         audioPlayerRef.current.onended = () => setIsPlaying(false);
      }
      audioPlayerRef.current.src = currentAudioUrlRef.current!;
      audioPlayerRef.current.play();
      setIsPlaying(true);
    } else if (!playOnly) {
      startRecording();
    }
  };

  const startPress = () => {
    holdTriggeredRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true;
      if (hasAudio && !isRecording) {
         handleAudioAction(true);
      }
    }, 600);
  };

  const endPress = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  const handleAudioClick = () => {
    if (holdTriggeredRef.current) return;
    handleAudioAction();
  };

  const currentOptions = sessionCards[currentIndex]?.options && sessionCards[currentIndex]?.answer 
    ? [...sessionCards[currentIndex].options, sessionCards[currentIndex].answer.split('').filter(char => sessionCards[currentIndex].syllable.includes('_')).join('') || sessionCards[currentIndex].answer]
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 4)
        .sort()
    : [];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (activeSet.type === 'fill-in' && isRevealed) {
      timeout = setTimeout(() => {
        handleNext();
      }, 1500);
    }
    return () => clearTimeout(timeout);
  }, [isRevealed, activeSet.type, currentIndex]);

  useEffect(() => {
    const saved = localStorage.getItem('abakada_user_sets');
    if (saved) setUserSets(JSON.parse(saved));
    
    const savedMode = localStorage.getItem('abakada_dark_mode');
    if (savedMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const shuffleArray = (array: Flashcard[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleAddMoreNumbers = () => {
    const currentMax = sessionCards.length;
    const newCards = Array.from({length: 10}, (_, i) => ({ syllable: String(currentMax + i + 1) }));
    setSessionCards([...sessionCards, ...newCards]);
  };

  const handleShuffle = () => {
    setSessionCards(shuffleArray(sessionCards));
    setCurrentIndex(0);
    setDirection(0);
    setIsRevealed(false);
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('abakada_dark_mode', String(newMode));
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const saveToStorage = (sets: CardSet[]) => {
    localStorage.setItem('abakada_user_sets', JSON.stringify(sets));
  };

  const getFontSizeClass = (text: string) => {
    const len = text?.length || 0;
    if (len <= 2) return "text-[140px] sm:text-[180px]";
    if (len <= 4) return "text-[100px] sm:text-[130px]";
    if (len <= 6) return "text-[70px] sm:text-[90px]";
    if (len <= 10) return "text-[50px] sm:text-[60px]";
    return "text-[32px] sm:text-[40px] break-words";
  };

  const handleStartStudy = (set: CardSet) => {
    if (set.id === 'pop-words-game') {
      startPopWords();
      return;
    }
    let finalCards = [...set.cards];
    
    // Dynamic ABAKADA generation if it's the specific preset
    if (set.id === 'abakada-phonetic') {
      const consonants = ['B', 'D', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'Ng', 'P', 'R', 'S', 'T', 'V', 'W', 'Y', 'Z'];
      finalCards = consonants.map(c => ({ syllable: c + selectedVowel }));
    }

    setActiveSet({ ...set, cards: finalCards });
    setSessionCards(finalCards);
    setCurrentIndex(0);
    setIsRevealed(false);
    setView('study');
  };

  const startPopWords = () => {
    const intermediateSets = PRESET_SETS.filter(s => s.tier === 'Intermediate' && !s.isChallenge);
    const allCards = intermediateSets.flatMap(s => s.cards).filter(c => c.image && c.syllable);
    
    if (allCards.length === 0) return;

    setPopWordsState({
      score: 0,
      timeLeft: 30,
      currentCard: null,
      currentCategory: '',
      feedbackType: 'none',
      floatingEmojis: []
    });
    setView('pop-words');
    generateNextRound(allCards);

    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    gameTimerRef.current = setInterval(() => {
      setPopWordsState(prev => {
        if (prev.timeLeft <= 0) {
          clearInterval(gameTimerRef.current!);
          return prev;
        }
        return { ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) };
      });
    }, 1000);
  };

  const generateNextRound = (cardsSource?: Flashcard[]) => {
    const intermediateSets = PRESET_SETS.filter(s => s.tier === 'Intermediate' && !s.isChallenge);
    const source = cardsSource || intermediateSets.flatMap(s => s.cards).filter(c => c.image);
    
    // Find the category (set name)
    const randomSet = intermediateSets[Math.floor(Math.random() * intermediateSets.length)];
    const correctCard = randomSet.cards[Math.floor(Math.random() * randomSet.cards.length)];
    
    const count = 4 + Math.floor(Math.random() * 2); // 4-5 emojis
    const wrongCards = source.filter(c => c.image !== correctCard.image);
    const selectedWrongs = [];
    for (let i = 0; i < count - 1; i++) {
       selectedWrongs.push(wrongCards[Math.floor(Math.random() * wrongCards.length)]);
    }

    const emojis = [correctCard, ...selectedWrongs].map((c, i) => ({
      id: Date.now() + i,
      emoji: c.image!,
      isCorrect: c.image === correctCard.image,
      x: 20 + Math.random() * 60, 
      y: 20 + Math.random() * 60,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4
    }));

    setPopWordsState(prev => ({
      ...prev,
      currentCard: correctCard,
      currentCategory: randomSet.name,
      feedbackType: 'none',
      floatingEmojis: emojis
    }));
  };

  useEffect(() => {
    if (view === 'pop-words' && popWordsState.timeLeft > 0) {
      const moveEmojis = () => {
        setPopWordsState(prev => {
          const newList = prev.floatingEmojis.map(e => {
            let nx = e.x + e.vx;
            let ny = e.y + e.vy;
            let nvx = e.vx;
            let nvy = e.vy;

            // Bounce off edges
            if (nx < 10 || nx > 90) nvx *= -1;
            if (ny < 15 || ny > 85) nvy *= -1;

            return { ...e, x: nx, y: ny, vx: nvx, vy: nvy };
          });

          // Simple Circle Collision (physics bump)
          const radius = 18; // Increased from 10 to 18 for larger emojis (~18% of screen)
          for (let i = 0; i < newList.length; i++) {
            for (let j = i + 1; j < newList.length; j++) {
              const dx = newList[i].x - newList[j].x;
              const dy = newList[i].y - newList[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < radius) {
                // Collide! Swap some velocity
                const tempVx = newList[i].vx;
                const tempVy = newList[i].vy;
                newList[i].vx = newList[j].vx;
                newList[i].vy = newList[j].vy;
                newList[j].vx = tempVx;
                newList[j].vy = tempVy;

                // Move them apart so they don't stick
                const push = (radius - dist) / 2;
                const ux = dx / dist;
                const uy = dy / dist;
                newList[i].x += ux * push;
                newList[i].y += uy * push;
                newList[j].x -= ux * push;
                newList[j].y -= uy * push;
              }
            }
          }

          return { ...prev, floatingEmojis: newList };
        });
        gameLoopRef.current = requestAnimationFrame(moveEmojis);
      };
      gameLoopRef.current = requestAnimationFrame(moveEmojis);
      return () => {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      };
    } else if (view === 'pop-words' && popWordsState.timeLeft <= 0) {
       // Game over
       saveHighScore(popWordsState.score);
       setView('congrats');
    }
  }, [view, popWordsState.timeLeft === 0]);

  const saveHighScore = (score: number) => {
    const newScore = { score, timestamp: Date.now() };
    const saved = localStorage.getItem('abakada_high_scores');
    const existing = saved ? JSON.parse(saved) : [];
    const updated = [newScore, ...existing].sort((a, b) => b.score - a.score).slice(0, 5);
    setHighScores(updated);
    localStorage.setItem('abakada_high_scores', JSON.stringify(updated));
  };

  const handleEmojiPop = (id: number, isCorrect: boolean) => {
    if (isCorrect) {
      setPopWordsState(prev => ({
        ...prev,
        score: prev.score + 10,
        timeLeft: prev.timeLeft + 3,
        feedbackType: 'correct'
      }));
      // Small pause before next
      setTimeout(() => generateNextRound(), 300);
    } else {
      setPopWordsState(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 5),
        floatingEmojis: prev.floatingEmojis.filter(e => e.id !== id),
        feedbackType: 'wrong'
      }));
      if ('vibrate' in navigator) navigator.vibrate(200);
      setTimeout(() => setPopWordsState(prev => ({ ...prev, feedbackType: 'none' })), 300);
    }
  };

  const updateAbakadaVowel = (vowel: string) => {
    setSelectedVowel(vowel);
    const consonants = ['B', 'D', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'Ng', 'P', 'R', 'S', 'T', 'V', 'W', 'Y', 'Z'];
    const newCards = consonants.map(c => ({ syllable: c + vowel }));
    
    setSessionCards(newCards);
    setActiveSet({ ...activeSet, cards: newCards });
    setCurrentIndex(0);
    setDirection(0);
    setIsRevealed(false);
    setIsVowelMenuOpen(false);
  };

  const handleCreateNew = () => {
    const newSet: CardSet = {
      id: Date.now().toString(),
      name: 'New Custom Set',
      cards: [{ syllable: '' }]
    };
    setEditingSet(newSet);
    setView('editor');
  };

  const handleEditSet = (set: CardSet) => {
    setEditingSet({ ...set });
    setView('editor');
  };

  const handleDeleteSet = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      const updated = userSets.filter(s => s.id !== confirmDeleteId);
      setUserSets(updated);
      saveToStorage(updated);
      setConfirmDeleteId(null);
    }
  };

  const handleSaveEditor = () => {
    if (!editingSet) return;
    const cleanCards = editingSet.cards.filter(c => c.syllable.trim() !== '');
    const finalSet = { ...editingSet, cards: cleanCards };
    
    if (finalSet.cards.length === 0) {
       alert('Please add at least one card.');
       return;
    }

    const existingIndex = userSets.findIndex(s => s.id === finalSet.id);
    let updated;
    if (existingIndex > -1) {
      updated = [...userSets];
      updated[existingIndex] = finalSet;
    } else {
      updated = [...userSets, finalSet];
    }
    
    setUserSets(updated);
    saveToStorage(updated);
    setView('library');
    setEditingSet(null);
  };

  const handleNext = () => {
    if (currentIndex < sessionCards.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      setIsRevealed(false);
    } else {
      setView('congrats');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      setIsRevealed(false);
    } else {
      setView('library');
    }
  };

  const progress = sessionCards.length > 0 ? ((currentIndex + 1) / sessionCards.length) * 100 : 0;

  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : direction < 0 ? -300 : 0,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : direction > 0 ? -300 : 0,
      opacity: 0,
      scale: 0.9,
    }),
  };

  return (
    <div className={`flex flex-col h-screen max-w-full overflow-hidden bg-background transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-[120px] drop-shadow-2xl"
            >
              📚
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-4xl font-black text-primary tracking-tighter"
            >
              Abakada
            </motion.h1>
            <motion.div
              className="mt-4 flex gap-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2 h-2 rounded-full bg-secondary"
                />
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <>
            {view === 'library' && (
          <motion.div 
            key="library"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col h-full"
          >
            <header className="px-6 py-10 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-4xl font-black text-yellow-500 tracking-tight">Library</h1>
                  <p className="text-on-surface-variant font-bold">Choose your adventure</p>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className="h-14 w-14 rounded-2xl bg-surface-container border-4 border-surface-variant flex items-center justify-center active-press chunky-shadow-sm transition-all"
                >
                  {isDarkMode ? <Sun className="text-yellow-500" size={28} /> : <Moon className="text-secondary" size={28} />}
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto px-6 pb-24 space-y-8">
              {['Beginner', 'Intermediate', 'Expert', 'Challenge'].map(tier => {
                const tierSets = PRESET_SETS.filter(set => set.tier === tier);
                if (tierSets.length === 0) return null;
                return (
                  <section key={tier} className={tier === 'Challenge' ? 'bg-primary/5 -mx-6 px-6 py-6 rounded-t-[40px] border-t-4 border-primary/10' : ''}>
                    <h2 className={`text-lg font-black mb-4 flex items-center gap-2 ${tier === 'Challenge' ? 'text-primary' : 'text-on-surface'}`}>
                      <Star size={20} className={tier === 'Beginner' ? 'text-yellow-500 fill-yellow-500' : tier === 'Intermediate' ? 'text-orange-500 fill-orange-500' : tier === 'Challenge' ? 'text-primary fill-primary' : 'text-red-500 fill-red-500'} />
                      {tier}
                    </h2>
                    
                    {tier === 'Beginner' && (
                      <div className="flex gap-2 mb-4">
                        <button 
                          onClick={() => setAppMode('read')}
                          className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg border-4 transition-all active-press ${appMode === 'read' ? 'bg-primary text-on-primary border-primary-fixed-dim chunky-shadow-sm' : 'bg-surface-container text-on-surface-variant border-surface-variant text-opacity-70'}`}
                        >
                          <BookOpen size={20} /> Read
                        </button>
                        <button 
                          onClick={() => setAppMode('write')}
                          className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg border-4 transition-all active-press ${appMode === 'write' ? 'bg-tertiary-container text-on-tertiary-container border-tertiary-fixed-dim chunky-shadow-card' : 'bg-surface-container text-on-surface-variant border-surface-variant text-opacity-70'}`}
                        >
                          <Edit3 size={20} /> Write
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {(tier === 'Challenge' ? tierSets.filter(s => s.isChallenge) : tierSets.filter(s => !s.isChallenge)).map((set) => (
                        <button
                          key={set.id}
                          onClick={() => handleStartStudy(set)}
                          className={`flex flex-col items-center justify-between p-4 border-4 rounded-[28px] chunky-shadow-card active-press group min-h-[160px] ${tier === 'Challenge' ? 'bg-white border-primary/20' : 'bg-surface-container-lowest border-surface-variant'}`}
                        >
                          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-2 ${tier === 'Challenge' ? 'bg-primary/10 text-primary' : 'bg-secondary-fixed text-on-secondary-container'}`}>
                            {tier === 'Challenge' ? <Trophy size={32} /> : <BookOpen size={32} />}
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center justify-center">
                            <h3 className="font-black text-lg leading-tight text-on-surface line-clamp-2">{set.name}</h3>
                            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mt-1">{set.cards.length} Cards</p>
                          </div>
                          
                          <div className="mt-2 w-full h-10 flex items-center justify-center rounded-xl bg-surface-container group-hover:bg-tertiary-container transition-colors">
                            <Play size={18} className="text-on-surface group-hover:text-on-tertiary-container" />
                          </div>
                        </button>
                      ))}
                    </div>

                    {tier === 'Challenge' && tierSets.some(s => s.isGame) && (
                      <div className="mt-8">
                        <h3 className="text-sm font-black text-on-surface-variant mb-4 flex items-center gap-2 uppercase tracking-widest px-2">
                          <Play size={16} className="text-tertiary" /> Games
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {tierSets.filter(s => s.isGame).map((set) => (
                            <button
                              key={set.id}
                              onClick={() => handleStartStudy(set)}
                              className="p-5 bg-tertiary text-on-tertiary border-4 border-tertiary-fixed-dim rounded-2xl flex flex-col items-center justify-center gap-3 chunky-shadow-secondary active-press group text-center"
                            >
                              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                                <Trophy size={32} />
                              </div>
                              <div>
                                <h4 className="font-black text-lg leading-tight">{set.name}</h4>
                                <div className="mt-2 flex items-center justify-center gap-1 opacity-80">
                                   <Star size={12} fill="currentColor" />
                                   <span className="text-xs font-bold">Pop emojis!</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>

                        {highScores.length > 0 && (
                          <div className="mt-8 px-4 py-6 bg-white/50 rounded-3xl border-2 border-dashed border-primary/20">
                            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4 text-center">🏆 Leaderboard</h4>
                            <div className="space-y-2">
                              {highScores.map((s, i) => (
                                <div key={s.timestamp} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-primary/40 w-4">#{i+1}</span>
                                    <span className="font-bold text-on-surface-variant">
                                      {new Date(s.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <span className="font-black text-primary text-base">{s.score} pts</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}

              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                    <Plus size={20} className="text-tertiary" />
                    My Sets
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {userSets.map((set) => (
                    <div key={set.id} className="relative group">
                       <button
                        onClick={() => handleStartStudy(set)}
                        className="w-full min-h-[160px] p-4 bg-surface-container-lowest border-4 border-surface-variant rounded-[28px] flex flex-col items-center justify-between chunky-shadow-card active-press"
                      >
                         <div className="h-16 w-16 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-container mb-2">
                           <ArrowRight size={32} />
                         </div>
                         <div className="flex-1 flex flex-col items-center justify-center text-center">
                           <h3 className="font-black text-lg leading-tight text-on-surface line-clamp-2">{set.name}</h3>
                           <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mt-1">{set.cards.length} Cards</p>
                         </div>
                         <div className="w-full h-8" /> {/* Space for actions overlay */}
                      </button>
                      
                      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditSet(set); }}
                          className="flex-1 h-10 bg-surface-container rounded-xl flex items-center justify-center hover:bg-secondary-fixed active-press border-2 border-surface-variant/50"
                        >
                          <Edit3 size={18} />
                        </button>
                        {confirmDeleteId === set.id ? (
                          <div className="flex-[2] flex gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                              className="flex-1 h-10 bg-surface-variant text-on-surface-variant rounded-xl flex items-center justify-center font-black text-[10px] uppercase"
                            >
                              No
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); confirmDelete(); }}
                              className="flex-1 h-10 bg-error text-white rounded-xl flex items-center justify-center font-black text-[10px] uppercase"
                            >
                              Del
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSet(set.id); }}
                            className="flex-1 h-10 bg-surface-container rounded-xl flex items-center justify-center hover:bg-error-container text-on-surface hover:text-on-error-container active-press border-2 border-surface-variant/50"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={handleCreateNew}
                    className="min-h-[160px] p-6 border-4 border-dashed border-surface-variant rounded-[28px] flex flex-col items-center justify-center gap-2 hover:bg-surface-container-lowest hover:border-tertiary transition-all group"
                  >
                    <Plus size={40} className="text-tertiary" />
                    <span className="font-black text-on-surface-variant uppercase tracking-widest text-xs">New Set</span>
                  </button>
                </div>
              </section>
            </main>
          </motion.div>
        )}

        {view === 'study' && (
          <motion.div 
            key="study"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col h-full bg-background"
          >
            <header className="flex justify-between items-center px-6 py-4 border-b-4 border-surface-container bg-surface-container-lowest z-50">
              <button 
                onClick={() => setView('library')}
                className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-surface-container active-press"
              >
                <X size={16} />
              </button>
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1/3 text-center">
                <span className="font-black text-xl text-yellow-500 truncate block">{activeSet.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {activeSet.id === 'abakada-phonetic' && (
                  <button 
                    onClick={() => setIsVowelMenuOpen(true)}
                    className="h-10 px-3 flex items-center justify-center rounded-xl bg-primary-container text-on-primary-container font-black text-lg border-2 border-primary active-press"
                  >
                    {selectedVowel.toUpperCase()}
                  </button>
                )}
                {appMode === 'write' ? (
                  ['consonants-only', 'abc-eng', 'vowels'].includes(activeSet.id) && (
                    <button 
                      onClick={() => setIsLowerCase(!isLowerCase)}
                      className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-container font-black text-lg border-2 border-secondary active-press"
                    >
                      {isLowerCase ? 'a' : 'A'}
                    </button>
                  )
                ) : (
                  <button 
                    onClick={handleShuffle}
                    className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-container active-press"
                  >
                    <Shuffle size={20} />
                  </button>
                )}
              </div>
            </header>

            <AnimatePresence>
              {isVowelMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                  onClick={() => setIsVowelMenuOpen(false)}
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-surface-container-highest p-8 rounded-[40px] border-4 border-surface-variant w-full max-w-[400px] text-center"
                    onClick={e => e.stopPropagation()}
                  >
                    <h3 className="text-2xl font-black mb-8 text-on-surface">Select Vowel Partner</h3>
                    <div className="grid grid-cols-5 gap-3">
                      {['a', 'e', 'i', 'o', 'u'].map(v => (
                        <button
                          key={v}
                          onClick={() => updateAbakadaVowel(v)}
                          className={`h-16 rounded-2xl flex items-center justify-center font-black text-2xl border-4 transition-all active-press
                            ${selectedVowel === v 
                              ? 'bg-primary text-on-primary border-primary-fixed-dim chunky-shadow-secondary' 
                              : 'bg-surface-container text-on-surface border-surface-variant'}`}
                        >
                          {v.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-hidden relative">
              <div className="w-full max-w-[500px] flex items-center gap-4 mb-8">
                <div className="h-4 flex-1 bg-secondary-fixed rounded-full border-2 border-secondary-fixed-dim overflow-hidden relative">
                  <motion.div
                    className="h-full bg-tertiary rounded-full relative"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30">
                      <div className="bg-tertiary p-1 rounded-full border-2 border-white">
                        <Star size={10} fill="white" className="text-white" />
                      </div>
                    </div>
                  </motion.div>
                </div>
                <span className="font-bold text-on-surface-variant whitespace-nowrap">
                  {currentIndex + 1} / {sessionCards.length}
                </span>
              </div>

              <div className="w-full max-w-[500px] relative h-[420px] sm:h-[450px] flex items-center justify-center">
                <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                  <motion.div
                    key={`${currentIndex}-${sessionCards[currentIndex]?.syllable}`}
                    custom={direction}
                    variants={cardVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    className="w-full h-full bg-surface-container-lowest rounded-[40px] border-4 border-surface-variant chunky-shadow-card flex flex-col items-center justify-center p-6 text-center overflow-hidden relative"
                  >
                    {activeSet.type === 'fill-in' ? (
                      <div className="flex flex-col items-center justify-center gap-8 w-full">
                        {sessionCards[currentIndex]?.image && (
                          <motion.div 
                            className="text-8xl sm:text-[120px] drop-shadow-md"
                            animate={isRevealed ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                          >
                            {sessionCards[currentIndex].image}
                          </motion.div>
                        )}
                        <motion.h1 
                          className={`text-6xl sm:text-8xl font-black tracking-widest mt-4 ${isRevealed ? 'text-primary' : 'text-on-surface'}`}
                          animate={isRevealed ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                        >
                          {isRevealed ? sessionCards[currentIndex]?.answer : sessionCards[currentIndex]?.syllable}
                        </motion.h1>
                        
                        {!isRevealed && sessionCards[currentIndex]?.options && (
                          <div className="flex justify-center flex-wrap gap-4 mt-8 w-full max-w-md">
                            {(() => {
                              const missingPart = sessionCards[currentIndex].answer && sessionCards[currentIndex].syllable.indexOf('_') !== -1
                                ? sessionCards[currentIndex].answer[sessionCards[currentIndex].syllable.indexOf('_')]
                                : sessionCards[currentIndex].answer;
                              
                              return [...(sessionCards[currentIndex].options || []), missingPart]
                                .filter((v, i, a) => v && a.indexOf(v) === i)
                                .sort(() => Math.random() - 0.5)
                                .map((opt, i) => (
                                  <motion.button
                                    key={`${currentIndex}-${opt}-${i}`}
                                    onClick={() => {
                                      if (opt?.toUpperCase() === missingPart?.toUpperCase()) {
                                        setIsRevealed(true);
                                      } else {
                                        setWrongGuessId(i);
                                        if ('vibrate' in navigator) navigator.vibrate(100);
                                        setTimeout(() => setWrongGuessId(null), 400);
                                      }
                                    }}
                                    animate={wrongGuessId === i ? { x: [-10, 10, -10, 10, 0] } : {}}
                                    transition={{ duration: 0.4 }}
                                    className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl font-black text-3xl sm:text-4xl border-4 chunky-shadow-card active-press ${wrongGuessId === i ? 'bg-error-container text-on-error-container border-error' : 'bg-surface-container text-on-surface border-surface-variant hover:bg-surface-container-high'}`}
                                  >
                                    {opt}
                                  </motion.button>
                                ));
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (appMode === 'write' && activeSet.tier === 'Beginner') ? (
                      <>
                        <div className="w-full h-[300px] sm:h-[340px] relative pointer-events-auto">
                           <TracingCanvas text={isLowerCase ? sessionCards[currentIndex]?.syllable?.toLowerCase() : sessionCards[currentIndex]?.syllable} onClearRef={ref => clearCanvasRef.current = ref} onDrawEnd={() => { if (!isRecording && !isPlaying) handleAudioAction(false, true); }} />
                        </div>
                        <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
                          <button onClick={() => clearCanvasRef.current?.()} className="h-12 w-12 rounded-full bg-surface-container border-2 border-surface-variant flex items-center justify-center active-press hover:bg-surface-variant transition-colors shadow-sm">
                            <RotateCcw size={20} className="text-on-surface-variant" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-6">
                        {sessionCards[currentIndex]?.image && (
                          <motion.div 
                            className="text-6xl sm:text-[100px] drop-shadow-sm mb-2"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4 }}
                          >
                            {sessionCards[currentIndex].image}
                          </motion.div>
                        )}
                        <h1 className={`${getFontSizeClass(sessionCards[currentIndex]?.syllable)} leading-none font-black tracking-tighter text-on-surface`}>
                          {isLowerCase ? sessionCards[currentIndex]?.syllable?.toLowerCase() : sessionCards[currentIndex]?.syllable}
                        </h1>
                        
                        <div className="mt-8 flex items-center justify-center" onPointerLeave={endPress} onMouseLeave={endPress}>
                          <button
                             onPointerDown={startPress}
                             onPointerUp={endPress}
                             onClick={handleAudioClick}
                             className={`group relative h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 flex items-center justify-center transition-all active-press 
                             ${isRecording ? 'bg-error text-error-container border-error-container chunky-shadow-sm animate-pulse' 
                             : hasAudio ? (isPlaying ? 'bg-primary text-on-primary border-primary-fixed-dim chunky-shadow-sm' : 'bg-primary-container text-on-primary-container border-primary chunky-shadow-sm') 
                             : 'bg-surface-container-high text-on-surface-variant border-surface-variant chunky-shadow-sm'}`}
                          >
                             {isRecording ? <Square size={28} className="fill-current" /> :
                               hasAudio ? <Volume2 size={28} className={isPlaying ? "animate-pulse" : ""} /> :
                               <Mic size={28} />}
                              
                             {!hasAudio && !isRecording && (
                               <span className="absolute -bottom-10 bg-surface-variant text-on-surface-variant text-xs font-bold px-3 py-1 rounded-lg opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                 Tap to record
                               </span>
                             )}
                             {hasAudio && !isRecording && !isPlaying && (
                               <span className="absolute -bottom-10 bg-surface-variant text-on-surface-variant text-xs font-bold px-3 py-1 rounded-lg opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                 Hold to re-record
                               </span>
                             )}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>

            <footer className="px-6 py-6 pb-12 flex flex-col gap-4 max-w-[500px] mx-auto w-full">
              {activeSet.type !== 'fill-in' && (
                <div className="flex gap-4 w-full">
                  <button
                    onClick={handleBack}
                    className={`flex-1 h-16 rounded-2xl flex items-center justify-center gap-2 font-black text-xl border-4 active-press transition-all
                      ${currentIndex === 0 && activeSet.type !== 'fill-in' ? 'bg-surface-container-low text-on-surface-variant' : 'bg-surface-container shadow-[0_4px_0_0_theme(colors.surface-variant)]'}`}
                  >
                    <ArrowLeft size={24} strokeWidth={3} /> Back
                  </button>
                  <button
                    onClick={handleNext}
                    className={`flex-1 h-16 rounded-2xl flex items-center justify-center gap-2 font-black text-xl border-4 active-press transition-all bg-tertiary-container text-on-tertiary-container border-tertiary-fixed-dim shadow-[0_4px_0_0_theme(colors.tertiary-fixed-dim)] hover:brightness-105`}
                  >
                    {currentIndex === sessionCards.length - 1 ? ((appMode === 'write' && activeSet.tier === 'Beginner') ? 'Done' : 'Finish') : 'Next'} <ArrowRight size={24} strokeWidth={3} />
                  </button>
                </div>
              )}
              {activeSet.id === 'numbers' && (
                <div className="flex justify-center mt-2">
                  <button onClick={handleAddMoreNumbers} className="px-6 py-3 bg-surface-container-low text-on-surface-variant hover:text-on-surface rounded-full text-sm font-bold border-2 border-surface-variant border-dashed hover:bg-surface-variant transition-colors active-press flex items-center gap-2">
                    <Plus size={16} /> Add 10 More Numbers
                  </button>
                </div>
              )}
            </footer>
          </motion.div>
        )}

        {view === 'pop-words' && (
          <motion.div 
            key="pop-words"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              backgroundColor: popWordsState.feedbackType === 'correct' ? '#4ade80' : popWordsState.feedbackType === 'wrong' ? '#f87171' : '#6750A4'
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            <header className="px-6 py-4 flex justify-between items-center text-white z-30">
              <button 
                onClick={() => { setView('library'); if (gameTimerRef.current) clearInterval(gameTimerRef.current); }}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-white/20 active-press"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-xs font-black uppercase tracking-widest opacity-70">Score</span>
                <span className="text-3xl font-black">{popWordsState.score}</span>
              </div>
              <div className={`flex flex-col items-center h-16 w-16 justify-center rounded-full border-4 border-white/30 ${popWordsState.timeLeft < 10 ? 'bg-error animate-pulse' : 'bg-white/20'}`}>
                <span className="text-xs font-black uppercase tracking-tight">Time</span>
                <span className="text-xl font-black">{popWordsState.timeLeft}s</span>
              </div>
            </header>

            <main className="flex-1 relative overflow-hidden">
               <div className="absolute inset-x-0 top-12 flex flex-col items-center z-10 px-6 text-center">
                  <motion.div
                    key={popWordsState.currentCategory + popWordsState.currentCard?.syllable}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-white/60 text-sm font-black uppercase tracking-[0.3em] mb-1">
                      {popWordsState.currentCategory}
                    </span>
                    <h1 className="text-6xl sm:text-9xl font-black text-white drop-shadow-[0_8px_0_rgba(0,0,0,0.2)] tracking-tighter leading-tight">
                      {popWordsState.currentCard?.syllable}
                    </h1>
                  </motion.div>
               </div>

               <div className="absolute inset-0 z-20">
                  <AnimatePresence mode="popLayout">
                    {popWordsState.floatingEmojis.map(e => (
                      <motion.button
                        key={e.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: 1,
                          opacity: 1,
                          left: `${e.x}%`,
                          top: `${e.y}%`
                        }}
                        exit={{ 
                          scale: 2.5, 
                          opacity: 0,
                          transition: { duration: 0.2 }
                        }}
                        onClick={() => handleEmojiPop(e.id, e.isCorrect)}
                        className="absolute h-32 w-32 sm:h-48 sm:w-48 flex items-center justify-center text-8xl sm:text-[10rem] cursor-pointer active:scale-125 transition-transform"
                        style={{ transform: 'translate(-50%, -50%)' }}
                      >
                         <motion.div 
                            animate={{ 
                              y: [0, -15, 0],
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0]
                            }} 
                            transition={{ 
                              duration: 2 + Math.random(), 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]"
                          >
                            {e.emoji}
                          </motion.div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
               </div>
            </main>
          </motion.div>
        )}

        {view === 'congrats' && (
          <motion.div 
            key="congrats"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background relative overflow-hidden"
          >
            {/* Animated Characters */}
            <div className="absolute inset-0 pointer-events-none flex items-end justify-around pb-8 sm:pb-16 z-0">
              {['🐶', '🐰', '🦊', '🐼', '🐯', '🐸'].map((emoji, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 200, opacity: 0, rotate: -15 }}
                  animate={{ y: [0, -60, 0], opacity: 1, rotate: [-15, 15, -15] }}
                  transition={{ 
                    y: { repeat: Infinity, duration: 0.6 + (i * 0.15), repeatType: "reverse", ease: "easeOut", delay: i * 0.1 },
                    rotate: { repeat: Infinity, duration: 1.2 + (i * 0.1), ease: "easeInOut", delay: i * 0.1 },
                    opacity: { duration: 0.5, delay: i * 0.1 }
                  }}
                  className="text-5xl sm:text-7xl drop-shadow-md"
                >
                  {emoji}
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ rotate: -10, y: 0 }}
              animate={{ rotate: 10, y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
              className="relative mb-12 z-10"
            >
              <div className="h-48 w-48 rounded-full bg-yellow-400 border-8 border-yellow-500/20 flex items-center justify-center shadow-xl">
                <Trophy size={100} className="text-white drop-shadow-lg" fill="currentColor" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -top-4 -right-4 bg-tertiary p-4 rounded-full border-4 border-white shadow-lg"
              >
                <Star size={32} className="text-white" fill="currentColor" />
              </motion.div>
            </motion.div>

            <h1 className="text-5xl font-black text-yellow-500 mb-4 tracking-tight z-10 drop-shadow-sm">
              {view === 'pop-words' || activeSet.id === 'pop-words-game' ? 'Game Over!' : 'Amazing!'}
            </h1>
            
            <div className="mt-4 flex flex-col items-center gap-2 z-10">
              {view === 'pop-words' || activeSet.id === 'pop-words-game' ? (
                <>
                  <span className="text-on-surface-variant font-bold text-lg uppercase tracking-widest opacity-60">Final Score</span>
                  <span className="text-7xl font-black text-primary tracking-tighter">{popWordsState.score}</span>
                  <div className="mt-6 px-10 py-3 bg-primary/10 rounded-full font-black text-primary text-xl border-4 border-primary/20">
                    {popWordsState.score > 200 ? 'LEGENDARY!' : popWordsState.score > 100 ? 'AWESOME!' : popWordsState.score > 50 ? 'GREAT JOB!' : 'GOOD TRY!'}
                  </div>
                </>
              ) : (
                <p className="text-2xl font-bold text-on-surface-variant mb-4">
                  You finished the <span className="text-secondary">{activeSet.name}</span> set!
                </p>
              )}
            </div>

            <div className="w-full max-w-[400px] space-y-4 z-10 mt-12">
              <button 
                onClick={() => { 
                  if (activeSet.id === 'pop-words-game') {
                    startPopWords();
                  } else {
                    handleStartStudy(activeSet);
                    setCurrentIndex(0); 
                    setIsRevealed(false); 
                  }
                }}
                className="w-full h-18 bg-tertiary-container text-on-tertiary-container border-4 border-tertiary-fixed-dim rounded-2xl font-black text-2xl active-press chunky-shadow-secondary hover:brightness-105"
              >
                {activeSet.id === 'pop-words-game' ? 'Play Again' : 'Try Again'}
              </button>
              <button 
                onClick={() => setView('library')}
                className="w-full h-18 bg-surface-container text-on-surface border-4 border-surface-variant rounded-2xl font-bold text-2xl active-press hover:bg-surface-variant transition-colors"
              >
                Back to Library
              </button>
            </div>
          </motion.div>
        )}


        {view === 'editor' && editingSet && (
          <motion.div 
            key="editor"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="flex-1 flex flex-col h-full bg-surface-container-lowest z-[60]"
          >
            <header className="px-6 py-6 border-b-4 border-surface-variant flex items-center justify-between sticky top-0 bg-surface-container-lowest z-50">
              <button onClick={() => setView('library')} className="font-bold text-on-surface-variant h-12 flex items-center px-4 rounded-xl hover:bg-surface-container active-press">Cancel</button>
              <h2 className="text-xl font-black">Set Editor</h2>
              <button onClick={handleSaveEditor} className="font-bold text-tertiary text-lg h-12 flex items-center px-4 rounded-xl hover:bg-tertiary-container active-press">Save</button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
              <div className="space-y-4">
                <label className="font-black text-on-surface-variant text-sm uppercase px-2 tracking-widest">Set Name</label>
                <input 
                  type="text" 
                  value={editingSet.name}
                  onChange={(e) => setEditingSet({...editingSet, name: e.target.value})}
                  className="w-full p-6 bg-surface-container rounded-[24px] border-4 border-surface-variant font-bold focus:outline-none focus:border-secondary shadow-inner text-xl"
                  placeholder="e.g. My Animals"
                />
              </div>

              <div className="space-y-4">
                <label className="font-black text-on-surface-variant text-sm uppercase px-2 tracking-widest">Cards ({editingSet.cards.length})</label>
                {editingSet.cards.map((card, idx) => (
                  <div key={idx} className="flex flex-col gap-3 bg-surface-container border-4 border-surface-variant p-5 rounded-[32px] relative group justify-center">
                    <input 
                      value={card.syllable}
                      placeholder="A"
                      onChange={(e) => {
                        const updated = [...editingSet.cards];
                        updated[idx].syllable = e.target.value;
                        setEditingSet({...editingSet, cards: updated});
                      }}
                      className="w-full p-6 bg-surface-container-lowest border-2 border-surface-variant rounded-2xl font-black text-4xl text-center focus:border-primary focus:outline-none"
                    />
                    
                    {editingSet.cards.length > 1 && (
                      <button 
                        onClick={() => {
                          const updated = editingSet.cards.filter((_, i) => i !== idx);
                          setEditingSet({...editingSet, cards: updated});
                        }}
                        className="absolute -top-3 -right-3 h-10 w-10 bg-error text-white rounded-full flex items-center justify-center border-4 border-surface-container shadow-md active-press"
                      >
                        <X size={20} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                ))}

                <button 
                  onClick={() => setEditingSet({...editingSet, cards: [...editingSet.cards, {syllable: ''}]})}
                  className="w-full p-8 bg-surface-container rounded-[32px] border-4 border-dashed border-surface-variant flex flex-col items-center justify-center gap-2 hover:bg-surface-container-lowest hover:border-tertiary transition-all group"
                >
                  <div className="h-16 w-16 rounded-full bg-tertiary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={40} className="text-on-tertiary-container" />
                  </div>
                  <span className="font-black text-on-surface-variant text-lg">Add Another Card</span>
                </button>
              </div>
            </main>
          </motion.div>
        )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


