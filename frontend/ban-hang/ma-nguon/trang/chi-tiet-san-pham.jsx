// =============================================================================
// TRANG CHI TIẾT SẢN PHẨM
// -----------------------------------------------------------------------------
// Component hiển thị thông tin chi tiết của 1 sản phẩm theo id trên URL:
// tải dữ liệu sản phẩm từ API, cho chọn số lượng, thêm vào giỏ hoặc mua ngay.
// =============================================================================
// Hook quản lý vòng đời (useEffect) và trạng thái cục bộ (useState)
import { useEffect, useState } from "react";
// Hook lấy tham số URL (useParams), điều hướng (useNavigate) và liên kết (Link)
import { useParams, useNavigate, Link } from "react-router-dom";
// Đối tượng gọi API (axios đã cấu hình sẵn baseURL)
import ketNoiApi from "../goi-api/ket-noi-api";
// Hook truy cập ngữ cảnh giỏ hàng (Context) để thêm sản phẩm
import { dungGioHang } from "../ngu-canh/gio-hang";
// Tiện ích: định dạng tiền tệ (VND) và ảnh dự phòng khi không có hình
import { dinhDangTien, anhDuPhong } from "../tien-ich/dinh-dang";

// Component trang chi tiết sản phẩm (route dạng /cua-hang/san-pham/:id)
export default function ChiTietSanPham() {
  // Lấy id sản phẩm từ đường dẫn URL
  const { id } = useParams();
  // Hàm điều hướng sang trang khác (dùng cho nút "Mua ngay")
  const navigate = useNavigate();
  // Lấy hàm "them" từ ngữ cảnh giỏ hàng để thêm sản phẩm vào giỏ
  const { them } = dungGioHang();
  // Trạng thái sản phẩm: null = đang tải, false = không tìm thấy, object = đã có dữ liệu
  const [sp, setSp] = useState(null);
  // Số lượng người dùng chọn mua (mặc định 1)
  const [soLuong, setSoLuong] = useState(1);

  // Mỗi khi id thay đổi: gọi API lấy chi tiết sản phẩm và đặt lại số lượng về 1
  useEffect(() => {
    // Gọi API; thành công thì lưu dữ liệu, lỗi (vd không tìm thấy) thì gán false
    ketNoiApi.get(`/cua-hang/san-pham/${id}`).then((res) => setSp(res.data.du_lieu)).catch(() => setSp(false));
    // Đặt lại số lượng về 1 khi chuyển sang sản phẩm khác
    setSoLuong(1);
  }, [id]);

  // Trong lúc đang tải dữ liệu (chưa có phản hồi API)
  if (sp === null) return <div className="trang"><p>Đang tải...</p></div>;
  // Khi API báo lỗi / không có sản phẩm
  if (sp === false) return <div className="trang"><p>Không tìm thấy sản phẩm.</p></div>;

  // Cờ kiểm tra sản phẩm đã hết hàng (tồn kho <= 0)
  const hetHang = sp.so_luong_ton <= 0;

  // Xử lý nút "Mua ngay": thêm vào giỏ rồi chuyển thẳng sang trang giỏ hàng
  const muaNgay = () => {
    them(sp, soLuong);
    navigate("/gio-hang");
  };

  // Giao diện chi tiết sản phẩm
  return (
    <div className="trang">
      {/* Breadcrumb: đường dẫn điều hướng Trang chủ / Cửa hàng / Tên sản phẩm */}
      <div className="duong-dan">
        <Link to="/">Trang chủ</Link> / <Link to="/cua-hang">Cửa hàng</Link> / {sp.ten_san_pham}
      </div>

      {/* Khối nội dung chính: ảnh sản phẩm và thông tin */}
      <div className="ct-sp">
        {/* Cột ảnh sản phẩm */}
        <div className="ct-sp-anh">
          {/* Dùng ảnh dự phòng nếu thiếu hình hoặc ảnh lỗi (onError) */}
          <img src={sp.hinh_anh || anhDuPhong} alt={sp.ten_san_pham} onError={(e) => (e.target.src = anhDuPhong)} />
        </div>

        {/* Cột thông tin sản phẩm */}
        <div className="ct-sp-thongtin">
          {/* Chỉ hiển thị thương hiệu khi sản phẩm có dữ liệu thương hiệu */}
          {sp.thuong_hieu && <div className="ct-hieu">Thương hiệu: <b>{sp.thuong_hieu}</b></div>}
          {/* Tên sản phẩm */}
          <h1>{sp.ten_san_pham}</h1>
          {/* Giá bán đã được định dạng theo tiền tệ VND */}
          <div className="ct-gia">{dinhDangTien(sp.gia_ban)}</div>

          {/* Thông tin phụ: danh mục và tình trạng còn/hết hàng */}
          <div className="ct-meta">
            {/* Danh mục, hiển thị "—" nếu chưa có */}
            <div>Danh mục: <b>{sp.ten_danh_muc || "—"}</b></div>
            {/* Tình trạng tồn kho: hết hàng hoặc còn hàng kèm số lượng + đơn vị */}
            <div>Tình trạng: {hetHang ? <span className="het">Hết hàng</span> : <span className="con">Còn hàng ({sp.so_luong_ton} {sp.don_vi})</span>}</div>
          </div>

          {/* Mô tả sản phẩm (chỉ hiển thị khi có mô tả) */}
          {sp.mo_ta && <p className="ct-mota">{sp.mo_ta}</p>}

          {/* Bộ chọn số lượng: chỉ hiện khi sản phẩm còn hàng */}
          {!hetHang && (
            <div className="ct-soluong">
              <span>Số lượng:</span>
              {/* Nút giảm: không cho xuống dưới 1 */}
              <button onClick={() => setSoLuong((s) => Math.max(1, s - 1))}>−</button>
              {/* Ô nhập số lượng: kẹp giá trị trong khoảng [1, số lượng tồn] */}
              <input
                type="number" min="1" max={sp.so_luong_ton} value={soLuong}
                onChange={(e) => setSoLuong(Math.max(1, Math.min(Number(e.target.value) || 1, sp.so_luong_ton)))}
              />
              {/* Nút tăng: không vượt quá số lượng tồn kho */}
              <button onClick={() => setSoLuong((s) => Math.min(sp.so_luong_ton, s + 1))}>+</button>
            </div>
          )}

          {/* Nhóm nút hành động: thêm vào giỏ và mua ngay */}
          <div className="ct-nut">
            {/* Nút thêm vào giỏ: vô hiệu hóa khi hết hàng */}
            <button className="nut-them-gio lon" disabled={hetHang} onClick={() => them(sp, soLuong)}>
              🛒 Thêm vào giỏ
            </button>
            {/* Nút mua ngay: thêm vào giỏ rồi chuyển sang trang giỏ hàng */}
            <button className="nut-mua-ngay" disabled={hetHang} onClick={muaNgay}>
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
