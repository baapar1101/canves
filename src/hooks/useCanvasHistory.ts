import { useState, useCallback, useRef } from 'react';
import { CanvasElement } from '../types/canvas';

interface HistoryState {
  past: CanvasElement[][];
  present: CanvasElement[];
  future: CanvasElement[][];
}

const STORAGE_KEY = 'canvas_elements_data_v1';

export function useCanvasHistory(initialElements: CanvasElement[] = []) {
  const [history, setHistory] = useState<HistoryState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return { past: [], present: parsed, future: [] };
        }
      }
    } catch {
      // ignore
    }
    return { past: [], present: initialElements, future: [] };
  });

  const saveTimeoutRef = useRef<number | null>(null);

  const persistToStorage = useCallback((elements: CanvasElement[]) => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
      } catch (err) {
        console.warn('Failed to persist canvas to localStorage', err);
      }
    }, 400);
  }, []);

  const pushState = useCallback((newPresent: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
    setHistory((curr) => {
      const updated = typeof newPresent === 'function' ? newPresent(curr.present) : newPresent;
      persistToStorage(updated);
      return {
        past: [...curr.past.slice(-30), curr.present], // keep last 30 states
        present: updated,
        future: [],
      };
    });
  }, [persistToStorage]);

  const undo = useCallback(() => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);
      persistToStorage(previous);
      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future],
      };
    });
  }, [persistToStorage]);

  const redo = useCallback(() => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      persistToStorage(next);
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture,
      };
    });
  }, [persistToStorage]);

  const setPresentDirect = useCallback((elements: CanvasElement[]) => {
    setHistory((curr) => {
      persistToStorage(elements);
      return {
        ...curr,
        present: elements,
      };
    });
  }, [persistToStorage]);

  const clearAll = useCallback(() => {
    setHistory((curr) => {
      persistToStorage([]);
      return {
        past: [...curr.past, curr.present],
        present: [],
        future: [],
      };
    });
  }, [persistToStorage]);

  return {
    elements: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    pushState,
    undo,
    redo,
    setPresentDirect,
    clearAll,
  };
}
