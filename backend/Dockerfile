# =============================================================================
# Dockerfile cho Backend API (Node.js + Express)
# Mục đích: Đóng gói máy chủ API của hệ thống quản lý cửa hàng dụng cụ thể thao
#           thành 1 image Docker để chạy đồng nhất ở mọi môi trường.
# Cách hoạt động: dựa trên Node 20 (bản Alpine nhẹ), cài thư viện -> copy mã nguồn
#           -> mở cổng 5000 -> khởi chạy máy chủ.
# =============================================================================

# Dùng image nền Node.js phiên bản 20 trên Alpine Linux (dung lượng nhỏ, nhẹ)
FROM node:20-alpine

# Thư mục làm việc bên trong container
WORKDIR /app

# Sao chép file khai báo thư viện trước để tận dụng cache khi build
# (chỉ copy package.json và package-lock.json: nếu các file này không đổi,
#  Docker sẽ tái sử dụng lớp cache đã cài thư viện, giúp build nhanh hơn)
COPY package*.json ./

# Cài đặt thư viện (chỉ cài dependency dùng cho production)
# Cờ --omit=dev: bỏ qua devDependencies để image gọn nhẹ, an toàn hơn khi chạy thật
RUN npm install --omit=dev

# Sao chép toàn bộ mã nguồn còn lại vào thư mục làm việc /app
# (đặt sau bước cài thư viện để khi sửa code không phải cài lại từ đầu)
COPY . .

# Cổng mà API lắng nghe (khai báo để tài liệu hóa và phục vụ ánh xạ cổng khi chạy)
EXPOSE 5000

# Lệnh khởi chạy máy chủ khi container chạy: chạy file điểm vào ma-nguon/may-chu.js
# (dùng dạng "exec form" [ ... ] để Node nhận tín hiệu dừng/khởi động đúng cách)
CMD ["node", "ma-nguon/may-chu.js"]
