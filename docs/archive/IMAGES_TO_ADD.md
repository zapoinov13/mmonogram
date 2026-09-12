# 📸 Изображения для добавления - M-Monogram

## Нужно добавить 2 изображения:

---

### 1️⃣ Интерьер G-Class (первое прикрепленное фото)

**Сохранить как:**
```
src/assets/mods/interior-3.jpg
```

**Где используется:**
- Cover изображение секции "Interior" в Modifications
- Первое изображение в галерее Interior

**Полный путь:**
```
/Users/urijzapojnov/m-monogram/m-monogram/src/assets/mods/interior-3.jpg
```

---

### 2️⃣ Визитка M-Monogram (второе прикрепленное фото)

**Сохранить как:**
```
src/assets/menu/menu-verify.jpg
```

**Где используется:**
- Фон карточки "Verify" (Проверка VIN) в меню навигации

**Полный путь:**
```
/Users/urijzapojnov/m-monogram/m-monogram/src/assets/menu/menu-verify.jpg
```

---

## 🚀 Быстрая инструкция:

### Шаг 1: Откройте Finder
Перейдите в папку проекта:
```
m-monogram/src/assets/
```

### Шаг 2: Добавьте изображения

**Первое изображение (интерьер):**
1. Откройте папку `mods/`
2. Перетащите фото интерьера G-Class
3. Переименуйте в `interior-3.jpg`

**Второе изображение (визитка):**
1. Откройте папку `menu/`
2. Замените существующий файл `menu-verify.jpg` на визитку
3. Название должно остаться `menu-verify.jpg`

### Шаг 3: Проверьте результат
Обновите страницу в браузере:
```
http://localhost:8081/
```

---

## ✅ Что изменится:

### После добавления interior-3.jpg:
- ✅ Секция Interior покажет новое фото
- ✅ Новое описание будет отображаться
- ✅ Фото будут правильного размера (не обрезанные)

### После замены menu-verify.jpg:
- ✅ В меню навигации карточка "Verify" покажет визитку M-Monogram
- ✅ Элегантное отображение с градиентом

---

## 📁 Структура папок:

```
m-monogram/
└── src/
    └── assets/
        ├── mods/
        │   ├── interior-1.jpg  ✅ существует
        │   ├── interior-2.jpg  ✅ существует
        │   └── interior-3.jpg  ⬅️ ДОБАВЬТЕ СЮДА
        └── menu/
            ├── menu-home.jpg
            ├── menu-brand.jpg
            ├── menu-projects.jpg
            ├── menu-modifications.jpg
            ├── menu-verify.jpg  ⬅️ ЗАМЕНИТЕ ЭТО
            └── menu-contact.jpg
```

---

**Добавьте оба изображения и всё заработает! 🎉**
