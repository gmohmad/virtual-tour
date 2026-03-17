import React, { useEffect, useRef, useState } from 'react';
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';
import type { TourData } from '../../types';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getClientId } from '../../utils/clientId';
import { useAuth } from '../../contexts/AuthContext';

interface TourViewerProps {
	mode: 'owner' | 'client';
	tourData: TourData;
	sessionId: string;
	onReady?: () => void;
	onWebSocketCreated?: (ws: WebSocket | null) => void;
	onSessionEnded?: () => void;
	onError?: (error: string) => void;
}

export const TourViewer: React.FC<TourViewerProps> = ({
	mode,
	tourData,
	sessionId,
	onReady,
	onWebSocketCreated,
	onSessionEnded,
	onError,
}) => {
	const viewerRef = useRef<any>(null);
	const virtualTourRef = useRef<any>(null);
	const [isReady, setIsReady] = useState(false);
	const messageQueue = useRef<any[]>([]);
	const { user } = useAuth();

	const [clientId] = useState(() => getClientId(mode, user?.id));
	const wsPath = mode === 'owner' ? '/create-session' : '/connect';
	const wsQuery = { session_id: sessionId, client_id: clientId };

	const { sendMessage, lastMessage, ws } = useWebSocket(wsPath, wsQuery);

	// for owner: throttled state sender
	const latestState = useRef({ nodeId: '', yaw: 0, pitch: 0, zoom: 0 });
	const intervalRef = useRef<number>();

	// Expose WebSocket to parent
	useEffect(() => {
		onWebSocketCreated?.(ws);
		return () => onWebSocketCreated?.(null);
	}, [ws, onWebSocketCreated]);

	// Cleanup interval on unmount
	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	// Process incoming messages (client side)
	const processMessage = (msg: any) => {
		if (!viewerRef.current || !virtualTourRef.current) return;
		const { type, data } = msg;
		switch (type) {
			case 'room':
				if (data?.nodeId) virtualTourRef.current.setCurrentNode(data.nodeId);
			break;
			case 'position':
				if (data?.yaw !== undefined && data?.pitch !== undefined) {
				viewerRef.current.rotate({ yaw: data.yaw, pitch: data.pitch });
			}
			break;
			case 'zoom':
				if (data?.zoomLevel !== undefined) viewerRef.current.zoom(data.zoomLevel);
			break;
			case 'state':
				if (data?.nodeId) virtualTourRef.current.setCurrentNode(data.nodeId);
			if (data?.yaw !== undefined && data?.pitch !== undefined) {
				viewerRef.current.rotate({ yaw: data.yaw, pitch: data.pitch });
			}
			if (data?.zoomLevel !== undefined) viewerRef.current.zoom(data.zoomLevel);
			break;
			case 'session_ended':
				console.log('Session ended by owner');
			onSessionEnded?.();
			break;
			case 'error':
				console.error('Server error:', msg.error);
			onError?.(msg.error);
			break;
			default:
				console.warn('Unknown message type', type);
		}
	};

	// Add a ref to track the last processed raw message
	const lastProcessedRaw = useRef<string | null>(null);

	// Process incoming raw messages from WebSocket
	useEffect(() => {
		if (mode !== 'client' || !lastMessage) return;

		// Skip if this exact raw message was already processed
		if (lastProcessedRaw.current === lastMessage) return;

	if (!isReady) {
		// Not ready – queue the raw message
		messageQueue.current.push(lastMessage);
	} else {
		// Ready – process immediately
		try {
			const msg = JSON.parse(lastMessage);
			processMessage(msg);
			lastProcessedRaw.current = lastMessage; // mark as processed
		} catch (e) {
			console.error('Failed to parse message', e);
		}
	}
	}, [lastMessage, isReady, mode]);

	// Process queued messages when viewer becomes ready
	useEffect(() => {
		if (isReady && messageQueue.current.length > 0) {
			// Process each queued raw message, skipping any already processed
			messageQueue.current.forEach((raw) => {
				if (lastProcessedRaw.current === raw) return; // skip if already processed
					try {
						const msg = JSON.parse(raw);
						processMessage(msg);
						lastProcessedRaw.current = raw; // mark as processed
					} catch (e) {
						console.error('Failed to parse queued message', e);
					}
			});
			messageQueue.current = []; // clear queue
		}
	}, [isReady]);

	// Handle viewer ready
	const handleReady = (instance: any) => {
		console.log('Viewer ready');
		viewerRef.current = instance;
		const virtualTour = instance.getPlugin(VirtualTourPlugin);
		virtualTourRef.current = virtualTour;

		// Prepare nodes: for client, strip links to hide arrows entirely
		const nodesForPlugin = mode === 'client'
			? tourData.nodes.map(({ links, ...node }) => node) // remove links
			: tourData.nodes;

			if (nodesForPlugin.length > 0) {
				virtualTour.setNodes(nodesForPlugin, nodesForPlugin[0].id);
			}

			// Attach event listeners only for owner mode
			if (mode === 'owner') {
				// Update refs on changes (no direct send)
				virtualTour.addEventListener('node-changed', ({ node }: any) => {
					latestState.current.nodeId = node.id;
				});
				instance.addEventListener('position-updated', ({ position }: any) => {
					latestState.current.yaw = position.yaw;
					latestState.current.pitch = position.pitch;
				});
				instance.addEventListener('zoom-updated', ({ zoomLevel }: any) => {
					latestState.current.zoom = zoomLevel;
				});

				// Start throttled sender (10ms)
				intervalRef.current = window.setInterval(() => {
					const { nodeId, yaw, pitch, zoom } = latestState.current;
					// Only send if we have a nodeId (initialized)
					if (nodeId) {
						sendMessage({
							type: 'state',
							data: { nodeId, yaw, pitch, zoomLevel: zoom }
						});
					}
				}, 10);
			}

			setIsReady(true);
			onReady?.();
	};

	return (
		<ReactPhotoSphereViewer
		src={tourData.nodes[0]?.panorama}
		plugins={[[VirtualTourPlugin, {}]]}
		height="100vh"
		width="100vw"
		onReady={handleReady}
		navbar={mode === 'owner' ? ['caption', 'zoom', 'fullscreen'] : false}
		mousewheel={mode === 'owner'}
		mousemove={mode === 'owner'}
		touchmoveTwoFingers={mode === 'owner'}
		keyboard={mode === 'owner'}
		/>
	);
};
