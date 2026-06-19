// =============================================================================
// Trang TỔNG QUAN (Dashboard): thẻ thống kê, biểu đồ doanh thu, đơn hàng gần đây
// =============================================================================
import { useEffect, useState } from "react";
import ketNoiApi from "../goi-api/ket-noi-api";
import { dinhDangTien, dinhDangNgay } from "../tien-ich/dinh-dang";

// Rút gọn số tiền cho nhãn biểu đồ: 3500000 -> "3.5tr", 150000 -> "150k"
const tienNgan = (so) => {
  so = Number(so || 0); // Ép kiểu về số, giá trị rỗng/không hợp lệ coi như 0
  // Từ 1 triệu trở lên: hiển thị theo đơn vị "tr", bỏ phần ".0" cho gọn (vd 3.0tr -> 3tr)
  if (so >= 1000000) return (so / 1000000).toFixed(1).replace(".0", "") + "tr";
  // Từ 1 nghìn đến dưới 1 triệu: làm tròn về đơn vị "k" (nghìn)
  if (so >= 1000) return Math.round(so / 1000) + "k";
  return so; // Dưới 1 nghìn: giữ nguyên giá trị
};

// Tập hợp các icon SVG dùng cho các thẻ thống kê (tiền, lịch, đơn, hộp, người)
const I = {
  tien: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  lich: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="23" y1="6" x2="13.5" y2="15.5"/><polyline points="17 6 23 6 23 12"/><polyline points="1 18 8 11 12 15 23 4" transform="translate(0,2)"/></svg>,
  don: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>,
  hop: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg>,
  nguoi: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>,
};

// Component hiển thị nhãn (chip) trạng thái đơn hàng theo mã trạng thái nhận vào (prop tt)
function ChipTrangThai({ tt }) {
  // Bảng ánh xạ: mã trạng thái -> [văn bản hiển thị, lớp CSS màu sắc]
  const m = {
    hoan_thanh: ["Hoàn thành", "chip-xanh"],
    da_huy: ["Đã hủy", "chip-do"],
    cho_xu_ly: ["Chờ xử lý", "chip-vang"],
  };
  // Tra cứu nhãn/lớp tương ứng; nếu mã lạ thì dùng chính mã đó với màu xám mặc định
  const [nhan, lop] = m[tt] || [tt, "chip-xam"];
  return <span className={`chip ${lop}`}>{nhan}</span>;
}

