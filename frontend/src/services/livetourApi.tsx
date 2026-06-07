import axios from "axios";

export const api = axios.create({
	baseURL: import.meta.env.VITE_LIVETOUR_API_URL,
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

export const endSession = (sessionId: string) => {
	return api.delete(`/end-session/${sessionId}`);
};

export const createSession = (tourId: string) => {
	return api.post("/create-session", { tour_id: tourId });
};

export const getSession = (sessionId: string) => {
	return api.get(`/get-session/${sessionId}`);
};

export const getSessionBlacklist = (sessionId: string) => {
	return api.get(`/session/${sessionId}/blacklist`);
};

export const removeFromBlacklist = (sessionId: string, clientId: string) => {
	return api.delete(`/session/${sessionId}/blacklist/${clientId}`);
};
