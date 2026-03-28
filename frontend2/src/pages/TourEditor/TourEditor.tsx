import type React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createTour, getTourByID, updateTour } from "../../services/appApi";
import type { TourLink, TourNode } from "../../types/tour";
import "./TourEditor.css";

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
		Object.entries(nodeFiles).forEach(([idx, file]) => {
			formData.append(idx, file);
		});

		try {
			if (companyId && tourId) {
				await updateTour(companyId, tourId, formData);
			} else if (companyId) {
				await createTour(companyId, formData);
			}
			navigate(`/company/${companyId}`)
		} catch (err: unknown) {
			const data = err && typeof err === "object" && "response" in err
				? (err as { response?: { data?: unknown } }).response?.data
				: err;
			alert(`Edit\\Create tour failed: ${String(data ?? err)}`)
		}
	}

	return (
		<div className="tour-editor-page">
			<div className="container">
				<form className="tour-editor-card fade-in" onSubmit={handleSubmit}>
					<h1 className="tour-editor-title">{tourId ? "Edit tour" : "Create tour"}</h1>

					<div className="form-group">
						<label htmlFor="tour-name" className="form-label">Tour name</label>
						<input
							id="tour-name"
							type="text"
							className="form-input"
							minLength={3}
							maxLength={16}
							value={name}
							onChange={e => setName(e.target.value)}
							required
						/>
					</div>

					<h2 className="tour-editor-section-heading">Rooms</h2>

					{nodes.map((node, idx) => (
						<div key={node.id} className="tour-editor-room">
							<div className="tour-editor-room-header">
								<h3 className="tour-editor-room-title">Room {idx + 1}</h3>
							</div>

							<div className="form-group">
								<label htmlFor={`room-name-${node.id}`} className="form-label">Room name</label>
								<input
									id={`room-name-${node.id}`}
									type="text"
									className="form-input"
									minLength={3}
									maxLength={16}
									value={node.name}
									onChange={e => updateNode(idx, "name", e.target.value)}
									required
								/>
							</div>

							<div className="form-group">
								<span className="form-label">Room image</span>
								{node.panorama ? (
									<div className="tour-editor-preview-wrap">
										<img
											className="tour-editor-preview-img"
											src={getImageUrl(node.panorama)}
											alt={`Preview of ${node.name}`}
										/>
										<button type="button" className="btn btn-ghost btn-sm" onClick={() => {removeFile(idx, node.id)}}>
											Clear image
										</button>
									</div>
								) : (
									<input
										className="tour-editor-file-input"
										type="file"
										accept="image/*"
										onChange={e => {if (e.target.files) selectFile(idx, node.id, e.target.files[0])}}
										required
									/>
								)}
							</div>

							<div className="form-group">
								<span className="form-label">Links to other rooms</span>
								{node.links?.map((link, linkIdx) => (
									<div key={linkIdx} className="tour-editor-link-block">
										<div className="form-group">
											<label className="form-label" htmlFor={`link-target-${node.id}-${linkIdx}`}>Target</label>
											<select
												id={`link-target-${node.id}-${linkIdx}`}
												className="form-select"
												value={link.nodeId}
												onChange={e => updateLink(idx, linkIdx, "nodeId", e.target.value)}
												required
											>
												<option value="">Select room</option>
												{nodes.map(n => (
													<option key={n.id} value={n.id} disabled={n.id === node.id}>{n.name}</option>
												))}
											</select>
										</div>
										<div className="form-group">
											<label className="form-label" htmlFor={`link-yaw-${node.id}-${linkIdx}`}>Yaw</label>
											<input
												id={`link-yaw-${node.id}-${linkIdx}`}
												className="form-input"
												type="number"
												placeholder="Yaw"
												value={link.position.yaw}
												onChange={e => updateLink(idx, linkIdx, "position", { ...link.position, yaw: parseFloat(e.target.value) })}
												required
											/>
										</div>
										<div className="form-group">
											<label className="form-label" htmlFor={`link-pitch-${node.id}-${linkIdx}`}>Pitch</label>
											<input
												id={`link-pitch-${node.id}-${linkIdx}`}
												className="form-input"
												type="number"
												placeholder="Pitch"
												value={link.position.pitch}
												onChange={e => updateLink(idx, linkIdx, "position", { ...link.position, pitch: parseFloat(e.target.value) })}
												required
											/>
										</div>
										<div className="tour-editor-link-actions">
											<button type="button" className="btn btn-ghost btn-sm" onClick={() => {removeLink(idx, linkIdx)}}>
												Remove link
											</button>
										</div>
									</div>
								))}
								<button type="button" className="btn btn-secondary btn-sm" onClick={() => addLink(idx)}>
									Add link
								</button>
							</div>

							<div className="tour-editor-room-actions">
								{idx !== 0 ? (
									<button type="button" className="btn btn-danger btn-sm" onClick={() => {removeNode(idx)}}>
										Remove room
									</button>
								) : null}
							</div>
						</div>
					))}

					<div className="tour-editor-footer">
						<button type="button" className="btn btn-secondary" onClick={addNode}>
							Add room
						</button>
						<button type="submit" className="btn btn-primary">
							Save tour
						</button>
						<Link to={`/company/${companyId}`} className="btn btn-ghost">
							Cancel
						</Link>
					</div>
				</form>
			</div>
		</div>
	)
}
