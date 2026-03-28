import React, { useEffect, useState } from "react";
import { deleteTour, getCompanyByID, getCompanyTours } from "../../services/appApi";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Company } from "../../types/company";
import type { Tour } from "../../types/tour";
import { createSession } from "../../services/livetourApi";
import "./CompanyViewer.css";
import Swal from "sweetalert2";

export const CompanyViewer: React.FC = () => {
	const { companyId } = useParams();
	const [company, setCompany] = useState<Company>({id: "", name: "", created_at: "", updated_at: "", user_role: ""});
	const [error, setError] = useState<string | null>(null);
	const [tours, setTours] = useState<Tour[]>([]);
	const navigate = useNavigate();

	useEffect(() => {
		if (!companyId) return;
		getCompanyByID(companyId).
			then(resp => setCompany(resp.data))
			.catch(err => setError(err.response.data));
	}, [companyId]);

	useEffect(() => {
		if (!companyId) return;
		getCompanyTours(companyId).
			then(resp => setTours(resp.data))
			.catch(err => setError(err.response.data));
	}, [companyId])

	const handleDeleteTour = async (companyId: string, tourId: string, name: string) => {
		const result = await Swal.fire({
			title: 'Delete Tour',
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
			deleteTour(companyId, tourId)
				.then(_ => setTours(prev => prev.filter((tour, _) => tour.id !== tourId)))
				.catch(_ => setError("Failed to delete tour. Please try again."));
		}
	};

	const handleCreateSession = async (tourId: string) => {
		createSession().then(resp => {navigate(`/session/${tourId}/${resp.data.id}`)});
	}

	const formatDate = (iso: string) => {
		if (!iso) return "—";
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
	};

	return (
		<div className="company-viewer-page">
			<div className="container">
				<header className="company-viewer-head fade-in">
					<div className="company-viewer-head-main">
						<h1 className="company-viewer-title">{company.name || "Company"}</h1>
						{companyId && (
							<span className="company-viewer-id" title="Company ID">
								ID: {companyId}
							</span>
						)}
					</div>
					{companyId ? (
						<Link to={`/company/${companyId}/tours/new`} className="btn btn-primary">
							+ New tour
						</Link>
					) : null}
				</header>

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

				<section className="company-viewer-tours-section" aria-labelledby="company-tours-heading">
					<div className="company-viewer-tours-header">
						<h2 id="company-tours-heading" className="company-viewer-section-title">
							Tours ({tours.length})
						</h2>
					</div>

					{tours.length === 0 ? (
						<div className="company-viewer-empty">
							<p className="company-viewer-empty-title">No tours yet</p>
							<p>Create a tour to add panoramas and room links.</p>
							{companyId ? (
								<p className="my-4">
									<Link to={`/company/${companyId}/tours/new`} className="btn btn-primary">
										Create first tour
									</Link>
								</p>
							) : null}
						</div>
					) : (
						<div className="company-viewer-tours-grid">
							{tours.map(tour => (
								<article key={tour.id} className="company-viewer-tour-card">
									<h3 className="company-viewer-tour-name">{tour.name}</h3>
									<div className="company-viewer-tour-meta">
										<span>
											ID: <code>{tour.id}</code>
										</span>
									</div>

									<div className="company-viewer-tour-actions">
										{companyId && company.user_role === "owner" ? (
											<>
											<Link
												to={`/company/${company.id}/tours/edit/${tour.id}`}
												className="btn btn-secondary btn-sm"
											>
											Edit
											</Link>
											<button
												type="button"
												className="btn btn-danger btn-sm"
												onClick={() => handleDeleteTour(companyId, tour.id, tour.name)}
											>
											Delete
											</button>
											<button
												type="button"
												className="btn btn-primary btn-sm"
												onClick={() => handleCreateSession(tour.id)}
											>
												Start session
											</button>
											</>
										) : (
											<button
												type="button"
												className="btn btn-primary btn-sm"
												onClick={() => handleCreateSession(tour.id)}
											>
												Start session
											</button>
										)}
									</div>
								</article>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	)
}
