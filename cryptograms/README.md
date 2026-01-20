# Crypto Puzzles (Cryptogram)

A modern, interactive Cryptogram puzzle game built with React and Vite. Decrypt quotes by guessing the substitution cipher!

## Features

- **Infinite Puzzles**: Fetches new quotes dynamically for endless gameplay.
- **Rich Content**: 
  - **Famous Opening Lines**: Includes iconic opening lines from books and movies.
  - **Funny Quotes**: curated collection of witty and humorous quotes.
- **Interactive UI**: polished interface with real-time feedback.
- **Smart Helpers**:
  - **Intelligent Hints**: Prioritizes revealing the currently selected letter if you're stuck.
  - **Check Work**: Highlight incorrect letters to track your progress.
  - **Clear Mistakes**: Quickly remove incorrect guesses.
- **Performance**: Optimized rendering engine for smooth gameplay on any device.
- **Keyboard Support**: Full physical keyboard support for desktop users, along with an on-screen keyboard.
- **Winning Animations**: Celebrating your success with confetti!
- **Responsive Design**: optimized for both desktop and mobile play.

## Tech Stack

- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linter**: ESLint

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/manosdvd/Crypto-puzzles.git
   cd "Crypto puzzles"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**; usually at `http://localhost:5173`.

## How to Play

1. **The Goal**: Decrypt the quote. Each letter in the puzzle has been replaced by another letter (a substitution cipher).
2. **Select**: Click on any underscore/letter in the puzzle to select it.
3. **Guess**: Type a letter (keyboard or on-screen) to make a guess. All instances of that encrypted letter will update.
4. **Navigate**: Use arrow keys or click to move around.
5. **Win**: Correctly identify all letters to reveal the author and complete the level!

## Building for Production

To create a production build:

```bash
npm run build
```

The output will be in the `dist` directory.
