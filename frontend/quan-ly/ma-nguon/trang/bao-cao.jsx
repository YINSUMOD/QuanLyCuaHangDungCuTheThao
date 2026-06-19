// =============================================================================
// Trang BÁO CÁO doanh thu: lọc theo khoảng ngày + xuất Excel + xuất PDF (in)
// =============================================================================
import { useEffect, useState } from "react"; // Hook React: useEffect (chạy khi mount), useState (quản lý state)
import * as XLSX from "xlsx"; // Thư viện đọc/ghi file Excel (.xlsx) phía trình duyệt
import ketNoiApi from "../goi-api/ket-noi-api"; // Đối tượng axios đã cấu hình sẵn baseURL/token để gọi API backend
import { dinhDangTien } from "../tien-ich/dinh-dang"; // Hàm tiện ích định dạng số tiền theo kiểu Việt Nam (vd: 1.000.000 ₫)

// Định dạng ngày YYYY-MM-DD cho ô input type=date
const fmt = (d) => d.toISOString().slice(0, 10);

// Bảng màu cho biểu đồ tròn
const MAU_TRON = ["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444", "#84cc16", "#f97316", "#64748b"];

// Biểu đồ tròn (donut) doanh thu theo danh mục - vẽ bằng conic-gradient, không cần thư viện
// Props: duLieu = mảng { ten_danh_muc, doanh_thu } để vẽ các phần của biểu đồ
function BieuDoTron({ duLieu }) {
  // Tính tổng doanh thu của tất cả danh mục để quy đổi ra phần trăm
  const tong = duLieu.reduce((s, x) => s + Number(x.doanh_thu), 0);
  // Không có dữ liệu hoặc tổng bằng 0 thì hiển thị thông báo thay vì vẽ biểu đồ
  if (!duLieu.length || tong <= 0) return <p className="trong">Chưa có dữ liệu</p>;

  let goc = 0; // Vị trí % tích lũy (điểm bắt đầu của từng đoạn cung tròn)
  // Chuyển mỗi danh mục thành 1 đoạn cung: tính % và khoảng góc [tu, den]
  const doan = duLieu.map((x, i) => {
    const pct = (Number(x.doanh_thu) / tong) * 100; // Tỉ lệ % của danh mục này trên tổng
    // Gán màu xoay vòng theo bảng MAU_TRON (toán tử % để không vượt độ dài mảng)
    const item = { ten: x.ten_danh_muc || "Khác", pct, mau: MAU_TRON[i % MAU_TRON.length], tu: goc, den: goc + pct };
    goc += pct; // Dồn góc để đoạn kế tiếp bắt đầu ngay sau đoạn này
    return item;
  });
  // Tạo chuỗi conic-gradient: mỗi đoạn là "màu từ% đến%" để CSS vẽ hình tròn nhiều màu
  const nen = `conic-gradient(${doan.map((d) => `${d.mau} ${d.tu}% ${d.den}%`).join(", ")})`;

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      {/* Hình tròn biểu đồ: borderRadius 50% + nền conic-gradient tạo thành donut/pie */}
      <div style={{ width: 160, height: 160, borderRadius: "50%", background: nen, flexShrink: 0 }}></div>
      {/* Phần chú giải (legend): liệt kê từng danh mục kèm màu và % */}
      <div style={{ flex: 1, minWidth: 180 }}>
        {doan.map((d) => (
          <div key={d.ten} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, fontSize: 13.5 }}>
            {/* Ô màu nhỏ tương ứng với màu của đoạn trên biểu đồ */}
            <span style={{ width: 12, height: 12, borderRadius: 3, background: d.mau, display: "inline-block" }}></span>
            <span style={{ flex: 1 }}>{d.ten}</span>
            {/* Hiển thị % làm tròn 1 chữ số thập phân */}
            <b>{d.pct.toFixed(1)}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component chính: trang Báo cáo doanh thu (lọc theo ngày, xem thống kê, xuất Excel/PDF)
export default function BaoCao() {
  // Mặc định: 30 ngày gần nhất
  const homNay = new Date();
  const truoc30 = new Date();
  truoc30.setDate(homNay.getDate() - 29); // Lùi 29 ngày để khoảng [trước30, hôm nay] đủ 30 ngày

  // State khoảng lọc và dữ liệu báo cáo
  const [tuNgay, setTuNgay] = useState(fmt(truoc30)); // Ngày bắt đầu (chuỗi YYYY-MM-DD)
  const [denNgay, setDenNgay] = useState(fmt(homNay)); // Ngày kết thúc (chuỗi YYYY-MM-DD)
  const [d, setD] = useState(null); // Dữ liệu báo cáo trả về từ API (null = chưa tải)
  const [dangTai, setDangTai] = useState(false); // Cờ đang gọi API để hiển thị trạng thái tải

  // Gọi API lấy báo cáo theo khoảng ngày
  const xemBaoCao = async () => {
    // Ràng buộc khoảng ngày: "Từ ngày" không được lớn hơn "Đến ngày"
    if (tuNgay && denNgay && tuNgay > denNgay) {
      alert("Từ ngày phải nhỏ hơn hoặc bằng Đến ngày");
      return;
    }
    setDangTai(true); // Bật cờ tải trước khi gọi API
    try {
      // GET /bao-cao/doanh-thu kèm tham số query khoảng ngày
      const res = await ketNoiApi.get("/bao-cao/doanh-thu", {
        params: { tu_ngay: tuNgay, den_ngay: denNgay },
      });
      setD(res.data.du_lieu); // Lưu dữ liệu báo cáo vào state
    } finally {
      setDangTai(false); // Luôn tắt cờ tải dù thành công hay lỗi
    }
  };

  // Khi component mount: tự động tải báo cáo mặc định (30 ngày gần nhất)
  useEffect(() => {
    xemBaoCao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xuất file Excel (.xlsx) gồm 2 sheet: theo ngày & theo sản phẩm
  const xuatExcel = () => {
    if (!d) return; // Chưa có dữ liệu thì không làm gì
    const wb = XLSX.utils.book_new(); // Tạo workbook (file Excel) rỗng

    // Sheet 1: doanh thu theo từng ngày (chuyển mảng object -> sheet, đặt tên cột tiếng Việt)
    const sheetNgay = XLSX.utils.json_to_sheet(
      d.theo_ngay.map((r) => ({
        "Ngày": r.ngay,
        "Số đơn": r.so_don,
        "Doanh thu (₫)": Number(r.doanh_thu), // Ép kiểu số để Excel nhận dạng là số
      }))
    );
    XLSX.utils.book_append_sheet(wb, sheetNgay, "Theo ngay"); // Gắn sheet vào workbook

    // Sheet 2: doanh thu theo từng sản phẩm
    const sheetSP = XLSX.utils.json_to_sheet(
      d.theo_san_pham.map((r) => ({
        "Sản phẩm": r.ten_san_pham,
        "Thương hiệu": r.thuong_hieu,
        "Số lượng bán": Number(r.so_luong),
        "Doanh thu (₫)": Number(r.doanh_thu),
      }))
    );
    XLSX.utils.book_append_sheet(wb, sheetSP, "Theo san pham");

    // Ghi và tải file về máy, tên file kèm khoảng ngày báo cáo
    XLSX.writeFile(wb, `bao-cao-doanh-thu_${d.tu_ngay}_den_${d.den_ngay}.xlsx`);
  };

  // Xuất PDF: dùng hộp thoại in của trình duyệt (hỗ trợ tiếng Việt tốt)
  const xuatPDF = () => window.print(); // Mở hộp thoại in; người dùng chọn "Lưu thành PDF"

  // Giao diện trang báo cáo
  return (
    <div>
      {/* Tiêu đề trang + nhóm nút xuất file (class "khong-in" để ẩn khi in PDF) */}
      <div className="tieu-de-trang">
        <h2>Báo cáo doanh thu</h2>
        <div className="khong-in" style={{ display: "flex", gap: 8 }}>
          {/* Nút bị vô hiệu (disabled) khi chưa có dữ liệu d */}
          <button className="nut nut-phu" onClick={xuatExcel} disabled={!d}>📊 Xuất Excel</button>
          <button className="nut nut-phu" onClick={xuatPDF} disabled={!d}>🖨️ Xuất PDF</button>
        </div>
      </div>

      {/* Bộ lọc khoảng ngày */}
      <div className="khoi khong-in" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="o-nhap" style={{ marginBottom: 0 }}>
            <label>Từ ngày</label>
            <input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} />
          </div>
          <div className="o-nhap" style={{ marginBottom: 0 }}>
            <label>Đến ngày</label>
            <input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} />
          </div>
          {/* Nút áp dụng bộ lọc: gọi lại API với khoảng ngày đang chọn */}
          <button className="nut nut-chinh" onClick={xemBaoCao}>Xem báo cáo</button>
        </div>
      </div>

      {/* Hiển thị thông báo khi đang tải dữ liệu */}
      {dangTai && <p>Đang tải báo cáo...</p>}

      {/* Chỉ render nội dung báo cáo khi đã có dữ liệu (d khác null) */}
      {d && (
        <>
          {/* Khoảng thời gian báo cáo (hiển thị cả khi in) */}
          <p style={{ color: "#64748b", marginBottom: 16 }}>
            Khoảng thời gian: <b>{new Date(d.tu_ngay).toLocaleDateString("vi-VN")}</b> –{" "}
            <b>{new Date(d.den_ngay).toLocaleDateString("vi-VN")}</b>
          </p>

          {/* Thẻ tổng hợp: 3 chỉ số chính (tổng doanh thu, số đơn, trung bình/đơn) */}
          <div className="luoi-the">
            {/* Thẻ tổng doanh thu trong khoảng */}
            <div className="the-thong-ke mau-1">
              <div className="icon-box">💰</div>
              <div><div className="nhan">Tổng doanh thu</div><div className="so">{dinhDangTien(d.tong_doanh_thu)}</div></div>
            </div>
            {/* Thẻ tổng số đơn hàng */}
            <div className="the-thong-ke mau-3">
              <div className="icon-box">🧾</div>
              <div><div className="nhan">Số đơn hàng</div><div className="so">{d.so_don}</div></div>
            </div>
            {/* Thẻ doanh thu trung bình trên mỗi đơn */}
            <div className="the-thong-ke mau-2">
              <div className="icon-box">📈</div>
              <div><div className="nhan">Trung bình / đơn</div><div className="so">{dinhDangTien(d.trung_binh)}</div></div>
            </div>
          </div>

          <div className="luoi-2-cot" style={{ marginBottom: 16 }}>
            {/* Doanh thu theo ngày */}
            <div className="khoi">
              <h3>Doanh thu theo ngày</h3>
              <div className="khoi-bang">
                <table className="bang">
                  <thead><tr><th>Ngày</th><th>Số đơn</th><th>Doanh thu</th></tr></thead>
                  <tbody>
                    {/* Mảng rỗng -> hiện 1 dòng "Không có dữ liệu", ngược lại render từng ngày */}
                    {d.theo_ngay.length === 0 ? (
                      <tr><td colSpan={3} className="trong">Không có dữ liệu</td></tr>
                    ) : d.theo_ngay.map((r) => (
                      <tr key={r.ngay}>
                        {/* Định dạng ngày theo locale Việt Nam (dd/mm/yyyy) */}
                        <td>{new Date(r.ngay).toLocaleDateString("vi-VN")}</td>
                        <td>{r.so_don}</td>
                        <td>{dinhDangTien(r.doanh_thu)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Doanh thu theo danh mục */}
            <div className="khoi">
              <h3>Doanh thu theo danh mục</h3>
              {/* Biểu đồ tròn trực quan hóa tỉ trọng doanh thu giữa các danh mục */}
              <BieuDoTron duLieu={d.theo_danh_muc} />
              <div className="khoi-bang" style={{ marginTop: 14 }}>
                <table className="bang">
                  <thead><tr><th>Danh mục</th><th>Doanh thu</th></tr></thead>
                  <tbody>
                    {/* Bảng chi tiết doanh thu theo từng danh mục */}
                    {d.theo_danh_muc.length === 0 ? (
                      <tr><td colSpan={2} className="trong">Không có dữ liệu</td></tr>
                    ) : d.theo_danh_muc.map((r, i) => (
                      <tr key={i}>
                        {/* Tên danh mục, mặc định "Khác" nếu sản phẩm không thuộc danh mục nào */}
                        <td>{r.ten_danh_muc || "Khác"}</td>
                        <td>{dinhDangTien(r.doanh_thu)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Doanh thu theo sản phẩm */}
          <div className="khoi">
            <h3>Top sản phẩm theo doanh thu</h3>
            <div className="khoi-bang">
              <table className="bang">
                <thead><tr><th>#</th><th>Sản phẩm</th><th>Thương hiệu</th><th>SL bán</th><th>Doanh thu</th></tr></thead>
                <tbody>
                  {/* Bảng xếp hạng sản phẩm theo doanh thu (đã sắp xếp sẵn từ backend) */}
                  {d.theo_san_pham.length === 0 ? (
                    <tr><td colSpan={5} className="trong">Không có dữ liệu</td></tr>
                  ) : d.theo_san_pham.map((r, i) => (
                    <tr key={i}>
                      {/* Số thứ tự hạng (i + 1 vì index bắt đầu từ 0) */}
                      <td><b>{i + 1}</b></td>
                      <td>{r.ten_san_pham}</td>
                      {/* Hiển thị dấu "—" nếu sản phẩm không có thương hiệu */}
                      <td>{r.thuong_hieu || "—"}</td>
                      <td>{r.so_luong}</td>
                      <td>{dinhDangTien(r.doanh_thu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
