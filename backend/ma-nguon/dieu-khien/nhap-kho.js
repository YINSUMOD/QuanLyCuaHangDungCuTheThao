// =============================================================================
// Bộ điều khiển NHẬP KHO (phiếu nhập hàng từ nhà cung cấp)
// Khi tạo phiếu nhập: TĂNG tồn kho và cập nhật giá nhập (dùng transaction)
// =============================================================================
// Import "pool" kết nối MySQL (connection pool) để truy vấn CSDL
const { pool } = require("../cau-hinh/ket-noi-db");
// Import hàm bọc bắt lỗi cho route bất đồng bộ (tự chuyển lỗi tới middleware xử lý lỗi)
const batLoi = require("../tien-ich/bat-loi-bat-dong-bo");
// Tiện ích ràng buộc dữ liệu nhập (số lượng > 0, giá nhập >= 0)
const { soNguyenDuong, soKhongAm } = require("../tien-ich/kiem-tra");

// [GET] /api/nhap-kho - Danh sách phiếu nhập
// Lấy toàn bộ phiếu nhập kèm tên nhà cung cấp và tên nhân viên lập phiếu
const layDanhSach = batLoi(async (req, res) => {
  // JOIN sang nhà cung cấp và người dùng để hiển thị tên; sắp xếp phiếu mới nhất lên trước (id DESC)
  const [rows] = await pool.query(`
    SELECT pn.*, ncc.ten_ncc, nd.ho_ten AS ten_nhan_vien
    FROM phieu_nhap pn
    LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
    LEFT JOIN nguoi_dung nd ON pn.nguoi_dung_id = nd.id
    ORDER BY pn.id DESC
  `);
  res.json({ thanh_cong: true, du_lieu: rows });
});

// [GET] /api/nhap-kho/:id - Chi tiết một phiếu nhập
// Trả về thông tin phiếu nhập kèm danh sách các dòng sản phẩm trong phiếu
const layChiTiet = batLoi(async (req, res) => {
  // Lấy thông tin chung của phiếu nhập theo id (kèm tên NCC, tên nhân viên)
  const [phieu] = await pool.query(
    `SELECT pn.*, ncc.ten_ncc, nd.ho_ten AS ten_nhan_vien
     FROM phieu_nhap pn
     LEFT JOIN nha_cung_cap ncc ON pn.nha_cung_cap_id = ncc.id
     LEFT JOIN nguoi_dung nd ON pn.nguoi_dung_id = nd.id
     WHERE pn.id = ?`,
    [req.params.id]
  );
  // Không có phiếu nào khớp id -> trả về 404
  if (phieu.length === 0) {
    return res.status(404).json({ thanh_cong: false, thong_bao: "Không tìm thấy phiếu nhập" });
  }
  // Lấy các dòng chi tiết của phiếu (kèm tên sản phẩm) theo phieu_nhap_id
  const [chiTiet] = await pool.query(
    `SELECT ct.*, sp.ten_san_pham
     FROM chi_tiet_phieu_nhap ct
     LEFT JOIN san_pham sp ON ct.san_pham_id = sp.id
     WHERE ct.phieu_nhap_id = ?`,
    [req.params.id]
  );
  // Gộp thông tin phiếu và mảng chi tiết vào một đối tượng để trả về client
  res.json({ thanh_cong: true, du_lieu: { ...phieu[0], chi_tiet: chiTiet } });
});

