export interface User {
	id: string;
	email: string;
}

export interface TourViewerProps {
  mode: 'author' | 'client';
  tourData: TourData;
  sessionId: string;
  onReady?: () => void;
  onWebSocketCreated?: (ws: WebSocket | null) => void; // new
}

export interface Tour {
	id: string;
	name: string;
	data: TourData;
	userId: string;
	createdAt: string;
	updatedAt: string;
}

export interface TourData {
	nodes: TourNode[];
}

export interface TourNode {
	id: string;
	name: string;
	panorama: string;
	links?: TourLink[];
}

export interface TourLink {
	nodeId: string;
	position: { yaw: number; pitch: number };
	linkOffset?: { depth: number; pitch: number };
	arrowStyle?: any;
}

export interface Session {
	id: string;
	tourId: string;
	createdAt: string;
}
