import type React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createTour, getTourByID, updateTour } from "../services/appApi";
import type { TourLink, TourNode } from "../types/tour";

export const TourEditor: React.FC = () => {
	const navigate = useNavigate();
	const { companyId, tourId } = useParams();
	const [name, setName] = useState("");
	const [nodes, setNodes] = useState<TourNode[]>([{ id: "node1", name: "Room 1", panorama: "", links: [] }]);
	const [nodeFiles, setNodeFiles] = useState<{ [nodeId: string]: File }>({});

	useEffect(() => {
		if (!tourId) return;
		getTourByID(tourId).then((resp) => {
			setName(resp.data.name);
			setNodes(resp.data.data.nodes);
		});
	}, [tourId]);

	const addNode = () => {
		const newNodeId = `node${nodes.length + 1}`;
		setNodes([...nodes, { id: newNodeId, name: `Room ${nodes.length + 1}`, panorama: "", links: [] }]);
	};

	const updateNode = (index: number, field: keyof TourNode, value: any) => {
		const updated = [...nodes];
		updated[index] = { ...updated[index], [field]: value };
		setNodes(updated);
	};

	const removeNode = (index: number) => {
		removeFile(index, nodes[index].id);
		setNodes(prev => prev.filter((_, i) => i !== index));
	}

	const addLink = (fromIndex: number) => {
		const link = { nodeId: "", position: { yaw: 0, pitch: 0 } };
		const updated = [...nodes];
		updated[fromIndex].links = updated[fromIndex].links || [];
		updated[fromIndex].links!.push(link);
		setNodes(updated);
	};

	const updateLink = (nodeIdx: number, linkIdx: number, field: keyof TourLink, value: any) => {
		setNodes(prev => {
			const updated = [...prev];
			const node = updated[nodeIdx];
			const updatedLinks = [...(node.links || [])];
			updatedLinks[linkIdx] = { ...updatedLinks[linkIdx], [field]: value };
			updated[nodeIdx] = { ...node, links: updatedLinks };
			return updated;
		});
	};

	const removeLink = (nodeIdx: number, linkIdx: number,) => {
		setNodes(prev => {
			const updated = [...prev];
			const node = updated[nodeIdx];
			const updatedLinks = node.links?.filter((_, i) => i !== linkIdx) || [];
			updated[nodeIdx] = { ...node, links: updatedLinks };
			return updated;
		});
	}

	const selectFile = (idx: number, nodeId: string, file: File) => {
		setNodeFiles(prev => ({ ...prev, [nodeId]: file }));
		updateNode(idx, "panorama", URL.createObjectURL(file));
	}

	const removeFile = (idx: number, nodeId: string) => {
		setNodeFiles(prev => {
			const newFiles = { ...prev };
			delete newFiles[nodeId];
			return newFiles;
		});
		updateNode(idx, "panorama", "");
	}

	const getImageUrl = (key: string) => {
		if (key.startsWith("blob:")) return key;
		return `${import.meta.env.VITE_APP_API_URL}/${key}`;
	};

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		const payload = {id: tourId, name: name, company_id: companyId, data: {nodes: nodes }};
		const formData = new FormData();
		formData.append("data", JSON.stringify(payload));

		// TODO: fix image upload on update
		const fetchPromises = nodes.map(async (node, idx) => {
			if (nodeFiles[node.id] || !node.panorama) return;

			const res = await fetch(getImageUrl(node.panorama));
			const blob = await res.blob();
			const file = new File([blob], `existing_${idx}.jpg`, { type: blob.type });
			nodeFiles[node.id] = file;
		});
		await Promise.all(fetchPromises);

		Object.entries(nodeFiles).forEach(([idx, file]) => {
			formData.append(`img_${idx}`, file);
		});

		try {
			if (companyId && tourId) {
				updateTour(companyId, tourId, formData);
			} else if (companyId) {
				createTour(companyId, formData);
			}
			navigate(`/company/${companyId}`)
		} catch (err) {
			alert(`Edit\\Create tour failed: ${err.response.data}`)
		}
	}

	return (
		<div>
		<h1>{tourId ? "Edit Tour" : "Create Tour"}</h1>
		<form onSubmit={handleSubmit}>
		<label>Tour Name</label>
		<input type="text" minLength={3} maxLength={16} value={name} onChange={e => setName(e.target.value)} required />

		<h2>Rooms</h2>
		{nodes.map((node, idx) => (
			<div key={node.id}>

			<div>
			<h4>Room {idx + 1}</h4>
			<label>Room Name</label>
			<input type="text" minLength={3} maxLength={16} value={node.name} onChange={e => updateNode(idx, "name", e.target.value)} required />
			</div>

			<label>Room Image</label>
			{node.panorama ? (
				<div>
				<img src={getImageUrl(node.panorama)} alt="preview" style={{ maxWidth: "200px", marginBottom: "0.5rem" }} />
				<button type="button" onClick={() => {removeFile(idx, node.id)}}>Clear Image</button>
				</div>
			) : (
			<div>
			<input type="file" accept="image/*" onChange={e => {if (e.target.files) selectFile(idx, node.id, e.target.files[0])}} required />
				</div>
			)}

			<label>Links to other rooms</label>
			{node.links?.map((link, linkIdx) => (
				<div key={linkIdx}>
				<select value={link.nodeId} onChange={e => updateLink(idx, linkIdx, "nodeId", e.target.value)} required >
				<option value="">Select target room</option>
				{nodes.map(n => (
					<option key={n.id} value={n.id} disabled={n.id === node.id}>{n.name}</option>
				))}
				</select>
				<input type="number" placeholder="Yaw" value={link.position.yaw} onChange={e => updateLink(idx, linkIdx, "position", { ...link.position, yaw: parseFloat(e.target.value) })} required />
				<input type="number" placeholder="Pitch" value={link.position.pitch} onChange={e => updateLink(idx, linkIdx, "position", { ...link.position, pitch: parseFloat(e.target.value) })} required />
				<button type="button" onClick={() => {removeLink(idx, linkIdx)}}>Remove Link</button>
				</div>
			))}
			<button type="button" onClick={() => addLink(idx)}>Add Link</button>
			{idx != 0 ? <button type="button" onClick={() => {removeNode(idx)}}>Remove Room</button> : null}

			</div>
		))}

		<button type="button" onClick={addNode}>Add Room</button>
		<button type="submit">Submit</button>
		<Link to={`/company/${companyId}`}>Cancel</Link>
		</form>
		</div>
	)
}
