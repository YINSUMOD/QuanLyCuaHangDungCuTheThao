// =============================================================================
// Bố cục chung: thanh menu bên trái (sidebar) + thanh trên cùng + nội dung trang
// Menu được chia nhóm + có icon, mô phỏng các phần mềm quản lý bán hàng thực tế
// =============================================================================
// NavLink: link điều hướng có trạng thái active; Outlet: chỗ render route con; useNavigate: chuyển trang bằng code
import { NavLink, Outlet, useNavigate } from "react-router-dom";
// Hook lấy ngữ cảnh xác thực (thông tin người dùng đang đăng nhập + hàm đăng xuất)
import { dungXacThuc } from "../ngu-canh/xac-thuc";

// Bộ icon dạng SVG (nét mảnh) cho từng mục menu
// Mỗi thuộc tính là một phần tử JSX <svg> để nhúng trực tiếp vào NavLink
const icon = {
  // Icon "Tổng quan" (dạng các ô bảng điều khiển - dashboard)
  tongQuan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  // Icon "Bán hàng" (giỏ hàng / xe đẩy)
  banHang: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  // Icon "Đơn hàng" (tài liệu / hóa đơn có dòng kẻ)
  donHang: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  ),
  // Icon "Sản phẩm" (khối hộp 3D - thùng hàng)
  sanPham: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  // Icon "Danh mục" (thư mục - folder)
  danhMuc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  // Icon "Nhà cung cấp" (xe tải giao hàng)
  nhaCungCap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  // Icon "Khách hàng" (nhóm người dùng)
  khachHang: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  // Icon "Tài khoản" (chìa khóa - quản lý người dùng/quyền)
  taiKhoan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  // Icon "Báo cáo" (biểu đồ cột thống kê)
  baoCao: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  // Icon "Nhập kho" (mũi tên hướng xuống - đưa hàng vào kho)
  nhapKho: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

// Bảng ánh xạ mã vai trò (lưu trong DB) sang tên hiển thị tiếng Việt cho người dùng
// Export để các trang khác dùng lại khi cần hiển thị tên vai trò
export const NHAN_VAI_TRO = {
  admin: "Quản trị viên",
  quan_ly: "Quản lý",
  thu_ngan: "Thu ngân",
  nhan_vien_kho: "Nhân viên kho",
};

