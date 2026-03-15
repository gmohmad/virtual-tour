import React, { useState } from 'react';
import { uploadImage } from '../../services/api';

interface ImageUploadProps {
	onUploaded: (url: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUploaded }) => {
	const [uploading, setUploading] = useState(false);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploading(true);
		try {
			const res = await uploadImage(file);
			const { url } = res.data; // backend returns { url: string }
			onUploaded(url);
		} catch (err) {
			console.error('Upload failed', err);
			alert('Upload failed');
		} finally {
			setUploading(false);
		}
	};

	return (
		<div>
		<input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
		{uploading && <p>Uploading...</p>}
		</div>
	);
};
