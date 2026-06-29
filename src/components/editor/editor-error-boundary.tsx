import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  onReset: () => void;
}

interface State {
  hasError: boolean;
}

export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[EditorErrorBoundary] MathLive crash:', error, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false });
    this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-[12px] text-ink-500">The editor crashed while parsing the equation.</p>
          <button
            onClick={this.reset}
            className="rounded px-3 py-1.5 text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20"
          >
            Reset editor
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
