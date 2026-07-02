type RequestLogExtra = Record<string, string | number | boolean | null | undefined>;

export const logRequest = (
	service: string,
	label: string,
	startedAt: number,
	extra?: RequestLogExtra
) => {
	const ms = Date.now() - startedAt;
	const details = extra
		? ` ${Object.entries(extra)
				.filter(([, value]) => value !== undefined)
				.map(([key, value]) => `${key}=${value}`)
				.join(' ')}`
		: '';

	console.log(`[${service}] ${label} ${ms}ms${details}`);
};

export const timed = async <T>(
	service: string,
	label: string,
	fn: () => Promise<T>,
	extra?: (result: T) => RequestLogExtra
): Promise<T> => {
	const startedAt = Date.now();

	try {
		const result = await fn();
		logRequest(service, label, startedAt, { status: 'ok', ...extra?.(result) });
		return result;
	} catch (error) {
		logRequest(service, label, startedAt, {
			status: 'error',
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
};
