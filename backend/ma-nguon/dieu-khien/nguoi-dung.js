// =============================================================================
// Bộ điều khiển NGƯỜI DÙNG (quản lý tài khoản - chỉ dành cho admin)
// =============================================================================
// Thư viện mã hóa (hash) mật khẩu trước khi lưu vào CSDL
const bcrypt = require("bcryptjs");
// Pool kết nối MySQL dùng chung cho toàn ứng dụng
const { pool } = require("../cau-hinh/ket-noi-db");
// Hàm bọc (wrapper) handler bất đồng bộ để tự động bắt lỗi, chuyển sang middleware xử lý lỗi
const batLoi = require("../tien-ich/bat-loi-bat-dong-bo");

// Các vai trò hợp lệ trong hệ thống
const VAI_TRO_HOP_LE = ["admin", "quan_ly", "thu_ngan", "nhan_vien_kho"];

// [GET] /api/nguoi-dung - Lấy danh sách tài khoản (không trả về mật khẩu)
const layDanhSach = batLoi(async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, ten_dang_nhap, ho_ten, vai_tro, trang_thai, ngay_tao FROM nguoi_dung ORDER BY id DESC"
  );
  res.json({ thanh_cong: true, du_lieu: rows });
});

// [POST] /api/nguoi-dung - Thêm tài khoản mới
const them = batLoi(async (req, res) => {
  // Lấy dữ liệu tài khoản từ body request
  const { ten_dang_nhap, mat_khau, ho_ten, vai_tro, trang_thai } = req.body;
  // Bắt buộc phải có tên đăng nhập và mật khẩu
  if (!ten_dang_nhap || !mat_khau) {
    return res
      .status(400)
      .json({ thanh_cong: false, thong_bao: "Vui lòng nhập tên đăng nhập và mật khẩu" });
  }
  // Mật khẩu phải có ít nhất 6 ký tự
  if (mat_khau.length < 6) {
    return res.status(400).json({ thanh_cong: false, thong_bao: "Mật khẩu phải có ít nhất 6 ký tự" });
  }
  // Mặc định vai trò là 'thu_ngan' nếu không truyền lên
  const vaiTro = vai_tro || "thu_ngan";
  // Chỉ chấp nhận vai trò nằm trong danh sách hợp lệ
  if (!VAI_TRO_HOP_LE.includes(vaiTro)) {
    return res.status(400).json({ thanh_cong: false, thong_bao: "Vai trò không hợp lệ" });
  }
  // Mã hóa mật khẩu với bcrypt (10 vòng salt) trước khi lưu
  const matKhauMaHoa = await bcrypt.hash(mat_khau, 10);
  // Thêm bản ghi tài khoản mới; trang_thai mặc định = 1 (kích hoạt) nếu không gửi (dùng ?? để giữ giá trị 0)
  const [kq] = await pool.query(
    "INSERT INTO nguoi_dung (ten_dang_nhap, mat_khau, ho_ten, vai_tro, trang_thai) VALUES (?, ?, ?, ?, ?)",
    [ten_dang_nhap, matKhauMaHoa, ho_ten || null, vaiTro, trang_thai ?? 1]
  );
  // Trả về id của bản ghi vừa tạo
  res.status(201).json({ thanh_cong: true, du_lieu: { id: kq.insertId } });
});

// [PUT] /api/nguoi-dung/:id - Cập nhật tài khoản
const capNhat = batLoi(async (req, res) => {
  // Lấy thông tin cần cập nhật từ body request
  const { ho_ten, vai_tro, trang_thai, mat_khau } = req.body;

  // Bắt buộc gửi vai trò hợp lệ -> tránh vô tình hạ quyền admin/quản lý về 'thu_ngan'
  // khi payload thiếu trường vai_tro
  if (!VAI_TRO_HOP_LE.includes(vai_tro)) {
    return res.status(400).json({ thanh_cong: false, thong_bao: "Vai trò không hợp lệ" });
  }

  // Cập nhật thông tin cơ bản (họ tên, vai trò, trạng thái); ?? 1 để giữ được trạng_thai = 0
  await pool.query(
    "UPDATE nguoi_dung SET ho_ten = ?, vai_tro = ?, trang_thai = ? WHERE id = ?",
    [ho_ten || null, vai_tro, trang_thai ?? 1, req.params.id]
  );

  // Chỉ cập nhật mật khẩu khi người dùng nhập mật khẩu mới
  if (mat_khau) {
    // Mật khẩu mới (nếu có) cũng phải đủ tối thiểu 6 ký tự
    if (mat_khau.length < 6) {
      return res.status(400).json({ thanh_cong: false, thong_bao: "Mật khẩu phải có ít nhất 6 ký tự" });
    }
    // Mã hóa mật khẩu mới rồi cập nhật riêng để tránh ghi đè mật khẩu cũ bằng giá trị rỗng
    const matKhauMaHoa = await bcrypt.hash(mat_khau, 10);
    await pool.query("UPDATE nguoi_dung SET mat_khau = ? WHERE id = ?", [matKhauMaHoa, req.params.id]);
  }

  res.json({ thanh_cong: true, thong_bao: "Cập nhật tài khoản thành công" });
});

// [DELETE] /api/nguoi-dung/:id - Xóa tài khoản
const xoa = batLoi(async (req, res) => {
  // Không cho phép tự xóa tài khoản đang đăng nhập (req.nguoiDung do middleware xác thực gắn vào)
  if (Number(req.params.id) === req.nguoiDung.id) {
    return res
      .status(400)
      .json({ thanh_cong: false, thong_bao: "Không thể xóa chính tài khoản đang đăng nhập" });
  }
  // Xóa tài khoản theo id
  await pool.query("DELETE FROM nguoi_dung WHERE id = ?", [req.params.id]);
  res.json({ thanh_cong: true, thong_bao: "Xóa tài khoản thành công" });
});

// Xuất các handler để router gắn vào các route tương ứng
module.exports = { layDanhSach, them, capNhat, xoa };