// Component chính: trang Tổng quan (Dashboard) hiển thị toàn bộ số liệu thống kê của cửa hàng
export default function TongQuan() {
  // State lưu dữ liệu tổng quan lấy từ API (null = chưa tải xong)
  const [d, setD] = useState(null);

  // Khi component được mount: gọi API lấy dữ liệu tổng quan rồi lưu vào state d
  useEffect(() => {
    ketNoiApi.get("/bao-cao/tong-quan").then((res) => setD(res.data.du_lieu));
  }, []);

  // Trong lúc chờ dữ liệu về thì hiển thị thông báo đang tải
  if (!d) return <p>Đang tải số liệu...</p>;

  // Doanh thu lớn nhất trong 7 ngày, dùng làm mốc 100% để tính chiều cao các cột biểu đồ.
  // Math.max(1, ...) đảm bảo mẫu số tối thiểu là 1, tránh chia cho 0 khi mọi giá trị đều bằng 0
  const doanhThuMax = Math.max(1, ...d.doanh_thu_7_ngay.map((x) => Number(x.doanh_thu)));

  // Mảng cấu hình 5 thẻ thống kê nhanh: mỗi thẻ gồm màu, icon, nhãn và giá trị (đã định dạng)
  const theThongKe = [
    { mau: "mau-1", icon: I.tien, nhan: "Doanh thu hôm nay", so: dinhDangTien(d.doanh_thu_hom_nay) },
    { mau: "mau-2", icon: I.lich, nhan: "Doanh thu tháng này", so: dinhDangTien(d.doanh_thu_thang) },
    { mau: "mau-3", icon: I.don, nhan: "Tổng đơn hàng", so: d.tong_don_hang },
    { mau: "mau-4", icon: I.hop, nhan: "Tổng sản phẩm", so: d.tong_san_pham },
    { mau: "mau-5", icon: I.nguoi, nhan: "Tổng khách hàng", so: d.tong_khach_hang },
  ];

  return (
    <div>
      <div className="tieu-de-trang">
        <h2>Tổng quan</h2>
      </div>

      {/* Thẻ thống kê nhanh */}
      <div className="luoi-the">
        {/* Lặp qua mảng cấu hình để render từng thẻ thống kê (dùng nhãn làm key) */}
        {theThongKe.map((t) => (
          <div className={`the-thong-ke ${t.mau}`} key={t.nhan}>
            <div className="icon-box">{t.icon}</div>
            <div>
              <div className="nhan">{t.nhan}</div>
              <div className="so">{t.so}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Biểu đồ doanh thu 7 ngày */}
      <div className="khoi" style={{ marginBottom: 16 }}>
        <h3>Doanh thu 7 ngày gần nhất</h3>
        {d.doanh_thu_7_ngay.length === 0 ? (
          <p className="trong">Chưa có dữ liệu doanh thu</p>
        ) : (
          <div className="bieu-do">
            {/* Mỗi cột biểu đồ tương ứng 1 ngày; tooltip (title) hiện số tiền đầy đủ khi rê chuột */}
            {d.doanh_thu_7_ngay.map((x) => (
              <div className="bieu-do-cot" key={x.ngay} title={dinhDangTien(x.doanh_thu)}>
                <div className="gia-tri">{tienNgan(x.doanh_thu)}</div>
                {/* Chiều cao thanh = tỉ lệ phần trăm giữa doanh thu ngày đó so với doanh thu lớn nhất */}
                <div className="thanh" style={{ height: `${(Number(x.doanh_thu) / doanhThuMax) * 100}%` }}></div>
                <div className="nhan-ngay">{new Date(x.ngay).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="luoi-2-cot" style={{ marginBottom: 16 }}>
        {/* Đơn hàng gần đây */}
        <div className="khoi">
          <h3>🧾 Đơn hàng gần đây</h3>
          <div className="khoi-bang">
            <table className="bang">
              <thead>
                <tr><th>Mã đơn</th><th>Khách hàng</th><th>Thành tiền</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {/* Nếu không có đơn hàng thì hiển thị 1 dòng thông báo, ngược lại liệt kê từng đơn */}
                {(d.don_hang_gan_day || []).length === 0 ? (
                  <tr><td colSpan={4} className="trong">Chưa có đơn hàng</td></tr>
                ) : (
                  d.don_hang_gan_day.map((dh) => (
                    <tr key={dh.id}>
                      <td><b>{dh.ma_don}</b></td>
                      {/* Không có tên khách thì coi là khách lẻ (mua không cần thông tin) */}
                      <td>{dh.ten_khach_hang || "Khách lẻ"}</td>
                      <td>{dinhDangTien(dh.thanh_tien)}</td>
                      <td><ChipTrangThai tt={dh.trang_thai} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sản phẩm sắp hết hàng */}
        <div className="khoi">
          <h3>⚠️ Sản phẩm sắp hết hàng (tồn ≤ 5)</h3>
          <div className="khoi-bang">
            <table className="bang">
              <thead>
                <tr><th>Tên sản phẩm</th><th>Tồn kho</th></tr>
              </thead>
              <tbody>
                {/* Danh sách sản phẩm có tồn kho thấp (theo điều kiện server trả về: tồn ≤ 5) */}
                {d.san_pham_sap_het.length === 0 ? (
                  <tr><td colSpan={2} className="trong">Không có sản phẩm nào sắp hết</td></tr>
                ) : (
                  d.san_pham_sap_het.map((sp) => (
                    <tr key={sp.id}>
                      <td>{sp.ten_san_pham}</td>
                      {/* Tô màu đỏ (chip-do) để cảnh báo số lượng tồn còn ít */}
                      <td><span className="chip chip-do">{sp.so_luong_ton}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top sản phẩm bán chạy */}
      <div className="khoi">
        <h3>🔥 Top sản phẩm bán chạy</h3>
        <div className="khoi-bang">
          <table className="bang">
            <thead>
              <tr><th>#</th><th>Tên sản phẩm</th><th>Số lượng đã bán</th></tr>
            </thead>
            <tbody>
              {/* Danh sách sản phẩm bán chạy nhất; i là chỉ số dùng để đánh số thứ hạng */}
              {d.top_san_pham.length === 0 ? (
                <tr><td colSpan={3} className="trong">Chưa có dữ liệu bán hàng</td></tr>
              ) : (
                d.top_san_pham.map((sp, i) => (
                  <tr key={i}>
                    {/* Thứ hạng hiển thị = chỉ số + 1 (vì mảng đánh số từ 0) */}
                    <td><b>{i + 1}</b></td>
                    <td>{sp.ten_san_pham}</td>
                    <td><span className="chip chip-xanh">{sp.da_ban}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
