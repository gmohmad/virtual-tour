import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

export const Header: React.FC = () => {
	const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
	const { user } = useAuth();
	const { theme, toggleTheme } = useTheme();
	const navigate = useNavigate();
	const settingsRef = useRef(null);

	const closeSettings = (e: MouseEvent) =>{
		if(isSettingsOpen && !settingsRef.current?.contains(e.target)) {
			setIsSettingsOpen(false);
		}
	}
	document.addEventListener('mousedown', closeSettings)

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
		<header className="header">
			<div className="container">
				<div className="header-content">
					<div className="brand">
						<span className="brand-logo" role="img" aria-label="logo">🚀</span>
						<span className="brand-name">VirtualTour</span>
					</div>
					
					<nav className="nav">
						{user?.id && (
							<button 
								className="nav-link"
								onClick={() => navigate("/companies/my")}
							>
								My Companies
							</button>
						)}
					</nav>

					<div className="header-actions">
						{!user?.id ? (
							<div className="auth-buttons">
								<button className="btn btn-ghost" onClick={handleLogin}>
									Sign In
								</button>
								<button className="btn btn-primary" onClick={handleRegister}>
									Get Started
								</button>
							</div>
						) : (
							<div className="user-actions">
								<span className="user-name">{user.name}</span>
								<button className="btn btn-ghost" onClick={handleLogout}>
									Sign Out
								</button>
							</div>
						)}

						<div className="settings-group" ref={settingsRef}>
							<button 
								className="btn btn-icon"
								onClick={toggleSettings} 
								aria-label="Settings"
								title="Settings"
							>
								⚙️
							</button>
							
							{isSettingsOpen && (
								<div className="settings-dropdown">
									<button 
										className="btn btn-ghost"
										onClick={handleThemeChange}
									>
										{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</header>
	);
};
