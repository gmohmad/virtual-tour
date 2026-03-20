import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"
import { createCompany, getCompanyByID, updateCompany } from "../services/api";

export const CompanyEditor: React.FC = () => {
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
			await createCompany(name);
		}
	}

	return (
		<div>
			<form onSubmit={submit}>
				<label>Name</label>
				<input type="text" minLength={3} maxLength={16} value={name} onChange={e => setName(e.target.value)} required />
				<button type="submit">Submit</button>
			</form>
		</div>
	)
}
