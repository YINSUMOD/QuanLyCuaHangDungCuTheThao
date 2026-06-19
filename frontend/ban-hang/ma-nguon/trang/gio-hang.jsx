// =============================================================================
// TRANG GIỎ HÀNG
// -----------------------------------------------------------------------------
// Vai trò: hiển thị danh sách sản phẩm khách đã thêm vào giỏ, cho phép thay đổi
// số lượng / xóa sản phẩm, tính tổng tiền và điều hướng tới bước thanh toán.
// =============================================================================
// React hooks: useState quản lý trạng thái cục bộ, useEffect đồng bộ side-effect
import { useState, useEffect } from "react";
// Link để điều hướng dạng thẻ <a>, useNavigate để điều hướng bằng code
import { Link, useNavigate } from "react-router-dom";
// Hook truy cập ngữ cảnh (context) giỏ hàng: dữ liệu giỏ + các hàm thao tác
import { dungGioHang } from "../ngu-canh/gio-hang";
// Hook truy cập ngữ cảnh xác thực khách hàng để biết khách đã đăng nhập chưa
import { dungXacThucKhach } from "../ngu-canh/xac-thuc-khach";
// Tiện ích: dinhDangTien -> định dạng tiền VND; anhDuPhong -> ảnh mặc định khi lỗi
import { dinhDangTien, anhDuPhong } from "../tien-ich/dinh-dang";

// Ô nhập số lượng: cho phép gõ tự do (kể cả xóa trắng), chỉ chuẩn hóa về [1..tồn kho]
// khi rời ô hoặc nhấn Enter -> tránh việc đang gõ số nhiều chữ số lại bị nhảy về 1.
// Component con: ô nhập số lượng cho 1 dòng sản phẩm trong giỏ
// props: giaTri (số lượng hiện tại), toiDa (tồn kho), onDoi (callback khi đổi)
function ONhapSoLuong({ giaTri, toiDa, onDoi }) {
  // raw: giữ chuỗi người dùng đang gõ (cho phép rỗng, gõ dở) tách khỏi giá trị thật
  const [raw, setRaw] = useState(String(giaTri));
  useEffect(() => { setRaw(String(giaTri)); }, [giaTri]); // đồng bộ khi bấm nút +/−

  // Chuẩn hóa giá trị nhập về khoảng hợp lệ [1..toiDa] và báo ngược ra ngoài nếu thay đổi
  const chuanHoa = () => {
    // Kẹp số nhập trong [1, toiDa]; nếu nhập không phải số (NaN) thì mặc định 1
    const n = Math.max(1, Math.min(Number(raw) || 1, toiDa));
    setRaw(String(n)); // hiển thị lại giá trị đã chuẩn hóa trong ô input
    if (n !== giaTri) onDoi(n); // chỉ gọi cập nhật khi số lượng thực sự thay đổi
  };

  return (
    // Ô input số: onChange cho gõ tự do; onBlur chuẩn hóa; Enter -> blur để chuẩn hóa
    <input
      type="number"
      min="1"
      max={toiDa}
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={chuanHoa}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
    />
  );
}

