/*
 * File: ket-noi-api.js
 * Vai trò: Tạo và cấu hình một đối tượng axios dùng chung cho phần web bán hàng (phía khách hàng).
 *          Mọi lời gọi API tới backend đều đi qua đối tượng này để tự động thêm tiền tố "/api"
 *          và tự động đính kèm token đăng nhập của khách hàng vào header Authorization.
 */

// Cấu hình axios cho web bán hàng
// Import thư viện axios để thực hiện các yêu cầu HTTP tới backend
import axios from "axios";

// Tạo một thực thể axios với baseURL = "/api" => mọi request sẽ tự thêm tiền tố "/api"
// (ví dụ gọi "/san-pham" sẽ thành "/api/san-pham"); nhờ vậy code gọi API gọn hơn
const ketNoiApi = axios.create({ baseURL: "/api" });

// Gắn token khách hàng (nếu đã đăng nhập) vào request
// Interceptor (bộ chặn) chạy trước MỖI request để chèn token xác thực một cách tự động
ketNoiApi.interceptors.request.use((config) => {
  // Lấy token của khách hàng đã lưu trong localStorage sau khi đăng nhập
  const token = localStorage.getItem("khach_token");
  // Nếu có token thì gắn vào header Authorization theo chuẩn "Bearer <token>" để backend xác thực
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Trả lại cấu hình request (bắt buộc) để axios tiếp tục gửi đi
  return config;
});

// Xuất đối tượng axios đã cấu hình để các phần khác trong ứng dụng import và dùng chung
export default ketNoiApi;
