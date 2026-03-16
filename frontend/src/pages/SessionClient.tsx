import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicTour } from '../services/api';
import { TourViewer } from '../components/TourViewer/TourViewer';
import type { Tour } from '../types';

export const SessionClient: React.FC = () => {
	const { sessionId, tourId } = useParams();
	const [tour, setTour] = useState<Tour | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		if (tourId) getPublicTour(tourId).then(res => setTour(res.data));
	}, [tourId]);

	const handleSessionEnded = () => {
		alert('The author has ended the session.');
		navigate('/');
	};

	const leaveSession = () => {
		navigate('/');
	};

	if (!tour) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading tour...</div>;

	return (
		<>
		<TourViewer
		mode="client"
		tourData={tour.data}
		sessionId={sessionId!}
		onSessionEnded={handleSessionEnded}
		/>
		<div className="session-bottom-bar">
		<button onClick={leaveSession} className="danger">Leave Room</button>
		</div>
		</>
	);
};
