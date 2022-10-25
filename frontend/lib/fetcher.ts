export default async function fetcher(url: string, token: string, options: Record<string, unknown> = {}) {
	try {
		const response = await fetch(url, {
			headers: {
				Authorization: `${token}`,
			},
			...options,
		});
		const data = await response.json();

		if (response.ok) {
			return data;
		}

		const error = new Error(response.statusText);
		// error.response = response;
		// error.data = data;
		throw error;
	} catch (error) {
		if (!error.data) {
			error.data = { message: error.message };
		}

		return { uid: null, success: false };

		// throw error;
	}
}
