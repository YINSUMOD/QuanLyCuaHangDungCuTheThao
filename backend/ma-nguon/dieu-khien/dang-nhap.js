// =============================================================================
// Bộ điều khiển XÁC THỰC: đăng nhập và lấy thông tin tài khoản hiện tại
// =============================================================================
const bcrypt = require("bcryptjs"); // Thư viện băm/so sánh mật khẩu (hash) an toàn
const jwt = require("jsonwebtoken"); // Thư viện tạo và xác thực JWT (token đăng nhập)
const { pool } = require("../cau-hinh/ket-noi-db"); // Pool kết nối CSDL MySQL dùng chung
const { JWT_SECRET } = require("../trung-gian/xac-thuc"); // Khóa bí mật để ký JWT
const batLoi = require("../tien-ich/bat-loi-bat-dong-bo"); // Wrapper bắt lỗi cho hàm async, tự chuyển lỗi sang middleware xử lý lỗi

// [POST] /api/auth/login - Đăng nhập hệ thống
const dangNhap = batLoi(async (req, res) => {
  // Lấy tên đăng nhập và mật khẩu từ body của yêu cầu
  const { ten_dang_nhap, mat_khau } = req.body;

  // Kiểm tra dữ liệu đầu vào: bắt buộc phải nhập đủ hai trường
  if (!ten_dang_nhap || !mat_khau) {
    return res
      .status(400)
      .json({ thanh_cong: false, thong_bao: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu" });
  }

  // Tìm tài khoản còn hoạt động (trang_thai = 1 nghĩa là chưa bị khóa)
  // Dùng tham số "?" (prepared statement) để tránh tấn công SQL Injection
  const [rows] = await pool.query(
    "SELECT * FROM nguoi_dung WHERE ten_dang_nhap = ? AND trang_thai = 1",
    [ten_dang_nhap]
  );
  // Không tìm thấy bản ghi nào: tài khoản không tồn tại hoặc đã bị khóa
  if (rows.length === 0) {
    return res
      .status(401)
      .json({ thanh_cong: false, thong_bao: "Tài khoản không tồn tại hoặc đã bị khóa" });
  }

  // Lấy bản ghi người dùng đầu tiên tìm được
  const nd = rows[0];

  // So sánh mật khẩu nhập vào với mật khẩu đã băm (hash) lưu trong CSDL
  const dungMatKhau = await bcrypt.compare(mat_khau, nd.mat_khau);
  // Mật khẩu không khớp: trả về lỗi 401 (chưa xác thực)
  if (!dungMatKhau) {
    return res.status(401).json({ thanh_cong: false, thong_bao: "Mật khẩu không chính xác" });
  }

  // Tạo JWT chứa thông tin cơ bản của người dùng (id, loại, vai trò...) để client gửi kèm các request sau
  const token = jwt.sign(
    // Phần payload: dữ liệu được nhúng vào token (vai_tro dùng cho phân quyền)
    { id: nd.id, loai: "nhan_vien", ten_dang_nhap: nd.ten_dang_nhap, vai_tro: nd.vai_tro, ho_ten: nd.ho_ten },
    JWT_SECRET, // Khóa bí mật dùng để ký token
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" } // Thời hạn token, mặc định 1 ngày nếu không cấu hình
  );

  // Trả token và thông tin người dùng cho client
  res.json({
    thanh_cong: true,
    du_lieu: {
      token,
      nguoi_dung: { id: nd.id, ten_dang_nhap: nd.ten_dang_nhap, ho_ten: nd.ho_ten, vai_tro: nd.vai_tro },
    },
  });
});

// [GET] /api/auth/me - Lấy thông tin người dùng đang đăng nhập
const thongTinCaNhan = batLoi(async (req, res) => {
  // Truy vấn thông tin người dùng theo id lấy từ token (req.nguoiDung do middleware xác thực gán)
  // Chỉ chọn các cột cần thiết, không lấy mật khẩu để đảm bảo an toàn
  const [rows] = await pool.query(
    "SELECT id, ten_dang_nhap, ho_ten, vai_tro FROM nguoi_dung WHERE id = ?",
    [req.nguoiDung.id]
  );
  // Trả về thông tin tài khoản hiện tại
  res.json({ thanh_cong: true, du_lieu: rows[0] });
});

// Xuất các hàm điều khiển để router định tuyến (định nghĩa endpoint) sử dụng
module.exports = { dangNhap, thongTinCaNhan };
