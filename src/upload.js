const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// ---------- 1. DiskStorage: файлы сохраняются на диск ----------
const diskStorage = multer.diskStorage({
  // куда сохранять
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  // под каким именем (уникальное имя, чтобы файлы не перезаписывались)
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

// ---------- 2. MemoryStorage: файл хранится в памяти как Buffer ----------
const memoryStorage = multer.memoryStorage();

// ---------- 3. Фильтры файлов (проверка MIME-типа клиента) ----------
const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

function imageFilter(req, file, cb) {
  if (ALLOWED_IMAGES.includes(file.mimetype)) {
    cb(null, true); // принять
  } else {
    cb(new Error('Разрешены только изображения: JPEG, PNG, WEBP'));
  }
}

function mixedFilter(req, file, cb) {
  if (ALLOWED_DOCS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Разрешены только PDF и изображения'));
  }
}

function csvFilter(req, file, cb) {
  const isCsv =
    file.mimetype === 'text/csv' ||
    path.extname(file.originalname).toLowerCase() === '.csv';
  isCsv ? cb(null, true) : cb(new Error('Разрешены только CSV-файлы'));
}

// ---------- 4. Экземпляры multer ----------
const uploadImage = multer({
  storage: diskStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 МБ
});

const uploadMixed = multer({
  storage: diskStorage,
  fileFilter: mixedFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5 МБ, максимум 5 файлов
});

const uploadCsvInMemory = multer({
  storage: memoryStorage,
  fileFilter: csvFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 МБ
});

// только текстовые поля, без файлов
const textOnly = multer();

module.exports = { uploadImage, uploadMixed, uploadCsvInMemory, textOnly };
