import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

export const Login: React.FC = () => {
	const { user, login } = useAuth();
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");


	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		await login(email, password).
			then(_ => navigate("/companies/my"))
			.catch(err => setError(err.response?.data || "Login failed. Please try again."))
			.finally(() => setIsLoading(false));
	}

	if (user?.id) {
		return (
			<div className="auth-page">
				<div className="auth-container">
					<div className="auth-card">
						<div className="auth-header">
							<h1 className="auth-title">Welcome Back</h1>
							<p className="auth-subtitle">You're already signed in</p>
						</div>
						<div className="auth-content">
							<p className="success-message">
								You're already logged in as <strong>{user.name}</strong>
							</p>
							<div className="auth-actions">
								<Link to="/companies/my" className="btn btn-primary">
									Go to Dashboard
								</Link>
								<Link to="/logout" className="btn btn-ghost">
									Sign Out
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="auth-page">
			<div className="auth-container">
				<div className="auth-card">
					<div className="auth-header">
						<h1 className="auth-title">Sign In to VirtualTour</h1>
						<p className="auth-subtitle">Welcome back! Please sign in to your account</p>
					</div>
					
					<form onSubmit={handleSubmit} className="auth-form">
						{error && (
							<div className="form-error" role="alert">
								{error}
							</div>
						)}
						
						<div className="form-group">
							<label htmlFor="email" className="form-label">
								Email Address
							</label>
							<input
								type="email"
								id="email"
								className="form-input"
								placeholder="Enter your email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoComplete="email"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="password" className="form-label">
								Password
							</label>
							<input
								type="password"
								id="password"
								className="form-input"
								placeholder="Enter your password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={8}
								maxLength={16}
								autoComplete="current-password"
							/>
							<div className="form-hint">
								Password must be between 8 and 16 characters
							</div>
						</div>

						<div className="form-group">
							<button 
								type="submit" 
								className="btn btn-primary btn-lg w-full"
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<span className="loading-spinner"></span>
										Signing In...
									</>
								) : (
									'Sign In'
								)}
							</button>
						</div>

						<div className="auth-footer">
							<p className="auth-text">
								Don't have an account?{' '}
								<Link to="/register" className="auth-link">
									Get Started
								</Link>
							</p>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};
