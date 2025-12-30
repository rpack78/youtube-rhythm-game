/**
 * Game Engine Module
 * Core game loop and game logic coordination
 */
class GameEngine {
    constructor(renderer, youtubePlayer, audioAnalyzer, inputHandler, scoringSystem, uiManager) {
        this.renderer = renderer;
        this.youtubePlayer = youtubePlayer;
        this.audioAnalyzer = audioAnalyzer;
        this.inputHandler = inputHandler;
        this.scoringSystem = scoringSystem;
        this.uiManager = uiManager;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        
        // Timing
        this.lastFrameTime = 0;
        this.gameStartTime = 0;
        this.travelTime = 2; // Seconds for note to travel from spawn to hit zone
        
        // Timing synchronization
        this.lastYouTubeTime = 0;
        this.lastYouTubeTimeUpdate = 0;
        this.interpolatedTime = 0;
        this.youtubeApiLatency = 0.1; // Estimated YouTube API query latency in seconds
        
        // Notes and lanes
        this.notes = [];
        this.lanes = [];
        this.upcomingBeats = [];
        this.beatIndex = 0;
        
        // Settings
        this.difficulty = 'medium';
        this.noteSpawnOffset = this.travelTime; // Spawn notes this many seconds before hit time
        
        // Calibration offset (for audio/video sync issues)
        // Includes compensation for typical audio latency and YouTube API delays
        this.calibrationOffset = 0.15; // Default 150ms to compensate for system audio latency
        
        // Animation frame ID
        this.animationFrameId = null;
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleKeyRelease = this.handleKeyRelease.bind(this);
        this.handlePause = this.handlePause.bind(this);
    }

    /**
     * Initialize the game
     */
    async init() {
        // Initialize lanes
        this.initLanes();
        
        // Set up input callbacks
        this.inputHandler.setKeyPressCallback(this.handleKeyPress);
        this.inputHandler.setKeyReleaseCallback(this.handleKeyRelease);
        this.inputHandler.setPauseCallback(this.handlePause);
        
        // Set up YouTube player callbacks
        this.youtubePlayer.onStateChange((event) => {
            if (event.data === YT.PlayerState.ENDED) {
                this.endGame();
            }
        });
    }

    /**
     * Initialize lanes
     */
    initLanes() {
        this.lanes = [];
        for (let i = 0; i < 4; i++) {
            const lane = new Lane(
                i,
                this.renderer.getLaneX(i),
                this.renderer.getLaneWidth(),
                this.renderer.canvas.height,
                this.renderer.getHitZoneY()
            );
            this.lanes.push(lane);
        }
    }

    /**
     * Start a new game with the given URL and difficulty
     */
    async startGame(url, difficulty) {
        this.difficulty = difficulty;
        this.reset();
        
        try {
            // Show loading screen
            this.uiManager.showScreen('loading');
            this.uiManager.updateLoadingProgress(10, 'Initializing YouTube player...');
            
            // Initialize YouTube API
            await this.youtubePlayer.init();
            this.uiManager.updateLoadingProgress(30, 'Loading video...');
            
            // Load the video
            await this.youtubePlayer.loadVideo(url);
            this.uiManager.updateLoadingProgress(50, 'Preparing audio analysis...');
            
            // Get video duration
            const duration = this.youtubePlayer.getDuration();
            
            // Initialize audio analyzer
            this.audioAnalyzer.init();
            await this.audioAnalyzer.resume();
            this.uiManager.updateLoadingProgress(70, 'Generating beat map...');
            
            // Generate beats based on difficulty and duration
            // Since we can't access YouTube audio directly, we generate procedural beats
            const bpm = this.estimateBPMForDifficulty(difficulty);
            this.upcomingBeats = this.audioAnalyzer.generateBeatsForDuration(duration, difficulty, bpm);
            this.beatIndex = 0;
            
            // Set expected notes for progress tracking
            this.scoringSystem.setTotalExpectedNotes(this.upcomingBeats.length);
            
            this.uiManager.updateLoadingProgress(90, 'Starting game...');
            
            // Show game screen
            this.uiManager.showScreen('game');
            
            // Reset lanes for new screen size
            this.initLanes();
            
            // Show countdown
            await this.uiManager.showCountdown();
            
            // Start input handling
            this.inputHandler.start();
            
            // Start video playback
            this.youtubePlayer.play();
            
            // Start game loop
            this.isRunning = true;
            this.isPaused = false;
            this.isGameOver = false;
            this.gameStartTime = performance.now();
            this.lastFrameTime = this.gameStartTime;
            
            // Initialize timing synchronization
            this.lastYouTubeTime = this.youtubePlayer.getCurrentTime();
            this.lastYouTubeTimeUpdate = this.gameStartTime;
            this.interpolatedTime = this.lastYouTubeTime;
            
            this.animationFrameId = requestAnimationFrame(this.gameLoop);
            
        } catch (error) {
            console.error('Failed to start game:', error);
            this.uiManager.showScreen('start');
            this.uiManager.showError(error.message || 'Failed to load video');
        }
    }

