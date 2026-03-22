import React, { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useNavigate } from "react-router-dom";
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import type { Tour } from "../types/tour";
import type { Session } from "../types/session";

interface ClientTourViewerProps {
	tour: Tour;
	session: Session;
	wsUrl: string;
}

export const ClientTourViewer: React.FC<ClientTourViewerProps> = ({
	tour,
	wsUrl,
}) => {
	const viewerRef = useRef<any>(null);
	const virtualTourRef = useRef<any>(null);
	const [isReady, setIsReady] = useState(false);

	const navigate = useNavigate();
	const { lastMessage } = useWebSocket(wsUrl);

	const processMessage = (msg: any) => {
		if (!viewerRef.current || !virtualTourRef.current) return;
		const { type, data } = msg;
		switch (type) {
			case 'state':
				if (data?.nodeId) virtualTourRef.current.setCurrentNode(data.nodeId);
				if (data?.yaw && data?.pitch) viewerRef.current.rotate({ yaw: data.yaw, pitch: data.pitch });
				if (data?.zoomLevel) viewerRef.current.zoom(data.zoomLevel);
				break;
			case 'session_ended':
				console.log('Session ended by owner');
				navigate("/companies/my")
				break;
				// onSessionEnded?.();
			case 'error':
				console.error('Server error:', msg.error);
				navigate("/companies/my")
				break;
				// onError?.(msg.error);
		}
	};

	const handleReady = (instance: any) => {
		console.log('Viewer ready');
		viewerRef.current = instance;
		const virtualTour = instance.getPlugin(VirtualTourPlugin);
		virtualTourRef.current = virtualTour;

		tour.data.nodes = tour.data.nodes.map(({ links, ...node }) => node)
		if (tour.data.nodes.length > 0) virtualTour.setNodes(tour.data.nodes, tour.data.nodes[0].id);
		setIsReady(true);
	};

	useEffect(() => {
		if (!isReady || !lastMessage) return;
		try {
			const msg = JSON.parse(lastMessage);
			processMessage(msg);
		} catch (e) {
			console.error('Failed to parse message', e);
		}
	}, [lastMessage, isReady]);

	return (
		<div>
			<ReactPhotoSphereViewer
			src={tour.data.nodes[0]?.panorama}
			plugins={[[VirtualTourPlugin, {}]]}
			height="100vh"
			width="100vw"
			onReady={handleReady}
			navbar={false}
			mousewheel={false}
			mousemove={false}
			touchmoveTwoFingers={false}
			keyboard={false}
			/>
		</div>
	)
}
