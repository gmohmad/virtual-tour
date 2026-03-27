import React, { useEffect, useState } from "react";
import { deleteTour, getCompanyByID, getCompanyTours } from "../../services/appApi";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Company } from "../../types/company";
import type { Tour } from "../../types/tour";
import { createSession } from "../../services/livetourApi";

export const CompanyViewer: React.FC = () => {
	const { companyId } = useParams();
	const [company, setCompany] = useState<Company>({id: "", name: "", created_at: "", updated_at: "", user_role: ""});
	const [tours, setTours] = useState<Tour[]>([]);
	const navigate = useNavigate();

	useEffect(() => {
		if (!companyId) return;
		getCompanyByID(companyId).then(resp => {
			setCompany(resp.data);
		});
	}, [companyId]);

	useEffect(() => {
		if (!companyId) return;
		getCompanyTours(companyId).then(resp => {
			setTours(resp.data);
		});
	}, [companyId])

	const handleDeleteTour = async (tourId: string) => {
		if (confirm("Are you sure?") && companyId) {
			await deleteTour(companyId, tourId);
			setTours(prev => prev.filter((tour, _) => tour.id !== tourId));
		}
	}

	const handleCreateSession = async (tourId: string) => {
		createSession().then(resp => {navigate(`/session/${tourId}/${resp.data.id}`)});
	}

	return (
		<div>

		<h1>{company.name}</h1>
		<small>{companyId}</small>
		<small>creation date: {company.created_at}, last update: {company.updated_at}</small>
		<h3>Tours ({tours.length})</h3>
		<Link to={`/company/${companyId}/tours/new`}>Create New Tour</Link>

		{tours.length === 0 ? (
			<p>No tours available.</p>
		) : (
		<ul>
		{tours.map(tour => (
			<li key={tour.id}>
			<h3>{tour.name}</h3>
			<small>ID: {tour.id}</small>
			<small>Created: by {tour.created_by} at {tour.created_at}</small>
			<small>Last Updated: by {tour.updated_at} at {tour.updated_at}</small>
			<Link to={`/company/${companyId}/tours/edit/${tour.id}`}>Edit</Link>
			<button onClick={() => handleDeleteTour(tour.id)}>Delete</button>
			<button onClick={() => handleCreateSession(tour.id)}>Start Session</button>
			</li>
		))}
		</ul>
		)}
		</div>
	)
}
