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
}

export const TourViewer: React.FC<TourViewerProps> = ({
	mode,
	tourData,
	sessionId,
	onReady,
	onWebSocketCreated,
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

	// Expose WebSocket to parent
	useEffect(() => {
		onWebSocketCreated?.(ws);
		return () => onWebSocketCreated?.(null);
	}, [ws, onWebSocketCreated]);

	// Handle viewer ready
	const handleReady = (instance: any) => {
		console.log('Viewer ready');
		viewerRef.current = instance;
		const virtualTour = instance.getPlugin(VirtualTourPlugin);
		virtualTourRef.current = virtualTour;


		const nodesForPlugin = mode === 'client'
			? tourData.nodes.map(({ links, ...node }) => node) // remove links
			: tourData.nodes;

		if (tourData.nodes.length > 0) {
			virtualTour.setNodes(nodesForPlugin, tourData.nodes[0].id);
		}

		// Attach event listeners only for author mode
		if (mode === 'author') {
			virtualTour.addEventListener('node-changed', ({ node }: any) => {
				sendMessage({ type: 'room', data: { nodeId: node.id } });
			});
			instance.addEventListener('position-updated', ({ position }: any) => {
				sendMessage({ type: 'position', data: { yaw: position.yaw, pitch: position.pitch } });
			});
			instance.addEventListener('zoom-updated', ({ zoomLevel }: any) => {
				sendMessage({ type: 'zoom', data: { zoomLevel } });
			});
		}

		setIsReady(true);
		onReady?.();
	};

	// Process incoming messages (room/position/zoom)
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
			default:
				console.warn('Unknown message type', type);
		}
	};

	// Queue messages until ready (client mode)
	useEffect(() => {
		if (mode !== 'client' || !lastMessage) return;
		const msg = JSON.parse(lastMessage);
		if (!isReady) {
			messageQueue.current.push(msg);
		} else {
			processMessage(msg);
		}
	}, [lastMessage, isReady, mode]);

	useEffect(() => {
		if (isReady && messageQueue.current.length > 0) {
			messageQueue.current.forEach(processMessage);
			messageQueue.current = [];
		}
	}, [isReady]);

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
