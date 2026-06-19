// =============================================================================
// Bộ điều khiển KHÁCH HÀNG (thêm / sửa / xóa / xem)
// =============================================================================
// pool: nhóm kết nối MySQL dùng chung để truy vấn cơ sở dữ liệu
const { pool } = require("../cau-hinh/ket-noi-db");
// batLoi: hàm bọc (wrapper) để tự động bắt lỗi của hàm bất đồng bộ và chuyển sang middleware xử lý lỗi
const batLoi = require("../tien-ich/bat-loi-bat-dong-bo");
// Tiện ích ràng buộc: tên bắt buộc, định dạng email/SĐT, điểm tích lũy không âm
const { batBuoc, kiemTraEmail, kiemTraDienThoai, soNguyenKhongAm } = require("../tien-ich/kiem-tra");

// [GET] /api/khach-hang - Lấy danh sách khách hàng
const layDanhSach = batLoi(async (req, res) => {
  // Lấy từ khóa tìm kiếm (nếu có) từ chuỗi truy vấn trên URL
  const { tu_khoa } = req.query;
  // "WHERE 1 = 1" là mệnh đề luôn đúng, giúp nối thêm điều kiện "AND ..." phía sau dễ dàng
  let sql = "SELECT * FROM khach_hang WHERE 1 = 1";
  const params = [];
  // Nếu có từ khóa: tìm theo họ tên HOẶC số điện thoại (tìm gần đúng bằng LIKE)
  if (tu_khoa) {
    sql += " AND (ho_ten LIKE ? OR dien_thoai LIKE ?)";
    // Bao từ khóa bởi dấu % để khớp chuỗi con; dùng tham số (?) tránh SQL injection
    params.push(`%${tu_khoa}%`, `%${tu_khoa}%`);
  }
  // Sắp xếp giảm dần theo id để khách hàng mới thêm hiển thị trước
  sql += " ORDER BY id DESC";
  const [rows] = await pool.query(sql, params);
  // Trả về danh sách khách hàng cho phía client
  res.json({ thanh_cong: true, du_lieu: rows });
});

// [POST] /api/khach-hang - Thêm khách hàng
const them = batLoi(async (req, res) => {
  // Lấy thông tin khách hàng từ body của yêu cầu
  const { ho_ten, dien_thoai, email, dia_chi, diem_tich_luy } = req.body;
  // Ràng buộc: họ tên bắt buộc; SĐT/email đúng định dạng (nếu nhập); điểm tích lũy >= 0
  const hoTen = batBuoc(ho_ten, "Họ tên khách hàng");
  const dt = kiemTraDienThoai(dien_thoai);
  const em = kiemTraEmail(email);
  const diem = soNguyenKhongAm(diem_tich_luy, "Điểm tích lũy");
  // Thêm bản ghi khách hàng mới; các trường tùy chọn nếu rỗng sẽ lưu null
  const [kq] = await pool.query(
    "INSERT INTO khach_hang (ho_ten, dien_thoai, email, dia_chi, diem_tich_luy) VALUES (?, ?, ?, ?, ?)",
    [hoTen, dt, em, dia_chi || null, diem]
  );
  // Trả mã 201 (đã tạo) kèm id của khách hàng vừa thêm
  res.status(201).json({ thanh_cong: true, du_lieu: { id: kq.insertId } });
});

// [PUT] /api/khach-hang/:id - Cập nhật khách hàng
const capNhat = batLoi(async (req, res) => {
  // Lấy dữ liệu mới của khách hàng từ body
  const { ho_ten, dien_thoai, email, dia_chi, diem_tich_luy } = req.body;
  // Ràng buộc giống khi thêm (họ tên bắt buộc, định dạng SĐT/email, điểm >= 0)
  const hoTen = batBuoc(ho_ten, "Họ tên khách hàng");
  const dt = kiemTraDienThoai(dien_thoai);
  const em = kiemTraEmail(email);
  const diem = soNguyenKhongAm(diem_tich_luy, "Điểm tích lũy");
  // Cập nhật bản ghi theo id (lấy từ tham số trên URL); trường rỗng lưu null
  await pool.query(
    "UPDATE khach_hang SET ho_ten = ?, dien_thoai = ?, email = ?, dia_chi = ?, diem_tich_luy = ? WHERE id = ?",
    [hoTen, dt, em, dia_chi || null, diem, req.params.id]
  );
  res.json({ thanh_cong: true, thong_bao: "Cập nhật khách hàng thành công" });
});

// [DELETE] /api/khach-hang/:id - Xóa khách hàng
const xoa = batLoi(async (req, res) => {
  // Xóa khách hàng theo id lấy từ tham số trên URL
  await pool.query("DELETE FROM khach_hang WHERE id = ?", [req.params.id]);
  res.json({ thanh_cong: true, thong_bao: "Xóa khách hàng thành công" });
});

// Xuất các hàm điều khiển để file định tuyến (router) sử dụng
module.exports = { layDanhSach, them, capNhat, xoa };
