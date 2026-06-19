// Hàm bọc (wrapper) cho controller bất đồng bộ:
// tự động bắt lỗi và chuyển tới phần mềm trung gian xử lý lỗi tập trung,
// giúp không phải viết try/catch lặp lại ở mọi controller.
// Nhận vào hàm xử lý bất đồng bộ "fn" (controller) và trả về một middleware Express mới
function batLoiBatDongBo(fn) {
  // Bọc kết quả của fn trong Promise.resolve để chắc chắn luôn có Promise (kể cả khi fn không async)
  // Nếu Promise bị reject (có lỗi), .catch(next) sẽ chuyển lỗi sang middleware xử lý lỗi tập trung
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = batLoiBatDongBo;
