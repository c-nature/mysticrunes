/**
 * Mythic Runes Game
 * Main game logic and classes
 */

/**
 * Game State Management
 */
class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentLetters = [];
    this.foundWords = new Set();
    this.invalidWords = new Set();
    this.score = 0;
    this.timeLeft = GAME_CONFIG.DURATION_SECONDS;
    this.isActive = false;
    this.selectedCharacter = null;
    this.characterImagePath = null;
    this.gameStartTime = null;
    this.gameEndTime = null;
  }

  addFoundWord(word) {
    this.foundWords.add(word);
    this.score += this.calculateWordScore(word);
    Logger.info(`Word found: ${word}, Score: +${this.calculateWordScore(word)}`);
  }

  addInvalidWord(word) {
    this.invalidWords.add(word);
    Logger.debug(`Invalid word added: ${word}`);
  }

  calculateWordScore(word) {
    const length = word.length;
    return GAME_CONFIG.SCORING[length] || GAME_CONFIG.SCORING[8];
  }

  hasFoundWord(word) {
    return this.foundWords.has(word);
  }

  hasInvalidWord(word) {
    return this.invalidWords.has(word);
  }

  startGame() {
    this.isActive = true;
    this.gameStartTime = Date.now();
    Logger.info('Game started');
  }

  endGame() {
    this.isActive = false;
    this.gameEndTime = Date.now();
    const duration = this.gameEndTime - this.gameStartTime;
    Logger.info(`Game ended. Duration: ${duration}ms, Final score: ${this.score}`);
  }

  getGameStats() {
    return {
      score: this.score,
      wordsFound: this.foundWords.size,
      invalidAttempts: this.invalidWords.size,
      duration: this.gameEndTime ? this.gameEndTime - this.gameStartTime : null,
      character: this.selectedCharacter
    };
  }
}

/**
 * Dictionary Management
 */
class Dictionary {
  constructor() {
    this.words = new Set();
    this.isLoaded = false;
    this.loadPromise = null;
    this.retryCount = 0;
  }

  async load() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadDictionary();
    return this.loadPromise;
  }

  async _loadDictionary() {
    try {
      // Try to load from cache first
      const cached = this._loadFromCache();
      if (cached) {
        this.words = cached;
        this.isLoaded = true;
        Logger.info(`Dictionary loaded from cache: ${this.words.size} words`);
        return;
      }

      // Load from network with retry logic
      await this._loadFromNetwork();
      
    } catch (error) {
      Logger.error('Error loading dictionary:', error);
      this._loadFallbackDictionary();
      throw error;
    }
  }

  async _loadFromNetwork() {
    try {
      Logger.debug(`Loading dictionary from network`);
      
      const response = await fetch('words.txt');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const text = await response.text();
      const wordsArray = text
        .split('\n')
        .map(word => word.trim().toLowerCase())
        .filter(word => word.length >= GAME_CONFIG.MIN_WORD_LENGTH);

      this.words = new Set(wordsArray);
      this.isLoaded = true;

      // Cache the dictionary
      this._saveToCache();

      Logger.info(`Dictionary loaded from network: ${this.words.size} words`);
      return;

    } catch (error) {
      Logger.warn(`Dictionary load from network failed:`, error);
      throw error;
    }
  }

  _loadFromCache() {
    try {
      const cached = Storage.get(GAME_CONFIG.STORAGE_KEYS.DICTIONARY);
      if (cached && cached.words && cached.timestamp) {
        // Check if cache is still valid
        const cacheAge = Date.now() - cached.timestamp;
        
        if (cacheAge < GAME_CONFIG.CACHE.DICTIONARY_MAX_AGE) {
          return new Set(cached.words);
        } else {
          Logger.debug('Dictionary cache expired');
          Storage.remove(GAME_CONFIG.STORAGE_KEYS.DICTIONARY);
        }
      }
    } catch (error) {
      Logger.warn('Error loading dictionary from cache:', error);
    }
    return null;
  }

  _saveToCache() {
    try {
      const data = {
        words: Array.from(this.words),
        timestamp: Date.now()
      };
      Storage.set(GAME_CONFIG.STORAGE_KEYS.DICTIONARY, data);
      Logger.debug('Dictionary cached successfully');
    } catch (error) {
      Logger.warn('Error saving dictionary to cache:', error);
    }
  }

  _loadFallbackDictionary() {
    // Fallback dictionary for development/offline use
    const fallbackWords = [
      "cat", "dog", "house", "tree", "run", "jump", "play", "game", "word", "letter",
      "apple", "banana", "orange", "computer", "keyboard", "mouse", "ocean", "mountain",
      "elephant", "giraffe", "happiness", "freedom", "courage", "justice", "wisdom",
      "viking", "valkyrie", "norse", "rune", "myth", "legend", "hero", "battle", "sword",
      "shield", "dragon", "wolf", "bear", "eagle", "storm", "thunder", "lightning",
      "fire", "ice", "wind", "earth", "water", "magic", "spell", "quest", "adventure"
    ];
    
    this.words = new Set(fallbackWords);
    this.isLoaded = true;
    Logger.info('Using fallback dictionary');
  }

  hasWord(word) {
    return this.words.has(word.toLowerCase());
  }

  getWordCount() {
    return this.words.size;
  }

  getRandomWords(count = 10) {
    const wordsArray = Array.from(this.words);
    const randomWords = [];
    
    for (let i = 0; i < count && i < wordsArray.length; i++) {
      const randomIndex = Math.floor(Math.random() * wordsArray.length);
      randomWords.push(wordsArray[randomIndex]);
    }
    
    return randomWords;
  }
}

