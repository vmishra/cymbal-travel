import { Component, type ReactNode } from 'react'

// Guardrail: any unexpected render error shows a calm fallback instead of a white
// screen, and lets the presenter keep going (Sim mode always works).
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.error('UI error (contained):', err)
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="grid min-h-[60vh] place-items-center p-8 text-center">
          <div className="max-w-sm">
            <div className="text-lg font-semibold">Let's pick that up again</div>
            <p className="mt-2 text-sm text-muted">Something hiccuped rendering that view. Your trip is safe.</p>
            <button onClick={() => this.setState({ failed: false })}
              className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-medium text-white">Continue</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
