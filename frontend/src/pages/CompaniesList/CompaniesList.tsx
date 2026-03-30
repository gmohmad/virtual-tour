import React, { useEffect, useState } from "react";
import { deleteCompany, getCompaniesOfUser, removeUserFromCompany } from "../../services/appApi";
import type { Company } from "../../types/company";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import './CompaniesList.css';
import { useAuth } from "../../contexts/AuthContext";

export const CompaniesList: React.FC = () => {
	const [companies, setCompanies] = useState<Company[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { user } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		setIsLoading(true);
		setError(null);
		getCompaniesOfUser().
			then(resp => setCompanies(resp.data))
			.catch(_ => setError("Failed to load companies. Please try again."))
			.finally(() => setIsLoading(false));
	}, [user?.id]);

	const handleDelete = async (id: string, name: string) => {
		const result = await Swal.fire({
			title: 'Delete Company',
			text: `Are you sure you want to delete ${name}?`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Delete',
			cancelButtonText: 'Cancel',
			customClass: {
				confirmButton: 'btn btn-danger',
				cancelButton: 'btn btn-ghost',
			}
		});
		if (result.isConfirmed) {
			deleteCompany(id)
				.then(_ => setCompanies(prev => prev.filter((company, _) => company.id !== id)))
				.catch(_ => setError("Failed to delete company. Please try again."));
		}
	};

	const handleLeave = async (id: string, name: string) => {
		const result = await Swal.fire({
			title: 'Leave Company',
			text: `Are you sure you want to leave ${name}?`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Leave',
			cancelButtonText: 'Cancel',
			customClass: {
				confirmButton: 'btn btn-danger',
				cancelButton: 'btn btn-ghost',
			}
		});
		if (result.isConfirmed && user?.id) {
			removeUserFromCompany(id, user?.id)
			.then(_ => setCompanies(prev => prev.filter((company, _) => company.id !== id)))
			.catch(err => setError(`${err.response.data} Could not leave company`))
		}
	};

	const handleCreateCompany = () => {
		navigate("/company/new");
	};

	if (isLoading) {
		return (
			<div className="companies-page">
				<div className="container">
					<div className="page-header">
						<div className="header-content">
							<h1 className="page-title">My Companies</h1>
							<p className="page-subtitle">Manage your virtual tour companies</p>
						</div>
						<button className="btn btn-primary" onClick={handleCreateCompany}>
							+ New Company
						</button>
					</div>
					<div className="companies-grid">
						{[...Array(3)].map((_, index) => (
							<div key={index} className="company-card skeleton">
								<div className="skeleton-header"></div>
								<div className="skeleton-body">
									<div className="skeleton-line"></div>
									<div className="skeleton-line"></div>
								</div>
								<div className="skeleton-actions"></div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="companies-page">
			<div className="container">
				<div className="page-header">
					<div className="header-content">
						<h1 className="page-title">My Companies</h1>
						<p className="page-subtitle">
							{companies.length === 0 
								? "You don't have any companies yet" 
								: `Manage your ${companies.length} company${companies.length > 1 ? 's' : ''}`
							}
						</p>
					</div>
					<button className="btn btn-primary" onClick={handleCreateCompany}>
						+ New Company
					</button>
				</div>

				{error && (
					<div className="alert alert-error">
						<span className="alert-icon">⚠️</span>
						<span className="alert-message">{error}</span>
						<button 
							className="alert-action"
							onClick={() => setError(null)}
							aria-label="Dismiss"
						>
							✕
						</button>
					</div>
				)}

				{companies.length === 0 ? (
					<div className="empty-state">
						<div className="empty-icon">🏢</div>
						<h3 className="empty-title">No Companies Yet</h3>
						<p className="empty-description">
							Create your first company to start building virtual tours and managing your business presence.
						</p>
						<button className="btn btn-primary btn-lg" onClick={handleCreateCompany}>
							Create Your First Company
						</button>
					</div>
				) : (
					<div className="companies-grid">
						{companies.map((company) => (
							<div key={company.id} className="company-card">
								<div className="company-header">
									<div className="company-info">
										<h3 className="company-name">{company.name}</h3>
										<div className="company-meta">
											<span className="badge badge-primary">
												{company.user_role}
											</span>
										</div>
									</div>
									<div className="company-actions">
										{company.user_role === "owner" ? (
											<>
												<button 
													className="btn btn-ghost"
													onClick={() => navigate(`/company/${company.id}`)}
													title="View Company"
												>
													View
												</button>
												<button 
													className="btn btn-ghost"
													onClick={() => navigate(`/company/edit/${company.id}`)}
													title="Edit Company"
												>
													Edit
												</button>
												<button 
													className="btn btn-danger"
													onClick={() => handleDelete(company.id, company.name)}
													title="Delete Company"
												>
													Delete
												</button>
											</>
										) : (
											<>
											<button 
												className="btn btn-ghost"
												onClick={() => navigate(`/company/${company.id}`)}
												title="View Company"
											>
												View
											</button>
											<button
												className="btn btn-danger"
												onClick={() => handleLeave(company.id, company.name)}
												title="Leave Company"
											>
												Leave
											</button>
											</>
										)}
									</div>
								</div>
								<div className="company-id-container">	
									<span className="company-id">ID: {company.id}</span>
								</div>
								<div className="company-details">
									<div className="detail-item">
										<span className="detail-label">Created</span>
										<span className="detail-value">
											{new Date(company.created_at).toLocaleDateString()}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">Last Updated</span>
										<span className="detail-value">
											{new Date(company.updated_at).toLocaleDateString()}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};
