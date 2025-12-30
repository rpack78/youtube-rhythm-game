/**
 * Audio Analyzer Module
 * Handles beat detection and audio analysis using Web Audio API
 */
class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.frequencyData = null;
        this.timeData = null;
        this.beats = [];
        this.isAnalyzing = false;

        // Beat detection parameters
        this.sensitivity = 1.5;
        this.minBeatInterval = 0.15; // Minimum seconds between beats
        this.lastBeatTime = 0;
        this.energyHistory = [];
        this.historySize = 43; // About 1 second of history at 60fps

        // Frequency ranges for analysis
        this.lowFreqRange = { min: 0, max: 10 };      // Bass (kick drums)
        this.midFreqRange = { min: 10, max: 80 };     // Mids (snares, vocals)
        this.highFreqRange = { min: 80, max: 200 };   // Highs (hi-hats, cymbals)

        // Difficulty settings
        this.difficultySettings = {
            easy: { threshold: 2.0, minInterval: 0.8, maxNotes: 0.3 },
            medium: { threshold: 1.5, minInterval: 0.4, maxNotes: 0.6 },
            hard: { threshold: 1.2, minInterval: 0.2, maxNotes: 1.0 }
        };
    }

    /**
     * Initialize Web Audio API context
     */
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.3;
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.frequencyData = new Uint8Array(bufferLength);
            this.timeData = new Uint8Array(bufferLength);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Web Audio API:', error);
            return false;
        }
    }

    /**
     * Resume audio context (required after user interaction)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Calculate energy in a frequency range
     */
    calculateEnergy(data, range) {
        let energy = 0;
        const startBin = Math.floor(range.min);
        const endBin = Math.min(Math.floor(range.max), data.length);
        
        for (let i = startBin; i < endBin; i++) {
            energy += data[i] * data[i];
        }
        
        return Math.sqrt(energy / (endBin - startBin));
    }

    /**
     * Get average energy from history
     */
    getAverageEnergy() {
        if (this.energyHistory.length === 0) return 0;
        const sum = this.energyHistory.reduce((a, b) => a + b, 0);
        return sum / this.energyHistory.length;
    }

    /**
     * Detect beat in current audio frame
     */
    detectBeat(currentTime) {
        if (!this.analyser) return null;

        this.analyser.getByteFrequencyData(this.frequencyData);

        // Calculate energy in bass frequencies (most reliable for beat detection)
        const bassEnergy = this.calculateEnergy(this.frequencyData, this.lowFreqRange);
        const midEnergy = this.calculateEnergy(this.frequencyData, this.midFreqRange);
        const combinedEnergy = bassEnergy * 0.7 + midEnergy * 0.3;

        // Add to history
        this.energyHistory.push(combinedEnergy);
        if (this.energyHistory.length > this.historySize) {
            this.energyHistory.shift();
        }

        const averageEnergy = this.getAverageEnergy();
        const threshold = averageEnergy * this.sensitivity;

        // Detect beat if energy exceeds threshold and enough time has passed
        if (combinedEnergy > threshold && combinedEnergy > 30) {
            const timeSinceLastBeat = currentTime - this.lastBeatTime;
            
            if (timeSinceLastBeat >= this.minBeatInterval) {
                this.lastBeatTime = currentTime;
                
                // Determine beat intensity
                const intensity = combinedEnergy / Math.max(averageEnergy, 1);
                
                return {
                    time: currentTime,
                    intensity: intensity,
                    bassEnergy: bassEnergy,
                    midEnergy: midEnergy
                };
            }
        }

        return null;
    }

    /**
     * Get current frequency data for visualization
     */
    getFrequencyData() {
        if (!this.analyser) return null;
        this.analyser.getByteFrequencyData(this.frequencyData);
        return this.frequencyData;
    }

    /**
     * Get current time domain data for visualization
     */
    getTimeData() {
        if (!this.analyser) return null;
        this.analyser.getByteTimeDomainData(this.timeData);
        return this.timeData;
    }

    /**
     * Generate beats for a simulated audio track
     * Since we can't directly access YouTube audio, we'll generate beats
     * based on common BPM patterns and refine with visual analysis
     */
    generateBeatsForDuration(duration, difficulty = 'medium', bpm = 120) {
        this.beats = [];
        const settings = this.difficultySettings[difficulty];
        const beatInterval = 60 / bpm; // Seconds per beat

        let currentTime = 2; // Start after 2 seconds
        const endTime = duration - 2; // End 2 seconds before end

        while (currentTime < endTime) {
            // Add main beats
            if (Math.random() < settings.maxNotes) {
                this.beats.push({
                    time: currentTime,
                    lane: Math.floor(Math.random() * 4),
                    intensity: 1
                });
            }

            // Add subdivisions for harder difficulties
            if (difficulty !== 'easy' && Math.random() < 0.3) {
                const subdivision = currentTime + beatInterval / 2;
                if (subdivision < endTime) {
                    this.beats.push({
                        time: subdivision,
                        lane: Math.floor(Math.random() * 4),
                        intensity: 0.7
                    });
                }
            }

            // Add rapid notes for hard difficulty
            if (difficulty === 'hard' && Math.random() < 0.2) {
                const rapid1 = currentTime + beatInterval / 4;
                const rapid2 = currentTime + (beatInterval * 3) / 4;
                if (rapid1 < endTime) {
                    this.beats.push({
                        time: rapid1,
                        lane: Math.floor(Math.random() * 4),
                        intensity: 0.5
                    });
                }
                if (rapid2 < endTime) {
                    this.beats.push({
                        time: rapid2,
                        lane: Math.floor(Math.random() * 4),
                        intensity: 0.5
                    });
                }
            }

            currentTime += beatInterval;
        }

        // Sort beats by time
        this.beats.sort((a, b) => a.time - b.time);

        // Ensure no two notes are on the same lane at nearly the same time
        this.preventOverlaps();

        return this.beats;
    }

    /**
     * Prevent overlapping notes on the same lane
     */
    preventOverlaps() {
        const minGap = 0.2; // Minimum 200ms between notes on same lane
        
        for (let i = 1; i < this.beats.length; i++) {
            const prev = this.beats[i - 1];
            const curr = this.beats[i];
            
            if (curr.lane === prev.lane && curr.time - prev.time < minGap) {
                // Move to a different lane
                const availableLanes = [0, 1, 2, 3].filter(l => l !== prev.lane);
                curr.lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
            }
        }
    }

    /**
     * Get beats within a time range
     */
    getBeatsInRange(startTime, endTime) {
        return this.beats.filter(beat => beat.time >= startTime && beat.time <= endTime);
    }

    /**
     * Get all detected/generated beats
     */
    getAllBeats() {
        return this.beats;
    }

    /**
     * Set difficulty which affects beat detection sensitivity
     */
    setDifficulty(difficulty) {
        const settings = this.difficultySettings[difficulty];
        if (settings) {
            this.sensitivity = settings.threshold;
            this.minBeatInterval = settings.minInterval;
        }
    }

    /**
     * Estimate BPM from beat times
     */
    estimateBPM(beatTimes) {
        if (beatTimes.length < 2) return 120; // Default BPM

        const intervals = [];
        for (let i = 1; i < beatTimes.length; i++) {
            intervals.push(beatTimes[i] - beatTimes[i - 1]);
        }

        // Get median interval
        intervals.sort((a, b) => a - b);
        const medianInterval = intervals[Math.floor(intervals.length / 2)];

        // Convert to BPM
        const bpm = 60 / medianInterval;

        // Clamp to reasonable range
        return Math.max(60, Math.min(200, Math.round(bpm)));
    }

    /**
     * Reset analyzer state
     */
    reset() {
        this.beats = [];
        this.energyHistory = [];
        this.lastBeatTime = 0;
        this.isAnalyzing = false;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.reset();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.analyser = null;
    }
}

// Export as global
window.AudioAnalyzer = AudioAnalyzer;
