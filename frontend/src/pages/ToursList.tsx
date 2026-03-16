import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyTours, deleteTour } from '../services/api';
import type { Tour } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export const ToursList: React.FC = () => {
	const { user } = useAuth();
	const [tours, setTours] = useState<Tour[]>([]);
	const navigate = useNavigate();

	useEffect(() => {
		loadTours();
	}, []);

	const loadTours = async () => {
		const res = await getMyTours();
		setTours(res.data);
	};

	const handleDelete = async (id: string) => {
		if (confirm('Are you sure?')) {
			await deleteTour(id);
			loadTours();
		}
	};

	const startSession = (tourId: string) => {
		const sessionId = uuidv4();
		navigate(`/session/${sessionId}/author/${tourId}`);
	};

	return (
		<div className="container">
		<div className="card">
		<h1>My Tours</h1>
		<Link to="/tours/new" className="button" style={{ display: 'inline-block', marginBottom: '1rem' }}>
		Create New Tour
		</Link>

		{tours.length === 0 ? (
			<p>You haven't created any tours yet.</p>
		) : (
		<ul className="tour-list">
		{tours.map(tour => (
			<li key={tour.id}>
			<div>
			<h3 style={{ margin: '0 0 0.25rem 0' }}>{tour.name}</h3>
			<small>ID: {tour.id}</small>
			</div>
			<div className="button-group">
			<button onClick={() => startSession(tour.id)}>Start Session</button>
			<Link to={`/tours/edit/${tour.id}`} className="button">Edit</Link>
			<button onClick={() => handleDelete(tour.id)} className="danger">Delete</button>
			</div>
			</li>
		))}
		</ul>
		)}
		</div>
		</div>
	);
};
