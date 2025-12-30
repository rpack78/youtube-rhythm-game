/**
 * History Manager Module
 * Manages play history with video titles stored in localStorage
 */
class HistoryManager {
    constructor() {
        this.storageKey = 'rhythmGameHistory';
        this.maxHistoryItems = 10;
        this.history = this.loadHistory();
    }

    /**
     * Load history from localStorage
     */
    loadHistory() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load history:', error);
            return [];
        }
    }

    /**
     * Save history to localStorage
     */
    saveHistory() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }

    /**
     * Extract video ID from YouTube URL
     */
    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    /**
     * Fetch video title from YouTube oEmbed API
     */
    async fetchVideoTitle(url) {
        try {
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
            const response = await fetch(oembedUrl);
            
            if (!response.ok) {
                throw new Error('Failed to fetch video info');
            }
            
            const data = await response.json();
            return data.title || 'Unknown Title';
        } catch (error) {
            console.warn('Could not fetch video title:', error);
            return 'Unknown Title';
        }
    }

    /**
     * Add a video to history
     */
    async addToHistory(url, difficulty, score = null) {
        const videoId = this.extractVideoId(url);
        if (!videoId) return;

        // Check if already in history
        const existingIndex = this.history.findIndex(item => item.videoId === videoId);
        
        let historyItem;
        
        if (existingIndex !== -1) {
            // Update existing entry
            historyItem = this.history[existingIndex];
            historyItem.lastPlayed = Date.now();
            historyItem.playCount = (historyItem.playCount || 1) + 1;
            if (score !== null && (historyItem.highScore === undefined || score > historyItem.highScore)) {
                historyItem.highScore = score;
            }
            // Move to top
            this.history.splice(existingIndex, 1);
            this.history.unshift(historyItem);
        } else {
            // Fetch title for new entry
            const title = await this.fetchVideoTitle(url);
            
            historyItem = {
                videoId: videoId,
                url: url,
                title: title,
                difficulty: difficulty,
                lastPlayed: Date.now(),
                playCount: 1,
                highScore: score
            };
            
            // Add to beginning
            this.history.unshift(historyItem);
            
            // Trim to max items
            if (this.history.length > this.maxHistoryItems) {
                this.history = this.history.slice(0, this.maxHistoryItems);
            }
        }
        
        this.saveHistory();
        return historyItem;
    }

    /**
     * Update score for the most recent play
     */
    updateScore(url, score) {
        const videoId = this.extractVideoId(url);
        if (!videoId) return;

        const item = this.history.find(h => h.videoId === videoId);
        if (item) {
            if (item.highScore === undefined || score > item.highScore) {
                item.highScore = score;
                this.saveHistory();
            }
        }
    }

    /**
     * Get all history items
     */
    getHistory() {
        return this.history;
    }

    /**
     * Clear all history
     */
    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    /**
     * Remove a specific item from history
     */
    removeFromHistory(videoId) {
        this.history = this.history.filter(item => item.videoId !== videoId);
        this.saveHistory();
    }

    /**
     * Format relative time
     */
    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return new Date(timestamp).toLocaleDateString();
    }
}

// Export as global
window.HistoryManager = HistoryManager;
