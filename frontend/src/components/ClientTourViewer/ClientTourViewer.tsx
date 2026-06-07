import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import Drawer from "react-modern-drawer";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useVoiceChat } from "../../hooks/useVoiceChat";
import type { Tour } from "../../types/tour";
import type { Session } from "../../types/session";
import Swal from "sweetalert2";
import { SessionClientsPanel } from "../SessionClientsPanel/SessionClientsPanel";
import "../OwnerTourViewer/OwnerTourViewer.css";

interface ClientTourViewerProps {
	tour: Tour;
	session: Session;
	wsUrl: string;
	selfClientId: string;
}

export const ClientTourViewer: React.FC<ClientTourViewerProps> = ({
	tour,
	session,
	wsUrl,
	selfClientId,
}) => {
	const viewerRef = useRef<any>(null);
	const virtualTourRef = useRef<any>(null);
	const tourReadyRef = useRef(false);
	const currentViewStateRef = useRef({ node: tour.data.nodes[0].id, yaw: 0, pitch: 0, zoomLevel: 0 });
	const [openPanel, setOpenPanel] = React.useState(false);

	const navigate = useNavigate();
	const voiceHandlerRef = useRef<(raw: string) => void>(() => {});
	const tourMsgRef = useRef<(raw: string) => void>(() => {});

	const { sendMessage, connectionStatus } = useWebSocket(wsUrl, {
		onMessage: (data) => {
			voiceHandlerRef.current(data);
			tourMsgRef.current(data);
		},
	});

	const voice = useVoiceChat({
		selfId: selfClientId,
		sendMessage,
		connectionStatus,
	});

	voiceHandlerRef.current = (raw) => {
		void voice.handleSocketMessage(raw);
	};

	const handleSessionEnd = async () => {
		const result = await Swal.fire({
			title: "Session ended",
			text: "Session was ended by the owner",
			icon: "info",
			confirmButtonText: "Ok",
			customClass: { confirmButton: "btn btn-primary" },
		});
		if (result.isConfirmed) navigate("/login");
	};

	const handleKicked = async () => {
		const result = await Swal.fire({
			title: "Removed from session",
			text: "The host removed you from this live tour.",
			icon: "warning",
			confirmButtonText: "Ok",
			customClass: { confirmButton: "btn btn-primary" },
		});
		if (result.isConfirmed) navigate("/login");
	};

	const handleBlacklisted = async () => {
		const result = await Swal.fire({
			title: "Access denied",
			text: "You have been blacklisted from this session and cannot rejoin.",
			icon: "error",
			confirmButtonText: "Ok",
			customClass: { confirmButton: "btn btn-primary" },
		});
		if (result.isConfirmed) navigate("/login");
	};

	const handleSessionError = async (errorMessage: string) => {
		if (errorMessage === "blacklisted") {
			await handleBlacklisted();
			return;
		}
		const result = await Swal.fire({
			title: "Session error",
			text: `${errorMessage}`,
			icon: "error",
			confirmButtonText: "Ok",
			customClass: { confirmButton: "btn btn-primary" },
		});
		if (result.isConfirmed) navigate("/login");
	};

	const processStateMessage = (msg: { data?: { nodeId?: string; yaw?: number; pitch?: number; zoomLevel?: number } }) => {
		if (!viewerRef.current || !virtualTourRef.current) return;
		const data = msg.data;
		if (!data) return;

		if (data.nodeId && data.nodeId !== currentViewStateRef.current.node) {
			currentViewStateRef.current.node = data.nodeId;
			void virtualTourRef.current.setCurrentNode(data.nodeId).catch((e: unknown) => {
				console.error("Failed to switch node", e);
			});
		}
		if (
			data.yaw != null &&
			data.pitch != null &&
			(data.yaw !== currentViewStateRef.current.yaw || data.pitch !== currentViewStateRef.current.pitch)
		) {
			currentViewStateRef.current.yaw = data.yaw;
			currentViewStateRef.current.pitch = data.pitch;
			viewerRef.current.rotate({ yaw: data.yaw, pitch: data.pitch });
		}
		if (data.zoomLevel != null && data.zoomLevel !== currentViewStateRef.current.zoomLevel) {
			currentViewStateRef.current.zoomLevel = data.zoomLevel;
			viewerRef.current.zoom(data.zoomLevel);
		}
	};

	tourMsgRef.current = (raw: string) => {
		try {
			const msg = JSON.parse(raw) as { type?: string; error?: string; data?: { nodeId?: string; yaw?: number; pitch?: number; zoomLevel?: number } };
			const t = msg.type;
			if (t === "kicked") {
				void handleKicked();
				return;
			}
			if (t === "session_ended") {
				void handleSessionEnd();
				return;
			}
			if (t === "error") {
				void handleSessionError(msg.error ?? "Unknown error");
				return;
			}
			if (t === "state") {
				if (!tourReadyRef.current) return;
				processStateMessage(msg);
			}
		} catch {}
	};

	const handleReady = (instance: any) => {
		viewerRef.current = instance;
		const virtualTour = instance.getPlugin(VirtualTourPlugin);
		virtualTourRef.current = virtualTour;

		tour.data.nodes = tour.data.nodes.map(({ links, ...node }) => node);
		if (tour.data.nodes.length > 0) virtualTour.setNodes(tour.data.nodes, tour.data.nodes[0].id);
		tourReadyRef.current = true;
		currentViewStateRef.current.node = tour.data.nodes[0].id;
	};

	const isHost = session.owner_id === selfClientId;

	return (
		<div className="tour-viewer owner-viewer">
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

				<div className="viewer-overlay">
					<div className="session-info">
						<div className="connection-status">
							<div className={`status-dot ${connectionStatus}`}></div>
							<span className="status-text">{connectionStatus}</span>
						</div>
					</div>
				</div>
			</div>

			{!openPanel && (
				<button className="panel-toggle" onClick={() => setOpenPanel(true)} title="Open Control Panel" type="button">
					☰
				</button>
			)}

			<Drawer
				open={openPanel}
				onClose={() => setOpenPanel(false)}
				direction="right"
				overlayOpacity={0.5}
				overlayColor="rgba(0,0,0,0.5)"
				size={360}
				className="control-panel"
				lockBackgroundScroll
			>
				<div className="panel-header">
					<h3>Session Controls</h3>
					<button className="btn btn-ghost" onClick={() => setOpenPanel(false)} title="Close Panel" type="button">
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
								<span className={`info-value status ${connectionStatus}`}>{connectionStatus.toUpperCase()}</span>
							</div>
						</div>
					</div>

					<SessionClientsPanel
						participants={voice.participants}
						selfId={selfClientId}
						isOwner={isHost}
						localMicMuted={voice.localMicMuted}
						serverMuted={voice.serverMuted}
						onToggleMic={voice.toggleLocalMic}
						onKick={voice.kickParticipant}
						onRemoteMute={voice.setParticipantRemoteMute}
					/>

					<div className="panel-section">
						<h4>Actions</h4>
						<div className="action-buttons">
							<button className="btn btn-danger w-full" type="button" onClick={() => navigate("/login")}>
								Leave
							</button>
						</div>
					</div>
				</div>
			</Drawer>
		</div>
	);
};
