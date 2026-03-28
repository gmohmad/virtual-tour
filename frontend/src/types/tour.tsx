export interface Tour {
	id: string;
	company_id: string;
	name: string;
	data: TourData;
	created_by: string;
	updated_by: string;
	created_at: string;
	updated_at: string;
}

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
