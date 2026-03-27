import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { User } from "../../types/user";
import { addMembersToCompany, createCompany, updateCompany } from "../../services/appApi";
import { UserSearch } from "../../components/UserSearch/UserSearch";

export const CompanyEditor: React.FC = () => {
	const navigate = useNavigate();
	const { companyId } = useParams();
	const [name, setName] = useState("");
	const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

	const submit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		try {
			if (companyId) {
				await updateCompany(companyId, name);
				if (selectedUsers.length > 0) await addMembersToCompany(companyId, selectedUsers.map(u => u.id));
				navigate(`/company/${companyId}`);
			} else {
				const company = await createCompany(name);
				if (selectedUsers.length > 0) await addMembersToCompany(company.data.id, selectedUsers.map(u => u.id));
				navigate(`/company/${company.data.id}`);
			}
		} catch (err) {
			alert(`Failed to save company: ${err.response.data}`);
		}
	};

	return (
		<div>
		<h1>{companyId ? "Edit Company" : "Create Company"}</h1>
		<form onSubmit={submit}>
		<label>Name</label>
		<input
		type="text"
		minLength={3}
		maxLength={16}
		value={name}
		onChange={(e) => setName(e.target.value)}
		required
		/>
		<button type="submit">Submit</button>
		</form>

		<hr />
		<h3>Add Members</h3>
		<UserSearch
		onUsersSelected={setSelectedUsers}
		initialSelected={selectedUsers}
		/>
		</div>
	);
};
