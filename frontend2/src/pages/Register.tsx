import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export const Register: React.FC = () => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate();
	const { register } = useAuth();

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		try {
			await register(name, email, password);
			navigate("/login");
		} catch (err) {
			alert(`Register failed: ${err.response.data}`);
		}
	}

	return (
		<div> 
			<h1>LOGIN</h1>
			<form onSubmit={handleSubmit}>
				<label>Name</label>
				<input type="text" minLength={3} maxLength={16} value={name} onChange={e => setName(e.target.value)} required />

				<label>Email</label>
				<input type="email" value={email} onChange={e => setEmail(e.target.value)} required />

				<label>Password</label>
				<input type="password" minLength={8} maxLength={16} value={password} onChange={e => setPassword(e.target.value)}required />

				<button type="submit">Register</button>
			</form>
			<Link to="/login">Register</Link>
		</div>
	)
}
