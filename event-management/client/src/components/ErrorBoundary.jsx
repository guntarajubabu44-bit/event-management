import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('App error boundary:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-shell">
          <div className="error-panel">
            <p className="eyebrow">Application error</p>
            <h2>Something went wrong.</h2>
            <p>Please refresh the page or return to the dashboard.</p>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
