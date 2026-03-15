import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTourById } from '../services/api';
import { TourViewer } from '../components/TourViewer/TourViewer';
import type { Tour } from '../types';

export const SessionAuthor: React.FC = () => {
	const { sessionId, tourId } = useParams<{ sessionId: string; tourId: string }>();
	const [tour, setTour] = useState<Tour | null>(null);
	const navigate = useNavigate();
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		if (tourId) getTourById(tourId).then(res => setTour(res.data));
	}, [tourId]);

	const handleWebSocketCreated = (ws: WebSocket | null) => {
		wsRef.current = ws;
	};

	const endSession = () => {
		if (wsRef.current) {
			wsRef.current.close();
		}
		navigate('/tours');
	};

	if (!tour) return <div>Loading tour...</div>;

	const shareUrl = `${window.location.origin}/session/${sessionId}/${tourId}`;

	return (
		<>
		<div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'white', padding: 10, borderRadius: 4 }}>
		<strong>Share this link:</strong> <input readOnly value={shareUrl} style={{ width: 300 }} />
		<button onClick={endSession} className="danger" style={{ marginLeft: 10 }}>End Session</button>
		</div>
		<TourViewer 
			key={tour.id} 
			mode="author" 
			tourData={tour.data} 
			sessionId={sessionId!} 
			onWebSocketCreated={handleWebSocketCreated}
		/>
		</>
	);
};
