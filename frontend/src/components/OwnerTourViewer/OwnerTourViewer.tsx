import React, { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useVoiceChat } from "../../hooks/useVoiceChat";
import { endSession } from "../../services/livetourApi";
import { useNavigate } from "react-router-dom";
import Drawer from "react-modern-drawer";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";
import type { Session } from "../../types/session";
import type { Tour } from "../../types/tour";
import { SessionClientsPanel } from "../SessionClientsPanel/SessionClientsPanel";
import { SessionBlacklistPanel } from "../SessionBlacklistPanel/SessionBlacklistPanel";
import Swal from "sweetalert2";
import "./OwnerTourViewer.css";

interface OwnerTourViewerProps {
	tour: Tour;
	session: Session;
	wsUrl: string;
	selfClientId: string;
}

export const OwnerTourViewer: React.FC<OwnerTourViewerProps> = ({
	tour,
	session,
	wsUrl,
	selfClientId,
}) => {
	const viewerRef = useRef<any>(null);
	const virtualTourRef = useRef<any>(null);
	const intervalRef = useRef<number>(3);
	const latestState = useRef({ nodeId: "", yaw: 0, pitch: 0, zoom: 0 });
	const lastSentState = useRef({ nodeId: "", yaw: 0, pitch: 0, zoom: 0 });

	const navigate = useNavigate();
	const voiceHandlerRef = useRef<(raw: string) => void>(() => {});

	const { sendMessage, connectionStatus } = useWebSocket(wsUrl, {
		onMessage: (data) => voiceHandlerRef.current(data),
	});

	const voice = useVoiceChat({
		selfId: selfClientId,
		sendMessage,
		connectionStatus,
	});

	voiceHandlerRef.current = (raw) => {
		void voice.handleSocketMessage(raw);
	};

	const [openPanel, setOpenPanel] = useState(false);
	const [isStreaming, setIsStreaming] = useState(true);
	const [blacklistRefresh, setBlacklistRefresh] = useState(0);
	const isStreamingRef = useRef(isStreaming);

	useEffect(() => {
		isStreamingRef.current = isStreaming;
	}, [isStreaming]);

	const startMessageSend = (interval: number) => {
		intervalRef.current = window.setInterval(() => {
			const { nodeId, yaw, pitch, zoom } = latestState.current;
			const isSameAsLast =
				lastSentState.current.nodeId === nodeId &&
				lastSentState.current.yaw === yaw &&
				lastSentState.current.pitch === pitch &&
				lastSentState.current.zoom === zoom;

			if (nodeId && isStreamingRef.current && !isSameAsLast) {
				sendMessage({ type: "state", data: { nodeId, yaw, pitch, zoomLevel: zoom } });
				lastSentState.current = { nodeId, yaw, pitch, zoom };
			}
		}, interval);
	};

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
	};

	const handleReady = (instance: any) => {
		viewerRef.current = instance;
		const virtualTour = instance.getPlugin(VirtualTourPlugin);
		virtualTourRef.current = virtualTour;

		if (tour.data.nodes.length > 0) virtualTour.setNodes(tour.data.nodes, tour.data.nodes[0].id);
		latestState.current.nodeId = tour.data.nodes[0]?.id ?? "";
		setUpListeners();
		startMessageSend(10);
	};

	const handleEndSession = () => {
		endSession(session.id).catch(console.error);
		navigate("/companies/my");
	};

	const handleIsStreaming = () => {
		setIsStreaming(!isStreamingRef.current);
	};

	const handleKick = async (targetId: string) => {
		const participant = voice.participants.find((p) => p.id === targetId);
		const name = participant?.displayName ?? "this user";
		const result = await Swal.fire({
			title: "Remove participant?",
			html: `Remove <strong>${name}</strong> from this session?`,
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Kick",
			cancelButtonText: "Cancel",
			input: "checkbox",
			inputValue: 0,
			inputPlaceholder: "Add to session blacklist",
			customClass: {
				confirmButton: "btn btn-danger",
				cancelButton: "btn btn-ghost",
			},
		});
		if (result.isConfirmed) {
			const addToBlacklist = result.value === 1;
			voice.kickParticipant(targetId, addToBlacklist);
			if (addToBlacklist) {
				setBlacklistRefresh((k) => k + 1);
			}
		}
	};

	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	const isHost = session.owner_id === selfClientId;

	return (
		<div className="tour-viewer">
			<div className="viewer-container">
				<ReactPhotoSphereViewer
					src={tour.data.nodes[0]?.panorama}
					plugins={[[VirtualTourPlugin, {}]]}
					height="100vh"
					width="100vw"
					onReady={handleReady}
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
						onKick={handleKick}
						onRemoteMute={voice.setParticipantRemoteMute}
					/>

					<SessionBlacklistPanel sessionId={session.id} refreshToken={blacklistRefresh} />

					<div className="panel-section">
						<h4>Controls</h4>
						<div className="control-group">
							<label className="switch-label">
								<input type="checkbox" checked={isStreaming} onChange={handleIsStreaming} />
								<span className="switch-text">Live Streaming</span>
							</label>
							<p className="control-hint">
								{isStreaming
									? "Viewers see your movements in real-time"
									: "Viewers see static view until resumed"}
							</p>
						</div>
					</div>

					<div className="panel-section">
						<h4>Actions</h4>
						<div className="action-buttons">
							<button
								className="btn btn-primary w-full"
								type="button"
								onClick={() => navigator.clipboard.writeText(window.location.href)}
							>
								Copy Share Link
							</button>
							<button className="btn btn-danger w-full" type="button" onClick={handleEndSession}>
								End Session
							</button>
						</div>
					</div>
				</div>
			</Drawer>
		</div>
	);
};
