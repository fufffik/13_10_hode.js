const path = require('path');
const express = require('express');
const multer = require('multer');
const uploadRoutes = require('./routes/upload.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // JSON-тела; multipart он НЕ разбирает
app.use(express.static(path.join(__dirname, '..', 'public'))); // тестовая страница
app.use('/files', express.static(path.join(__dirname, '..', 'uploads'))); // раздача загруженных файлов
app.use('/upload', uploadRoutes);

// Обработчик ошибок: отдельно ловим ошибки Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'Файл слишком большой',
      LIMIT_FILE_COUNT: 'Слишком много файлов',
      LIMIT_UNEXPECTED_FILE: 'Неожиданное поле с файлом (проверьте имя поля)',
    };
    return res
      .status(400)
      .json({ error: messages[err.code] || err.message, code: err.code });
  }
  // ошибки из fileFilter и прочие
  res.status(400).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
