// =============================================================================
// Header web bán hàng: thanh tiện ích + logo + tìm kiếm + tài khoản + giỏ hàng
// =============================================================================
// useState: quản lý trạng thái cục bộ (ô từ khóa tìm kiếm); useEffect: đồng bộ theo URL
import { useState, useEffect } from "react";
// Link: điều hướng nội bộ; useNavigate: điều hướng bằng code; useLocation: đọc URL hiện tại
import { Link, useNavigate, useLocation } from "react-router-dom";
// Hook lấy dữ liệu giỏ hàng (số lượng sản phẩm) từ ngữ cảnh giỏ hàng
import { dungGioHang } from "../ngu-canh/gio-hang";
// Hook lấy thông tin khách đăng nhập + hàm đăng xuất từ ngữ cảnh xác thực
import { dungXacThucKhach } from "../ngu-canh/xac-thuc-khach";

// Icon SVG (nét mảnh, chuyên nghiệp - thay cho emoji)
// Gom các icon dạng SVG dùng lại nhiều nơi trong header: kính lúp, giỏ hàng, người dùng, hộp, điện thoại
const ic = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  cart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  box: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
};

// Danh sách danh mục hiển thị trên thanh nav; mỗi mục có id (lọc sản phẩm) và tên hiển thị
const DANH_MUC = [
  { id: 3, ten: "Cầu lông" },
  { id: 11, ten: "Pickleball" },
  { id: 1, ten: "Bóng đá" },
  { id: 2, ten: "Bóng rổ" },
  { id: 4, ten: "Tennis" },
  { id: 6, ten: "Gym" },
  { id: 7, ten: "Bơi lội" },
  { id: 8, ten: "Chạy bộ" },
];

// Component Header: hiển thị ở đầu mọi trang phía khách hàng (thanh tiện ích, logo, ô tìm kiếm, tài khoản, giỏ hàng, danh mục)
export default function Header() {
  // Lấy tổng số lượng sản phẩm trong giỏ để hiển thị badge đếm
  const { soLuong } = dungGioHang();
  // khach: thông tin khách đang đăng nhập (null nếu chưa đăng nhập); dangXuat: hàm đăng xuất
  const { khach, dangXuat } = dungXacThucKhach();
  // Hàm điều hướng trang bằng code (dùng khi tìm kiếm / đăng xuất)
  const navigate = useNavigate();
  // Vị trí (URL) hiện tại, dùng để đồng bộ ô tìm kiếm
  const location = useLocation();
  // Trạng thái lưu từ khóa người dùng gõ vào ô tìm kiếm
  const [tuKhoa, setTuKhoa] = useState("");

  // Đồng bộ ô tìm kiếm theo URL: trang có ?tu_khoa= thì hiển thị từ khóa đó,
  // ngược lại (ví dụ bấm về Trang chủ) thì XÓA TRẮNG ô tìm kiếm cho đúng ngữ cảnh
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setTuKhoa(params.get("tu_khoa") || "");
  }, [location.search, location.pathname]);

  // Xử lý submit form tìm kiếm: chuyển sang trang cửa hàng kèm từ khóa trên URL
  const timKiem = (e) => {
    // Ngăn trình duyệt tải lại trang theo hành vi mặc định của form
    e.preventDefault();
    // encodeURIComponent: mã hóa từ khóa để an toàn khi gắn vào query string (xử lý dấu cách, ký tự đặc biệt)
    navigate("/cua-hang?tu_khoa=" + encodeURIComponent(tuKhoa));
  };

  return (
    <header className="header">
      {/* Thanh tiện ích trên cùng */}
      <div className="top-bar">
        <div className="top-bar-trong">
          <span>Hệ thống cửa hàng dụng cụ thể thao chính hãng — Giao hàng toàn quốc</span>
          <div className="top-bar-phai">
            <Link to="/don-hang-cua-toi">Tra cứu đơn hàng</Link>
            <span className="tb-cham">•</span>
            <span>Hỗ trợ: <b>1900 1234</b></span>
          </div>
        </div>
      </div>

      {/* Header chính */}
      <div className="header-trong">
        <Link to="/" className="logo">
          <span className="logo-badge">TVU</span>
          <span className="logo-chu">Store<small>Dụng cụ thể thao</small></span>
        </Link>

        {/* Form ô tìm kiếm: bấm nút hoặc Enter sẽ gọi hàm timKiem */}
        <form className="o-tim" onSubmit={timKiem}>
          {/* Input liên kết 2 chiều với state tuKhoa: hiển thị value và cập nhật khi gõ */}
          <input
            placeholder="Bạn cần tìm gì? Vợt cầu lông, giày bóng đá, tạ tay..."
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
          />
          <button type="submit">{ic.search} Tìm kiếm</button>
        </form>

        <div className="header-phai">
          {/* Phân nhánh theo trạng thái đăng nhập: đã đăng nhập thì hiện tài khoản + nút đăng xuất, chưa thì hiện nút Đăng nhập */}
          {khach ? (
            <div className="hp-taikhoan">
              <Link to="/thong-tin-ca-nhan" className="hp-nut">
                <span className="hp-ic">{ic.user}</span>
                <span className="hp-text"><small>Xin chào</small><b>{khach.ho_ten}</b></span>
              </Link>
              <Link to="/don-hang-cua-toi" className="hp-nut-phu">{ic.box}<span>Đơn hàng</span></Link>
              {/* Nút đăng xuất: gọi dangXuat() để xóa phiên rồi điều hướng về trang chủ */}
              <button className="hp-dangxuat" onClick={() => { dangXuat(); navigate("/"); }}>Đăng xuất</button>
            </div>
          ) : (
            <Link to="/dang-nhap" className="hp-nut">
              <span className="hp-ic">{ic.user}</span>
              <span className="hp-text"><small>Tài khoản</small><b>Đăng nhập</b></span>
            </Link>
          )}

          {/* Nút giỏ hàng: dẫn tới trang giỏ hàng, hiển thị số sản phẩm hiện có */}
          <Link to="/gio-hang" className="nut-gio">
            <span className="hp-ic">{ic.cart}</span>
            <span className="hp-text"><small>Giỏ hàng</small><b>{soLuong} sản phẩm</b></span>
            {/* Chỉ hiển thị badge đếm khi giỏ có ít nhất 1 sản phẩm */}
            {soLuong > 0 && <span className="dem-gio">{soLuong}</span>}
          </Link>
        </div>
      </div>

      {/* Thanh danh mục */}
      <nav className="thanh-nav">
        <div className="thanh-nav-trong">
          <Link to="/cua-hang" className="nav-tatca">☰ Tất cả sản phẩm</Link>
          <Link to="/">Trang chủ</Link>
          {/* Sinh động các liên kết danh mục từ mảng DANH_MUC; mỗi link lọc sản phẩm theo danh_muc_id */}
          {DANH_MUC.map((d) => (
            <Link key={d.id} to={`/cua-hang?danh_muc_id=${d.id}`}>{d.ten}</Link>
          ))}
          <span className="hotline">{ic.phone} Hotline: 1900 1234</span>
        </div>
      </nav>
    </header>
  );
}
