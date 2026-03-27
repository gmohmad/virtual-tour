import React, { useEffect, useMemo, useState } from "react";
import { getTourByID } from "../../services/appApi";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getSession, endSession } from "../../services/livetourApi";
import type { Tour } from "../../types/tour";
import type { Session } from "../../types/session";
import { OwnerTourViewer } from "../../components/OwnerTourViewer/OwnerTourViewer";
import { ClientTourViewer } from "../../components/ClientTourViewer/ClientTourViewer";
import { v4 as uuidv4 } from 'uuid';
import './TourViewer.css';
import Swal from "sweetalert2";

export const TourViewer: React.FC = () => {
	const [session, setSession] = useState<Session>();
	const [tour, setTour] = useState<Tour>();
	const [joined, setJoined] = useState(false);
	const { tourId, sessionId } = useParams();
	const { user } = useAuth();
	const navigate = useNavigate();

	const clientId = useMemo(() => getClientId(user?.id), [user?.id]);
	const params = new URLSearchParams({ clientId: clientId }).toString();
	const wsUrl = `${import.meta.env.VITE_LIVETOUR_API_URL.replace("http", "ws")}/connect/${sessionId}?${params}`;

	useEffect(() => {
		if (!sessionId || !tourId) return;
		Promise.all([
			getSession(sessionId),
			getTourByID(tourId).then(resp => {
				const tourData = resp.data.data;
				tourData.nodes.forEach(node => {
					node.panorama = `${import.meta.env.VITE_APP_API_URL}/${node.panorama}`;
				});
				return resp.data;
			}),
		]).then(([sessionData, tourData]) => {
			setSession(sessionData.data);
			setTour(tourData);
		}).catch((err) => handleError(err.response.data));
	}, [sessionId, tourId, navigate]);

	const handleError = async (errorMessage: string) => {
		const result = await Swal.fire({
			title: "Error",
			text: `${errorMessage}`,
			icon: "error",
			confirmButtonText: "Ok",
			customClass: {
				confirmButton: "btn btn-primary",
			}
		});
		if (result.isConfirmed) navigate("/companies/my")
	};

	const isOwner = session?.owner_id === user?.id;

	const handleJoin = () => {
		setJoined(true);
	};

	const handleCancel = async () => {
		if (isOwner && sessionId) {
			endSession(sessionId)
			.then(_ => navigate("/companies/my"))
			.catch(err => handleError(err.response.data))
		} else {
			navigate("/login");
		}
	};

	if (!joined && tour && session) {
		return (
			<div className="session-preview">
				<div className="preview-content">
					<div className="preview-header">
						<div className="tour-preview-info">
							<h1 className="tour-name">{tour.name}</h1>
							<div className="tour-meta">
								<span className="badge badge-primary">
									{isOwner ? "Host Mode" : "Viewer Mode"}
								</span>
								<span className="session-id">Session: {sessionId}</span>
							</div>
						</div>
						<div className="tour-image-preview">
							{tour.data.nodes[0]?.panorama && (
								<img
									src={tour.data.nodes[0].panorama}
									alt="Tour preview"
									className="preview-image"
								/>
							)}
							<div className="preview-overlay">
								<span className="preview-label">Virtual Tour Preview</span>
							</div>
						</div>
					</div>

					<div className="preview-details">
						<div className="detail-grid">
							<div className="detail-item">
								<span className="detail-label">Tour Type</span>
								<span className="detail-value">Interactive Virtual Tour</span>
							</div>
							<div className="detail-item">
								<span className="detail-label">Session Status</span>
								<span className="detail-value status active">Active</span>
							</div>
							<div className="detail-item">
								<span className="detail-label">Host</span>
								<span className="detail-value">{isOwner ? "You" : session.owner_id}</span>
							</div>
							<div className="detail-item">
								<span className="detail-label">Mode</span>
								<span className="detail-value">{isOwner ? "Live Control" : "Guided Viewing"}</span>
							</div>
						</div>
					</div>

					<div className="preview-actions">
						{isOwner ? (
							<div className="owner-actions">
								<p className="action-description">
									You are the host of this session. You will have full control over the tour navigation.
								</p>
								<div className="action-buttons">
									<button className="btn btn-primary btn-lg" onClick={handleJoin}>
										Start Tour Session
									</button>
									<button className="btn btn-ghost" onClick={handleCancel}>
										Cancel Session
									</button>
								</div>
							</div>
						) : (
							<div className="viewer-actions">
								<p className="action-description">
									You are joining as a viewer. Your host will guide you through the tour experience.
								</p>
								<div className="action-buttons">
									<button className="btn btn-primary btn-lg" onClick={handleJoin}>
										Join Tour Session
									</button>
									<button className="btn btn-ghost" onClick={handleCancel}>
										Back to Dashboard
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	if (tour && session) {
		return (
			<div className="tour-container">
			{isOwner ? (
				<OwnerTourViewer tour={tour} session={session} wsUrl={wsUrl} />
			) : (
			<ClientTourViewer tour={tour} session={session} wsUrl={wsUrl} />
			)}
			</div>
		);
	}
};

const getClientId = (userId?: string): string => {
	if (userId) return userId;
	let clientId = localStorage.getItem("clientId");
	if (!clientId) {
		clientId = uuidv4()
		localStorage.setItem("clientId", clientId);
	}
	return clientId;
};
