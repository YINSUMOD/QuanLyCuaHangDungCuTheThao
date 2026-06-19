// =============================================================================
// FILE: ung-dung.jsx
// VAI TRO: Component goc cua frontend - khai bao toan bo cac tuyen duong (route)
//          cua ung dung va dieu phoi viec dieu huong theo trang thai dang nhap.
// GHI CHU: Su dung react-router-dom de dinh tuyen; bao ve route bang TuyenBaoVe
//          (kiem tra dang nhap + phan quyen theo vai tro nguoi dung).
// =============================================================================
// Khai báo các tuyến đường (route) của giao diện
// =============================================================================
// useEffect: chạy hiệu ứng phụ khi đổi đường dẫn (để cuộn lên đầu)
import { useEffect } from "react";
// Routes/Route: khai bao bang dinh tuyen; Navigate: chuyen huong (redirect); useLocation: lay URL hien tai
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
// Hook lay context xac thuc (trang thai dang nhap, thong tin nguoi dung...)
import { dungXacThuc } from "./ngu-canh/xac-thuc";
import BoCuc from "./thanh-phan/bo-cuc"; // Khung giao dien chung (menu, header...) cho cac trang ben trong
import TuyenBaoVe from "./thanh-phan/tuyen-bao-ve"; // Boc route: yeu cau dang nhap va kiem tra vai tro

// Cac trang man hinh cua ung dung
import DangNhap from "./trang/dang-nhap";
import TongQuan from "./trang/tong-quan";
import BaoCao from "./trang/bao-cao";
import SanPham from "./trang/san-pham";
import DanhMuc from "./trang/danh-muc";
import NhaCungCap from "./trang/nha-cung-cap";
import KhachHang from "./trang/khach-hang";
import DonHang from "./trang/don-hang";
import BanHang from "./trang/ban-hang";
import NhapKho from "./trang/nhap-kho";
import NguoiDung from "./trang/nguoi-dung";

// Tự CUỘN LÊN ĐẦU mỗi khi đổi route (cuộn cả cửa sổ lẫn vùng nội dung .noi-dung)
function LenDauTrang() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector(".noi-dung")?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Component goc: dinh nghia toan bo so do dinh tuyen cua ung dung
export default function UngDung() {
  // dangTai = true khi dang kiem tra phien dang nhap (vd: doc token/goi API /me)
  const { dangTai } = dungXacThuc();

  // Trong lúc kiểm tra phiên đăng nhập thì hiển thị màn hình chờ
  if (dangTai) return <div className="man-hinh-cho">Đang tải...</div>;

  return (
    <>
    {/* Tự cuộn lên đầu khi chuyển trang */}
    <LenDauTrang />
    {/* Routes: chi render route dau tien khop voi URL hien tai */}
    <Routes>
      {/* Trang đăng nhập (công khai) - khong yeu cau dang nhap */}
      <Route path="/dang-nhap" element={<DangNhap />} />

      {/* Các trang bên trong yêu cầu đăng nhập, dùng chung Bố cục có menu */}
      <Route
        element={
          <TuyenBaoVe>
            <BoCuc />
          </TuyenBaoVe>
        }
      >
        {/* Trang chu / Tong quan - moi nguoi da dang nhap deu xem duoc */}
        <Route path="/" element={<TongQuan />} />
        {/* Mỗi trang chỉ cho đúng vai trò truy cập (admin luôn được phép) */}
        {/* Bao cao: chi quan ly */}
        <Route path="/bao-cao" element={<TuyenBaoVe vaiTro={["quan_ly"]}><BaoCao /></TuyenBaoVe>} />
        {/* Ban hang (POS): quan ly + thu ngan */}
        <Route path="/ban-hang" element={<TuyenBaoVe vaiTro={["quan_ly", "thu_ngan"]}><BanHang /></TuyenBaoVe>} />
        {/* Don hang: quan ly + thu ngan */}
        <Route path="/don-hang" element={<TuyenBaoVe vaiTro={["quan_ly", "thu_ngan"]}><DonHang /></TuyenBaoVe>} />
        {/* San pham: quan ly + nhan vien kho */}
        <Route path="/san-pham" element={<TuyenBaoVe vaiTro={["quan_ly", "nhan_vien_kho"]}><SanPham /></TuyenBaoVe>} />
        {/* Nhap kho: quan ly + nhan vien kho */}
        <Route path="/nhap-kho" element={<TuyenBaoVe vaiTro={["quan_ly", "nhan_vien_kho"]}><NhapKho /></TuyenBaoVe>} />
        {/* Danh muc san pham: quan ly + nhan vien kho */}
        <Route path="/danh-muc" element={<TuyenBaoVe vaiTro={["quan_ly", "nhan_vien_kho"]}><DanhMuc /></TuyenBaoVe>} />
        {/* Nha cung cap: quan ly + nhan vien kho */}
        <Route path="/nha-cung-cap" element={<TuyenBaoVe vaiTro={["quan_ly", "nhan_vien_kho"]}><NhaCungCap /></TuyenBaoVe>} />
        {/* Khach hang: quan ly + thu ngan */}
        <Route path="/khach-hang" element={<TuyenBaoVe vaiTro={["quan_ly", "thu_ngan"]}><KhachHang /></TuyenBaoVe>} />
        {/* Quan ly nguoi dung: chi admin */}
        <Route path="/nguoi-dung" element={<TuyenBaoVe vaiTro={["admin"]}><NguoiDung /></TuyenBaoVe>} />
      </Route>

      {/* Đường dẫn không hợp lệ -> chuyển về trang chủ */}
      {/* replace: thay the entry hien tai trong lich su trinh duyet (khong tao back loop) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
