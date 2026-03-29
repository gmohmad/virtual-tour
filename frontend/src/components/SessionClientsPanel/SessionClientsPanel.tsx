import React from "react";
import type { LiveTourParticipant } from "../../types/livetour";
import "./SessionClientsPanel.css";

type SessionClientsPanelProps = {
	participants: LiveTourParticipant[];
	selfId: string;
	isOwner: boolean;
	localMicMuted: boolean;
	serverMuted: boolean;
	onToggleMic: () => void;
	onKick: (clientId: string) => void;
	onRemoteMute: (clientId: string, muted: boolean) => void;
};

function micLabel(p: LiveTourParticipant): "off" | "on" | "forced" {
	if (p.serverMuted) return "forced";
	if (p.micMuted) return "off";
	return "on";
}

export const SessionClientsPanel: React.FC<SessionClientsPanelProps> = ({
	participants,
	selfId,
	isOwner,
	localMicMuted,
	serverMuted,
	onToggleMic,
	onKick,
	onRemoteMute,
}) => {
	const sorted = [...participants].sort((a, b) => {
		if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
		return a.displayName.localeCompare(b.displayName);
	});

	return (
		<div className="panel-section session-clients-section">
			<h4>Voice & clients</h4>
			<div className="voice-self-row">
				<button
					type="button"
					className={`btn mic-toggle ${localMicMuted || serverMuted ? "mic-off" : "mic-on"}`}
					onClick={onToggleMic}
					disabled={serverMuted}
					title={serverMuted ? "Host muted your microphone" : localMicMuted ? "Unmute microphone" : "Mute microphone"}
				>
					{serverMuted ? "Mic blocked by host" : localMicMuted ? "Mic off" : "Mic on"}
				</button>
				<p className="voice-hint">WebRTC voice; allow the browser to use your microphone when prompted.</p>
			</div>

			<ul className="clients-list" aria-label="Session participants">
				{sorted.map((p) => {
					const isSelf = p.id === selfId;
					const label = micLabel(p);
					const canModerate = isOwner && !isSelf && !p.isOwner;

					return (
						<li key={p.id} className={`client-row ${label}`}>
							<div className="client-main">
								<span
									className={`mic-dot mic-${label}`}
									title={label === "forced" ? "Muted by host" : label === "off" ? "Mic off" : "Mic on"}
								/>
								<div className="client-text">
									<span className="client-name">
										{p.displayName}
										{p.isOwner ? <span className="badge-host">Host</span> : null}
										{isSelf ? <span className="badge-you">You</span> : null}
									</span>
									<span className="client-id mono">{p.id.slice(0, 8)}…</span>
								</div>
							</div>
							{canModerate ? (
								<div className="client-actions">
									<button
										type="button"
										className="btn btn-sm btn-ghost"
										onClick={() => onRemoteMute(p.id, !p.serverMuted)}
										title={p.serverMuted ? "Allow microphone" : "Mute microphone"}
									>
										{p.serverMuted ? "Unmute" : "Mute"}
									</button>
									<button type="button" className="btn btn-sm btn-danger" onClick={() => onKick(p.id)} title="Remove from session">
										Kick
									</button>
								</div>
							) : null}
						</li>
					);
				})}
			</ul>
		</div>
	);
};
