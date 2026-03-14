import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTourById } from '../services/api';
import { TourViewer } from '../components/TourViewer/TourViewer';
import type { Tour } from '../types';

export const SessionAuthor: React.FC = () => {
	const { sessionId, tourId } = useParams<{ sessionId: string; tourId: string }>();
	const [tour, setTour] = useState<Tour | null>(null);

	useEffect(() => {
		if (tourId) getTourById(tourId).then(res => setTour(res.data));
	}, [tourId]);

	if (!tour) return <div>Loading tour...</div>;

	const shareUrl = `${window.location.origin}/session/${sessionId}/${tourId}`;

	return (
		<>
		<div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'white', padding: 10 }}>
		<strong>Share this link:</strong> <input readOnly value={shareUrl} style={{ width: 300 }} />
		</div>
		<TourViewer mode="author" tourData={tour.data} sessionId={sessionId!} />
		</>
	);
};