/**
 * Letter Generation and Management
 */
class LetterGenerator {
  static generate() {
    const letters = [];
    const numVowels = 4;
    const numConsonants = GAME_CONFIG.NUM_LETTERS - numVowels;
    
    // Add vowels
    for (let i = 0; i < numVowels; i++) {
      const randomIndex = Math.floor(Math.random() * GAME_CONFIG.VOWEL_POOL.length);
      letters.push(GAME_CONFIG.VOWEL_POOL[randomIndex]);
    }

    // Add consonants
    for (let i = 0; i < numConsonants; i++) {
      const randomIndex = Math.floor(Math.random() * GAME_CONFIG.CONSONANT_POOL.length);
      letters.push(GAME_CONFIG.CONSONANT_POOL[randomIndex]);
    }

    return Utils.shuffleArray(letters);
  }

  static canFormWord(word, availableLetters) {
    const letterCounts = {};
    
    // Count available letters
    availableLetters.forEach(char => {
      const lowerChar = char.toLowerCase();
      letterCounts[lowerChar] = (letterCounts[lowerChar] || 0) + 1;
    });

    // Check if word can be formed
    for (const char of word.toLowerCase()) {
      if (!letterCounts[char] || letterCounts[char] === 0) {
        return false;
      }
      letterCounts[char]--;
    }
    
    return true;
  }

  static getWordComplexity(word, availableLetters) {
    // Calculate how "difficult" a word is to find
    const letterFrequency = {};
    availableLetters.forEach(char => {
      const lowerChar = char.toLowerCase();
      letterFrequency[lowerChar] = (letterFrequency[lowerChar] || 0) + 1;
    });

    let complexity = 0;
    for (const char of word.toLowerCase()) {
      complexity += 1 / (letterFrequency[char] || 1);
    }

    return complexity;
  }
}

/**
 * Game Timer Management
 */
class GameTimer {
  constructor(onTick, onComplete) {
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.interval = null;
    this.timeLeft = 0;
    this.isPaused = false;
  }

  start(duration) {
    this.stop(); // Clear any existing timer
    this.timeLeft = duration;
    this.isPaused = false;
    
    this.interval = setInterval(() => {
      if (!this.isPaused) {
        this.timeLeft--;
        this.onTick(this.timeLeft);
        
        if (this.timeLeft <= 0) {
          this.stop();
          this.onComplete();
        }
      }
    }, 1000);

    Logger.debug(`Timer started with ${duration} seconds`);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      Logger.debug('Timer stopped');
    }
  }

  pause() {
    this.isPaused = true;
    Logger.debug('Timer paused');
  }

  resume() {
    this.isPaused = false;
    Logger.debug('Timer resumed');
  }

  getTimeLeft() {
    return this.timeLeft;
  }

  addTime(seconds) {
    this.timeLeft += seconds;
    Logger.debug(`Added ${seconds} seconds to timer`);
  }
}

