export interface LiveTourParticipant {
	id: string;
	displayName: string;
	micMuted: boolean;
	serverMuted: boolean;
	isOwner: boolean;
}

export type LiveTourParticipantWire = {
	id: string;
	display_name?: string;
	mic_muted?: boolean;
	server_muted?: boolean;
	is_owner?: boolean;
};

export function mapLiveTourParticipant(raw: LiveTourParticipantWire): LiveTourParticipant {
	return {
		id: raw.id,
		displayName: raw.display_name ?? "Guest",
		micMuted: !!raw.mic_muted,
		serverMuted: !!raw.server_muted,
		isOwner: !!raw.is_owner,
	};
}
