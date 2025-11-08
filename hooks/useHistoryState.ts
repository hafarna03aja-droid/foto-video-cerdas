import { useState, useCallback } from 'react';

export const useHistoryState = <T>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const setState = useCallback((newState: T) => {
    // When a new state is set after some undos, truncate the future history
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [currentIndex, history]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [canRedo]);

  const reset = useCallback((state: T) => {
    setHistory([state]);
    setCurrentIndex(0);
  }, []);

  const jumpToState = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      setCurrentIndex(index);
    }
  }, [history.length]);

  return {
    state: history[currentIndex],
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    history,
    currentIndex,
    jumpToState,
  };
};
