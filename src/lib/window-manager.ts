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
    const stopHandler = this.stopHandlers.get(windowId);
    if (stopHandler) {
      try {
        stopHandler();
      } catch (error) {
        console.error('Error stopping window:', windowId, error);
      }
    }
    this.unregisterStopHandler(windowId);
  }

  forceStopAllWindows() {
    console.log('Force stopping all windows:', this.stopHandlers.size);
    for (const [windowId, stopHandler] of this.stopHandlers.entries()) {
      try {
        stopHandler();
      } catch (error) {
        console.error('Error stopping window:', windowId, error);
      }
    }
    this.stopHandlers.clear();
  }

  getActiveWindowCount(): number {
    return this.stopHandlers.size;
  }

  getActiveWindowIds(): string[] {
    return Array.from(this.stopHandlers.keys());
  }
}

export const windowManager = new WindowManager();