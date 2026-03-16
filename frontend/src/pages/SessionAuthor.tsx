import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTourById } from '../services/api';
import { TourViewer } from '../components/TourViewer/TourViewer';
import type { Tour } from '../types';

export const SessionAuthor: React.FC = () => {
	const { sessionId, tourId } = useParams<{ sessionId: string; tourId: string }>();
	const [tour, setTour] = useState<Tour | null>(null);
	const [showShare, setShowShare] = useState(false);
	const navigate = useNavigate();
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		if (tourId) getTourById(tourId).then(res => setTour(res.data));
	}, [tourId]);

	const handleWebSocketCreated = (ws: WebSocket | null) => {
		wsRef.current = ws;
	};

	const endSession = () => {
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({ type: 'session_ended' }));
			setTimeout(() => {
				wsRef.current?.close();
				navigate('/tours');
			}, 100);
		} else {
			navigate('/tours');
		}
	};

	const shareUrl = `${window.location.origin}/session/${sessionId}/${tourId}`;

	const copyToClipboard = () => {
		navigator.clipboard.writeText(shareUrl);
		alert('Link copied to clipboard!');
	};

	if (!tour) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading tour...</div>;

	return (
		<>
		<TourViewer
		key={tour.id}
		mode="author"
		tourData={tour.data}
		sessionId={sessionId!}
		onWebSocketCreated={handleWebSocketCreated}
		/>
		<div className="session-bottom-bar">
		<button onClick={endSession} className="danger">End Session</button>
		<button onClick={() => setShowShare(!showShare)}>Share Link</button>
		</div>
		{showShare && (
			<div className="share-popup">
			<input
			type="text"
			readOnly
			value={shareUrl}
			onClick={(e) => e.currentTarget.select()}
			/>
			<div className="button-group">
			<button onClick={copyToClipboard}>Copy</button>
			<button onClick={() => setShowShare(false)}>Close</button>
			</div>
			</div>
		)}
		</>
	);
};
