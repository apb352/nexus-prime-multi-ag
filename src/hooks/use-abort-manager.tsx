import { createContext, useContext, useRef, ReactNode } from 'react';

interface AbortManagerContextType {
  createAbortController: (windowId: string) => AbortController;
  abortWindow: (windowId: string) => void;
  abortAll: () => void;
  isAborted: (windowId: string) => boolean;
}

const AbortManagerContext = createContext<AbortManagerContextType | null>(null);

export function AbortManagerProvider({ children }: { children: ReactNode }) {
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const createAbortController = (windowId: string): AbortController => {
    // Cancel existing controller if any
    const existing = abortControllers.current.get(windowId);
    if (existing) {
      existing.abort();
    }

    // Create new controller
    const controller = new AbortController();
    abortControllers.current.set(windowId, controller);
    
    return controller;
  };

  const abortWindow = (windowId: string) => {
    const controller = abortControllers.current.get(windowId);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(windowId);
    }
  };

  const abortAll = () => {
    abortControllers.current.forEach((controller) => {
      controller.abort();
    });
    abortControllers.current.clear();
  };

  const isAborted = (windowId: string): boolean => {
    const controller = abortControllers.current.get(windowId);
    return controller ? controller.signal.aborted : false;
  };

  return (
    <AbortManagerContext.Provider value={{
      createAbortController,
      abortWindow,
      abortAll,
      isAborted
    }}>
      {children}
    </AbortManagerContext.Provider>
  );
}

export function useAbortManager() {
  const context = useContext(AbortManagerContext);
  if (!context) {
    throw new Error('useAbortManager must be used within AbortManagerProvider');
  }
  return context;
}