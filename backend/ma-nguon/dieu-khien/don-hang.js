// =============================================================================
// Bộ điều khiển ĐƠN HÀNG / BÁN HÀNG
// Tạo đơn hàng có sử dụng TRANSACTION để đảm bảo dữ liệu nhất quán
// (trừ tồn kho và lưu đơn hàng phải cùng thành công hoặc cùng thất bại)
//
// File này export 4 hàm xử lý (controller) cho các route đơn hàng:
//   - layDanhSach     : lấy danh sách đơn hàng
//   - layChiTiet      : lấy chi tiết 1 đơn hàng kèm sản phẩm
//   - taoDonHang      : tạo đơn hàng mới (bán hàng) + trừ tồn kho
//   - capNhatTrangThai: đổi trạng thái đơn (kèm hoàn kho khi hủy)
// =============================================================================
// pool: nhóm kết nối MySQL dùng chung cho toàn ứng dụng
const { pool } = require("../cau-hinh/ket-noi-db");
// batLoi: bọc hàm async để tự bắt lỗi và chuyển cho middleware xử lý lỗi (tránh try/catch lặp lại)
const batLoi = require("../tien-ich/bat-loi-bat-dong-bo");
// Tiện ích ràng buộc: giảm giá phải là số không âm
const { soKhongAm, loi400 } = require("../tien-ich/kiem-tra");

// [GET] /api/don-hang - Lấy danh sách đơn hàng
const layDanhSach = batLoi(async (req, res) => {
  // Lấy tất cả đơn hàng, ghép thêm tên khách hàng và tên nhân viên lập đơn.
  // Dùng LEFT JOIN để đơn vẫn hiển thị dù khách hàng/nhân viên đã bị xóa (giá trị NULL).
  const [rows] = await pool.query(`
    SELECT dh.*, kh.ho_ten AS ten_khach_hang, nd.ho_ten AS ten_nhan_vien
    FROM don_hang dh
    LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id
    LEFT JOIN nguoi_dung nd ON dh.nguoi_dung_id = nd.id
    ORDER BY dh.id DESC
  `);
  // Trả về danh sách đơn hàng cho client
  res.json({ thanh_cong: true, du_lieu: rows });
});

// [GET] /api/don-hang/:id - Lấy chi tiết một đơn hàng (kèm danh sách sản phẩm)
const layChiTiet = batLoi(async (req, res) => {
  // Bước 1: lấy thông tin chung của đơn hàng theo id trên URL (dùng ? để chống SQL injection)
  const [donRows] = await pool.query(
    `SELECT dh.*, kh.ho_ten AS ten_khach_hang, nd.ho_ten AS ten_nhan_vien
     FROM don_hang dh
     LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id
     LEFT JOIN nguoi_dung nd ON dh.nguoi_dung_id = nd.id
     WHERE dh.id = ?`,
    [req.params.id]
  );
  // Không có đơn nào khớp id -> trả về 404
  if (donRows.length === 0) {
    return res.status(404).json({ thanh_cong: false, thong_bao: "Không tìm thấy đơn hàng" });
  }

  // Bước 2: lấy các dòng sản phẩm thuộc đơn hàng này, kèm tên sản phẩm
  const [chiTiet] = await pool.query(
    `SELECT ct.*, sp.ten_san_pham
     FROM chi_tiet_don_hang ct
     LEFT JOIN san_pham sp ON ct.san_pham_id = sp.id
     WHERE ct.don_hang_id = ?`,
    [req.params.id]
  );

  // Gộp thông tin đơn (donRows[0]) với mảng chi tiết sản phẩm rồi trả về
  res.json({ thanh_cong: true, du_lieu: { ...donRows[0], chi_tiet: chiTiet } });
});

