# 🎵 YouTube Rhythm Game

A browser-based rhythm game that lets you play along to any YouTube video! Notes travel down lanes synchronized to the music, and you hit them in time with the beat.

## Features

- **YouTube Integration**: Play along to any YouTube video
- **Three Difficulty Levels**: Easy, Medium, and Hard
- **Procedural Beat Generation**: Automatically generates notes based on song duration and difficulty
- **Real-time Scoring**: Perfect/Good/Miss hit detection with combo multipliers
- **Visual Feedback**: Particle effects, lane highlights, and hit feedback
- **Responsive Design**: Works on various screen sizes
- **Background Visualizer**: Audio-reactive background (when available)

## Controls

| Key | Lane |
|-----|------|
| D | Lane 1 (Red) |
| F | Lane 2 (Teal) |
| J | Lane 3 (Yellow) |
| K | Lane 4 (Mint) |
| ESC | Pause/Resume |

## How to Play

1. Open `index.html` in a modern web browser
2. Paste a YouTube URL in the input field
3. Select your difficulty level
4. Click "Play" to start
5. Hit the notes as they reach the hit zone at the bottom
6. Try to get Perfect hits for maximum score!

## Timing Windows

- **Perfect**: ±50ms
- **Good**: ±100ms
- **Miss**: >100ms

## Scoring

- Perfect Hit: 100 points × combo multiplier
- Good Hit: 50 points × combo multiplier
- Miss: 0 points (resets combo)

### Combo Multipliers

| Combo | Multiplier |
|-------|------------|
| 0-9 | 1.0x |
| 10-24 | 1.5x |
| 25-49 | 2.0x |
| 50-99 | 2.5x |
| 100+ | 3.0x |

## Project Structure

```
rhythm-game/
├── index.html              # Main HTML file
├── README.md               # This file
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── main.js             # Entry point
│   ├── youtube-player.js   # YouTube API integration
│   ├── audio-analyzer.js   # Beat detection & generation
│   ├── game-engine.js      # Core game loop
│   ├── note.js             # Note class
│   ├── lane.js             # Lane class
│   ├── input-handler.js    # Keyboard input
│   ├── renderer.js         # Canvas rendering
│   ├── scoring.js          # Score & combo system
│   └── ui-manager.js       # UI screens
└── assets/
    └── sounds/             # Hit sounds (optional)
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Technical Notes

### YouTube Audio Access

Due to CORS restrictions, we cannot directly access YouTube's audio stream for real-time beat detection. Instead, the game uses procedural beat generation based on:
- Video duration
- Selected difficulty
- Randomized BPM within typical ranges

### Future Improvements

- Real-time beat detection using Web Audio API with local files
- Custom key bindings
- Practice mode with speed modifiers
- Leaderboards
- Multiplayer mode
- Mobile/touch support

## Development

No build process required! Simply serve the files with any static web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Using VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

## License

MIT License - Feel free to use and modify!
