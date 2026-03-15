import axios from 'axios';

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

// Auth
export const login = (email: string, password: string) =>
	api.post('/login', { email, password });

export const register = (email: string, password: string) =>
	api.post('/register', { email, password });

// Tours (authenticated)
export const getMyTours = () => api.get('/get-tours-by-user-id');
export const getTourById = (id: string) => api.get(`/get-tour-by-id/${id}`);
export const createTour = (name: string, data: any) =>
	api.post('/create-tour', { name, data });
export const updateTour = (id: string, name: string, data: any) =>
	api.put(`/update-tour/${id}`, { name, data });
export const deleteTour = (id: string) => api.delete(`/delete-tour/${id}`);

// Public tour (no auth)
export const getPublicTour = (id: string) => api.get(`/public/tour/${id}`);

// Image upload – expects backend to return a presigned URL
export const getPresignedUploadUrl = (fileName: string, fileType: string) =>
	api.post('/upload-url', { fileName, fileType });

export const uploadImage = (file: File) => {
	const formData = new FormData();
	formData.append('image', file);
	return api.post('/upload', formData, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
};
