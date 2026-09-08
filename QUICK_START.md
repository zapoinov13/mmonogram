# ⚡ M-Monogram - Быстрый старт

## 🚀 За 3 минуты на Vercel (Рекомендуется)

### Шаг 1: Подготовка
```bash
cd m-monogram
npm install
npm run build
```

### Шаг 2: Деплой
```bash
# Установить Vercel CLI (один раз)
npm install -g vercel

# Деплой проекта
vercel

# Следуйте инструкциям в терминале
# При первом запуске:
# - Set up and deploy? Yes
# - Which scope? [Ваш аккаунт]
# - Link to existing project? No
# - What's your project's name? m-monogram
# - In which directory is your code located? ./
# - Want to override the settings? No

# Продакшен деплой
vercel --prod
```

### Шаг 3: Готово! 
Ваш сайт онлайн: `https://m-monogram.vercel.app`

---

## 🌐 Альтернатива: Netlify

### Способ 1: Drag & Drop (самый простой)

```bash
# Соберите проект
npm run build

# Зайдите на netlify.com
# Перетащите папку dist/ в окно браузера
# Готово!
```

### Способ 2: CLI

```bash
# Установить Netlify CLI
npm install -g netlify-cli

# Деплой
netlify deploy --prod --dir=dist
```

---

## 💻 Локальный запуск

```bash
# Установка
npm install

# Запуск dev-сервера
npm run dev

# Откройте http://localhost:5173
```

---

## 📦 Все команды

```bash
# Development
npm run dev          # Запустить dev-сервер

# Production
npm run build        # Собрать для продакшена
npm run preview      # Превью продакшен-сборки

# Linting
npm run lint         # Проверить код
```

---

## ✅ Что уже настроено

- ✅ TypeScript
- ✅ React 18
- ✅ Vite (быстрая сборка)
- ✅ Tailwind CSS
- ✅ Framer Motion
- ✅ Lazy Loading
- ✅ Image Optimization
- ✅ SEO Meta Tags
- ✅ Адаптивный дизайн
- ✅ Production Build

---

## 🎯 Быстрые ссылки

- **Полная документация**: `DEPLOYMENT.md`
- **Оптимизация**: `docs/archive/OPTIMIZATION_REPORT.md`
- **README**: `README.md`

---

**Проект готов к работе! 🚀**
