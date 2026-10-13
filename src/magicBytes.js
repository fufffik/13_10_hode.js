const fs = require('fs/promises');

// MIME-тип из заголовка можно подделать, поэтому после сохранения
// проверяем реальное содержимое файла (magic bytes) через file-type.
// file-type v19 — ESM-пакет, поэтому подключаем его через динамический import().
async function verifyRealType(filePath, allowedMimes) {
  const { fileTypeFromFile } = await import('file-type');
  const detected = await fileTypeFromFile(filePath);

  if (!detected || !allowedMimes.includes(detected.mime)) {
    await fs.unlink(filePath).catch(() => {}); // удаляем подозрительный файл
    return { ok: false, detected: detected ? detected.mime : 'unknown' };
  }
  return { ok: true, detected: detected.mime };
}

module.exports = { verifyRealType };
