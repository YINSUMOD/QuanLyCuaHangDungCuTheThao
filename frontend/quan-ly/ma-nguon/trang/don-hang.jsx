// =============================================================================
// Trang ĐƠN HÀNG (quản trị): xem danh sách, chi tiết, và DUYỆT trạng thái đơn
// Luồng: Chờ xử lý -> Đã xác nhận -> Đang giao -> Hoàn thành (hoặc Hủy / Duyệt hủy)
// =============================================================================
// Các hook React cần dùng: useEffect (chạy hiệu ứng phụ), useState (quản lý state)
import { useEffect, useState } from "react";
// Đối tượng axios đã cấu hình sẵn để gọi API backend
import ketNoiApi from "../goi-api/ket-noi-api";
// Thành phần hộp thoại (modal) dùng để hiển thị chi tiết đơn hàng
import HopThoai from "../thanh-phan/hop-thoai";
// Hàm tiện ích: định dạng số tiền VND và định dạng ngày tháng
import { dinhDangTien, dinhDangNgay } from "../tien-ich/dinh-dang";

// Nhãn + màu cho từng trạng thái
// Mỗi khóa là mã trạng thái lưu ở DB; giá trị là cặp [nhãn hiển thị, lớp CSS chip màu]
const TRANG_THAI = {
  cho_xu_ly: ["Chờ xử lý", "chip-vang"],
  da_xac_nhan: ["Đã xác nhận", "chip-xanh-duong"],
  dang_giao: ["Đang giao", "chip-cam"],
  hoan_thanh: ["Hoàn thành", "chip-xanh"],
  yeu_cau_huy: ["Yêu cầu hủy", "chip-do"],
  da_huy: ["Đã hủy", "chip-xam"],
};
// Component nhỏ hiển thị 1 "chip" trạng thái có màu theo prop tt (mã trạng thái)
function ChipTrangThai({ tt }) {
  // Tra cứu nhãn và lớp màu; nếu mã lạ không có trong bảng thì dùng nhãn thô + màu xám
  const [nhan, lop] = TRANG_THAI[tt] || [tt, "chip-xam"];
  return <span className={`chip ${lop}`}>{nhan}</span>;
}

