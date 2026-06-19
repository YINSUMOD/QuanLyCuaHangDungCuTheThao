// =============================================================================
// Tiện ích KIỂM TRA & RÀNG BUỘC dữ liệu nhập (validation) dùng chung cho backend.
// Mỗi hàm trả về giá trị đã chuẩn hóa nếu hợp lệ, hoặc NÉM lỗi 400 nếu không hợp lệ.
// Vì controller được bọc bởi batLoi nên lỗi ném ra sẽ tự chuyển sang middleware
// xử lý lỗi và trả về HTTP 400 kèm thông báo (server là nơi quyết định cuối cùng).
// =============================================================================

// Tạo một lỗi gắn status = 400 (Bad Request) để middleware trả đúng mã
function loi400(thongBao) {
  return Object.assign(new Error(thongBao), { status: 400 });
}

// Bắt buộc có giá trị (chuỗi không rỗng sau khi cắt khoảng trắng) -> trả về chuỗi đã trim
function batBuoc(giaTri, ten) {
  if (giaTri === undefined || giaTri === null || String(giaTri).trim() === "") {
    throw loi400(`${ten} không được để trống`);
  }
  return String(giaTri).trim();
}

// Số KHÔNG ÂM (>= 0). Cho phép bỏ trống -> trả về giá trị mặc định. Dùng cho GIÁ.
function soKhongAm(giaTri, ten, macDinh = 0) {
  if (giaTri === undefined || giaTri === null || giaTri === "") return macDinh;
  const so = Number(giaTri);
  if (!Number.isFinite(so) || so < 0) throw loi400(`${ten} phải là số không âm`);
  return so;
}

// Số NGUYÊN KHÔNG ÂM (>= 0). Cho phép bỏ trống -> mặc định. Dùng cho TỒN KHO.
function soNguyenKhongAm(giaTri, ten, macDinh = 0) {
  if (giaTri === undefined || giaTri === null || giaTri === "") return macDinh;
  const so = Number(giaTri);
  if (!Number.isInteger(so) || so < 0) throw loi400(`${ten} phải là số nguyên không âm`);
  return so;
}

// Số NGUYÊN DƯƠNG (> 0). Dùng cho SỐ LƯỢNG mua/nhập (luôn bắt buộc).
function soNguyenDuong(giaTri, ten) {
  const so = Number(giaTri);
  if (!Number.isInteger(so) || so <= 0) throw loi400(`${ten} phải là số nguyên lớn hơn 0`);
  return so;
}

// Kiểm tra EMAIL cơ bản (cho phép bỏ trống). Trả về chuỗi đã trim hoặc null.
function kiemTraEmail(giaTri, ten = "Email") {
  if (!giaTri) return null;
  const s = String(giaTri).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw loi400(`${ten} không đúng định dạng`);
  return s;
}

// Kiểm tra SỐ ĐIỆN THOẠI VN cơ bản (cho phép bỏ trống): chỉ gồm 9-11 chữ số.
function kiemTraDienThoai(giaTri, ten = "Số điện thoại") {
  if (!giaTri) return null;
  const s = String(giaTri).trim();
  if (!/^[0-9]{9,11}$/.test(s)) throw loi400(`${ten} chỉ gồm 9-11 chữ số`);
  return s;
}

module.exports = {
  loi400, batBuoc, soKhongAm, soNguyenKhongAm, soNguyenDuong, kiemTraEmail, kiemTraDienThoai,
};