/**
 * Audio Management
 */
class AudioManager {
  constructor() {
    this.sounds = {};
    this.enabled = GAME_CONFIG.FEATURES.ENABLE_SOUND;
    this.volume = GAME_CONFIG.AUDIO.DEFAULT_VOLUME;
    this._loadSounds();
  }

  _loadSounds() {
    try {
      this.sounds.correctWord = new Audio(GAME_CONFIG.AUDIO.CORRECT_WORD);
      this.sounds.correctWord.volume = this.volume;
      this.sounds.correctWord.preload = 'auto';

      if (GAME_CONFIG.AUDIO.WARP_SOUND) {
        this.sounds.warp = new Audio(GAME_CONFIG.AUDIO.WARP_SOUND);
        this.sounds.warp.volume = this.volume;
        this.sounds.warp.preload = 'auto';
      }

      Logger.debug('Audio files loaded');
    } catch (error) {
      Logger.error('Error loading audio files:', error);
    }
  }

  async play(soundName) {
    if (!this.enabled || !this.sounds[soundName]) {
      return;
    }

    try {
      const sound = this.sounds[soundName];
      sound.currentTime = 0; // Rewind to start
      await sound.play();
      Logger.debug(`Played sound: ${soundName}`);
    } catch (error) {
      Logger.warn(`Error playing sound ${soundName}:`, error);
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    Logger.debug(`Audio ${enabled ? 'enabled' : 'disabled'}`);
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
    Logger.debug(`Audio volume set to ${this.volume}`);
  }

  isEnabled() {
    return this.enabled;
  }
}

/**
 * Animation Manager
 */
class AnimationManager {
  constructor() {
    this.enabled = GAME_CONFIG.FEATURES.ENABLE_ANIMATIONS && !Utils.prefersReducedMotion();
  }

  animateElement(element, animationClass, duration = null) {
    if (!this.enabled || !element) return Promise.resolve();

    return new Promise((resolve) => {
      const cleanup = () => {
        element.classList.remove(animationClass);
        element.removeEventListener('animationend', cleanup);
        resolve();
      };

      element.addEventListener('animationend', cleanup);
      element.classList.add(animationClass);

      // Fallback timeout in case animationend doesn't fire
      if (duration) {
        setTimeout(cleanup, duration);
      }
    });
  }

  async animateLetterTiles(tiles) {
    if (!this.enabled) return;

    const promises = tiles.map((tile, index) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          this.animateElement(tile, 'animate-in', 400).then(resolve);
        }, index * GAME_CONFIG.ANIMATION_DELAYS.LETTER_STAGGER);
      });
    });

    await Promise.all(promises);
  }

  async animateScore(element) {
    if (!this.enabled || !element) return;
    
    await this.animateElement(element, 'score-animated', 300);
  }

  async animateCharacterAttack(element) {
    if (!this.enabled || !element) return;
    
    await this.animateElement(element, 'attack-animation', GAME_CONFIG.ANIMATION_DELAYS.ATTACK_DURATION);
  }

  async animateCharacterShake(elements) {
    if (!this.enabled || !elements.length) return;
    
    const promises = elements.map(element => 
      this.animateElement(element, 'shake-animation', GAME_CONFIG.ANIMATION_DELAYS.SHAKE_DURATION)
    );
    
    await Promise.all(promises);
  }

  setEnabled(enabled) {
    this.enabled = enabled && !Utils.prefersReducedMotion();
    Logger.debug(`Animations ${this.enabled ? 'enabled' : 'disabled'}`);
  }
}

/**
 * UI Manager
 */
class UIManager {
  constructor() {
    this.elements = this._cacheElements();
    this.animationManager = new AnimationManager();
    this._setupEventListeners();
  }

  _cacheElements() {
    const elements = {};
    const elementIds = [
      'title-screen', 'game-container', 'loading-overlay', 'confetti-container',
      'letter-tiles', 'word-input', 'submit-word-button', 'shuffle-letters-button',
      'new-game-button', 'score', 'timer', 'message', 'found-words-list',
      'invalid-words-list', 'found-words-count', 'viking-card', 'valkyrie-card',
      'start-game-button', 'character-display', 'chosen-character-img',
      'boss-display', 'fenrir-img'
    ];

    elementIds.forEach(id => {
      elements[id] = Utils.safeGetElement(id);
    });

    return elements;
  }

