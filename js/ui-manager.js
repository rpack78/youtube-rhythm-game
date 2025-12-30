/**
 * UI Manager Module
 * Handles all UI screens and transitions
 */
class UIManager {
    constructor() {
        // Screen elements
        this.screens = {
            start: document.getElementById('start-screen'),
            loading: document.getElementById('loading-screen'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-screen'),
            results: document.getElementById('results-screen')
        };
        
        // UI elements
        this.elements = {
            // Start screen
            urlInput: document.getElementById('youtube-url'),
            startBtn: document.getElementById('start-btn'),
            difficultyBtns: document.querySelectorAll('.diff-btn'),
            errorMessage: document.getElementById('error-message'),
            calibrationSlider: document.getElementById('calibration-slider'),
            calibrationValue: document.getElementById('calibration-value'),
            
            // Loading screen
            progressBar: document.getElementById('progress-bar'),
            loadingStatus: document.getElementById('loading-status'),
            
            // Game screen
            score: document.getElementById('score'),
            combo: document.getElementById('combo'),
            accuracy: document.getElementById('accuracy'),
            countdown: document.getElementById('countdown'),
            hitFeedback: document.getElementById('hit-feedback'),
            
            // Pause screen
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            quitBtn: document.getElementById('quit-btn'),
            
            // Results screen
            finalScore: document.getElementById('final-score'),
            maxCombo: document.getElementById('max-combo'),
            finalAccuracy: document.getElementById('final-accuracy'),
            perfectCount: document.getElementById('perfect-count'),
            goodCount: document.getElementById('good-count'),
            missCount: document.getElementById('miss-count'),
            playAgainBtn: document.getElementById('play-again-btn'),
            newSongBtn: document.getElementById('new-song-btn'),
            
            // History
            historySection: document.getElementById('history-section'),
            historyList: document.getElementById('history-list')
        };
        
        // Current state
        this.currentScreen = 'start';
        this.selectedDifficulty = 'medium';
        this.calibrationOffset = 0.15; // Default 150ms in seconds
        
        // Callbacks
        this.onStart = null;
        this.onResume = null;
        this.onRestart = null;
        this.onQuit = null;
        this.onPlayAgain = null;
        this.onNewSong = null;
        this.onHistorySelect = null;
        
        // History manager reference
        this.historyManager = null;
        
        // Feedback timeout
        this.feedbackTimeout = null;
        
        // Initialize event listeners
        this.initEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initEventListeners() {
        // Start button
        this.elements.startBtn.addEventListener('click', () => {
            this.handleStart();
        });
        
        // URL input enter key
        this.elements.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleStart();
            }
        });
        
