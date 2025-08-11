/**
 * Mythic Runes - Main Application
 * Initializes and manages the game
 */

class MythicRunesGame {
  constructor() {
    this.gameState = new GameState();
    this.dictionary = new Dictionary();
    this.uiManager = new UIManager();
    this.audioManager = new AudioManager();
    this.gameTimer = new GameTimer(
      (timeLeft) => this.onTimerTick(timeLeft),
      () => this.onTimerComplete()
    );
    
    this.debouncedSubmitWord = Utils.debounce(
      () => this.handleSubmitWord(), 
      GAME_CONFIG.PERFORMANCE.DEBOUNCE_DELAY
    );
    
    this.isInitialized = false;
    this.settings = this.loadSettings();
  }

  /**
   * Initialize the game
   */
  async init() {
    try {
      Logger.info('Initializing Mythic Runes game');
      
      // Apply user settings
      this.applySettings();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Show title screen
      this.uiManager.showTitleScreen();
      
      // Preload dictionary in background
      this.preloadDictionary();
      
      this.isInitialized = true;
      Logger.info('Game initialized successfully');
      
    } catch (error) {
      Logger.error('Failed to initialize game:', error);
      this.uiManager.showMessage(GAME_CONFIG.ERRORS.GAME_STATE_CORRUPTED, 'error');
    }
  }

