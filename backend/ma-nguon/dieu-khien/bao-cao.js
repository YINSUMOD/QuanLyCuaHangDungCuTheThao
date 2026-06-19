// =============================================================================
// Bộ điều khiển BÁO CÁO / THỐNG KÊ
//  - thongKeTongQuan: số liệu cho màn hình Tổng quan (Dashboard)
//  - baoCaoDoanhThu : báo cáo doanh thu theo KHOẢNG NGÀY (cho trang Báo cáo)
// =============================================================================
// pool: nhóm kết nối MySQL dùng chung để chạy các câu truy vấn
const { pool } = require("../cau-hinh/ket-noi-db");
// batLoi: hàm bọc (wrapper) để tự bắt lỗi của hàm bất đồng bộ, tránh phải try/catch lặp lại
const batLoi = require("../tien-ich/bat-loi-bat-dong-bo");

// [GET] /api/bao-cao/tong-quan - Số liệu tổng quan cho Dashboard
const thongKeTongQuan = batLoi(async (req, res) => {
  // Đếm tổng số bản ghi cho 3 thẻ chỉ số chính: sản phẩm, đơn hàng, khách hàng
  const [[{ tong_san_pham }]] = await pool.query("SELECT COUNT(*) AS tong_san_pham FROM san_pham");
  const [[{ tong_don_hang }]] = await pool.query("SELECT COUNT(*) AS tong_don_hang FROM don_hang");
  const [[{ tong_khach_hang }]] = await pool.query("SELECT COUNT(*) AS tong_khach_hang FROM khach_hang");

  // Doanh thu HÔM NAY: chỉ tính đơn đã 'hoan_thanh' và có ngày tạo trùng ngày hiện tại (CURDATE)
  // COALESCE(..., 0): trả về 0 nếu không có đơn nào (SUM trả NULL)
  const [[{ doanh_thu_hom_nay }]] = await pool.query(
    `SELECT COALESCE(SUM(thanh_tien), 0) AS doanh_thu_hom_nay
     FROM don_hang WHERE DATE(ngay_tao) = CURDATE() AND trang_thai = 'hoan_thanh'`
  );
  // Doanh thu THÁNG hiện tại: lọc theo cùng tháng VÀ cùng năm với ngày hiện tại
  const [[{ doanh_thu_thang }]] = await pool.query(
    `SELECT COALESCE(SUM(thanh_tien), 0) AS doanh_thu_thang
     FROM don_hang
     WHERE MONTH(ngay_tao) = MONTH(CURDATE()) AND YEAR(ngay_tao) = YEAR(CURDATE())
       AND trang_thai = 'hoan_thanh'`
  );

  // Cảnh báo tồn kho: lấy tối đa 10 sản phẩm có số lượng tồn <= 5 (sắp hết hàng), tồn ít nhất lên đầu
  const [san_pham_sap_het] = await pool.query(
    "SELECT id, ten_san_pham, so_luong_ton FROM san_pham WHERE so_luong_ton <= 5 ORDER BY so_luong_ton ASC LIMIT 10"
  );
  // Top 5 sản phẩm bán chạy nhất: gộp số lượng đã bán từ bảng chi tiết đơn hàng, sắp giảm dần
  const [top_san_pham] = await pool.query(`
    SELECT sp.ten_san_pham, SUM(ct.so_luong) AS da_ban
    FROM chi_tiet_don_hang ct
    JOIN san_pham sp ON ct.san_pham_id = sp.id
    GROUP BY ct.san_pham_id, sp.ten_san_pham
    ORDER BY da_ban DESC LIMIT 5
  `);
  // Doanh thu 7 ngày gần nhất (biểu đồ Dashboard): từ "hôm nay lùi về 6 ngày" tới nay
  // gộp theo từng ngày để vẽ đường/cột doanh thu
  const [doanh_thu_7_ngay] = await pool.query(`
    SELECT DATE(ngay_tao) AS ngay, COALESCE(SUM(thanh_tien), 0) AS doanh_thu
    FROM don_hang
    WHERE ngay_tao >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND trang_thai = 'hoan_thanh'
    GROUP BY DATE(ngay_tao) ORDER BY ngay ASC
  `);
  // 5 đơn hàng gần đây nhất (id lớn nhất); LEFT JOIN khách hàng để vẫn hiện đơn dù không có KH liên kết
  const [don_hang_gan_day] = await pool.query(`
    SELECT dh.id, dh.ma_don, dh.thanh_tien, dh.trang_thai, dh.ngay_tao,
           kh.ho_ten AS ten_khach_hang
    FROM don_hang dh
    LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id
    ORDER BY dh.id DESC LIMIT 5
  `);

  // Gom tất cả số liệu vào 1 phản hồi JSON cho Dashboard
  res.json({
    thanh_cong: true,
    du_lieu: {
      tong_san_pham, tong_don_hang, tong_khach_hang,
      doanh_thu_hom_nay, doanh_thu_thang,
      san_pham_sap_het, top_san_pham, doanh_thu_7_ngay, don_hang_gan_day,
    },
  });
});

