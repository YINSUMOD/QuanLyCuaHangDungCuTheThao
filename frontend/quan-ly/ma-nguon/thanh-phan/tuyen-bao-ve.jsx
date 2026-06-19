// =====================================================================
// FILE: tuyen-bao-ve.jsx
// VAI TRÒ: Component bọc (wrapper) bảo vệ tuyến đường (route guard).
//   - Chặn người dùng chưa đăng nhập truy cập các trang cần xác thực.
//   - Kiểm tra phân quyền theo vai trò trước khi render nội dung con.
// CÁCH DÙNG: bọc quanh các route cần bảo vệ trong cấu hình router, ví dụ
//   <TuyenBaoVe vaiTro={["nhan_vien"]}> <TrangNoiBo/> </TuyenBaoVe>
// =====================================================================

// Thành phần bảo vệ tuyến đường: chỉ cho phép truy cập khi đã đăng nhập (và đúng vai trò)
// Navigate: component của react-router dùng để điều hướng (redirect) sang đường dẫn khác
import { Navigate } from "react-router-dom";
// dungXacThuc: hook lấy thông tin phiên đăng nhập từ ngữ cảnh (context) xác thực
import { dungXacThuc } from "../ngu-canh/xac-thuc";

// vaiTro: mảng các vai trò được phép (admin LUÔN được phép). Bỏ trống = mọi người đã đăng nhập.
// children: nội dung (trang/component) sẽ được render nếu vượt qua các điều kiện kiểm tra
export default function TuyenBaoVe({ children, vaiTro }) {
  // Lấy người dùng hiện tại từ ngữ cảnh; null/undefined nghĩa là chưa đăng nhập
  const { nguoiDung } = dungXacThuc();

  // Chưa đăng nhập -> tới trang đăng nhập
  if (!nguoiDung) return <Navigate to="/dang-nhap" replace />;

  // Không đủ quyền -> về trang chủ
  // Điều kiện chặn: route có yêu cầu vai trò (vaiTro) VÀ người dùng không phải admin
  // (admin được bỏ qua mọi kiểm tra) VÀ vai trò của họ không nằm trong danh sách cho phép
  if (vaiTro && nguoiDung.vai_tro !== "admin" && !vaiTro.includes(nguoiDung.vai_tro)) {
    return <Navigate to="/" replace />;
  }

  // Qua mọi kiểm tra -> hiển thị nội dung được bảo vệ
  return children;
}
