/**
 * Lane Class
 * Represents a single lane where notes travel
 */
class Lane {
    constructor(index, x, width, height, hitZoneY) {
        this.index = index;
        this.x = x;
        this.width = width;
        this.height = height;
        this.hitZoneY = hitZoneY;
        this.hitZoneHeight = 40;
        
        // Notes in this lane
        this.notes = [];
        
        // Visual state
        this.isPressed = false;
        this.pressAlpha = 0;
        this.hitFlash = 0;
        
        // Lane colors
        this.colors = [
            '#ff6b6b', // Red
            '#4ecdc4', // Teal
            '#ffe66d', // Yellow
            '#95e1d3'  // Mint
        ];
        
        // Key bindings
        this.keys = ['d', 'f', 'j', 'k'];
    }

    /**
     * Update lane state
     */
    update(deltaTime) {
        // Fade press effect
        if (!this.isPressed && this.pressAlpha > 0) {
            this.pressAlpha -= deltaTime * 5;
            if (this.pressAlpha < 0) this.pressAlpha = 0;
        }
        
        // Fade hit flash
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime * 3;
            if (this.hitFlash < 0) this.hitFlash = 0;
        }
    }

    /**
     * Set lane as pressed
     */
    press() {
        this.isPressed = true;
        this.pressAlpha = 1;
    }

    /**
     * Set lane as released
     */
    release() {
        this.isPressed = false;
    }

    /**
     * Trigger hit flash effect
     */
    flash(intensity = 1) {
        this.hitFlash = intensity;
    }

    /**
     * Get lane color
     */
    getColor() {
        return this.colors[this.index];
    }

    /**
     * Get lane key
     */
    getKey() {
        return this.keys[this.index].toUpperCase();
    }

    /**
     * Render the lane
     */
    render(ctx) {
        const color = this.getColor();
        
        // Lane background
        ctx.fillStyle = `rgba(30, 30, 50, 0.6)`;
        ctx.fillRect(this.x, 0, this.width, this.height);
        
        // Lane border
        ctx.strokeStyle = `rgba(100, 100, 150, 0.3)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, 0, this.width, this.height);
        
        // Press highlight
        if (this.pressAlpha > 0) {
            const gradient = ctx.createLinearGradient(this.x, 0, this.x, this.height);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.7, `rgba(${this.hexToRgb(color)}, ${this.pressAlpha * 0.1})`);
            gradient.addColorStop(1, `rgba(${this.hexToRgb(color)}, ${this.pressAlpha * 0.3})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, 0, this.width, this.height);
        }
        
        // Hit zone
        this.renderHitZone(ctx, color);
    }

    /**
     * Render the hit zone
     */
    renderHitZone(ctx, color) {
        const hitZoneTop = this.hitZoneY - this.hitZoneHeight / 2;
        
        // Hit zone glow
        if (this.hitFlash > 0) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 30 * this.hitFlash;
        }
        
        // Hit zone background
        ctx.fillStyle = `rgba(${this.hexToRgb(color)}, ${0.2 + this.pressAlpha * 0.3})`;
        ctx.fillRect(this.x + 5, hitZoneTop, this.width - 10, this.hitZoneHeight);
        
        // Hit zone border
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 + this.hitFlash * 2;
        ctx.strokeRect(this.x + 5, hitZoneTop, this.width - 10, this.hitZoneHeight);
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        // Key label
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + this.pressAlpha * 0.5})`;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getKey(), this.x + this.width / 2, hitZoneTop + this.hitZoneHeight / 2);
    }

    /**
     * Convert hex color to RGB string
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
        }
        return '255, 255, 255';
    }
}

// Export as global
window.Lane = Lane;
