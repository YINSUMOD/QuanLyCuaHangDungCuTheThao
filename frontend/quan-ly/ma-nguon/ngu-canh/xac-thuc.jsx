// =============================================================================
// Ngữ cảnh (Context) quản lý trạng thái đăng nhập, dùng chung cho toàn ứng dụng
// =============================================================================
// Import các hook cần thiết của React để tạo Context và quản lý trạng thái
import { createContext, useContext, useState, useEffect } from "react";
// Đối tượng axios đã cấu hình sẵn để gọi API tới backend
import ketNoiApi from "../goi-api/ket-noi-api";

// Tạo Context dùng để chia sẻ trạng thái đăng nhập cho toàn bộ cây component
const NguCanhXacThuc = createContext(null);

// Component bọc (Provider) cung cấp trạng thái xác thực cho các component con
export function CungCapXacThuc({ children }) {
  const [nguoiDung, setNguoiDung] = useState(null); // thông tin người dùng hiện tại
  const [dangTai, setDangTai] = useState(true);     // đang kiểm tra phiên đăng nhập?

  // Khi mở app: nếu có token thì lấy lại thông tin người dùng
  // useEffect với mảng phụ thuộc rỗng [] => chỉ chạy 1 lần khi component mount
  useEffect(() => {
    // Lấy token đã lưu trong trình duyệt (nếu trước đó đã đăng nhập)
    const token = localStorage.getItem("token");
    // Không có token => coi như chưa đăng nhập, dừng kiểm tra ngay
    if (!token) {
      setDangTai(false);
      return;
    }
    // Có token => gọi API /auth/me để xác thực và lấy thông tin người dùng
    ketNoiApi
      .get("/auth/me")
      // Thành công: lưu thông tin người dùng lấy từ trường du_lieu của phản hồi
      .then((res) => setNguoiDung(res.data.du_lieu))
      // Thất bại (token sai/hết hạn): xóa token hỏng khỏi localStorage
      .catch(() => localStorage.removeItem("token"))
      // Dù thành công hay lỗi đều tắt cờ đang tải để hiển thị giao diện
      .finally(() => setDangTai(false));
  }, []);

  // Hàm đăng nhập: gửi tên đăng nhập và mật khẩu lên server để lấy token
  const dangNhap = async (ten_dang_nhap, mat_khau) => {
    // Gọi API đăng nhập với thông tin tài khoản người dùng nhập
    const res = await ketNoiApi.post("/auth/login", { ten_dang_nhap, mat_khau });
    // Lưu token trả về để các lần gọi API sau được xác thực và giữ phiên đăng nhập
    localStorage.setItem("token", res.data.du_lieu.token);
    // Cập nhật thông tin người dùng vào state => giao diện chuyển sang trạng thái đã đăng nhập
    setNguoiDung(res.data.du_lieu.nguoi_dung);
  };

  // Hàm đăng xuất: xóa token và thông tin người dùng khỏi ứng dụng
  const dangXuat = () => {
    // Xóa token khỏi localStorage để không tự đăng nhập lại ở lần mở app sau
    localStorage.removeItem("token");
    // Đặt lại người dùng về null => giao diện trở lại trạng thái chưa đăng nhập
    setNguoiDung(null);
  };

  return (
    // Provider chia sẻ trạng thái và các hàm xác thực xuống toàn bộ component con
    <NguCanhXacThuc.Provider value={{ nguoiDung, dangTai, dangNhap, dangXuat }}>
      {/* Hiển thị các component con được bọc bên trong Provider */}
      {children}
    </NguCanhXacThuc.Provider>
  );
}

// Hook tiện dụng để lấy thông tin đăng nhập ở bất kỳ component nào
export const dungXacThuc = () => useContext(NguCanhXacThuc);
