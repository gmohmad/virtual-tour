import React, { useId, useState, useEffect } from "react";
import { searchUsers } from "../../services/appApi";
import { useDebounce } from "../../hooks/useDebounce";
import type { User } from "../../types/user";
import "./UserSearch.css";

interface UserSearchProps {
	onUsersSelected: (users: User[]) => void;
	initialSelected?: User[];
	excludeUserIds?: string[];
}

export const UserSearch: React.FC<UserSearchProps> = ({
	onUsersSelected,
	initialSelected = [],
	excludeUserIds = [],
}) => {
	const inputId = useId();
	const [searchTerm, setSearchTerm] = useState("");
	const [results, setResults] = useState<User[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<User[]>(initialSelected);
	const [loading, setLoading] = useState(false);
	const debouncedSearch = useDebounce(searchTerm, 500);

	const excludedIds = new Set([...excludeUserIds, ...selectedUsers.map(u => u.id)]);

	useEffect(() => {
		if (debouncedSearch.length < 2) {
			setResults([]);
			return;
		}
		setLoading(true);
		searchUsers(debouncedSearch)
		.then((res) => setResults(res.data))
		.catch((err) => console.error("Search failed", err))
		.finally(() => setLoading(false));
	}, [debouncedSearch]);

	const filteredResults = results.filter(user => !excludedIds.has(user.id));

	const addUser = (user: User) => {
		if (excludedIds.has(user.id)) return;
		if (selectedUsers.some((u) => u.id === user.id)) return;
		const updated = [...selectedUsers, user];
		setSelectedUsers(updated);
		onUsersSelected(updated);
	};

	const removeUser = (userId: string) => {
		const updated = selectedUsers.filter((u) => u.id !== userId);
		setSelectedUsers(updated);
		onUsersSelected(updated);
	};

	return (
		<div className="user-search">
			<div className="form-group user-search__field">
				<label htmlFor={inputId} className="form-label">
					Search users by email
				</label>
				<div
					className={
						"user-search__input-wrap" + (loading ? " user-search__input-wrap--busy" : "")
					}
				>
					<span className="user-search__input-icon" aria-hidden>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="11" cy="11" r="7" />
							<line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
					</span>
					<input
						id={inputId}
						type="search"
						className="form-input user-search__input"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Type at least 2 characters…"
						autoComplete="off"
						spellCheck={false}
					/>
					<div className="user-search__busy" aria-live="polite">
						{loading ? (
							<span className="user-search__spinner" title="Searching" />
						) : null}
					</div>
				</div>
				<p className="form-hint">
					Results appear after you pause typing for a moment.
				</p>
				{filteredResults.length > 0 && (
					<ul className="user-search__results" role="listbox">
						{filteredResults.map((user) => (
							<li
								key={user.id}
								className="user-search__result"
								role="option"
								tabIndex={0}
								onClick={() => addUser(user)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										addUser(user);
									}
								}}
							>
								<span className="user-search__result-name">{user.name}</span>
								<span className="user-search__result-email">{user.email}</span>
							</li>
						))}
					</ul>
				)}
			</div>

			<div className="user-search__selected-block">
				<h4 className="user-search__selected-title">Selected members</h4>
				{selectedUsers.length === 0 ? (
					<p className="user-search__empty">No one selected yet.</p>
				) : (
					<ul className="user-search__selected-list">
						{selectedUsers.map((user) => (
							<li key={user.id} className="user-search__selected-item">
								<div className="user-search__selected-text">
									<span className="user-search__selected-name">{user.name}</span>
									<span className="user-search__selected-email">{user.email}</span>
								</div>
								<button
									type="button"
									className="btn btn-ghost btn-sm"
									onClick={() => removeUser(user.id)}
								>
									Remove
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};
