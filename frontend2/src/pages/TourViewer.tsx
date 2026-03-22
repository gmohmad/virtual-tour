import React, { useEffect, useState } from "react";
import { getTourByID } from "../services/appApi";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getSession } from "../services/livetourApi";
import type { Tour } from "../types/tour";
import type { Session } from "../types/session";
import { OwnerTourViewer } from "../components/OwnerTourViewer";
import { ClientTourViewer } from "../components/ClientTourViewer";

export const TourViewer: React.FC = () => {
	const [session, setSession] = useState<Session>();
	const [tour, setTour] = useState<Tour>();
	const { tourId, sessionId } = useParams();
	const { user } = useAuth();

	const [clientId] = useState(() => getClientId(user?.id));
	const params = new URLSearchParams({clientId: clientId}).toString();
	const wsUrl = `${import.meta.env.VITE_LIVETOUR_API_URL.replace("http", "ws")}/connect/${sessionId}?${params}`;

	useEffect(() => {
		if (!sessionId || !tourId) return;
		getSession(sessionId).then(resp => {setSession(resp.data)});
		getTourByID(tourId).then(resp => {
			const tourData = resp.data.data;
			tourData.nodes.forEach(node => {
				node.panorama = `${import.meta.env.VITE_APP_API_URL}/${node.panorama}`;
			});
			setTour(resp.data)
		});
	}, [sessionId, tourId])

	if (!tour || !session) return <div>Loading...</div>;
	return (
		<div>
		{session?.owner_id === user?.id ? 
			<OwnerTourViewer tour={tour} session={session} wsUrl={wsUrl} /> : 
			<ClientTourViewer tour={tour} session={session} wsUrl={wsUrl} />
		}
		</div>
	)
}

const getClientId = (userId?: string): string => {
	if (userId) return userId;
	let clientId = localStorage.getItem('clientId');
	if (!clientId) {
		clientId = crypto.randomUUID();
		localStorage.setItem('deviceId', clientId);
	}
	return clientId;
};
