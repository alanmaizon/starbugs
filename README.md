# STARBUGS: A 3D Space Shooter Game

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [How to Play](#how-to-play)
- [Controls](#controls)
- [Testing](#testing)
- [Known Issues](#known-issues)
- [Contributing](#contributing)
- [License](#license)

## Introduction

**STARBUGS** is an exciting 3D space shooter game built with Three.js, where players control a spaceship to shoot down enemy ships. The game features dynamic enemy movements, collision detection, scoring, and modals for instructions and game status.

## Features

- Real-time 3D graphics with Three.js
- Player spaceship movement and shooting mechanics
- Dynamic enemy spawn and movement
- Collision detection and scoring system
- Audio effects for background music, shooting, and collisions
- Game over and restart functionalities

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/starbugs.git
   cd starbugs
   ```

2. **Install the Dependencies:**

   This game runs on a web server. Make sure to have Python or another local server installed.

   ```bash
   python -m http.server
   ```

3. **Open the Game in a Browser:**

   Open your web browser and go to `http://localhost:8000`.

## How to Play

- Start the game by clicking the "Start" button on the welcome screen.
- Use the arrow keys or touch controls to move your spaceship left or right.
- Press the space bar or tap the screen to shoot bullets.
- Shoot down all enemies to win the game.

## Controls

- **Move Left**: Arrow Left Key / Swipe Left
- **Move Right**: Arrow Right Key / Swipe Right
- **Shoot**: Space Bar / Tap Screen

## Testing

The game has been tested for:
- Player movement and shooting
- Enemy spawn, movement, and collision detection
- Score updates and game over scenarios

See the [Testing and Debugging Report](#testing-and-debugging-report) for more details.

## Known Issues

- Audio effects may not play correctly on some browsers due to autoplay restrictions.
- Collision detection may be delayed occasionally.

## Contributing

Contributions are welcome! Please fork the repository, make your changes, and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```
