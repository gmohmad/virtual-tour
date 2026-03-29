export interface Session {
	id: string,
	owner_id: string
	clients: Client[];
}

export interface Client {
	id: string;
}
