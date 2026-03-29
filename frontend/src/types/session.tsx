export interface Session {
	id: string,
	owner_id: string
	clients: Client[];
}

export interface Client {
	id: string;
	display_name?: string;
	mic_muted?: boolean;
	server_muted?: boolean;
	is_owner?: boolean;
}
