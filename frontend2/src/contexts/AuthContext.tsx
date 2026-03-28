import React, { createContext, useContext, useEffect, useState } from "react";
import {login as apiLogin, register as apiRegister} from "../services/appApi";

interface User {
	id:    string;
	name:  string;
	email: string;
};

interface AuthContextType {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (name: string, email: string, password: string) => Promise<void>;
	logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

	useEffect(() => {
		const storedUser = localStorage.getItem("user");
		if (storedUser) setUser(JSON.parse(storedUser));
		setIsLoading(false);
	}, []);

	const login = async (email: string, password: string) => {
		setIsLoading(true);
		await apiLogin(email, password).then(resp => {
			const { token, user } = resp.data;
			localStorage.setItem("token", token);
			localStorage.setItem("user", JSON.stringify(user));
			setToken(token);
			setUser(user);
		})
		.catch(console.error)
		.finally(() => setIsLoading(false));
	};

	const register = async (name: string, email: string, password: string) => {
		setIsLoading(true);
		await apiRegister(name, email, password).finally(() => setIsLoading(false));
	};

	const logout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setToken(null);
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, token, login, isLoading, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within AuthProvider");
	return context;
};
