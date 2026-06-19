/*
 * Trang QUẢN LÝ DANH MỤC
 * Vai trò: Hiển thị màn hình quản lý danh mục sản phẩm (CRUD: xem, thêm, sửa, xóa).
 * Đây là một "trang mỏng" (thin page): chỉ cấu hình rồi giao toàn bộ logic
 * (gọi API, vẽ bảng, mở form, validate...) cho component dùng chung <TrangQuanLy>.
 */
// Import component dùng chung tái sử dụng cho mọi trang quản lý dạng bảng + form
import TrangQuanLy from "../thanh-phan/trang-quan-ly";

// Component trang Danh mục — xuất mặc định để router gọi tới
export default function DanhMuc() {
  return (
    // Truyền cấu hình xuống <TrangQuanLy> để dựng giao diện quản lý danh mục
    <TrangQuanLy
      // Tiêu đề hiển thị trên đầu trang
      tieuDe="Quản lý danh mục"
      // Đường dẫn API backend cho thao tác CRUD danh mục
      endpoint="/danh-muc"
      // Định nghĩa các CỘT hiển thị trong bảng danh sách (key: tên trường dữ liệu, nhan: nhãn cột)
      cot={[
        { key: "id", nhan: "ID" }, // Cột mã định danh
        { key: "ten_danh_muc", nhan: "Tên danh mục" }, // Cột tên danh mục
        { key: "mo_ta", nhan: "Mô tả" }, // Cột mô tả
      ]}
      // Định nghĩa các TRƯỜNG nhập liệu trong form thêm/sửa (name: tên trường, loai: kiểu input)
      truong={[
        // Tên danh mục: ô text, bắt buộc nhập (required)
        { name: "ten_danh_muc", nhan: "Tên danh mục", loai: "text", required: true },
        // Mô tả: ô nhập nhiều dòng (textarea), không bắt buộc
        { name: "mo_ta", nhan: "Mô tả", loai: "textarea" },
      ]}
      // Tắt thanh tìm kiếm trên trang này (danh mục thường ít, không cần tìm kiếm)
      coTimKiem={false}
    />
  );
}
