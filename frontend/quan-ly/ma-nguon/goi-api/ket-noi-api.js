// =============================================================================
// Cấu hình axios để gọi tới Backend API
// File này tạo sẵn 1 đối tượng axios dùng chung cho toàn bộ frontend:
// - Tự gắn token xác thực vào header của mỗi request
// - Tự xử lý khi phiên đăng nhập hết hạn (lỗi 401)
// Mọi nơi trong ứng dụng import "ketNoiApi" để gọi API thay vì gọi axios trực tiếp.
// =============================================================================
import axios from "axios";

// Tạo instance axios riêng với cấu hình mặc định cho dự án
const ketNoiApi = axios.create({
  baseURL: "/api", // Nginx/Vite sẽ chuyển tiếp /api tới backend
});

// Interceptor request: chạy trước khi mỗi request được gửi đi
// Tự động gắn token đăng nhập vào mọi request (nếu đã đăng nhập)
ketNoiApi.interceptors.request.use((config) => {
  // Lấy token đã lưu sau khi đăng nhập thành công
  const token = localStorage.getItem("token");
  if (token) {
    // Gắn token theo chuẩn Bearer để backend xác thực và phân quyền
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Trả config về để axios tiếp tục gửi request
  return config;
});

// Interceptor response: chạy sau khi nhận phản hồi từ backend
// Khi token hết hạn (lỗi 401) -> xóa token và quay về trang đăng nhập
ketNoiApi.interceptors.response.use(
  // Nhánh thành công: trả nguyên response cho nơi gọi
  (res) => res,
  // Nhánh lỗi: kiểm tra mã lỗi để xử lý hết hạn phiên
  (err) => {
    // 401 = Unauthorized: token sai/hết hạn -> coi như chưa đăng nhập
    if (err.response?.status === 401) {
      // Xóa token cũ để tránh tiếp tục gửi token không hợp lệ
      localStorage.removeItem("token");
      // Tránh lặp vô hạn: chỉ chuyển hướng khi không đang ở trang đăng nhập
      // (hệ thống quản trị chạy ở đường dẫn con /quan-ly nên redirect tới /quan-ly/dang-nhap)
      if (window.location.pathname !== "/quan-ly/dang-nhap") {
        window.location.href = "/quan-ly/dang-nhap";
      }
    }
    // Đẩy lỗi tiếp tục để nơi gọi (try/catch) tự xử lý nếu cần
    return Promise.reject(err);
  }
);

// Xuất instance dùng chung cho toàn bộ ứng dụng frontend
export default ketNoiApi;