    /**
     * Estimate BPM based on difficulty
     */
    estimateBPMForDifficulty(difficulty) {
        // Random BPM within typical ranges
        switch (difficulty) {
            case 'easy':
                return 80 + Math.floor(Math.random() * 40); // 80-120
            case 'medium':
                return 100 + Math.floor(Math.random() * 40); // 100-140
            case 'hard':
                return 120 + Math.floor(Math.random() * 60); // 120-180
            default:
                return 120;
        }
    }

    /**
     * Main game loop
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        if (!this.isPaused) {
            // Get current playback time with interpolation
            const playbackTime = this.getInterpolatedPlaybackTime(currentTime);
            
            // Update game state
            this.update(playbackTime, deltaTime);
            
            // Update UI
            this.updateUI();
        }
        
        // Render
        this.render();
        
        // Continue loop
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * Get interpolated playback time to reduce YouTube API latency
     * YouTube's getCurrentTime() can be 50-250ms behind, so we interpolate between updates
     */
    getInterpolatedPlaybackTime(currentTime) {
        // Query YouTube API every 100ms to stay synchronized
        const timeSinceLastUpdate = (currentTime - this.lastYouTubeTimeUpdate) / 1000;
        
        if (timeSinceLastUpdate > 0.1) {
            this.lastYouTubeTime = this.youtubePlayer.getCurrentTime();
            this.lastYouTubeTimeUpdate = currentTime;
            this.interpolatedTime = this.lastYouTubeTime;
        } else {
            // Interpolate time based on frame delta (assume normal playback speed)
            const deltaTime = (currentTime - this.lastYouTubeTimeUpdate) / 1000;
            this.interpolatedTime = this.lastYouTubeTime + deltaTime;
        }
        
        // Apply calibration offset
        return this.interpolatedTime + this.calibrationOffset;
    }

    /**
     * Update game state
     */
    update(currentTime, deltaTime) {
        // Spawn new notes
        this.spawnNotes(currentTime);
        
        // Update lanes
        for (const lane of this.lanes) {
            lane.update(deltaTime);
        }
        
        // Update notes
        for (const note of this.notes) {
            note.update(
                currentTime,
                this.travelTime,
                this.renderer.getHitZoneY(),
                this.renderer.getLaneX(note.lane),
                this.renderer.getLaneWidth(),
                this.renderer.getSpawnY()
            );
            
            // Handle missed notes
            if (note.status === 'missed' && !note.wasScored) {
                note.wasScored = true;
                this.scoringSystem.processMiss();
                this.uiManager.showHitFeedback('miss');
            }
        }
        
        // Remove notes that should be removed
        this.notes = this.notes.filter(note => !note.shouldRemove());
        
        // Check if game should end (all beats played and no active notes)
        if (this.beatIndex >= this.upcomingBeats.length && this.notes.length === 0) {
            // Give a small delay before ending
            if (!this.endTimeout) {
                this.endTimeout = setTimeout(() => {
                    this.endGame();
                }, 2000);
            }
        }
    }

    /**
     * Spawn notes from upcoming beats
     */
    spawnNotes(currentTime) {
        while (this.beatIndex < this.upcomingBeats.length) {
            const beat = this.upcomingBeats[this.beatIndex];
            const spawnTime = beat.time - this.noteSpawnOffset;
            
            if (currentTime >= spawnTime) {
                const note = new Note(beat.lane, beat.time, beat.intensity);
                this.notes.push(note);
                this.beatIndex++;
            } else {
                break;
            }
        }
    }

