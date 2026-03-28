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

export const createSession = () => {
	return api.post("/create-session");
};

export const getSession = (sessionId: string) => {
	return api.get(`/get-session/${sessionId}`);
}
