// =============================================================================
// Thành phần dùng chung cho các trang quản lý dạng CRUD (Thêm / Sửa / Xóa / Xem)
// Nhờ thành phần này mà các trang Danh mục, Nhà cung cấp, Khách hàng, Sản phẩm,
// Tài khoản... dùng chung một logic, tránh lặp code.
//
// Tham số:
//  - tieuDe   : tiêu đề trang
//  - endpoint : đường dẫn API (vd: "/danh-muc")
//  - cot      : mô tả các cột bảng [{ key, nhan, render? }]
//  - truong   : mô tả các ô nhập trong form [{ name, nhan, loai, ... }]
//  - coTimKiem: có hiển thị ô tìm kiếm hay không
//  - moiTrang  : số dòng hiển thị trên mỗi trang (mặc định 10)
// =============================================================================
// useEffect: chạy hiệu ứng phụ; useState: quản lý trạng thái nội bộ component
import { useEffect, useState } from "react";
// ketNoiApi: đối tượng axios đã cấu hình sẵn để gọi API backend
import ketNoiApi from "../goi-api/ket-noi-api";
// HopThoai: component hộp thoại (modal) dùng để bọc form thêm/sửa
import HopThoai from "./hop-thoai";
// OMatKhau: ô nhập mật khẩu có nút ẩn/hiện (icon con mắt)
import OMatKhau from "./o-mat-khau";

