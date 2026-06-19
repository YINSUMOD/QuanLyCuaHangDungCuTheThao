// Trang ĐƠN HÀNG CỦA TÔI - xem trạng thái & yêu cầu hủy đơn (khi chưa giao)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ketNoiApi from "../goi-api/ket-noi-api";
import { dinhDangTien, anhDuPhong } from "../tien-ich/dinh-dang";

// Bảng ánh xạ mã trạng thái đơn -> [nhãn hiển thị tiếng Việt, lớp CSS tô màu badge]
const TT = {
  cho_xu_ly: ["Chờ xử lý", "tt-cho"],
  da_xac_nhan: ["Đã xác nhận", "tt-xacnhan"],
  dang_giao: ["Đang giao", "tt-giao"],
  hoan_thanh: ["Hoàn thành", "tt-xong"],
  yeu_cau_huy: ["Đang chờ duyệt hủy", "tt-cho"],
  da_huy: ["Đã hủy", "tt-huy"],
};

// Component trang hiển thị danh sách đơn hàng của khách đang đăng nhập
export default function DonHangCuaToi() {
  // dons: danh sách đơn (null = chưa tải xong, [] = đã tải nhưng rỗng); loi: thông báo lỗi
  const [dons, setDons] = useState(null);
  const [loi, setLoi] = useState("");

  // Gọi API lấy danh sách đơn hàng của tôi từ backend
  const tai = async () => {
    try {
      setLoi(""); // xóa lỗi cũ trước khi tải lại
      const res = await ketNoiApi.get("/cua-hang/don-hang-cua-toi");
      setDons(res.data.du_lieu); // lưu mảng đơn lấy từ trường du_lieu của phản hồi
    } catch (err) {
      setDons([]); // thoát khỏi trạng thái "Đang tải..." dù lỗi
      setLoi(err.response?.data?.thong_bao || "Không tải được danh sách đơn hàng. Vui lòng thử lại.");
    }
  };
  // Tải danh sách đơn 1 lần khi component được mount
  useEffect(() => {
    tai();
  }, []);

  // Khách yêu cầu hủy đơn
  const yeuCauHuy = async (id) => {
    // Hỏi xác nhận; nếu khách bấm Hủy thì dừng, không gửi yêu cầu
    if (!window.confirm("Gửi yêu cầu hủy đơn hàng này? Cửa hàng sẽ duyệt.")) return;
    try {
      // Gọi API gửi yêu cầu hủy đơn theo id (trạng thái chuyển sang chờ duyệt hủy)
      await ketNoiApi.put(`/cua-hang/don-hang/${id}/huy`);
      tai(); // tải lại danh sách để cập nhật trạng thái mới
    } catch (err) {
      alert(err.response?.data?.thong_bao || "Không thể hủy đơn");
    }
  };

  // Khi chưa tải xong (dons còn null) thì hiển thị trạng thái đang tải
  if (!dons) return <div className="trang"><p>Đang tải...</p></div>;

  return (
    <div className="trang">
      <h1 className="tieu-de">Đơn hàng của tôi</h1>
      {/* Khối báo lỗi kèm nút "Thử lại" để gọi lại hàm tai() */}
      {loi && (
        <div className="bao-loi" style={{ marginBottom: 16 }}>
          {loi} <button className="nut-huy-don" onClick={tai} style={{ marginLeft: 8 }}>Thử lại</button>
        </div>
      )}
      {/* Nếu không có đơn và không có lỗi -> hiển thị trạng thái rỗng kèm nút mua sắm */}
      {dons.length === 0 && !loi ? (
        <div className="gio-trong">
          <p>Bạn chưa có đơn hàng nào.</p>
          <Link to="/cua-hang" className="nut-banner">Mua sắm ngay</Link>
        </div>
      ) : (
        // Duyệt qua từng đơn hàng để vẽ một thẻ đơn
        dons.map((d) => {
          // Lấy nhãn + lớp CSS của trạng thái; nếu không khớp thì dùng mã gốc, không tô màu
          const tt = TT[d.trang_thai] || [d.trang_thai, ""];
          // Chỉ cho phép yêu cầu hủy khi đơn còn ở giai đoạn chờ xử lý hoặc đã xác nhận (chưa giao)
          const coTheHuy = ["cho_xu_ly", "da_xac_nhan"].includes(d.trang_thai);
          return (
            <div className="don-the" key={d.id}>
              {/* Phần đầu thẻ: mã đơn, ngày tạo (định dạng giờ Việt Nam) và badge trạng thái */}
              <div className="don-dau">
                <div>Mã đơn: <b>{d.ma_don}</b> · {new Date(d.ngay_tao).toLocaleString("vi-VN")}</div>
                <span className={"don-tt " + tt[1]}>{tt[0]}</span>
              </div>
              {/* Danh sách các sản phẩm trong đơn */}
              <div className="don-sp">
                {/* Duyệt từng dòng chi tiết đơn: hình, tên x số lượng, thành tiền */}
                {d.chi_tiet.map((ct) => (
                  <div className="don-dong" key={ct.id}>
                    {/* Dùng ảnh dự phòng khi thiếu hình hoặc ảnh lỗi (sự kiện onError) */}
                    <img src={ct.hinh_anh || anhDuPhong} alt="" onError={(e) => (e.target.src = anhDuPhong)} />
                    <span className="don-ten">{ct.ten_san_pham || "(Sản phẩm)"} × {ct.so_luong}</span>
                    <span>{dinhDangTien(ct.thanh_tien)}</span>
                  </div>
                ))}
              </div>
              {/* Phần chân thẻ: tổng tiền đơn và nút yêu cầu hủy (nếu được phép) */}
              <div className="don-chan">
                <div>Tổng tiền: <b className="don-gia-tong">{dinhDangTien(d.thanh_tien)}</b></div>
                {/* Chỉ hiện nút hủy khi coTheHuy = true (đơn chưa giao) */}
                {coTheHuy && (
                  <button className="nut-huy-don" onClick={() => yeuCauHuy(d.id)}>Yêu cầu hủy đơn</button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
