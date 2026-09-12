# 📸 Инструкция: Добавление 4 фотографий

## 🎯 В какой раздел добавляем фото?

Пожалуйста, укажите, в какой раздел нужно добавить 4 фото:
- **Галерея проекта** (какой проект?)
- **Раздел модификаций** (wheels, interior, exterior, performance, lighting, protection?)
- **Другой раздел?**

---

## 📁 Общие правила загрузки изображений

### 1️⃣ Куда загружать:

**Основная папка для изображений:**
```
/Users/urijzapojnov/m-monogram/m-monogram/src/assets/
```

**Подпапки:**
- `src/assets/` - основные изображения проектов
- `src/assets/mods/` - изображения модификаций
- `src/assets/menu/` - изображения для меню
- `src/assets/brand/` - изображения бренда

---

## 📝 Как подписать файлы (именование)

### Вариант 1: Для галереи проекта

Если добавляете в галерею существующего проекта:

**Пример для проекта G900:**
```
g900-new-1.jpg
g900-new-2.jpg
g900-new-3.jpg
g900-new-4.jpg
```

**Или с описанием:**
```
g900-detail-1.jpg
g900-detail-2.jpg
g900-detail-3.jpg
g900-detail-4.jpg
```

**Полный путь:**
```
/Users/urijzapojnov/m-monogram/m-monogram/src/assets/g900-new-1.jpg
/Users/urijzapojnov/m-monogram/m-monogram/src/assets/g900-new-2.jpg
/Users/urijzapojnov/m-monogram/m-monogram/src/assets/g900-new-3.jpg
/Users/urijzapojnov/m-monogram/m-monogram/src/assets/g900-new-4.jpg
```

---

### Вариант 2: Для раздела модификаций

**Для колес (wheels):**
```
wheels-11.jpg
wheels-12.jpg
wheels-13.jpg
wheels-14.jpg
```

**Для интерьера (interior):**
```
interior-5.jpg
interior-6.jpg
interior-7.jpg
interior-8.jpg
```

**Для экстерьера (exterior):**
```
exterior-2.jpg
exterior-3.jpg
exterior-4.jpg
exterior-5.jpg
```

**Полный путь (пример для wheels):**
```
/Users/urijzapojnov/m-monogram/m-monogram/src/assets/mods/wheels-11.jpg
/Users/urijzapojnov/m-monogram/m-monogram/src/assets/mods/wheels-12.jpg
/Users/urijzapojnov/m-monogram/m-monogram/src/assets/mods/wheels-13.jpg
/Users/urijzapojnov/m-monogram/m-monogram/src/assets/mods/wheels-14.jpg
```

---

### Вариант 3: Для нового проекта

Если создаете новый проект:

```
new-project-hero.jpg
new-project-1.jpg
new-project-2.jpg
new-project-3.jpg
new-project-4.jpg
```

---

## ✅ Правила именования:

1. **Только маленькие буквы** (lowercase)
2. **Только `.jpg` расширение** (не `.JPG`, не `.jpeg`, не `.png`)
3. **Без пробелов** - используйте дефисы `-` или подчеркивания `_`
4. **Описательные имена** - понятно, что на фото

**❌ Неправильно:**
- `Photo 1.JPG`
- `image.jpeg`
- `New Image.png`
- `фото1.jpg`

**✅ Правильно:**
- `g900-detail-1.jpg`
- `wheels-11.jpg`
- `interior-5.jpg`

---

## 🚀 Быстрая инструкция через Finder:

### Шаг 1: Откройте Finder
Перейдите в папку:
```
m-monogram/src/assets/
```

### Шаг 2: Выберите подпапку
- Для проектов: `src/assets/`
- Для модификаций: `src/assets/mods/`

### Шаг 3: Перетащите 4 фото
Перетащите файлы в папку

### Шаг 4: Переименуйте файлы
1. Выделите файл
2. Нажмите `Enter` или кликните на имя
3. Переименуйте по правилам выше

---

## 📋 После загрузки:

**Сообщите мне:**
1. ✅ В какой раздел добавить (проект/модификации/другое)
2. ✅ Какие имена файлов вы использовали
3. ✅ Где они должны отображаться

**Я добавлю их в код!**

---

## 💡 Примеры использования:

### Если добавляете в проект G900:
После загрузки файлов я добавлю их в `src/data/projects.ts`:
```typescript
import g900New1 from "@/assets/g900-new-1.jpg";
import g900New2 from "@/assets/g900-new-2.jpg";
// и т.д.
```

### Если добавляете в wheels:
После загрузки файлов я добавлю их в `src/data/modifications.ts`:
```typescript
import wheels11 from "@/assets/mods/wheels-11.jpg";
// и т.д.
```

---

## ⚠️ Важно:

- **Формат:** JPG (JPEG)
- **Размер:** Рекомендуется оптимизировать (не слишком большие файлы)
- **Качество:** Высокое качество для веб-отображения
- **Ориентация:** Любая (вертикальная/горизонтальная)

---

## 📞 После загрузки:

**Напишите мне:**
> "Загрузил 4 фото в папку [название папки] с именами [список имен]. Добавь их в [раздел]."

И я сразу добавлю их в код! 🚀
