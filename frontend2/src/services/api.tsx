import axios from 'axios';

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

// user
export const login = (email: string, password: string) => {
	return api.post("/login", { email, password });
};

export const register = (name: string, email: string, password: string) => {
	return api.post("/register", { name, email, password });
};

// company
export const getCompanyByID = (id: string) => {
	return api.get(`/get-company-by-id/${id}`);
};

export const createCompany = (name: string) => {
	return api.post("/create-company", { name });
};

export const updateCompany = (id: string, name: string) => {
	return api.put("/update-company", { id, name });
};

export const deleteCompany = (id: string) => {
	return api.delete(`/delete-company/${id}`);
};

// tour
export const getTourByID = (id: string) => {
	return api.get(`/get-tour-by-id/${id}`);
};

export const getToursByUserID = () => {
	return api.get("/get-tours-by-user-id");
};

export const createTour = (name: string, data: any, companyID: string) => {
	return api.post("/create-tour", { name, data, companyID });
};

export const updateTour = (id: string, name: string, data: any) => {
	return api.put("/update-tour", { id, name, data });
};

export const deleteTour = (id: string) => {
	return api.delete(`/delete-tour/${id}`);
};

export const getImage = (url: string) => {
	return api.get(url);
};
