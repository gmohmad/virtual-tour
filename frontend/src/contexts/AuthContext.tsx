import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, login as apiLogin, register as apiRegister } from '../services/api';

interface User {
	id: string;
	email: string;
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	login: (email: string, password: string) => Promise<void>;
	register: (email: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

	useEffect(() => {
		const storedUser = localStorage.getItem('user');
		if (storedUser) setUser(JSON.parse(storedUser));
	}, []);

	const login = async (email: string, password: string) => {
		const res = await apiLogin(email, password);
		const { token, user } = res.data;
		localStorage.setItem('token', token);
		localStorage.setItem('user', JSON.stringify(user));
		setToken(token);
		setUser(user);
	};

	const register = async (email: string, password: string) => {
		const res = await apiRegister(email, password);
		const { token, user } = res.data;
		localStorage.setItem('token', token);
		localStorage.setItem('user', JSON.stringify(user));
		setToken(token);
		setUser(user);
	};

	const logout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		setToken(null);
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, token, login, register, logout }}>
		{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within AuthProvider');
	return context;
};