// [POST] /api/nhap-kho - Tạo phiếu nhập mới
// Tạo phiếu nhập: tính tổng tiền, lưu phiếu + chi tiết, TĂNG tồn kho, cập nhật giá nhập (bọc trong transaction)
const taoPhieuNhap = batLoi(async (req, res) => {
  // Lấy dữ liệu từ body request
  const { nha_cung_cap_id, danh_sach_san_pham, ghi_chu } = req.body;
  // danh_sach_san_pham: [{ san_pham_id, so_luong, gia_nhap }]

  // Bắt buộc phiếu nhập phải có ít nhất một sản phẩm
  if (!Array.isArray(danh_sach_san_pham) || danh_sach_san_pham.length === 0) {
    return res
      .status(400)
      .json({ thanh_cong: false, thong_bao: "Phiếu nhập phải có ít nhất một sản phẩm" });
  }

  // Lấy 1 kết nối riêng từ pool để chạy transaction (đảm bảo các thao tác đồng nhất)
  const conn = await pool.getConnection();
  try {
    // Bắt đầu transaction: hoặc thành công toàn bộ, hoặc rollback tất cả
    await conn.beginTransaction();

    let tongTien = 0; // Tổng tiền của cả phiếu nhập
    const chiTiet = []; // Danh sách dòng chi tiết đã chuẩn hóa, dùng để insert sau khi validate

    // Kiểm tra và tính tiền từng dòng
    for (const item of danh_sach_san_pham) {
      // FOR UPDATE: khóa dòng sản phẩm trong transaction, tránh tranh chấp khi cập nhật tồn kho đồng thời
      const [sp] = await conn.query("SELECT id, ten_san_pham FROM san_pham WHERE id = ? FOR UPDATE", [
        item.san_pham_id,
      ]);
      // Không tìm thấy sản phẩm -> ném lỗi 400 (sẽ rollback ở khối catch)
      if (sp.length === 0) {
        throw Object.assign(new Error(`Sản phẩm #${item.san_pham_id} không tồn tại`), { status: 400 });
      }
      // Ràng buộc: số lượng nhập là số nguyên > 0; giá nhập là số không âm (>= 0)
      const soLuong = soNguyenDuong(item.so_luong, `Số lượng nhập của "${sp[0].ten_san_pham}"`);
      const giaNhap = soKhongAm(item.gia_nhap, `Giá nhập của "${sp[0].ten_san_pham}"`);
      // Thành tiền của dòng = số lượng * giá nhập; cộng dồn vào tổng tiền phiếu
      const thanhTien = soLuong * giaNhap;
      tongTien += thanhTien;
      // Lưu dòng đã chuẩn hóa để dùng cho bước insert chi tiết và cập nhật tồn kho
      chiTiet.push({ san_pham_id: sp[0].id, so_luong: soLuong, gia_nhap: giaNhap, thanh_tien: thanhTien });
    }

    // Sinh mã phiếu duy nhất theo timestamp, ví dụ: PN1718800000000
    const maPhieu = "PN" + Date.now();

    // Lưu phiếu nhập (nguoi_dung_id lấy từ tài khoản đang đăng nhập qua middleware xác thực)
    const [kq] = await conn.query(
      `INSERT INTO phieu_nhap (ma_phieu, nha_cung_cap_id, nguoi_dung_id, tong_tien, ghi_chu)
       VALUES (?, ?, ?, ?, ?)`,
      [maPhieu, nha_cung_cap_id || null, req.nguoiDung.id, tongTien, ghi_chu || null]
    );
    const phieuId = kq.insertId; // Id phiếu vừa tạo, dùng làm khóa ngoại cho chi tiết

    // Lưu chi tiết + TĂNG tồn kho + cập nhật giá nhập mới nhất
    for (const ct of chiTiet) {
      // Thêm một dòng chi tiết phiếu nhập
      await conn.query(
        "INSERT INTO chi_tiet_phieu_nhap (phieu_nhap_id, san_pham_id, so_luong, gia_nhap, thanh_tien) VALUES (?, ?, ?, ?, ?)",
        [phieuId, ct.san_pham_id, ct.so_luong, ct.gia_nhap, ct.thanh_tien]
      );
      // Cộng số lượng nhập vào tồn kho và ghi nhận giá nhập gần nhất của sản phẩm
      await conn.query(
        "UPDATE san_pham SET so_luong_ton = so_luong_ton + ?, gia_nhap = ? WHERE id = ?",
        [ct.so_luong, ct.gia_nhap, ct.san_pham_id]
      );
    }

    // Mọi thao tác thành công -> xác nhận (commit) transaction
    await conn.commit();
    res.status(201).json({ thanh_cong: true, du_lieu: { id: phieuId, ma_phieu: maPhieu, tong_tien: tongTien } });
  } catch (e) {
    // Có lỗi xảy ra -> hoàn tác (rollback) toàn bộ thay đổi rồi ném lỗi cho middleware xử lý
    await conn.rollback();
    throw e;
  } finally {
    // Luôn trả kết nối về pool dù thành công hay thất bại
    conn.release();
  }
});

// Xuất các hàm điều khiển để router gắn vào các route tương ứng

module.exports = { layDanhSach, layChiTiet, taoPhieuNhap };
