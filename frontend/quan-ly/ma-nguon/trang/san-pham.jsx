// =============================================================
// File: san-pham.jsx
// Vai trò: Trang QUẢN LÝ SẢN PHẨM (dụng cụ thể thao).
//   - Tái sử dụng component dùng chung <TrangQuanLy> để hiển thị bảng
//     danh sách, thêm/sửa/xóa sản phẩm thông qua endpoint "/san-pham".
//   - Khai báo cấu hình các CỘT của bảng (cot) và các TRƯỜNG của form
//     nhập liệu (truong) đặc thù cho sản phẩm.
//   - Có component phụ <AnhSanPham> để hiển thị ảnh thu nhỏ sản phẩm.
// =============================================================
// Hook quản lý state của React (dùng cho việc bắt lỗi tải ảnh)
import { useState } from "react";
// Component khung dùng chung cho mọi trang quản lý (bảng + form CRUD)
import TrangQuanLy from "../thanh-phan/trang-quan-ly";
// Hàm tiện ích định dạng số tiền sang chuỗi tiền tệ (VNĐ)
import { dinhDangTien } from "../tien-ich/dinh-dang";

// Danh sách thương hiệu thể thao nổi tiếng (gợi ý chọn nhanh, vẫn gõ tay được)
const THUONG_HIEU = [
  "Nike", "Adidas", "Puma", "Under Armour", "New Balance", "Asics", "Mizuno",
  "Yonex", "Victor", "Lining", "Wilson", "Babolat", "Head", "Prince",
  "Joola", "Franklin", "Sypik", "Stiga", "DHS", "Butterfly", "729",
  "Molten", "Mikasa", "Spalding", "PEAK", "Garmin", "Speedo", "Arena",
  "Kamito", "Zocker", "Mira", "Động Lực", "Thiên Trường Sport", "Decathlon",
  "LivePro", "LiveUp Sports", "GoodFit", "iFitness", "Xtep", "ICADO", "YaMe",
];

// Ảnh thu nhỏ của sản phẩm: dùng hình ảnh nếu có, nếu không thì hiển thị
// ô màu kèm chữ cái đầu (ảnh đại diện dự phòng) để giao diện luôn gọn gàng
function AnhSanPham({ row }) {
  // Cờ đánh dấu ảnh tải lỗi -> chuyển sang hiển thị ô màu dự phòng
  const [loi, setLoi] = useState(false);
  // Nếu có đường dẫn ảnh và chưa bị lỗi tải thì hiển thị ảnh thật.
  // onError: khi ảnh tải thất bại sẽ bật cờ loi để rơi xuống ô dự phòng.
  if (row.hinh_anh && !loi) {
    return <img className="anh-sp" src={row.hinh_anh} alt={row.ten_san_pham} onError={() => setLoi(true)} />;
  }
  // Ô dự phòng: lấy chữ cái đầu của tên sản phẩm (viết hoa); nếu trống dùng "?"
  const chu = (row.ten_san_pham || "?").trim().charAt(0).toUpperCase();
  return <div className="anh-sp-trong">{chu}</div>;
}

// Component trang chính: cấu hình và render khung quản lý sản phẩm
export default function SanPham() {
  return (
    <TrangQuanLy
      tieuDe="Quản lý sản phẩm"
      endpoint="/san-pham"
      // cot: khai báo các CỘT hiển thị trong bảng danh sách sản phẩm
      cot={[
        {
          key: "ten_san_pham",
          nhan: "Sản phẩm",
          // Ô gộp: ảnh + tên + thương hiệu (giống các phần mềm bán hàng thực tế)
          render: (r) => (
            <div className="o-sp">
              {/* Ảnh thu nhỏ (hoặc ô màu dự phòng nếu thiếu/lỗi ảnh) */}
              <AnhSanPham row={r} />
              <div>
                {/* Tên sản phẩm */}
                <div className="ten-sp">{r.ten_san_pham}</div>
                {/* Thương hiệu; nếu trống hiển thị dấu gạch "—" */}
                <div className="hieu-sp">{r.thuong_hieu || "—"}</div>
              </div>
            </div>
          ),
        },
        // Cột danh mục: hiển thị thẳng tên danh mục từ dữ liệu
        { key: "ten_danh_muc", nhan: "Danh mục" },
        // Cột giá bán: định dạng số sang chuỗi tiền tệ cho dễ đọc
        { key: "gia_ban", nhan: "Giá bán", render: (r) => dinhDangTien(r.gia_ban) },
        {
          key: "so_luong_ton",
          nhan: "Tồn kho",
          // Hiển thị tồn kho dạng "chip": tồn <= 5 -> chip đỏ (cảnh báo sắp hết),
          // ngược lại chip xám (bình thường). Kèm đơn vị tính phía sau số lượng.
          render: (r) => (
            <span className={"chip " + (r.so_luong_ton <= 5 ? "chip-do" : "chip-xam")}>
              {r.so_luong_ton} {r.don_vi}
            </span>
          ),
        },
      ]}
      // truong: khai báo các TRƯỜNG của form thêm/sửa sản phẩm
      truong={[
        // Tên sản phẩm: bắt buộc nhập (required)
        { name: "ten_san_pham", nhan: "Tên sản phẩm", loai: "text", required: true },
        // Thương hiệu: ô datalist - vừa chọn nhanh từ THUONG_HIEU vừa gõ tay được
        { name: "thuong_hieu", nhan: "Thương hiệu", loai: "datalist", options: THUONG_HIEU, goiY: "Chọn hoặc nhập: Nike, Yonex, Joola..." },
        {
          // Danh mục: ô select, dữ liệu tùy chọn lấy từ API "/danh-muc",
          // hiển thị nhãn theo trường ten_danh_muc của mỗi bản ghi
          name: "danh_muc_id",
          nhan: "Danh mục",
          loai: "select",
          optionsEndpoint: "/danh-muc",
          optionLabel: "ten_danh_muc",
        },
        {
          // Nhà cung cấp: ô select, dữ liệu tùy chọn lấy từ API "/nha-cung-cap",
          // hiển thị nhãn theo trường ten_ncc
          name: "nha_cung_cap_id",
          nhan: "Nhà cung cấp",
          loai: "select",
          optionsEndpoint: "/nha-cung-cap",
          optionLabel: "ten_ncc",
        },
        // Giá nhập: nhập số (đơn vị VNĐ)
        { name: "gia_nhap", nhan: "Giá nhập (₫)", loai: "number" },
        // Giá bán: nhập số, bắt buộc nhập (required)
        { name: "gia_ban", nhan: "Giá bán (₫)", loai: "number", required: true },
        // Số lượng tồn kho: nhập số
        { name: "so_luong_ton", nhan: "Số lượng tồn", loai: "number" },
        // Đơn vị tính: text tự do (ví dụ: Cái, Đôi, Quả...)
        { name: "don_vi", nhan: "Đơn vị tính", loai: "text", goiY: "Cái, Đôi, Quả..." },
        // Hình ảnh: loại trường "anh" (upload/nhập đường dẫn ảnh sản phẩm)
        { name: "hinh_anh", nhan: "Hình ảnh sản phẩm", loai: "anh" },
        // Mô tả: ô nhập nhiều dòng (textarea)
        { name: "mo_ta", nhan: "Mô tả", loai: "textarea" },
      ]}
    />
  );
}
