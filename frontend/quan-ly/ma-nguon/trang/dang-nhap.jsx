// =============================================================================
// Trang ĐĂNG NHẬP (bố cục 2 cột: panel giới thiệu + form đăng nhập)
// -----------------------------------------------------------------------------
// Vai trò: hiển thị form đăng nhập, gọi hàm dangNhap từ ngữ cảnh xác thực,
// xử lý trạng thái đang gửi/lỗi và điều hướng về trang chủ khi thành công.
// =============================================================================

// useState: quản lý state cục bộ; useNavigate/Navigate: điều hướng route
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
// dungXacThuc: hook lấy thông tin người dùng và hàm đăng nhập từ Context
import { dungXacThuc } from "../ngu-canh/xac-thuc";
// OMatKhau: component ô nhập mật khẩu (có nút ẩn/hiện) dùng lại
import OMatKhau from "../thanh-phan/o-mat-khau";

// Component trang đăng nhập (route /dang-nhap)
export default function DangNhap() {
  // Lấy hàm đăng nhập và thông tin người dùng hiện tại từ ngữ cảnh xác thực
  const { dangNhap, nguoiDung } = dungXacThuc();
  // Hàm điều hướng chương trình (chuyển trang sau khi đăng nhập thành công)
  const dieuHuong = useNavigate();

  // State lưu giá trị 2 ô nhập của form
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  // Thông báo lỗi hiển thị khi đăng nhập thất bại
  const [loi, setLoi] = useState("");
  // Cờ đánh dấu đang gửi yêu cầu đăng nhập (vô hiệu hóa nút để tránh bấm 2 lần)
  const [dangXuLy, setDangXuLy] = useState(false);

  // Nếu đã đăng nhập rồi thì chuyển thẳng vào trang chủ
  if (nguoiDung) {
    return <Navigate to="/" replace />;
  }

  // Hàm xử lý khi submit form đăng nhập
  const xuLyDangNhap = async (e) => {
    e.preventDefault(); // Chặn reload trang mặc định của form
    setLoi("");         // Xóa lỗi cũ trước khi gửi
    setDangXuLy(true);  // Bật trạng thái đang xử lý
    try {
      // Gọi API đăng nhập; nếu thành công thì chuyển về trang chủ
      await dangNhap(tenDangNhap, matKhau);
      dieuHuong("/");
    } catch (err) {
      // Ưu tiên thông báo lỗi từ server, nếu không có thì dùng câu mặc định
      setLoi(err.response?.data?.thong_bao || "Đăng nhập thất bại");
    } finally {
      // Dù thành công hay lỗi đều tắt trạng thái đang xử lý
      setDangXuLy(false);
    }
  };

  // Các điểm nổi bật giới thiệu ở cột trái
  const tinhNang = [
    "Quản lý sản phẩm, tồn kho theo thời gian thực",
    "Bán hàng nhanh, tự động trừ kho",
    "Báo cáo doanh thu trực quan",
  ];

  // Giao diện: màn chia 2 cột (trái giới thiệu, phải form đăng nhập)
  return (
    <div className="dang-nhap-man">
      {/* Cột trái: giới thiệu */}
      <div className="dang-nhap-trai">
        <div className="thuong-hieu"><span className="logo-badge">TVU</span> Store</div>
        <h2>Hệ thống quản lý cửa hàng dụng cụ thể thao</h2>
        <p>Giải pháp quản lý bán hàng toàn diện: sản phẩm, kho, đơn hàng, khách hàng và báo cáo — tất cả trong một nơi.</p>
        {/* Lặp qua danh sách điểm nổi bật, mỗi mục một dòng có dấu tích */}
        {tinhNang.map((t) => (
          <div className="tinh-nang" key={t}>
            <span className="cham">✓</span> {t}
          </div>
        ))}
      </div>

      {/* Cột phải: form đăng nhập */}
      <div className="dang-nhap-phai">
        <form className="hop-dang-nhap" onSubmit={xuLyDangNhap}>
          <h1>Đăng nhập</h1>
          <p className="phu-de">Vui lòng đăng nhập để tiếp tục sử dụng hệ thống</p>

          <div className="o-nhap">
            <label>Tên đăng nhập</label>
            <input
              value={tenDangNhap}
              onChange={(e) => setTenDangNhap(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>

          <div className="o-nhap">
            <label>Mật khẩu</label>
            <OMatKhau value={matKhau} onChange={(e) => setMatKhau(e.target.value)} placeholder="Nhập mật khẩu" required />
          </div>

          {/* Chỉ hiển thị khối báo lỗi khi biến loi có nội dung */}
          {loi && <div className="bao-loi">{loi}</div>}

          {/* Nút gửi: bị vô hiệu hóa và đổi nhãn khi đang xử lý đăng nhập */}
          <button type="submit" className="nut nut-chinh" style={{ width: "100%", justifyContent: "center" }} disabled={dangXuLy}>
            {dangXuLy ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