    /**
     * Handle key press
     */
    handleKeyPress(lane, pressTime) {
        if (this.isPaused || this.isGameOver) return;
        
        // Activate lane visual
        this.lanes[lane].press();
        
        // Get current playback time using interpolation for accuracy
        const currentTime = this.getInterpolatedPlaybackTime(performance.now());
        
        // Find the closest note in this lane
        let closestNote = null;
        let closestTimeDiff = Infinity;
        
        for (const note of this.notes) {
            if (note.lane === lane && note.isActive()) {
                const timeDiff = Math.abs(note.hitTime - currentTime);
                if (timeDiff < closestTimeDiff) {
                    closestTimeDiff = timeDiff;
                    closestNote = note;
                }
            }
        }
        
        // Check if we hit a note
        if (closestNote && closestTimeDiff <= 0.15) { // Within hit window
            const result = this.scoringSystem.judgeHit(closestTimeDiff);
            
            if (result !== 'miss') {
                // Hit the note
                closestNote.hit(result);
                closestNote.wasScored = true;
                
                // Process score
                this.scoringSystem.processHit(result);
                
                // Visual feedback
                this.lanes[lane].flash(result === 'perfect' ? 1 : 0.5);
                this.uiManager.showHitFeedback(result);
                
                // Particle effect
                this.renderer.createHitEffect(
                    closestNote.x + closestNote.width / 2,
                    this.renderer.getHitZoneY(),
                    closestNote.getColor(),
                    result === 'perfect' ? 1 : 0.6
                );
            }
        }
    }

    /**
     * Handle key release
     */
    handleKeyRelease(lane) {
        this.lanes[lane].release();
    }

    /**
     * Handle pause
     */
    handlePause() {
        if (this.isGameOver) return;
        
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    /**
     * Pause the game
     */
    pause() {
        this.isPaused = true;
        this.youtubePlayer.pause();
        this.uiManager.togglePause(true);
    }

    /**
     * Resume the game
     */
    resume() {
        this.isPaused = false;
        this.youtubePlayer.play();
        this.uiManager.togglePause(false);
    }

    /**
     * Restart the game
     */
    async restart() {
        this.uiManager.togglePause(false);
        const url = this.uiManager.getUrl();
        await this.startGame(url, this.difficulty);
    }

    /**
     * Quit to main menu
     */
    quit() {
        this.stop();
        this.uiManager.togglePause(false);
        this.uiManager.showScreen('start');
    }

    /**
     * End the game
     */
    endGame() {
        if (this.isGameOver) return;
        
        this.isGameOver = true;
        this.isRunning = false;
        
        // Stop input handling
        this.inputHandler.stop();
        
        // Stop video
        this.youtubePlayer.pause();
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Clear end timeout
        if (this.endTimeout) {
            clearTimeout(this.endTimeout);
            this.endTimeout = null;
        }
        
        // Get stats and update history with score
        const stats = this.scoringSystem.getStats();
        
        // Update history with final score
        if (this.historyManager) {
            const url = this.uiManager.getUrl();
            this.historyManager.updateScore(url, stats.score);
        }
        
        // Show results
        this.uiManager.showResults(stats);
    }

    /**
     * Stop the game
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        if (this.endTimeout) {
            clearTimeout(this.endTimeout);
            this.endTimeout = null;
        }
        
        this.inputHandler.stop();
        this.youtubePlayer.stop();
    }

    /**
     * Update UI displays
     */
    updateUI() {
        const stats = this.scoringSystem.getStats();
        this.uiManager.updateScore(stats.score);
        this.uiManager.updateCombo(stats.combo);
        this.uiManager.updateAccuracy(stats.accuracy);
    }

    /**
     * Render the game
     */
    render() {
        const currentTime = this.youtubePlayer.getCurrentTime();
        const duration = this.youtubePlayer.getDuration();
        
        const gameState = {
            lanes: this.lanes,
            notes: this.notes,
            combo: this.scoringSystem.getCombo(),
            currentTime: currentTime,
            duration: duration,
            frequencyData: null // Could add visualizer data here if available
        };
        
        this.renderer.render(gameState);
    }

    /**
     * Reset game state
     */
    reset() {
        this.notes = [];
        this.beatIndex = 0;
        this.isGameOver = false;
        this.isPaused = false;
        
        if (this.endTimeout) {
            clearTimeout(this.endTimeout);
            this.endTimeout = null;
        }
        
        this.scoringSystem.reset();
        this.audioAnalyzer.reset();
        this.uiManager.reset();
    }

    /**
     * Set calibration offset
     */
    setCalibrationOffset(offset) {
        this.calibrationOffset = offset;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stop();
        this.renderer.destroy();
        this.inputHandler.destroy();
        this.audioAnalyzer.destroy();
        this.youtubePlayer.destroy();
        this.uiManager.destroy();
    }
}

// Export as global
window.GameEngine = GameEngine;
