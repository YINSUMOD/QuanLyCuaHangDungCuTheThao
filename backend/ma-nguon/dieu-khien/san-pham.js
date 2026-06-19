// =============================================================================
// Bộ điều khiển SẢN PHẨM - dụng cụ thể thao (thêm / sửa / xóa / tìm kiếm)
// =============================================================================
// pool: nhóm kết nối MySQL dùng chung để truy vấn cơ sở dữ liệu
const { pool } = require("../cau-hinh/ket-noi-db");
// batLoi: hàm bọc (wrapper) tự động bắt lỗi cho các handler bất đồng bộ (async)
const batLoi = require("../tien-ich/bat-loi-bat-dong-bo");
// Tiện ích ràng buộc dữ liệu nhập (chặn số âm, trường rỗng...)
const { loi400, batBuoc, soKhongAm, soNguyenKhongAm } = require("../tien-ich/kiem-tra");

// [GET] /api/san-pham - Lấy danh sách sản phẩm (lọc theo từ khóa, danh mục)
const layDanhSach = batLoi(async (req, res) => {
  // Lấy tham số lọc từ query string trên URL: từ khóa tìm kiếm và id danh mục
  const { tu_khoa, danh_muc_id } = req.query;

  // Kết bảng để lấy kèm tên danh mục và tên nhà cung cấp
  // WHERE 1 = 1 là mẹo để dễ nối thêm điều kiện "AND ..." động phía dưới
  let sql = `
    SELECT sp.*, dm.ten_danh_muc, ncc.ten_ncc
    FROM san_pham sp
    LEFT JOIN danh_muc dm      ON sp.danh_muc_id = dm.id
    LEFT JOIN nha_cung_cap ncc ON sp.nha_cung_cap_id = ncc.id
    WHERE 1 = 1`;
  // Mảng chứa giá trị tham số, dùng truy vấn tham số hóa để tránh SQL Injection
  const params = [];

  if (tu_khoa) {
    // Tìm theo tên sản phẩm HOẶC thương hiệu
    // Bọc % hai đầu để khớp gần đúng (LIKE) chuỗi con bất kỳ vị trí
    sql += " AND (sp.ten_san_pham LIKE ? OR sp.thuong_hieu LIKE ?)";
    params.push(`%${tu_khoa}%`, `%${tu_khoa}%`);
  }
  if (danh_muc_id) {
    // Lọc theo danh mục cụ thể nếu client có truyền danh_muc_id
    sql += " AND sp.danh_muc_id = ?";
    params.push(danh_muc_id);
  }
  // Sắp xếp giảm dần theo id để sản phẩm mới thêm hiển thị trước
  sql += " ORDER BY sp.id DESC";

  // Thực thi truy vấn; rows là mảng kết quả trả về từ MySQL
  const [rows] = await pool.query(sql, params);
  // Trả JSON theo cấu trúc chuẩn của dự án: cờ thành công + dữ liệu
  res.json({ thanh_cong: true, du_lieu: rows });
});

// [GET] /api/san-pham/:id - Lấy chi tiết một sản phẩm
const layChiTiet = batLoi(async (req, res) => {
  // Truy vấn 1 sản phẩm theo id lấy từ tham số đường dẫn (:id)
  const [rows] = await pool.query("SELECT * FROM san_pham WHERE id = ?", [req.params.id]);
  // Không có dòng nào nghĩa là id không tồn tại -> trả lỗi 404
  if (rows.length === 0) {
    return res.status(404).json({ thanh_cong: false, thong_bao: "Không tìm thấy sản phẩm" });
  }
  // Trả về bản ghi đầu tiên (duy nhất) trong kết quả
  res.json({ thanh_cong: true, du_lieu: rows[0] });
});

