import React, { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { endSession } from "../services/livetourApi";
import { useNavigate } from "react-router-dom";
import Drawer from 'react-modern-drawer';
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";
import type { Session } from "../types/session";
import type { Tour } from "../types/tour";

interface OwnerTourViewerProps {
	tour: Tour;
	session: Session;
	wsUrl: string;
}

export const OwnerTourViewer: React.FC<OwnerTourViewerProps> = ({
	tour,
	session,
	wsUrl,
}) => {
	const viewerRef = useRef<any>(null);
	const virtualTourRef = useRef<any>(null);
	const intervalRef = useRef<number>(0);
	const latestState = useRef({ nodeId: "", yaw: 0, pitch: 0, zoom: 0 });

	const navigate = useNavigate();
	const [openPanel, setOpenPanel] = useState(false);
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

	const handleEndSession = () => {
		endSession(session.id).catch(console.error);
		navigate("/companies/my")
	}

	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	return (
		<div>

		<div>
			<ReactPhotoSphereViewer
			src={tour.data.nodes[0]?.panorama}
			plugins={[[VirtualTourPlugin, {}]]}
			height="100vh"
			width="100vw"
			onReady={handleReady}
			/>
			<button onClick={handleEndSession}>End Session</button>
		</div>

		{!openPanel && (
			<button
			onClick={() => setOpenPanel(true)}
			style={{position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}
			>
			Open Panel
			</button>
		)}
		<Drawer
		open={openPanel}
		onClose={() => setOpenPanel(false)}
		direction="right"
		overlayOpacity={0.5}
		overlayColor="rgba(0,0,0,0.5)"
		size={200}
		className="panel"
		lockBackgroundScroll
		>
		<button onClick={() => setOpenPanel(false)}>Close</button>
		<button onClick={handleEndSession}>End Session</button>
		<button onClick={() => navigator.clipboard.writeText(window.location.href)}>Copy Share Link</button>
		</Drawer>

		</div>
	)
}
