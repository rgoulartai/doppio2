// TypeScript declaration for lite-youtube-embed web component
// React 18 with react-jsx transform resolves from React.JSX.IntrinsicElements
declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'lite-youtube': {
        videoid: string;
        playlabel?: string;
        params?: string;
        style?: Record<string, string | number>;
        className?: string;
      };
    }
  }
}
