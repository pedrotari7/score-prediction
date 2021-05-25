export default async function fetcher(url: string, token: string, ...args: any[]) {
	try {
		const response = await fetch(url, {
			headers: {
				Authorization: `${token}`,
			},
			...args,
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
		throw error;
	}
}
