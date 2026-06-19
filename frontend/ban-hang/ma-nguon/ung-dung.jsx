// =============================================================================
// Khai báo route cho web bán hàng. Xem hàng tự do; chỉ cần đăng nhập khi đặt hàng.
// =============================================================================
// useEffect: chạy hiệu ứng phụ khi giá trị phụ thuộc thay đổi (ở đây là đổi đường dẫn)
import { useEffect } from "react";
// Các thành phần định tuyến của react-router-dom: Routes/Route khai báo route, Navigate dùng để chuyển hướng, useLocation lấy URL hiện tại
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
// Hook lấy ngữ cảnh xác thực khách hàng (thông tin khách đang đăng nhập, trạng thái đang tải)
import { dungXacThucKhach } from "./ngu-canh/xac-thuc-khach";
// Thanh điều hướng phía trên (header) hiển thị xuyên suốt các trang
import Header from "./thanh-phan/header";
// Chân trang (footer) hiển thị xuyên suốt các trang
import ChanTrang from "./thanh-phan/chan-trang";

// Import các trang (page) tương ứng với từng route bên dưới
import TrangChu from "./trang/trang-chu";
import CuaHang from "./trang/cua-hang";
import ChiTietSanPham from "./trang/chi-tiet-san-pham";
import GioHang from "./trang/gio-hang";
import ThanhToan from "./trang/thanh-toan";
import DangNhap from "./trang/dang-nhap";
import DatHangThanhCong from "./trang/dat-hang-thanh-cong";
import DonHangCuaToi from "./trang/don-hang-cua-toi";
import ThongTinCaNhan from "./trang/thong-tin-ca-nhan";

// Bảo vệ trang cần đăng nhập khách (đặt hàng, đơn của tôi)
// Component bọc (wrapper) chỉ cho hiển thị children khi khách đã đăng nhập
function CanDangNhap({ children }) {
  // Lấy thông tin khách và trạng thái đang tải từ ngữ cảnh xác thực
  const { khach, dangTai } = dungXacThucKhach();
  // Trong lúc còn đang tải trạng thái đăng nhập thì chưa render gì (tránh nháy/chuyển hướng sai)
  if (dangTai) return null;
  // Chưa đăng nhập: chuyển hướng về trang đăng nhập (replace để không lưu vào lịch sử trình duyệt)
  if (!khach) return <Navigate to="/dang-nhap" replace />;
  // Đã đăng nhập: cho phép hiển thị nội dung trang được bảo vệ
  return children;
}

// Tự động CUỘN LÊN ĐẦU TRANG mỗi khi đổi route (SPA không tự reset vị trí cuộn)
// -> tránh lỗi: đang ở cuối trang mà bấm sang trang khác vẫn nằm ở dưới
function LenDauTrang() {
  const { pathname } = useLocation(); // lấy đường dẫn hiện tại
  useEffect(() => {
    window.scrollTo(0, 0); // mỗi lần pathname đổi -> cuộn về đầu trang
  }, [pathname]);
  return null; // component này không hiển thị gì
}

// Component gốc của ứng dụng web bán hàng: bố cục chung (header + nội dung + chân trang) và bảng định tuyến
export default function UngDung() {
  return (
    <>
      {/* Tự cuộn lên đầu khi chuyển trang */}
      <LenDauTrang />
      {/* Thanh điều hướng đầu trang */}
      <Header />
      {/* Vùng nội dung chính, nơi các trang theo route được render */}
      <main className="khung-noi-dung">
        {/* Bảng khai báo các route của ứng dụng */}
        <Routes>
          {/* Trang chủ */}
          <Route path="/" element={<TrangChu />} />
          {/* Trang danh sách sản phẩm của cửa hàng */}
          <Route path="/cua-hang" element={<CuaHang />} />
          {/* Trang chi tiết một sản phẩm, :id là tham số mã sản phẩm trên URL */}
          <Route path="/san-pham/:id" element={<ChiTietSanPham />} />
          {/* Giỏ hàng (xem tự do, không cần đăng nhập) */}
          <Route path="/gio-hang" element={<GioHang />} />
          {/* Trang đăng nhập khách hàng */}
          <Route path="/dang-nhap" element={<DangNhap />} />
          {/* Trang thanh toán: bắt buộc đăng nhập nên được bọc trong CanDangNhap */}
          <Route path="/thanh-toan" element={<CanDangNhap><ThanhToan /></CanDangNhap>} />
          {/* Trang thông báo đặt hàng thành công */}
          <Route path="/dat-hang-thanh-cong" element={<DatHangThanhCong />} />
          {/* Trang danh sách đơn hàng của khách: bắt buộc đăng nhập */}
          <Route path="/don-hang-cua-toi" element={<CanDangNhap><DonHangCuaToi /></CanDangNhap>} />
          {/* Trang thông tin cá nhân của khách: bắt buộc đăng nhập */}
          <Route path="/thong-tin-ca-nhan" element={<CanDangNhap><ThongTinCaNhan /></CanDangNhap>} />
          {/* Route bắt mọi đường dẫn không khớp (*): chuyển hướng về trang chủ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {/* Chân trang cuối cùng */}
      <ChanTrang />
    </>
  );
}