// Component chính: nhận cấu hình qua props và dựng lên trang quản lý CRUD hoàn chỉnh
export default function TrangQuanLy({ tieuDe, endpoint, cot, truong, coTimKiem = true, moiTrang = 10 }) {
  // danhSach: toàn bộ dữ liệu lấy về từ API
  const [danhSach, setDanhSach] = useState([]);
  // tuKhoa: từ khóa người dùng nhập ở ô tìm kiếm
  const [tuKhoa, setTuKhoa] = useState("");
  const [trang, setTrang] = useState(1); // trang hiện tại của phân trang
  // moModal: cờ bật/tắt hiển thị hộp thoại form thêm/sửa
  const [moModal, setMoModal] = useState(false);
  // duLieuForm: dữ liệu đang nhập trên form (key là tên trường)
  const [duLieuForm, setDuLieuForm] = useState({});
  // dangSuaId: id của dòng đang sửa; null nghĩa là đang thêm mới
  const [dangSuaId, setDangSuaId] = useState(null);
  const [optionsMap, setOptionsMap] = useState({}); // lựa chọn cho các ô select động
  // loi: thông báo lỗi hiển thị trên form khi lưu thất bại
  const [loi, setLoi] = useState("");
  const [dangTaiAnh, setDangTaiAnh] = useState(false); // trạng thái khi đang tải ảnh lên
  const [xacNhanMk, setXacNhanMk] = useState(""); // giá trị ô "Xác nhận mật khẩu"

  // Tải danh sách dữ liệu từ API
  const taiDanhSach = async () => {
    // Gọi GET tới endpoint; nếu có từ khóa thì truyền tham số tìm kiếm tu_khoa
    const res = await ketNoiApi.get(endpoint, {
      params: tuKhoa ? { tu_khoa: tuKhoa } : {},
    });
    setDanhSach(res.data.du_lieu);
    setTrang(1); // về trang đầu sau khi tải/tìm kiếm
  };

  // Tải dữ liệu cho các ô chọn (select) lấy từ API, ví dụ danh mục, nhà cung cấp
  const taiOptions = async () => {
    const map = {};
    // Duyệt từng trường trong cấu hình form
    for (const t of truong) {
      if (t.optionsEndpoint) {
        // Trường có nguồn lựa chọn động: gọi API rồi chuyển thành mảng {value, label}
        const res = await ketNoiApi.get(t.optionsEndpoint);
        map[t.name] = res.data.du_lieu.map((r) => ({ value: r.id, label: r[t.optionLabel] }));
      } else if (t.options) {
        // Trường có danh sách lựa chọn cố định khai báo sẵn
        map[t.name] = t.options;
      }
    }
    setOptionsMap(map);
  };

  // Chạy 1 lần khi component được mount: tải dữ liệu bảng và dữ liệu cho các ô chọn
  useEffect(() => {
    taiDanhSach();
    taiOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mở form thêm mới
  const moThem = () => {
    setDangSuaId(null);
    setDuLieuForm({});
    setXacNhanMk(""); // xóa ô xác nhận mật khẩu mỗi lần mở form
    setLoi("");
    taiOptions(); // làm mới danh sách chọn (danh mục/NCC) phòng khi vừa thêm ở nơi khác
    setMoModal(true);
  };

  // Mở form sửa (đổ dữ liệu dòng được chọn vào form)
  const moSua = (dong) => {
    setDangSuaId(dong.id);
    setDuLieuForm({ ...dong });
    setXacNhanMk(""); // xóa ô xác nhận mật khẩu mỗi lần mở form
    setLoi("");
    taiOptions(); // làm mới danh sách chọn (danh mục/NCC)
    setMoModal(true);
  };

  // Cập nhật giá trị khi gõ vào ô nhập
  const doiGiaTri = (name, value) => setDuLieuForm((cu) => ({ ...cu, [name]: value }));

  // Tải ảnh từ máy lên server, sau đó gán đường dẫn ảnh trả về vào ô tương ứng
  const taiAnhLen = async (e, name) => {
    // Lấy file đầu tiên người dùng chọn; nếu không chọn gì thì dừng
    const file = e.target.files?.[0];
    if (!file) return;
    setDangTaiAnh(true);
    try {
      // Đóng gói file vào FormData để gửi dạng multipart lên endpoint /upload
      const fd = new FormData();
      fd.append("anh", file);
      const res = await ketNoiApi.post("/upload", fd);
      // Gán URL ảnh server trả về vào trường tương ứng trên form
      doiGiaTri(name, res.data.du_lieu.url);
    } catch (err) {
      alert(err.response?.data?.thong_bao || "Tải ảnh thất bại");
    } finally {
      setDangTaiAnh(false);
    }
  };

  // Chuẩn hóa dữ liệu trước khi gửi: ô trống -> null, ô số -> kiểu số
  const chuanHoa = () => {
    const ketQua = {};
    // Duyệt từng trường theo cấu hình để lấy đúng giá trị và đúng kiểu dữ liệu
    for (const t of truong) {
      let v = duLieuForm[t.name];
      // Ô để trống hoặc chưa nhập -> gửi null thay vì chuỗi rỗng
      if (v === "" || v === undefined) v = null;
      // Trường kiểu số -> ép về kiểu Number để backend nhận đúng số
      else if (t.loai === "number" && v !== null) v = Number(v);
      ketQua[t.name] = v;
    }
    return ketQua;
  };

  // Lưu (thêm mới hoặc cập nhật)
  const luu = async (e) => {
    e.preventDefault(); // chặn hành vi reload trang mặc định của form
    setLoi("");
    // Nếu form có ô mật khẩu và người dùng có nhập -> bắt buộc khớp ô xác nhận
    const truongMk = truong.find((t) => t.loai === "password");
    if (truongMk) {
      const mk = duLieuForm[truongMk.name];
      if (mk && mk !== xacNhanMk) {
        setLoi("Mật khẩu xác nhận không khớp. Vui lòng nhập lại.");
        return;
      }
    }
    try {
      const duLieu = chuanHoa();
      // Có dangSuaId -> gọi PUT để cập nhật; ngược lại gọi POST để thêm mới
      if (dangSuaId) await ketNoiApi.put(`${endpoint}/${dangSuaId}`, duLieu);
      else await ketNoiApi.post(endpoint, duLieu);
      setMoModal(false); // đóng hộp thoại sau khi lưu thành công
      taiDanhSach(); // tải lại bảng để cập nhật dữ liệu mới
    } catch (err) {
      setLoi(err.response?.data?.thong_bao || "Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  // Xóa một dòng
  const xoa = async (id) => {
    // Hỏi xác nhận trước khi xóa; nếu người dùng hủy thì dừng
    if (!window.confirm("Bạn có chắc chắn muốn xóa mục này?")) return;
    try {
      await ketNoiApi.delete(`${endpoint}/${id}`); // gọi API xóa theo id
      taiDanhSach(); // tải lại bảng sau khi xóa
    } catch (err) {
      alert(err.response?.data?.thong_bao || "Không thể xóa mục này");
    }
  };

  // Phân trang phía client
  // Tổng số trang = số dòng / số dòng mỗi trang (làm tròn lên), tối thiểu là 1
  const tongTrang = Math.max(1, Math.ceil(danhSach.length / moiTrang));
  // Trang hiện tại không được vượt quá tổng số trang (phòng khi dữ liệu giảm)
  const trangHienTai = Math.min(trang, tongTrang);
  // Cắt ra đúng các dòng thuộc trang hiện tại để hiển thị
  const hienThi = danhSach.slice((trangHienTai - 1) * moiTrang, trangHienTai * moiTrang);

  return (
    <div>
      {/* Tiêu đề trang kèm nút mở form thêm mới */}
      <div className="tieu-de-trang">
        <h2>{tieuDe}</h2>
        <button className="nut nut-chinh" onClick={moThem}>
          + Thêm mới
        </button>
      </div>

      {/* Thanh tìm kiếm: chỉ hiển thị khi coTimKiem = true */}
      {coTimKiem && (
        <div className="thanh-tim-kiem">
          <input
            placeholder="Tìm kiếm..."
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && taiDanhSach()} // nhấn Enter để tìm
          />
          <button className="nut nut-phu" onClick={taiDanhSach}>
            Tìm
          </button>
        </div>
      )}

      {/* Bảng dữ liệu */}
      <div className="the-bang">
        <table className="bang">
          <thead>
            <tr>
              {/* Dựng tiêu đề cột từ cấu hình cot */}
              {cot.map((c) => (
                <th key={c.key}>{c.nhan}</th>
              ))}
              <th style={{ width: 150 }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {/* Nếu không có dữ liệu thì hiển thị 1 dòng "Không có dữ liệu" */}
            {danhSach.length === 0 ? (
              <tr>
                <td colSpan={cot.length + 1} className="trong">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              // Hiển thị các dòng của trang hiện tại
              hienThi.map((dong) => (
                <tr key={dong.id}>
                  {/* Mỗi ô: dùng hàm render tùy biến nếu có, không thì lấy giá trị theo key */}
                  {cot.map((c) => (
                    <td key={c.key}>{c.render ? c.render(dong) : dong[c.key]}</td>
                  ))}
                  <td>
                    <button className="nut nut-nho" onClick={() => moSua(dong)}>
                      Sửa
                    </button>{" "}
                    <button className="nut nut-nho nut-xoa" onClick={() => xoa(dong.id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {danhSach.length > 0 && (
        <div className="phan-trang">
          <span className="phan-trang-tt">
            Hiển thị {(trangHienTai - 1) * moiTrang + 1}–{Math.min(trangHienTai * moiTrang, danhSach.length)} / {danhSach.length} mục
          </span>
          <div className="phan-trang-nut">
            {/* Nút lùi trang: vô hiệu hóa khi đang ở trang đầu */}
            <button className="nut nut-phu" disabled={trangHienTai <= 1} onClick={() => setTrang(trangHienTai - 1)}>‹ Trước</button>
            <span className="phan-trang-so">Trang {trangHienTai}/{tongTrang}</span>
            {/* Nút sang trang sau: vô hiệu hóa khi đang ở trang cuối */}
            <button className="nut nut-phu" disabled={trangHienTai >= tongTrang} onClick={() => setTrang(trangHienTai + 1)}>Sau ›</button>
          </div>
        </div>
      )}

      {/* Hộp thoại form thêm/sửa */}
      {moModal && (
        <HopThoai
          tieuDe={(dangSuaId ? "Cập nhật " : "Thêm ") + tieuDe.toLowerCase()}
          dong={() => setMoModal(false)}
        >
          <form onSubmit={luu}>
            {/* Dựng từng ô nhập dựa trên cấu hình truong */}
            {truong.map((t) => (
              <div className="o-nhap" key={t.name}>
                <label>
                  {t.nhan}
                  {/* Hiển thị dấu * đỏ nếu trường bắt buộc nhập */}
                  {t.required && <span className="bat-buoc"> *</span>}
                </label>

                {/* Ô chọn (select) */}
                {t.loai === "select" ? (
                  <select
                    value={duLieuForm[t.name] ?? ""}
                    onChange={(e) => doiGiaTri(t.name, e.target.value)}
                    required={t.required}
                  >
                    <option value="">-- Chọn --</option>
                    {(optionsMap[t.name] || []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : t.loai === "datalist" ? (
                  // Ô gõ kèm gợi ý: chọn nhanh thương hiệu nổi tiếng hoặc tự nhập
                  <>
                    <input
                      list={`dl-${t.name}`}
                      type="text"
                      value={duLieuForm[t.name] ?? ""}
                      onChange={(e) => doiGiaTri(t.name, e.target.value)}
                      required={t.required}
                      placeholder={t.goiY || ""}
                    />
                    <datalist id={`dl-${t.name}`}>
                      {(t.options || []).map((o) => (
                        <option key={o} value={o} />
                      ))}
                    </datalist>
                  </>
                ) : t.loai === "anh" ? (
                  // Ảnh: dán URL hoặc tải ảnh từ máy lên
                  <div>
                    <input
                      type="text"
                      value={duLieuForm[t.name] ?? ""}
                      onChange={(e) => doiGiaTri(t.name, e.target.value)}
                      placeholder="Dán URL ảnh, hoặc tải ảnh lên ở dưới"
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                      <label className="nut nut-phu" style={{ cursor: "pointer" }}>
                        ⬆️ Tải ảnh từ máy
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => taiAnhLen(e, t.name)}
                        />
                      </label>
                      {dangTaiAnh && <span style={{ fontSize: 13, color: "#64748b" }}>Đang tải ảnh...</span>}
                    </div>
                    {duLieuForm[t.name] && (
                      <img
                        src={duLieuForm[t.name]}
                        alt="xem trước"
                        className="anh-xem-truoc"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    )}
                  </div>
                ) : t.loai === "textarea" ? (
                  // Ô nhập văn bản nhiều dòng (ví dụ: mô tả, ghi chú)
                  <textarea
                    value={duLieuForm[t.name] ?? ""}
                    onChange={(e) => doiGiaTri(t.name, e.target.value)}
                  />
                ) : t.loai === "password" ? (
                  // Ô mật khẩu: có nút ẩn/hiện (icon mắt) + ô xác nhận mật khẩu
                  <>
                    <OMatKhau value={duLieuForm[t.name] ?? ""} onChange={(e) => doiGiaTri(t.name, e.target.value)} placeholder={t.goiY || ""} required={t.required} />
                    <label style={{ display: "block", marginTop: 8 }}>Xác nhận mật khẩu</label>
                    <OMatKhau value={xacNhanMk} onChange={(e) => setXacNhanMk(e.target.value)} placeholder="Nhập lại mật khẩu" />
                  </>
                ) : (
                  // Mặc định: ô nhập 1 dòng, kiểu lấy theo t.loai (text/number/...)
                  // Ô số: chặn nhập số âm (min=0) và cho phép số thập phân (step=any)
                  <input
                    type={t.loai || "text"}
                    value={duLieuForm[t.name] ?? ""}
                    onChange={(e) => doiGiaTri(t.name, e.target.value)}
                    required={t.required}
                    placeholder={t.goiY || ""}
                    min={t.loai === "number" ? 0 : undefined}
                    step={t.loai === "number" ? "any" : undefined}
                  />
                )}
              </div>
            ))}

            {/* Khu vực hiển thị thông báo lỗi (nếu có) */}
            {loi && <div className="bao-loi">{loi}</div>}

            {/* Nhóm nút thao tác của form */}
            <div className="nut-form">
              {/* Nút Hủy: đóng hộp thoại mà không lưu */}
              <button type="button" className="nut nut-phu" onClick={() => setMoModal(false)}>
                Hủy
              </button>
              {/* Nút Lưu: submit form, kích hoạt hàm luu */}
              <button type="submit" className="nut nut-chinh">
                Lưu
              </button>
            </div>
          </form>
        </HopThoai>
      )}
    </div>
  );
}
