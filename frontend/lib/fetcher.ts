export default async function fetcher(url: string, token: string, options: Record<string, unknown> = {}) {
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
			return data;
		}

		const error = new Error(response.statusText);
		// error.response = response;
		// error.data = data;
		throw error;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		return {
			success: false,
			error: error?.message || 'Network error',
			status: error?.response?.status || 0,
		};
	}
}
