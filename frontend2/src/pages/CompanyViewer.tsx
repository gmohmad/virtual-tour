import React, { useEffect, useState } from "react";
import { deleteTour, getCompanyByID, getCompanyTours } from "../services/api";
import { Link, useParams } from "react-router-dom";
import type { Company } from "../types/company";
import type { Tour } from "../types/tour";

export const CompanyViewer: React.FC = () => {
	const { id } = useParams();
	const [company, setCompany] = useState<Company>({id: "", name: "", created_at: "", updated_at: "", user_role: ""});
	const [tours, setTours] = useState<Tour[]>([]);

	useEffect(() => {
		if (!id) return;
		getCompanyByID(id).then((resp) => {
			setCompany(resp.data);
		});
		loadTours()
	}, []);

	const loadTours = async () => {
		if (!id) return;
		const res = await getCompanyTours(id);
		setTours(res.data);
	}
	
	const handleDeleteTour = async (id: string) => {
		if (confirm('Are you sure?')) {
			await deleteTour(id);
			loadTours();
		}
	}

	return (
		<div>

		<h1>{company.name}</h1>
		<small>{id}</small>
		<small>creation date: {company.created_at}, last update: {company.updated_at}</small>
		<h3>Tours ({tours.length})</h3>
		<Link to={`/company/${id}/tours/new`}>Create New Tour</Link>

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
			<Link to={`/company/${id}/tours/edit/${tour.id}`}>Edit</Link>
			<button onClick={() => handleDeleteTour(tour.id)}>Delete</button>
			</li>
		))}
		</ul>
		)}
		</div>
	)
}
