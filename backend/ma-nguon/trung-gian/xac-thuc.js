// =============================================================================
// Phần mềm trung gian (middleware) xác thực và phân quyền dựa trên JWT
// =============================================================================
// Thư viện jsonwebtoken: dùng để ký (sign) và giải mã/kiểm tra (verify) token JWT
const jwt = require("jsonwebtoken");

// Khóa bí mật để ký và xác thực JWT; ưu tiên lấy từ biến môi trường, nếu không có thì dùng giá trị mặc định
const JWT_SECRET = process.env.JWT_SECRET || "secret_mac_dinh";

// Kiểm tra người dùng đã đăng nhập chưa (token có hợp lệ không)
function xacThucToken(req, res, next) {
  // Lấy chuỗi trong header Authorization theo định dạng "Bearer <token>"
  const header = req.headers.authorization || "";
  // Cắt bỏ tiền tố "Bearer " (7 ký tự) để lấy phần token; nếu sai định dạng thì gán null
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  // Không có token -> chưa đăng nhập, trả về lỗi 401 (Unauthorized)
  if (!token) {
    return res.status(401).json({ thanh_cong: false, thong_bao: "Bạn chưa đăng nhập" });
  }

  try {
    // Giải mã token, lưu thông tin người dùng vào request để dùng ở các bước sau
    const payload = jwt.verify(token, JWT_SECRET);
    // Token KHÁCH HÀNG (loai='khach') KHÔNG được dùng cho các API hệ thống quản trị
    // -> tránh khách hàng đọc dữ liệu nội bộ (danh sách khách, báo cáo...)
    if (payload.loai === "khach") {
      return res
        .status(403)
        .json({ thanh_cong: false, thong_bao: "Bạn không có quyền truy cập hệ thống quản lý" });
    }
    // Gắn thông tin người dùng (đã giải mã) vào request để các middleware/route sau dùng lại
    req.nguoiDung = payload;
    next();
  } catch (e) {
    // jwt.verify ném lỗi khi token sai chữ ký hoặc đã hết hạn -> báo phiên không hợp lệ
    return res
      .status(401)
      .json({ thanh_cong: false, thong_bao: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" });
  }
}

// Chỉ cho phép tài khoản có vai trò admin đi tiếp
function chiAdmin(req, res, next) {
  // Dùng optional chaining (?.) phòng trường hợp req.nguoiDung chưa được gán; chặn nếu không phải admin
  if (req.nguoiDung?.vai_tro !== "admin") {
    return res
      .status(403)
      .json({ thanh_cong: false, thong_bao: "Bạn không có quyền thực hiện thao tác này" });
  }
  next();
}

// Cho phép một số vai trò cụ thể (admin luôn luôn được phép)
// Ví dụ: choPhep('quan_ly', 'nhan_vien_kho')
function choPhep(...dsVaiTro) {
  // Trả về một middleware: nhận danh sách vai trò được phép qua tham số rest (...dsVaiTro)
  return (req, res, next) => {
    const vaiTro = req.nguoiDung?.vai_tro;
    // admin luôn được qua; các vai trò khác chỉ qua khi nằm trong danh sách cho phép
    if (vaiTro === "admin" || dsVaiTro.includes(vaiTro)) return next();
    return res
      .status(403)
      .json({ thanh_cong: false, thong_bao: "Bạn không có quyền thực hiện thao tác này" });
  };
}

// Xác thực KHÁCH HÀNG (web bán hàng) - token có loai = 'khach'
function xacThucKhach(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ thanh_cong: false, thong_bao: "Vui lòng đăng nhập để tiếp tục" });
  }
  try {
    // Giải mã token và bắt buộc loai phải là 'khach'; nếu không thì ném lỗi để rơi vào catch
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.loai !== "khach") throw new Error("Sai loại tài khoản");
    // Gắn thông tin khách hàng vào request (req.khach) để route bán hàng sử dụng
    req.khach = payload;
    next();
  } catch (e) {
    return res
      .status(401)
      .json({ thanh_cong: false, thong_bao: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" });
  }
}

// Xuất các middleware xác thực/phân quyền và khóa bí mật để các module khác (route, controller) dùng chung
module.exports = { xacThucToken, chiAdmin, choPhep, xacThucKhach, JWT_SECRET };
