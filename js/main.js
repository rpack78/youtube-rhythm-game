/**
 * Main Entry Point
 * Initializes and coordinates all game modules
 */

// Global game instance
let game = null;
let historyManager = null;

/**
 * Initialize the game when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎵 Rhythm Game Initializing...');
    
    try {
        // Create module instances
        const canvas = document.getElementById('game-canvas');
        const renderer = new Renderer(canvas);
        const youtubePlayer = new YouTubePlayerManager();
        const audioAnalyzer = new AudioAnalyzer();
        const inputHandler = new InputHandler();
        const scoringSystem = new ScoringSystem();
        const uiManager = new UIManager();
        
        // Create history manager
        historyManager = new HistoryManager();
        uiManager.setHistoryManager(historyManager);
        
        // Create game engine
        game = new GameEngine(
            renderer,
            youtubePlayer,
            audioAnalyzer,
            inputHandler,
            scoringSystem,
            uiManager
        );
        
        // Store history manager reference in game
        game.historyManager = historyManager;
        
        // Initialize game engine
        await game.init();
        
        // Set up UI callbacks
        uiManager.setCallbacks({
            onStart: async (url, difficulty, calibrationOffset) => {
                // Add to history when starting
                await historyManager.addToHistory(url, difficulty);
                uiManager.renderHistory();
                // Set calibration offset before starting game
                game.calibrationOffset = calibrationOffset;
                await game.startGame(url, difficulty);
            },
            onResume: () => {
                game.resume();
            },
            onRestart: async () => {
                await game.restart();
            },
            onQuit: () => {
                game.quit();
                uiManager.renderHistory();
            },
            onPlayAgain: async () => {
                await game.restart();
            },
            onNewSong: () => {
                game.quit();
                uiManager.renderHistory();
            },
            onHistorySelect: (url, difficulty) => {
                // Just populate the form, user still needs to click Play
                console.log(`Selected from history: ${url}`);
            }
        });
        
        console.log('✅ Rhythm Game Ready!');
        
        // Add some sample URLs for testing (optional)
        addSampleUrls();
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});

/**
 * Add sample URLs for easy testing
 */
function addSampleUrls() {
    const urlInput = document.getElementById('youtube-url');
    
    // Set a placeholder with example
    urlInput.placeholder = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    
    // Create sample URL buttons (optional feature)
    const sampleUrls = [
        { name: 'Pop', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { name: 'EDM', url: 'https://www.youtube.com/watch?v=3tmd-ClpJxA' },
        { name: 'Rock', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' }
    ];
    
    // Could add sample buttons here if desired
}

/**
 * Handle visibility change (pause when tab is hidden)
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden && game && game.isRunning && !game.isPaused) {
        game.pause();
    }
});

/**
 * Prevent default behavior for game keys
 */
document.addEventListener('keydown', (e) => {
    // Prevent default for game keys only during gameplay
    if (game && game.isRunning) {
        const gameKeys = ['d', 'f', 'j', 'k', 'D', 'F', 'J', 'K', 'Escape'];
        if (gameKeys.includes(e.key)) {
            e.preventDefault();
        }
    }
});

/**
 * Handle window beforeunload
 */
window.addEventListener('beforeunload', () => {
    if (game) {
        game.destroy();
    }
});

/**
 * Expose game instance for debugging
 */
window.getGame = () => game;
