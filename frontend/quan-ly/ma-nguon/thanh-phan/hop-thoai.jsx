// Thành phần hộp thoại (modal) dùng chung cho các form thêm/sửa
// Props:
//   tieuDe   - tiêu đề hiển thị trên đầu hộp thoại
//   dong     - hàm callback để đóng hộp thoại
//   children - nội dung (form) được truyền vào thân hộp thoại
export default function HopThoai({ tieuDe, dong, children }) {
  return (
    // Lớp nền phủ toàn màn hình; click ra ngoài (vào nền) sẽ đóng modal
    <div className="modal-nen" onClick={dong}>
      {/* Ngăn không cho click bên trong modal làm đóng modal */}
      <div className="modal-hop" onClick={(e) => e.stopPropagation()}>
        {/* Phần đầu hộp thoại: tiêu đề và nút đóng */}
        <div className="modal-dau">
          <h3>{tieuDe}</h3>
          {/* Nút "✕" để đóng hộp thoại */}
          <button className="nut-dong" onClick={dong}>
            ✕
          </button>
        </div>
        {/* Phần thân hộp thoại: hiển thị nội dung được truyền qua children */}
        <div className="modal-than">{children}</div>
      </div>
    </div>
  );
}
