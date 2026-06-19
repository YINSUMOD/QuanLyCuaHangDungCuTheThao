// =============================================================================
// Khai báo toàn bộ tuyến đường (route) của API + phân quyền theo vai trò
// Vai trò: admin (toàn quyền) | quan_ly | thu_ngan (bán hàng) | nhan_vien_kho
// =============================================================================
const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { xacThucToken, chiAdmin, choPhep, xacThucKhach } = require("./trung-gian/xac-thuc");

const dangNhap = require("./dieu-khien/dang-nhap");
const cuaHang = require("./dieu-khien/cua-hang");
const danhMuc = require("./dieu-khien/danh-muc");
const nhaCungCap = require("./dieu-khien/nha-cung-cap");
const sanPham = require("./dieu-khien/san-pham");
const khachHang = require("./dieu-khien/khach-hang");
const donHang = require("./dieu-khien/don-hang");
const nhapKho = require("./dieu-khien/nhap-kho");
const nguoiDung = require("./dieu-khien/nguoi-dung");
const baoCao = require("./dieu-khien/bao-cao");

// --------- Cấu hình tải ảnh lên (multer) ---------
// Đường dẫn thư mục lưu ảnh: nằm ở backend/uploads (lùi 1 cấp so với thư mục mã nguồn)
const thuMucUpload = path.join(__dirname, "..", "uploads");
// Tạo sẵn thư mục uploads nếu chưa có (recursive: tạo cả cấp cha, không lỗi nếu đã tồn tại)
fs.mkdirSync(thuMucUpload, { recursive: true });
// Khai báo cách lưu file ảnh xuống đĩa
const luuTru = multer.diskStorage({
  // Thư mục đích để lưu file
  destination: (req, file, cb) => cb(null, thuMucUpload),
  // Đặt tên file mới để tránh trùng và lộ tên gốc
  filename: (req, file, cb) => {
    // Lấy phần đuôi file (.jpg, .png...); nếu không có thì mặc định .jpg
    const duoi = path.extname(file.originalname || ".jpg") || ".jpg";
    // Tên = upload_ + thời điểm (ms) + số ngẫu nhiên + đuôi -> gần như không thể trùng
    cb(null, "upload_" + Date.now() + "_" + Math.round(Math.random() * 1e6) + duoi);
  },
});
const upload = multer({
  storage: luuTru,
  limits: { fileSize: 5 * 1024 * 1024 }, // tối đa 5MB
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)), // chỉ nhận ảnh
});

// ---------- XÁC THỰC (không cần đăng nhập) ----------
// Đăng nhập nhân viên: nhận tài khoản/mật khẩu, trả về token
router.post("/auth/login", dangNhap.dangNhap);
// Lấy thông tin cá nhân của nhân viên đang đăng nhập (cần token hợp lệ)
router.get("/auth/me", xacThucToken, dangNhap.thongTinCaNhan);

// =====================================================================
// WEB BÁN HÀNG (CỬA HÀNG) - dành cho KHÁCH, không cần đăng nhập nhân viên
// =====================================================================
// Công khai: xem hàng không cần đăng nhập
router.get("/cua-hang/san-pham", cuaHang.dsSanPham);            // Danh sách sản phẩm để khách duyệt
router.get("/cua-hang/san-pham/:id", cuaHang.chiTietSanPham);  // Chi tiết 1 sản phẩm theo id
router.get("/cua-hang/danh-muc", cuaHang.dsDanhMuc);           // Danh sách danh mục để lọc
router.post("/cua-hang/dang-ky", cuaHang.dangKy);              // Khách tạo tài khoản mới
router.post("/cua-hang/dang-nhap", cuaHang.dangNhap);          // Khách đăng nhập, trả token khách
// Cần đăng nhập KHÁCH (chỉ khi đặt hàng / xem đơn của mình)
router.get("/cua-hang/toi", xacThucKhach, cuaHang.thongTin);                 // Xem thông tin tài khoản khách
router.put("/cua-hang/toi", xacThucKhach, cuaHang.capNhatThongTin);          // Cập nhật thông tin tài khoản khách
router.post("/cua-hang/dat-hang", xacThucKhach, cuaHang.datHang);            // Khách đặt hàng online
router.get("/cua-hang/don-hang-cua-toi", xacThucKhach, cuaHang.donHangCuaToi); // Xem lịch sử đơn của chính khách
router.put("/cua-hang/don-hang/:id/huy", xacThucKhach, cuaHang.yeuCauHuy);   // Khách yêu cầu hủy đơn của mình

