export type SessionHistory = {
	id: string;
	session_id: string;
	tour_id: string;
	tour_name: string;
	owner_id: string;
	owner_name: string;
	started_at: string;
	ended_at: string;
	duration_seconds: number;
	total_clients_joined: number;
	peak_clients: number;
	blacklisted_count: number;
	end_reason: string;
};

export type BlacklistEntry = {
	id: string;
	display_name: string;
};
