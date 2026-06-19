// =============================================================================
// TRANG THANH TOÁN (cần đăng nhập) - tạo đơn hàng online
// =============================================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ketNoiApi from "../goi-api/ket-noi-api";
import { dungGioHang } from "../ngu-canh/gio-hang";
import { dungXacThucKhach } from "../ngu-canh/xac-thuc-khach";
import { dinhDangTien } from "../tien-ich/dinh-dang";

// Component trang Thanh toán: hiển thị form giao hàng + tóm tắt giỏ hàng và gửi đơn lên server
export default function ThanhToan() {
  // Lấy danh sách giỏ hàng, tổng tiền và hàm xóa toàn bộ giỏ từ ngữ cảnh giỏ hàng
  const { gio, tongTien, xoaTatCa } = dungGioHang();
  // Lấy thông tin khách đang đăng nhập để điền sẵn vào form
  const { khach } = dungXacThucKhach();
  // Hook điều hướng để chuyển trang sau khi đặt hàng thành công
  const navigate = useNavigate();

  // State lưu dữ liệu form giao hàng, điền sẵn từ thông tin khách (nếu có)
  const [form, setForm] = useState({
    ho_ten: khach?.ho_ten || "",
    dien_thoai: khach?.dien_thoai || "",
    dia_chi_giao: khach?.dia_chi || "",
    phuong_thuc_thanh_toan: "tien_mat", // Mặc định thanh toán khi nhận hàng (COD)
    ghi_chu: "",
  });
  // State lưu thông báo lỗi khi đặt hàng thất bại
  const [loi, setLoi] = useState("");
  // State cờ báo đang gửi đơn để khóa nút tránh bấm nhiều lần
  const [dangGui, setDangGui] = useState(false);

  // Nếu giỏ hàng trống thì không cho thanh toán, hiển thị lời mời mua sắm
  if (gio.length === 0) {
    return <div className="trang"><p className="trong">Giỏ hàng trống. <a href="/cua-hang">Mua sắm ngay</a></p></div>;
  }

  // Hàm xử lý sự kiện submit form: gọi API tạo đơn hàng online
  const datHang = async (e) => {
    e.preventDefault(); // Chặn reload trang mặc định của form
    setLoi(""); // Xóa lỗi cũ trước khi gửi
    // Ràng buộc số điện thoại người nhận: chỉ gồm 9-11 chữ số
    if (!/^[0-9]{9,11}$/.test((form.dien_thoai || "").trim())) {
      setLoi("Số điện thoại không hợp lệ (chỉ gồm 9-11 chữ số).");
      return;
    }
    setDangGui(true); // Bật cờ đang gửi để khóa nút đặt hàng
    try {
      // Gửi đơn lên server: gồm danh sách sản phẩm, địa chỉ, ghi chú và phương thức thanh toán
      const res = await ketNoiApi.post("/cua-hang/dat-hang", {
        // Chuyển giỏ hàng thành mảng {san_pham_id, so_luong} theo định dạng API yêu cầu
        danh_sach_san_pham: gio.map((x) => ({ san_pham_id: x.id, so_luong: x.so_luong })),
        dia_chi_giao: form.dia_chi_giao,
        // Gộp tên + SĐT người nhận và ghi chú khách vào một chuỗi ghi chú đơn hàng
        ghi_chu: `Người nhận: ${form.ho_ten} - ${form.dien_thoai}. ${form.ghi_chu}`,
        phuong_thuc_thanh_toan: form.phuong_thuc_thanh_toan,
      });
      xoaTatCa(); // Đặt hàng thành công thì làm trống giỏ hàng
      // Điều hướng sang trang thành công, truyền kèm mã đơn và thành tiền qua state
      navigate("/dat-hang-thanh-cong", { state: { ma_don: res.data.du_lieu.ma_don, thanh_tien: res.data.du_lieu.thanh_tien } });
    } catch (err) {
      // Hiển thị thông báo lỗi từ server (nếu có) hoặc lỗi mặc định
      setLoi(err.response?.data?.thong_bao || "Đặt hàng thất bại");
    } finally {
      setDangGui(false); // Dù thành công hay lỗi đều tắt cờ đang gửi
    }
  };

  // Giao diện: form thông tin giao hàng bên trái, tóm tắt đơn hàng bên phải
  return (
    <div className="trang">
      <h1 className="tieu-de">Thanh toán</h1>
      {/* Form thanh toán, submit sẽ gọi hàm datHang */}
      <form className="tt-luoi" onSubmit={datHang}>
        {/* Thông tin giao hàng */}
        <div className="tt-form">
          <h3>Thông tin giao hàng</h3>
          <label>Họ tên người nhận *</label>
          <input value={form.ho_ten} onChange={(e) => setForm({ ...form, ho_ten: e.target.value })} required />
          <label>Số điện thoại *</label>
          <input value={form.dien_thoai} onChange={(e) => setForm({ ...form, dien_thoai: e.target.value })} required inputMode="numeric" placeholder="VD: 0912345678" />
          <label>Địa chỉ giao hàng *</label>
          <input value={form.dia_chi_giao} onChange={(e) => setForm({ ...form, dia_chi_giao: e.target.value })} required />
          <label>Phương thức thanh toán</label>
          {/* Chọn 1 trong 3 phương thức: COD, chuyển khoản hoặc thẻ ngân hàng */}
          <select value={form.phuong_thuc_thanh_toan} onChange={(e) => setForm({ ...form, phuong_thuc_thanh_toan: e.target.value })}>
            <option value="tien_mat">Thanh toán khi nhận hàng (COD)</option>
            <option value="chuyen_khoan">Chuyển khoản ngân hàng</option>
            <option value="the">Thẻ ngân hàng</option>
          </select>
          <label>Ghi chú</label>
          <input value={form.ghi_chu} onChange={(e) => setForm({ ...form, ghi_chu: e.target.value })} placeholder="Ghi chú cho cửa hàng (không bắt buộc)" />
        </div>

        {/* Tóm tắt đơn */}
        <div className="tt-tomtat">
          <h3>Đơn hàng ({gio.length} sản phẩm)</h3>
          {/* Liệt kê từng sản phẩm trong giỏ kèm thành tiền (giá bán × số lượng) */}
          {gio.map((x) => (
            <div className="tt-sp" key={x.id}>
              <span>{x.ten_san_pham} × {x.so_luong}</span>
              <b>{dinhDangTien(x.gia_ban * x.so_luong)}</b>
            </div>
          ))}
          {/* Tổng tiền toàn bộ giỏ hàng, định dạng theo tiền tệ Việt Nam */}
          <div className="tt-tong"><span>Tổng cộng</span><b>{dinhDangTien(tongTien)}</b></div>
          {/* Chỉ hiển thị khối báo lỗi khi có lỗi */}
          {loi && <div className="bao-loi">{loi}</div>}
          {/* Nút đặt hàng: bị vô hiệu hóa và đổi chữ khi đang gửi đơn */}
          <button type="submit" className="nut-dat-hang" disabled={dangGui}>
            {dangGui ? "Đang đặt hàng..." : "Đặt hàng"}
          </button>
        </div>
      </form>
    </div>
  );
}