        // Difficulty buttons
        this.elements.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectDifficulty(btn.dataset.difficulty);
            });
        });
        
        // Calibration slider
        if (this.elements.calibrationSlider) {
            this.elements.calibrationSlider.addEventListener('input', (e) => {
                const offsetMs = parseInt(e.target.value);
                this.calibrationOffset = offsetMs / 1000; // Convert to seconds
                this.elements.calibrationValue.textContent = `${offsetMs >= 0 ? '+' : ''}${offsetMs}ms`;
            });
        }
        
        // Pause screen buttons
        this.elements.resumeBtn.addEventListener('click', () => {
            if (this.onResume) this.onResume();
        });
        
        this.elements.restartBtn.addEventListener('click', () => {
            if (this.onRestart) this.onRestart();
        });
        
        this.elements.quitBtn.addEventListener('click', () => {
            if (this.onQuit) this.onQuit();
        });
        
        // Results screen buttons
        this.elements.playAgainBtn.addEventListener('click', () => {
            if (this.onPlayAgain) this.onPlayAgain();
        });
        
        this.elements.newSongBtn.addEventListener('click', () => {
            if (this.onNewSong) this.onNewSong();
        });
    }

    /**
     * Handle start button click
     */
    handleStart() {
        const url = this.elements.urlInput.value.trim();
        
        if (!url) {
            this.showError('Please enter a YouTube URL');
            return;
        }
        
        // Basic URL validation
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            this.showError('Please enter a valid YouTube URL');
            return;
        }
        
        this.clearError();
        
        if (this.onStart) {
            this.onStart(url, this.selectedDifficulty, this.calibrationOffset);
        }
    }

    /**
     * Select difficulty
     */
    selectDifficulty(difficulty) {
        this.selectedDifficulty = difficulty;
        
        this.elements.difficultyBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });
    }

    /**
     * Show screen
     */
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show requested screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
    }

    /**
     * Show/hide pause overlay
     */
    togglePause(show) {
        if (show) {
            this.screens.pause.classList.add('active');
        } else {
            this.screens.pause.classList.remove('active');
        }
    }

    /**
     * Update loading progress
     */
    updateLoadingProgress(progress, status) {
        this.elements.progressBar.style.width = `${progress}%`;
        if (status) {
            this.elements.loadingStatus.textContent = status;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
    }

    /**
     * Clear error message
     */
    clearError() {
        this.elements.errorMessage.textContent = '';
    }

    /**
     * Update score display
     */
    updateScore(score) {
        this.elements.score.textContent = score.toLocaleString();
    }

    /**
     * Update combo display
     */
    updateCombo(combo) {
        this.elements.combo.textContent = combo;
        
        // Add animation for milestone combos
        if (combo > 0 && combo % 25 === 0) {
            this.elements.combo.classList.add('milestone');
            setTimeout(() => {
                this.elements.combo.classList.remove('milestone');
            }, 300);
        }
    }

    /**
     * Update accuracy display
     */
    updateAccuracy(accuracy) {
        this.elements.accuracy.textContent = `${accuracy}%`;
    }

    /**
     * Show hit feedback
     */
    showHitFeedback(result) {
        const feedback = this.elements.hitFeedback;
        
        // Clear previous
        feedback.className = 'hit-feedback';
        feedback.textContent = '';
        
        // Clear existing timeout
        if (this.feedbackTimeout) {
            clearTimeout(this.feedbackTimeout);
        }
        
        // Set new feedback
        feedback.textContent = result.toUpperCase();
        feedback.classList.add(result.toLowerCase(), 'show');
        
        // Hide after delay
        this.feedbackTimeout = setTimeout(() => {
            feedback.classList.remove('show');
        }, 200);
    }

    /**
     * Show countdown
     */
    async showCountdown() {
        const countdown = this.elements.countdown;
        countdown.classList.remove('hidden');
        
        const counts = ['3', '2', '1', 'GO!'];
        
        for (const count of counts) {
            countdown.textContent = count;
            countdown.style.animation = 'none';
            countdown.offsetHeight; // Trigger reflow
            countdown.style.animation = 'countdownPulse 0.8s ease-out';
            
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        countdown.classList.add('hidden');
    }

    /**
     * Update results screen
     */
    showResults(stats) {
        this.elements.finalScore.textContent = stats.score.toLocaleString();
        this.elements.maxCombo.textContent = stats.maxCombo;
        this.elements.finalAccuracy.textContent = `${stats.accuracy}%`;
        this.elements.perfectCount.textContent = stats.breakdown.perfect;
        this.elements.goodCount.textContent = stats.breakdown.good;
        this.elements.missCount.textContent = stats.breakdown.miss;
        
        this.showScreen('results');
    }

    /**
     * Get current URL input value
     */
    getUrl() {
        return this.elements.urlInput.value.trim();
    }

    /**
     * Get selected difficulty
     */
    getDifficulty() {
        return this.selectedDifficulty;
    }

    /**
     * Set callbacks
     */
    setCallbacks(callbacks) {
        if (callbacks.onStart) this.onStart = callbacks.onStart;
        if (callbacks.onResume) this.onResume = callbacks.onResume;
        if (callbacks.onRestart) this.onRestart = callbacks.onRestart;
        if (callbacks.onQuit) this.onQuit = callbacks.onQuit;
        if (callbacks.onPlayAgain) this.onPlayAgain = callbacks.onPlayAgain;
        if (callbacks.onNewSong) this.onNewSong = callbacks.onNewSong;
        if (callbacks.onHistorySelect) this.onHistorySelect = callbacks.onHistorySelect;
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.updateScore(0);
        this.updateCombo(0);
        this.updateAccuracy(100);
        this.elements.hitFeedback.classList.remove('show');
        this.elements.countdown.classList.add('hidden');
    }

    /**
     * Set history manager reference
     */
    setHistoryManager(historyManager) {
        this.historyManager = historyManager;
        this.renderHistory();
    }

    /**
     * Render history list
     */
    renderHistory() {
        if (!this.historyManager || !this.elements.historyList) return;
        
        const history = this.historyManager.getHistory();
        
        if (history.length === 0) {
            this.elements.historySection.style.display = 'none';
            return;
        }
        
        this.elements.historySection.style.display = 'block';
        this.elements.historyList.innerHTML = '';
        
        for (const item of history) {
            const historyItem = this.createHistoryItem(item);
            this.elements.historyList.appendChild(historyItem);
        }
    }

    /**
     * Create a history item element
     */
    createHistoryItem(item) {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.dataset.url = item.url;
        div.dataset.difficulty = item.difficulty;
        
        // Thumbnail
        const thumbnail = document.createElement('img');
        thumbnail.className = 'history-item-thumbnail';
        thumbnail.src = `https://img.youtube.com/vi/${item.videoId}/default.jpg`;
        thumbnail.alt = item.title;
        thumbnail.onerror = () => {
            thumbnail.style.display = 'none';
        };
        
        // Info container
        const info = document.createElement('div');
        info.className = 'history-item-info';
        
        // Title
        const title = document.createElement('div');
        title.className = 'history-item-title';
        title.textContent = item.title;
        title.title = item.title; // Tooltip for full title
        
        // Meta info
        const meta = document.createElement('div');
        meta.className = 'history-item-meta';
        
        // Difficulty badge
        const difficulty = document.createElement('span');
        difficulty.className = `history-item-difficulty ${item.difficulty}`;
        difficulty.textContent = item.difficulty;
        
        // High score
        if (item.highScore !== undefined && item.highScore !== null) {
            const score = document.createElement('span');
            score.className = 'history-item-score';
            score.textContent = `${item.highScore.toLocaleString()} pts`;
            meta.appendChild(score);
        }
        
        meta.appendChild(difficulty);
        
        // Time ago
        const timeAgo = document.createElement('span');
        timeAgo.textContent = this.historyManager.formatRelativeTime(item.lastPlayed);
        meta.appendChild(timeAgo);
        
        info.appendChild(title);
        info.appendChild(meta);
        
        div.appendChild(thumbnail);
        div.appendChild(info);
        
        // Click handler
        div.addEventListener('click', () => {
            this.elements.urlInput.value = item.url;
            this.selectDifficulty(item.difficulty);
            
            if (this.onHistorySelect) {
                this.onHistorySelect(item.url, item.difficulty);
            }
        });
        
        return div;
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.feedbackTimeout) {
            clearTimeout(this.feedbackTimeout);
        }
    }
}

// Export as global
window.UIManager = UIManager;
