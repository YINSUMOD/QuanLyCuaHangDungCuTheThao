// =============================================================================
// Trang NHẬP KHO: tạo phiếu nhập hàng từ nhà cung cấp (tăng tồn kho)
// Bên trái: chọn sản phẩm | Bên phải: phiếu nhập | Bên dưới: danh sách phiếu đã nhập
// =============================================================================
import { useEffect, useState } from "react";
import ketNoiApi from "../goi-api/ket-noi-api";
import HopThoai from "../thanh-phan/hop-thoai";
import { dinhDangTien, dinhDangNgay } from "../tien-ich/dinh-dang";

// Component trang Nhập kho: quản lý toàn bộ state và giao diện tạo phiếu nhập hàng
export default function NhapKho() {
  // Danh sách sản phẩm hiển thị ở cột trái (để chọn nhập)
  const [sanPham, setSanPham] = useState([]);
  // Danh sách nhà cung cấp dùng cho dropdown chọn NCC
  const [nhaCungCap, setNhaCungCap] = useState([]);
  // Phiếu nhập đang soạn: mảng dòng sản phẩm đã chọn
  const [phieu, setPhieu] = useState([]); // [{ id, ten_san_pham, so_luong, gia_nhap }]
  // Từ khóa tìm kiếm sản phẩm
  const [tuKhoa, setTuKhoa] = useState("");
  // ID nhà cung cấp được chọn cho phiếu nhập
  const [nccId, setNccId] = useState("");
  // Ghi chú cho phiếu nhập
  const [ghiChu, setGhiChu] = useState("");

  // Lịch sử các phiếu nhập đã tạo (hiển thị bảng bên dưới)
  const [danhSachPhieu, setDanhSachPhieu] = useState([]);
  // Dữ liệu chi tiết phiếu đang xem trong hộp thoại (null = đóng)
  const [chiTietXem, setChiTietXem] = useState(null);
  // Thông báo thành công và thông báo lỗi hiển thị trên đầu trang
  const [thongBao, setThongBao] = useState("");
  const [loi, setLoi] = useState("");

  // Tải dữ liệu
  // Lấy danh sách sản phẩm từ API; nếu có từ khóa thì truyền tham số lọc
  const taiSanPham = async () => {
    const res = await ketNoiApi.get("/san-pham", { params: tuKhoa ? { tu_khoa: tuKhoa } : {} });
    setSanPham(res.data.du_lieu);
  };
  // Lấy lịch sử các phiếu nhập đã tạo
  const taiDanhSachPhieu = async () => {
    const res = await ketNoiApi.get("/nhap-kho");
    setDanhSachPhieu(res.data.du_lieu);
  };
  // Khi mount component: tải sản phẩm, lịch sử phiếu và danh sách nhà cung cấp
  useEffect(() => {
    taiSanPham();
    taiDanhSachPhieu();
    ketNoiApi.get("/nha-cung-cap").then((res) => setNhaCungCap(res.data.du_lieu));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Thêm sản phẩm vào phiếu nhập (giá nhập mặc định lấy theo giá nhập hiện tại)
  const themVaoPhieu = (sp) => {
    setLoi("");
    setPhieu((cu) => {
      // Nếu sản phẩm đã có trong phiếu thì tăng số lượng lên 1
      const daCo = cu.find((x) => x.id === sp.id);
      if (daCo) return cu.map((x) => (x.id === sp.id ? { ...x, so_luong: x.so_luong + 1 } : x));
      // Chưa có thì thêm dòng mới với số lượng 1 và giá nhập mặc định
      return [...cu, { id: sp.id, ten_san_pham: sp.ten_san_pham, so_luong: 1, gia_nhap: Number(sp.gia_nhap) || 0 }];
    });
  };

  // Đổi số lượng của 1 dòng; ép tối thiểu là 1 để tránh số âm hoặc 0
  const doiSoLuong = (id, v) =>
    setPhieu((cu) => cu.map((x) => (x.id === id ? { ...x, so_luong: Math.max(1, Number(v) || 1) } : x)));
  // Đổi giá nhập của 1 dòng; ép tối thiểu là 0 để tránh giá âm
  const doiGiaNhap = (id, v) =>
    setPhieu((cu) => cu.map((x) => (x.id === id ? { ...x, gia_nhap: Math.max(0, Number(v) || 0) } : x)));
  // Xóa 1 sản phẩm khỏi phiếu nhập đang soạn
  const xoaKhoiPhieu = (id) => setPhieu((cu) => cu.filter((x) => x.id !== id));

  // Tính tổng tiền nhập = tổng (số lượng × giá nhập) của mọi dòng
  const tongTien = phieu.reduce((s, x) => s + x.so_luong * x.gia_nhap, 0);

  // Lưu phiếu nhập
  const luuPhieu = async () => {
    // Xóa thông báo cũ trước khi xử lý
    setLoi("");
    setThongBao("");
    // Ràng buộc: phải có ít nhất 1 sản phẩm mới cho lưu
    if (phieu.length === 0) {
      setLoi("Vui lòng chọn ít nhất một sản phẩm để nhập");
      return;
    }
    try {
      // Gửi phiếu nhập lên server; backend sẽ tạo phiếu và tăng tồn kho
      const res = await ketNoiApi.post("/nhap-kho", {
        nha_cung_cap_id: nccId || null,
        ghi_chu: ghiChu || null,
        // Chuyển từng dòng phiếu thành định dạng API mong đợi
        danh_sach_san_pham: phieu.map((x) => ({ san_pham_id: x.id, so_luong: x.so_luong, gia_nhap: x.gia_nhap })),
      });
      // Thông báo thành công kèm mã phiếu trả về từ server
      setThongBao(`✅ Tạo phiếu nhập thành công! Mã phiếu: ${res.data.du_lieu.ma_phieu} — đã cập nhật tồn kho.`);
      // Reset form về trạng thái rỗng để chuẩn bị nhập phiếu mới
      setPhieu([]);
      setNccId("");
      setGhiChu("");
      taiSanPham(); // tồn kho đã thay đổi
      taiDanhSachPhieu();
    } catch (err) {
      // Hiển thị thông báo lỗi từ server, hoặc lỗi mặc định nếu không có
      setLoi(err.response?.data?.thong_bao || "Tạo phiếu nhập thất bại");
    }
  };

  // Tải chi tiết 1 phiếu nhập và mở hộp thoại xem
  const xemChiTiet = async (id) => {
    const res = await ketNoiApi.get(`/nhap-kho/${id}`);
    setChiTietXem(res.data.du_lieu);
  };

  return (
    <div>
      <h2 className="tieu-de-trang">Nhập kho</h2>

      {/* Hiển thị thông báo thành công / lỗi (chỉ khi có nội dung) */}
      {thongBao && <div className="bao-thanh-cong">{thongBao}</div>}
      {loi && <div className="bao-loi">{loi}</div>}

      {/* Bố cục lưới 2 cột: trái chọn sản phẩm, phải là phiếu nhập */}
      <div className="ban-hang-luoi">
        {/* Cột trái: chọn sản phẩm cần nhập */}
        <div>
          <div className="thanh-tim-kiem">
            <input
              placeholder="Tìm sản phẩm cần nhập..."
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && taiSanPham()}
            />
            <button className="nut nut-phu" onClick={taiSanPham}>Tìm</button>
          </div>
          {/* Lưới thẻ sản phẩm: bấm vào thẻ để thêm vào phiếu nhập */}
          <div className="danh-sach-sp">
            {sanPham.map((sp) => (
              <div className="the-sp" key={sp.id} onClick={() => themVaoPhieu(sp)}>
                <div className="ten">{sp.ten_san_pham}</div>
                <div className="ton">Tồn: {sp.so_luong_ton} · Giá nhập: {dinhDangTien(sp.gia_nhap)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cột phải: phiếu nhập */}
        <div className="gio-hang">
          <h3>📥 Phiếu nhập</h3>

          {/* Phiếu rỗng thì báo, ngược lại liệt kê từng dòng sản phẩm */}
          {phieu.length === 0 ? (
            <p className="trong">Chưa chọn sản phẩm nào</p>
          ) : (
            phieu.map((x) => (
              <div className="dong-gio" key={x.id} style={{ flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 120 }}>{x.ten_san_pham}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {/* Ô nhập số lượng và giá nhập cho từng dòng, kèm nút xóa dòng */}
                  <input title="Số lượng" type="number" min="1" value={x.so_luong} onChange={(e) => doiSoLuong(x.id, e.target.value)} />
                  <input title="Giá nhập" type="number" min="0" style={{ width: 100 }} value={x.gia_nhap} onChange={(e) => doiGiaNhap(x.id, e.target.value)} />
                  <button className="nut nut-nho nut-xoa" onClick={() => xoaKhoiPhieu(x.id)}>✕</button>
                </div>
              </div>
            ))
          )}

          {/* Dropdown chọn nhà cung cấp cho phiếu nhập */}
          <div className="o-nhap" style={{ marginTop: 16 }}>
            <label>Nhà cung cấp</label>
            <select value={nccId} onChange={(e) => setNccId(e.target.value)}>
              <option value="">-- Chọn nhà cung cấp --</option>
              {nhaCungCap.map((n) => (
                <option key={n.id} value={n.id}>{n.ten_ncc}</option>
              ))}
            </select>
          </div>
          <div className="o-nhap">
            <label>Ghi chú</label>
            <input value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          </div>

          {/* Hiển thị tổng tiền nhập và nút lưu phiếu */}
          <div className="tong-tien-gio">Tổng tiền nhập: {dinhDangTien(tongTien)}</div>
          <button className="nut nut-chinh" style={{ width: "100%", justifyContent: "center" }} onClick={luuPhieu}>
            Lưu phiếu nhập
          </button>
        </div>
      </div>

      {/* Danh sách phiếu nhập đã tạo */}
      <h3 style={{ margin: "24px 0 12px", fontSize: 17 }}>Lịch sử phiếu nhập</h3>
      <div className="the-bang">
        <table className="bang">
          <thead>
            <tr><th>Mã phiếu</th><th>Nhà cung cấp</th><th>Nhân viên</th><th>Tổng tiền</th><th>Ngày tạo</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {/* Rỗng thì báo, ngược lại render từng dòng phiếu nhập */}
            {danhSachPhieu.length === 0 ? (
              <tr><td colSpan={6} className="trong">Chưa có phiếu nhập nào</td></tr>
            ) : danhSachPhieu.map((p) => (
              <tr key={p.id}>
                <td><b>{p.ma_phieu}</b></td>
                <td>{p.ten_ncc || "—"}</td>
                <td>{p.ten_nhan_vien || "—"}</td>
                <td>{dinhDangTien(p.tong_tien)}</td>
                <td>{dinhDangNgay(p.ngay_tao)}</td>
                <td><button className="nut nut-nho" onClick={() => xemChiTiet(p.id)}>Xem</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chi tiết phiếu nhập */}
      {/* Hộp thoại chỉ hiện khi chiTietXem khác null; đóng bằng cách set về null */}
      {chiTietXem && (
        <HopThoai tieuDe={`Chi tiết phiếu nhập ${chiTietXem.ma_phieu}`} dong={() => setChiTietXem(null)}>
          <p><b>Nhà cung cấp:</b> {chiTietXem.ten_ncc || "—"}</p>
          <p><b>Nhân viên:</b> {chiTietXem.ten_nhan_vien || "—"}</p>
          <p><b>Ngày tạo:</b> {dinhDangNgay(chiTietXem.ngay_tao)}</p>
          <table className="bang" style={{ marginTop: 12 }}>
            <thead><tr><th>Sản phẩm</th><th>SL</th><th>Giá nhập</th><th>Thành tiền</th></tr></thead>
            <tbody>
              {/* Liệt kê từng dòng chi tiết; sản phẩm đã xóa thì hiển thị nhãn thay tên */}
              {chiTietXem.chi_tiet.map((ct) => (
                <tr key={ct.id}>
                  <td>{ct.ten_san_pham || "(Đã xóa)"}</td>
                  <td>{ct.so_luong}</td>
                  <td>{dinhDangTien(ct.gia_nhap)}</td>
                  <td>{dinhDangTien(ct.thanh_tien)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tong-tien-gio" style={{ marginTop: 12 }}>Tổng: {dinhDangTien(chiTietXem.tong_tien)}</div>
        </HopThoai>
      )}
    </div>
  );
}
