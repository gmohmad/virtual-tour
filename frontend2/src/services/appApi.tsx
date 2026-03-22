import axios from 'axios';

export const api = axios.create({
	baseURL: import.meta.env.VITE_APP_API_URL,
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
	return api.get(`/get-company/${id}`);
};

export const getCompaniesOfUser = () => {
	return api.get(`/get-user-companies`);
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

export const getUserTours = () => {
	return api.get("/get-user-tours");
};

export const getCompanyTours = (companyId: string) => {
	return api.get(`/company/${companyId}/get-tours`);
};

export const createTour = (companyId: string, formData: FormData) => {
  return api.post(`/company/${companyId}/create-tour`, formData);
};

export const updateTour = (companyId: string, tourId: string, formData: FormData) => {
  return api.put(`/company/${companyId}/update-tour/${tourId}`, formData);
};

export const deleteTour = (companyId: string, tourId: string) => {
	return api.delete(`/company/${companyId}/delete-tour/${tourId}`);
};

export const getImage = (url: string) => {
	return api.get(url);
};