// Component trang chính: Giỏ hàng
export default function GioHang() {
  // Lấy dữ liệu giỏ và các hàm thao tác từ context: danh sách, đổi SL, xóa, tổng tiền
  const { gio, doiSoLuong, xoa, tongTien } = dungGioHang();
  // Thông tin khách đang đăng nhập (null nếu chưa đăng nhập)
  const { khach } = dungXacThucKhach();
  // Hàm điều hướng bằng code giữa các trang
  const navigate = useNavigate();

  // Bấm thanh toán: chưa đăng nhập -> tới trang đăng nhập; rồi mới qua thanh toán
  const datHang = () => {
    // Chưa đăng nhập: chuyển sang đăng nhập kèm tham số next để quay lại thanh toán sau khi đăng nhập
    if (!khach) navigate("/dang-nhap?next=/thanh-toan");
    else navigate("/thanh-toan"); // đã đăng nhập: đi thẳng tới trang thanh toán
  };

  // Trường hợp giỏ rỗng: hiển thị thông báo và nút quay lại cửa hàng
  if (gio.length === 0) {
    return (
      <div className="trang">
        <div className="gio-trong">
          <div style={{ fontSize: 48 }}>🛒</div>
          <h2>Giỏ hàng đang trống</h2>
          <Link to="/cua-hang" className="nut-banner">Tiếp tục mua sắm</Link>
        </div>
      </div>
    );
  }

  // Trường hợp giỏ có hàng: hiển thị lưới gồm danh sách sản phẩm và bảng tóm tắt
  return (
    <div className="trang">
      <h1 className="tieu-de">Giỏ hàng của bạn</h1>
      <div className="gio-luoi">
        {/* Cột trái: danh sách các dòng sản phẩm trong giỏ */}
        <div className="gio-ds">
          {/* Lặp qua từng sản phẩm trong giỏ để render một dòng (key=id sản phẩm) */}
          {gio.map((x) => (
            <div className="gio-dong" key={x.id}>
              {/* Ảnh sản phẩm; nếu lỗi tải ảnh thì thay bằng ảnh dự phòng */}
              <img src={x.hinh_anh || anhDuPhong} alt={x.ten_san_pham} onError={(e) => (e.target.src = anhDuPhong)} />
              <div className="gio-ten">
                {/* Tên sản phẩm có liên kết tới trang chi tiết */}
                <Link to={`/san-pham/${x.id}`}>{x.ten_san_pham}</Link>
                {/* Đơn giá một sản phẩm */}
                <div className="gio-gia-don">{dinhDangTien(x.gia_ban)}</div>
              </div>
              {/* Khu vực điều chỉnh số lượng: nút trừ, ô nhập, nút cộng */}
              <div className="gio-sl">
                {/* Nút giảm: vô hiệu khi số lượng đã là 1 (không cho xuống dưới 1) */}
                <button disabled={x.so_luong <= 1} onClick={() => doiSoLuong(x.id, x.so_luong - 1)}>−</button>
                {/* Ô nhập số lượng trực tiếp, giới hạn theo tồn kho (so_luong_ton) */}
                <ONhapSoLuong giaTri={x.so_luong} toiDa={x.so_luong_ton} onDoi={(n) => doiSoLuong(x.id, n)} />
                {/* Nút tăng: vô hiệu khi đã đạt số lượng tồn kho tối đa */}
                <button disabled={x.so_luong >= x.so_luong_ton} onClick={() => doiSoLuong(x.id, x.so_luong + 1)}>+</button>
              </div>
              {/* Thành tiền của dòng = đơn giá * số lượng */}
              <div className="gio-thanh-tien">{dinhDangTien(x.gia_ban * x.so_luong)}</div>
              {/* Nút xóa sản phẩm khỏi giỏ */}
              <button className="gio-xoa" onClick={() => xoa(x.id)}>✕</button>
            </div>
          ))}
        </div>

        {/* Cột phải: bảng tóm tắt đơn hàng và nút đặt hàng */}
        <div className="gio-tom-tat">
          <h3>Tóm tắt đơn hàng</h3>
          {/* Tạm tính = tổng tiền các sản phẩm */}
          <div className="tt-dong"><span>Tạm tính</span><b>{dinhDangTien(tongTien)}</b></div>
          {/* Phí vận chuyển hiện đang miễn phí */}
          <div className="tt-dong"><span>Phí vận chuyển</span><span>Miễn phí</span></div>
          {/* Tổng cộng (do miễn phí ship nên bằng tạm tính) */}
          <div className="tt-tong"><span>Tổng cộng</span><b>{dinhDangTien(tongTien)}</b></div>
          {/* Nút đặt hàng: gọi datHang để kiểm tra đăng nhập rồi điều hướng */}
          <button className="nut-dat-hang" onClick={datHang}>Tiến hành đặt hàng</button>
          {/* Liên kết quay lại trang cửa hàng */}
          <Link to="/cua-hang" className="lk-tiep">← Tiếp tục mua sắm</Link>
        </div>
      </div>
    </div>
  );
}
