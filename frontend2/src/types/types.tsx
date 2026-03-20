export interface TourData {
	nodes: TourNode[];
};

export interface TourNode {
	id: string;
	name: string;
	panorama: string;
	links?: TourLink[];
};

export interface TourLink {
	nodeId: string;
	position: {
		yaw: number;
		pitch: number;
	};
};
