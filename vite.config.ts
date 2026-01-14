import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Завантажуємо змінні оточення
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Робимо API_KEY доступним у коді безпечним способом
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});