import React  from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const Logout: React.FC = () => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout()
		navigate("/login")
	}

	return (
		<div className="auth-page">
			<div className="auth-container">
				<div className="auth-card">
					<div className="auth-header">
						<h1 className="auth-title">Log Out From Your Account</h1>
					</div>
					<div className="auth-content">
						<p className="success-message">
							You're already logged in as <strong>{user?.name}</strong>
						</p>
						<p className="success-message">Are you sure you want to logout?</p>
						<div className="auth-actions">
							<button onClick={() => navigate("/companies/my")} className="btn btn-primary">
								Go to Dashboard
							</button>
							<button onClick={handleLogout} className="btn btn-ghost">
								Sign Out
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
