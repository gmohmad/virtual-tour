import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
import { createCompany, getCompanyByID, updateCompany } from "../services/appApi";

export const CompanyEditor: React.FC = () => {
	const navigate = useNavigate();
	const { companyId } = useParams();
	const [name, setName] = useState("");

	useEffect(() => {
		if (!companyId) return;
		getCompanyByID(companyId).then(resp => {
			setName(resp.data.name);
		});
	}, [companyId]);


	const submit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (companyId) {
			await updateCompany(companyId, name);
		} else {
			await createCompany(name).then(res => navigate(`/company/${res.data.id}`));
		}
	}

	return (
		<div>
			<h1>{companyId ? "Edit Company" : "Create Company"}</h1>
			<form onSubmit={submit}>
				<label>Name</label>
				<input type="text" minLength={3} maxLength={16} value={name} onChange={e => setName(e.target.value)} required />
				<button type="submit">Submit</button>
			</form>
		</div>
	)
}
