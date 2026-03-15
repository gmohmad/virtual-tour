import { v4 as uuidv4 } from 'uuid';

export const getClientId = (mode: 'author' | 'client', userId?: string): string => {
	if (mode === 'author' && userId) {
		return userId;
	} else {
		let deviceId = localStorage.getItem('deviceId');
		if (!deviceId) {
			deviceId = uuidv4();
			localStorage.setItem('deviceId', deviceId);
		}
		return deviceId;
	}
};
