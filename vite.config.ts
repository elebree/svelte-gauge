import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		// The coverage run maps the bundles back to src/lib through these
		sourcemap: process.env.COVERAGE ? 'inline' : false
	},
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
			}
		}
	}
});
