// =============================================================================
// Trang QUẢN LÝ KHÁCH HÀNG
// Vai trò: Hiển thị màn hình quản lý danh sách khách hàng (xem/thêm/sửa/xóa).
// Trang này chỉ KHAI BÁO CẤU HÌNH (tiêu đề, endpoint API, cột bảng, các trường
// trong form) rồi truyền vào component dùng chung <TrangQuanLy> để render và xử lý
// toàn bộ logic CRUD. Nhờ vậy mọi trang quản lý đều thống nhất giao diện/cách hoạt động.
// =============================================================================
// Import component bảng quản lý dùng chung (CRUD) cho tất cả các trang
import TrangQuanLy from "../thanh-phan/trang-quan-ly";

// Component trang quản lý khách hàng (mặc định export để router sử dụng)
export default function KhachHang() {
  return (
    <TrangQuanLy
      // Tiêu đề hiển thị trên đầu trang
      tieuDe="Quản lý khách hàng"
      // Đường dẫn API backend dùng cho các thao tác CRUD khách hàng
      endpoint="/khach-hang"
      // Khai báo các CỘT của bảng danh sách: key = tên trường dữ liệu, nhan = nhãn hiển thị
      cot={[
        { key: "id", nhan: "ID" },
        { key: "ho_ten", nhan: "Họ tên" },
        { key: "dien_thoai", nhan: "Điện thoại" },
        { key: "email", nhan: "Email" },
        { key: "dia_chi", nhan: "Địa chỉ" },
        { key: "diem_tich_luy", nhan: "Điểm tích lũy" },
      ]}
      // Khai báo các TRƯỜNG trong form thêm/sửa: name = tên trường, nhan = nhãn,
      // loai = kiểu input (text/email/number), required = bắt buộc nhập
      truong={[
        // Họ tên: bắt buộc nhập (required: true)
        { name: "ho_ten", nhan: "Họ tên", loai: "text", required: true },
        { name: "dien_thoai", nhan: "Điện thoại", loai: "text" },
        { name: "email", nhan: "Email", loai: "email" },
        { name: "dia_chi", nhan: "Địa chỉ", loai: "text" },
        { name: "diem_tich_luy", nhan: "Điểm tích lũy", loai: "number" },
      ]}
    />
  );
}
