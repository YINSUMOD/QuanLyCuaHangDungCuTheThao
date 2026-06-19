// =============================================================================
// File: the-san-pham.jsx
// Vai trò: Component "Thẻ sản phẩm" (product card) dùng để hiển thị 1 sản phẩm
//          trong danh sách/lưới: ảnh, nhãn giảm giá, đánh giá sao, giá bán +
//          giá gốc gạch ngang, và nút thêm vào giỏ hàng.
// =============================================================================
// Thẻ sản phẩm: ảnh, nhãn giảm giá, đánh giá sao, giá bán + giá gốc, nút thêm giỏ
import { Link } from "react-router-dom"; // Link điều hướng SPA sang trang chi tiết sản phẩm
import { dungGioHang } from "../ngu-canh/gio-hang"; // Hook truy cập ngữ cảnh (context) giỏ hàng
import { dinhDangTien, anhDuPhong } from "../tien-ich/dinh-dang"; // Hàm định dạng tiền VND & ảnh dự phòng khi lỗi

// Component nhận prop "sp" (đối tượng sản phẩm) và render ra một thẻ sản phẩm
export default function TheSanPham({ sp }) {
  const { them } = dungGioHang(); // Lấy hàm "them" (thêm sản phẩm vào giỏ) từ context giỏ hàng
  const hetHang = sp.so_luong_ton <= 0; // Cờ kiểm tra hết hàng: số lượng tồn <= 0

  // Giá gốc & % giảm (minh họa kiểu trang TMĐT) + đánh giá (ổn định theo id)
  // Phòng trường hợp giá = 0/null để không hiển thị "-NaN%" (chia cho 0)
  const gia = Number(sp.gia_ban) || 0; // Ép giá bán về số; nếu lỗi/null thì mặc định 0
  const giaGoc = Math.round((gia * 1.18) / 1000) * 1000; // Giá gốc giả lập: tăng 18% rồi làm tròn tới hàng nghìn
  // % giảm = 1 - (giá / giá gốc); chỉ tính khi giá > 0 và giá gốc > giá, tối thiểu 5%, làm tròn
  const giamPct = gia > 0 && giaGoc > gia ? Math.max(5, Math.round((1 - gia / giaGoc) * 100)) : 0;
  const sao = (4.6 + ((sp.id % 5) / 10)).toFixed(1); // Điểm sao giả lập 4.6-5.0, ổn định theo id (id % 5)
  const daBan = ((sp.id * 13) % 240) + 18; // Số "đã bán" giả lập 18-257, ổn định theo id

  return (
    // Khung thẻ sản phẩm tổng
    <div className="the-sp">
      {/* Khu vực ảnh: bấm vào ảnh sẽ điều hướng tới trang chi tiết /san-pham/:id */}
      <Link to={`/san-pham/${sp.id}`} className="the-sp-anh">
        {/* Ảnh sản phẩm; nếu không có hình_anh hoặc tải lỗi (onError) thì thay bằng ảnh dự phòng */}
        <img src={sp.hinh_anh || anhDuPhong} alt={sp.ten_san_pham} onError={(e) => (e.target.src = anhDuPhong)} />
        {/* Nhãn góc ảnh: ưu tiên "Hết hàng"; nếu còn hàng và có giảm giá thì hiện nhãn -giảm% */}
        {hetHang ? <span className="nhan-het">Hết hàng</span> : giamPct > 0 ? <span className="the-sp-sale">-{giamPct}%</span> : null}
      </Link>
      {/* Phần thân thẻ: thương hiệu, tên, đánh giá, giá, nút thêm giỏ */}
      <div className="the-sp-than">
        {/* Chỉ hiển thị dòng thương hiệu nếu sản phẩm có trường thuong_hieu */}
        {sp.thuong_hieu && <div className="the-sp-hieu">{sp.thuong_hieu}</div>}
        {/* Tên sản phẩm cũng là link tới trang chi tiết */}
        <Link to={`/san-pham/${sp.id}`} className="the-sp-ten">{sp.ten_san_pham}</Link>
        {/* Dòng đánh giá: sao + điểm số + số lượng đã bán (đều là số liệu giả lập) */}
        <div className="the-sp-rating">
          <span className="sao">★★★★★</span> {sao} · Đã bán {daBan}
        </div>
        {/* Dòng giá: giá bán hiện tại, kèm giá gốc gạch ngang khi có giảm giá */}
        <div className="the-sp-gia-row">
          <span className="the-sp-gia">{dinhDangTien(sp.gia_ban)}</span>
          {/* Chỉ hiện giá gốc (đã định dạng VND) khi có % giảm */}
          {giamPct > 0 && <span className="the-sp-gia-goc">{dinhDangTien(giaGoc)}</span>}
        </div>
        {/* Nút thêm vào giỏ: bị vô hiệu (disabled) khi hết hàng; bấm gọi them(sp, 1) thêm 1 sản phẩm */}
        <button className="nut-them-gio" disabled={hetHang} onClick={() => them(sp, 1)}>
          {hetHang ? "Hết hàng" : "Thêm vào giỏ"}
        </button>
      </div>
    </div>
  );
}
