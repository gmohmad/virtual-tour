import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Drawer from 'react-modern-drawer';
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { useWebSocket } from "../../hooks/useWebSocket";
import type { Tour } from "../../types/tour";
import type { Session } from "../../types/session";
import Swal from "sweetalert2";

interface ClientTourViewerProps {
	tour: Tour;
	session: Session;
	wsUrl: string;
}

export const ClientTourViewer: React.FC<ClientTourViewerProps> = ({
	tour,
	session,
	wsUrl,
}) => {
	const viewerRef = useRef<any>(null);
	const virtualTourRef = useRef<any>(null);
	const [isReady, setIsReady] = useState(false);
	const [openPanel, setOpenPanel] = useState(false);

	const navigate = useNavigate();
	const { lastMessage, connectionStatus } = useWebSocket(wsUrl);

	const processMessage = (msg: any) => {
		if (!viewerRef.current || !virtualTourRef.current) return;
		const { type, error, data } = msg;
		switch (type) {
			case "state":
				if (data?.nodeId) virtualTourRef.current.setCurrentNode(data.nodeId);
				if (data?.yaw && data?.pitch) viewerRef.current.rotate({ yaw: data.yaw, pitch: data.pitch });
				if (data?.zoomLevel) viewerRef.current.zoom(data.zoomLevel);
				break;
			case "session_ended":
				handleSessionEnd();
				break;
			case "error":
				handleSessionError(error);
				break;
		}
	};

	const handleSessionEnd = async () => {
		const result = await Swal.fire({
			title: 'Session ended',
			text: `Session was ended by the owner`,
			icon: 'info',
			confirmButtonText: 'Ok',
			customClass: {
				confirmButton: 'btn btn-primary',
			}
		});
		if (result.isConfirmed) navigate("/login")
	}

	const handleSessionError = async (errorMessage: string) => {
		const result = await Swal.fire({
			title: 'Session error',
			text: `${errorMessage}`,
			icon: 'error',
			confirmButtonText: 'Ok',
			customClass: {
				confirmButton: 'btn btn-primary',
			}
		});
		if (result.isConfirmed) navigate("/login")
	}

	const handleReady = (instance: any) => {
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
			console.error("Failed to parse message", e);
		}
	}, [lastMessage, isReady]);

	return (
		<div className="tour-viewer owner-viewer">
			{/* Immersive Viewer */}
			<div className="viewer-container">
				<ReactPhotoSphereViewer
					src={tour.data.nodes[0]?.panorama}
					plugins={[[VirtualTourPlugin, {}]]}
					height="100vh"
					width="100vw"
					onReady={handleReady}
					mousewheel={false}
					navbar={false}
					mousemove={false}
					touchmoveTwoFingers={false}
					keyboard={false}
					/>

				{/* Control Overlay */}
				<div className="viewer-overlay">
					<div className="session-info">
						<div className="connection-status">
							<div className={`status-dot ${connectionStatus}`}></div>
							<span className="status-text">{connectionStatus}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Floating Panel Toggle */}
			{!openPanel && (
				<button
					className="panel-toggle"
					onClick={() => setOpenPanel(true)}
					title="Open Control Panel"
				>
					☰
				</button>
			)}

			{/* Control Panel */}
			<Drawer
				open={openPanel}
				onClose={() => setOpenPanel(false)}
				direction="right"
				overlayOpacity={0.5}
				overlayColor="rgba(0,0,0,0.5)"
				size={320}
				className="control-panel"
				lockBackgroundScroll
			>
				<div className="panel-header">
					<h3>Session Controls</h3>
					<button
						className="btn btn-ghost"
						onClick={() => setOpenPanel(false)}
						title="Close Panel"
					>
						✕
					</button>
				</div>

				<div className="panel-content">
					<div className="panel-section">
						<h4>Session Info</h4>
						<div className="info-grid">
							<div className="info-item">
								<span className="info-label">Tour:</span>
								<span className="info-value">{tour.name}</span>
							</div>
							<div className="info-item">
								<span className="info-label">Session ID:</span>
								<span className="info-value session-id">{session.id}</span>
							</div>
							<div className="info-item">
								<span className="info-label">Status:</span>
								<span className={`info-value status ${connectionStatus}`}>
									{connectionStatus.toUpperCase()}
								</span>
							</div>
						</div>
					</div>

					<div className="panel-section">
						<h4>Actions</h4>
						<div className="action-buttons">
							<button
								className="btn btn-danger w-full"
								onClick={() => {navigate("/login")}}
							>
								Leave
							</button>
						</div>
					</div>
				</div>
			</Drawer>
		</div>
	)
}
