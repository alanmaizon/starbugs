# STARBUGS: A 3D Space Shooter Game

## Table of Contents

- [Introduction](#introduction)
- [Project Structure](#project-structure)
- [Features](#features)
- [Web Version](#web-version)
- [iOS Version](#ios-version)
- [How to Play](#how-to-play)
- [Controls](#controls)
- [Deployment](#deployment)
- [Testing](#testing)
- [Known Issues](#known-issues)
- [Contributing](#contributing)
- [License](#license)

## Introduction

**STARBUGS** is an exciting 3D space shooter game where players control a spaceship to shoot down waves of enemy ships. The project includes both a **web version** (Three.js) and a native **iOS version** (SceneKit / SwiftUI).

## Project Structure

```
starbugs/
├── web/                  # Web version (static site)
│   ├── index.html
│   └── static/
│       ├── css/
│       ├── images/
│       ├── js/
│       └── models/
├── ios/                  # iOS version (Xcode project)
│   └── starbugs/
│       ├── starbugs/
│       │   └── GameView.swift
│       ├── starbugs.xcodeproj/
│       └── ...
├── .github/workflows/    # GitHub Pages deployment
├── planning-analysis-sheet.md
├── testing-and-debugging-report.md
└── README.md
```

## Features

Both versions share the same core gameplay:

- Real-time 3D graphics (Three.js on web, SceneKit on iOS)
- Player spaceship movement and shooting mechanics
- Wave-based enemy spawning with random positioning
- Collision detection between bullets and enemies
- Player-enemy collision triggers game over
- Score tracking
- Game over and restart functionality

### Web-Specific Features
- Keyboard and touch controls
- Galaxy skybox background
- Responsive window resizing
- Deployable to GitHub Pages as a static site

### iOS-Specific Features
- Native SwiftUI interface with SceneKit rendering
- Liquid-glass style on-screen controls
- Hyperspace particle effects
- 3D USDZ model support
- Smooth hold-to-move controls at 60 FPS

## Web Version

### Running Locally

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/alanmaizon/starbugs.git
   cd starbugs/web
   ```

2. **Start a Local Server:**

   ```bash
   python -m http.server
   ```

3. **Open in Browser:**

   Navigate to `http://localhost:8000`.

### Live Demo

The web version is deployed via GitHub Pages. Visit the live site at:
`https://alanmaizon.github.io/starbugs/`

## iOS Version

1. Open `ios/starbugs/starbugs.xcodeproj` in Xcode.
2. Select a simulator or connected device.
3. Build and run the project.

## How to Play

- Start the game by clicking/tapping the **START** button.
- Move your spaceship left or right to dodge enemies.
- Shoot bullets to destroy incoming enemy waves.
- Survive as long as possible and get the highest score!

## Controls

### Web
| Action     | Keyboard       | Touch           |
|------------|----------------|-----------------|
| Move Left  | Arrow Left / A | Drag left       |
| Move Right | Arrow Right / D| Drag right      |
| Shoot      | Space Bar      | Tap screen      |

### iOS
| Action     | Control                      |
|------------|------------------------------|
| Move Left  | Hold left on-screen button   |
| Move Right | Hold right on-screen button  |
| Shoot      | Tap anywhere on screen       |

## Deployment

The web version is automatically deployed to GitHub Pages when changes are pushed to the `main` branch under the `web/` directory.

To enable GitHub Pages deployment:
1. Go to your repository **Settings** → **Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push changes to `main` to trigger the deployment workflow.

## Testing

The game has been tested for:
- Player movement and shooting
- Enemy spawn, movement, and collision detection
- Score updates and game over scenarios

See the [Testing and Debugging Report](testing-and-debugging-report.md) for more details.

## Known Issues

- Audio effects may not play correctly on some browsers due to autoplay restrictions.
- Collision detection may be delayed occasionally.

## Contributing

Contributions are welcome! Please fork the repository, make your changes, and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
