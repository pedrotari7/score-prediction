import { trace } from '@opentelemetry/api';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		const span = trace.getTracer('error-boundary').startSpan('uncaught-error');
		span.recordException(error);
		span.setAttribute('component_stack', errorInfo.componentStack ?? '');
		span.end();
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className='flex h-screen flex-col items-center justify-center gap-6 bg-[#181a1b] text-white'>
					<div className='text-3xl font-bold'>Something went wrong</div>
					<button
						className='rounded-md bg-gray-700 px-6 py-3 text-lg hover:bg-gray-600'
						onClick={() => window.location.reload()}
					>
						Reload
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