// [POST] /api/don-hang - Tạo đơn hàng mới (bán hàng)
const taoDonHang = batLoi(async (req, res) => {
  // Lấy dữ liệu đơn hàng từ body request gửi lên
  const { khach_hang_id, danh_sach_san_pham, giam_gia, phuong_thuc_thanh_toan, ghi_chu } = req.body;

  // Đơn hàng phải có ít nhất một sản phẩm
  if (!Array.isArray(danh_sach_san_pham) || danh_sach_san_pham.length === 0) {
    return res
      .status(400)
      .json({ thanh_cong: false, thong_bao: "Đơn hàng phải có ít nhất một sản phẩm" });
  }

  // Lấy một kết nối riêng để chạy transaction
  const conn = await pool.getConnection();
  try {
    // Bắt đầu transaction: mọi thao tác sau đây sẽ cùng commit hoặc cùng rollback
    await conn.beginTransaction();

    let tongTien = 0;   // tổng tiền trước khi giảm giá
    const chiTiet = []; // danh sách dòng sản phẩm đã kiểm tra hợp lệ, dùng để lưu sau

    // Duyệt từng sản phẩm: kiểm tra tồn kho và tính tiền
    for (const item of danh_sach_san_pham) {
      // Số lượng phải là số nguyên dương (chặn số âm/0/chuỗi rác làm sai tồn kho & tiền)
      const soLuong = Number(item.so_luong);
      if (!Number.isInteger(soLuong) || soLuong <= 0) {
        throw Object.assign(new Error("Số lượng sản phẩm không hợp lệ"), { status: 400 });
      }

      // FOR UPDATE để khóa dòng, tránh tranh chấp khi nhiều đơn cùng mua 1 sản phẩm
      const [sp] = await conn.query(
        "SELECT id, ten_san_pham, gia_ban, so_luong_ton FROM san_pham WHERE id = ? FOR UPDATE",
        [item.san_pham_id]
      );
      if (sp.length === 0) {
        throw Object.assign(new Error(`Sản phẩm #${item.san_pham_id} không tồn tại`), { status: 400 });
      }

      const sanPham = sp[0];
      // Chặn bán vượt quá số lượng còn trong kho
      if (sanPham.so_luong_ton < soLuong) {
        throw Object.assign(
          new Error(`Sản phẩm "${sanPham.ten_san_pham}" không đủ tồn kho (còn ${sanPham.so_luong_ton})`),
          { status: 400 }
        );
      }

      // Thành tiền của dòng = giá bán * số lượng; cộng dồn vào tổng tiền
      const thanhTien = Number(sanPham.gia_ban) * soLuong;
      tongTien += thanhTien;
      // Lưu tạm thông tin dòng để lát nữa ghi vào bảng chi tiết đơn hàng
      chiTiet.push({
        san_pham_id: sanPham.id,
        so_luong: soLuong,
        don_gia: sanPham.gia_ban,
        thanh_tien: thanhTien,
      });
    }

    // Giảm giá: phải là số KHÔNG ÂM và KHÔNG vượt quá tổng tiền
    const giamGia = soKhongAm(giam_gia, "Giảm giá");
    if (giamGia > tongTien) {
      throw loi400("Giảm giá không được lớn hơn tổng tiền");
    }
    // Thành tiền cuối cùng = tổng tiền - giảm giá (giảm giá đã được chặn <= tổng tiền)
    const thanhTienCuoi = tongTien - giamGia;
    const maDon = "DH" + Date.now(); // mã đơn duy nhất theo thời gian

    // Lưu thông tin đơn hàng
    const [kqDon] = await conn.query(
      `INSERT INTO don_hang
       (ma_don, khach_hang_id, nguoi_dung_id, tong_tien, giam_gia, thanh_tien, phuong_thuc_thanh_toan, trang_thai, ghi_chu)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'hoan_thanh', ?)`,
      [
        maDon, khach_hang_id || null, req.nguoiDung.id,
        tongTien, giamGia, thanhTienCuoi,
        phuong_thuc_thanh_toan || "tien_mat", ghi_chu || null,
      ]
    );
    // Lấy id của đơn vừa tạo để gắn cho các dòng chi tiết bên dưới
    const donHangId = kqDon.insertId;

    // Lưu chi tiết đơn hàng và trừ tồn kho tương ứng
    for (const ct of chiTiet) {
      // Ghi 1 dòng sản phẩm vào bảng chi tiết đơn hàng
      await conn.query(
        "INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien) VALUES (?, ?, ?, ?, ?)",
        [donHangId, ct.san_pham_id, ct.so_luong, ct.don_gia, ct.thanh_tien]
      );
      // Trừ số lượng đã bán khỏi tồn kho của sản phẩm
      await conn.query("UPDATE san_pham SET so_luong_ton = so_luong_ton - ? WHERE id = ?", [
        ct.so_luong,
        ct.san_pham_id,
      ]);
    }

    await conn.commit(); // xác nhận tất cả thay đổi
    // Trả về 201 (đã tạo) kèm thông tin tóm tắt đơn hàng vừa tạo
    res.status(201).json({
      thanh_cong: true,
      du_lieu: { id: donHangId, ma_don: maDon, thanh_tien: thanhTienCuoi },
    });
  } catch (e) {
    await conn.rollback(); // có lỗi thì hủy toàn bộ thay đổi
    throw e;
  } finally {
    conn.release(); // luôn trả kết nối về pool
  }
});