// Component trang chính: quản trị danh sách đơn hàng và duyệt trạng thái
export default function DonHang() {
  // danhSach: mảng tất cả đơn hàng hiển thị trên bảng
  const [danhSach, setDanhSach] = useState([]);
  // chiTiet: đơn hàng đang được xem chi tiết trong hộp thoại (null = không mở)
  const [chiTiet, setChiTiet] = useState(null);

  // Gọi API lấy toàn bộ danh sách đơn hàng và lưu vào state
  const taiDanhSach = async () => {
    const res = await ketNoiApi.get("/don-hang");
    setDanhSach(res.data.du_lieu);
  };
  // Tải danh sách 1 lần khi component được mount lần đầu
  useEffect(() => {
    taiDanhSach();
  }, []);

  // Gọi API lấy chi tiết 1 đơn theo id rồi mở hộp thoại chi tiết
  const xemChiTiet = async (id) => {
    const res = await ketNoiApi.get(`/don-hang/${id}`);
    setChiTiet(res.data.du_lieu);
  };

  // Cập nhật trạng thái đơn
  // id: mã đơn; tt: trạng thái mới muốn chuyển sang; hoiText: câu xác nhận hiển thị
  const capNhat = async (id, tt, hoiText) => {
    // Hỏi xác nhận người dùng trước khi đổi trạng thái; bấm Hủy thì dừng lại
    if (!window.confirm(hoiText || "Cập nhật trạng thái đơn hàng này?")) return;
    try {
      // Gọi API PUT cập nhật trạng thái, sau đó tải lại danh sách để đồng bộ giao diện
      await ketNoiApi.put(`/don-hang/${id}/trang-thai`, { trang_thai: tt });
      taiDanhSach();
    } catch (err) {
      // Hiển thị thông báo lỗi từ backend (nếu có), ngược lại dùng câu mặc định
      alert(err.response?.data?.thong_bao || "Không thể cập nhật");
    }
  };

  // Các nút thao tác theo trạng thái hiện tại
  // Hiển thị tập nút khác nhau tùy trạng thái của đơn (máy trạng thái duyệt đơn)
  const NutThaoTac = ({ dh }) => {
    const tt = dh.trang_thai;
    return (
      <div className="nut-don">
        {/* Nút Xem luôn hiển thị ở mọi trạng thái để mở chi tiết đơn */}
        <button className="nut nut-nho" onClick={() => xemChiTiet(dh.id)}>Xem</button>
        {/* Đơn Chờ xử lý: được phép Xác nhận hoặc Hủy */}
        {tt === "cho_xu_ly" && (
          <>
            <button className="nut nut-nho nut-xn" onClick={() => capNhat(dh.id, "da_xac_nhan", "Xác nhận đơn hàng này?")}>Xác nhận</button>
            <button className="nut nut-nho nut-xoa" onClick={() => capNhat(dh.id, "da_huy", "Hủy đơn hàng này? (tồn kho sẽ được hoàn lại)")}>Hủy</button>
          </>
        )}
        {/* Đơn Đã xác nhận: chuyển sang Đang giao hoặc Hủy */}
        {tt === "da_xac_nhan" && (
          <>
            <button className="nut nut-nho nut-xn" onClick={() => capNhat(dh.id, "dang_giao", "Chuyển sang Đang giao?")}>Giao hàng</button>
            <button className="nut nut-nho nut-xoa" onClick={() => capNhat(dh.id, "da_huy", "Hủy đơn hàng này? (tồn kho sẽ được hoàn lại)")}>Hủy</button>
          </>
        )}
        {/* Đơn Đang giao: chỉ còn bước đánh dấu Hoàn thành */}
        {tt === "dang_giao" && (
          <button className="nut nut-nho nut-xn" onClick={() => capNhat(dh.id, "hoan_thanh", "Đánh dấu Hoàn thành?")}>Hoàn thành</button>
        )}
        {/* Đơn Yêu cầu hủy (khách gửi): quản trị Duyệt hủy hoặc Từ chối (trả về Chờ xử lý) */}
        {tt === "yeu_cau_huy" && (
          <>
            <button className="nut nut-nho nut-xoa" onClick={() => capNhat(dh.id, "da_huy", "Duyệt yêu cầu hủy? (tồn kho sẽ được hoàn lại)")}>Duyệt hủy</button>
            <button className="nut nut-nho" onClick={() => capNhat(dh.id, "cho_xu_ly", "Từ chối hủy, đưa đơn về Chờ xử lý?")}>Từ chối</button>
          </>
        )}
      </div>
    );
  };

  // Giao diện trang: tiêu đề + bảng danh sách đơn + hộp thoại chi tiết (khi mở)
  return (
    <div>
      <h2 className="tieu-de-trang">Danh sách đơn hàng</h2>

      {/* Bảng liệt kê tất cả đơn hàng */}
      <div className="the-bang">
        <table className="bang">
          {/* Hàng tiêu đề các cột của bảng */}
          <thead>
            <tr>
              <th>Mã đơn</th><th>Khách hàng</th><th>Nhân viên</th><th>Thành tiền</th>
              <th>Thanh toán</th><th>Trạng thái</th><th>Ngày tạo</th><th style={{ width: 230 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {/* Nếu chưa có đơn nào thì hiển thị 1 dòng thông báo trống, ngược lại render từng đơn */}
            {danhSach.length === 0 ? (
              <tr><td colSpan={8} className="trong">Chưa có đơn hàng nào</td></tr>
            ) : (
              danhSach.map((dh) => (
                <tr key={dh.id}>
                  <td><b>{dh.ma_don}</b></td>
                  {/* Không có khách hàng -> đơn mua tại quầy của "Khách lẻ" */}
                  <td>{dh.ten_khach_hang || "Khách lẻ"}</td>
                  {/* Không có nhân viên -> đơn đặt online */}
                  <td>{dh.ten_nhan_vien || "— (online)"}</td>
                  {/* Tổng thành tiền của đơn, định dạng theo tiền tệ VND */}
                  <td>{dinhDangTien(dh.thanh_tien)}</td>
                  <td>{dh.phuong_thuc_thanh_toan}</td>
                  {/* Chip màu thể hiện trạng thái đơn */}
                  <td><ChipTrangThai tt={dh.trang_thai} /></td>
                  <td>{dinhDangNgay(dh.ngay_tao)}</td>
                  {/* Cụm nút thao tác tùy theo trạng thái đơn */}
                  <td><NutThaoTac dh={dh} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Hộp thoại chi tiết: chỉ hiển thị khi state chiTiet khác null. Đóng -> đặt lại null */}
      {chiTiet && (
        <HopThoai tieuDe={`Chi tiết đơn hàng ${chiTiet.ma_don}`} dong={() => setChiTiet(null)}>
          <p><b>Khách hàng:</b> {chiTiet.ten_khach_hang || "Khách lẻ"}</p>
          <p><b>Nhân viên:</b> {chiTiet.ten_nhan_vien || "— (đơn online)"}</p>
          <p><b>Trạng thái:</b> <ChipTrangThai tt={chiTiet.trang_thai} /></p>
          <p><b>Ngày tạo:</b> {dinhDangNgay(chiTiet.ngay_tao)}</p>
          {/* Chỉ hiển thị dòng Ghi chú khi đơn thực sự có ghi chú */}
          {chiTiet.ghi_chu && <p><b>Ghi chú:</b> {chiTiet.ghi_chu}</p>}
          {/* Bảng các dòng sản phẩm trong đơn */}
          <table className="bang" style={{ marginTop: 12 }}>
            <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
            <tbody>
              {/* Lặp qua từng dòng chi tiết (sản phẩm) của đơn hàng */}
              {chiTiet.chi_tiet.map((ct) => (
                <tr key={ct.id}>
                  {/* Sản phẩm đã bị xóa khỏi hệ thống thì hiển thị nhãn thay thế */}
                  <td>{ct.ten_san_pham || "(Sản phẩm đã xóa)"}</td>
                  <td>{ct.so_luong}</td>
                  <td>{dinhDangTien(ct.don_gia)}</td>
                  <td>{dinhDangTien(ct.thanh_tien)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Khối tổng kết tiền: tổng tiền hàng - giảm giá = thành tiền phải trả */}
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <p>Tổng tiền: {dinhDangTien(chiTiet.tong_tien)}</p>
            <p>Giảm giá: {dinhDangTien(chiTiet.giam_gia)}</p>
            <p className="tong-tien-gio">Thành tiền: {dinhDangTien(chiTiet.thanh_tien)}</p>
          </div>
        </HopThoai>
      )}
    </div>
  );
}
