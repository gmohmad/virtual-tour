import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const Login: React.FC = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await login(email, password);
			navigate('/tours');
		} catch (err) {
			alert('Login failed');
		}
	};

	return (
		<div className="centered-form">
		<form onSubmit={handleSubmit} className="card" style={{ width: '400px', maxWidth: '90%' }}>
		<h2 style={{ marginTop: 0 }}>Login</h2>
		<div className="form-group">
		<label>Email</label>
		<input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
		</div>
		<div className="form-group">
		<label>Password</label>
		<input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
		</div>
		<div className="button-group">
		<button type="submit">Login</button>
		<Link to="/register" className="button">Register</Link>
		</div>
		</form>
		</div>
	);
};
