// =============================================================================
// TRANG CHỦ - bố cục theo các web bán dụng cụ thể thao nổi tiếng ở Việt Nam:
// Menu danh mục dọc + banner + ô khuyến mãi | Flash Sale | Danh mục | Sản phẩm | Thương hiệu
// =============================================================================
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ketNoiApi from "../goi-api/ket-noi-api";
import TheSanPham from "../thanh-phan/the-san-pham";
import { anhDuPhong } from "../tien-ich/dinh-dang";

// Danh sách 12 danh mục thể thao cố định, dùng để render menu dọc + lưới danh mục.
// id phải khớp với danh_muc_id trong CSDL để lọc/điều hướng sang trang cửa hàng.
const DANH_MUC = [
  { id: 3, ten: "Cầu lông" }, { id: 11, ten: "Pickleball" }, { id: 12, ten: "Bóng bàn" },
  { id: 1, ten: "Bóng đá" }, { id: 2, ten: "Bóng rổ" }, { id: 4, ten: "Tennis" },
  { id: 5, ten: "Bóng chuyền" }, { id: 6, ten: "Gym & Thể hình" }, { id: 7, ten: "Bơi lội" },
  { id: 8, ten: "Chạy bộ" }, { id: 9, ten: "Quần áo thể thao" }, { id: 10, ten: "Phụ kiện" },
];

// Danh sách thương hiệu nổi bật, chỉ hiển thị dạng tên (logo chữ) ở cuối trang.
const THUONG_HIEU = ["Nike", "adidas", "YONEX", "VICTOR", "Li-Ning", "Wilson", "Babolat", "Mizuno", "JOOLA", "Molten", "Mikasa", "Speedo"];

// 4 cam kết dịch vụ kèm icon SVG (chính hãng, giao hàng, đổi trả, COD) hiển thị dưới banner.
const camKet = [
  { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>, t: "Cam kết chính hãng 100%" },
  { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>, t: "Giao hàng toàn quốc" },
  { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>, t: "Đổi trả trong 7 ngày" },
  { svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>, t: "Thanh toán khi nhận (COD)" },
];

