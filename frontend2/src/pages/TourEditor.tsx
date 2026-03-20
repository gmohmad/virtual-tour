import type React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { TourData } from "../types/types";
import { getTourByID } from "../services/api";

export const TourEditor: React.FC = () => {
	const { id } = useParams();
	const [name, setName] = useState("");
	const [nodes, setNodes] = useState<TourData[]>([])

	useEffect(() => {
		if (!id) return;
		getTourByID(id).then((resp) => {
			setName(resp.data.name);
			setNodes(resp.data.data.nodes);
		});
	}, [id]);

	const addNode;

	const submit = (e,fl) => {

	}

	return (
		<div>
			<form>
			</form>
		</div>
	)
}
