const express = require('express');
const {
  uploadImage,
  uploadMixed,
  uploadCsvInMemory,
  textOnly,
} = require('../upload');
const { verifyRealType } = require('../magicBytes');

const router = express.Router();

const fileInfo = (f) => ({
  field: f.fieldname,
  originalName: f.originalname,
  savedAs: f.filename,
  mimetype: f.mimetype,
  size: f.size,
});

// 1) single — один файл из поля "avatar" -> req.file
router.post('/single', uploadImage.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не передан (поле "avatar")' });
    }

    // дополнительная проверка по magic bytes
    const check = await verifyRealType(req.file.path, [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
    if (!check.ok) {
      return res
        .status(400)
        .json({ error: `Содержимое файла не совпадает с типом (${check.detected})` });
    }

    res.status(201).json({
      message: 'Файл загружен',
      body: req.body, // текстовые поля формы
      file: fileInfo(req.file),
      realType: check.detected,
    });
  } catch (err) {
    next(err);
  }
});

// 2) array — несколько файлов из одного поля "photos" -> req.files (массив)
router.post('/multiple', uploadImage.array('photos', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Файлы не переданы (поле "photos")' });
  }
  res.status(201).json({
    message: `Загружено файлов: ${req.files.length}`,
    files: req.files.map(fileInfo),
  });
});

// 3) fields — файлы из нескольких разных полей -> req.files (объект)
router.post(
  '/fields',
  uploadMixed.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 3 },
  ]),
  (req, res) => {
    const files = req.files || {};
    res.status(201).json({
      message: 'Файлы загружены',
      avatar: (files.avatar || []).map(fileInfo),
      documents: (files.documents || []).map(fileInfo),
    });
  }
);

// 4) none — только текстовые поля, файлы запрещены
router.post('/text', textOnly.none(), (req, res) => {
  res.json({ message: 'Получены только текстовые поля', body: req.body });
});

// 5) MemoryStorage — CSV обрабатываем сразу из Buffer, на диск не пишем
router.post('/csv', uploadCsvInMemory.single('table'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не передан (поле "table")' });
  }
  const text = req.file.buffer.toString('utf-8');
  const rows = text.split(/\r?\n/).filter(Boolean).map((line) => line.split(','));
  const [header, ...data] = rows;

  res.json({
    message: 'CSV обработан в памяти',
    header,
    rowsCount: data.length,
    preview: data.slice(0, 3),
  });
});

module.exports = router;
