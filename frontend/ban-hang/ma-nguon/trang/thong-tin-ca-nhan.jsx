// =============================================================================
// TRANG THÔNG TIN CÁ NHÂN của khách hàng (xem & cập nhật)
// =============================================================================
import { useState } from "react"; // Hook quản lý state cục bộ của component
import { Link } from "react-router-dom"; // Link điều hướng nội bộ (SPA, không tải lại trang)
import { dungXacThucKhach } from "../ngu-canh/xac-thuc-khach"; // Hook context xác thực khách hàng (lấy thông tin + hàm cập nhật)
import OMatKhau from "../thanh-phan/o-mat-khau"; // Ô nhập mật khẩu (có nút ẩn/hiện)

// Component trang: hiển thị và cho phép khách hàng cập nhật thông tin cá nhân
export default function ThongTinCaNhan() {
  // Lấy dữ liệu khách hàng hiện tại và hàm capNhat từ context xác thực
  const { khach, capNhat } = dungXacThucKhach();
  // State của form, khởi tạo bằng thông tin khách hiện có (dùng "" nếu chưa có)
  const [form, setForm] = useState({
    ho_ten: khach?.ho_ten || "",
    dien_thoai: khach?.dien_thoai || "",
    email: khach?.email || "",
    dia_chi: khach?.dia_chi || "",
    mat_khau: "", // Mật khẩu mới, để trống nếu không muốn đổi
  });
  const [xacNhan, setXacNhan] = useState(""); // Giá trị nhập lại để xác nhận mật khẩu mới
  const [thongBao, setThongBao] = useState(""); // Thông báo thành công
  const [loi, setLoi] = useState(""); // Thông báo lỗi

  // Xử lý submit form: kiểm tra hợp lệ rồi gọi API cập nhật thông tin
  const luu = async (e) => {
    e.preventDefault(); // Chặn reload trang mặc định của form
    setThongBao(""); // Xóa thông báo cũ trước khi xử lý
    setLoi("");
    // Nếu có đổi mật khẩu thì xác nhận phải khớp
    if (form.mat_khau && form.mat_khau !== xacNhan) {
      setLoi("Mật khẩu xác nhận không khớp.");
      return;
    }
    try {
      // Gọi hàm cập nhật từ context (gửi dữ liệu lên server)
      await capNhat(form);
      setThongBao("✅ Đã cập nhật thông tin cá nhân");
      // Xóa trường mật khẩu sau khi lưu thành công để không lưu lại trong state
      setForm((f) => ({ ...f, mat_khau: "" }));
      setXacNhan("");
    } catch (err) {
      // Ưu tiên hiển thị thông báo lỗi từ server, nếu không có thì dùng mặc định
      setLoi(err.response?.data?.thong_bao || "Cập nhật thất bại");
    }
  };

  // Giao diện trang thông tin cá nhân
  return (
    <div className="trang">
      <h1 className="tieu-de">Thông tin cá nhân</h1>
      <div className="hop-xac-thuc" style={{ margin: "0 0 20px", maxWidth: 520 }}>
        {/* Chỉ hiện điểm tích lũy khi có dữ liệu (khác null/undefined) */}
        {khach?.diem_tich_luy != null && (
          <div className="goi-y">Điểm tích lũy của bạn: <b>{khach.diem_tich_luy}</b></div>
        )}
        {/* Form cập nhật thông tin, submit gọi hàm luu */}
        <form onSubmit={luu}>
          {/* Họ tên là trường bắt buộc (required) */}
          <label>Họ tên *</label>
          <input value={form.ho_ten} onChange={(e) => setForm({ ...form, ho_ten: e.target.value })} required />
          <label>Số điện thoại</label>
          <input value={form.dien_thoai} onChange={(e) => setForm({ ...form, dien_thoai: e.target.value })} />
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label>Địa chỉ</label>
          <input value={form.dia_chi} onChange={(e) => setForm({ ...form, dia_chi: e.target.value })} />
          {/* Ô nhập mật khẩu mới; để trống đồng nghĩa giữ nguyên mật khẩu cũ */}
          <label>Mật khẩu mới (để trống nếu không đổi)</label>
          <OMatKhau value={form.mat_khau} onChange={(e) => setForm({ ...form, mat_khau: e.target.value })} />
          {/* Chỉ hiện ô xác nhận khi người dùng đã nhập mật khẩu mới */}
          {form.mat_khau && (
            <>
              <label>Xác nhận mật khẩu mới</label>
              <OMatKhau value={xacNhan} onChange={(e) => setXacNhan(e.target.value)} placeholder="Nhập lại mật khẩu mới" />
            </>
          )}

          {/* Khối thông báo thành công (nền xanh) - chỉ hiện khi có nội dung */}
          {thongBao && <div className="goi-y" style={{ background: "#f0fdf4", color: "#15803d" }}>{thongBao}</div>}
          {/* Khối báo lỗi - chỉ hiện khi có lỗi */}
          {loi && <div className="bao-loi">{loi}</div>}

          <button type="submit" className="nut-xt">Lưu thay đổi</button>
        </form>
      </div>
      {/* Liên kết điều hướng sang trang danh sách đơn hàng của khách */}
      <Link to="/don-hang-cua-toi" className="lk-tiep">→ Xem đơn hàng của tôi</Link>
    </div>
  );
}
