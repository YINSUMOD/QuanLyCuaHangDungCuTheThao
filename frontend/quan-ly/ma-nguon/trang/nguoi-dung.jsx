/*
 * Trang QUẢN LÝ TÀI KHOẢN (chỉ admin)
 * --------------------------------------------------
 * Vai trò file: Định nghĩa trang quản lý người dùng/tài khoản trong hệ thống.
 * Trang tái sử dụng component dùng chung <TrangQuanLy> để tự sinh ra giao diện
 * bảng danh sách + form thêm/sửa, chỉ cần khai báo: tiêu đề, endpoint API,
 * danh sách cột hiển thị (cot) và danh sách trường nhập liệu (truong).
 * Lưu ý nghiệp vụ: chỉ tài khoản admin mới được phép truy cập trang này.
 */
// Trang QUẢN LÝ TÀI KHOẢN (chỉ admin)
// Component dùng chung tạo trang quản lý (bảng danh sách + form CRUD)
import TrangQuanLy from "../thanh-phan/trang-quan-ly";
// Hàm tiện ích định dạng ngày tháng để hiển thị cho dễ đọc
import { dinhDangNgay } from "../tien-ich/dinh-dang";

// Danh sách các vai trò (quyền hạn) của tài khoản trong cửa hàng.
// value: mã vai trò lưu trong CSDL; label: tên hiển thị tiếng Việt trên giao diện.
const VAI_TRO = [
  { value: "admin", label: "Quản trị viên" },
  { value: "quan_ly", label: "Quản lý cửa hàng" },
  { value: "thu_ngan", label: "Thu ngân (bán hàng)" },
  { value: "nhan_vien_kho", label: "Nhân viên kho" },
];
// Đổi mã vai trò (vd: "thu_ngan") thành tên hiển thị (vd: "Thu ngân (bán hàng)").
// Nếu không tìm thấy trong danh sách thì trả về nguyên mã (v) để tránh hiển thị rỗng.
const tenVaiTro = (v) => (VAI_TRO.find((x) => x.value === v)?.label || v);

// Component trang quản lý tài khoản người dùng.
// Chỉ cấu hình (props) cho <TrangQuanLy>, mọi logic CRUD do component dùng chung xử lý.
export default function NguoiDung() {
  return (
    <TrangQuanLy
      tieuDe="Quản lý tài khoản"
      endpoint="/nguoi-dung"
      /* cot: khai báo các cột hiển thị trong bảng danh sách tài khoản */
      cot={[
        { key: "id", nhan: "ID" },
        { key: "ten_dang_nhap", nhan: "Tên đăng nhập" },
        { key: "ho_ten", nhan: "Họ tên" },
        {
          key: "vai_tro",
          nhan: "Vai trò",
          // render: chuyển mã vai trò trong dữ liệu (r.vai_tro) sang tên tiếng Việt
          render: (r) => tenVaiTro(r.vai_tro),
        },
        {
          key: "trang_thai",
          nhan: "Trạng thái",
          // trang_thai = 1 (true) -> "Hoạt động", = 0 (false) -> "Đã khóa"
          render: (r) => (r.trang_thai ? "Hoạt động" : "Đã khóa"),
        },
        // Cột ngày tạo: dùng dinhDangNgay để hiển thị ngày theo định dạng dễ đọc
        { key: "ngay_tao", nhan: "Ngày tạo", render: (r) => dinhDangNgay(r.ngay_tao) },
      ]}
      /* truong: khai báo các trường nhập liệu của form thêm/sửa tài khoản */
      truong={[
        // Tên đăng nhập: bắt buộc nhập (required)
        { name: "ten_dang_nhap", nhan: "Tên đăng nhập", loai: "text", required: true },
        {
          name: "mat_khau",
          // Khi SỬA: bỏ trống ô mật khẩu nghĩa là giữ nguyên mật khẩu cũ (không đổi)
          nhan: "Mật khẩu (để trống nếu không đổi khi sửa)",
          loai: "password",
        },
        { name: "ho_ten", nhan: "Họ tên", loai: "text" },
        {
          name: "vai_tro",
          nhan: "Vai trò",
          loai: "select",
          // Dùng lại danh sách VAI_TRO ở trên làm các lựa chọn cho ô chọn vai trò
          options: VAI_TRO,
        },
        {
          name: "trang_thai",
          nhan: "Trạng thái",
          loai: "select",
          // Trạng thái tài khoản: 1 = Hoạt động (đăng nhập được), 0 = Đã khóa
          options: [
            { value: 1, label: "Hoạt động" },
            { value: 0, label: "Đã khóa" },
          ],
        },
      ]}
      // Tắt thanh tìm kiếm cho trang này (danh sách tài khoản thường ít, không cần lọc)
      coTimKiem={false}
    />
  );
}
