/**
 * Renderer Module
 * Handles all canvas rendering for the game
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Dimensions
        this.width = 0;
        this.height = 0;
        
        // Game area settings
        this.laneCount = 4;
        this.laneWidth = 80;
        this.gameAreaWidth = this.laneCount * this.laneWidth;
        this.gameAreaX = 0;
        this.hitZoneY = 0;
        this.hitZoneHeight = 40;
        
        // Visual settings
        this.backgroundColor = '#0a0a0f';
        this.laneColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3'];
        
        // Particles
        this.particles = [];
        
        // Visualizer data
        this.visualizerData = null;
        
        // Initialize size
        this.resize();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Resize canvas and recalculate dimensions
     */
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Center game area
        this.gameAreaX = (this.width - this.gameAreaWidth) / 2;
        
        // Hit zone near bottom
        this.hitZoneY = this.height - 120;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Render background visualizer
     */
    renderVisualizer(frequencyData) {
        if (!frequencyData) return;
        
        const ctx = this.ctx;
        const barCount = 64;
        const barWidth = this.width / barCount;
        const maxHeight = this.height * 0.3;
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        
        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * (frequencyData.length / barCount));
            const value = frequencyData[dataIndex] / 255;
            const barHeight = value * maxHeight;
            
            // Gradient color based on frequency
            const hue = (i / barCount) * 60 + 240; // Purple to blue range
            ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${0.3 + value * 0.4})`;
            
            // Draw from bottom
            ctx.fillRect(
                i * barWidth,
                this.height - barHeight,
                barWidth - 2,
                barHeight
            );
            
            // Mirror from top
            ctx.fillRect(
                i * barWidth,
                0,
                barWidth - 2,
                barHeight * 0.3
            );
        }
        
        ctx.restore();
    }

    /**
     * Render all lanes
     */
    renderLanes(lanes) {
        for (const lane of lanes) {
            lane.render(this.ctx);
        }
    }

    /**
     * Render all notes
     */
    renderNotes(notes) {
        for (const note of notes) {
            note.render(this.ctx);
        }
    }

    /**
     * Render hit effect particles
     */
    renderParticles() {
        const ctx = this.ctx;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update particle
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
            p.life -= 0.02;
            p.size *= 0.98;
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Render particle
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }

    /**
     * Create hit effect particles
     */
    createHitEffect(x, y, color, intensity = 1) {
        const particleCount = Math.floor(15 * intensity);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = 3 + Math.random() * 5;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 4 + Math.random() * 4,
                color: color,
                life: 1
            });
        }
    }

    /**
     * Render combo popup effect
     */
    renderComboEffect(combo, x, y) {
        if (combo < 5) return;
        
        const ctx = this.ctx;
        
        ctx.save();
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Glow effect
        ctx.shadowColor = combo >= 50 ? '#ff6b6b' : combo >= 25 ? '#ffe66d' : '#4ecdc4';
        ctx.shadowBlur = 20;
        
        // Gradient text
        const gradient = ctx.createLinearGradient(x - 50, y, x + 50, y);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, combo >= 50 ? '#ff6b6b' : combo >= 25 ? '#ffe66d' : '#4ecdc4');
        ctx.fillStyle = gradient;
        
        ctx.fillText(`${combo}x`, x, y - 60);
        
        ctx.restore();
    }

    /**
     * Render progress bar
     */
    renderProgressBar(progress, duration, currentTime) {
        const ctx = this.ctx;
        const barWidth = 300;
        const barHeight = 4;
        const x = this.width - barWidth - 350; // Position left of YouTube player
        const y = 20;
        
        // Background
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Progress
        const progressWidth = (currentTime / duration) * barWidth;
        const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
        gradient.addColorStop(0, '#6c5ce7');
        gradient.addColorStop(1, '#fd79a8');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, progressWidth, barHeight);
        
        // Time text
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'left';
        ctx.fillText(this.formatTime(currentTime), x, y + 20);
        ctx.textAlign = 'right';
        ctx.fillText(this.formatTime(duration), x + barWidth, y + 20);
    }

    /**
     * Format time as MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Render the complete game frame
     */
    render(gameState) {
        this.clear();
        
        // Background visualizer
        if (gameState.frequencyData) {
            this.renderVisualizer(gameState.frequencyData);
        }
        
        // Lanes
        if (gameState.lanes) {
            this.renderLanes(gameState.lanes);
        }
        
        // Notes
        if (gameState.notes) {
            this.renderNotes(gameState.notes);
        }
        
        // Particles
        this.renderParticles();
        
        // Progress bar
        if (gameState.duration && gameState.currentTime !== undefined) {
            this.renderProgressBar(
                gameState.progress || 0,
                gameState.duration,
                gameState.currentTime
            );
        }
        
        // Combo effect
        if (gameState.combo && gameState.combo >= 5) {
            this.renderComboEffect(
                gameState.combo,
                this.gameAreaX + this.gameAreaWidth / 2,
                this.hitZoneY
            );
        }
    }

    /**
     * Get lane X position
     */
    getLaneX(laneIndex) {
        return this.gameAreaX + laneIndex * this.laneWidth;
    }

    /**
     * Get lane width
     */
    getLaneWidth() {
        return this.laneWidth;
    }

    /**
     * Get hit zone Y position
     */
    getHitZoneY() {
        return this.hitZoneY;
    }

    /**
     * Get spawn Y position (top of screen)
     */
    getSpawnY() {
        return -30;
    }

    /**
     * Get game area bounds
     */
    getGameArea() {
        return {
            x: this.gameAreaX,
            width: this.gameAreaWidth,
            height: this.height
        };
    }

    /**
     * Clean up
     */
    destroy() {
        window.removeEventListener('resize', this.resize);
        this.particles = [];
    }
}

// Export as global
window.Renderer = Renderer;
