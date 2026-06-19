// Chân trang (footer) đầy đủ theo phong cách web TMĐT Việt Nam
// Component hiển thị ở cuối mọi trang: thông tin cửa hàng, các nhóm liên kết
// (về cửa hàng, chính sách, hỗ trợ), kết nối mạng xã hội và bản quyền.
import { Link } from "react-router-dom"; // Link điều hướng nội bộ (không reload trang) của React Router

// Component ChanTrang: render toàn bộ phần chân trang, không nhận props
export default function ChanTrang() {
  return (
    // Thẻ <footer> bao toàn bộ chân trang
    <footer className="chan-trang">
      {/* Vùng nội dung chính của chân trang, chia thành nhiều cột */}
      <div className="chan-trang-trong">
        {/* Cột giới thiệu: logo, mô tả ngành hàng và thông tin liên hệ cửa hàng */}
        <div className="ct-cot ct-gioithieu">
          <div className="ct-logo"><span className="logo-badge">TVU</span> Store</div>
          <p>Hệ thống bán dụng cụ thể thao chính hãng: bóng đá, cầu lông, pickleball, tennis, gym, bơi lội...</p>
          <p>📍 Đại học Trà Vinh, TP. Trà Vinh</p>
          <p>☎ Hotline: <b>1900 1234</b></p>
          <p>✉ hotro@tvustore.vn</p>
        </div>

        {/* Cột "Về TVU Store": nhóm liên kết giới thiệu, sản phẩm, tin tức, tuyển dụng */}
        <div className="ct-cot">
          <h4>Về TVU Store</h4>
          <Link to="/">Giới thiệu</Link>
          <Link to="/cua-hang">Sản phẩm</Link>
          <Link to="/">Tin tức thể thao</Link>
          <Link to="/">Tuyển dụng</Link>
        </div>

        {/* Cột "Chính sách": liên kết tới các trang chính sách đổi trả, bảo hành, vận chuyển, bảo mật */}
        <div className="ct-cot">
          <h4>Chính sách</h4>
          <Link to="/">Chính sách đổi trả</Link>
          <Link to="/">Chính sách bảo hành</Link>
          <Link to="/">Chính sách vận chuyển</Link>
          <Link to="/">Bảo mật thông tin</Link>
        </div>

        {/* Cột "Hỗ trợ khách hàng": hướng dẫn mua hàng, thanh toán, tra cứu đơn, FAQ */}
        <div className="ct-cot">
          <h4>Hỗ trợ khách hàng</h4>
          <Link to="/">Hướng dẫn mua hàng</Link>
          <Link to="/">Hướng dẫn thanh toán</Link>
          <Link to="/don-hang-cua-toi">Tra cứu đơn hàng</Link>
          <Link to="/">Câu hỏi thường gặp</Link>
        </div>

        {/* Cột "Kết nối": mạng xã hội, các phương thức thanh toán hỗ trợ và dấu chứng nhận Bộ Công Thương */}
        <div className="ct-cot">
          <h4>Kết nối với chúng tôi</h4>
          {/* Danh sách các kênh mạng xã hội của cửa hàng */}
          <div className="ct-social">
            <span>Facebook</span><span>Zalo</span><span>YouTube</span><span>TikTok</span>
          </div>
          {/* style inline marginTop: tạo khoảng cách phía trên cho tiêu đề phần thanh toán */}
          <h4 style={{ marginTop: 16 }}>Phương thức thanh toán</h4>
          {/* Các hình thức thanh toán được chấp nhận */}
          <div className="ct-pay">
            <span>COD</span><span>VISA</span><span>Mastercard</span><span>MoMo</span><span>VNPay</span>
          </div>
          {/* Nhãn xác nhận website đã đăng ký/thông báo với Bộ Công Thương */}
          <div className="ct-bct">✓ Đã thông báo Bộ Công Thương</div>
        </div>
      </div>

      {/* Thanh dưới cùng: dòng bản quyền và thông tin đồ án */}
      <div className="chan-trang-duoi">
        © 2026 TVU Store · Đồ án Hệ thống quản lý cửa hàng dụng cụ thể thao — Đại học Trà Vinh
        {" · "}
        {/* Dùng thẻ <a> (không phải Link) vì /quan-ly nằm NGOÀI SPA bán hàng -> cần điều hướng tải lại trang */}
        <a href="/quan-ly/" style={{ color: "inherit", textDecoration: "underline" }}>Trang quản trị</a>
      </div>
    </footer>
  );
}
