// =============================================================================
// TRANG CỬA HÀNG: lọc theo danh mục + tìm kiếm + phân trang
// =============================================================================
// Các hook của React để quản lý vòng đời và trạng thái component
import { useEffect, useState } from "react";
// useSearchParams: đọc/ghi tham số trên URL (?tu_khoa=...&danh_muc_id=...); Link: điều hướng nội bộ
import { useSearchParams, Link } from "react-router-dom";
// Đối tượng axios đã cấu hình sẵn để gọi API backend
import ketNoiApi from "../goi-api/ket-noi-api";
// Component hiển thị thẻ thông tin 1 sản phẩm
import TheSanPham from "../thanh-phan/the-san-pham";

// Số sản phẩm hiển thị trên mỗi trang (dùng để phân trang)
const MOI_TRANG = 12;

// Component trang Cửa hàng: cho phép lọc theo danh mục, tìm kiếm và phân trang sản phẩm
export default function CuaHang() {
  // params: tham số hiện tại trên URL; setParams: hàm cập nhật lại URL
  const [params, setParams] = useSearchParams();
  // Lấy từ khóa tìm kiếm từ URL (mặc định rỗng nếu không có)
  const tuKhoa = params.get("tu_khoa") || "";
  // Lấy id danh mục đang lọc từ URL (mặc định rỗng nếu không có)
  const danhMucId = params.get("danh_muc_id") || "";

  // Danh sách danh mục dùng cho bộ lọc bên trái
  const [danhMuc, setDanhMuc] = useState([]);
  // Danh sách sản phẩm trả về theo bộ lọc hiện tại
  const [sanPham, setSanPham] = useState([]);
  // Trang đang xem trong phần phân trang (bắt đầu từ 1)
  const [trang, setTrang] = useState(1);

  // Tải danh sách danh mục 1 lần khi component được gắn vào (mảng phụ thuộc rỗng)
  useEffect(() => {
    ketNoiApi.get("/cua-hang/danh-muc").then((res) => setDanhMuc(res.data.du_lieu));
  }, []);

  // Tải lại sản phẩm mỗi khi từ khóa hoặc danh mục lọc thay đổi
  useEffect(() => {
    // Gom các tham số lọc vào object p để gửi lên API
    const p = {};
    // Chỉ thêm tham số khi có giá trị, tránh gửi tham số rỗng lên server
    if (tuKhoa) p.tu_khoa = tuKhoa;
    if (danhMucId) p.danh_muc_id = danhMucId;
    ketNoiApi.get("/cua-hang/san-pham", { params: p }).then((res) => setSanPham(res.data.du_lieu));
    // Khi đổi bộ lọc thì quay về trang 1
    setTrang(1);
  }, [tuKhoa, danhMucId]);

  // Đổi bộ lọc danh mục: cập nhật lại URL, giữ nguyên từ khóa nếu đang tìm kiếm
  const chonDanhMuc = (id) => {
    const moi = {};
    if (tuKhoa) moi.tu_khoa = tuKhoa;
    // id rỗng nghĩa là chọn "Tất cả sản phẩm" (không lọc theo danh mục)
    if (id) moi.danh_muc_id = id;
    // Ghi tham số mới lên URL -> kích hoạt useEffect tải lại sản phẩm
    setParams(moi);
  };

  // Tổng số trang = số sản phẩm chia cho số mỗi trang, làm tròn lên, tối thiểu là 1
  const tongTrang = Math.max(1, Math.ceil(sanPham.length / MOI_TRANG));
  // Trang hiện tại đã được giới hạn không vượt quá tổng số trang
  const trangHt = Math.min(trang, tongTrang);
  // Cắt lấy đúng đoạn sản phẩm thuộc trang hiện tại để hiển thị
  const hienThi = sanPham.slice((trangHt - 1) * MOI_TRANG, trangHt * MOI_TRANG);

  return (
    <div className="trang">
      {/* Breadcrumb: đường dẫn điều hướng về trang chủ */}
      <div className="duong-dan">
        <Link to="/">Trang chủ</Link> / Cửa hàng
      </div>

      {/* Bố cục 2 cột: bộ lọc bên trái + lưới sản phẩm bên phải */}
      <div className="cua-hang-luoi">
        {/* Bộ lọc danh mục */}
        <aside className="loc-danh-muc">
          <h3>Danh mục</h3>
          {/* Nút "Tất cả sản phẩm": active khi không lọc theo danh mục nào */}
          <button className={"loc-muc" + (!danhMucId ? " active" : "")} onClick={() => chonDanhMuc("")}>
            Tất cả sản phẩm
          </button>
          {/* Lặp tạo nút cho từng danh mục; so sánh dạng chuỗi để gắn class active cho mục đang chọn */}
          {danhMuc.map((d) => (
            <button
              key={d.id}
              className={"loc-muc" + (String(danhMucId) === String(d.id) ? " active" : "")}
              onClick={() => chonDanhMuc(d.id)}
            >
              {d.ten_danh_muc}
            </button>
          ))}
        </aside>

        {/* Lưới sản phẩm */}
        <div>
          {/* Tiêu đề: hiển thị từ khóa tìm kiếm (nếu có) kèm tổng số sản phẩm tìm được */}
          <div className="cua-hang-dau">
            <h2>
              {tuKhoa ? `Kết quả cho "${tuKhoa}"` : "Tất cả sản phẩm"}
              <span className="so-kq"> ({sanPham.length} sản phẩm)</span>
            </h2>
          </div>

          {/* Nếu trang hiện tại không có sản phẩm thì báo trống, ngược lại render lưới các thẻ sản phẩm */}
          {hienThi.length === 0 ? (
            <p className="trong">Không tìm thấy sản phẩm nào.</p>
          ) : (
            <div className="luoi-sp">
              {hienThi.map((sp) => (
                <TheSanPham key={sp.id} sp={sp} />
              ))}
            </div>
          )}

          {/* Thanh phân trang: chỉ hiện khi có nhiều hơn 1 trang */}
          {tongTrang > 1 && (
            <div className="phan-trang">
              {/* Nút lùi 1 trang, vô hiệu hóa khi đang ở trang đầu */}
              <button className="nut-trang" disabled={trangHt <= 1} onClick={() => setTrang(trangHt - 1)}>‹ Trước</button>
              <span>Trang {trangHt}/{tongTrang}</span>
              {/* Nút tiến 1 trang, vô hiệu hóa khi đang ở trang cuối */}
              <button className="nut-trang" disabled={trangHt >= tongTrang} onClick={() => setTrang(trangHt + 1)}>Sau ›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
