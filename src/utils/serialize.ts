export const sanitizeForPageProps = <T>(value: T): T => {
	return JSON.parse(JSON.stringify(value)) as T;
};
