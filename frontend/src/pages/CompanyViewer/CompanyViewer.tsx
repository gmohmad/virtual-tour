import React, { useCallback, useEffect, useState } from "react";
import {
	addMembersToCompany,
	changeUserRole,
	deleteTour,
	getCompanyByID,
	getCompanyTours,
	getSessionHistory,
	getUsersOfCompany,
	removeUserFromCompany,
} from "../../services/appApi";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Company } from "../../types/company";
import type { Tour } from "../../types/tour";
import Drawer from 'react-modern-drawer';
import { createSession } from "../../services/livetourApi";
import "./CompanyViewer.css";
import Swal from "sweetalert2";
import type { User } from "../../types/user";
import type { SessionHistory } from "../../types/sessionHistory";
import { UserSearch } from "../../components/UserSearch/UserSearch";

export const CompanyViewer: React.FC = () => {
	const { companyId } = useParams();
	const [company, setCompany] = useState<Company>({id: "", name: "", created_at: "", updated_at: "", user_role: ""});
	const [error, setError] = useState<string | null>(null);
	const [openPanel, setOpenPanel] = useState(false);
	const [tours, setTours] = useState<Tour[]>([]);
	const [members, setMembers] = useState<User[]>([]);
	const [pendingNewMembers, setPendingNewMembers] = useState<User[]>([]);
	const [userSearchKey, setUserSearchKey] = useState(0);
	const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);
	const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
	const navigate = useNavigate();

	const isOwner = company.user_role === "owner";

	const refreshMembers = useCallback(async () => {
		if (!companyId) return;
		try {
			const resp = await getUsersOfCompany(companyId);
			setMembers(resp.data);
		} catch (err: unknown) {
			const msg =
				err && typeof err === "object" && "response" in err
					? (err as { response?: { data?: unknown } }).response?.data
					: undefined;
			setError(typeof msg === "string" ? msg : "Failed to load members.");
		}
	}, [companyId]);

	useEffect(() => {
		if (!companyId) return;
		Promise.all([
			getCompanyByID(companyId)
				.then(resp => setCompany(resp.data))
				.catch(err => setError(err.response.data)),
			getCompanyTours(companyId)
				.then(resp => setTours(resp.data))
				.catch(err => setError(err.response.data)),
			getUsersOfCompany(companyId)
				.then(resp => setMembers(resp.data))
				.catch(err => setError(err.response.data)),
			getSessionHistory(companyId)
				.then(resp => setSessionHistory(resp.data))
				.catch(() => setSessionHistory([]))
		])
	}, [companyId]);

	const handleDeleteTour = async (companyId: string, tourId: string, name: string) => {
		const result = await Swal.fire({
			title: 'Delete Tour',
			text: `Are you sure you want to delete ${name}?`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Delete',
			cancelButtonText: 'Cancel',
			customClass: {
				confirmButton: 'btn btn-danger',
				cancelButton: 'btn btn-ghost',
			}
		});
		if (result.isConfirmed) {
			deleteTour(companyId, tourId)
				.then(_ => setTours(prev => prev.filter((tour, _) => tour.id !== tourId)))
				.catch(_ => setError("Failed to delete tour. Please try again."));
		}
	};

	const handleCreateSession = async (tourId: string) => {
		createSession(tourId).then(resp => {navigate(`/session/${tourId}/${resp.data.id}`)});
	};

	const handleAddMembers = async () => {
		if (!companyId || pendingNewMembers.length === 0) return;
		setMemberActionLoading("add");
		try {
			await addMembersToCompany(
				companyId,
				pendingNewMembers.map((u) => u.id),
			);
			setPendingNewMembers([]);
			setUserSearchKey((k) => k + 1);
			await refreshMembers();
			await Swal.fire({
				icon: "success",
				title: "Members added",
				timer: 2000,
				showConfirmButton: false,
			});
		} catch (err: unknown) {
			const msg =
				err && typeof err === "object" && "response" in err
					? (err as { response?: { data?: unknown } }).response?.data
					: undefined;
			setError(typeof msg === "string" ? msg : "Could not add members.");
		} finally {
			setMemberActionLoading(null);
		}
	};

	const handleChangeMemberRole = async (member: User, role: "admin" | "member") => {
		if (!companyId || member.role === role) return;
		setMemberActionLoading(member.id);
		try {
			await changeUserRole(companyId, member.id, role);
			await refreshMembers();
		} catch (err: unknown) {
			const msg =
				err && typeof err === "object" && "response" in err
					? (err as { response?: { data?: unknown } }).response?.data
					: undefined;
			setError(typeof msg === "string" ? msg : "Could not update role.");
		} finally {
			setMemberActionLoading(null);
		}
	};

	const handleRemoveMember = async (member: User) => {
		if (!companyId) return;
		const result = await Swal.fire({
			title: "Remove member",
			text: `Remove ${member.name} (${member.email}) from this company?`,
			icon: "question",
			showCancelButton: true,
			confirmButtonText: "Remove",
			cancelButtonText: "Cancel",
			customClass: {
				confirmButton: "btn btn-danger",
				cancelButton: "btn btn-ghost",
			},
		});
		if (!result.isConfirmed) return;
		setMemberActionLoading(member.id);
		await removeUserFromCompany(companyId, member.id)
			.then(_ => refreshMembers())
			.catch(err => setError(`${err.response.data} Could not remove member`))
			.finally(() => setMemberActionLoading(null));
	};

	const formatDuration = (seconds: number) => {
		if (seconds < 60) return `${seconds}s`;
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
		const hrs = Math.floor(mins / 60);
		const remMins = mins % 60;
		return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
	};

	const formatDate = (iso: string) =>
		new Date(iso).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});

	return (
		<div className="company-viewer-page">
			<div className="container">
				<header className="company-viewer-head fade-in">
					<div className="company-viewer-head-main">
						<h1 className="company-viewer-title">{company.name || "Company"}</h1>
						{companyId && (
							<span className="company-viewer-id" title="Company ID">
								ID: {companyId}
							</span>
						)}
					</div>
					{companyId && company.user_role == "owner" || company.user_role == "admin" ? (
						<button onClick={() => navigate(`/company/${companyId}/tours/new`)} className="btn btn-primary">
							+ New tour
						</button>
					) : null}
					{!openPanel && (<button
							className="btn btn-ghost"
							onClick={() => setOpenPanel(true)}
							title="Open Control Panel"
						>Members</button>)}
				</header>

				{error && (
					<div className="alert alert-error">
						<span className="alert-icon">⚠️</span>
						<span className="alert-message">{error}</span>
						<button
							className="alert-action"
							onClick={() => setError(null)}
							aria-label="Dismiss"
						>
							✕
						</button>
					</div>
				)}

				<section className="company-viewer-tours-section" aria-labelledby="company-tours-heading">
					<div className="company-viewer-tours-header">
						<h2 id="company-tours-heading" className="company-viewer-section-title">
							Tours ({tours.length})
						</h2>
					</div>

					{tours.length === 0 ? (
						<div className="company-viewer-empty">
							<p className="company-viewer-empty-title">No tours yet</p>
							<p>Create a tour to add panoramas and room links.</p>
							{companyId ? (
								<p className="my-4">
									<Link to={`/company/${companyId}/tours/new`} className="btn btn-primary">
										Create first tour
									</Link>
								</p>
							) : null}
						</div>
					) : (
						<div className="company-viewer-tours-grid">
							{tours.map(tour => (
								<article key={tour.id} className="company-viewer-tour-card">
									<h3 className="company-viewer-tour-name">{tour.name}</h3>
									<div className="company-viewer-tour-meta">
										<span>
											ID: <code>{tour.id}</code>
										</span>
									</div>

									<div className="company-viewer-tour-actions">
										{companyId && company.user_role == "owner" || company.user_role == "admin"? (
											<>
											<Link
												to={`/company/${company.id}/tours/edit/${tour.id}`}
												className="btn btn-secondary btn-sm"
											>
											Edit
											</Link>
											<button
												type="button"
												className="btn btn-danger btn-sm"
												onClick={() => {if (companyId) handleDeleteTour(companyId, tour.id, tour.name)}}
											>
											Delete
											</button>
											<button
												type="button"
												className="btn btn-primary btn-sm"
												onClick={() => handleCreateSession(tour.id)}
											>
												Start session
											</button>
											</>
										) : (
											<button
												type="button"
												className="btn btn-primary btn-sm"
												onClick={() => handleCreateSession(tour.id)}
											>
												Start session
											</button>
										)}
									</div>
								</article>
							))}
						</div>
					)}
				</section>

				<section className="company-viewer-history-section" aria-labelledby="session-history-heading">
					<div className="company-viewer-tours-header">
						<h2 id="session-history-heading" className="company-viewer-section-title">
							Session history ({sessionHistory.length})
						</h2>
					</div>
					{sessionHistory.length === 0 ? (
						<div className="company-viewer-empty">
							<p className="company-viewer-empty-title">No completed sessions yet</p>
							<p>Finished live tour sessions for this company will appear here.</p>
						</div>
					) : (
						<div className="session-history-table-wrap">
							<table className="session-history-table">
								<thead>
									<tr>
										<th>Tour</th>
										<th>Host</th>
										<th>Ended</th>
										<th>Duration</th>
										<th>Clients</th>
										<th>Peak</th>
										<th>Blocked</th>
										<th>End reason</th>
									</tr>
								</thead>
								<tbody>
									{sessionHistory.map((entry) => (
										<tr key={entry.id}>
											<td>{entry.tour_name}</td>
											<td>{entry.owner_name}</td>
											<td>{formatDate(entry.ended_at)}</td>
											<td>{formatDuration(entry.duration_seconds)}</td>
											<td>{entry.total_clients_joined}</td>
											<td>{entry.peak_clients}</td>
											<td>{entry.blacklisted_count}</td>
											<td>
												<span className={`end-reason end-reason-${entry.end_reason}`}>
													{entry.end_reason}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>
			</div>

			<Drawer
				open={openPanel}
				onClose={() => setOpenPanel(false)}
				direction="right"
				overlayOpacity={0.5}
				overlayColor="rgba(0,0,0,0.5)"
				className="company-viewer-control-panel"
				size={380}
				lockBackgroundScroll
			>
				<div className="panel-header">
					<h3>Company Members</h3>
					<button
						className="btn btn-ghost"
						onClick={() => setOpenPanel(false)}
						title="Close Panel"
					>
						✕
					</button>
				</div>
				<div className="panel-content company-viewer-members-panel">
					{!isOwner && (
						<p className="company-viewer-members-hint">
							Only the company owner can add people, change roles, or remove members.
						</p>
					)}
					{isOwner && (
						<div className="panel-section">
							<h4>Add members</h4>
							<div className="company-viewer-add-members">
								<UserSearch
									key={userSearchKey}
									onUsersSelected={setPendingNewMembers}
									initialSelected={[]}
									excludeUserIds={members.map((m) => m.id)}
								/>
								<button
									type="button"
									className="btn btn-primary btn-sm w-full"
									disabled={
										pendingNewMembers.length === 0 || memberActionLoading === "add"
									}
									onClick={handleAddMembers}
								>
									{memberActionLoading === "add" ? "Adding…" : "Add to company"}
								</button>
							</div>
						</div>
					)}
					<div className="panel-section">
						<h4>Members ({members.length})</h4>
						{members.length === 0 ? (
							<p className="company-viewer-members-empty">No members yet.</p>
						) : (
							<ul className="company-viewer-member-list">
								{members.map((member) => {
									const busy = memberActionLoading === member.id;
									const canManage = isOwner && member.role !== "owner";

									return (
										<li key={member.id} className="company-viewer-member-card">
											<div className="company-viewer-member-main">
												<span className="company-viewer-member-name">
													{member.name}
												</span>
												<span className="company-viewer-member-email">
													{member.email}
												</span>
												<span
													className={`company-viewer-role-badge role-${member.role}`}
												>
													{member.role}
												</span>
											</div>
											{canManage && (
												<div className="company-viewer-member-actions">
													{member.role === "member" && (
														<button
															type="button"
															className="btn btn-secondary btn-sm"
															disabled={busy}
															onClick={() =>
																handleChangeMemberRole(member, "admin")
															}
														>
															Make admin
														</button>
													)}
													{member.role === "admin" && (
														<button
															type="button"
															className="btn btn-secondary btn-sm"
															disabled={busy}
															onClick={() =>
																handleChangeMemberRole(member, "member")
															}
														>
															Make member
														</button>
													)}
													<button
														type="button"
														className="btn btn-danger btn-sm"
														disabled={busy}
														onClick={() => handleRemoveMember(member)}
													>
														Remove
													</button>
												</div>
											)}
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</div>
			</Drawer>

		</div>
	)
}
