interface ChatWindowStopHandler {
  windowId: string;
  stopFunction: () => void;
}

class WindowManager {
  private stopHandlers: Map<string, () => void> = new Map();

  registerStopHandler(windowId: string, stopFunction: () => void) {
    console.log('Registering stop handler for window:', windowId);
    this.stopHandlers.set(windowId, stopFunction);
  }

  unregisterStopHandler(windowId: string) {
    console.log('Unregistering stop handler for window:', windowId);
    this.stopHandlers.delete(windowId);
  }

  forceStopWindow(windowId: string) {
    console.log('Force stopping window:', windowId);
    const stopFunction = this.stopHandlers.get(windowId);
    if (stopFunction) {
      stopFunction();
    } else {
      console.log('No stop handler found for window:', windowId);
    }
  }

  forceStopAllWindows() {
    console.log('Force stopping all windows. Total:', this.stopHandlers.size);
    this.stopHandlers.forEach((stopFunction, windowId) => {
      console.log('Stopping window:', windowId);
      stopFunction();
    });
  }

  getActiveWindowIds(): string[] {
    return Array.from(this.stopHandlers.keys());
  }
}

export const windowManager = new WindowManager();