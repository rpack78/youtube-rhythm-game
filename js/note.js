/**
 * Note Class
 * Represents a single note in the game
 */
class Note {
    constructor(lane, hitTime, intensity = 1) {
        this.lane = lane;           // Lane index (0-3)
        this.hitTime = hitTime;     // Time when note should be hit
        this.intensity = intensity; // Visual intensity (affects size/glow)
        
        // Position and dimensions
        this.x = 0;
        this.y = 0;
        this.width = 60;
        this.height = 20;
        this.radius = 10;
        
        // State
        this.status = 'active'; // 'active', 'hit', 'missed', 'removed'
        this.hitResult = null;  // 'perfect', 'good', null
        
        // Animation
        this.alpha = 1;
        this.scale = 1;
        this.glowIntensity = 0;
        
        // Visual properties per lane
        this.colors = [
            '#ff6b6b', // Lane 0 - Red
            '#4ecdc4', // Lane 1 - Teal
            '#ffe66d', // Lane 2 - Yellow
            '#95e1d3'  // Lane 3 - Mint
        ];
    }

    /**
     * Update note position based on current time
     */
    update(currentTime, travelTime, hitZoneY, laneX, laneWidth, spawnY) {
        // Calculate time until hit
        const timeUntilHit = this.hitTime - currentTime;
        const progress = 1 - (timeUntilHit / travelTime);
        
        // Calculate Y position (spawn at top, travel to hit zone)
        this.y = spawnY + (hitZoneY - spawnY) * progress;
        
        // Calculate X position (center in lane)
        this.x = laneX + (laneWidth - this.width) / 2;
        
        // Check if note was missed
        if (timeUntilHit < -0.15 && this.status === 'active') {
            this.status = 'missed';
        }
        
        // Remove notes that are too far past the hit zone
        if (timeUntilHit < -0.5) {
            this.status = 'removed';
        }
        
        // Update hit animation
        if (this.status === 'hit') {
            this.alpha -= 0.1;
            this.scale += 0.15;
            if (this.alpha <= 0) {
                this.status = 'removed';
            }
        }
        
        // Update miss animation
        if (this.status === 'missed') {
            this.alpha -= 0.05;
            if (this.alpha <= 0) {
                this.status = 'removed';
            }
        }
        
        // Glow effect as note approaches hit zone
        if (this.status === 'active') {
            const proximityToHitZone = 1 - Math.abs(timeUntilHit);
            this.glowIntensity = Math.max(0, proximityToHitZone * 0.5);
        }
    }

    /**
     * Mark note as hit
     */
    hit(result) {
        this.status = 'hit';
        this.hitResult = result;
    }

    /**
     * Mark note as missed
     */
    miss() {
        this.status = 'missed';
    }

    /**
     * Check if note is still active
     */
    isActive() {
        return this.status === 'active';
    }

    /**
     * Check if note should be removed
     */
    shouldRemove() {
        return this.status === 'removed';
    }

    /**
     * Get the note's color based on lane
     */
    getColor() {
        return this.colors[this.lane] || '#ffffff';
    }

    /**
     * Render the note
     */
    render(ctx) {
        ctx.save();
        
        const color = this.getColor();
        
        // Apply alpha
        ctx.globalAlpha = Math.max(0, this.alpha);
        
        // Apply scale transformation for hit effect
        if (this.status === 'hit') {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.scale(this.scale, this.scale);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        }
        
        // Glow effect
        if (this.glowIntensity > 0 || this.status === 'hit') {
            ctx.shadowColor = color;
            ctx.shadowBlur = 20 * (this.glowIntensity + (this.status === 'hit' ? 1 : 0));
        }
        
        // Draw note body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, this.radius);
        ctx.fill();
        
        // Draw inner highlight
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, this.radius);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, this.radius);
        ctx.stroke();
        
        ctx.restore();
    }
}

// Export as global
window.Note = Note;
