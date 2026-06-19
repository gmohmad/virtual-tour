import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Login/Login.css";

export const Join: React.FC = () => {
	const [url, setUrl] = useState("");
	const navigate = useNavigate();

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		let target = url.trim();

		if (target.startsWith("http://") || target.startsWith("https://")) {
			try {
			const parsed = new URL(target);
		target = parsed.pathname + parsed.search + parsed.hash;
		} catch {}
		}

		if (!target.startsWith("/")) {
			target = "/" + target;
		}

		navigate(target);
	};

	return (
		<div className="auth-page">
		<div className="auth-container">
		<div className="auth-card">
		<div className="auth-header">
		<h1 className="auth-title">Join a session by a link</h1>
		</div>

		<form onSubmit={handleSubmit} className="auth-form">
		<div className="form-group">
		<input
		type="text"
		className="form-input"
		placeholder="Paste the session link"
		value={url}
		onChange={(e) => setUrl(e.target.value)}
		required
		/>
		</div>

		<div className="form-group">
		<button type="submit" className="btn btn-primary btn-lg w-full">
		Join
		</button>
		</div>
		</form>
		</div>
		</div>
		</div>
	);
};
