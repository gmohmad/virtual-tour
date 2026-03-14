import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export const Register: React.FC = () => {
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
			alert('Register failed');
		}
	};

	return (
		<form onSubmit={handleSubmit}>
		<h2>Login</h2>
		<input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
		<input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
		<button type="submit">Login</button>
		<Link to="/register">Register</Link>
		</form>
	);
};
