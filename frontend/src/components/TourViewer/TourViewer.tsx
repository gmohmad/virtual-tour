import React, { useEffect, useRef, useState } from 'react';
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';
import type { TourData } from '../../types';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getClientId } from '../../utils/clientId';
import { useAuth } from '../../contexts/AuthContext';

interface TourViewerProps {
	mode: 'author' | 'client';
	tourData: TourData;
	sessionId: string;
	onReady?: () => void;
	onWebSocketCreated?: (ws: WebSocket | null) => void;
	onSessionEnded?: () => void;
}

export const TourViewer: React.FC<TourViewerProps> = ({
	mode,
	tourData,
	sessionId,
	onReady,
	onWebSocketCreated,
	onSessionEnded,
}) => {
	const viewerRef = useRef<any>(null);
	const virtualTourRef = useRef<any>(null);
	const [isReady, setIsReady] = useState(false);
	const messageQueue = useRef<any[]>([]);
	const { user } = useAuth();

	const [clientId] = useState(() => getClientId(mode, user?.id));
	const wsPath = mode === 'author' ? '/create-session' : '/connect';
	const wsQuery = { session_id: sessionId, client_id: clientId };

	const { sendMessage, lastMessage, ws } = useWebSocket(wsPath, wsQuery);

	// For author: throttled state sender
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
				console.log('Session ended by author');
			onSessionEnded?.();
			break;
			default:
				console.warn('Unknown message type', type);
		}
	};

	// Queue messages until ready (client mode)
	useEffect(() => {
		if (mode !== 'client' || !lastMessage) return;
		try {
			const msg = JSON.parse(lastMessage);
			if (!isReady) {
				messageQueue.current.push(msg);
			} else {
				processMessage(msg);
			}
		} catch (e) {
			console.error('Failed to parse message', e);
		}
	}, [lastMessage, isReady, mode]);

	// Process queued messages when ready
	useEffect(() => {
		if (isReady && messageQueue.current.length > 0) {
			messageQueue.current.forEach(processMessage);
			messageQueue.current = [];
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

			// Attach event listeners only for author mode
			if (mode === 'author') {
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
		navbar={mode === 'author' ? ['caption', 'zoom', 'fullscreen'] : false}
		mousewheel={mode === 'author'}
		mousemove={mode === 'author'}
		touchmoveTwoFingers={mode === 'author'}
		keyboard={mode === 'author'}
		/>
	);
};
