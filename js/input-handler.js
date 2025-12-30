/**
 * Input Handler Module
 * Handles keyboard input for the game
 */
class InputHandler {
    constructor() {
        // Key bindings (lane index -> key)
        this.keyBindings = {
            'd': 0,
            'f': 1,
            'j': 2,
            'k': 3
        };
        
        // Reverse bindings (lane index -> key)
        this.laneToKey = ['d', 'f', 'j', 'k'];
        
        // Current key states
        this.keyStates = {
            d: false,
            f: false,
            j: false,
            k: false
        };
        
        // Callbacks
        this.onKeyPress = null;    // Called when a lane key is pressed
        this.onKeyRelease = null;  // Called when a lane key is released
        this.onPause = null;       // Called when pause key is pressed
        
        // Bound event handlers
        this.boundKeyDown = this.handleKeyDown.bind(this);
        this.boundKeyUp = this.handleKeyUp.bind(this);
        
        // Active state
        this.isActive = false;
    }

    /**
     * Start listening for input
     */
    start() {
        if (this.isActive) return;
        
        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
        this.isActive = true;
    }

    /**
     * Stop listening for input
     */
    stop() {
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
        this.isActive = false;
        
        // Reset all key states
        Object.keys(this.keyStates).forEach(key => {
            this.keyStates[key] = false;
        });
    }

    /**
     * Handle keydown event
     */
    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        
        // Handle pause key
        if (key === 'escape') {
            if (this.onPause) {
                this.onPause();
            }
            return;
        }
        
        // Check if it's a lane key
        if (this.keyBindings.hasOwnProperty(key)) {
            // Prevent key repeat
            if (this.keyStates[key]) return;
            
            this.keyStates[key] = true;
            const lane = this.keyBindings[key];
            
            if (this.onKeyPress) {
                this.onKeyPress(lane, performance.now());
            }
        }
    }

    /**
     * Handle keyup event
     */
    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        
        if (this.keyBindings.hasOwnProperty(key)) {
            this.keyStates[key] = false;
            const lane = this.keyBindings[key];
            
            if (this.onKeyRelease) {
                this.onKeyRelease(lane);
            }
        }
    }

    /**
     * Check if a lane key is currently pressed
     */
    isLanePressed(lane) {
        const key = this.laneToKey[lane];
        return this.keyStates[key] || false;
    }

    /**
     * Set callback for key press
     */
    setKeyPressCallback(callback) {
        this.onKeyPress = callback;
    }

    /**
     * Set callback for key release
     */
    setKeyReleaseCallback(callback) {
        this.onKeyRelease = callback;
    }

    /**
     * Set callback for pause
     */
    setPauseCallback(callback) {
        this.onPause = callback;
    }

    /**
     * Update key bindings
     */
    setKeyBindings(bindings) {
        this.keyBindings = {};
        this.laneToKey = [];
        
        bindings.forEach((key, index) => {
            const lowerKey = key.toLowerCase();
            this.keyBindings[lowerKey] = index;
            this.laneToKey[index] = lowerKey;
            this.keyStates[lowerKey] = false;
        });
    }

    /**
     * Get the key for a lane
     */
    getKeyForLane(lane) {
        return this.laneToKey[lane]?.toUpperCase() || '';
    }

    /**
     * Clean up
     */
    destroy() {
        this.stop();
        this.onKeyPress = null;
        this.onKeyRelease = null;
        this.onPause = null;
    }
}

// Export as global
window.InputHandler = InputHandler;
