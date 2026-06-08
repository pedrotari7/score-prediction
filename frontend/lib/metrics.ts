import type { MetricEvent, MetricsBatch, SessionMetadata } from '../../interfaces/main';
import { backendUrl } from './utils/envHelper';

const FLUSH_INTERVAL_MS = 30_000;
const MAX_BUFFER_SIZE = 10;

const generateSessionId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const detectSessionMetadata = (): SessionMetadata => {
	const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

	let device = 'unknown';
	if (/Mobi|Android/i.test(ua)) device = 'mobile';
	else if (/Tablet|iPad/i.test(ua)) device = 'tablet';
	else if (typeof window !== 'undefined') device = 'desktop';

	let browser = 'unknown';
	if (/Firefox/i.test(ua)) browser = 'Firefox';
	else if (/Edg/i.test(ua)) browser = 'Edge';
	else if (/Chrome/i.test(ua)) browser = 'Chrome';
	else if (/Safari/i.test(ua)) browser = 'Safari';

	let os = 'unknown';
	if (/Windows/i.test(ua)) os = 'Windows';
	else if (/Mac/i.test(ua)) os = 'macOS';
	else if (/Linux/i.test(ua)) os = 'Linux';
	else if (/Android/i.test(ua)) os = 'Android';
	else if (/iPhone|iPad/i.test(ua)) os = 'iOS';

	const viewport = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown';

	return {
		device,
		viewport,
		browser,
		os,
		appVersion: process.env.NEXT_PUBLIC_GIT_COMMIT_HASH ?? 'unknown',
		buildTimestamp: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ?? 'unknown',
	};
};

class MetricsCollector {
	private buffer: MetricEvent[] = [];
	private sessionId: string;
	private metadata: SessionMetadata;
	private flushTimer: ReturnType<typeof setInterval> | null = null;
	private token: string | null = null;
	private enabled = false;
	private initialized = false;
	private destroyed = false;

	constructor() {
		this.sessionId = generateSessionId();
		this.metadata = detectSessionMetadata();
	}

	async init(token: string) {
		this.token = token;

		if (this.initialized) return;
		this.initialized = true;

		try {
			const res = await fetch(`${backendUrl}/metrics-enabled`);
			if (res.ok) {
				const data = await res.json();
				this.enabled = data.enabled === true;
			}
		} catch {
			this.enabled = false;
		}

		if (!this.enabled) return;

		this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

		if (typeof window !== 'undefined') {
			window.addEventListener('visibilitychange', this.handleVisibilityChange);
			window.addEventListener('pagehide', this.handlePageHide);
		}
	}

	updateToken(token: string) {
		this.token = token;
	}

	trackEvent(name: string, payload?: Record<string, unknown>) {
		if (!this.enabled || this.destroyed) return;

		this.buffer.push({
			name,
			timestamp: Date.now(),
			sessionId: this.sessionId,
			payload,
		});

		if (this.buffer.length >= MAX_BUFFER_SIZE) {
			this.flush();
		}
	}

	trackError(error: Error, context?: Record<string, unknown>) {
		this.trackEvent('error', {
			message: error.message,
			stack: error.stack?.slice(0, 500),
			...context,
		});
	}

	trackApiCall(endpoint: string, duration: number, status: number, success: boolean) {
		this.trackEvent('api_call', { endpoint, duration, status, success });
	}

	trackPageView(page: string, data?: string | number) {
		this.trackEvent('page_view', { page, ...(data != null ? { data } : {}) });
	}

	private async flush() {
		if (this.buffer.length === 0 || !this.token) return;

		const events = [...this.buffer];
		this.buffer = [];

		const batch: MetricsBatch = { events, metadata: this.metadata };

		try {
			await fetch(`${backendUrl}/metrics`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${this.token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(batch),
			});
		} catch {
			this.buffer.unshift(...events);
		}
	}

	private handleVisibilityChange = () => {
		if (document.visibilityState === 'hidden') {
			this.flush();
		}
	};

	private handlePageHide = () => {
		this.flush();
	};

	destroy() {
		this.destroyed = true;
		this.flush();

		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}

		if (typeof window !== 'undefined') {
			window.removeEventListener('visibilitychange', this.handleVisibilityChange);
			window.removeEventListener('pagehide', this.handlePageHide);
		}
	}
}

let instance: MetricsCollector | null = null;

export const getMetrics = (): MetricsCollector => {
	if (!instance) {
		instance = new MetricsCollector();
	}
	return instance;
};

export const destroyMetrics = () => {
	instance?.destroy();
	instance = null;
};
