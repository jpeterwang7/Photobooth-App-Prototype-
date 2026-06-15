# BOOTH — Photobooth App

A minimal, dark-themed photobooth app built with React Native + Expo. Runs in the browser via Expo Web.

## Setup

### 1. Install Node.js

If you don't have Node.js installed:
- Download from https://nodejs.org (LTS version)
- Or install via Homebrew: `brew install node`

### 2. Install Expo CLI

```bash
npm install -g expo-cli
```

### 3. Install dependencies

```bash
cd photobooth-app
npm install
```

### 4. Run on web (localhost)

```bash
npx expo start --web
```

Open http://localhost:8081 in your browser.

---

## App Flow

1. **Home** — See all your saved sessions. Tap `+` to start a new one.
2. **Setup** — Choose a grid layout, template, and name your session.
3. **Camera** — Auto-countdown takes photos (grid count + 2 extras). Allow camera access in browser.
4. **Selection** — Pick your favorite photos to fill the grid.
5. **Collage** — Preview your composed collage. Save or Save & Print.
6. **Payment** — (Save & Print) Enter payment details for physical prints.

## Grids

| ID   | Size  | Photos |
|------|-------|--------|
| 1×4  | Strip | 4      |
| 2×3  | Grid  | 6      |
| 2×4  | Grid  | 8      |
| 1×3  | Short | 3      |
| 2×2  | Quad  | 4      |
| 3×3  | Nine  | 9      |

## Templates

- **Classic** — White border, clean
- **Film** — Dark with film sprocket holes
- **Neon** — Electric pink/cyan glow aesthetic
- **Minimal** — No frame, just photos
- **Ivory** — Light, airy, with spacing

## Tech

- React Native + Expo SDK 51
- expo-camera for camera capture
- @react-navigation/stack for navigation
- React Context for state
