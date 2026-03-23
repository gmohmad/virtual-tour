import React, { useEffect, useRef } from "react";
import type { Session } from "../types/session";
import type { Tour } from "../types/tour";
import { useWebSocket } from "../hooks/useWebSocket";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";

interface OwnerTourViewerProps {
	tour: Tour;
	session: Session;
	wsUrl: string;
}

export const OwnerTourViewer: React.FC<OwnerTourViewerProps> = ({
	tour,
	wsUrl,
}) => {
	const viewerRef = useRef<any>(null);
	const virtualTourRef = useRef<any>(null);
	const intervalRef = useRef<number>(0);
	const latestState = useRef({ nodeId: "", yaw: 0, pitch: 0, zoom: 0 });

	const { sendMessage } = useWebSocket(wsUrl);

	const startMessageSend = (interval: number) => {
		intervalRef.current = window.setInterval(() => {
			const { nodeId, yaw, pitch, zoom } = latestState.current;
			if (nodeId) sendMessage({type: "state", data: { nodeId, yaw, pitch, zoomLevel: zoom }});
		}, interval);
	}

	const setUpListeners = () => {
		virtualTourRef.current.addEventListener("node-changed", ({ node }: any) => {
			latestState.current.nodeId = node.id;
		});
		viewerRef.current.addEventListener("position-updated", ({ position }: any) => {
			latestState.current.yaw = position.yaw;
			latestState.current.pitch = position.pitch;
		});
		viewerRef.current.addEventListener("zoom-updated", ({ zoomLevel }: any) => {
			latestState.current.zoom = zoomLevel;
		});
	}

	const handleReady = (instance: any) => {
		console.log("Viewer ready");
		viewerRef.current = instance;
		const virtualTour = instance.getPlugin(VirtualTourPlugin);
		virtualTourRef.current = virtualTour;

		if (tour.data.nodes.length > 0) virtualTour.setNodes(tour.data.nodes, tour.data.nodes[0].id);
		setUpListeners();
		startMessageSend(10);
	};

	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	return (
		<div>
			<ReactPhotoSphereViewer
			src={tour.data.nodes[0]?.panorama}
			plugins={[[VirtualTourPlugin, {}]]}
			height="100vh"
			width="100vw"
			onReady={handleReady}
			/>
		</div>
	)
}
