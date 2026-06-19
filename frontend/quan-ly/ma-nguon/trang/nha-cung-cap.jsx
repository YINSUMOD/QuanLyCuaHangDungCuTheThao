// =============================================================
// Trang QUẢN LÝ NHÀ CUNG CẤP
// Vai trò: hiển thị danh sách nhà cung cấp và cho phép thêm/sửa/xóa.
// Toàn bộ giao diện CRUD (bảng dữ liệu, form, nút thao tác, gọi API)
// được tái sử dụng từ component dùng chung <TrangQuanLy />; file này
// chỉ khai báo cấu hình riêng cho nghiệp vụ "nhà cung cấp".
// =============================================================
// Import component bảng quản lý dùng chung (tái sử dụng cho nhiều trang)
import TrangQuanLy from "../thanh-phan/trang-quan-ly";

// Component trang Nhà cung cấp (export mặc định để router gọi đến)
export default function NhaCungCap() {
  return (
    // Truyền cấu hình vào component dùng chung để dựng trang CRUD
    <TrangQuanLy
      // Tiêu đề hiển thị trên đầu trang
      tieuDe="Quản lý nhà cung cấp"
      // Đường dẫn API backend cho mọi thao tác CRUD nhà cung cấp
      endpoint="/nha-cung-cap"
      // cot: định nghĩa các cột hiển thị trong bảng danh sách
      // (key = tên trường dữ liệu trả về từ API, nhan = nhãn hiển thị)
      cot={[
        { key: "id", nhan: "ID" },
        { key: "ten_ncc", nhan: "Tên nhà cung cấp" },
        { key: "dien_thoai", nhan: "Điện thoại" },
        { key: "email", nhan: "Email" },
        { key: "dia_chi", nhan: "Địa chỉ" },
      ]}
      // truong: định nghĩa các trường nhập liệu trong form thêm/sửa
      // (name = tên trường gửi lên API, loai = kiểu input, required = bắt buộc)
      truong={[
        // Tên nhà cung cấp là trường bắt buộc (required)
        { name: "ten_ncc", nhan: "Tên nhà cung cấp", loai: "text", required: true },
        { name: "dien_thoai", nhan: "Điện thoại", loai: "text" },
        // Kiểu "email" để trình duyệt tự kiểm tra định dạng email
        { name: "email", nhan: "Email", loai: "email" },
        { name: "dia_chi", nhan: "Địa chỉ", loai: "text" },
      ]}
      // coTimKiem=false: ẩn ô tìm kiếm trên trang này
    />
  );
}
