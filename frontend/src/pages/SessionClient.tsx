import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicTour } from '../services/api';
import { TourViewer } from '../components/TourViewer/TourViewer';
import type { Tour } from '../types';

export const SessionClient: React.FC = () => {
	const { sessionId, tourId } = useParams();
	const [tour, setTour] = useState<Tour | null>(null);
	const [modalMessage, setModalMessage] = useState<string | null>(null); // persistent error
	const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' } | null>(null);
	const [toastVisible, setToastVisible] = useState(false);
	const navigate = useNavigate();
	const hideToastTimerRef = useRef<number>();

	useEffect(() => {
		if (tourId) getPublicTour(tourId).then(res => setTour(res.data));
	}, [tourId]);


	const hideToast = () => {
		setToastVisible(false);
		hideToastTimerRef.current = window.setTimeout(() => {
			setToastMessage(null);
		}, 300);
	};

	// Error handlers – show modal (persistent)
	const handleError = (errorMsg: string) => {
		setModalMessage(errorMsg);
	};

	const handleSessionEnded = () => {
		setModalMessage('The author has ended the session.');
	};

	const leaveSession = () => {
		navigate('/');
	};

	const closeModalAndRedirect = () => {
		navigate('/');
	};

	// Cleanup timers
	useEffect(() => {
		return () => {
			if (hideToastTimerRef.current) clearTimeout(hideToastTimerRef.current);
		};
	}, []);

	if (!tour) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading tour...</div>;

	return (
		<>
		<TourViewer
		mode="client"
		tourData={tour.data}
		sessionId={sessionId!}
		onSessionEnded={handleSessionEnded}
		onError={handleError}
		/>
		<div className="session-bottom-bar">
		<button onClick={leaveSession} className="danger">Leave Room</button>
		</div>

		{/* Persistent error modal */}
		{modalMessage && (
			<div className="modal-overlay">
			<div className="modal-content">
			<p>{modalMessage}</p>
			<button onClick={closeModalAndRedirect}>OK</button>
			</div>
			</div>
		)}

		{/* Transient success toast (only for copy) – not used here, but kept for consistency */}
			{toastMessage && (
				<div className={`toast ${toastMessage.type} ${toastVisible ? '' : 'hidden'}`}>
				<span>{toastMessage.text}</span>
				<button onClick={hideToast}>✕</button>
				</div>
			)}
			</>
	);
};
