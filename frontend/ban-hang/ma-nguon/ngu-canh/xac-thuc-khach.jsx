// =============================================================================
// Ngữ cảnh XÁC THỰC KHÁCH HÀNG (đăng nhập / đăng ký để đặt hàng)
// -----------------------------------------------------------------------------
// File này tạo React Context dùng chung cho phía cửa hàng (khách mua hàng):
// lưu thông tin khách đang đăng nhập, token phiên và các hàm đăng nhập/đăng ký/
// đăng xuất/cập nhật hồ sơ. Mọi component con bọc trong Provider đều có thể
// truy cập trạng thái xác thực thông qua hook dungXacThucKhach().
// =============================================================================
import { createContext, useContext, useState, useEffect } from "react";
// ketNoiApi: instance axios đã cấu hình sẵn baseURL và gắn token vào header
import ketNoiApi from "../goi-api/ket-noi-api";

// Tạo Context chứa trạng thái xác thực khách (giá trị mặc định null)
const NguCanhKhach = createContext(null);

// Component Provider: bọc cây component và cung cấp dữ liệu/hàm xác thực xuống dưới
export function CungCapXacThucKhach({ children }) {
  // khach: thông tin khách hàng đang đăng nhập (null nếu chưa đăng nhập)
  const [khach, setKhach] = useState(null);
  // dangTai: cờ báo đang kiểm tra phiên đăng nhập lúc tải trang (tránh nháy giao diện)
  const [dangTai, setDangTai] = useState(true);

  // Nếu đã có token -> lấy lại thông tin khách
  // Chạy 1 lần khi component mount để khôi phục phiên đăng nhập sau khi tải lại trang
  useEffect(() => {
    // Đọc token đã lưu ở lần đăng nhập trước
    const token = localStorage.getItem("khach_token");
    // Chưa có token: coi như chưa đăng nhập, kết thúc trạng thái đang tải
    if (!token) {
      setDangTai(false);
      return;
    }
    // Có token: gọi API lấy hồ sơ khách hiện tại (token tự gắn vào header bởi ketNoiApi)
    ketNoiApi
      .get("/cua-hang/toi")
      // Thành công: lưu thông tin khách vào state
      .then((res) => setKhach(res.data.du_lieu))
      // Thất bại (token hết hạn/không hợp lệ): xóa token hỏng khỏi localStorage
      .catch(() => localStorage.removeItem("khach_token"))
      // Dù thành công hay lỗi: luôn tắt cờ đang tải
      .finally(() => setDangTai(false));
  }, []);

  // Lưu phiên đăng nhập: ghi token xuống localStorage và cập nhật thông tin khách vào state
  // Dùng chung cho cả đăng nhập lẫn đăng ký (vì cả hai đều trả về token + khach)
  const luuPhien = (data) => {
    localStorage.setItem("khach_token", data.token);
    setKhach(data.khach);
  };

  // Đăng nhập: gửi tài khoản + mật khẩu lên API, nếu thành công thì lưu phiên
  const dangNhap = async (tai_khoan, mat_khau) => {
    const res = await ketNoiApi.post("/cua-hang/dang-nhap", { tai_khoan, mat_khau });
    luuPhien(res.data.du_lieu);
  };

  // Đăng ký tài khoản khách mới: gửi thông tin đăng ký, đăng nhập luôn nếu thành công
  const dangKy = async (thongTin) => {
    const res = await ketNoiApi.post("/cua-hang/dang-ky", thongTin);
    luuPhien(res.data.du_lieu);
  };

  // Đăng xuất: xóa token khỏi localStorage và đặt lại trạng thái về chưa đăng nhập
  const dangXuat = () => {
    localStorage.removeItem("khach_token");
    setKhach(null);
  };

  // Cập nhật thông tin cá nhân
  // Gửi thông tin mới lên API, đồng bộ lại state khach và trả về phản hồi cho nơi gọi
  const capNhat = async (thongTin) => {
    const res = await ketNoiApi.put("/cua-hang/toi", thongTin);
    setKhach(res.data.du_lieu);
    return res.data;
  };

  // Cung cấp state và các hàm xác thực xuống toàn bộ component con qua Provider
  return (
    <NguCanhKhach.Provider value={{ khach, dangTai, dangNhap, dangKy, dangXuat, capNhat }}>
      {children}
    </NguCanhKhach.Provider>
  );
}

// Hook tiện ích: gọi useContext để lấy nhanh ngữ cảnh xác thực khách trong component
export const dungXacThucKhach = () => useContext(NguCanhKhach);
