# =============================================================================
# Dockerfile GỘP cho frontend: build CẢ HAI ứng dụng rồi phục vụ chung 1 Nginx
#   - Web bán hàng (ban-hang)      -> phục vụ tại  /
#   - Hệ thống quản trị (quan-ly)  -> phục vụ tại  /quan-ly
# Nhờ vậy chỉ còn 2 thư mục gốc (backend + frontend) và 1 cổng duy nhất.
# =============================================================================

# ----- Giai đoạn 1: build WEB BÁN HÀNG (base "/") -----
FROM node:20-alpine AS build-banhang
WORKDIR /app
# Copy trước package*.json để tận dụng cache layer khi cài dependency
COPY ban-hang/package*.json ./
RUN npm install
# Copy toàn bộ mã nguồn web bán hàng rồi build ra thư mục dist
COPY ban-hang/ ./
RUN npm run build

# ----- Giai đoạn 2: build HỆ THỐNG QUẢN TRỊ (base "/quan-ly/") -----
FROM node:20-alpine AS build-quanly
WORKDIR /app
COPY quan-ly/package*.json ./
RUN npm install
COPY quan-ly/ ./
RUN npm run build

# ----- Giai đoạn 3: phục vụ cả 2 bản build bằng Nginx -----
FROM nginx:alpine
# Web bán hàng đặt ở gốc thư mục web
COPY --from=build-banhang /app/dist /usr/share/nginx/html
# Hệ thống quản trị đặt trong thư mục con /quan-ly
COPY --from=build-quanly /app/dist /usr/share/nginx/html/quan-ly
# Kho ảnh sản phẩm phục vụ tĩnh tại /anh (lấy từ public của app quản trị)
COPY quan-ly/public/anh /usr/share/nginx/html/anh
# Cấu hình Nginx gộp: định tuyến /, /quan-ly, /api, /anh
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Mở cổng 80 trong container
EXPOSE 80
# Chạy Nginx ở chế độ foreground để container không tự thoát
CMD ["nginx", "-g", "daemon off;"]
