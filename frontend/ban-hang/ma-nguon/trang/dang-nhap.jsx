// =============================================================================
// TRANG ĐĂNG NHẬP / ĐĂNG KÝ tài khoản KHÁCH HÀNG
// Chuyển qua lại giữa Đăng nhập / Đăng ký bằng liên kết ở DƯỚI form
// =============================================================================
import { useState } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { dungXacThucKhach } from "../ngu-canh/xac-thuc-khach";
import OMatKhau from "../thanh-phan/o-mat-khau";

// Component trang Đăng nhập / Đăng ký dành cho khách hàng
export default function DangNhap() {
  // Lấy trạng thái khách hiện tại và 2 hàm xác thực (đăng nhập, đăng ký) từ ngữ cảnh
  const { khach, dangNhap, dangKy } = dungXacThucKhach();
  // Hook điều hướng để chuyển trang sau khi xác thực thành công
  const navigate = useNavigate();
  // Đọc tham số trên URL (dùng để lấy đường dẫn 'next' cần quay lại sau khi đăng nhập)
  const [params] = useSearchParams();
  // Chỉ chấp nhận đường dẫn nội bộ (bắt đầu bằng '/' nhưng không phải '//') để tránh chuyển hướng ra ngoài
  const nextRaw = params.get("next") || "/";
  // Regex: chỉ giữ lại đường dẫn nội bộ hợp lệ, ngược lại quay về trang chủ '/'
  const next = /^\/(?!\/)/.test(nextRaw) ? nextRaw : "/";

  // Tab đang hiển thị: 'dang_nhap' hoặc 'dang_ky'
  const [tab, setTab] = useState("dang_nhap");
  // Thông báo lỗi hiển thị cho người dùng
  const [loi, setLoi] = useState("");
  // Dữ liệu form Đăng nhập (tài khoản có thể là email hoặc số điện thoại)
  const [dn, setDn] = useState({ tai_khoan: "", mat_khau: "" });
  // Dữ liệu form Đăng ký tài khoản khách hàng
  const [dk, setDk] = useState({ ho_ten: "", dien_thoai: "", email: "", mat_khau: "", dia_chi: "" });
  // Giá trị ô xác nhận mật khẩu (so khớp với dk.mat_khau khi đăng ký)
  const [xacNhan, setXacNhan] = useState("");

  // Nếu đã đăng nhập rồi thì chuyển hướng ngay sang trang 'next', không hiển thị form nữa
  if (khach) return <Navigate to={next} replace />;

  // Đổi tab và xóa thông báo lỗi cũ
  const chuyenTab = (t) => { setTab(t); setLoi(""); };

  // Xử lý submit form Đăng nhập
  const xuLyDangNhap = async (e) => {
    e.preventDefault(); // Chặn reload trang mặc định của form
    setLoi("");
    try {
      // Gọi API đăng nhập; thành công thì chuyển sang trang 'next'
      await dangNhap(dn.tai_khoan, dn.mat_khau);
      navigate(next);
    } catch (err) {
      // Lấy thông báo lỗi từ server, nếu không có thì dùng thông báo mặc định
      setLoi(err.response?.data?.thong_bao || "Đăng nhập thất bại");
    }
  };

  // Xử lý submit form Đăng ký
  const xuLyDangKy = async (e) => {
    e.preventDefault(); // Chặn reload trang mặc định của form
    setLoi("");
    // Kiểm tra hợp lệ: phải có ít nhất số điện thoại hoặc email
    if (!dk.dien_thoai && !dk.email) {
      setLoi("Vui lòng nhập số điện thoại hoặc email.");
      return;
    }
    // Kiểm tra độ dài mật khẩu tối thiểu 6 ký tự
    if (dk.mat_khau.length < 6) {
      setLoi("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    // Kiểm tra mật khẩu xác nhận phải trùng khớp
    if (dk.mat_khau !== xacNhan) {
      setLoi("Mật khẩu xác nhận không khớp. Vui lòng nhập lại.");
      return;
    }
    try {
      // Gọi API đăng ký; thành công thì chuyển sang trang 'next'
      await dangKy(dk);
      navigate(next);
    } catch (err) {
      // Lấy thông báo lỗi từ server, nếu không có thì dùng thông báo mặc định
      setLoi(err.response?.data?.thong_bao || "Đăng ký thất bại");
    }
  };

  return (
    <div className="trang">
      <div className="hop-xac-thuc">
        {/* Tiêu đề thay đổi theo tab đang chọn */}
        <h2 className="xt-tieude">{tab === "dang_nhap" ? "Đăng nhập" : "Đăng ký tài khoản"}</h2>

        {/* Chỉ hiển thị khung báo lỗi khi có lỗi */}
        {loi && <div className="bao-loi">{loi}</div>}

        {/* Hiển thị form Đăng nhập hoặc form Đăng ký tùy theo tab */}
        {tab === "dang_nhap" ? (
          // ===== Form ĐĂNG NHẬP =====
          <form onSubmit={xuLyDangNhap}>
            <label>Email hoặc số điện thoại</label>
            <input value={dn.tai_khoan} onChange={(e) => setDn({ ...dn, tai_khoan: e.target.value })} required />
            <label>Mật khẩu</label>
            <OMatKhau value={dn.mat_khau} onChange={(e) => setDn({ ...dn, mat_khau: e.target.value })} required />
            <button type="submit" className="nut-xt">Đăng nhập</button>
            {/* Liên kết chuyển sang tab Đăng ký */}
            <p className="chuyen-tab">
              Chưa có tài khoản?{" "}
              <button type="button" onClick={() => chuyenTab("dang_ky")}>Đăng ký ngay</button>
            </p>
          </form>
        ) : (
          // ===== Form ĐĂNG KÝ =====
          <form onSubmit={xuLyDangKy}>
            <label>Họ tên *</label>
            <input value={dk.ho_ten} onChange={(e) => setDk({ ...dk, ho_ten: e.target.value })} required />
            <label>Số điện thoại</label>
            <input value={dk.dien_thoai} onChange={(e) => setDk({ ...dk, dien_thoai: e.target.value })} />
            <label>Email</label>
            <input type="email" value={dk.email} onChange={(e) => setDk({ ...dk, email: e.target.value })} />
            <label>Mật khẩu *</label>
            <OMatKhau value={dk.mat_khau} onChange={(e) => setDk({ ...dk, mat_khau: e.target.value })} required />
            <label>Xác nhận mật khẩu *</label>
            <OMatKhau value={xacNhan} onChange={(e) => setXacNhan(e.target.value)} placeholder="Nhập lại mật khẩu" required />
            <label>Địa chỉ</label>
            <input value={dk.dia_chi} onChange={(e) => setDk({ ...dk, dia_chi: e.target.value })} />
            <button type="submit" className="nut-xt">Đăng ký</button>
            {/* Liên kết chuyển sang tab Đăng nhập */}
            <p className="chuyen-tab">
              Đã có tài khoản?{" "}
              <button type="button" onClick={() => chuyenTab("dang_nhap")}>Đăng nhập</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
