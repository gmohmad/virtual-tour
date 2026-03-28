import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export const Register: React.FC = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();
	const { register } = useAuth();

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		
		register(name, email, password).
			then(_ => navigate("/login"))
			.catch(err => setError(err.response?.data || "Registration failed. Please try again."))
			.finally(() => setIsLoading(false));
	}

	return (
		<div className="auth-page">
			<div className="auth-container">
				<div className="auth-card">
					<div className="auth-header">
						<h1 className="auth-title">Create Your Account</h1>
						<p className="auth-subtitle">Join VirtualTour and start creating amazing virtual tours</p>
					</div>
					
					<form onSubmit={handleSubmit} className="auth-form">
						{error && (
							<div className="form-error" role="alert">
								{error}
							</div>
						)}
						
						<div className="form-group">
							<label htmlFor="name" className="form-label">
								Full Name
							</label>
							<input
								type="text"
								id="name"
								className="form-input"
								placeholder="Enter your full name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								minLength={3}
								maxLength={16}
								autoComplete="name"
							/>
							<div className="form-hint">
								Name must be between 3 and 16 characters
							</div>
						</div>

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
								placeholder="Create a strong password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={8}
								maxLength={16}
								autoComplete="new-password"
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
										Creating Account...
									</>
								) : (
									'Create Account'
								)}
							</button>
						</div>

						<div className="auth-footer">
							<p className="auth-text">
								Already have an account?{' '}
								<Link to="/login" className="auth-link">
									Sign In
								</Link>
							</p>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};
