import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicTour } from '../services/api';
import { TourViewer } from '../components/TourViewer/TourViewer';
import type { Tour } from '../types';

export const SessionClient: React.FC = () => {
	const { sessionId, tourId } = useParams<{ sessionId: string; tourId: string }>();
	const [tour, setTour] = useState<Tour | null>(null);

	useEffect(() => {
		if (tourId) getPublicTour(tourId).then(res => setTour(res.data));
	}, [tourId]);

	if (!tour) return <div>Loading tour...</div>;

	return <TourViewer mode="client" tourData={tour.data} sessionId={sessionId!} />;
};
