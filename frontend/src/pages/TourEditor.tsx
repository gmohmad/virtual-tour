import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTour, getTourById, updateTour } from '../services/api';
import { ImageUpload } from '../components/ImageUpload/ImageUpload';
import type { TourData, TourNode } from '../types';

export const TourEditor: React.FC = () => {
	const { id } = useParams<{ id: string }>(); // if editing
		const navigate = useNavigate();
	const [name, setName] = useState('');
	const [nodes, setNodes] = useState<TourNode[]>([
		{ id: 'node1', name: 'Room 1', panorama: '', links: [] },
	]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (id) {
			// load existing tour
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
		// Backend returns a relative /uploads/... URL; store a full URL so
		// the viewer can fetch the image regardless of where the frontend runs.
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
		<form onSubmit={handleSubmit} style={{ padding: '20px' }}>
		<h1>{id ? 'Edit Tour' : 'Create Tour'}</h1>
		<div>
		<label>Tour Name:</label>
		<input value={name} onChange={e => setName(e.target.value)} required />
		</div>

		<h2>Rooms (Nodes)</h2>
		{nodes.map((node, idx) => (
			<div key={node.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
			<h4>Room {idx + 1}</h4>
			<div>
			<label>Room Name:</label>
			<input value={node.name} onChange={e => updateNode(idx, 'name', e.target.value)} />
			</div>
			<div>
			<label>Panorama Image:</label>
			{node.panorama ? (
				<div>
				<img src={node.panorama} alt="preview" style={{ maxWidth: '200px' }} />
				<button type="button" onClick={() => updateNode(idx, 'panorama', '')}>Change</button>
				</div>
			) : (
			<ImageUpload onUploaded={(url) => handleImageUploaded(idx, url)} />
			)}
			</div>

			<div>
			<h5>Links (to other rooms)</h5>
			{node.links?.map((link, linkIdx) => (
				<div key={linkIdx}>
				<select
				value={link.nodeId}
				onChange={e => {
					const newLinks = [...(node.links || [])];
					newLinks[linkIdx].nodeId = e.target.value;
					updateNode(idx, 'links', newLinks);
				}}
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
				/>
				<button type="button" onClick={() => {
					const newLinks = node.links?.filter((_, i) => i !== linkIdx);
					updateNode(idx, 'links', newLinks);
				}}>Remove</button>
				</div>
			))}
			<button type="button" onClick={() => addLink(idx)}>Add Link</button>
			</div>
			</div>
		))}

		<button type="button" onClick={addNode}>Add Room</button>
		<button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Tour'}</button>
		</form>
	);
};