// ---------- Từ đây trở xuống đều BẮT BUỘC đăng nhập NHÂN VIÊN ----------
// Gắn middleware xác thực token cho TẤT CẢ route khai báo phía sau dòng này
router.use(xacThucToken);

// Nhóm vai trò được phép thao tác kho hàng / bán hàng
const QL_KHO = ["quan_ly", "nhan_vien_kho"]; // + admin (tự động)
const QL_BAN = ["quan_ly", "thu_ngan"];      // + admin

// ---------- TẢI ẢNH LÊN (người quản lý kho/sản phẩm) ----------
// choPhep(...QL_KHO): chỉ kho/quản lý/admin được upload; upload.single("anh"): nhận 1 file ở field "anh"
router.post("/upload", choPhep(...QL_KHO), upload.single("anh"), (req, res) => {
  // Không có file (sai định dạng/thiếu file) -> báo lỗi 400
  if (!req.file) return res.status(400).json({ thanh_cong: false, thong_bao: "Chưa chọn ảnh hợp lệ" });
  // Thành công: trả về đường dẫn truy cập ảnh để client lưu vào sản phẩm
  res.json({ thanh_cong: true, du_lieu: { url: "/api/uploads/" + req.file.filename } });
});

// ---------- DANH MỤC (xem: mọi người; sửa: kho/quản lý) ----------
router.get("/danh-muc", danhMuc.layDanhSach);
router.post("/danh-muc", choPhep(...QL_KHO), danhMuc.them);
router.put("/danh-muc/:id", choPhep(...QL_KHO), danhMuc.capNhat);
router.delete("/danh-muc/:id", choPhep(...QL_KHO), danhMuc.xoa);

// ---------- NHÀ CUNG CẤP ----------
router.get("/nha-cung-cap", nhaCungCap.layDanhSach);
router.post("/nha-cung-cap", choPhep(...QL_KHO), nhaCungCap.them);
router.put("/nha-cung-cap/:id", choPhep(...QL_KHO), nhaCungCap.capNhat);
router.delete("/nha-cung-cap/:id", choPhep(...QL_KHO), nhaCungCap.xoa);

// ---------- SẢN PHẨM (xem: mọi người để bán hàng; sửa: kho/quản lý) ----------
router.get("/san-pham", sanPham.layDanhSach);
router.get("/san-pham/:id", sanPham.layChiTiet);
router.post("/san-pham", choPhep(...QL_KHO), sanPham.them);
router.put("/san-pham/:id", choPhep(...QL_KHO), sanPham.capNhat);
router.delete("/san-pham/:id", choPhep(...QL_KHO), sanPham.xoa);

// ---------- KHÁCH HÀNG (xem: mọi người; sửa: bán hàng/quản lý) ----------
router.get("/khach-hang", khachHang.layDanhSach);
router.post("/khach-hang", choPhep(...QL_BAN), khachHang.them);
router.put("/khach-hang/:id", choPhep(...QL_BAN), khachHang.capNhat);
router.delete("/khach-hang/:id", choPhep(...QL_BAN), khachHang.xoa);

// ---------- ĐƠN HÀNG / BÁN HÀNG (bán hàng/quản lý) ----------
router.get("/don-hang", choPhep(...QL_BAN), donHang.layDanhSach);
router.get("/don-hang/:id", choPhep(...QL_BAN), donHang.layChiTiet);
router.post("/don-hang", choPhep(...QL_BAN), donHang.taoDonHang);
router.put("/don-hang/:id/trang-thai", choPhep(...QL_BAN), donHang.capNhatTrangThai);

// ---------- NHẬP KHO (kho/quản lý) ----------
router.get("/nhap-kho", choPhep(...QL_KHO), nhapKho.layDanhSach);
router.get("/nhap-kho/:id", choPhep(...QL_KHO), nhapKho.layChiTiet);
router.post("/nhap-kho", choPhep(...QL_KHO), nhapKho.taoPhieuNhap);

// ---------- BÁO CÁO ----------
router.get("/bao-cao/tong-quan", baoCao.thongKeTongQuan);            // Dashboard: mọi người
router.get("/bao-cao/doanh-thu", choPhep("quan_ly"), baoCao.baoCaoDoanhThu); // Báo cáo: quản lý + admin

// ---------- NGƯỜI DÙNG (chỉ admin) ----------
router.get("/nguoi-dung", chiAdmin, nguoiDung.layDanhSach);
router.post("/nguoi-dung", chiAdmin, nguoiDung.them);
router.put("/nguoi-dung/:id", chiAdmin, nguoiDung.capNhat);
router.delete("/nguoi-dung/:id", chiAdmin, nguoiDung.xoa);

// Xuất router để file khởi tạo server (app) gắn vào tiền tố /api
module.exports = router;
