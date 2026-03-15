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
		<div style={{ padding: '20px' }}>
		<h1>My Tours</h1>
		<Link to="/tours/new">Create New Tour</Link>
		<ul>
		{tours.map(tour => (
			<li key={tour.id}>
			<h3>{tour.name}</h3>
			<button onClick={() => startSession(tour.id)}>Start Session</button>
			<Link to={`/tours/edit/${tour.id}`}>Edit</Link>
			<button onClick={() => handleDelete(tour.id)}>Delete</button>
			</li>
		))}
		</ul>
		</div>
	);
};
