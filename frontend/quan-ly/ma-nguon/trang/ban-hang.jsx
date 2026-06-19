// =============================================================================
// Trang BÁN HÀNG: chọn sản phẩm vào giỏ -> thanh toán -> hiện HÓA ĐƠN để in
// =============================================================================
// Các phụ thuộc: hook React, lớp gọi API, hộp thoại dùng chung, ngữ cảnh xác thực và hàm định dạng tiền
import { useEffect, useState } from "react";
import ketNoiApi from "../goi-api/ket-noi-api"; // Axios đã cấu hình sẵn baseURL + token để gọi backend
import HopThoai from "../thanh-phan/hop-thoai"; // Component hộp thoại (modal) dùng chung
import { dungXacThuc } from "../ngu-canh/xac-thuc"; // Hook lấy thông tin người dùng đang đăng nhập
import { dinhDangTien } from "../tien-ich/dinh-dang"; // Hàm định dạng số tiền theo kiểu Việt Nam

// Tên hiển thị cho phương thức thanh toán
const TEN_PHUONG_THUC = { tien_mat: "Tiền mặt", chuyen_khoan: "Chuyển khoản", the: "Thẻ" };

// Component trang Bán hàng: màn hình POS cho nhân viên tạo đơn và xuất hóa đơn
export default function BanHang() {
  // Lấy người dùng đang đăng nhập (dùng cho trường "Thu ngân" trên hóa đơn)
  const { nguoiDung } = dungXacThuc();

  // Danh sách sản phẩm hiển thị ở cột trái (kết quả tìm kiếm)
  const [sanPham, setSanPham] = useState([]);
  // Danh sách khách hàng để chọn trong dropdown
  const [khachHang, setKhachHang] = useState([]);
  // Giỏ hàng hiện tại: mảng các dòng sản phẩm đã chọn
  const [gioHang, setGioHang] = useState([]);
  // Từ khóa tìm kiếm sản phẩm
  const [tuKhoa, setTuKhoa] = useState("");

  // Khách hàng được chọn cho đơn (rỗng = khách lẻ)
  const [khachHangId, setKhachHangId] = useState("");
  // Số tiền giảm giá áp cho đơn
  const [giamGia, setGiamGia] = useState(0);
  // Phương thức thanh toán: tien_mat / chuyen_khoan / the
  const [phuongThuc, setPhuongThuc] = useState("tien_mat");
  // Ghi chú thêm cho đơn hàng
  const [ghiChu, setGhiChu] = useState("");

  const [hoaDon, setHoaDon] = useState(null); // hóa đơn vừa tạo (để in)
  const [loi, setLoi] = useState(""); // thông báo lỗi hiển thị ở đầu trang

  // Tải danh sách sản phẩm từ API; nếu có từ khóa thì kèm tham số lọc tu_khoa
  const taiSanPham = async () => {
    const res = await ketNoiApi.get("/san-pham", { params: tuKhoa ? { tu_khoa: tuKhoa } : {} });
    setSanPham(res.data.du_lieu);
  };
  // Khi vào trang: tải sản phẩm và danh sách khách hàng (chỉ chạy một lần)
  useEffect(() => {
    taiSanPham();
    ketNoiApi.get("/khach-hang").then((res) => setKhachHang(res.data.du_lieu));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Thêm 1 sản phẩm vào giỏ khi nhấn vào thẻ sản phẩm
  const themVaoGio = (sp) => {
    setLoi("");
    setGioHang((cu) => {
      // Nếu sản phẩm đã có trong giỏ thì tăng số lượng (không vượt quá tồn kho)
      const daCo = cu.find((x) => x.id === sp.id);
      if (daCo) {
        return cu.map((x) =>
          x.id === sp.id ? { ...x, so_luong: Math.min(x.so_luong + 1, x.so_luong_ton) } : x
        );
      }
      // Chặn thêm sản phẩm đã hết hàng
      if (sp.so_luong_ton <= 0) {
        setLoi(`Sản phẩm "${sp.ten_san_pham}" đã hết hàng`);
        return cu;
      }
      // Thêm dòng mới vào giỏ với số lượng = 1; ép gia_ban về số để tính toán an toàn
      return [...cu, { id: sp.id, ten_san_pham: sp.ten_san_pham, gia_ban: Number(sp.gia_ban), so_luong: 1, so_luong_ton: sp.so_luong_ton }];
    });
  };

  // Cập nhật số lượng một dòng trong giỏ; kẹp giá trị trong khoảng [1, tồn kho]
  const doiSoLuong = (id, soLuong) => {
    setGioHang((cu) =>
      cu.map((x) => (x.id === id ? { ...x, so_luong: Math.max(1, Math.min(Number(soLuong) || 1, x.so_luong_ton)) } : x))
    );
  };
  // Xóa một sản phẩm ra khỏi giỏ theo id
  const xoaKhoiGio = (id) => setGioHang((cu) => cu.filter((x) => x.id !== id));

  // Tổng tiền hàng = cộng dồn (giá bán × số lượng) của mọi dòng trong giỏ
  const tongTien = gioHang.reduce((s, x) => s + x.gia_ban * x.so_luong, 0);
  // Giảm giá hợp lệ: KHÔNG âm và KHÔNG vượt quá tổng tiền (kẹp lại để hiển thị & gửi đúng)
  const giamGiaHopLe = Math.min(Math.max(0, Number(giamGia) || 0), tongTien);
  // Thành tiền = tổng tiền - giảm giá hợp lệ
  const thanhTien = tongTien - giamGiaHopLe;

  // Thanh toán -> tạo đơn -> dựng hóa đơn để in
  const thanhToan = async () => {
    setLoi("");
    // Không cho thanh toán khi giỏ hàng trống
    if (gioHang.length === 0) {
      setLoi("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    try {
      // Gọi API tạo đơn hàng; backend sẽ trừ tồn kho và sinh mã đơn
      const res = await ketNoiApi.post("/don-hang", {
        khach_hang_id: khachHangId || null, // null = khách lẻ
        giam_gia: giamGiaHopLe,
        phuong_thuc_thanh_toan: phuongThuc,
        ghi_chu: ghiChu || null,
        // Chỉ gửi id và số lượng; giá lấy theo dữ liệu phía server
        danh_sach_san_pham: gioHang.map((x) => ({ san_pham_id: x.id, so_luong: x.so_luong })),
      });

      // Dựng hóa đơn từ giỏ hàng hiện tại (trước khi xóa giỏ)
      // Tìm tên khách theo id đã chọn; nếu không có thì mặc định "Khách lẻ" (so sánh chuỗi để tránh lệch kiểu số/chuỗi)
      const tenKhach = khachHang.find((k) => String(k.id) === String(khachHangId))?.ho_ten || "Khách lẻ";
      // Lưu dữ liệu hóa đơn vào state để hiển thị và in
      setHoaDon({
        ma_don: res.data.du_lieu.ma_don, // mã đơn do backend trả về
        thoi_gian: new Date().toLocaleString("vi-VN"), // thời điểm lập hóa đơn
        ten_khach: tenKhach,
        nhan_vien: nguoiDung?.ho_ten || "", // người lập đơn (thu ngân)
        phuong_thuc: TEN_PHUONG_THUC[phuongThuc] || phuongThuc, // chuyển mã -> tên hiển thị
        // Sao chép từng dòng giỏ thành dòng hóa đơn kèm thành tiền (tt) đã tính
        items: gioHang.map((x) => ({ ten: x.ten_san_pham, sl: x.so_luong, gia: x.gia_ban, tt: x.gia_ban * x.so_luong })),
        tong_tien: tongTien,
        giam_gia: giamGiaHopLe,
        thanh_tien: thanhTien,
      });

      // Đặt lại giỏ và tải lại tồn kho mới
      setGioHang([]);
      setGiamGia(0);
      setGhiChu("");
      setKhachHangId("");
      taiSanPham(); // làm mới số lượng tồn sau khi trừ kho
    } catch (err) {
      // Hiển thị thông báo lỗi từ server nếu có, ngược lại dùng thông báo mặc định
      setLoi(err.response?.data?.thong_bao || "Tạo đơn hàng thất bại");
    }
  };

  // In hóa đơn: bật chế độ chỉ-in-hóa-đơn rồi gọi hộp thoại in của trình duyệt
  const inHoaDon = () => {
    document.body.classList.add("dang-in-hoa-don");
    window.print();
    document.body.classList.remove("dang-in-hoa-don");
  };

  // Giao diện trang bán hàng
  return (
    <div>
      <h2 className="tieu-de-trang">Bán hàng</h2>
      {/* Hiển thị thông báo lỗi nếu có */}
      {loi && <div className="bao-loi">{loi}</div>}

      {/* Bố cục 2 cột: trái chọn sản phẩm - phải giỏ hàng/thanh toán */}
      <div className="ban-hang-luoi">
        {/* Cột trái: chọn sản phẩm */}
        <div>
          {/* Ô tìm kiếm sản phẩm: gõ Enter hoặc bấm nút Tìm để lọc */}
          <div className="thanh-tim-kiem">
            <input
              placeholder="Tìm sản phẩm..."
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && taiSanPham()}
            />
            <button className="nut nut-phu" onClick={taiSanPham}>Tìm</button>
          </div>

          {/* Lưới các thẻ sản phẩm; bấm vào thẻ để thêm vào giỏ */}
          <div className="danh-sach-sp">
            {sanPham.map((sp) => (
              <div className="the-sp" key={sp.id} onClick={() => themVaoGio(sp)}>
                {/* Ảnh sản phẩm: có ảnh thì làm nền, không thì hiện chữ cái đầu của tên */}
                <div
                  className="anh-the"
                  style={
                    sp.hinh_anh
                      ? { backgroundImage: `url(${sp.hinh_anh})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : undefined
                  }
                >
                  {!sp.hinh_anh && (sp.ten_san_pham || "?").trim().charAt(0).toUpperCase()}
                </div>
                <div className="ten">{sp.ten_san_pham}</div>
                <div className="gia">{dinhDangTien(sp.gia_ban)}</div>
                <div className="ton">{sp.thuong_hieu ? sp.thuong_hieu + " · " : ""}Tồn: {sp.so_luong_ton}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cột phải: giỏ hàng & thanh toán */}
        <div className="gio-hang">
          <h3>🛒 Giỏ hàng</h3>
          {/* Giỏ trống thì báo, ngược lại liệt kê từng dòng sản phẩm */}
          {gioHang.length === 0 ? (
            <p className="trong">Chưa có sản phẩm nào</p>
          ) : (
            gioHang.map((x) => (
              <div className="dong-gio" key={x.id}>
                <div style={{ flex: 1 }}>
                  <div>{x.ten_san_pham}</div>
                  <small>{dinhDangTien(x.gia_ban)}</small>
                </div>
                {/* Ô chỉnh số lượng, giới hạn tối đa theo tồn kho */}
                <input type="number" min="1" max={x.so_luong_ton} value={x.so_luong} onChange={(e) => doiSoLuong(x.id, e.target.value)} />
                {/* Thành tiền của dòng = giá bán × số lượng */}
                <div style={{ width: 90, textAlign: "right" }}>{dinhDangTien(x.gia_ban * x.so_luong)}</div>
                {/* Nút xóa dòng khỏi giỏ */}
                <button className="nut nut-nho nut-xoa" onClick={() => xoaKhoiGio(x.id)}>✕</button>
              </div>
            ))
          )}

          {/* Chọn khách hàng (mặc định Khách lẻ) */}
          <div className="o-nhap" style={{ marginTop: 16 }}>
            <label>Khách hàng</label>
            <select value={khachHangId} onChange={(e) => setKhachHangId(e.target.value)}>
              <option value="">Khách lẻ</option>
              {khachHang.map((kh) => (
                <option key={kh.id} value={kh.id}>{kh.ho_ten} {kh.dien_thoai ? `- ${kh.dien_thoai}` : ""}</option>
              ))}
            </select>
          </div>
          {/* Nhập số tiền giảm giá cho đơn */}
          <div className="o-nhap">
            <label>Giảm giá (₫)</label>
            <input type="number" min="0" value={giamGia} onChange={(e) => setGiamGia(e.target.value)} />
          </div>
          {/* Chọn phương thức thanh toán */}
          <div className="o-nhap">
            <label>Phương thức thanh toán</label>
            <select value={phuongThuc} onChange={(e) => setPhuongThuc(e.target.value)}>
              <option value="tien_mat">Tiền mặt</option>
              <option value="chuyen_khoan">Chuyển khoản</option>
              <option value="the">Thẻ</option>
            </select>
          </div>
          {/* Nhập ghi chú cho đơn (tùy chọn) */}
          <div className="o-nhap">
            <label>Ghi chú</label>
            <input value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          </div>

          {/* Hiển thị thành tiền cuối cùng và nút thanh toán */}
          <div className="tong-tien-gio">Thành tiền: {dinhDangTien(thanhTien)}</div>
          <button className="nut nut-chinh" style={{ width: "100%", justifyContent: "center" }} onClick={thanhToan}>
            Thanh toán
          </button>
        </div>
      </div>

      {/* HÓA ĐƠN sau khi thanh toán (có nút in) */}
      {/* Chỉ hiển thị hộp thoại hóa đơn khi đã tạo đơn thành công */}
      {hoaDon && (
        <HopThoai tieuDe="Hóa đơn bán hàng" dong={() => setHoaDon(null)}>
          {/* Khu vực nội dung hóa đơn dùng để in */}
          <div className="vung-hoa-don">
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 20 }}>⚽ TVU STORE</h2>
              <div style={{ fontSize: 13, color: "#64748b" }}>Cửa hàng dụng cụ thể thao</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>ĐT: 1900 1234 · TP. Hồ Chí Minh</div>
              <h3 style={{ marginTop: 10 }}>HÓA ĐƠN BÁN HÀNG</h3>
            </div>

            <div style={{ fontSize: 13.5, marginBottom: 10 }}>
              <div><b>Mã đơn:</b> {hoaDon.ma_don}</div>
              <div><b>Thời gian:</b> {hoaDon.thoi_gian}</div>
              <div><b>Khách hàng:</b> {hoaDon.ten_khach}</div>
              <div><b>Thu ngân:</b> {hoaDon.nhan_vien}</div>
            </div>

            {/* Bảng chi tiết các sản phẩm trong hóa đơn */}
            <table className="bang">
              <thead>
                <tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>
              </thead>
              <tbody>
                {hoaDon.items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.ten}</td>
                    <td>{it.sl}</td>
                    <td>{dinhDangTien(it.gia)}</td>
                    <td>{dinhDangTien(it.tt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 12, textAlign: "right", fontSize: 14 }}>
              <div>Tổng tiền: {dinhDangTien(hoaDon.tong_tien)}</div>
              <div>Giảm giá: {dinhDangTien(hoaDon.giam_gia)}</div>
              <div className="tong-tien-gio">Thành tiền: {dinhDangTien(hoaDon.thanh_tien)}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>Thanh toán: {hoaDon.phuong_thuc}</div>
            </div>

            <p style={{ textAlign: "center", marginTop: 14, fontStyle: "italic", color: "#64748b" }}>
              Cảm ơn quý khách - Hẹn gặp lại!
            </p>
          </div>

          {/* Cụm nút thao tác (class "khong-in" để ẩn khi in) */}
          <div className="nut-form khong-in" style={{ marginTop: 16 }}>
            <button className="nut nut-phu" onClick={() => setHoaDon(null)}>Đóng</button>
            <button className="nut nut-chinh" onClick={inHoaDon}>🖨️ In hóa đơn</button>
          </div>
        </HopThoai>
      )}
    </div>
  );
}
