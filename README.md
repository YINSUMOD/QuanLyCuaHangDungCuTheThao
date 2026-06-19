# 🏀 Hệ thống quản lý cửa hàng dụng cụ thể thao

Ứng dụng web **vừa bán hàng trực tuyến, vừa quản lý cửa hàng** dụng cụ thể thao.
Kiến trúc tách lớp **Frontend – Backend – Database**, đóng gói và chạy bằng **Docker**.

## 🧰 Công nghệ

| Tầng | Công nghệ |
|------|-----------|
| Frontend | React 18 + Vite + React Router (Nginx phục vụ tĩnh) |
| Backend | Node.js + Express, xác thực JWT, phân quyền theo vai trò (RBAC) |
| Database | MySQL 8 |
| Triển khai | Docker + Docker Compose |

## 🚀 Cách chạy (chỉ cần cài Docker Desktop)

```bash
docker compose up -d --build
```

Sau khi các container khởi động xong:

| Thành phần | Địa chỉ |
|------------|---------|
| 🛒 Web bán hàng (khách) | http://localhost:8080 |
| 🛠️ Hệ thống quản trị | http://localhost:8080/quan-ly |
| 🔌 API backend | http://localhost:5000/api/health |
| 🗄️ MySQL | localhost:3307 |

Dừng hệ thống:

```bash
docker compose down       # dừng, giữ lại dữ liệu
docker compose down -v    # dừng và xóa dữ liệu trong database
```

## 👤 Tài khoản đăng nhập mẫu

**Nhân viên** (đăng nhập tại `/quan-ly`):

| Vai trò | Tài khoản | Mật khẩu |
|---------|-----------|----------|
| Quản trị (admin) | `admin` | `admin123` |
| Quản lý | `quanly` | `quanly123` |
| Thu ngân | `nhanvien` | `nhanvien123` |
| Nhân viên kho | `nhankho` | `nhankho123` |

**Khách hàng** (web bán hàng `/`): `an.nguyen@example.com` / `khach123`

## ✨ Chức năng chính

**Hệ thống quản trị (`/quan-ly`):** tổng quan (dashboard), quản lý sản phẩm – danh mục – nhà cung cấp – khách hàng – tài khoản, bán hàng tại quầy (POS) + in hóa đơn, quản lý đơn hàng theo trạng thái, nhập kho, báo cáo doanh thu (xuất Excel/PDF). Phân quyền 4 vai trò.

**Web bán hàng (`/`):** xem & tìm sản phẩm không cần đăng nhập, giỏ hàng, đăng ký/đăng nhập, đặt hàng online (đồng bộ sang quản trị), theo dõi & yêu cầu hủy đơn.

## 📁 Cấu trúc thư mục

```
backend/                 # API Node.js + Express
  └── ma-nguon/          # may-chu, tuyen-duong, dieu-khien, trung-gian, cau-hinh, tien-ich
database/
  └── init.sql           # Tạo bảng + dữ liệu mẫu (MySQL tự chạy lần đầu)
frontend/
  ├── ban-hang/          # Web bán hàng cho khách  (phục vụ tại /)
  ├── quan-ly/           # Hệ thống quản trị        (phục vụ tại /quan-ly)
  ├── Dockerfile         # Build cả 2 app, gộp vào 1 Nginx
  └── nginx.conf         # Định tuyến: / , /quan-ly , /api , /anh
docker-compose.yml       # 3 service: database, backend, frontend
```

## 🔒 Bảo mật & ràng buộc

Mã hóa mật khẩu (bcrypt), xác thực JWT, phân quyền RBAC; ràng buộc dữ liệu nhập đầy đủ (chặn số âm, sai định dạng); dùng transaction khi trừ/hoàn kho để dữ liệu luôn nhất quán.

## 👥 Thành viên nhóm

| MSSV | Họ tên | Vai trò |
|------|--------|---------|
| 110122004 | Phạm Thành Tư Hản | Nhóm trưởng / Dev chính |
| 110122052 | Lâm Trương Định | Lập trình viên |
| 110123198 | Ngô Thanh Trà | Lập trình viên |

> Đồ án môn học **Công nghệ phần mềm** — Trường Kỹ thuật và Công nghệ, Đại học Trà Vinh.
