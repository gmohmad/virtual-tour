import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export const Login: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { login } = useAuth();

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		try {
			await login(email, password)
		} catch (err) {
			alert(`Login failed: ${err.response.data}`)
		}
	}

	return (
		<div> 
			<h1>LOGIN</h1>
			<form onSubmit={handleSubmit}>
				<label>Email</label>
				<input type="email" value={email} onChange={e => setEmail(e.target.value)} required />

				<label>Password</label>
				<input type="password" minLength={8} maxLength={16} value={password} onChange={e => setPassword(e.target.value)}required />

				<button type="submit">Login</button>
			</form>
			<Link to="/register">Register</Link>
		</div>
	)
}
