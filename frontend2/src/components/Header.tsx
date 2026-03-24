import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export const Header: React.FC = () => {
	const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
	const { user } = useAuth();
	const { toggleTheme } = useTheme();
	const navigate = useNavigate();

	const toggleSettings = () => {
		setIsSettingsOpen(prev => !prev);
	};

	const handleLogin = () => {
		navigate("/login");
	};
	const handleRegister = () => {
		navigate("/register");
	};
	const handleLogout = () => {
		navigate("/logout");
	};

	const handleThemeChange = () => {
		toggleTheme();
	};

	return (
		<div>
		<span role="img" aria-label="logo">🚀</span> MyLogo

		<div>
		{!user?.id ? (
			<>
			<button onClick={handleLogin}>Login</button>
			<button onClick={handleRegister}>Register</button>
			</>
		) : (
			<button onClick={handleLogout}>Logout</button>
		)}

		<div>
		<button onClick={toggleSettings} aria-label="Settings">
		⚙️
		</button>
		{isSettingsOpen && (
		<button onClick={handleThemeChange}>Change theme</button>
		)}
		</div>
		</div>

		</div>
	);
};
