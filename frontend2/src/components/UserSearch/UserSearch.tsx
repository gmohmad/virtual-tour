import React, { useState, useEffect } from "react";
import { searchUsers } from "../../services/appApi";
import { useDebounce } from "../../hooks/useDebounce";
import type { User } from "../../types/user";

interface UserSearchProps {
	onUsersSelected: (users: User[]) => void;
	initialSelected?: User[];
}

export const UserSearch: React.FC<UserSearchProps> = ({
	onUsersSelected,
	initialSelected = [],
}) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [results, setResults] = useState<User[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<User[]>(initialSelected);
	const [loading, setLoading] = useState(false);
	const debouncedSearch = useDebounce(searchTerm, 500);

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

	const addUser = (user: User) => {
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
		<div>
		<div>
		<label>Search users by email</label>
		<input
		type="text"
		value={searchTerm}
		onChange={(e) => setSearchTerm(e.target.value)}
		placeholder="Type at least 2 characters..."
		/>
		{loading && <span>Loading...</span>}
		{results.length > 0 && (
			<ul style={{ border: "1px solid #ccc", maxHeight: "150px", overflowY: "auto" }}>
			{results.map((user) => (
				<li key={user.id} onClick={() => addUser(user)}>
				{user.name} ({user.email})
				</li>
			))}
			</ul>
		)}
		</div>

		<div>
		<h4>Selected Members</h4>
		{selectedUsers.length === 0 ? (
			<p>No members selected</p>
		) : (
		<ul>
		{selectedUsers.map((user) => (
			<li key={user.id}>
			{user.name} ({user.email})
			<button type="button" onClick={() => removeUser(user.id)}>
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
