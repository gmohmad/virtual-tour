import React  from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export const Logout: React.FC = () => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout()
		navigate("/login")
	}

	return (
		<div>
			<h1>Logout</h1>
			{user?.id ?
				<div>
				<h4>Are you sure you want to logout</h4>
				<button onClick={handleLogout}>Logout</button>
				</div>
				:
				<h3>You're not logged in. <Link to={"/login"}>Login</Link></h3>
			}
		</div>
	)
}
