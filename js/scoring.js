/**
 * Scoring System Module
 * Handles score calculation, combo tracking, and accuracy
 */
class ScoringSystem {
    constructor() {
        // Score values
        this.baseScores = {
            perfect: 100,
            good: 50,
            miss: 0
        };
        
        // Timing windows (in seconds)
        this.timingWindows = {
            perfect: 0.05,  // ±50ms
            good: 0.10      // ±100ms
        };
        
        // Current game stats
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalNotes = 0;
        this.hitNotes = 0;
        
        // Hit breakdown
        this.perfectCount = 0;
        this.goodCount = 0;
        this.missCount = 0;
        
        // Combo multiplier settings
        this.comboThresholds = [10, 25, 50, 100];
        this.comboMultipliers = [1, 1.5, 2, 2.5, 3];
    }

    /**
     * Reset all stats
     */
    reset() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalNotes = 0;
        this.hitNotes = 0;
        this.perfectCount = 0;
        this.goodCount = 0;
        this.missCount = 0;
    }

    /**
     * Judge a hit based on timing difference
     * @param {number} timeDiff - Absolute time difference in seconds
     * @returns {string} - 'perfect', 'good', or 'miss'
     */
    judgeHit(timeDiff) {
        const absTimeDiff = Math.abs(timeDiff);
        
        if (absTimeDiff <= this.timingWindows.perfect) {
            return 'perfect';
        } else if (absTimeDiff <= this.timingWindows.good) {
            return 'good';
        }
        
        return 'miss';
    }

    /**
     * Get current combo multiplier
     */
    getComboMultiplier() {
        let multiplierIndex = 0;
        
        for (let i = 0; i < this.comboThresholds.length; i++) {
            if (this.combo >= this.comboThresholds[i]) {
                multiplierIndex = i + 1;
            }
        }
        
        return this.comboMultipliers[multiplierIndex];
    }

    /**
     * Process a hit result
     * @param {string} result - 'perfect', 'good', or 'miss'
     * @returns {object} - Score earned and multiplier used
     */
    processHit(result) {
        this.totalNotes++;
        
        let scoreEarned = 0;
        let multiplier = 1;
        
        switch (result) {
            case 'perfect':
                this.perfectCount++;
                this.hitNotes++;
                this.combo++;
                multiplier = this.getComboMultiplier();
                scoreEarned = Math.floor(this.baseScores.perfect * multiplier);
                break;
                
            case 'good':
                this.goodCount++;
                this.hitNotes++;
                this.combo++;
                multiplier = this.getComboMultiplier();
                scoreEarned = Math.floor(this.baseScores.good * multiplier);
                break;
                
            case 'miss':
                this.missCount++;
                this.combo = 0;
                scoreEarned = 0;
                break;
        }
        
        // Update max combo
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // Add to score
        this.score += scoreEarned;
        
        return {
            scoreEarned,
            multiplier,
            combo: this.combo,
            result
        };
    }

    /**
     * Process a missed note (passed without hitting)
     */
    processMiss() {
        return this.processHit('miss');
    }

    /**
     * Get current score
     */
    getScore() {
        return this.score;
    }

    /**
     * Get current combo
     */
    getCombo() {
        return this.combo;
    }

    /**
     * Get max combo achieved
     */
    getMaxCombo() {
        return this.maxCombo;
    }

    /**
     * Calculate accuracy percentage
     */
    getAccuracy() {
        if (this.totalNotes === 0) return 100;
        
        // Weight: perfect = 100%, good = 50%, miss = 0%
        const weightedHits = (this.perfectCount * 1) + (this.goodCount * 0.5);
        const accuracy = (weightedHits / this.totalNotes) * 100;
        
        return Math.round(accuracy * 10) / 10; // Round to 1 decimal
    }

    /**
     * Get hit breakdown
     */
    getBreakdown() {
        return {
            perfect: this.perfectCount,
            good: this.goodCount,
            miss: this.missCount
        };
    }

    /**
     * Get complete stats
     */
    getStats() {
        return {
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            accuracy: this.getAccuracy(),
            totalNotes: this.totalNotes,
            hitNotes: this.hitNotes,
            breakdown: this.getBreakdown()
        };
    }

    /**
     * Get grade based on accuracy
     */
    getGrade() {
        const accuracy = this.getAccuracy();
        
        if (accuracy >= 95) return 'S';
        if (accuracy >= 90) return 'A';
        if (accuracy >= 80) return 'B';
        if (accuracy >= 70) return 'C';
        if (accuracy >= 60) return 'D';
        return 'F';
    }

    /**
     * Check if current hit result is "on fire" (high combo)
     */
    isOnFire() {
        return this.combo >= 25;
    }

    /**
     * Set custom timing windows
     */
    setTimingWindows(perfect, good) {
        this.timingWindows.perfect = perfect;
        this.timingWindows.good = good;
    }

    /**
     * Set expected total notes for progress tracking
     */
    setTotalExpectedNotes(count) {
        this.expectedNotes = count;
    }

    /**
     * Get progress percentage
     */
    getProgress() {
        if (!this.expectedNotes || this.expectedNotes === 0) return 0;
        return (this.totalNotes / this.expectedNotes) * 100;
    }
}

// Export as global
window.ScoringSystem = ScoringSystem;
