import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Завантажуємо змінні оточення
  const env = loadEnv(mode, '.', '');

  // 👇 ВСТАВТЕ ВАШ API КЛЮЧ У ЛАПКИ НИЖЧЕ, щоб він працював постійно 👇
  const MANUALLY_SET_KEY = "AIzaSyARH5f3ZsZ3ucjNwHsoRuaOBXWog8Zz-ZI"; 

  return {
    plugins: [react()],
    define: {
      // Пріоритет: .env файл -> Вписаний вручну ключ -> Порожньо
      'process.env.API_KEY': JSON.stringify(env.API_KEY || MANUALLY_SET_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
