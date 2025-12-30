/**
 * YouTube Player Module
 * Handles YouTube IFrame API integration
 */
class YouTubePlayerManager {
    constructor() {
        this.player = null;
        this.isReady = false;
        this.isPlaying = false;
        this.duration = 0;
        this.onReadyCallback = null;
        this.onStateChangeCallback = null;
        this.onErrorCallback = null;
    }

    /**
     * Initialize the YouTube IFrame API
     */
    init() {
        return new Promise((resolve, reject) => {
            // Load YouTube IFrame API
            if (window.YT && window.YT.Player) {
                resolve();
                return;
            }

            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                resolve();
            };

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!window.YT) {
                    reject(new Error('Failed to load YouTube API'));
                }
            }, 10000);
        });
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
     * Load a YouTube video
     */
    loadVideo(url) {
        return new Promise((resolve, reject) => {
            const videoId = this.extractVideoId(url);
            if (!videoId) {
                reject(new Error('Invalid YouTube URL'));
                return;
            }

            // Destroy existing player if any
            if (this.player) {
                this.player.destroy();
            }

            this.player = new YT.Player('youtube-player', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3
                },
                events: {
                    onReady: (event) => {
                        this.isReady = true;
                        this.duration = event.target.getDuration();
                        if (this.onReadyCallback) {
                            this.onReadyCallback(event);
                        }
                        resolve(event);
                    },
                    onStateChange: (event) => {
                        this.handleStateChange(event);
                        if (this.onStateChangeCallback) {
                            this.onStateChangeCallback(event);
                        }
                    },
                    onError: (event) => {
                        const errorMessage = this.getErrorMessage(event.data);
                        if (this.onErrorCallback) {
                            this.onErrorCallback(errorMessage);
                        }
                        reject(new Error(errorMessage));
                    }
                }
            });
        });
    }

    /**
     * Handle player state changes
     */
    handleStateChange(event) {
        switch (event.data) {
            case YT.PlayerState.PLAYING:
                this.isPlaying = true;
                break;
            case YT.PlayerState.PAUSED:
                this.isPlaying = false;
                break;
            case YT.PlayerState.ENDED:
                this.isPlaying = false;
                break;
        }
    }

    /**
     * Get human-readable error message
     */
    getErrorMessage(errorCode) {
        const errors = {
            2: 'Invalid video ID',
            5: 'HTML5 player error',
            100: 'Video not found or removed',
            101: 'Video cannot be embedded',
            150: 'Video cannot be embedded'
        };
        return errors[errorCode] || 'Unknown error occurred';
    }

    /**
     * Play the video
     */
    play() {
        if (this.player && this.isReady) {
            this.player.playVideo();
        }
    }

    /**
     * Pause the video
     */
    pause() {
        if (this.player && this.isReady) {
            this.player.pauseVideo();
        }
    }

    /**
     * Stop the video
     */
    stop() {
        if (this.player && this.isReady) {
            this.player.stopVideo();
        }
    }

    /**
     * Seek to specific time
     */
    seekTo(seconds, allowSeekAhead = true) {
        if (this.player && this.isReady) {
            this.player.seekTo(seconds, allowSeekAhead);
        }
    }

    /**
     * Get current playback time
     */
    getCurrentTime() {
        if (this.player && this.isReady) {
            return this.player.getCurrentTime();
        }
        return 0;
    }

    /**
     * Get video duration
     */
    getDuration() {
        return this.duration;
    }

    /**
     * Get player state
     */
    getState() {
        if (this.player && this.isReady) {
            return this.player.getPlayerState();
        }
        return -1;
    }

    /**
     * Set volume (0-100)
     */
    setVolume(volume) {
        if (this.player && this.isReady) {
            this.player.setVolume(volume);
        }
    }

    /**
     * Check if video is currently playing
     */
    isVideoPlaying() {
        return this.isPlaying;
    }

    /**
     * Set callback for when player is ready
     */
    onReady(callback) {
        this.onReadyCallback = callback;
    }

    /**
     * Set callback for state changes
     */
    onStateChange(callback) {
        this.onStateChangeCallback = callback;
    }

    /**
     * Set callback for errors
     */
    onError(callback) {
        this.onErrorCallback = callback;
    }

    /**
     * Clean up player
     */
    destroy() {
        if (this.player) {
            this.player.destroy();
            this.player = null;
            this.isReady = false;
            this.isPlaying = false;
        }
    }
}

// Export as global
window.YouTubePlayerManager = YouTubePlayerManager;