// Component trang chủ: tải danh sách sản phẩm 1 lần, chia thành nhiều khu (flash sale,
// nổi bật, theo danh mục) và chạy đồng hồ đếm ngược cho flash sale.
export default function TrangChu() {
  // sanPham: toàn bộ sản phẩm lấy từ API; dem: chuỗi thời gian đếm ngược "HH:MM:SS".
  const [sanPham, setSanPham] = useState([]);
  const [dem, setDem] = useState("");

  // Gọi API lấy danh sách sản phẩm khi component được mount (chỉ chạy 1 lần).
  useEffect(() => {
    ketNoiApi.get("/cua-hang/san-pham").then((res) => setSanPham(res.data.du_lieu));
  }, []);

  // Đồng hồ đếm ngược Flash Sale đến cuối ngày
  useEffect(() => {
    // Mỗi giây tính lại số giây còn lại từ hiện tại đến 23:59:59 cuối ngày.
    const t = setInterval(() => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999); // mốc kết thúc flash sale = cuối ngày hôm nay
      let s = Math.max(0, Math.floor((end - now) / 1000)); // tổng số giây còn lại (không âm)
      const h = String(Math.floor(s / 3600)).padStart(2, "0"); // số giờ, đệm 2 chữ số
      s %= 3600; // bỏ phần giờ, giữ lại số giây trong giờ hiện tại
      const m = String(Math.floor(s / 60)).padStart(2, "0"); // số phút, đệm 2 chữ số
      setDem(`${h}:${m}:${String(s % 60).padStart(2, "0")}`); // ghép HH:MM:SS
    }, 1000);
    return () => clearInterval(t); // dọn dẹp interval khi component unmount
  }, []);

  // Map ảnh đại diện cho từng danh mục: lấy hình của sản phẩm ĐẦU TIÊN có hình trong danh mục đó.
  const anhTheoDM = {};
  sanPham.forEach((p) => { if (!anhTheoDM[p.danh_muc_id] && p.hinh_anh) anhTheoDM[p.danh_muc_id] = p.hinh_anh; });

  // Chia danh sách sản phẩm thành các khu hiển thị khác nhau trên trang chủ.
  const flashSale = sanPham.slice(0, 5); // 5 sản phẩm đầu cho khu Flash Sale
  const noiBat = sanPham.slice(5, 15); // 10 sản phẩm tiếp theo cho khu Nổi bật
  const pickleball = sanPham.filter((s) => s.danh_muc_id === 11).slice(0, 5); // tối đa 5 SP Pickleball
  const cauLong = sanPham.filter((s) => s.danh_muc_id === 3).slice(0, 5); // tối đa 5 SP Cầu lông

  return (
    <div>
      {/* ===== KHU HERO: menu dọc + banner + khuyến mãi ===== */}
      <div className="tc-hero">
        {/* Menu danh mục dọc */}
        <aside className="menu-doc">
          {DANH_MUC.map((d) => (
            <Link key={d.id} to={`/cua-hang?danh_muc_id=${d.id}`}>
              {d.ten}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </Link>
          ))}
        </aside>

        {/* Banner chính */}
        <div className="hero-main">
          <span className="hm-tag">★ Hệ thống thể thao chính hãng</span>
          <h1>Dụng cụ thể thao<br /><span>chính hãng — giá tốt</span></h1>
          <p>Nike · adidas · Yonex · Victor · Wilson · Joola... Giao nhanh toàn quốc, đổi trả 7 ngày.</p>
          <div className="hm-nut">
            <Link to="/cua-hang" className="nut-banner">Mua sắm ngay</Link>
            <Link to="/cua-hang?danh_muc_id=11" className="nut-vien-sang">Pickleball mới về →</Link>
          </div>
          <div className="hm-deco"></div>
        </div>

        {/* 2 ô khuyến mãi */}
        <div className="hero-promos">
          <Link to="/cua-hang?danh_muc_id=11" className="promo-card pc-cam">
            <small>HÀNG MỚI VỀ</small>
            <b>Pickleball</b>
            <span>Mua ngay →</span>
          </Link>
          <Link to="/cua-hang?danh_muc_id=6" className="promo-card pc-xanh">
            <small>GIẢM ĐẾN 30%</small>
            <b>Gym & Tạ</b>
            <span>Khám phá →</span>
          </Link>
        </div>
      </div>

      <div className="trang">
        {/* Cam kết */}
        <section className="cam-ket">
          {camKet.map((c, i) => (
            <div className="ck-o" key={i}><span className="ck-ic">{c.svg}</span><span className="ck-t">{c.t}</span></div>
          ))}
        </section>

        {/* Flash Sale: chỉ hiển thị khi có sản phẩm, kèm đồng hồ đếm ngược {dem} */}
        {flashSale.length > 0 && (
          <section className="flash-sale">
            <div className="fs-dau">
              <h2>⚡ FLASH SALE HÔM NAY</h2>
              <div className="fs-dem">Kết thúc sau <b>{dem}</b></div>
              <Link to="/cua-hang" className="fs-xem">Xem tất cả →</Link>
            </div>
            <div className="luoi-sp">{flashSale.map((sp) => <TheSanPham key={sp.id} sp={sp} />)}</div>
          </section>
        )}

        {/* Danh mục */}
        <section className="khu-sp">
          <div className="khu-sp-dau"><h2>Danh mục sản phẩm</h2></div>
          <div className="luoi-danh-muc">
            {DANH_MUC.map((d) => (
              <Link key={d.id} to={`/cua-hang?danh_muc_id=${d.id}`} className="o-danh-muc">
                {/* Ảnh danh mục: ưu tiên ảnh map theo danh mục, không có thì dùng ảnh dự phòng; onError fallback khi tải lỗi */}
                <div className="dm-anh"><img src={anhTheoDM[d.id] || anhDuPhong} alt={d.ten} onError={(e) => (e.target.src = anhDuPhong)} /></div>
                <span>{d.ten}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Sản phẩm nổi bật */}
        <section className="khu-sp">
          <div className="khu-sp-dau"><h2>Sản phẩm nổi bật</h2><Link to="/cua-hang">Xem tất cả →</Link></div>
          <div className="luoi-sp">{noiBat.map((sp) => <TheSanPham key={sp.id} sp={sp} />)}</div>
        </section>

        {/* Pickleball */}
        {pickleball.length > 0 && (
          <section className="khu-sp">
            <div className="khu-sp-dau"><h2>Pickleball đang hot</h2><Link to="/cua-hang?danh_muc_id=11">Xem tất cả →</Link></div>
            <div className="luoi-sp">{pickleball.map((sp) => <TheSanPham key={sp.id} sp={sp} />)}</div>
          </section>
        )}

        {/* Cầu lông */}
        {cauLong.length > 0 && (
          <section className="khu-sp">
            <div className="khu-sp-dau"><h2>Cầu lông bán chạy</h2><Link to="/cua-hang?danh_muc_id=3">Xem tất cả →</Link></div>
            <div className="luoi-sp">{cauLong.map((sp) => <TheSanPham key={sp.id} sp={sp} />)}</div>
          </section>
        )}

        {/* Thương hiệu nổi bật */}
        <section className="khu-sp">
          <div className="khu-sp-dau"><h2>Thương hiệu nổi bật</h2></div>
          <div className="brand-strip">
            {THUONG_HIEU.map((b) => <div className="brand-o" key={b}>{b}</div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
