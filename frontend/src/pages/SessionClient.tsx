import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicTour } from '../services/api';
import { TourViewer } from '../components/TourViewer/TourViewer';
import type { Tour } from '../types';

export const SessionClient: React.FC = () => {
	const { sessionId, tourId } = useParams<{ sessionId: string; tourId: string }>();
	const [tour, setTour] = useState<Tour | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		if (tourId) getPublicTour(tourId).then(res => setTour(res.data));
	}, [tourId]);

	const leaveSession = () => {
		navigate('/'); // or any other route
	};

	if (!tour) return <div>Loading tour...</div>;

	return (
		<>
		<div style={{
			position: 'absolute',
			top: 10,
			left: 10,
			zIndex: 1000,
			background: 'white',
			padding: 10,
			borderRadius: 4
		}}>
		<button onClick={leaveSession} className="danger">Leave Room</button>
		</div>
		<TourViewer mode="client" tourData={tour.data} sessionId={sessionId!} />
		</>
	);
};
