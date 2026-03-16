import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTour, getTourById, updateTour } from '../services/api';
import { ImageUpload } from '../components/ImageUpload/ImageUpload';
import type { TourData, TourNode } from '../types';

export const TourEditor: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [name, setName] = useState('');
	const [nodes, setNodes] = useState<TourNode[]>([
		{ id: 'node1', name: 'Room 1', panorama: '', links: [] },
	]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (id) {
			getTourById(id).then(res => {
				setName(res.data.name);
				setNodes(res.data.data.nodes);
			});
		}
	}, [id]);

	const addNode = () => {
		const newNodeId = `node${nodes.length + 1}`;
		setNodes([...nodes, { id: newNodeId, name: `Room ${nodes.length + 1}`, panorama: '', links: [] }]);
	};

	const updateNode = (index: number, field: keyof TourNode, value: any) => {
		const updated = [...nodes];
		updated[index] = { ...updated[index], [field]: value };
		setNodes(updated);
	};

	const addLink = (fromIndex: number) => {
		const link = { nodeId: '', position: { yaw: 0, pitch: 0 } };
		const updated = [...nodes];
		updated[fromIndex].links = updated[fromIndex].links || [];
		updated[fromIndex].links!.push(link);
		setNodes(updated);
	};

	const handleImageUploaded = (index: number, url: string) => {
		const fullUrl = url.startsWith('http')
			? url
			: `${import.meta.env.VITE_API_BASE_URL}${url}`;
			updateNode(index, 'panorama', fullUrl);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const tourData: TourData = { nodes };
			if (id) {
				await updateTour(id, name, tourData);
			} else {
				await createTour(name, tourData);
			}
			navigate('/tours');
		} catch (err) {
			console.error(err);
			alert('Failed to save tour');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container">
		<form onSubmit={handleSubmit} className="card">
		<h1>{id ? 'Edit Tour' : 'Create Tour'}</h1>

		<div className="form-group">
		<label>Tour Name</label>
		<input value={name} onChange={e => setName(e.target.value)} required />
		</div>

		<h2>Rooms (Nodes)</h2>
		{nodes.map((node, idx) => (
			<div key={node.id} className="card" style={{ marginBottom: '1rem' }}>
			<h4>Room {idx + 1}</h4>

			<div className="form-group">
			<label>Room Name</label>
			<input value={node.name} onChange={e => updateNode(idx, 'name', e.target.value)} />
			</div>

			<div className="form-group">
			<label>Panorama Image</label>
			{node.panorama ? (
				<div>
				<img src={node.panorama} alt="preview" style={{ maxWidth: '200px', marginBottom: '0.5rem' }} />
				<br />
				<button type="button" onClick={() => updateNode(idx, 'panorama', '')}>Change Image</button>
				</div>
			) : (
			<ImageUpload onUploaded={(url) => handleImageUploaded(idx, url)} />
			)}
			</div>

			<div className="form-group">
			<label>Links (to other rooms)</label>
			{node.links?.map((link, linkIdx) => (
				<div key={linkIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
				<select
				value={link.nodeId}
				onChange={e => {
					const newLinks = [...(node.links || [])];
					newLinks[linkIdx].nodeId = e.target.value;
					updateNode(idx, 'links', newLinks);
				}}
				style={{ flex: 2 }}
				>
				<option value="">Select target room</option>
				{nodes.map(n => (
					<option key={n.id} value={n.id} disabled={n.id === node.id}>{n.name}</option>
				))}
				</select>
				<input
				type="number"
				placeholder="Yaw"
				value={link.position.yaw}
				onChange={e => {
					const newLinks = [...(node.links || [])];
					newLinks[linkIdx].position.yaw = parseFloat(e.target.value);
					updateNode(idx, 'links', newLinks);
				}}
				style={{ width: '80px' }}
				/>
				<input
				type="number"
				placeholder="Pitch"
				value={link.position.pitch}
				onChange={e => {
					const newLinks = [...(node.links || [])];
					newLinks[linkIdx].position.pitch = parseFloat(e.target.value);
					updateNode(idx, 'links', newLinks);
				}}
				style={{ width: '80px' }}
				/>
				<button type="button" onClick={() => {
					const newLinks = node.links?.filter((_, i) => i !== linkIdx);
					updateNode(idx, 'links', newLinks);
				}} className="danger">Remove</button>
				</div>
			))}
			<button type="button" onClick={() => addLink(idx)}>Add Link</button>
			</div>
			</div>
		))}

		<div className="button-group" style={{ marginTop: '1rem' }}>
		<button type="button" onClick={addNode}>Add Room</button>
		<button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Tour'}</button>
		</div>
		</form>
		</div>
	);
};