// [PUT] /api/don-hang/:id/trang-thai - Cập nhật trạng thái đơn (duyệt / giao / hoàn thành / hủy)
// Khi chuyển sang 'da_huy' (mà trước đó chưa hủy) -> hoàn lại tồn kho
// Máy trạng thái: từ trạng thái hiện tại chỉ được chuyển sang các trạng thái cho phép.
// 'da_huy' là trạng thái cuối (không chuyển đi đâu nữa) -> tránh hoàn kho nhiều lần.
const CHUYEN_HOP_LE = {
  cho_xu_ly: ["da_xac_nhan", "yeu_cau_huy", "da_huy"],
  da_xac_nhan: ["dang_giao", "yeu_cau_huy", "da_huy"],
  dang_giao: ["hoan_thanh", "da_huy"],
  yeu_cau_huy: ["da_huy", "da_xac_nhan"], // duyệt hủy hoặc từ chối (quay lại đã xác nhận)
  hoan_thanh: ["da_huy"], // cho phép hoàn/trả hàng 1 lần
  da_huy: [], // trạng thái cuối
};

const capNhatTrangThai = batLoi(async (req, res) => {
  // Trạng thái mới muốn chuyển sang (lấy từ body)
  const { trang_thai } = req.body;
  // Danh sách các trạng thái được phép tồn tại trong hệ thống
  const hopLe = ["cho_xu_ly", "da_xac_nhan", "dang_giao", "hoan_thanh", "yeu_cau_huy", "da_huy"];
  // Từ chối ngay nếu trạng thái gửi lên không nằm trong danh sách hợp lệ
  if (!hopLe.includes(trang_thai)) {
    return res.status(400).json({ thanh_cong: false, thong_bao: "Trạng thái không hợp lệ" });
  }

  // Dùng transaction + khóa dòng để tránh hai người cùng đổi trạng thái 1 đơn cùng lúc
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // FOR UPDATE: khóa dòng đơn hàng cho đến khi commit/rollback
    const [rows] = await conn.query("SELECT trang_thai FROM don_hang WHERE id = ? FOR UPDATE", [req.params.id]);
    if (rows.length === 0) {
      throw Object.assign(new Error("Không tìm thấy đơn hàng"), { status: 404 });
    }
    // Trạng thái hiện tại của đơn (trạng thái cũ trước khi đổi)
    const cu = rows[0].trang_thai;

    // Chặn chuyển trạng thái không hợp lệ (ví dụ từ 'da_huy' về 'hoan_thanh')
    if (cu !== trang_thai && !(CHUYEN_HOP_LE[cu] || []).includes(trang_thai)) {
      throw Object.assign(
        new Error(`Không thể chuyển trạng thái từ "${cu}" sang "${trang_thai}"`),
        { status: 400 }
      );
    }

    // Hủy đơn -> trả hàng về kho (chỉ 1 lần, vì 'da_huy' là trạng thái cuối)
    if (trang_thai === "da_huy" && cu !== "da_huy") {
      const [ct] = await conn.query(
        "SELECT san_pham_id, so_luong FROM chi_tiet_don_hang WHERE don_hang_id = ?",
        [req.params.id]
      );
      for (const c of ct) {
        // Bỏ qua dòng có sản phẩm đã bị xóa (san_pham_id NULL) để tránh lỗi cập nhật
        if (c.san_pham_id) {
          // Cộng trả số lượng đã bán về lại tồn kho
          await conn.query("UPDATE san_pham SET so_luong_ton = so_luong_ton + ? WHERE id = ?", [
            c.so_luong,
            c.san_pham_id,
          ]);
        }
      }
    }

    // Ghi trạng thái mới cho đơn hàng
    await conn.query("UPDATE don_hang SET trang_thai = ? WHERE id = ?", [trang_thai, req.params.id]);
    await conn.commit(); // xác nhận thay đổi (đổi trạng thái + hoàn kho nếu có)
    res.json({ thanh_cong: true, thong_bao: "Đã cập nhật trạng thái đơn hàng" });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

// Xuất các hàm điều khiển để file định tuyến (router) đăng ký vào các route tương ứng
module.exports = { layDanhSach, layChiTiet, taoDonHang, capNhatTrangThai };
