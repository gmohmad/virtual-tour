import { v4 as uuidv4 } from 'uuid';

export const getClientId = (mode: 'owner' | 'client', userId?: string): string => {
	if (mode === 'owner' && userId) {
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
