import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { createCompany, getCompanyByID, updateCompany } from "../services/api";

export const CompanyEditor: React.FC = () => {
	const navigate = useNavigate();
	const { id } = useParams();
	const [name, setName] = useState("");

	useEffect(() => {
		if (!id) return;
		getCompanyByID(id).then(resp => {
			setName(resp.data.name);
		});
	}, [id]);


	const submit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (id) {
			await updateCompany(id, name);
		} else {
			await createCompany(name).then(res => navigate(`/company/${res.data.id}`));
		}
	}

	return (
		<div>
			<h1>{id ? "Edit Company" : "Create Company"}</h1>
			<form onSubmit={submit}>
				<label>Name</label>
				<input type="text" minLength={3} maxLength={16} value={name} onChange={e => setName(e.target.value)} required />
				<button type="submit">Submit</button>
			</form>
		</div>
	)
}
