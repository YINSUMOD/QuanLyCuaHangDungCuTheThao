// =============================================================
// File: o-mat-khau.jsx
// Vai trò: Component ô nhập mật khẩu dùng chung cho toàn hệ thống
//          (đăng nhập, đăng ký, đổi mật khẩu...).
//          Cho phép người dùng bấm nút con mắt để ẩn/hiện nội dung
//          mật khẩu đang gõ, giúp kiểm tra ký tự đã nhập đúng chưa.
// =============================================================

// Ô nhập mật khẩu có nút ẩn/hiện bằng icon con mắt (SVG)
// Mắt MỞ = đang HIỆN mật khẩu | Mắt gạch chéo = đang ẨN mật khẩu
// useState: hook quản lý trạng thái ẩn/hiện mật khẩu trong component
import { useState } from "react";

// Icon mắt mở (đang hiện mật khẩu)
// Là hằng JSX dùng lại nhiều lần; stroke="currentColor" để màu icon
// tự theo màu chữ (color) của nút bao ngoài
const MatMo = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* path: viền ngoài hình con mắt (đường cong trên + dưới) */}
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    {/* circle: con ngươi ở giữa mắt */}
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// Icon mắt gạch chéo (đang ẩn mật khẩu)
const MatDong = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* path: hình con mắt bị che một phần (kiểu mắt nhắm/ẩn) */}
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    {/* line: đường gạch chéo từ góc trên-trái xuống góc dưới-phải */}
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// Component OMatKhau: ô nhập mật khẩu kèm nút bật/tắt hiển thị
// Props (nhận từ component cha):
//   - value: giá trị mật khẩu hiện tại (controlled input)
//   - onChange: hàm xử lý khi người dùng gõ thay đổi nội dung
//   - placeholder: chữ gợi ý mờ trong ô khi chưa nhập
//   - required: bắt buộc nhập (dùng cho validate của form)
export default function OMatKhau({ value, onChange, placeholder, required }) {
  // hien = true: hiển thị mật khẩu dạng chữ thường; false: che bằng dấu chấm
  const [hien, setHien] = useState(false);
  return (
    <div className="o-mk">
      <input
        // Đổi type theo trạng thái: "text" để xem được, "password" để ẩn
        type={hien ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
      <button
        // type="button" để KHÔNG submit form khi bấm nút con mắt
        type="button"
        className="nut-con-mat"
        // Bấm nút: đảo trạng thái ẩn/hiện mật khẩu
        onClick={() => setHien(!hien)}
        // Tooltip mô tả hành động sẽ xảy ra khi bấm (ngược với trạng thái hiện tại)
        title={hien ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {/* Đang hiện -> vẽ mắt mở; đang ẩn -> vẽ mắt gạch chéo */}
        {hien ? MatMo : MatDong}
      </button>
    </div>
  );
}
