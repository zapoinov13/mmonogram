# 🏆 M-Monogram

Элитная студия кастомизации G-Class в Дубае. Эксклюзивные модификации Maybach & Brabus для Mercedes G-Class.

---

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Превью продакшен-сборки
npm run preview
```

---

## 📂 Структура проекта

```
m-monogram/
├── src/
│   ├── components/       # React компоненты (88 шт)
│   ├── contexts/         # Контексты (Language)
│   ├── data/             # Данные проектов и модификаций
│   ├── hooks/            # Кастомные хуки
│   ├── lib/              # Утилиты и валидация
│   ├── pages/            # Страницы приложения
│   ├── assets/           # Изображения и медиа
│   └── index.css         # Глобальные стили
├── public/               # Статические файлы
├── index.html            # Точка входа
└── vite.config.ts        # Конфигурация Vite
```

---

## 🛠 Технологии

- **Frontend:** React 18.3.1 + TypeScript 5.8.3
- **Build Tool:** Vite 5.4.19
- **Styling:** Tailwind CSS 3.4.17
- **Animations:** Framer Motion 12.23.26
- **UI Components:** Radix UI
- **Icons:** Lucide React
- **Routing:** React Router 7.5.0
- **Carousel:** Embla Carousel
- **Forms:** React Hook Form + Zod

---

## 🎨 Особенности

✅ **Производительность:**
- Lazy loading компонентов
- Оптимизированные изображения
- Code splitting
- Мemoизация

✅ **Дизайн:**
- Премиум черно-белая цветовая схема с фиолетовым акцентом
- Адаптивный дизайн (mobile-first)
- Плавные анимации
- Современный UI/UX

✅ **SEO:**
- Meta теги
- Open Graph
- Schema.org разметка
- robots.txt

✅ **Качество кода:**
- TypeScript для type safety
- ESLint конфигурация
- Чистая архитектура
- Документированный код

---

## 📱 Компоненты

### Основные секции:
- **Hero Section** - Главный экран с видео фоном
- **Brand Section** - История бренда M-Monogram
- **Projects Section** - Портфолио проектов
- **Modifications Section** - Каталог модификаций
- **VIN Checker** - Проверка VIN номера
- **Contact/Booking** - Формы связи и бронирования

### UI Компоненты:
- Карусели (Projects, Wheels, Kit Views)
- Модальные окна
- Галереи изображений
- Формы с валидацией
- Навигация с анимациями

---

## 🌐 Развертывание

### Быстрый деплой на Vercel:

```bash
npm install -g vercel
vercel --prod
```

### Другие варианты:
- **Netlify** - автоматический деплой из Git
- **GitHub Pages** - бесплатный хостинг
- **VPS/Nginx** - полный контроль
- **Docker** - контейнеризация

📖 **Подробнее:** См. `DEPLOYMENT.md` и `QUICK_START.md`

---

## 🔧 Команды

```bash
# Development
npm run dev              # Запуск dev-сервера (localhost:5173)

# Production
npm run build            # Сборка для продакшена
npm run build:dev        # Сборка в dev режиме
npm run preview          # Превью продакшен-сборки

# Code Quality
npm run lint             # Проверка кода ESLint
```

---

## 📋 Файлы конфигурации

- `vite.config.ts` - Настройки Vite
- `tailwind.config.ts` - Конфигурация Tailwind
- `tsconfig.json` - TypeScript конфигурация
- `eslint.config.js` - Правила линтинга
- `netlify.toml` - Настройки Netlify
- `vercel.json` - Настройки Vercel

---

## 🎯 Документация

- **`QUICK_START.md`** - Быстрый старт за 3 минуты
- **`DEPLOYMENT.md`** - Полное руководство по развертыванию
- **`docs/archive/OPTIMIZATION_REPORT.md`** - Отчет о проведенной оптимизации

---

## 🔐 Безопасность

- Валидация пользовательского ввода
- Санитизация данных
- Безопасные URL
- Security headers (в конфигах nginx/Vercel/Netlify)

---

## 📊 Производительность

- ⚡ Lighthouse Score: 90+
- 🖼 Lazy loading изображений
- 📦 Оптимизированный bundle
- 🚀 Fast First Paint
- 💨 Smooth animations (60fps)

---

## 🌍 Языки

- English
- Русский

Поддержка мультиязычности через `LanguageContext`.

---

## 📞 Контакты

- **Телефон:** +971 54 507 7707, +971 4 228 4177
- **Адрес:** Dubai, UAE
- **Сайт:** https://mmonogram.com

---

## 📄 Лицензия

Частный проект M-Monogram. Все права защищены.

---

## ✅ Статус проекта

🟢 **Готово к продакшену**

- ✅ Все зависимости обновлены
- ✅ Нет TypeScript ошибок
- ✅ Нет линтинг ошибок
- ✅ Код оптимизирован
- ✅ Адаптивный дизайн
- ✅ SEO настроено
- ✅ Производительность оптимизирована

---

**Made with ❤️ for M-Monogram**

## SEO

Заголовок, описание и ключевые слова каждой страницы лежат в одном месте —
`src/lib/seo/catalog.ts`. Ключевые запросы с пояснениями, откуда они взяты, —
в `src/lib/seo/keywords.ts`.

Из этого справочника данные берут трое:

* страницы — через `SEOHead`;
* `vite-plugin-seo.ts` — печатает готовый `<head>` в `dist/<путь>/index.html`
  и собирает `public/sitemap.xml` и `public/robots.txt`;
* `scripts/seo-check.mjs` — проверяет собранный результат.

Пререндер нужен потому, что сайт — одностраничное приложение: без него
сборщики превью в Telegram, WhatsApp и Facebook видели у всех страниц один и
тот же заголовок и описание.

### Как добавить страницу

1. Завести маршрут в `src/App.tsx`.
2. Добавить запись в `src/lib/seo/catalog.ts`.
3. `npm run build && npm run seo:check`.

Проект, добавленный в `src/data/projects.ts` без записи в справочнике,
проверку не пройдёт — это защита от того, чтобы страница уехала в продакшн
с чужим описанием.

### Проверка

```bash
npm run seo:check   # после npm run build
npm run verify      # lint + typecheck + build + seo:check
```

Что проверяется: длина `<title>` (30–62) и `description` (70–160), их
уникальность по всем страницам, `canonical` на нужный адрес по https,
отсутствие дублей тегов, полный набор Open Graph, разбираемость JSON-LD,
`<meta charset>` раньше `<title>`, совпадение карты сайта с пререндером,
расхождение справочника с данными сайта и `robots.txt`.

### Проверка конфигуратора

```bash
npm run check:configurator
```

Читает реестр машин `src/components/configurator/models.ts` и сами GLB-файлы.
Падает, если:

* указанного у машины файла нет на диске;
* у машины нет файла обвеса — в нём лежат колёса, без него в кадре голый
  каркас с открытой подвеской;
* под роль «колесо» или «свет» размечено меньше деталей, чем нужно, чтобы
  переключатель в панели что-то менял.

Предупреждает о выгрузках в `public/models`, на которые никто не ссылается:
папка копируется в сборку целиком, и такие файлы уезжают на домен мёртвым
грузом.

Правила классификации берутся из самого `models.ts`, а не дублируются в
скрипте: поменяется правило — проверка поедет за ним.
