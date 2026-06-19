// =============================================================================
// Ngữ cảnh GIỎ HÀNG - lưu trong localStorage để không mất khi tải lại trang
// =============================================================================
import { createContext, useContext, useState, useEffect } from "react";

// Tạo Context dùng chung cho toàn ứng dụng để chia sẻ trạng thái giỏ hàng
const NguCanhGio = createContext(null);
const KHOA = "gio_hang"; // khóa lưu localStorage

// Component bọc (Provider) cung cấp dữ liệu giỏ hàng cho các component con
export function CungCapGioHang({ children }) {
  // Khởi tạo state giỏ hàng: đọc dữ liệu đã lưu từ localStorage (lazy init)
  const [gio, setGio] = useState(() => {
    try {
      // Lấy JSON đã lưu và parse; nếu chưa có thì trả về mảng rỗng
      return JSON.parse(localStorage.getItem(KHOA)) || [];
    } catch {
      // Nếu dữ liệu lỗi/không parse được thì coi như giỏ trống
      return [];
    }
  });

  // Mỗi khi giỏ thay đổi -> lưu lại
  useEffect(() => {
    localStorage.setItem(KHOA, JSON.stringify(gio));
  }, [gio]);

  // Thêm sản phẩm (không vượt quá tồn kho)
  const them = (sp, soLuong = 1) => {
    setGio((cu) => {
      // Kiểm tra sản phẩm đã có trong giỏ hay chưa (dựa theo id)
      const daCo = cu.find((x) => x.id === sp.id);
      if (daCo) {
        // Nếu đã có: cộng dồn số lượng nhưng chặn không cho vượt tồn kho (Math.min)
        return cu.map((x) =>
          x.id === sp.id
            ? { ...x, so_luong: Math.min(x.so_luong + soLuong, sp.so_luong_ton) }
            : x
        );
      }
      // Nếu chưa có: thêm 1 dòng mới vào cuối giỏ với thông tin sản phẩm
      return [
        ...cu,
        {
          id: sp.id,
          ten_san_pham: sp.ten_san_pham,
          gia_ban: Number(sp.gia_ban),
          hinh_anh: sp.hinh_anh,
          so_luong: Math.min(soLuong, sp.so_luong_ton),
          so_luong_ton: sp.so_luong_ton,
        },
      ];
    });
  };

  // Đổi số lượng của 1 sản phẩm; kẹp giá trị trong khoảng [1, tồn kho]
  // Math.min: không vượt tồn kho; Math.max(1,...): tối thiểu là 1 (tránh 0/âm)
  const doiSoLuong = (id, sl) =>
    setGio((cu) =>
      cu.map((x) => (x.id === id ? { ...x, so_luong: Math.max(1, Math.min(Number(sl) || 1, x.so_luong_ton)) } : x))
    );
  // Xóa 1 sản phẩm khỏi giỏ theo id
  const xoa = (id) => setGio((cu) => cu.filter((x) => x.id !== id));
  // Xóa toàn bộ giỏ hàng (đặt giỏ về rỗng)
  const xoaTatCa = () => setGio([]);

  // Tính tổng tiền của giỏ = tổng (giá bán * số lượng) các dòng
  const tongTien = gio.reduce((s, x) => s + x.gia_ban * x.so_luong, 0);
  // Tính tổng số lượng sản phẩm trong giỏ (dùng cho badge số lượng)
  const soLuong = gio.reduce((s, x) => s + x.so_luong, 0);

  // Cung cấp dữ liệu và các hàm thao tác giỏ hàng xuống cây component con
  return (
    <NguCanhGio.Provider value={{ gio, them, doiSoLuong, xoa, xoaTatCa, tongTien, soLuong }}>
      {children}
    </NguCanhGio.Provider>
  );
}

// Hook tiện ích: cho component bất kỳ lấy nhanh dữ liệu/hàm của giỏ hàng
export const dungGioHang = () => useContext(NguCanhGio);