  /**
   * Preload dictionary in background
   */
  async preloadDictionary() {
    try {
      await this.dictionary.load();
      Logger.info('Dictionary preloaded successfully');
    } catch (error) {
      Logger.warn('Dictionary preload failed, using fallback dictionary:', error);
      // Ensure fallback dictionary is loaded
      this.dictionary._loadFallbackDictionary();
    }
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Character selection
    const vikingCard = this.uiManager.getElement('viking-card');
    const valkyrieCard = this.uiManager.getElement('valkyrie-card');
    
    if (vikingCard) {
      vikingCard.addEventListener('click', () => this.selectCharacter('viking'));
      vikingCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectCharacter('viking');
        }
      });
    }
    
    if (valkyrieCard) {
      valkyrieCard.addEventListener('click', () => this.selectCharacter('valkyrie'));
      valkyrieCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectCharacter('valkyrie');
        }
      });
    }

    // Start game button
    const startButton = this.uiManager.getElement('start-game-button');
    if (startButton) {
      startButton.addEventListener('click', () => this.startGame());
    }

    // Game controls
    const submitButton = this.uiManager.getElement('submit-word-button');
    if (submitButton) {
      submitButton.addEventListener('click', this.debouncedSubmitWord);
    }

    const shuffleButton = this.uiManager.getElement('shuffle-letters-button');
    if (shuffleButton) {
      shuffleButton.addEventListener('click', () => this.shuffleLetters());
    }

    const newGameButton = this.uiManager.getElement('new-game-button');
    if (newGameButton) {
      newGameButton.addEventListener('click', () => this.newGame());
    }

    // Word input
    const wordInput = this.uiManager.getElement('word-input');
    if (wordInput) {
      wordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.debouncedSubmitWord();
        }
      });

      // Input validation
      wordInput.addEventListener('input', (e) => {
        const sanitized = Utils.sanitizeInput(e.target.value);
        if (e.target.value !== sanitized) {
          e.target.value = sanitized;
        }
      });
    }

    // Settings
    this.setupSettingsListeners();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.gameState.isActive) {
        switch (e.key) {
          case 'Escape':
            this.pauseGame();
            break;
          case 'F5':
            e.preventDefault();
            this.shuffleLetters();
            break;
        }
      }
    });
  }

  /**
   * Set up settings panel listeners
   */
  setupSettingsListeners() {
    const soundToggle = Utils.safeGetElement('sound-toggle');
    if (soundToggle) {
      soundToggle.checked = this.settings.soundEnabled;
      soundToggle.addEventListener('change', (e) => {
        this.settings.soundEnabled = e.target.checked;
        this.audioManager.setEnabled(e.target.checked);
        this.saveSettings();
      });
    }

    const motionToggle = Utils.safeGetElement('reduced-motion-toggle');
    if (motionToggle) {
      motionToggle.checked = this.settings.reducedMotion;
      motionToggle.addEventListener('change', (e) => {
        this.settings.reducedMotion = e.target.checked;
        this.uiManager.animationManager.setEnabled(!e.target.checked);
        this.saveSettings();
      });
    }
  }

  /**
   * Select a character
   */
  selectCharacter(character) {
    if (!GAME_CONFIG.CHARACTERS[character]) {
      Logger.error('Invalid character selection:', character);
      return;
    }

    this.gameState.selectedCharacter = character;
    this.gameState.characterImagePath = GAME_CONFIG.CHARACTERS[character].image;
    
    this.uiManager.selectCharacter(character);
    
    Utils.announceToScreenReader(
      `${GAME_CONFIG.CHARACTERS[character].name} selected. ${GAME_CONFIG.CHARACTERS[character].description}`,
      'polite'
    );
    
    Logger.info(`Character selected: ${character}`);
  }

  /**
   * Start a new game
   */
  async startGame() {
    try {
      Logger.info('Starting new game');
      
      // Show loading if dictionary isn't ready
      if (!this.dictionary.isLoaded) {
        this.uiManager.showLoading(true);
        this.uiManager.showMessage(GAME_CONFIG.MESSAGES.DICTIONARY_LOADING, 'info');
        
        try {
          await this.dictionary.load();
        } catch (error) {
          this.uiManager.showMessage(GAME_CONFIG.MESSAGES.DICTIONARY_ERROR, 'error');
        }
        
        this.uiManager.showLoading(false);
      }

      // Initialize game state
      this.gameState.reset();
      this.gameState.selectedCharacter = this.gameState.selectedCharacter || 'viking';
      this.gameState.characterImagePath = GAME_CONFIG.CHARACTERS[this.gameState.selectedCharacter].image;
      
      // Generate letters
      this.gameState.currentLetters = LetterGenerator.generate();
      
      // Set up UI
      this.uiManager.showGameScreen();
      this.uiManager.renderLetters(this.gameState.currentLetters);
      this.uiManager.clearWordLists();
      this.uiManager.clearInput();
      this.uiManager.setInputEnabled(true);
      this.uiManager.focusInput();
      
      // Show characters
      this.uiManager.showCharacter(this.gameState.characterImagePath);
      this.uiManager.showBoss();
      
      // Start game
      this.gameState.startGame();
      this.gameTimer.start(GAME_CONFIG.DURATION_SECONDS);
      
      // Update display
      this.updateDisplay();
      
      // Show start message
      this.uiManager.showMessage(GAME_CONFIG.MESSAGES.GAME_START, 'info');
      
      Logger.info('Game started successfully');
      
    } catch (error) {
      Logger.error('Failed to start game:', error);
      this.uiManager.showMessage('Failed to start game. Please try again.', 'error');
    }
  }

  /**
   * Handle word submission
   */
  async handleSubmitWord() {
    if (!this.gameState.isActive) {
      this.uiManager.showMessage('Start a new game to play!', 'info');
      return;
    }

    const wordInput = this.uiManager.getElement('word-input');
    if (!wordInput) return;

    const word = Utils.sanitizeInput(wordInput.value);
    this.uiManager.clearInput();

    if (!Utils.isValidInput(word)) {
      const message = Utils.formatMessage(GAME_CONFIG.MESSAGES.WORD_TOO_SHORT);
      this.uiManager.showMessage(message, 'error');
      this.uiManager.addInvalidWord(word);
      return;
    }

    // Check if already found
    if (this.gameState.hasFoundWord(word)) {
      const message = Utils.formatMessage(GAME_CONFIG.MESSAGES.WORD_ALREADY_FOUND, { word: word.toUpperCase() });
      this.uiManager.showMessage(message, 'info');
      this.uiManager.addInvalidWord(word);
      return;
    }

    // Check if already marked invalid
    if (this.gameState.hasInvalidWord(word)) {
      const message = Utils.formatMessage(GAME_CONFIG.MESSAGES.WORD_ALREADY_INVALID, { word: word.toUpperCase() });
      this.uiManager.showMessage(message, 'info');
      return;
    }

    // Check if word can be formed from available letters
    if (!LetterGenerator.canFormWord(word, this.gameState.currentLetters)) {
      const message = Utils.formatMessage(GAME_CONFIG.MESSAGES.WORD_CANNOT_FORM, { word: word.toUpperCase() });
      this.uiManager.showMessage(message, 'error');
      this.gameState.addInvalidWord(word);
      this.uiManager.addInvalidWord(word);
      return;
    }

    // Check if word exists in dictionary
    if (this.dictionary.hasWord(word)) {
      // Valid word found!
      const points = this.gameState.calculateWordScore(word);
      this.gameState.addFoundWord(word);
      this.uiManager.addFoundWord(word);
      
      const message = Utils.formatMessage(GAME_CONFIG.MESSAGES.WORD_VALID, { 
        word: word.toUpperCase(), 
        points: points 
      });
      this.uiManager.showMessage(message, 'success');
      
      // Play sound and animations
      this.audioManager.play('correctWord');
      await this.uiManager.triggerCharacterAttack();
      await this.uiManager.triggerCharacterShake();
      
      // Update display
      this.updateDisplay();
      
      Logger.info(`Valid word submitted: ${word} (+${points} points)`);
      
    } else {
      // Invalid word
      const message = Utils.formatMessage(GAME_CONFIG.MESSAGES.WORD_NOT_IN_DICTIONARY, { word: word.toUpperCase() });
      this.uiManager.showMessage(message, 'error');
      this.gameState.addInvalidWord(word);
      this.uiManager.addInvalidWord(word);
      
      Logger.debug(`Invalid word submitted: ${word}`);
    }

    // Refocus input
    this.uiManager.focusInput();
  }

  /**
   * Shuffle the current letters
   */
  shuffleLetters() {
    if (!this.gameState.isActive) return;

    this.gameState.currentLetters = Utils.shuffleArray(this.gameState.currentLetters);
    this.uiManager.renderLetters(this.gameState.currentLetters);
    
    Utils.announceToScreenReader('Letters shuffled', 'polite');
    Logger.debug('Letters shuffled');
  }

  /**
   * Timer tick handler
   */
  onTimerTick(timeLeft) {
    this.gameState.timeLeft = timeLeft;
    this.uiManager.updateTimer(timeLeft);
    
    // Warning announcements
    if (timeLeft === 60) {
      Utils.announceToScreenReader('One minute remaining', 'polite');
    } else if (timeLeft === 30) {
      Utils.announceToScreenReader('Thirty seconds remaining', 'assertive');
    } else if (timeLeft === 10) {
      Utils.announceToScreenReader('Ten seconds remaining', 'assertive');
    }
  }

  /**
   * Timer completion handler
   */
  onTimerComplete() {
    this.endGame();
  }

  /**
   * End the current game
   */
  endGame() {
    this.gameState.endGame();
    this.uiManager.setInputEnabled(false);
    
    const message = Utils.formatMessage(GAME_CONFIG.MESSAGES.GAME_OVER, { score: this.gameState.score });
    this.uiManager.showMessage(message, 'info');
    
    // Trigger confetti for good scores
    if (this.gameState.score >= 50) {
      this.uiManager.triggerConfetti();
    }
    
    // Save high score
    this.saveHighScore();
    
    // Save game stats
    this.saveGameStats();
    
    Utils.announceToScreenReader(message, 'assertive');
    Logger.info('Game ended', this.gameState.getGameStats());
  }

  /**
   * Start a new game (reset and restart)
   */
  newGame() {
    this.gameTimer.stop();
    this.gameState.reset();
    this.uiManager.showTitleScreen();
    Logger.info('New game initiated');
  }

  /**
   * Pause the game
   */
  pauseGame() {
    if (this.gameState.isActive) {
      this.gameTimer.pause();
      this.uiManager.showMessage('Game paused. Press any key to continue.', 'info');
      Logger.info('Game paused');
    }
  }

  /**
   * Resume the game
   */
  resumeGame() {
    if (this.gameState.isActive) {
      this.gameTimer.resume();
      this.uiManager.showMessage('Game resumed', 'info');
      Logger.info('Game resumed');
    }
  }

  /**
   * Update the display with current game state
   */
  updateDisplay() {
    this.uiManager.updateScore(this.gameState.score);
    this.uiManager.updateTimer(this.gameState.timeLeft);
    this.uiManager.updateFoundWordsCount(this.gameState.foundWords.size);
  }

  /**
   * Load user settings
   */
  loadSettings() {
    const defaultSettings = {
      soundEnabled: GAME_CONFIG.FEATURES.ENABLE_SOUND,
      reducedMotion: Utils.prefersReducedMotion(),
      volume: GAME_CONFIG.AUDIO.DEFAULT_VOLUME
    };

    return Storage.get(GAME_CONFIG.STORAGE_KEYS.SETTINGS, defaultSettings);
  }

  /**
   * Save user settings
   */
  saveSettings() {
    Storage.set(GAME_CONFIG.STORAGE_KEYS.SETTINGS, this.settings);
    Logger.debug('Settings saved', this.settings);
  }

  /**
   * Apply user settings
   */
  applySettings() {
    this.audioManager.setEnabled(this.settings.soundEnabled);
    this.audioManager.setVolume(this.settings.volume);
    this.uiManager.animationManager.setEnabled(!this.settings.reducedMotion);
  }

  /**
   * Save high score
   */
  saveHighScore() {
    const currentHigh = Storage.get(GAME_CONFIG.STORAGE_KEYS.HIGH_SCORE, 0);
    if (this.gameState.score > currentHigh) {
      Storage.set(GAME_CONFIG.STORAGE_KEYS.HIGH_SCORE, this.gameState.score);
      Logger.info(`New high score: ${this.gameState.score}`);
    }
  }

  /**
   * Save game statistics
   */
  saveGameStats() {
    const stats = Storage.get(GAME_CONFIG.STORAGE_KEYS.GAME_STATS, {
      gamesPlayed: 0,
      totalScore: 0,
      totalWordsFound: 0,
      averageScore: 0,
      bestScore: 0
    });

    const gameStats = this.gameState.getGameStats();
    
    stats.gamesPlayed++;
    stats.totalScore += gameStats.score;
    stats.totalWordsFound += gameStats.wordsFound;
    stats.averageScore = Math.round(stats.totalScore / stats.gamesPlayed);
    stats.bestScore = Math.max(stats.bestScore, gameStats.score);

    Storage.set(GAME_CONFIG.STORAGE_KEYS.GAME_STATS, stats);
    Logger.debug('Game stats saved', stats);
  }

  /**
   * Get game statistics
   */
  getGameStats() {
    return Storage.get(GAME_CONFIG.STORAGE_KEYS.GAME_STATS, {
      gamesPlayed: 0,
      totalScore: 0,
      totalWordsFound: 0,
      averageScore: 0,
      bestScore: 0
    });
  }
}

/**
 * Initialize the game when the page loads
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Create global game instance
    window.mythicRunesGame = new MythicRunesGame();
    
    // Initialize the game
    await window.mythicRunesGame.init();
    
    Logger.info('Mythic Runes loaded successfully');
    
  } catch (error) {
    Logger.error('Failed to load Mythic Runes:', error);
    
    // Show error message to user
    const messageElement = document.getElementById('message');
    if (messageElement) {
      messageElement.textContent = 'Failed to load game. Please refresh the page.';
      messageElement.className = 'message-error';
      messageElement.style.opacity = '1';
    }
  }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (window.mythicRunesGame) {
    if (document.hidden) {
      // Page is hidden, pause game if active
      if (window.mythicRunesGame.gameState.isActive) {
        window.mythicRunesGame.pauseGame();
      }
    } else {
      // Page is visible, resume game if paused
      if (window.mythicRunesGame.gameState.isActive) {
        window.mythicRunesGame.resumeGame();
      }
    }
  }
});

// Handle beforeunload to save state
window.addEventListener('beforeunload', () => {
  if (window.mythicRunesGame) {
    window.mythicRunesGame.saveSettings();
  }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MythicRunesGame;
}