  _setupEventListeners() {
    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        Logger.debug('Page hidden - could pause game here');
      } else {
        Logger.debug('Page visible - could resume game here');
      }
    });

    // Handle window resize
    window.addEventListener('resize', Utils.debounce(() => {
      Logger.debug('Window resized');
      // Could adjust UI layout here
    }, 250));
  }

  showTitleScreen() {
    if (this.elements['title-screen']) {
      this.elements['title-screen'].style.display = 'flex';
      this.elements['title-screen'].classList.add('visible');
    }
    if (this.elements['game-container']) {
      this.elements['game-container'].style.display = 'none';
      this.elements['game-container'].classList.remove('visible');
    }
    Logger.debug('Title screen shown');
  }

  showGameScreen() {
    if (this.elements['title-screen']) {
      this.elements['title-screen'].style.display = 'none';
      this.elements['title-screen'].classList.remove('visible');
    }
    if (this.elements['game-container']) {
      this.elements['game-container'].style.display = 'flex';
      this.elements['game-container'].classList.add('visible');
    }
    Logger.debug('Game screen shown');
  }

  showLoading(show = true) {
    if (this.elements['loading-overlay']) {
      this.elements['loading-overlay'].style.display = show ? 'flex' : 'none';
    }
  }

  updateScore(score) {
    if (this.elements['score']) {
      const oldScore = parseInt(this.elements['score'].textContent) || 0;
      this.elements['score'].textContent = score;
      
      if (score > oldScore) {
        this.animationManager.animateScore(this.elements['score']);
      }
    }
  }

  updateTimer(timeLeft) {
    if (this.elements['timer']) {
      this.elements['timer'].textContent = Utils.formatTime(timeLeft);
      
      // Add warning class for last 30 seconds
      if (timeLeft <= 30) {
        this.elements['timer'].classList.add('warning');
      } else {
        this.elements['timer'].classList.remove('warning');
      }
    }
  }

  updateFoundWordsCount(count) {
    if (this.elements['found-words-count']) {
      this.elements['found-words-count'].textContent = count;
    }
  }

  showMessage(message, type = 'info', duration = GAME_CONFIG.ANIMATION_DELAYS.MESSAGE_DURATION) {
    if (!this.elements['message']) return;

    const messageElement = this.elements['message'];
    
    // Clear previous classes and animation
    messageElement.classList.remove('message-success', 'message-error', 'message-info');
    messageElement.style.opacity = '0';
    
    // Set new message and type
    messageElement.textContent = message;
    messageElement.classList.add(`message-${type}`);
    
    // Announce to screen readers
    Utils.announceToScreenReader(message, type === 'error' ? 'assertive' : 'polite');
    
    Logger.debug(`Message shown: ${message} (${type})`);
  }

  renderLetters(letters) {
    if (!this.elements['letter-tiles']) return;

    const container = this.elements['letter-tiles'];
    container.innerHTML = ''; // Clear previous letters

    const tiles = letters.map((letter, index) => {
      const tile = document.createElement('div');
      tile.classList.add('letter-tile');
      tile.textContent = letter.toUpperCase();
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('aria-label', `Letter ${letter.toUpperCase()}`);
      
      // Add click handler for accessibility
      tile.addEventListener('click', () => {
        this._addLetterToInput(letter);
      });
      
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._addLetterToInput(letter);
        }
      });
      
      container.appendChild(tile);
      return tile;
    });

    // Animate tiles appearing
    this.animationManager.animateLetterTiles(tiles);
  }

  _addLetterToInput(letter) {
    if (this.elements['word-input']) {
      const input = this.elements['word-input'];
      const currentValue = input.value;
      const maxLength = parseInt(input.getAttribute('maxlength')) || GAME_CONFIG.MAX_WORD_LENGTH;
      
      if (currentValue.length < maxLength) {
        input.value = currentValue + letter.toLowerCase();
        input.focus();
      }
    }
  }

  addFoundWord(word) {
    if (!this.elements['found-words-list']) return;

    const listItem = document.createElement('li');
    listItem.textContent = word.toUpperCase();
    listItem.setAttribute('role', 'listitem');
    this.elements['found-words-list'].prepend(listItem);
  }

  addInvalidWord(word) {
    if (!this.elements['invalid-words-list']) return;

    const listItem = document.createElement('li');
    listItem.textContent = word.toUpperCase();
    listItem.setAttribute('role', 'listitem');
    this.elements['invalid-words-list'].prepend(listItem);
  }

  clearWordLists() {
    if (this.elements['found-words-list']) {
      this.elements['found-words-list'].innerHTML = '';
    }
    if (this.elements['invalid-words-list']) {
      this.elements['invalid-words-list'].innerHTML = '';
    }
  }

  clearInput() {
    if (this.elements['word-input']) {
      this.elements['word-input'].value = '';
    }
  }

  focusInput() {
    if (this.elements['word-input']) {
      this.elements['word-input'].focus();
    }
  }

  setInputEnabled(enabled) {
    if (this.elements['word-input']) {
      this.elements['word-input'].disabled = !enabled;
    }
    if (this.elements['submit-word-button']) {
      this.elements['submit-word-button'].disabled = !enabled;
    }
    if (this.elements['shuffle-letters-button']) {
      this.elements['shuffle-letters-button'].disabled = !enabled;
    }
  }

  selectCharacter(character) {
    // Remove selection from all cards
    if (this.elements['viking-card']) {
      this.elements['viking-card'].classList.remove('selected');
      this.elements['viking-card'].setAttribute('aria-checked', 'false');
    }
    if (this.elements['valkyrie-card']) {
      this.elements['valkyrie-card'].classList.remove('selected');
      this.elements['valkyrie-card'].setAttribute('aria-checked', 'false');
    }

    // Add selection to chosen card
    const cardElement = this.elements[`${character}-card`];
    if (cardElement) {
      cardElement.classList.add('selected');
      cardElement.setAttribute('aria-checked', 'true');
    }

    // Enable start button
    if (this.elements['start-game-button']) {
      this.elements['start-game-button'].disabled = false;
      this.elements['start-game-button'].classList.add('visible');
    }
  }

  showCharacter(characterPath) {
    if (this.elements['chosen-character-img'] && this.elements['character-display']) {
      this.elements['chosen-character-img'].src = characterPath;
      this.elements['character-display'].classList.add('visible');
    }
  }

  showBoss() {
    if (this.elements['boss-display']) {
      this.elements['boss-display'].classList.add('visible');
    }
  }

  async triggerCharacterAttack() {
    if (this.elements['chosen-character-img']) {
      await this.animationManager.animateCharacterAttack(this.elements['chosen-character-img']);
    }
  }

  async triggerCharacterShake() {
    const elements = [];
    if (this.elements['chosen-character-img']) {
      elements.push(this.elements['chosen-character-img']);
    }
    if (this.elements['fenrir-img']) {
      elements.push(this.elements['fenrir-img']);
    }
    
    if (elements.length > 0) {
      await this.animationManager.animateCharacterShake(elements);
    }
  }

  triggerConfetti() {
    if (!GAME_CONFIG.FEATURES.ENABLE_CONFETTI || !this.elements['confetti-container']) {
      return;
    }

    const container = this.elements['confetti-container'];
    container.innerHTML = ''; // Clear previous confetti

    const numConfetti = GAME_CONFIG.PERFORMANCE.MAX_CONFETTI_PARTICLES;
    
    for (let i = 0; i < numConfetti; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti');
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.animationDelay = `${Math.random() * 1.5}s`;
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
      container.appendChild(confetti);
    }

    // Clear confetti after animation
    setTimeout(() => {
      container.innerHTML = '';
    }, GAME_CONFIG.ANIMATION_DELAYS.CONFETTI_DURATION);

    Logger.debug('Confetti triggered');
  }

  getElement(id) {
    return this.elements[id];
  }
}

// Export classes if using modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GameState,
    Dictionary,
    LetterGenerator,
    GameTimer,
    AudioManager,
    AnimationManager,
    UIManager
  };
}