# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Opus Neon Fighter X - a complete browser-based space shooter game with multiple ship types, special abilities, power-up stacking system, and a boss fight.

## Commands

### Running the Game
- Open `index.html` in any modern web browser
- Or use `python3 -m http.server 8000` and navigate to `localhost:8000`
- No build process or dependencies required
- Game runs entirely client-side using HTML5 Canvas and JavaScript

### Testing
- Test intro sequence and all ship selection options
- Verify all 6 ship types and their unique special abilities (key: 0)
- Test power-up stacking system (power-ups persist until player is hit)
- Verify infiltrator enemy behavior (appears behind player on level 2+)
- Test octopus boss with tentacle mechanics on level 3
- Check browser console for any JavaScript errors
- Verify audio works (uses Web Audio API)

## Architecture

The game is split into modular files:

- **index.html**: Main HTML structure with embedded CSS
- **game.js**: Core game logic and mechanics
- **assets/**: Organized asset folders
  - `ships/`: Player ship images (stealth, titan, viper, opus)
  - `enemies/`: Enemy sprites (infiltrator, octopus_boss)
  - `screens/`: Intro sequence screens

### Ship System
Six unique ship types with special abilities:
- **Stealth**: Invisibility for 5 seconds (enemies can't target)
- **Titan**: Heavy armor with regenerating shield
- **Viper**: Super fast with speed boost ability
- **Opus**: Pulse cannon special weapon
- **Striker**: Charged plasma cannon
- **Phantom**: Phase shift (pass through bullets)

### Game Features
- **Power-up Stacking**: Collect multiple power-ups that stack until hit
- **Infiltrator Enemy**: Special enemy that appears behind player and attacks both player and other enemies
- **Octopus Boss**: Final boss with animated tentacles and multiple attack phases
- **Special Ability System**: Each ship has unique ability activated with "0" key
- **Intro Sequence**: Story screens before ship selection

### Controls
- Arrow Keys: Move
- Space: Fire
- 0: Special Ability
- ESC: Pause