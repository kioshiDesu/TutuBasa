/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Star, ArrowLeft, ArrowRight, Plus, Trash2, Edit3, BookOpen, ChevronRight, Play, Trophy, Moon, Sun, Download, Shuffle } from 'lucide-react';

interface Flashcard {
  syllable: string;
}

interface CardSet {
  id: string;
  name: string;
  cards: Flashcard[];
  isPreset?: boolean;
}

const PRESET_SETS: CardSet[] = [
  {
    id: 'abakada-phonetic',
    name: 'Abakada (Consonants)',
    isPreset: true,
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
    name: 'Just Consonants',
    isPreset: true,
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
    name: 'Vowels (Patinig)',
    isPreset: true,
    cards: [
      { syllable: 'A' }, { syllable: 'E' }, { syllable: 'I' },
      { syllable: 'O' }, { syllable: 'U' }
    ],
  },
  {
    id: 'abc-eng',
    name: 'English ABCs',
    isPreset: true,
    cards: Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(char => ({
      syllable: char
    })),
  },
  {
    id: 'numbers',
    name: 'Numbers 1-10',
    isPreset: true,
    cards: Array.from({length: 10}, (_, i) => ({ syllable: String(i + 1) })),
  }
];

type View = 'library' | 'study' | 'editor' | 'congrats' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('library');
  const [activeSet, setActiveSet] = useState<CardSet>(PRESET_SETS[0]);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [userSets, setUserSets] = useState<CardSet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [editingSet, setEditingSet] = useState<CardSet | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userSets, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "abakada_custom_sets.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleStartStudy = (set: CardSet) => {
    setActiveSet(set);
    setSessionCards([...set.cards]);
    setCurrentIndex(0);
    setView('study');
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
    } else {
      setView('congrats');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
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
        {view === 'library' && (
          <motion.div 
            key="library"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col h-full"
          >
            <header className="px-6 py-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-yellow-500 tracking-tight">Library</h1>
                <p className="text-on-surface-variant font-medium">Choose a set to learn</p>
              </div>
              <button 
                onClick={() => setView('settings')}
                className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center active-press"
              >
                <Settings className="text-on-surface" size={24} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto px-6 pb-24 space-y-8">
              <section>
                <h2 className="text-lg font-black text-on-surface mb-4 flex items-center gap-2">
                  <Star size={20} className="text-yellow-500 fill-yellow-500" />
                  Presets
                </h2>
                <div className="grid gap-3">
                  {PRESET_SETS.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => handleStartStudy(set)}
                      className="w-full p-5 bg-surface-container-lowest border-4 border-surface-variant rounded-2xl flex items-center justify-between chunky-shadow-card active-press group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-container">
                          <BookOpen size={24} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-xl">{set.name}</h3>
                          <p className="text-on-surface-variant text-sm font-semibold">{set.cards.length} Cards</p>
                        </div>
                      </div>
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-surface-container group-hover:bg-tertiary-container transition-colors">
                        <Play size={20} className="text-on-surface group-hover:text-on-tertiary-container" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                    <Plus size={20} className="text-tertiary" />
                    My Sets
                  </h2>
                </div>
                
                <div className="grid gap-3">
                  {userSets.map((set) => (
                    <div key={set.id} className="relative">
                       <button
                        onClick={() => handleStartStudy(set)}
                        className="w-full p-5 bg-surface-container-lowest border-4 border-surface-variant rounded-2xl flex items-center justify-between chunky-shadow-card active-press pr-24"
                      >
                         <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-container">
                            <ArrowRight size={24} />
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold text-xl truncate max-w-[120px]">{set.name}</h3>
                            <p className="text-on-surface-variant text-sm font-semibold">{set.cards.length} Cards</p>
                          </div>
                        </div>
                      </button>
                      
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditSet(set); }}
                          className="h-10 w-10 bg-surface-container rounded-lg flex items-center justify-center hover:bg-secondary-fixed active-press"
                        >
                          <Edit3 size={18} />
                        </button>
                        {confirmDeleteId === set.id ? (
                          <div className="flex gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                              className="px-2 h-10 bg-surface-variant text-on-surface-variant rounded-lg flex items-center justify-center font-bold text-sm"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); confirmDelete(); }}
                              className="px-2 h-10 bg-error text-white rounded-lg flex items-center justify-center font-bold text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSet(set.id); }}
                            className="h-10 w-10 bg-surface-container rounded-lg flex items-center justify-center hover:bg-error-container text-on-surface hover:text-on-error-container active-press"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={handleCreateNew}
                    className="w-full p-6 border-4 border-dashed border-surface-variant rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-surface-container-lowest hover:border-tertiary transition-all"
                  >
                    <Plus size={32} className="text-tertiary" />
                    <span className="font-bold text-on-surface-variant">Create New Set</span>
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
              <button 
                onClick={handleShuffle}
                className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-container active-press"
              >
                <Shuffle size={20} />
              </button>
            </header>

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
                    className="w-full h-full bg-surface-container-lowest rounded-[40px] border-4 border-surface-variant chunky-shadow-card flex flex-col items-center justify-center p-8 text-center"
                  >
                    <h1 className="text-[140px] sm:text-[180px] leading-none font-black tracking-tighter text-on-surface">
                      {sessionCards[currentIndex]?.syllable}
                    </h1>
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>

            <footer className="px-6 py-6 pb-12 flex flex-col gap-4 max-w-[500px] mx-auto w-full">
              <div className="flex gap-4 w-full">
                <button
                  onClick={handleBack}
                  disabled={currentIndex === 0}
                  className={`flex-1 h-16 rounded-2xl flex items-center justify-center gap-2 font-black text-xl border-4 active-press transition-all
                    ${currentIndex === 0 ? 'bg-surface-container-low text-on-surface-variant opacity-50' : 'bg-surface-container shadow-[0_4px_0_0_theme(colors.surface-variant)]'}`}
                >
                  <ArrowLeft size={24} strokeWidth={3} /> Back
                </button>
                <button
                  onClick={handleNext}
                  className={`flex-1 h-16 rounded-2xl flex items-center justify-center gap-2 font-black text-xl border-4 active-press transition-all bg-tertiary-container text-on-tertiary-container border-tertiary-fixed-dim shadow-[0_4px_0_0_theme(colors.tertiary-fixed-dim)] hover:brightness-105`}
                >
                  {currentIndex === sessionCards.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={24} strokeWidth={3} />
                </button>
              </div>
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

        {view === 'congrats' && (
          <motion.div 
            key="congrats"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background"
          >
            <motion.div 
              initial={{ rotate: -10, y: 0 }}
              animate={{ rotate: 10, y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
              className="relative mb-12"
            >
              <div className="h-48 w-48 rounded-full bg-yellow-400 border-8 border-yellow-500/20 flex items-center justify-center">
                <Trophy size={100} className="text-white drop-shadow-lg" fill="currentColor" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -top-4 -right-4 bg-tertiary p-4 rounded-full border-4 border-white"
              >
                <Star size={32} className="text-white" fill="currentColor" />
              </motion.div>
            </motion.div>

            <h1 className="text-5xl font-black text-yellow-500 mb-4 tracking-tight">Amazing!</h1>
            <p className="text-2xl font-bold text-on-surface-variant mb-12">
              You finished the <span className="text-secondary">{activeSet.name}</span> set!
            </p>

            <div className="w-full max-w-[400px] space-y-4">
              <button 
                onClick={() => { setView('study'); setCurrentIndex(0); }}
                className="w-full h-18 bg-tertiary-container text-on-tertiary-container border-4 border-tertiary-fixed-dim rounded-2xl font-bold text-2xl active-press chunky-shadow-secondary"
              >
                Try Again
              </button>
              <button 
                onClick={() => setView('library')}
                className="w-full h-18 bg-surface-container text-on-surface border-4 border-surface-variant rounded-2xl font-bold text-2xl active-press"
              >
                Back to Library
              </button>
            </div>
          </motion.div>
        )}

        {view === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col h-full bg-background"
          >
            <header className="px-6 py-6 border-b-4 border-surface-container flex items-center justify-between bg-surface-container-lowest">
               <button onClick={() => setView('library')} className="h-12 w-12 flex items-center justify-center rounded-full bg-surface-container active-press">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-black text-yellow-500">Settings</h2>
              <div className="w-12" />
            </header>

            <main className="p-6 space-y-6 overflow-y-auto pb-24">
              <div className="bg-surface-container-lowest p-6 rounded-[32px] border-4 border-surface-variant chunky-shadow-card">
                <h3 className="font-black text-sm uppercase text-on-surface-variant mb-6 tracking-wider">Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-background rounded-2xl border-2 border-surface-variant">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}>
                        {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                      </div>
                      <span className="font-bold text-lg">Dark Mode</span>
                    </div>
                    <button 
                      onClick={toggleDarkMode}
                      className={`h-8 w-14 rounded-full p-1 transition-colors duration-300 flex items-center ${isDarkMode ? 'bg-tertiary' : 'bg-surface-container-highest'}`}
                    >
                      <motion.div 
                        animate={{ x: isDarkMode ? 24 : 0 }}
                        className="h-6 w-6 bg-white rounded-full shadow-md" 
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-[32px] border-4 border-surface-variant chunky-shadow-card">
                <h3 className="font-black text-sm uppercase text-on-surface-variant mb-6 tracking-wider">Data & Backup</h3>
                
                <div className="space-y-4">
                  <button 
                    onClick={handleExport}
                    disabled={userSets.length === 0}
                    className={`w-full flex items-center justify-between p-4 bg-background rounded-2xl border-2 border-surface-variant active-press
                      ${userSets.length === 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-tertiary-fixed-dim text-on-tertiary-fixed-variant flex items-center justify-center">
                        <Download size={24} />
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-lg block">Export My Sets</span>
                        <span className="text-xs font-bold text-on-surface-variant">Download custom sets as JSON</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-on-surface-variant" />
                  </button>

                  <div className="p-4 bg-surface-container-low border-2 border-dashed border-surface-variant rounded-2xl text-center">
                    <p className="text-xs font-bold text-on-surface-variant">
                      Custom sets are saved locally in your browser.
                    </p>
                  </div>
                </div>
              </div>
            </main>
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
      </AnimatePresence>
    </div>
  );
}


