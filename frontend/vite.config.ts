import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	optimizeDeps: {
		include: ['three', '@photo-sphere-viewer/core', '@photo-sphere-viewer/virtual-tour-plugin']
	}
});
