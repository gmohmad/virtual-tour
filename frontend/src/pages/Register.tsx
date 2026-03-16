import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';

export const Register: React.FC = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await register(email, password); // assuming your register uses login? You may need to adjust
			navigate('/tours');
		} catch (err) {
			alert('Register failed');
		}
	};

	return (
		<div className="centered-form">
		<form onSubmit={handleSubmit} className="card" style={{ width: '400px', maxWidth: '90%' }}>
		<h2 style={{ marginTop: 0 }}>Register</h2>
		<div className="form-group">
		<label>Email</label>
		<input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
		</div>
		<div className="form-group">
		<label>Password</label>
		<input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
		</div>
		<div className="button-group">
		<button type="submit">Register</button>
		<Link to="/login" className="button">Login</Link>
		</div>
		</form>
		</div>
	);
};
