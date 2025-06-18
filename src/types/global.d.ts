declare global {
  interface Window {
    AppKit?: {
      open?: () => void;
      [key: string]: any;
    };
  }
}
export {}; 