# STARBUGS — App Store Readiness Plan

This plan covers everything needed to take the iOS version (`ios/starbugs`) from its current state to an approved App Store release. Items are ordered by dependency: the project must build and run cleanly before compliance and store setup matter.

---

## Phase 0 — Current State Audit (what's blocking today)

A review of the repository found the following issues. Items marked **[blocker]** will prevent the app from building or will cause an automatic rejection during App Store validation.

| # | Issue | Severity |
|---|-------|----------|
| 1 | No `@main` App entry point. The target's source folder (`ios/starbugs/starbugs/`) contains only `GameView.swift` — there is no `starbugsApp.swift` / `ContentView`, so the app has no launch entry. | **[blocker]** |
| 2 | `INFOPLIST_FILE = starbugs/Info.plist` is set in build settings (and listed as a membership exception), but no `Info.plist` exists on disk. | **[blocker]** |
| 3 | `StarJedi.ttf` is referenced in the project and in the Resources build phase, but the file is missing from the repository. | **[blocker]** |
| 4 | No `Assets.xcassets`. Build settings reference `AppIcon` and `AccentColor`, but no asset catalog exists. App icons exist only as loose PNG exports in `starbugs Exports/`. A 1024×1024 icon in the asset catalog is mandatory for submission. | **[blocker]** |
| 5 | `PrivacyInfo.xcprivacy` contains an invalid entry: `NSPrivacyCollectedDataTypes` has a dict with an **empty** data-type string and empty purpose. This fails App Store Connect validation. Since the game collects no data, the array should simply be empty. | **[blocker]** |
| 6 | ~~Missing 3D assets~~ **Resolved:** the web version's `player.glb` and `enemy.glb` were converted to USDZ (decimated and with 512px textures for mobile), placed in `ios/starbugs/starbugs/art.scnassets/`, and the code now loads them. The duplicate `model.glb` (an exact copy of `enemy.glb`) was removed. Orientation/scale still need visual verification on a device. | ~~High~~ Done |
| 7 | iOS feature gap vs. README/web version: no start screen, no score HUD, no game-over screen, no restart flow in the iOS code (`GameView` exposes an `onGameOver` callback that nothing consumes). Apps that appear broken or minimal are rejected under guideline 4.2 (minimum functionality). | High |
| 8 | Stray/junk files in the project: `File.txt`, empty `Untitled.swift`, empty `Property List.plist`, unused `logo.gif` (3.7 MB) inside the target folder, and a committed `UserInterfaceState.xcuserstate` (xcuserdata was gitignored after being committed). | Medium |
| 9 | `IPHONEOS_DEPLOYMENT_TARGET = 26.0`. This is required for the `.glassEffect` Liquid Glass API, but be aware it limits the audience to devices on iOS 26+. Either accept that, or add an availability fallback and lower the target. | Medium |
| 10 | All four orientations are enabled, but the control layout (bottom edge buttons, vertical play field) is designed for portrait. Rotation mid-game will misplace controls. | Medium |
| 11 | `PrivacyInfo.xcprivacy` declares four "required reason" API categories (boot time, disk space, file timestamp, user defaults). The app's own code uses none of these directly; declarations should match actual usage (keep only what Apple's static analysis flags, e.g. UserDefaults via system frameworks). | Low |

---

## Phase 1 — Make the project build and run

1. **Add the app entry point.** Create `starbugsApp.swift` with a `@main App` struct and a root view that owns game state (start / playing / game over).
2. **Fix the Info.plist situation.** Either create `starbugs/Info.plist` (and keep `GENERATE_INFOPLIST_FILE = YES` to merge), or remove the `INFOPLIST_FILE` setting and rely entirely on the generated plist + `INFOPLIST_KEY_*` settings. The second option is simpler for a project this size.
3. **Restore or remove `StarJedi.ttf`.** If the font ships, add it to the bundle and declare it under `UIAppFonts`. Note: the font appears to be a Star Wars fan font — verify it is licensed for commercial distribution (the matching `jedi.ttf` in `web/` has the same concern). If licensing is unclear, replace it with a free SF-style or OFL-licensed display font.
4. **Create `Assets.xcassets`** with `AppIcon` (use the 1024×1024 exports already in `starbugs Exports/`, including the dark and tinted variants) and an `AccentColor`.
5. **3D models — done.** The web version's `player.glb` and `enemy.glb` are the canonical models for both platforms. They were converted to ARKit-compliant USDZ (meshes decimated to ~36k/~15k tris, textures downscaled to 512px; combined ~10 MB instead of 44 MB raw) and live in `ios/starbugs/starbugs/art.scnassets/`. The conversion is reproducible via `tools/glb2usd.py` (Blender headless) + `tools/pack_usdz.py` (usd-core). **Remaining:** run on a device/simulator and verify orientation and scale visually; adjust the `eulerAngles`/scale in `GameView.swift` or re-export if needed.
6. **Clean the project.** Delete `File.txt`, `Untitled.swift`, `Property List.plist`, and the unused `logo.gif`; `git rm --cached` the committed `xcuserdata` files. (The stray `model.glb` — a duplicate of `enemy.glb` — is already removed.)
7. **Verify a clean Release build** on a physical device (`xcodebuild -scheme starbugs -configuration Release`) with zero warnings that matter.

