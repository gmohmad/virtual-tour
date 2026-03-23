import type React from "react";
import { useEffect, useState } from "react";
import { deleteCompany, getCompaniesOfUser } from "../services/appApi";
import type { Company } from "../types/company";
import { Link, useNavigate } from "react-router-dom";

export const CompaniesList: React.FC = () => {
	const [companies, setCompanies] = useState<Company[]>([]);
	const navigate = useNavigate();

	useEffect(() => {loadCompanies()}, []);

	const loadCompanies = async () => {
		const res = await getCompaniesOfUser();
		setCompanies(res.data);
	}

	const handleDelete = async (id: string) => {
		if (confirm("Are you sure?")) {
			await deleteCompany(id);
			loadCompanies();
		}
	}

	return (
		<div>

		<h1>Companies</h1>
		{companies.length === 0 ? (
			<p>No companies you are associated with.</p>
		) : (
		<ul>
		{companies.map(company => (
			<li key={company.id}>
			<h3>{company.name}</h3>
			<small>ID: {company.id}</small>
			<small>Created: {company.created_at}</small>
			<small>Last Updated: {company.updated_at}</small>
			{company.user_role === "owner" ? 
				<div>
				<button onClick={() => handleDelete(company.id)}>Delete</button>
				<button onClick={() => navigate(`/company/edit/${company.id}`)}>Edit</button>
				<button onClick={() => navigate(`/company/${company.id}`)}>View</button>
				</div>
				:
				<button onClick={() => console.log("Leave")}>Leave</button>
			}
			</li>
		))}
		</ul>
		)}

		</div>
	)
}
