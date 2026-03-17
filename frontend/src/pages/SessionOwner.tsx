import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTourById } from '../services/api';
import { TourViewer } from '../components/TourViewer/TourViewer';
import type { Tour } from '../types';

export const SessionOwner: React.FC = () => {
	const { sessionId, tourId } = useParams<{ sessionId: string; tourId: string }>();
	const [tour, setTour] = useState<Tour | null>(null);
	const [modalMessage, setModalMessage] = useState<string | null>(null);
	const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' } | null>(null);
	const [toastVisible, setToastVisible] = useState(false);
	const [showShare, setShowShare] = useState(false);
	const navigate = useNavigate();
	const wsRef = useRef<WebSocket | null>(null);
	const hideToastTimerRef = useRef<number>();

	useEffect(() => {
		if (tourId) getTourById(tourId).then(res => setTour(res.data));
	}, [tourId]);

	const handleWebSocketCreated = (ws: WebSocket | null) => {
		wsRef.current = ws;
	};

	// Toast helpers
	const showToast = (text: string) => {
		if (hideToastTimerRef.current) clearTimeout(hideToastTimerRef.current);
		setToastMessage({ text, type: 'success' });
		setToastVisible(true);
		hideToastTimerRef.current = window.setTimeout(() => {
			setToastVisible(false);
			setTimeout(() => setToastMessage(null), 300);
		}, 2000);
	};

	const hideToast = () => {
		setToastVisible(false);
		hideToastTimerRef.current = window.setTimeout(() => {
			setToastMessage(null);
		}, 300);
	};

	// Error handler – show modal
	const handleError = (errorMsg: string) => {
		setModalMessage(errorMsg);
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
		showToast('Link copied!');
	};

	const closeModalAndRedirect = () => {
		navigate('/');
	};

	useEffect(() => {
		return () => {
			if (hideToastTimerRef.current) clearTimeout(hideToastTimerRef.current);
		};
	}, []);

	if (!tour) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading tour...</div>;

	return (
		<>
		<TourViewer
		key={tour.id}
		mode="owner"
		tourData={tour.data}
		sessionId={sessionId!}
		onWebSocketCreated={handleWebSocketCreated}
		onError={handleError}
		/>
		<div className="session-bottom-bar">
		<button onClick={endSession} className="danger">End Session</button>
		<button onClick={() => setShowShare(!showShare)}>Share Link</button>
		</div>
		{showShare && (
			<div className="share-popup">
			<input type="text" readOnly value={shareUrl} onClick={(e) => e.currentTarget.select()} />
			<div className="button-group">
			<button onClick={copyToClipboard}>Copy</button>
			<button onClick={() => setShowShare(false)}>Close</button>
			</div>
			</div>
		)}
		{modalMessage && (
			<div className="modal-overlay">
			<div className="modal-content">
			<p>{modalMessage}</p>
			<button onClick={closeModalAndRedirect}>OK</button>
			</div>
			</div>
		)}
		{toastMessage && (
			<div className={`toast ${toastMessage.type} ${toastVisible ? '' : 'hidden'}`}>
			<span>{toastMessage.text}</span>
			<button onClick={hideToast}>✕</button>
			</div>
		)}
		</>
	);
};