## Phase 2 — Bring gameplay to parity and ship-quality

1. **Game flow:** start screen (START button, title, logo), in-game score HUD, game-over screen with final score and restart — wiring the existing `onGameOver` callback. This matches the README and the web version, and clears the guideline 4.2 minimum-functionality bar.
2. **Scoring:** increment on enemy kill (the collision code currently destroys enemies without counting); persist a local high score in `UserDefaults`.
3. **Lock orientation to portrait** (`UISupportedInterfaceOrientations` → portrait only) unless landscape is explicitly redesigned.
4. **Difficulty ramp:** `enemySpeed` and spawn interval are constants; add gradual scaling so sessions don't plateau (reviewers play for a few minutes — it should feel like a game, not a demo).
5. **Audio + haptics (optional but high-value):** shoot/explosion SFX and light haptic feedback dramatically improve perceived quality.
6. **Pause handling:** pause spawn timers and the scene when the app resigns active (`scenePhase`), otherwise the game keeps running in the background transition.
7. **Memory/performance pass:** Instruments run to confirm no leaks from the bullet/enemy node churn; confirm steady 60 FPS on the oldest supported device.

## Phase 3 — Compliance and metadata in the project

1. **Fix `PrivacyInfo.xcprivacy`:** empty `NSPrivacyCollectedDataTypes` array (no data collected), `NSPrivacyTracking = false`, keep only required-reason APIs actually flagged for this binary.
2. **Launch screen:** generated launch screen is enabled — verify it looks intentional (solid black to match the game is fine).
3. **Versioning:** confirm `MARKETING_VERSION = 1.0`, `CURRENT_PROJECT_VERSION = 1`; bump the build number for every TestFlight upload.
4. **Bundle ID and signing:** `com.alanmaizon.starbugs` with team `VP5ZS4AT8Z` and automatic signing is already configured. Register the bundle ID in the developer portal and create the App Store Connect app record with the same ID.
5. **Encryption export compliance:** add `ITSAppUsesNonExemptEncryption = NO` to the Info.plist settings to skip the export-compliance question on every upload.
6. **Third-party content check:** the Jedi-style font and any Star Wars-adjacent branding are rejection risks under guideline 5.2 (intellectual property). Note that the player model is recognizably the Millennium Falcon and the enemy is a Star Wars-style fighter — these are the highest-risk assets in the app and will likely need to be replaced with original ship designs before submission. Audit names/assets and rename/replace anything that trades on someone else's IP.

## Phase 4 — App Store Connect setup and submission

1. **Apple Developer Program** membership active ($99/yr) for the team.
2. **Create the app record:** name, primary language, bundle ID, SKU.
3. **Store metadata:**
   - Description, promotional text, keywords
   - Category: Games → Arcade (or Action)
   - Age rating questionnaire (mild cartoon violence at most)
   - Support URL (the GitHub Pages site can serve) and **privacy policy URL** — required for every app, even with zero data collection; a simple static page on GitHub Pages is sufficient.
4. **App Privacy section:** declare "Data Not Collected" (must match the fixed privacy manifest).
5. **Screenshots:** required sizes — 6.9″ (iPhone Pro Max) and, because `TARGETED_DEVICE_FAMILY = "1,2"`, 13″ iPad. Capture from simulator/device during gameplay; if iPad isn't actually supported well, set device family to iPhone-only instead.
6. **Archive and upload** via Xcode Organizer (or `xcodebuild archive` + `xcrun altool`/Transporter).
7. **TestFlight pass:** internal testing on at least two physical devices; fix anything found; bump build and re-upload.
8. **Submit for review** with notes for the reviewer (controls: hold left/right edges, tap to shoot).

## Phase 5 — Post-approval

1. Tag the release in git (`v1.0.0`) and update the README iOS section with an App Store link.
2. Monitor crash reports in Xcode Organizer / App Store Connect for the first week.
3. Backlog for 1.1: Game Center leaderboard for the high score, additional enemy types/waves, sound settings.

---

## Suggested execution order (repo work)

1. Phase 1 items 1–6 — single PR: "Make iOS project buildable" (entry point, Info.plist, asset catalog, models, cleanup).
2. Phase 2 items 1–3 — PR: "Game flow and scoring".
3. Phase 3 items 1, 5, 6 — PR: "App Store compliance fixes".
4. Phases 4–5 happen in App Store Connect / Xcode and need a Mac with Xcode 26 and the signing identity — they cannot be done from this repository alone.
