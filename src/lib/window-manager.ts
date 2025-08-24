interface ChatWindowStopHandler {
  windowId: string;
  stopFunction: () => void;
}

class WindowManager {
  private stopHandlers: Map<string, () => void> = new Map();

  registerStopHandler(windowId: string, stopFunction: () => void) {
    console.log('Registering stop handler for window:', windowId);
    this.stopHandlers.set(windowId, stopFunction);
   

  unregisterStopHandler(windowId: string) {
    console.log('Unregistering stop handler for window:', windowId);
    this.stopHandlers.delete(windowId);
  }


    console.log('Force stopping window:', windowId);





















export const windowManager = new WindowManager();