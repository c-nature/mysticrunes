/**
 * Game Configuration
 * Centralized configuration for the Mythic Runes game
 */

const GAME_CONFIG = {
  // Game timing
  DURATION_SECONDS: 120,
  
  // Letter generation
  NUM_LETTERS: 10,
  MIN_WORD_LENGTH: 2,
  MAX_WORD_LENGTH: 20,
  VOWEL_POOL: "AEIOU",
  CONSONANT_POOL: "BBCCDDDFFGGHHJJKKLLMMNNPPQQRRSSTTTVVWWXXYYZZ",
  
  // Scoring system
  SCORING: {
    2: 1,
    3: 2,
    4: 3,
    5: 5,
    6: 8,
    7: 12,
    8: 20
  },
  
  // Animation and timing
  ANIMATION_DELAYS: {
    LETTER_STAGGER: 50,
    MESSAGE_DURATION: 2000,
    CONFETTI_DURATION: 3500,
    ATTACK_DURATION: 500,
    SHAKE_DURATION: 500
  },
  
  // Local storage keys
  STORAGE_KEYS: {
    DICTIONARY: 'mythic_runes_dictionary',
    HIGH_SCORE: 'mythic_runes_high_score',
    SETTINGS: 'mythic_runes_settings',
    GAME_STATS: 'mythic_runes_stats'
  },
  
  // Cache settings
  CACHE: {
    DICTIONARY_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 second
  },
  
  // Performance settings
  PERFORMANCE: {
    DEBOUNCE_DELAY: 300,
    MAX_CONFETTI_PARTICLES: 50,
    VIRTUAL_SCROLL_THRESHOLD: 100
  },
  
  // Accessibility settings
  ACCESSIBILITY: {
    MIN_TOUCH_TARGET: 44, // pixels
    FOCUS_OUTLINE_WIDTH: 2, // pixels
    ANNOUNCEMENT_DELAY: 100 // milliseconds
  },
  
  // Character data
  CHARACTERS: {
    viking: {
      name: 'Viking',
      image: 'viking.png',
      attackImage: 'Fylgjaattack.jpg',
      description: 'A fierce Norse warrior known for strength and courage'
    },
    valkyrie: {
      name: 'Valkyrie',
      image: 'valkyrie.png',
      attackImage: 'Fylgjaattack.jpg',
      description: 'A divine maiden who guides fallen warriors to Valhalla'
    }
  },
  
  // Boss data
  BOSS: {
    name: 'Fenrir',
    image: 'fenrir.png',
    description: 'The giant wolf of Norse mythology'
  },
  
  // Audio settings
  AUDIO: {
    CORRECT_WORD: 'cut.mp3',
    WARP_SOUND: 'warp.wav',
    DEFAULT_VOLUME: 0.7,
    FADE_DURATION: 200
  },
  
  // UI Messages
  MESSAGES: {
    GAME_START: 'Game started! Find as many words as you can.',
    WORD_TOO_SHORT: 'Words must be at least 2 letters long.',
    WORD_ALREADY_FOUND: 'You already found "{word}".',
    WORD_ALREADY_INVALID: '"{word}" was already marked as invalid or used.',
    WORD_CANNOT_FORM: '"{word}" cannot be formed from the given letters.',
    WORD_NOT_IN_DICTIONARY: '"{word}" is not in the dictionary.',
    WORD_VALID: 'Great! "{word}" is a valid word! (+{points} points)',
    GAME_OVER: 'Time\'s up! Your final score: {score}.',
    DICTIONARY_LOADING: 'Loading dictionary... This might take a moment!',
    DICTIONARY_ERROR: 'Error loading dictionary. Using fallback words.',
    SELECT_CHARACTER: 'Select a character first to enable the start button',
    SHUFFLE_HELP: 'Rearrange the available letters in a different order',
    WORD_INPUT_HELP: 'Use the letters shown above to form valid words'
  },
  
  // Error messages
  ERRORS: {
    DICTIONARY_LOAD_FAILED: 'Failed to load dictionary from server',
    AUDIO_PLAY_FAILED: 'Failed to play audio',
    STORAGE_QUOTA_EXCEEDED: 'Local storage quota exceeded',
    INVALID_CHARACTER_SELECTION: 'Invalid character selection',
    GAME_STATE_CORRUPTED: 'Game state appears to be corrupted'
  },
  
  // Feature flags
  FEATURES: {
    ENABLE_SOUND: true,
    ENABLE_ANIMATIONS: true,
    ENABLE_CONFETTI: true,
    ENABLE_CACHING: true,
    ENABLE_ANALYTICS: false,
    ENABLE_HIGH_CONTRAST: true,
    ENABLE_REDUCED_MOTION: true
  },
  
  // Development settings
  DEBUG: {
    ENABLED: false,
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    SHOW_PERFORMANCE_METRICS: false,
    MOCK_DICTIONARY_LOAD: false
  }
};

// Freeze the configuration to prevent accidental modifications
Object.freeze(GAME_CONFIG);
Object.freeze(GAME_CONFIG.SCORING);
Object.freeze(GAME_CONFIG.ANIMATION_DELAYS);
Object.freeze(GAME_CONFIG.STORAGE_KEYS);
Object.freeze(GAME_CONFIG.CACHE);
Object.freeze(GAME_CONFIG.PERFORMANCE);
Object.freeze(GAME_CONFIG.ACCESSIBILITY);
Object.freeze(GAME_CONFIG.CHARACTERS);
Object.freeze(GAME_CONFIG.BOSS);
Object.freeze(GAME_CONFIG.AUDIO);
Object.freeze(GAME_CONFIG.MESSAGES);
Object.freeze(GAME_CONFIG.ERRORS);
Object.freeze(GAME_CONFIG.FEATURES);
Object.freeze(GAME_CONFIG.DEBUG);

// Export for use in other modules (if using ES6 modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GAME_CONFIG;
}