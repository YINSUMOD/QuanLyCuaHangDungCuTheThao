// =====================================================================
// Trang ĐẶT HÀNG THÀNH CÔNG
// Vai trò: Hiển thị màn hình xác nhận sau khi khách đặt hàng thành công.
//          Cho biết mã đơn, tổng tiền và cung cấp các nút điều hướng tiếp theo.
// Dữ liệu mã đơn / tổng tiền được truyền qua "state" của react-router
// (từ trang thanh toán chuyển sang bằng navigate("/...", { state })).
// =====================================================================
// Link: tạo liên kết điều hướng nội bộ; useLocation: lấy state điều hướng
import { Link, useLocation } from "react-router-dom";
// Hàm tiện ích định dạng số tiền theo định dạng tiền tệ Việt Nam
import { dinhDangTien } from "../tien-ich/dinh-dang";

// Component trang xác nhận đặt hàng thành công
export default function DatHangThanhCong() {
  // Lấy state điều hướng (chứa ma_don, thanh_tien) do trang trước truyền sang
  const { state } = useLocation();

  return (
    <div className="trang">
      {/* Khối nội dung thông báo đặt hàng thành công */}
      <div className="thanh-cong">
        {/* Biểu tượng dấu tích báo thành công */}
        <div className="tc-icon">✅</div>
        <h1>Đặt hàng thành công!</h1>
        <p>Cảm ơn bạn đã mua sắm tại TVU Store. Cửa hàng sẽ liên hệ xác nhận đơn sớm nhất.</p>
        {/* Chỉ hiển thị thông tin đơn khi có mã đơn được truyền sang (?. tránh lỗi khi state null) */}
        {state?.ma_don && (
          <div className="tc-thongtin">
            {/* Mã đơn hàng vừa tạo */}
            <div>Mã đơn hàng: <b>{state.ma_don}</b></div>
            {/* Chỉ hiện tổng tiền khi có giá trị (!= null lọc cả null và undefined), định dạng theo tiền VND */}
            {state.thanh_tien != null && <div>Tổng tiền: <b>{dinhDangTien(state.thanh_tien)}</b></div>}
          </div>
        )}
        {/* Nhóm nút điều hướng sau khi đặt hàng */}
        <div className="tc-nut">
          {/* Quay lại trang cửa hàng để mua tiếp */}
          <Link to="/cua-hang" className="nut-banner">Tiếp tục mua sắm</Link>
          {/* Chuyển tới trang xem danh sách đơn hàng của người dùng */}
          <Link to="/don-hang-cua-toi" className="nut-vien">Xem đơn hàng của tôi</Link>
        </div>
      </div>
    </div>
  );
}
