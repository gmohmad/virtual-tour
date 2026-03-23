import React, { useEffect, useMemo, useState } from "react";
import { getTourByID } from "../services/appApi";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getSession, endSession } from "../services/livetourApi";
import type { Tour } from "../types/tour";
import type { Session } from "../types/session";
import { OwnerTourViewer } from "../components/OwnerTourViewer";
import { ClientTourViewer } from "../components/ClientTourViewer";

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
		});
	}, [sessionId, tourId]);

	const isOwner = session?.owner_id === user?.id;

	const handleJoin = () => {
		setJoined(true);
	};

	const handleCancel = async () => {
		if (isOwner && sessionId) {
			await endSession(sessionId);
			navigate("/companies/my");
		} else if (!isOwner) {
			navigate("/login");
		}
	};

	if (!tour || !session) return <div>Loading...</div>;

	if (!joined) {
		return (
			<div>
			<h2>Session Preview</h2>
			<p>
			Tour: <strong>{tour.name}</strong>
			</p>
			<p>
			Session ID: <code>{sessionId}</code>
			</p>
			<div>
			<button onClick={handleJoin}>Join Session</button>
			<button onClick={handleCancel} className="danger">Cancel</button>
			</div>
			</div>
		);
	}

	return (
		<div>
		{isOwner ? (
			<OwnerTourViewer tour={tour} session={session} wsUrl={wsUrl} />
		) : (
		<ClientTourViewer tour={tour} session={session} wsUrl={wsUrl} />
		)}
		</div>
	);
};

const getClientId = (userId?: string): string => {
	if (userId) return userId;
	let clientId = localStorage.getItem("clientId");
	if (!clientId) {
		clientId = crypto.randomUUID();
		localStorage.setItem("clientId", clientId);
	}
	return clientId;
};