// Component bố cục khung (layout) bao quanh tất cả các trang sau khi đăng nhập:
// gồm sidebar menu bên trái + thanh trên cùng + vùng nội dung trang con (Outlet)
export default function BoCuc() {
  // Lấy thông tin người dùng hiện tại và hàm đăng xuất từ ngữ cảnh xác thực
  const { nguoiDung, dangXuat } = dungXacThuc();
  // Hàm điều hướng chuyển trang (dùng khi đăng xuất)
  const dieuHuong = useNavigate();

  // VT = vai trò của người dùng hiện tại (dùng để lọc menu theo quyền)
  const VT = nguoiDung?.vai_tro;
  // Kiểm tra quyền xem một mục (admin luôn thấy; bỏ trống vaiTro = mọi người)
  // Trả về true khi: không yêu cầu vai trò, là admin, hoặc vai trò hiện tại nằm trong danh sách được phép
  const coQuyen = (vaiTro) => !vaiTro || VT === "admin" || vaiTro.includes(VT);

  // Menu gốc chia theo nhóm; mỗi mục có: đường dẫn route, nhãn, icon và vai trò được phép xem
  // (cuoi: true => khớp đường dẫn chính xác, dùng cho route "/" trang Tổng quan)
  const nhomGoc = [
    {
      nhan: "Tổng quan",
      muc: [
        { duong_dan: "/", nhan: "Tổng quan", icon: icon.tongQuan, cuoi: true },
        { duong_dan: "/bao-cao", nhan: "Báo cáo", icon: icon.baoCao, vaiTro: ["quan_ly"] },
      ],
    },
    {
      nhan: "Bán hàng",
      muc: [
        { duong_dan: "/ban-hang", nhan: "Bán hàng", icon: icon.banHang, vaiTro: ["quan_ly", "thu_ngan"] },
        { duong_dan: "/don-hang", nhan: "Đơn hàng", icon: icon.donHang, vaiTro: ["quan_ly", "thu_ngan"] },
      ],
    },
    {
      nhan: "Kho hàng",
      muc: [
        { duong_dan: "/san-pham", nhan: "Sản phẩm", icon: icon.sanPham, vaiTro: ["quan_ly", "nhan_vien_kho"] },
        { duong_dan: "/nhap-kho", nhan: "Nhập kho", icon: icon.nhapKho, vaiTro: ["quan_ly", "nhan_vien_kho"] },
        { duong_dan: "/danh-muc", nhan: "Danh mục", icon: icon.danhMuc, vaiTro: ["quan_ly", "nhan_vien_kho"] },
        { duong_dan: "/nha-cung-cap", nhan: "Nhà cung cấp", icon: icon.nhaCungCap, vaiTro: ["quan_ly", "nhan_vien_kho"] },
      ],
    },
    {
      nhan: "Đối tác & khách hàng",
      muc: [{ duong_dan: "/khach-hang", nhan: "Khách hàng", icon: icon.khachHang, vaiTro: ["quan_ly", "thu_ngan"] }],
    },
    {
      nhan: "Hệ thống",
      muc: [{ duong_dan: "/nguoi-dung", nhan: "Tài khoản", icon: icon.taiKhoan, vaiTro: ["admin"] }],
    },
  ];

  // Lọc mục theo quyền, bỏ nhóm rỗng
  // Bước 1 (map): trong mỗi nhóm chỉ giữ lại các mục mà người dùng có quyền xem
  // Bước 2 (filter): loại bỏ những nhóm không còn mục nào để không hiện tiêu đề nhóm trống
  const cacNhom = nhomGoc
    .map((n) => ({ ...n, muc: n.muc.filter((m) => coQuyen(m.vaiTro)) }))
    .filter((n) => n.muc.length > 0);

  // Xử lý đăng xuất: xóa phiên đăng nhập rồi chuyển về trang đăng nhập
  const xuLyDangXuat = () => {
    dangXuat();
    dieuHuong("/dang-nhap");
  };

  // Lấy chữ cái đầu của họ tên (viết hoa) để làm avatar chữ; mặc định "?" nếu thiếu tên
  const chuDau = (nguoiDung?.ho_ten || "?").trim().charAt(0).toUpperCase();

  return (
    // Khung bố cục tổng: chia 2 cột (sidebar + khu vực chính)
    <div className="bo-cuc">
      {/* Thanh menu bên trái */}
      <aside className="sidebar">
        {/* Logo / thương hiệu ở đầu sidebar */}
        <div className="logo">
          <span className="logo-badge">TVU</span>
          <span className="logo-chu">Store<small>Quản trị hệ thống</small></span>
        </div>
        {/* Vùng điều hướng chứa các nhóm menu */}
        <nav>
          {/* Lặp qua từng nhóm menu đã lọc theo quyền để render */}
          {cacNhom.map((nhom) => (
            <div className="nhom-menu-wrap" key={nhom.nhan}>
              {/* Tiêu đề nhóm menu */}
              <div className="nhom-menu">
                <span className="nhan-nhom">{nhom.nhan}</span>
              </div>
              {/* Lặp các mục con trong nhóm; mỗi mục là 1 NavLink dẫn đến route tương ứng */}
              {nhom.muc.map((m) => (
                <NavLink
                  key={m.duong_dan}
                  to={m.duong_dan}
                  end={m.cuoi}
                  // Gắn thêm class "active" khi route hiện tại trùng với link để tô sáng mục đang chọn
                  className={({ isActive }) => "muc-menu" + (isActive ? " active" : "")}
                >
                  {m.icon}
                  {m.nhan}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Khu vực bên phải */}
      <div className="khu-vuc-chinh">
        {/* Thanh trên cùng: hiển thị thông tin người dùng và nút đăng xuất */}
        <header className="thanh-tren">
          {/* Ô trống bên trái để đẩy khối thông tin người dùng sang phải (canh layout) */}
          <div></div>
          <div className="thong-tin-nguoi-dung">
            {/* Avatar dạng chữ cái đầu của họ tên */}
            <div className="avatar-chu">{chuDau}</div>
            <span>
              {/* Họ tên + tên vai trò (mặc định "Nhân viên" nếu vai trò không có trong bảng ánh xạ) */}
              <b>{nguoiDung?.ho_ten}</b> · {NHAN_VAI_TRO[nguoiDung?.vai_tro] || "Nhân viên"}
            </span>
            {/* Nút đăng xuất */}
            <button className="nut nut-phu" onClick={xuLyDangXuat}>
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Nội dung từng trang sẽ được hiển thị ở đây */}
        <main className="noi-dung">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
