// =============================================================================
// Bộ điều khiển CỬA HÀNG (web bán hàng cho khách)
//  - API công khai: xem sản phẩm, danh mục (không cần đăng nhập)
//  - Tài khoản khách: đăng ký, đăng nhập, đặt hàng, xem đơn của mình
//  - Đồng bộ chung bảng khach_hang & don_hang với hệ thống quản lý
// =============================================================================
// --- Khai báo thư viện & module phụ thuộc ---
const bcrypt = require("bcryptjs"); // Băm & so khớp mật khẩu (hash)
const jwt = require("jsonwebtoken"); // Tạo & ký token JWT cho phiên đăng nhập
const { pool } = require("../cau-hinh/ket-noi-db"); // Pool kết nối MySQL dùng chung
const { JWT_SECRET } = require("../trung-gian/xac-thuc"); // Khóa bí mật để ký/verify JWT
const batLoi = require("../tien-ich/bat-loi-bat-dong-bo");
// Tiện ích ràng buộc: kiểm tra định dạng email / số điện thoại
const { kiemTraEmail, kiemTraDienThoai } = require("../tien-ich/kiem-tra"); // Wrapper bắt lỗi cho hàm async (tránh lặp try/catch)

// Tạo token cho khách hàng
// Payload gắn loai:"khach" để phân biệt với token nhân viên/quản trị; token hết hạn sau JWT_EXPIRES_IN (mặc định 7 ngày)
function taoToken(kh) {
  return jwt.sign({ id: kh.id, loai: "khach", ho_ten: kh.ho_ten }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// [GET] /api/cua-hang/san-pham - Danh sách sản phẩm (công khai)
const dsSanPham = batLoi(async (req, res) => {
  // Lấy bộ lọc từ query string: tu_khoa (tìm theo tên/thương hiệu), danh_muc_id (lọc theo danh mục)
  const { tu_khoa, danh_muc_id } = req.query;
  // WHERE 1 = 1: mẹo để nối thêm các điều kiện "AND ..." động mà không cần xử lý dấu nối đầu tiên
  let sql = `
    SELECT sp.id, sp.ten_san_pham, sp.thuong_hieu, sp.gia_ban, sp.so_luong_ton,
           sp.don_vi, sp.mo_ta, sp.hinh_anh, sp.danh_muc_id, dm.ten_danh_muc
    FROM san_pham sp
    LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
    WHERE 1 = 1`;
  const params = []; // Tham số ràng buộc (?) — luôn dùng prepared statement để chống SQL injection
  // Tìm kiếm gần đúng theo tên hoặc thương hiệu (dùng LIKE với %...%)
  if (tu_khoa) {
    sql += " AND (sp.ten_san_pham LIKE ? OR sp.thuong_hieu LIKE ?)";
    params.push(`%${tu_khoa}%`, `%${tu_khoa}%`);
  }
  // Lọc theo danh mục nếu có truyền vào
  if (danh_muc_id) {
    sql += " AND sp.danh_muc_id = ?";
    params.push(danh_muc_id);
  }
  sql += " ORDER BY sp.id DESC"; // Sản phẩm mới nhất lên đầu
  const [rows] = await pool.query(sql, params);
  res.json({ thanh_cong: true, du_lieu: rows });
});

// [GET] /api/cua-hang/san-pham/:id - Chi tiết sản phẩm (công khai)
const chiTietSanPham = batLoi(async (req, res) => {
  // Lấy đầy đủ thông tin 1 sản phẩm kèm tên danh mục & tên nhà cung cấp (JOIN)
  const [rows] = await pool.query(
    `SELECT sp.*, dm.ten_danh_muc, ncc.ten_ncc
     FROM san_pham sp
     LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
     LEFT JOIN nha_cung_cap ncc ON sp.nha_cung_cap_id = ncc.id
     WHERE sp.id = ?`,
    [req.params.id]
  );
  // Không có dòng nào -> sản phẩm không tồn tại
  if (rows.length === 0) {
    return res.status(404).json({ thanh_cong: false, thong_bao: "Không tìm thấy sản phẩm" });
  }
  res.json({ thanh_cong: true, du_lieu: rows[0] });
});

// [GET] /api/cua-hang/danh-muc - Danh mục (công khai)
const dsDanhMuc = batLoi(async (req, res) => {
  const [rows] = await pool.query("SELECT id, ten_danh_muc FROM danh_muc ORDER BY id ASC");
  res.json({ thanh_cong: true, du_lieu: rows });
});

// [POST] /api/cua-hang/dang-ky - Đăng ký tài khoản khách
// Ràng buộc như web thật: nếu email/SĐT đã có TÀI KHOẢN thì BÁO TRÙNG (không ghi đè).
// Nếu là hồ sơ khách do cửa hàng tạo mà chưa có mật khẩu -> gắn tài khoản vào hồ sơ đó.
const dangKy = batLoi(async (req, res) => {
  const { ho_ten, dien_thoai, email, mat_khau, dia_chi } = req.body;
  // Bắt buộc có họ tên, mật khẩu và ít nhất một định danh liên hệ (SĐT hoặc email)
  if (!ho_ten || !mat_khau || (!dien_thoai && !email)) {
    return res.status(400).json({
      thanh_cong: false,
      thong_bao: "Vui lòng nhập họ tên, mật khẩu và số điện thoại (hoặc email)",
    });
  }
  // Yêu cầu mật khẩu tối thiểu 6 ký tự
  if (mat_khau.length < 6) {
    return res.status(400).json({ thanh_cong: false, thong_bao: "Mật khẩu phải có ít nhất 6 ký tự" });
  }
  // Kiểm tra định dạng email / số điện thoại (nếu có nhập) -> ném lỗi 400 nếu sai
  if (email) kiemTraEmail(email);
  if (dien_thoai) kiemTraDienThoai(dien_thoai);

  const hash = await bcrypt.hash(mat_khau, 10); // Băm mật khẩu với 10 vòng salt trước khi lưu (không lưu plaintext)

  // Bọc toàn bộ "kiểm tra trùng -> ghi" trong 1 transaction để 2 request đồng thời
  // không cùng vượt qua bước kiểm tra rồi tạo tài khoản trùng (race condition)
  const conn = await pool.getConnection(); // Mượn 1 kết nối riêng để chạy transaction
  try {
    await conn.beginTransaction(); // Bắt đầu transaction

    // Kiểm tra TRÙNG tài khoản đã đăng ký (đã có mật khẩu)
    if (email) {
      const [e] = await conn.query("SELECT id FROM khach_hang WHERE email = ? AND mat_khau IS NOT NULL LIMIT 1", [email]);
      if (e.length) throw Object.assign(new Error("Email này đã được đăng ký. Vui lòng đăng nhập."), { status: 409 });
    }
    if (dien_thoai) {
      const [p] = await conn.query("SELECT id FROM khach_hang WHERE dien_thoai = ? AND mat_khau IS NOT NULL LIMIT 1", [dien_thoai]);
      if (p.length) throw Object.assign(new Error("Số điện thoại này đã được đăng ký. Vui lòng đăng nhập."), { status: 409 });
    }

    // Hồ sơ khách do cửa hàng tạo nhưng CHƯA có mật khẩu -> gắn tài khoản vào hồ sơ đó.
    // Ưu tiên khớp theo EMAIL trước, sau đó mới tới SĐT (tránh khớp nhầm hồ sơ của khách khác).
    let hoSoId = null;
    if (email) {
      const [r] = await conn.query("SELECT id FROM khach_hang WHERE email = ? AND mat_khau IS NULL LIMIT 1 FOR UPDATE", [email]);
      if (r.length) hoSoId = r[0].id;
    }
    if (!hoSoId && dien_thoai) {
      const [r] = await conn.query("SELECT id FROM khach_hang WHERE dien_thoai = ? AND mat_khau IS NULL LIMIT 1 FOR UPDATE", [dien_thoai]);
      if (r.length) hoSoId = r[0].id;
    }

    let id;
    if (hoSoId) {
      // Trường hợp 1: gắn tài khoản vào hồ sơ khách có sẵn (do cửa hàng tạo, chưa có mật khẩu)
      id = hoSoId;
      // COALESCE(NULLIF(?, ''), cot): chỉ ghi đè khi giá trị mới khác rỗng, ngược lại giữ nguyên dữ liệu cũ
      await conn.query(
        "UPDATE khach_hang SET ho_ten = ?, mat_khau = ?, dia_chi = COALESCE(NULLIF(?, ''), dia_chi), email = COALESCE(NULLIF(?, ''), email), dien_thoai = COALESCE(NULLIF(?, ''), dien_thoai) WHERE id = ?",
        [ho_ten, hash, dia_chi || "", email || "", dien_thoai || "", id]
      );
    } else {
      // Trường hợp 2: khách hoàn toàn mới -> tạo bản ghi khach_hang mới
      const [kq] = await conn.query(
        "INSERT INTO khach_hang (ho_ten, dien_thoai, email, mat_khau, dia_chi) VALUES (?, ?, ?, ?, ?)",
        [ho_ten, dien_thoai || null, email || null, hash, dia_chi || null]
      );
      id = kq.insertId; // Lấy id vừa tạo
    }

    await conn.commit(); // Mọi bước thành công -> lưu vĩnh viễn
    // Đăng ký xong cấp luôn token để khách đăng nhập ngay
    res.status(201).json({
      thanh_cong: true,
      du_lieu: { token: taoToken({ id, ho_ten }), khach: { id, ho_ten } },
    });
  } catch (e) {
    await conn.rollback(); // Có lỗi -> hủy toàn bộ thay đổi của transaction
    throw e; // Ném lại để middleware bắt lỗi xử lý (trả status phù hợp)
  } finally {
    conn.release(); // Luôn trả kết nối về pool dù thành công hay lỗi
  }
});

// [POST] /api/cua-hang/dang-nhap - Đăng nhập (bằng email hoặc SĐT)
const dangNhap = batLoi(async (req, res) => {
  const { tai_khoan, mat_khau } = req.body; // tai_khoan = email hoặc SĐT
  // Bắt buộc nhập đủ tài khoản và mật khẩu
  if (!tai_khoan || !mat_khau) {
    return res.status(400).json({ thanh_cong: false, thong_bao: "Vui lòng nhập tài khoản và mật khẩu" });
  }
  // Tìm khách theo email HOẶC SĐT, và chỉ lấy tài khoản đã đặt mật khẩu (mat_khau IS NOT NULL)
  const [rows] = await pool.query(
    "SELECT * FROM khach_hang WHERE (email = ? OR dien_thoai = ?) AND mat_khau IS NOT NULL LIMIT 1",
    [tai_khoan, tai_khoan]
  );
  // Dùng CHUNG một thông báo cho cả 2 trường hợp (sai tài khoản / sai mật khẩu)
  // để tránh kẻ xấu dò xem email/SĐT nào đã đăng ký (account enumeration)
  const LOI_DANG_NHAP = "Tài khoản hoặc mật khẩu không đúng";
  if (rows.length === 0) {
    return res.status(401).json({ thanh_cong: false, thong_bao: LOI_DANG_NHAP });
  }
  const kh = rows[0];
  const dung = await bcrypt.compare(mat_khau, kh.mat_khau); // So khớp mật khẩu nhập với hash đã lưu
  if (!dung) {
    return res.status(401).json({ thanh_cong: false, thong_bao: LOI_DANG_NHAP });
  }
  // Đăng nhập thành công -> trả token và thông tin cơ bản của khách
  res.json({
    thanh_cong: true,
    du_lieu: {
      token: taoToken(kh),
      khach: { id: kh.id, ho_ten: kh.ho_ten, dien_thoai: kh.dien_thoai, email: kh.email, dia_chi: kh.dia_chi },
    },
  });
});

// [GET] /api/cua-hang/toi - Thông tin khách đang đăng nhập
const thongTin = batLoi(async (req, res) => {
  // req.khach.id do middleware xác thực gắn vào sau khi giải mã token
  const [rows] = await pool.query(
    "SELECT id, ho_ten, dien_thoai, email, dia_chi, diem_tich_luy FROM khach_hang WHERE id = ?",
    [req.khach.id]
  );
  res.json({ thanh_cong: true, du_lieu: rows[0] });
});

// [POST] /api/cua-hang/dat-hang - Khách đặt hàng (cần đăng nhập)
const datHang = batLoi(async (req, res) => {
  const { danh_sach_san_pham, dia_chi_giao, ghi_chu, phuong_thuc_thanh_toan } = req.body;
  // Giỏ hàng phải là mảng và có ít nhất 1 sản phẩm
  if (!Array.isArray(danh_sach_san_pham) || danh_sach_san_pham.length === 0) {
    return res.status(400).json({ thanh_cong: false, thong_bao: "Giỏ hàng đang trống" });
  }

  const conn = await pool.getConnection(); // Mượn kết nối cho transaction đặt hàng
  try {
    await conn.beginTransaction(); // Bắt đầu: kiểm kho, tạo đơn, trừ kho phải cùng thành/cùng bại

    let tongTien = 0; // Cộng dồn tổng tiền của đơn
    const chiTiet = []; // Gom dòng chi tiết hợp lệ để chèn sau khi kiểm tra xong
    for (const item of danh_sach_san_pham) {
      // Số lượng phải là số nguyên dương (chặn số âm/0 làm tăng kho ngược & tiền âm)
      const soLuong = Number(item.so_luong);
      if (!Number.isInteger(soLuong) || soLuong <= 0) {
        throw Object.assign(new Error("Số lượng sản phẩm không hợp lệ"), { status: 400 });
      }
      // FOR UPDATE: khóa dòng sản phẩm trong transaction để tránh 2 đơn cùng mua hết tồn kho (oversell)
      const [sp] = await conn.query(
        "SELECT id, ten_san_pham, gia_ban, so_luong_ton FROM san_pham WHERE id = ? FOR UPDATE",
        [item.san_pham_id]
      );
      // Sản phẩm không tồn tại trong CSDL
      if (sp.length === 0) {
        throw Object.assign(new Error(`Sản phẩm #${item.san_pham_id} không tồn tại`), { status: 400 });
      }
      // Tồn kho không đủ để đáp ứng số lượng đặt
      if (sp[0].so_luong_ton < soLuong) {
        throw Object.assign(
          new Error(`Sản phẩm "${sp[0].ten_san_pham}" không đủ hàng (còn ${sp[0].so_luong_ton})`),
          { status: 400 }
        );
      }
      const thanhTien = Number(sp[0].gia_ban) * soLuong; // Thành tiền 1 dòng = giá bán x số lượng
      tongTien += thanhTien;
      chiTiet.push({ san_pham_id: sp[0].id, so_luong: soLuong, don_gia: sp[0].gia_ban, thanh_tien: thanhTien });
    }

    const maDon = "WEB" + Date.now(); // Mã đơn online: tiền tố WEB + timestamp để đảm bảo duy nhất
    // Gộp địa chỉ giao vào ghi chú đơn (vì đơn web không có cột địa chỉ riêng)
    const ghiChuDay = (dia_chi_giao ? `Giao tới: ${dia_chi_giao}. ` : "") + (ghi_chu || "");

    // Đơn online: nguoi_dung_id = NULL, trạng thái 'cho_xu_ly' (chờ cửa hàng xác nhận)
    const [kqDon] = await conn.query(
      `INSERT INTO don_hang
       (ma_don, khach_hang_id, nguoi_dung_id, tong_tien, giam_gia, thanh_tien, phuong_thuc_thanh_toan, trang_thai, ghi_chu)
       VALUES (?, ?, NULL, ?, 0, ?, ?, 'cho_xu_ly', ?)`,
      [maDon, req.khach.id, tongTien, tongTien, phuong_thuc_thanh_toan || "tien_mat", ghiChuDay || null]
    );
    const donId = kqDon.insertId; // Id đơn vừa tạo để gắn cho các dòng chi tiết

    // Ghi từng dòng chi tiết và trừ tồn kho tương ứng
    for (const ct of chiTiet) {
      await conn.query(
        "INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien) VALUES (?, ?, ?, ?, ?)",
        [donId, ct.san_pham_id, ct.so_luong, ct.don_gia, ct.thanh_tien]
      );
      // Trừ kho ngay khi đặt (đã khóa dòng ở bước SELECT ... FOR UPDATE phía trên)
      await conn.query("UPDATE san_pham SET so_luong_ton = so_luong_ton - ? WHERE id = ?", [
        ct.so_luong,
        ct.san_pham_id,
      ]);
    }

    // Cập nhật địa chỉ giao cho khách (nếu có)
    if (dia_chi_giao) {
      await conn.query("UPDATE khach_hang SET dia_chi = ? WHERE id = ?", [dia_chi_giao, req.khach.id]);
    }

    await conn.commit(); // Hoàn tất: lưu đơn + chi tiết + tồn kho mới
    res.status(201).json({ thanh_cong: true, du_lieu: { ma_don: maDon, thanh_tien: tongTien } });
  } catch (e) {
    await conn.rollback(); // Lỗi giữa chừng -> hoàn tác tất cả (không tạo đơn lỗi, không trừ kho sai)
    throw e;
  } finally {
    conn.release(); // Trả kết nối về pool
  }
});

// [GET] /api/cua-hang/don-hang-cua-toi - Lịch sử đơn hàng của khách
const donHangCuaToi = batLoi(async (req, res) => {
  // Lấy tất cả đơn của khách đang đăng nhập, mới nhất trước
  const [dons] = await pool.query(
    "SELECT * FROM don_hang WHERE khach_hang_id = ? ORDER BY id DESC",
    [req.khach.id]
  );
  // Lấy chi tiết cho từng đơn
  for (const d of dons) {
    const [ct] = await pool.query(
      `SELECT ct.*, sp.ten_san_pham, sp.hinh_anh
       FROM chi_tiet_don_hang ct LEFT JOIN san_pham sp ON ct.san_pham_id = sp.id
       WHERE ct.don_hang_id = ?`,
      [d.id]
    );
    d.chi_tiet = ct; // Gắn danh sách chi tiết vào từng đơn trả về
  }
  res.json({ thanh_cong: true, du_lieu: dons });
});

// [PUT] /api/cua-hang/toi - Khách cập nhật thông tin cá nhân
const capNhatThongTin = batLoi(async (req, res) => {
  const { ho_ten, dien_thoai, email, dia_chi, mat_khau } = req.body;
  // Họ tên là trường bắt buộc
  if (!ho_ten) {
    return res.status(400).json({ thanh_cong: false, thong_bao: "Họ tên không được để trống" });
  }
  // Kiểm tra định dạng email / số điện thoại (nếu có nhập)
  if (email) kiemTraEmail(email);
  if (dien_thoai) kiemTraDienThoai(dien_thoai);
  // Cập nhật thông tin liên hệ cơ bản
  await pool.query(
    "UPDATE khach_hang SET ho_ten = ?, dien_thoai = ?, email = ?, dia_chi = ? WHERE id = ?",
    [ho_ten, dien_thoai || null, email || null, dia_chi || null, req.khach.id]
  );
  // Nếu nhập mật khẩu mới thì đổi (băm lại trước khi lưu)
  if (mat_khau) {
    const hash = await bcrypt.hash(mat_khau, 10);
    await pool.query("UPDATE khach_hang SET mat_khau = ? WHERE id = ?", [hash, req.khach.id]);
  }
  const [rows] = await pool.query(
    "SELECT id, ho_ten, dien_thoai, email, dia_chi, diem_tich_luy FROM khach_hang WHERE id = ?",
    [req.khach.id]
  );
  res.json({ thanh_cong: true, du_lieu: rows[0], thong_bao: "Đã cập nhật thông tin cá nhân" });
});

// [PUT] /api/cua-hang/don-hang/:id/huy - Khách YÊU CẦU HỦY đơn (cửa hàng sẽ duyệt)
// Chỉ được yêu cầu hủy khi đơn chưa giao (chờ xử lý / đã xác nhận)
const yeuCauHuy = batLoi(async (req, res) => {
  // Kiểm tra đơn có tồn tại và đúng là của khách này (chống hủy đơn người khác)
  const [rows] = await pool.query(
    "SELECT trang_thai FROM don_hang WHERE id = ? AND khach_hang_id = ?",
    [req.params.id, req.khach.id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ thanh_cong: false, thong_bao: "Không tìm thấy đơn hàng của bạn" });
  }
  // Chỉ cho yêu cầu hủy khi đơn còn ở trạng thái chờ xử lý hoặc đã xác nhận (chưa giao)
  if (!["cho_xu_ly", "da_xac_nhan"].includes(rows[0].trang_thai)) {
    return res
      .status(400)
      .json({ thanh_cong: false, thong_bao: "Đơn đang giao hoặc đã xử lý xong, không thể hủy" });
  }
  // Đặt trạng thái 'yeu_cau_huy' để cửa hàng duyệt (chưa tự động hoàn kho ở bước này)
  await pool.query("UPDATE don_hang SET trang_thai = 'yeu_cau_huy' WHERE id = ?", [req.params.id]);
  res.json({ thanh_cong: true, thong_bao: "Đã gửi yêu cầu hủy. Cửa hàng sẽ duyệt sớm." });
});

// Xuất các hàm xử lý để định tuyến (router) gọi tới
module.exports = {
  dsSanPham, chiTietSanPham, dsDanhMuc,
  dangKy, dangNhap, thongTin, datHang, donHangCuaToi,
  capNhatThongTin, yeuCauHuy,
};