// [GET] /api/bao-cao/doanh-thu?tu_ngay=YYYY-MM-DD&den_ngay=YYYY-MM-DD
// Báo cáo doanh thu trong một khoảng ngày
const baoCaoDoanhThu = batLoi(async (req, res) => {
  // Lấy khoảng ngày lọc từ query string (?tu_ngay=...&den_ngay=...)
  let { tu_ngay, den_ngay } = req.query;

  // Mặc định: 30 ngày gần nhất nếu không truyền tham số
  // dinhDang: chuyển Date sang chuỗi 'YYYY-MM-DD' (cắt 10 ký tự đầu của ISO string)
  const dinhDang = (d) => d.toISOString().slice(0, 10);
  const homNay = new Date();
  // Nếu thiếu den_ngay -> dùng hôm nay
  if (!den_ngay) den_ngay = dinhDang(homNay);
  // Nếu thiếu tu_ngay -> lùi 29 ngày so với hôm nay (tổng cộng đủ 30 ngày tính cả 2 đầu)
  if (!tu_ngay) {
    const truoc = new Date(homNay);
    truoc.setDate(truoc.getDate() - 29);
    tu_ngay = dinhDang(truoc);
  }

  // Ràng buộc: ngày phải đúng định dạng YYYY-MM-DD và "từ ngày" <= "đến ngày"
  const reNgay = /^\d{4}-\d{2}-\d{2}$/;
  if (!reNgay.test(tu_ngay) || !reNgay.test(den_ngay)) {
    return res.status(400).json({ thanh_cong: false, thong_bao: "Ngày không đúng định dạng (YYYY-MM-DD)" });
  }
  if (tu_ngay > den_ngay) {
    return res.status(400).json({ thanh_cong: false, thong_bao: "Từ ngày phải nhỏ hơn hoặc bằng đến ngày" });
  }

  // Điều kiện lọc dùng chung cho mọi truy vấn bên dưới: trong khoảng ngày VÀ đơn đã hoàn thành
  // Dùng tham số (?) để tránh SQL injection; tu_ngay/den_ngay sẽ được truyền vào ở mỗi query
  const dieuKien = "DATE(dh.ngay_tao) BETWEEN ? AND ? AND dh.trang_thai = 'hoan_thanh'";

  // Tổng hợp: tổng số đơn và tổng doanh thu trong cả khoảng ngày
  const [[tong]] = await pool.query(
    `SELECT COUNT(*) AS so_don, COALESCE(SUM(thanh_tien), 0) AS tong_doanh_thu
     FROM don_hang dh WHERE ${dieuKien}`,
    [tu_ngay, den_ngay]
  );

  // Doanh thu theo từng ngày (để vẽ biểu đồ theo thời gian), gộp theo ngày, tăng dần
  const [theo_ngay] = await pool.query(
    `SELECT DATE(dh.ngay_tao) AS ngay, COUNT(*) AS so_don, SUM(thanh_tien) AS doanh_thu
     FROM don_hang dh WHERE ${dieuKien}
     GROUP BY DATE(dh.ngay_tao) ORDER BY ngay ASC`,
    [tu_ngay, den_ngay]
  );

  // Doanh thu theo sản phẩm (bán chạy nhất theo doanh thu)
  // JOIN 3 bảng: chi tiết đơn -> đơn hàng (để lọc theo ngày) -> sản phẩm (lấy tên, thương hiệu)
  // Gộp theo sản phẩm, lấy 20 sản phẩm doanh thu cao nhất
  const [theo_san_pham] = await pool.query(
    `SELECT sp.ten_san_pham, sp.thuong_hieu,
            SUM(ct.so_luong) AS so_luong, SUM(ct.thanh_tien) AS doanh_thu
     FROM chi_tiet_don_hang ct
     JOIN don_hang dh ON ct.don_hang_id = dh.id
     JOIN san_pham sp ON ct.san_pham_id = sp.id
     WHERE ${dieuKien}
     GROUP BY ct.san_pham_id, sp.ten_san_pham, sp.thuong_hieu
     ORDER BY doanh_thu DESC LIMIT 20`,
    [tu_ngay, den_ngay]
  );

  // Doanh thu theo danh mục
  // LEFT JOIN danh_muc để sản phẩm chưa gắn danh mục vẫn được tính (ten_danh_muc sẽ là NULL)
  const [theo_danh_muc] = await pool.query(
    `SELECT dm.ten_danh_muc, SUM(ct.thanh_tien) AS doanh_thu
     FROM chi_tiet_don_hang ct
     JOIN don_hang dh ON ct.don_hang_id = dh.id
     JOIN san_pham sp ON ct.san_pham_id = sp.id
     LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
     WHERE ${dieuKien}
     GROUP BY sp.danh_muc_id, dm.ten_danh_muc
     ORDER BY doanh_thu DESC`,
    [tu_ngay, den_ngay]
  );

  // Giá trị trung bình mỗi đơn = tổng doanh thu / số đơn (làm tròn); tránh chia 0 khi không có đơn
  const trung_binh = tong.so_don > 0 ? Math.round(tong.tong_doanh_thu / tong.so_don) : 0;

  // Trả về JSON báo cáo: khoảng ngày + các số liệu tổng hợp và các bảng phân tích chi tiết
  res.json({
    thanh_cong: true,
    du_lieu: {
      tu_ngay, den_ngay,
      so_don: tong.so_don,
      tong_doanh_thu: tong.tong_doanh_thu,
      trung_binh,
      theo_ngay, theo_san_pham, theo_danh_muc,
    },
  });
});

// Xuất 2 hàm điều khiển để route báo cáo sử dụng
module.exports = { thongKeTongQuan, baoCaoDoanhThu };
