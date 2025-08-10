import { create } from 'zustand'

interface GameState {
  currentGame: string | null
  score: number
  level: number
  isPlaying: boolean
  timeRemaining: number
  streak: number
}

interface GameActions {
  startGame: (gameType: string) => void
  endGame: () => void
  updateScore: (points: number) => void
  incrementLevel: () => void
  setTimeRemaining: (time: number) => void
  incrementStreak: () => void
  resetStreak: () => void
  resetGame: () => void
}

const initialState: GameState = {
  currentGame: null,
  score: 0,
  level: 1,
  isPlaying: false,
  timeRemaining: 0,
  streak: 0,
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,
  
  startGame: (gameType: string) =>
    set({ currentGame: gameType, isPlaying: true, score: 0, level: 1 }),
  
  endGame: () =>
    set({ isPlaying: false, currentGame: null }),
  
  updateScore: (points: number) =>
    set((state) => ({ score: state.score + points })),
  
  incrementLevel: () =>
    set((state) => ({ level: state.level + 1 })),
  
  setTimeRemaining: (time: number) =>
    set({ timeRemaining: time }),
  
  incrementStreak: () =>
    set((state) => ({ streak: state.streak + 1 })),
  
  resetStreak: () =>
    set({ streak: 0 }),
  
  resetGame: () =>
    set(initialState),
}))