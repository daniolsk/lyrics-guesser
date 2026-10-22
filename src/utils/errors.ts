// An error whose message is safe and helpful to show to the player.
export class UserFacingError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = 'UserFacingError';
	}
}
