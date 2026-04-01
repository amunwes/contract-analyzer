import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	optimizeDeps: {
		include: ["pdfjs-dist"],
	},
	build: {
		commonjsOptions: {
			include: [/pdfjs-dist/, /node_modules/],
		},
	},
});