// [POST] /api/san-pham - Thêm sản phẩm
const them = batLoi(async (req, res) => {
  // Bóc tách các trường dữ liệu sản phẩm từ body request gửi lên
  const {
    ten_san_pham, thuong_hieu, danh_muc_id, nha_cung_cap_id,
    gia_nhap, gia_ban, so_luong_ton, don_vi, mo_ta, hinh_anh,
  } = req.body;

  // Ràng buộc dữ liệu: tên bắt buộc; giá/tồn không được âm; giá bán bắt buộc
  const tenSP = batBuoc(ten_san_pham, "Tên sản phẩm");
  if (gia_ban === undefined || gia_ban === null || gia_ban === "") {
    throw loi400("Giá bán không được để trống");
  }
  const giaBan = soKhongAm(gia_ban, "Giá bán");
  const giaNhap = soKhongAm(gia_nhap, "Giá nhập");
  const ton = soNguyenKhongAm(so_luong_ton, "Số lượng tồn");

  // Thêm bản ghi sản phẩm mới vào bảng san_pham
  const [kq] = await pool.query(
    `INSERT INTO san_pham
     (ten_san_pham, thuong_hieu, danh_muc_id, nha_cung_cap_id, gia_nhap, gia_ban, so_luong_ton, don_vi, mo_ta, hinh_anh)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      // Dùng giá trị ĐÃ KIỂM TRA; trường text rỗng -> null, đơn vị mặc định "Cái"
      tenSP, thuong_hieu || null, danh_muc_id || null, nha_cung_cap_id || null,
      giaNhap, giaBan, ton,
      don_vi || "Cái", mo_ta || null, hinh_anh || null,
    ]
  );
  // Trả mã 201 (Created) kèm id vừa được sinh tự động của bản ghi mới
  res.status(201).json({ thanh_cong: true, du_lieu: { id: kq.insertId } });
});

// [PUT] /api/san-pham/:id - Cập nhật sản phẩm
const capNhat = batLoi(async (req, res) => {
  // Bóc tách dữ liệu mới của sản phẩm cần cập nhật từ body request
  const {
    ten_san_pham, thuong_hieu, danh_muc_id, nha_cung_cap_id,
    gia_nhap, gia_ban, so_luong_ton, don_vi, mo_ta, hinh_anh,
  } = req.body;

  // Ràng buộc dữ liệu giống khi thêm mới (chặn số âm, trường rỗng)
  const tenSP = batBuoc(ten_san_pham, "Tên sản phẩm");
  if (gia_ban === undefined || gia_ban === null || gia_ban === "") {
    throw loi400("Giá bán không được để trống");
  }
  const giaBan = soKhongAm(gia_ban, "Giá bán");
  const giaNhap = soKhongAm(gia_nhap, "Giá nhập");
  const ton = soNguyenKhongAm(so_luong_ton, "Số lượng tồn");

  // Cập nhật toàn bộ các cột của sản phẩm có id tương ứng (lấy từ :id trên URL)
  await pool.query(
    `UPDATE san_pham SET
       ten_san_pham = ?, thuong_hieu = ?, danh_muc_id = ?, nha_cung_cap_id = ?,
       gia_nhap = ?, gia_ban = ?, so_luong_ton = ?, don_vi = ?, mo_ta = ?, hinh_anh = ?
     WHERE id = ?`,
    [
      // Dùng giá trị ĐÃ KIỂM TRA
      tenSP, thuong_hieu || null, danh_muc_id || null, nha_cung_cap_id || null,
      giaNhap, giaBan, ton,
      don_vi || "Cái", mo_ta || null, hinh_anh || null,
      // Tham số cuối cùng ứng với điều kiện WHERE id = ?
      req.params.id,
    ]
  );
  res.json({ thanh_cong: true, thong_bao: "Cập nhật sản phẩm thành công" });
});

// [DELETE] /api/san-pham/:id - Xóa sản phẩm
const xoa = batLoi(async (req, res) => {
  // Xóa sản phẩm theo id lấy từ tham số đường dẫn (:id)
  await pool.query("DELETE FROM san_pham WHERE id = ?", [req.params.id]);
  res.json({ thanh_cong: true, thong_bao: "Xóa sản phẩm thành công" });
});

// Xuất các hàm điều khiển để file định tuyến (route) gọi và gắn vào endpoint
module.exports = { layDanhSach, layChiTiet, them, capNhat, xoa };
