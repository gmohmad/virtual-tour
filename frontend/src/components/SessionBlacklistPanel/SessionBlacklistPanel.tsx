import React, { useCallback, useEffect, useState } from "react";
import { getSessionBlacklist, removeFromBlacklist } from "../../services/livetourApi";
import type { BlacklistEntry } from "../../types/sessionHistory";
import "./SessionBlacklistPanel.css";

type SessionBlacklistPanelProps = {
	sessionId: string;
	refreshToken?: number;
};

export const SessionBlacklistPanel: React.FC<SessionBlacklistPanelProps> = ({ sessionId, refreshToken = 0 }) => {
	const [entries, setEntries] = useState<BlacklistEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [removing, setRemoving] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			const resp = await getSessionBlacklist(sessionId);
			setEntries(resp.data);
		} catch {
			setEntries([]);
		} finally {
			setLoading(false);
		}
	}, [sessionId]);

	useEffect(() => {
		void refresh();
	}, [refresh, refreshToken]);

	const handleRemove = async (clientId: string) => {
		setRemoving(clientId);
		try {
			await removeFromBlacklist(sessionId, clientId);
			setEntries((prev) => prev.filter((e) => e.id !== clientId));
		} catch (err) {
			console.error("Failed to remove from blacklist", err);
		} finally {
			setRemoving(null);
		}
	};

	return (
		<div className="panel-section session-blacklist-section">
			<h4>Session blocklist</h4>
			{loading ? (
				<p className="blacklist-hint">Loading…</p>
			) : entries.length === 0 ? (
				<p className="blacklist-hint">No blocked users for this session.</p>
			) : (
				<ul className="blacklist-list" aria-label="Blocked users">
					{entries.map((entry) => (
						<li key={entry.id} className="blacklist-row">
							<div className="blacklist-main">
								<span className="blacklist-name">{entry.display_name || "Unknown"}</span>
								<span className="blacklist-id mono">{entry.id.slice(0, 8)}…</span>
							</div>
							<button
								type="button"
								className="btn btn-sm btn-ghost"
								onClick={() => handleRemove(entry.id)}
								disabled={removing === entry.id}
								title="Remove from blocklist"
							>
								{removing === entry.id ? "…" : "Unblock"}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};
