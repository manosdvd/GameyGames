# Gamey Games Hub 🎮

A collection of accessible, "juicy," and responsible web-based games. This project hosts a suite of puzzle and logic games designed with a focus on clean UI, accessibility (Dyslexia/Discalculia friendly), and satisfying game feel.

## 🕹️ The Games

### 1. **Gem Rush (Bejewelled Clone)**
A high-polish Match-3 game featuring:
- **Juicy Animations**: Simultaneous swaps, physics-based falling gems, and satisfying "clink" sounds.
- **Swipe Controls**: Fully gesture-supported for mobile play.
- **Visuals**: 7 distinct procedurally styled gem types and particle explosions.

### 2. **Wordle**
A faithful recreation of the classic 5-letter guessing game.
- **Dictionary**: Uses a robust English dictionary for validation.
- **Feedback**: Classic Green/Yellow/Gray color coding.
- **Responsive**: Optimized layout for both Desktop and Mobile devices.

### 3. **HexEnergy**
A relaxing logic puzzle about connecting nodes.
- **Level Editor**: Choose your grid size (3x3 to 10x10) and node shape.
- **Adaptive Grids**: The game board morphs between **Hexagonal**, **Square**, and **Octagonal** grids based on your settings.

### 4. **Dyslexia**
A word puzzle game designed to be accessible.
- **Features**: Specialized fonts and high-contrast visuals to aid reading.
- **Gameplay**: Form words from a jumble of letters with forgiving time mechanics.

### 5. **Discalculia**
A math puzzle game focused on arithmetic and order of operations.
- **Educational**: gentler visual guides for math operations.
- **Logic**: Enforces PEMDAS/BODMAS rules with clear feedback.

### 6. **Cryptograms**
Decipher quotes in a distraction-free environment.
- **UI**: optimized for focus, with dark mode support.
- **Content**: A vast library of quotes to solve.

### 7. **Anxiety**
A soothing, pressure-free block popping experience designed to reduce stress.

---

## 🛡️ Responsible Gaming Mode

A core feature of this hub is the **Responsible Gaming Integration**.
- **Daily Limits**: Users can set a daily playtime limit (default: 60 minutes).
- **Enforcement**: A shared system (`timeLimit.js`) tracks usage across ALL games. When the limit is reached, a blocking overlay prevents further play until the next day.
- **Goal**: To promote healthy gaming habits.

---

## 🛠️ Technical Details

- **Tech Stack**: HTML5, Vanilla JavaScript, React (Wordle), Tailwind CSS.
- **Build System**: A custom Node.js build script (`build.js`) that unifies assets from React and Vanilla projects into a single deployable `dist/` folder.
- **Mobile First**: All games use `100dvh` and touch events to ensure a native-app-like experience on mobile browsers.

## 🚀 How to Run

1. **Clone the repo**
   ```bash
   git clone https://github.com/manosdvd/GameyGames.git
   ```
2. **Install Dependencies** (for React sub-projects)
   ```bash
   cd cryptograms && npm install
   cd ../anxiety3 && npm install
   ```
3. **Build**
   ```bash
   node build.js
   ```
4. **Play**
   Open `dist/index.html` in your browser.
