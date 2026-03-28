import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createCompany, getCompanyByID, updateCompany } from "../../services/appApi";
import "./CompanyEditor.css";

export const CompanyEditor: React.FC = () => {
	const navigate = useNavigate();
	const { companyId } = useParams();
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!companyId) return;
		setError(null);
		getCompanyByID(companyId).
			then(resp => setName(resp.data.name))
			.catch(_ => setError("Failed to load company. Please try again."))
	}, [])

	const submit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (companyId) {
			await updateCompany(companyId, name).
				then(resp => navigate(`/company/${resp.data.id}`))
				.catch(_ => setError("Failed to update company. Please try again."));
				console.log("error")
		} else {
			await createCompany(name)
				.then(resp => navigate(`/company/${resp.data.id}`))
				.catch(_ => setError("Failed to create company. Please try again."));
		};
	};

	return (
		<div className="company-editor-page">
			<div className="container">
				<div className="company-editor-card fade-in">
					<h1 className="company-editor-title">{companyId ? "Edit company" : "Create company"}</h1>
					<form onSubmit={submit}>
						<div className="form-group">
							<label htmlFor="company-name" className="form-label">
								Name
							</label>
							<input
								id="company-name"
								type="text"
								className="form-input"
								minLength={3}
								maxLength={16}
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								autoComplete="organization"
							/>
						</div>
						<div className="company-editor-form-actions">
							<button type="submit" className="btn btn-primary">
								Save
							</button>
							{companyId ? (
								<button
									type="button"
									className="btn btn-ghost"
									onClick={() => navigate(`/company/${companyId}`)}
								>
									Cancel
								</button>
							) : null}
						</div>
					</form>

					{error && (
						<div className="alert alert-error">
						<span className="alert-icon">⚠️</span>
						<span className="alert-message">{error}</span>
						<button
							className="alert-action"
							onClick={() => setError(null)}
							aria-label="Dismiss"
						>✕</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
