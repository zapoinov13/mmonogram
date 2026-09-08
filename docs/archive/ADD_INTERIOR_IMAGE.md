# 📸 Добавление нового фото интерьера

## Инструкция:

1. **Сохраните прикрепленное изображение интерьера** в:
   ```
   src/assets/mods/interior-3.jpg
   ```

2. **Путь полностью:**
   ```
   /Users/urijzapojnov/m-monogram/m-monogram/src/assets/mods/interior-3.jpg
   ```

3. **После сохранения изображения** код уже настроен и будет работать автоматически!

---

## ✅ Что уже сделано в коде:

### 1. Исправлены обрезанные фото в Modifications
- Увеличена высота карточек: `h-64 sm:h-72` (было `h-48 sm:h-52`)
- Убран `aspect-ratio`, который обрезал изображения
- Теперь фото отображаются полностью

### 2. Добавлено новое описание Interior
Новый текст:
- "We create bespoke automotive interiors."
- "Each interior is individually designed to complement the vehicle's architecture and identity."
- "Only premium Italian leather and Alcantara are used, selected for their quality, durability, and tactile perfection."
- "Craftsmanship, precision, and attention to detail define every project."
- "The result is an interior that feels natural, refined, and unmistakably distinctive."

### 3. Настроен импорт нового изображения
- `interior-3.jpg` будет использоваться как cover image для секции Interior
- Изображение будет первым в галерее

---

## 🖼 Как сохранить изображение:

### Способ 1: Через Finder (Mac)
1. Откройте Finder
2. Перейдите в: `m-monogram/src/assets/mods/`
3. Перетащите туда прикрепленное изображение интерьера
4. Переименуйте в `interior-3.jpg`

### Способ 2: Через терминал
```bash
# Если изображение в Downloads:
mv ~/Downloads/[имя_файла].jpg /Users/urijzapojnov/m-monogram/m-monogram/src/assets/mods/interior-3.jpg
```

---

## ✨ Результат:

После добавления изображения:
- ✅ Секция Interior будет использовать новое фото
- ✅ Новое описание будет отображаться
- ✅ Фото не будут обрезаться иконками
- ✅ Все карточки станут выше и красивее

---

**Готово! Просто добавьте изображение и перезагрузите страницу! 🚀**
