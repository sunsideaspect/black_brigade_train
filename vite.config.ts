import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Завантажуємо змінні оточення
  const env = loadEnv(mode, '.', '');

  // 👇 УВАГА: Якщо ви вставите ключ сюди, НЕ ЗАВАНТАЖУЙТЕ цей файл на GitHub!
  // Google автоматично блокує ключі, знайдені в публічному коді.
  const MANUALLY_SET_KEY = "AIzaSyBHKeHz_9YzXvsu1-aHxwKvc8NeoUDDrhA"; 

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
