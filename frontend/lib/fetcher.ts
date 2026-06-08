import { getMetrics } from './metrics';

export default async function fetcher(url: string, token: string, options: Record<string, unknown> = {}) {
	const start = Date.now();
	const endpoint = new URL(url, window.location.origin).pathname;
	const isMetricsCall = endpoint.includes('/metrics');

	try {
		const response = await fetch(url, {
			...options,
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});
		const data = await response.json();

		if (response.ok) {
			if (!isMetricsCall) getMetrics().trackApiCall(endpoint, Date.now() - start, response.status, true);
			return data;
		}

		if (!isMetricsCall) getMetrics().trackApiCall(endpoint, Date.now() - start, response.status, false);
		const error = new Error(response.statusText);
		throw error;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		if (!isMetricsCall)
			getMetrics().trackApiCall(endpoint, Date.now() - start, error?.response?.status || 0, false);
		return {
			success: false,
			error: error?.message || 'Network error',
			status: error?.response?.status || 0,
		};
	}
}
