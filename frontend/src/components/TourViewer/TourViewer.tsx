import React, { useEffect, useRef, useState } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import type { TourData } from '../../types';
import { useWebSocket } from '../../hooks/useWebSocket';

interface TourViewerProps {
	mode: 'author' | 'client';
	tourData: TourData;
	sessionId: string;
	onReady?: () => void;
}

export const TourViewer: React.FC<TourViewerProps> = ({
	mode,
	tourData,
	sessionId,
	onReady,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<Viewer | null>(null);
	const virtualTourRef = useRef<VirtualTourPlugin | null>(null);
	const [isReady, setIsReady] = useState(false);
	const messageQueue = useRef<any[]>([]);

	// Generate a unique client ID for this viewer instance
	const clientId = mode === 'author' 
		? 'author' 
		: `client_${Math.random().toString(36).substring(2, 10)}`;

		const wsUrl = mode === 'author'
			? `${import.meta.env.VITE_WS_BASE_URL}/create-session?session_id=${sessionId}&client_id=${clientId}`
			: `${import.meta.env.VITE_WS_BASE_URL}/connect?session_id=${sessionId}&client_id=${clientId}`;

			const { sendMessage, lastMessage, readyState } = useWebSocket(wsUrl);

			// Initialize viewer
			useEffect(() => {
				if (!containerRef.current || viewerRef.current) return;

				const viewer = new Viewer({
					container: containerRef.current,
					panorama: tourData.nodes[0]?.panorama || '',
					caption: tourData.nodes[0]?.name,
					touchmoveTwoFingers: true,
					mousewheelCtrlKey: true,
					navbar: mode === 'author' ? ['caption', 'zoom', 'fullscreen'] : false,
					plugins: [
						[VirtualTourPlugin, {
							nodes: tourData.nodes,
							renderLinks: mode === 'author',
							linkInFront: true,
						}]
					]
				});

				viewerRef.current = viewer;
				const virtualTour = viewer.getPlugin(VirtualTourPlugin);
				virtualTourRef.current = virtualTour;

				if (tourData.nodes.length > 0) {
					virtualTour.setCurrentNode(tourData.nodes[0].id);
				}

				viewer.addEventListener('ready', () => {
					setIsReady(true);
					onReady?.();
				});

				// Author sends updates
				if (mode === 'author') {
					virtualTour.addEventListener('node-changed', ({ node }) => {
						sendMessage({ type: 'room', data: { nodeId: node.id } });
					});
					viewer.addEventListener('position-updated', ({ position }) => {
						sendMessage({ type: 'position', data: { yaw: position.yaw, pitch: position.pitch } });
					});
					viewer.addEventListener('zoom-updated', ({ zoomLevel }) => {
						sendMessage({ type: 'zoom', data: { zoomLevel } });
					});
				}

				return () => viewer.destroy();
			}, [tourData]);

			// Process incoming messages for client
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

			// Queue messages until viewer is ready
			useEffect(() => {
				if (mode !== 'client' || !lastMessage) return;
				const msg = JSON.parse(lastMessage);
				if (!isReady) {
					messageQueue.current.push(msg);
				} else {
					processMessage(msg);
				}
			}, [lastMessage, isReady, mode]);

			// Process queued messages when ready
			useEffect(() => {
				if (isReady && messageQueue.current.length > 0) {
					messageQueue.current.forEach(processMessage);
					messageQueue.current = [];
				}
			}, [isReady]);

			return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />;
};
