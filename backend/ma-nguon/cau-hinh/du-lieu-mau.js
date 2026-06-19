// =============================================================================
// FILE: du-lieu-mau.js
// VAI TRÒ: Seed (tạo dữ liệu mẫu) cho hệ thống quản lý cửa hàng dụng cụ thể thao.
//   - Tạo sẵn các tài khoản người dùng mặc định (admin, quản lý, thu ngân, kho)
//     khi hệ thống khởi động lần đầu để có thể đăng nhập demo ngay.
//   - Đặt mật khẩu mặc định cho các khách hàng có sẵn nhằm demo web bán hàng.
// LƯU Ý: Mật khẩu luôn được băm (hash) bằng bcrypt trước khi lưu vào CSDL.
// =============================================================================
// thư viện băm/đối chiếu mật khẩu (one-way hash, an toàn hơn lưu plaintext)
const bcrypt = require("bcryptjs");
// pool kết nối MySQL dùng chung để chạy truy vấn
const { pool } = require("./ket-noi-db");

// Hàm tạo các tài khoản nhân sự mặc định nếu chúng chưa tồn tại trong bảng nguoi_dung
async function taoTaiKhoanMacDinh() {
  // Danh sách tài khoản mặc định để đăng nhập demo (4 vai trò của cửa hàng)
  const danhSach = [
    { ten_dang_nhap: "admin",    mat_khau: "admin123",    ho_ten: "Quản trị viên",       vai_tro: "admin" },
    { ten_dang_nhap: "quanly",   mat_khau: "quanly123",   ho_ten: "Trần Văn Quản Lý",    vai_tro: "quan_ly" },
    { ten_dang_nhap: "nhanvien", mat_khau: "nhanvien123", ho_ten: "Lê Thị Thu Ngân",     vai_tro: "thu_ngan" },
    { ten_dang_nhap: "nhankho",  mat_khau: "nhankho123",  ho_ten: "Phạm Văn Kho",        vai_tro: "nhan_vien_kho" },
  ];

  // Duyệt từng tài khoản trong danh sách để kiểm tra và tạo nếu cần
  for (const tk of danhSach) {
    // Kiểm tra tài khoản đã tồn tại hay chưa (tránh tạo trùng)
    // Dùng tham số ? (prepared statement) để chống SQL injection
    const [rows] = await pool.query(
      "SELECT id FROM nguoi_dung WHERE ten_dang_nhap = ?",
      [tk.ten_dang_nhap]
    );
    // Chỉ tạo mới khi chưa có bản ghi nào trùng tên đăng nhập
    if (rows.length === 0) {
      // Băm mật khẩu với cost factor = 10 trước khi lưu (không lưu mật khẩu thô)
      const matKhauMaHoa = await bcrypt.hash(tk.mat_khau, 10); // mã hóa mật khẩu
      // Thêm tài khoản mới vào bảng nguoi_dung
      await pool.query(
        "INSERT INTO nguoi_dung (ten_dang_nhap, mat_khau, ho_ten, vai_tro) VALUES (?, ?, ?, ?)",
        [tk.ten_dang_nhap, matKhauMaHoa, tk.ho_ten, tk.vai_tro]
      );
      console.log(`✅ Đã tạo tài khoản mặc định: ${tk.ten_dang_nhap} / ${tk.mat_khau}`);
    }
  }
}

// Đặt mật khẩu mặc định cho các khách hàng có sẵn (để demo đăng nhập web bán hàng)
// Khách đăng nhập bằng email/SĐT + mật khẩu: khach123
async function taoMatKhauKhachMacDinh() {
  // Kiểm tra xem còn khách hàng nào chưa có mật khẩu hay không (chỉ cần 1 bản ghi để biết)
  const [rows] = await pool.query("SELECT id FROM khach_hang WHERE mat_khau IS NULL LIMIT 1");
  // Nếu tồn tại khách chưa có mật khẩu thì tiến hành đặt mật khẩu mặc định cho tất cả
  if (rows.length > 0) {
    // Băm mật khẩu mặc định "khach123" trước khi cập nhật
    const hash = await bcrypt.hash("khach123", 10);
    // Cập nhật mật khẩu cho mọi khách hàng đang để trống (mat_khau IS NULL)
    await pool.query("UPDATE khach_hang SET mat_khau = ? WHERE mat_khau IS NULL", [hash]);
    console.log("✅ Đã đặt mật khẩu mặc định cho khách hàng có sẵn (khach123)");
  }
}

// Xuất 2 hàm seed để file khởi động server gọi khi cần tạo dữ liệu mẫu
module.exports = { taoTaiKhoanMacDinh, taoMatKhauKhachMacDinh };
