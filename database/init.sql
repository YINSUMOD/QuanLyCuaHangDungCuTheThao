-- =============================================================================
-- Khởi tạo CSDL cho HỆ THỐNG QUẢN LÝ CỬA HÀNG DỤNG CỤ THỂ THAO
-- Dữ liệu sản phẩm, giá và ẢNH lấy thật từ các shop thể thao nổi tiếng ở Việt Nam
-- (ShopVNB, Thiên Trường Sport, Đại Hưng Sport, iFitness, YouSport, Meta.vn, Tiki...)
-- Ảnh đã tải về lưu cục bộ tại frontend/public/anh/ (phục vụ qua /anh/sp_N.jpg)
-- =============================================================================

-- Đặt bộ ký tự kết nối là utf8mb4 để lưu/hiển thị tiếng Việt đúng, tránh lỗi mã hóa kép
SET NAMES utf8mb4;
-- Tạo CSDL nếu chưa tồn tại; dùng utf8mb4 + collation unicode để sắp xếp/so sánh tiếng Việt chuẩn
CREATE DATABASE IF NOT EXISTS cuahang_the_thao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Chọn CSDL vừa tạo làm CSDL làm việc cho toàn bộ lệnh phía dưới
USE cuahang_the_thao;

-- ---------- Bảng NGƯỜI DÙNG ----------
-- Lưu tài khoản nhân viên/quản trị đăng nhập hệ thống quản lý
CREATE TABLE IF NOT EXISTS nguoi_dung (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,          -- Tên đăng nhập, không trùng lặp
  mat_khau VARCHAR(255) NOT NULL,                     -- Mật khẩu đã băm bằng bcrypt
  ho_ten VARCHAR(100),                                -- Họ tên đầy đủ hiển thị
  vai_tro ENUM('admin','quan_ly','thu_ngan','nhan_vien_kho') DEFAULT 'thu_ngan', -- Phân quyền theo vai trò
  trang_thai TINYINT DEFAULT 1,                       -- Trạng thái tài khoản: 1=hoạt động, 0=khóa
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP        -- Thời điểm tạo tài khoản (tự động)
) ENGINE=InnoDB;

-- ---------- Bảng DANH MỤC ----------
-- Phân loại sản phẩm theo nhóm môn thể thao (bóng đá, cầu lông, gym...)
CREATE TABLE IF NOT EXISTS danh_muc (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ten_danh_muc VARCHAR(100) NOT NULL,                 -- Tên nhóm danh mục
  mo_ta TEXT                                          -- Mô tả chi tiết danh mục
) ENGINE=InnoDB;

-- ---------- Bảng NHÀ CUNG CẤP ----------
-- Lưu thông tin các nhà cung cấp/đối tác nhập hàng
CREATE TABLE IF NOT EXISTS nha_cung_cap (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ten_ncc VARCHAR(150) NOT NULL,                      -- Tên nhà cung cấp
  dien_thoai VARCHAR(20),                             -- Số điện thoại liên hệ
  email VARCHAR(100),                                 -- Email liên hệ
  dia_chi VARCHAR(255)                                -- Địa chỉ nhà cung cấp
) ENGINE=InnoDB;

-- ---------- Bảng SẢN PHẨM ----------
-- Lưu danh mục hàng hóa: giá nhập/bán, tồn kho, danh mục & nhà cung cấp
CREATE TABLE IF NOT EXISTS san_pham (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ten_san_pham VARCHAR(200) NOT NULL,                 -- Tên sản phẩm
  thuong_hieu VARCHAR(80),                            -- Thương hiệu/hãng sản xuất
  danh_muc_id INT,                                    -- Khóa ngoại tới danh mục
  nha_cung_cap_id INT,                                -- Khóa ngoại tới nhà cung cấp
  gia_nhap DECIMAL(15,2) DEFAULT 0,                   -- Giá nhập (vốn)
  gia_ban DECIMAL(15,2) DEFAULT 0,                    -- Giá bán cho khách
  so_luong_ton INT DEFAULT 0,                         -- Số lượng tồn kho hiện tại
  don_vi VARCHAR(30) DEFAULT 'Cái',                   -- Đơn vị tính (Cái, Đôi, Quả...)
  mo_ta TEXT,                                         -- Mô tả sản phẩm
  hinh_anh VARCHAR(255),                              -- Đường dẫn ảnh (vd: /anh/sp_1.jpg)
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Thời điểm tạo sản phẩm
  -- Xóa danh mục thì set NULL để không mất sản phẩm (không xóa lan)
  FOREIGN KEY (danh_muc_id) REFERENCES danh_muc(id) ON DELETE SET NULL,
  -- Xóa nhà cung cấp thì set NULL, giữ lại sản phẩm
  FOREIGN KEY (nha_cung_cap_id) REFERENCES nha_cung_cap(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- Bảng KHÁCH HÀNG ----------
-- Lưu thông tin khách hàng, điểm tích lũy và tài khoản đăng nhập web bán hàng
CREATE TABLE IF NOT EXISTS khach_hang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ho_ten VARCHAR(100) NOT NULL,                       -- Họ tên khách hàng
  dien_thoai VARCHAR(20),                             -- Số điện thoại
  email VARCHAR(100),                                 -- Email (dùng để đăng nhập web)
  mat_khau VARCHAR(255),                 -- mật khẩu để khách đăng nhập web bán hàng (bcrypt)
  dia_chi VARCHAR(255),                               -- Địa chỉ giao hàng
  diem_tich_luy INT DEFAULT 0,                        -- Điểm tích lũy thành viên
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP        -- Thời điểm tạo khách hàng
) ENGINE=InnoDB;

-- ---------- Bảng ĐƠN HÀNG ----------
-- Lưu thông tin chung của mỗi đơn bán: khách, người lập, tổng tiền, trạng thái
CREATE TABLE IF NOT EXISTS don_hang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ma_don VARCHAR(30) NOT NULL UNIQUE,                 -- Mã đơn hàng (duy nhất)
  khach_hang_id INT,                                  -- Khóa ngoại tới khách hàng (NULL nếu khách lẻ)
  nguoi_dung_id INT,                                  -- Khóa ngoại tới nhân viên lập đơn
  tong_tien DECIMAL(15,2) DEFAULT 0,                  -- Tổng tiền hàng trước giảm giá
  giam_gia DECIMAL(15,2) DEFAULT 0,                   -- Số tiền được giảm
  thanh_tien DECIMAL(15,2) DEFAULT 0,                 -- Tiền phải trả = tổng tiền - giảm giá
  phuong_thuc_thanh_toan ENUM('tien_mat','chuyen_khoan','the') DEFAULT 'tien_mat', -- Hình thức thanh toán
  trang_thai ENUM('cho_xu_ly','da_xac_nhan','dang_giao','hoan_thanh','yeu_cau_huy','da_huy') DEFAULT 'hoan_thanh', -- Trạng thái xử lý đơn
  ghi_chu TEXT,                                       -- Ghi chú đơn hàng
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Thời điểm tạo đơn
  -- Xóa khách hàng thì giữ đơn, chỉ set NULL tham chiếu khách
  FOREIGN KEY (khach_hang_id) REFERENCES khach_hang(id) ON DELETE SET NULL,
  -- Xóa nhân viên thì giữ đơn, chỉ set NULL tham chiếu người lập
  FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- Bảng CHI TIẾT ĐƠN HÀNG ----------
-- Lưu từng dòng sản phẩm trong một đơn hàng (quan hệ 1 đơn - nhiều dòng)
CREATE TABLE IF NOT EXISTS chi_tiet_don_hang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  don_hang_id INT NOT NULL,                           -- Khóa ngoại tới đơn hàng
  san_pham_id INT,                                    -- Khóa ngoại tới sản phẩm
  so_luong INT NOT NULL,                              -- Số lượng mua
  don_gia DECIMAL(15,2) NOT NULL,                     -- Đơn giá tại thời điểm bán
  thanh_tien DECIMAL(15,2) NOT NULL,                  -- Thành tiền = đơn giá * số lượng
  -- Xóa đơn hàng thì xóa luôn các dòng chi tiết (CASCADE)
  FOREIGN KEY (don_hang_id) REFERENCES don_hang(id) ON DELETE CASCADE,
  -- Xóa sản phẩm thì giữ dòng chi tiết, chỉ set NULL tham chiếu sản phẩm
  FOREIGN KEY (san_pham_id) REFERENCES san_pham(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- Bảng PHIẾU NHẬP ----------
-- Lưu thông tin chung của mỗi phiếu nhập hàng từ nhà cung cấp
CREATE TABLE IF NOT EXISTS phieu_nhap (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ma_phieu VARCHAR(30) NOT NULL UNIQUE,               -- Mã phiếu nhập (duy nhất)
  nha_cung_cap_id INT,                                -- Khóa ngoại tới nhà cung cấp
  nguoi_dung_id INT,                                  -- Khóa ngoại tới nhân viên lập phiếu
  tong_tien DECIMAL(15,2) DEFAULT 0,                  -- Tổng giá trị nhập hàng
  ghi_chu TEXT,                                       -- Ghi chú phiếu nhập
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       -- Thời điểm lập phiếu
  -- Xóa nhà cung cấp/nhân viên thì giữ phiếu, chỉ set NULL tham chiếu
  FOREIGN KEY (nha_cung_cap_id) REFERENCES nha_cung_cap(id) ON DELETE SET NULL,
  FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- Bảng CHI TIẾT PHIẾU NHẬP ----------
-- Lưu từng dòng sản phẩm trong một phiếu nhập (quan hệ 1 phiếu - nhiều dòng)
CREATE TABLE IF NOT EXISTS chi_tiet_phieu_nhap (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phieu_nhap_id INT NOT NULL,                         -- Khóa ngoại tới phiếu nhập
  san_pham_id INT,                                    -- Khóa ngoại tới sản phẩm
  so_luong INT NOT NULL,                              -- Số lượng nhập
  gia_nhap DECIMAL(15,2) NOT NULL,                    -- Giá nhập từng sản phẩm
  thanh_tien DECIMAL(15,2) NOT NULL,                  -- Thành tiền = giá nhập * số lượng
  -- Xóa phiếu nhập thì xóa luôn các dòng chi tiết (CASCADE)
  FOREIGN KEY (phieu_nhap_id) REFERENCES phieu_nhap(id) ON DELETE CASCADE,
  -- Xóa sản phẩm thì giữ dòng chi tiết, chỉ set NULL tham chiếu sản phẩm
  FOREIGN KEY (san_pham_id) REFERENCES san_pham(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================================================
-- DỮ LIỆU MẪU
-- =============================================================================

-- NGƯỜI DÙNG (admin id=1, nhân viên id=2) - mật khẩu bcrypt: admin123 / nhanvien123
INSERT INTO nguoi_dung (ten_dang_nhap, mat_khau, ho_ten, vai_tro) VALUES
('admin',    '$2a$10$lPr8ibJeVmi9/gJu/B0GSu8uodU3x1.LofR1MS8JA31699ODeaiPa', 'Quản trị viên',   'admin'),
('nhanvien', '$2a$10$D4jKZrFeOXUfORipg/Q2Pe5KeKN8.D0YIZHsNutKVMGIs2yUtvKKu', 'Lê Thị Thu Ngân', 'thu_ngan');

-- DANH MỤC (10 nhóm)
-- Chèn các nhóm danh mục sản phẩm theo môn thể thao
INSERT INTO danh_muc (ten_danh_muc, mo_ta) VALUES
('Bóng đá', 'Giày, bóng và phụ kiện bóng đá'),
('Bóng rổ', 'Bóng, giày bóng rổ'),
('Cầu lông', 'Vợt, cầu, giày cầu lông'),
('Tennis', 'Vợt, bóng tennis'),
('Bóng chuyền', 'Bóng, lưới bóng chuyền'),
('Gym & Thể hình', 'Tạ, máy tập, thảm, dụng cụ tập luyện'),
('Bơi lội', 'Kính bơi, mũ bơi, phao, đồ bơi'),
('Chạy bộ', 'Giày, đồng hồ chạy bộ'),
('Quần áo thể thao', 'Áo, quần, áo khoác thể thao'),
('Phụ kiện thể thao', 'Bình nước, balo, dây nhảy, băng hỗ trợ'),
('Pickleball', 'Vợt và bóng Pickleball - môn thể thao đang rất hot tại Việt Nam'),
('Bóng bàn', 'Vợt, bóng, bàn bóng bàn');

-- NHÀ CUNG CẤP (các shop thể thao nổi tiếng tại Việt Nam)
-- Chèn dữ liệu mẫu nhà cung cấp; id 1..8 dùng tham chiếu trong bảng sản phẩm
INSERT INTO nha_cung_cap (ten_ncc, dien_thoai, email, dia_chi) VALUES
('ShopVNB - Hệ thống vợt cầu lông & tennis', '0961392323', 'cskh@shopvnb.com',           'Hà Nội & TP.HCM'),
('Thiên Trường Sport',                       '0968650686', 'lienhe@thethaothientruong.vn','Nam Định & toàn quốc'),
('Đại Hưng Sport',                           '0974905590', 'daihungsport@example.com',     'TP. Hồ Chí Minh'),
('iFitness - Thể thao & sức khỏe',           '1900636753', 'cskh@ifitness.vn',             'TP. Hồ Chí Minh'),
('YouSport',                                 '0902618869', 'cskh@yousport.vn',             'TP. Hồ Chí Minh'),
('Meta.vn',                                  '02437759075', 'lienhe@meta.vn',              'Hà Nội'),
('Tiki Trading',                             '19006035',    'hotro@tiki.vn',               'TP. Hồ Chí Minh'),
('Nhà cung cấp khác',                        '0900000000',  'ncc@example.com',             'Việt Nam');

-- SẢN PHẨM (52 sản phẩm thật từ shop VN; gia_nhap được tính tự động bên dưới)
-- Lưu ý: không truyền gia_nhap ở đây vì sẽ được tính = 80% gia_ban ở lệnh UPDATE phía cuối
INSERT INTO san_pham (ten_san_pham, thuong_hieu, danh_muc_id, nha_cung_cap_id, gia_ban, so_luong_ton, don_vi, mo_ta, hinh_anh) VALUES
-- Cầu lông (1-5)
('Vợt cầu lông Yonex Nanoflare 700 Tour', 'Yonex', 3, 1, 2769000, 8,  'Cây', 'Vợt công thủ toàn diện, chính hãng',        '/anh/sp_1.jpg'),
('Vợt cầu lông Victor Thruster TTY (Tai Tzu Ying)', 'Victor', 3, 1, 2989000, 6, 'Cây', 'Dòng vợt tấn công của Victor', '/anh/sp_2.jpg'),
('Vợt cầu lông Lining Axforce 80', 'Lining', 3, 1, 4320000, 5,  'Cây', 'Khung carbon cao cấp, đánh đôi/đơn tốt',     '/anh/sp_3.jpg'),
('Giày cầu lông Yonex SHB 65Z3', 'Yonex', 3, 3, 2459000, 10, 'Đôi', 'Đế bám sàn, giảm chấn Power Cushion',         '/anh/sp_4.jpg'),
('Cầu lông Yonex Aerosensa 30 (AS-30)', 'Yonex', 3, 3, 1239000, 40, 'Ống', 'Cầu lông vũ thi đấu, ổn định đường bay',  '/anh/sp_5.jpg'),
-- Tennis (6-10)
('Vợt tennis Babolat Pure Drive 98 305gr', 'Babolat', 4, 1, 5149000, 5, 'Cây', 'Vợt tennis cân bằng lực & kiểm soát',   '/anh/sp_6.jpg'),
('Vợt tennis Babolat Pure Drive Team 285gr', 'Babolat', 4, 1, 3899000, 7, 'Cây', 'Nhẹ, phù hợp người chơi phổ thông',   '/anh/sp_7.jpg'),
('Vợt tennis Head Ti S6', 'Head', 4, 1, 2949000, 8, 'Cây', 'Vợt nhẹ, dễ chơi, phổ biến',                          '/anh/sp_8.jpg'),
('Bóng tennis Wilson US Open (hộp 4 quả)', 'Wilson', 4, 1, 210000, 50, 'Hộp', 'Bóng thi đấu chuẩn',                    '/anh/sp_9.jpg'),
('Bóng tennis Wilson Championship (hộp 4 quả)', 'Wilson', 4, 1, 195000, 45, 'Hộp', 'Bóng tập luyện bền',               '/anh/sp_10.jpg'),
-- Bóng đá (11-15)
('Quả bóng đá Động Lực UHV 2.16', 'Động Lực', 1, 2, 695000, 30, 'Quả', 'Bóng da PU, đường may chắc chắn',            '/anh/sp_11.jpg'),
('Quả bóng đá Động Lực UHV 2.05 Pro Step', 'Động Lực', 1, 2, 850000, 20, 'Quả', 'Bóng thi đấu cao cấp',               '/anh/sp_12.jpg'),
('Giày đá bóng Kamito Artista Pro TF', 'Kamito', 1, 8, 589000, 15, 'Đôi', 'Giày sân cỏ nhân tạo thương hiệu Việt',    '/anh/sp_13.jpg'),
('Giày đá bóng Mira Pro (sân cỏ nhân tạo)', 'Mira', 1, 8, 235000, 25, 'Đôi', 'Giá tốt cho người mới',                 '/anh/sp_14.jpg'),
('Giày đá bóng Mira Ultra TF', 'Mira', 1, 8, 549000, 4,  'Đôi', 'Bám sân tốt, êm chân',                              '/anh/sp_15.jpg'),
-- Bóng rổ (16-20)
('Quả bóng rổ Spalding TF-150 Outdoor số 7', 'Spalding', 2, 2, 280000, 35, 'Quả', 'Bóng cao su chơi ngoài trời',      '/anh/sp_16.jpg'),
('Quả bóng rổ Molten B7G4500 số 7', 'Molten', 2, 8, 1450000, 12, 'Quả', 'Bóng da PU thi đấu trong nhà',              '/anh/sp_17.jpg'),
('Quả bóng rổ Molten B7G3200 số 7', 'Molten', 2, 5, 699000, 18, 'Quả', 'Bóng tập luyện phổ thông',                   '/anh/sp_18.jpg'),
('Giày bóng rổ PEAK Taichi Triangle 4.0 Pro', 'PEAK', 2, 8, 3490000, 8, 'Đôi', 'Đệm Taichi êm, ôm cổ chân',           '/anh/sp_19.jpg'),
('Giày bóng rổ PEAK Taichi DA540051', 'PEAK', 2, 8, 1500000, 10, 'Đôi', 'Giày bóng rổ giá tốt',                      '/anh/sp_20.jpg'),
-- Bóng chuyền (21-25)
('Bóng chuyền Mikasa V200W', 'Mikasa', 5, 6, 1990000, 10, 'Quả', 'Bóng thi đấu Olympic chính thức',                 '/anh/sp_21.jpg'),
('Bóng chuyền Mikasa V330W', 'Mikasa', 5, 6, 697000, 15, 'Quả', 'Bóng da mềm, dễ kiểm soát',                         '/anh/sp_22.jpg'),
('Bóng chuyền Molten V5M5000', 'Molten', 5, 6, 1490000, 12, 'Quả', 'Bóng thi đấu cao cấp',                           '/anh/sp_23.jpg'),
('Lưới bóng chuyền dây Việt Anh', 'Việt Anh Sport', 5, 2, 195000, 20, 'Bộ', 'Lưới sợi dù bền, kèm dây căng',         '/anh/sp_24.jpg'),
('Quả bóng chuyền Động Lực Hunter DL 210C', 'Động Lực', 5, 2, 750000, 14, 'Quả', 'Bóng da PU thương hiệu Việt',      '/anh/sp_25.jpg'),
-- Gym & Thể hình (26-32)
('Tạ tay điều chỉnh 20kg (cặp 40kg)', 'Thiên Trường Sport', 6, 2, 4300000, 6, 'Bộ', 'Điều chỉnh nhanh, tiết kiệm chỗ', '/anh/sp_26.jpg'),
('Ghế tập tạ đa năng Xuki', 'Xuki', 6, 2, 2050000, 5, 'Cái', 'Điều chỉnh nhiều góc tập',                            '/anh/sp_27.jpg'),
('Giàn tạ đa năng HQ-908S', 'HQ', 6, 2, 15990000, 3, 'Bộ', 'Giàn tập đa năng cho phòng gym tại nhà',                '/anh/sp_28.jpg'),
('Máy chạy bộ Oreni T8 (AC 3.0HP)', 'Oreni', 6, 2, 15900000, 4, 'Cái', 'Động cơ êm, gập gọn',                       '/anh/sp_29.jpg'),
('Thảm tập yoga LiveUp TPE', 'LiveUp Sports', 6, 4, 350000, 50, 'Cái', 'Chống trượt, êm, thân thiện môi trường',     '/anh/sp_30.jpg'),
('Con lăn tập bụng AB Carver Pro', 'Thiên Trường Sport', 6, 2, 410000, 40, 'Cái', 'Bánh xe tập cơ bụng có lò xo trợ lực', '/anh/sp_31.jpg'),
('Bộ dây kháng lực ngũ sắc LiveUp', 'LiveUp Sports', 6, 4, 450000, 35, 'Bộ', '5 mức kháng lực khác nhau',           '/anh/sp_32.jpg'),
-- Bơi lội (33-37)
('Kính bơi Speedo Jet chống UV', 'Speedo', 7, 7, 345000, 30, 'Cái', 'Chống tia UV, chống mờ sương',                 '/anh/sp_33.jpg'),
('Mũ bơi silicon Arena', 'Arena', 7, 7, 115000, 60, 'Cái', 'Co giãn tốt, giữ tóc khô',                              '/anh/sp_34.jpg'),
('Áo phao tập bơi trẻ em 3 mảnh', 'Swimlink', 7, 7, 329000, 20, 'Cái', 'Hỗ trợ tập bơi an toàn cho trẻ',            '/anh/sp_35.jpg'),
('Phao lưng tập bơi trẻ em Sportslink', 'Sportslink', 7, 7, 196000, 25, 'Cái', 'Phao lưng nhẹ, dễ đeo',             '/anh/sp_36.jpg'),
('Nón bơi silicon che tai', 'OEM', 7, 7, 150000, 40, 'Cái', 'Che tai chống nước',                                   '/anh/sp_37.jpg'),
-- Chạy bộ (38-42)
('Giày chạy bộ nam Xtep Bứt Tốc 5.0', 'Xtep', 8, 8, 1099000, 12, 'Đôi', 'Giảm chấn tốt cho chạy đường dài',         '/anh/sp_38.jpg'),
('Giày chạy bộ nam Xtep 260X', 'Xtep', 8, 8, 2379000, 8, 'Đôi', 'Dòng chạy chuyên nghiệp',                          '/anh/sp_39.jpg'),
('Đồng hồ chạy bộ Garmin Forerunner 165 Music', 'Garmin', 8, 8, 7849000, 5, 'Cái', 'GPS, đo nhịp tim, nghe nhạc',   '/anh/sp_40.jpg'),
('Đồng hồ chạy bộ Garmin Forerunner 165', 'Garmin', 8, 8, 6569000, 6, 'Cái', 'GPS, theo dõi luyện tập',             '/anh/sp_41.jpg'),
('Giày chạy bộ Zocker Ultra Light Gen 2', 'Zocker', 8, 8, 790000, 16, 'Đôi', 'Nhẹ, thoáng, giá tốt thương hiệu Việt', '/anh/sp_42.jpg'),
-- Quần áo thể thao (43-47)
('Áo T-shirt Kamito Galaxy 3', 'Kamito', 9, 5, 132000, 50, 'Cái', 'Vải thoáng khí, thấm hút mồ hôi',                '/anh/sp_43.jpg'),
('Áo Polo Kamito Artista', 'Kamito', 9, 5, 279000, 40, 'Cái', 'Áo polo thể thao lịch sự',                          '/anh/sp_44.jpg'),
('Quần đùi thể thao YaMe Beginner 014', 'YaMe', 9, 8, 97000, 60, 'Cái', 'Vải dù nhanh khô',                         '/anh/sp_45.jpg'),
('Áo khoác gió thể thao YaMe Beginner 009', 'YaMe', 9, 8, 197000, 30, 'Cái', 'Chống nắng, cản gió, nhanh khô',      '/anh/sp_46.jpg'),
('Áo T-shirt Kamito Galaxy 2', 'Kamito', 9, 5, 139000, 45, 'Cái', 'Áo thun thể thao co giãn',                       '/anh/sp_47.jpg'),
-- Phụ kiện thể thao (48-52)
('Bình nước/túi nước chạy bộ GoodFit GF04RA', 'GoodFit', 10, 4, 169000, 50, 'Cái', 'Túi nước có vòi hút tiện lợi',  '/anh/sp_48.jpg'),
('Bình lắc Pro Shaker 4 trong 1 iFitness', 'iFitness', 10, 7, 250000, 40, 'Cái', 'Bình lắc pha sữa/whey tiện dụng', '/anh/sp_49.jpg'),
('Dây nhảy thể dục lõi thép GoodFit GF901JR', 'GoodFit', 10, 8, 145000, 60, 'Cái', 'Tay cầm chống trượt, dây điều chỉnh', '/anh/sp_50.jpg'),
('Băng quấn cổ tay LiveUp LS5750', 'LiveUp Sports', 10, 4, 99000, 80, 'Cái', 'Hỗ trợ cổ tay khi tập',               '/anh/sp_51.jpg'),
('Vest nước/balo chạy bộ GoodFit GF303RV', 'GoodFit', 10, 8, 499000, 18, 'Cái', 'Balo nước có phản quang, chống thấm', '/anh/sp_52.jpg');

-- 48 SẢN PHẨM bổ sung (đủ 100 sản phẩm hot ở VN, gồm Pickleball & Bóng bàn)
-- Tiếp tục chèn sản phẩm với id 53..100; gia_nhap cũng tính tự động ở lệnh UPDATE cuối
INSERT INTO san_pham (ten_san_pham, thuong_hieu, danh_muc_id, nha_cung_cap_id, gia_ban, so_luong_ton, don_vi, mo_ta, hinh_anh) VALUES
-- Pickleball (đang rất hot tại Việt Nam)
('Vợt Pickleball Joola Perseus 5', 'Joola', 11, 8, 6500000, 8, 'Cây', 'Vợt pickleball cao cấp dòng Perseus', '/anh/sp_53.jpg'),
('Vợt Pickleball Joola Hyperion 5', 'Joola', 11, 8, 6500000, 7, 'Cây', 'Vợt pickleball dòng Hyperion', '/anh/sp_54.jpg'),
('Vợt Pickleball Sypik Triton 5 Pro Ultimate', 'Sypik', 11, 8, 3650000, 10, 'Cây', 'Vợt carbon kiểm soát tốt', '/anh/sp_55.jpg'),
('Vợt Pickleball Joola Perseus Pro IV 16mm', 'Joola', 11, 8, 5990000, 9, 'Cây', 'Mặt carbon, lõi 16mm', '/anh/sp_56.jpg'),
('Bóng Pickleball Franklin X-40 thi đấu', 'Franklin', 11, 8, 75000, 100, 'Quả', 'Bóng thi đấu chuẩn USAPA', '/anh/sp_57.jpg'),
('Set bóng Pickleball Joola Primo 3 sao (4 quả)', 'Joola', 11, 8, 299000, 40, 'Hộp', 'Bộ 4 quả bóng thi đấu', '/anh/sp_58.jpg'),
-- Bóng bàn
('Vợt bóng bàn Stiga 3 sao', 'Stiga', 12, 2, 1040000, 15, 'Cây', 'Vợt dán sẵn 3 sao', '/anh/sp_59.jpg'),
('Vợt bóng bàn 729 2Star', '729', 12, 2, 200000, 30, 'Cây', 'Vợt giá tốt cho người mới', '/anh/sp_60.jpg'),
('Vợt bóng bàn Huieson X 5 sao', 'Huieson', 12, 2, 240000, 25, 'Cây', 'Vợt 5 sao, lực đánh tốt', '/anh/sp_61.jpg'),
('Bàn bóng bàn Harito TT-278', 'Harito', 12, 2, 9050000, 3, 'Cái', 'Bàn tiêu chuẩn thi đấu', '/anh/sp_62.jpg'),
('Bàn bóng bàn Thiên Trường PT-05', 'Thiên Trường', 12, 2, 4500000, 5, 'Cái', 'Bàn bóng bàn gia đình', '/anh/sp_63.jpg'),
('Quả bóng bàn Kamito 40+ 3 sao', 'Kamito', 12, 2, 150000, 60, 'Hộp', 'Bóng thi đấu 40+ (hộp)', '/anh/sp_64.jpg'),
-- Cầu lông (bổ sung)
('Vợt cầu lông Yonex Astrox 88D Pro', 'Yonex', 3, 1, 4039000, 8, 'Cây', 'Vợt công thủ đầu nặng', '/anh/sp_65.jpg'),
('Vợt cầu lông Yonex Arcsaber 11', 'Yonex', 3, 1, 3239000, 7, 'Cây', 'Vợt cân bằng, kiểm soát tốt', '/anh/sp_66.jpg'),
('Giày cầu lông Yonex Court Flow', 'Yonex', 3, 1, 699000, 15, 'Đôi', 'Giày cầu lông giá tốt', '/anh/sp_67.jpg'),
('Balo cầu lông Yonex BAG 1618EX', 'Yonex', 3, 1, 630000, 20, 'Cái', 'Balo đựng vợt & phụ kiện', '/anh/sp_68.jpg'),
('Vợt cầu lông Yonex Astrox Nextage', 'Yonex', 3, 1, 2049000, 12, 'Cây', 'Vợt tấn công tầm trung', '/anh/sp_69.jpg'),
-- Bóng đá (bổ sung)
('Giày đá bóng Zocker Inspire Pro', 'Zocker', 1, 5, 729000, 18, 'Đôi', 'Giày sân cỏ nhân tạo thương hiệu Việt', '/anh/sp_70.jpg'),
('Quả bóng đá Động Lực UHV 2.95', 'Động Lực', 1, 2, 580000, 25, 'Quả', 'Bóng da PU size 5', '/anh/sp_71.jpg'),
('Găng tay thủ môn T90', 'Thiên Trường Sport', 1, 2, 250000, 20, 'Đôi', 'Găng thủ môn đệm latex', '/anh/sp_72.jpg'),
-- Tennis (bổ sung)
('Vợt tennis Wilson Pro Staff 97L V14', 'Wilson', 4, 1, 6900000, 5, 'Cây', 'Vợt kiểm soát cao cấp', '/anh/sp_73.jpg'),
('Vợt tennis Yonex VCORE 100 (300g)', 'Yonex', 4, 1, 4290000, 6, 'Cây', 'Vợt tạo xoáy mạnh', '/anh/sp_74.jpg'),
('Dây cước tennis Head Lynx (12m)', 'Head', 4, 1, 269000, 40, 'Cuộn', 'Dây căng vợt bền, độ nảy tốt', '/anh/sp_75.jpg'),
('Balo tennis Prince Slam Backpack', 'Prince', 4, 1, 1400000, 12, 'Cái', 'Balo đựng vợt tennis', '/anh/sp_76.jpg'),
-- Bóng rổ (bổ sung)
('Trụ bóng rổ di động TT-108', 'Thiên Trường Sport', 2, 2, 10500000, 3, 'Bộ', 'Trụ di động điều chỉnh độ cao', '/anh/sp_77.jpg'),
-- Bóng chuyền (bổ sung)
('Băng đầu gối Adidas AD-12214', 'Adidas', 5, 2, 678000, 30, 'Đôi', 'Băng bảo vệ đầu gối', '/anh/sp_78.jpg'),
('Trụ bóng chuyền tập luyện TT 2026', 'Thiên Trường Sport', 5, 2, 6450000, 3, 'Bộ', 'Trụ bóng chuyền di động', '/anh/sp_79.jpg'),
-- Gym & Thể hình (bổ sung)
('Con lăn massage Yoga Foam Roller', 'Thiên Trường Sport', 6, 2, 300000, 40, 'Cái', 'Con lăn massage giãn cơ', '/anh/sp_80.jpg'),
('Xà đơn gắn cửa GoodFit GF201PU', 'GoodFit', 6, 4, 439000, 25, 'Cái', 'Xà đơn treo cửa, đa năng', '/anh/sp_81.jpg'),
('Tạ ấm kettlebell LivePro LP8044', 'LivePro', 6, 8, 1160000, 5, 'Cái', 'Tạ ấm gang chuẩn thi đấu', '/anh/sp_82.jpg'),
('Ghế cong tập bụng Ben Pro 601003', 'Ben Pro', 6, 2, 1630000, 8, 'Cái', 'Ghế cong hỗ trợ tập cơ bụng', '/anh/sp_83.jpg'),
-- Bơi lội (bổ sung)
('Kính bơi Speedo Aquapulse Pro', 'Speedo', 7, 8, 899000, 20, 'Cái', 'Tầm nhìn rộng, chống UV', '/anh/sp_84.jpg'),
('Chân vịt bơi ProFins YBL2308', 'YBL', 7, 8, 662000, 15, 'Đôi', 'Chân vịt tập bơi chuyên nghiệp', '/anh/sp_85.jpg'),
('Quần bơi nam Speedo', 'Speedo', 7, 7, 826000, 18, 'Cái', 'Quần bơi nam nhanh khô', '/anh/sp_86.jpg'),
-- Chạy bộ (bổ sung)
('Đai đeo số BIB iFitness V2', 'iFitness', 8, 4, 99000, 50, 'Cái', 'Đai đeo số BIB khi chạy giải', '/anh/sp_87.jpg'),
('Giày chạy bộ nam Asics Novablast 5', 'Asics', 8, 8, 3600000, 8, 'Đôi', 'Đệm êm, bứt tốc tốt', '/anh/sp_88.jpg'),
('Giày chạy bộ Nike Air Zoom Pegasus 41', 'Nike', 8, 8, 4436800, 4, 'Đôi', 'Đệm Zoom Air phản hồi nhanh', '/anh/sp_89.jpg'),
-- Quần áo thể thao (bổ sung)
('Áo thun 3 lỗ thể thao YaMe The Trainer 007', 'YaMe', 9, 8, 128500, 50, 'Cái', 'Vải AirDry thoáng khí', '/anh/sp_90.jpg'),
('Áo khoác chống nắng Cool Touch YaMe', 'YaMe', 9, 8, 278500, 30, 'Cái', 'Vải làm mát, chống nắng', '/anh/sp_91.jpg'),
('Quần legging tập gym nữ ICADO QD-32', 'ICADO', 9, 8, 99000, 40, 'Cái', 'Co giãn, ôm dáng', '/anh/sp_92.jpg'),
-- Phụ kiện thể thao (bổ sung)
('Băng nén bảo vệ đầu gối Profits', 'PIP', 10, 4, 549000, 25, 'Cái', 'Băng nén hỗ trợ đầu gối', '/anh/sp_93.jpg'),
('Con lăn EVA giãn cơ LivePro LP8230', 'LivePro', 10, 8, 310000, 30, 'Cái', 'Con lăn xốp EVA cao cấp', '/anh/sp_94.jpg'),
('Balo thể thao Adidas IJ5633', 'Adidas', 10, 8, 449000, 20, 'Cái', 'Balo thể thao nhiều ngăn', '/anh/sp_95.jpg'),
-- Bổ sung thêm vợt/bóng nổi bật
('Vợt cầu lông Victor Thruster K2', 'Victor', 3, 1, 950000, 14, 'Cây', 'Vợt tấn công giá tốt', '/anh/sp_96.jpg'),
('Vợt cầu lông Lining Bladex 800', 'Lining', 3, 1, 4200000, 6, 'Cây', 'Vợt công nghệ Bladex', '/anh/sp_97.jpg'),
('Vợt tennis Babolat Pure Drive 2021 300gr', 'Babolat', 4, 1, 4699000, 7, 'Cây', 'Vợt tennis đa năng', '/anh/sp_98.jpg'),
('Quả bóng rổ Molten B6G5000 FIBA', 'Molten', 2, 8, 2890000, 10, 'Quả', 'Bóng da thi đấu FIBA', '/anh/sp_99.jpg'),
('Quả bóng chuyền da PU Dragon Master DG 6500', 'Dragon Master', 5, 8, 490000, 18, 'Quả', 'Bóng chuyền da PU êm tay', '/anh/sp_100.jpg');

-- Tính giá nhập ≈ 80% giá bán (làm tròn nghìn)
-- ROUND(gia_ban*0.8/1000)*1000: chia 1000 và làm tròn rồi nhân lại để giá nhập tròn hàng nghìn
UPDATE san_pham SET gia_nhap = ROUND(gia_ban * 0.8 / 1000) * 1000;

-- KHÁCH HÀNG (12 khách)
-- Chèn dữ liệu mẫu khách hàng kèm điểm tích lũy ban đầu
INSERT INTO khach_hang (ho_ten, dien_thoai, email, dia_chi, diem_tich_luy) VALUES
('Nguyễn Văn An',  '0911111111', 'an.nguyen@example.com',  'Hà Nội',          120),
('Trần Thị Bình',  '0922222222', 'binh.tran@example.com',  'Hải Phòng',       80),
('Lê Hoàng Cường', '0933333333', 'cuong.le@example.com',   'Đà Nẵng',         200),
('Phạm Thị Dung',  '0944444444', 'dung.pham@example.com',  'TP. Hồ Chí Minh', 45),
('Hoàng Minh Đức', '0955555555', 'duc.hoang@example.com',  'Cần Thơ',         15),
('Vũ Thị Hoa',     '0966666666', 'hoa.vu@example.com',     'Bình Dương',      90),
('Đặng Văn Hùng',  '0977777777', 'hung.dang@example.com',  'Nghệ An',         60),
('Bùi Thị Lan',    '0988888888', 'lan.bui@example.com',    'Hà Nội',          150),
('Đỗ Văn Minh',    '0999999999', 'minh.do@example.com',    'Huế',             30),
('Ngô Thị Ngọc',   '0900000001', 'ngoc.ngo@example.com',   'Quảng Ninh',      75),
('Dương Văn Phú',  '0900000002', 'phu.duong@example.com',  'Vũng Tàu',        0),
('Lý Thị Quỳnh',   '0900000003', 'quynh.ly@example.com',   'Nha Trang',       110);

-- =============================================================================
-- ĐƠN HÀNG MẪU (rải đều 7 ngày gần nhất). Tham chiếu sản phẩm theo id (1..52)
-- =============================================================================
-- Chèn đơn hàng mẫu; ngày tạo lùi dần bằng DATE_SUB(NOW(), INTERVAL n DAY) để rải đều 7 ngày
-- khach_hang_id = NULL nghĩa là khách lẻ (không lưu thông tin); tong_tien/thanh_tien tính sau
INSERT INTO don_hang (ma_don, khach_hang_id, nguoi_dung_id, giam_gia, phuong_thuc_thanh_toan, trang_thai, ngay_tao) VALUES
('DH1001', 1,    2, 0,      'tien_mat',     'hoan_thanh', DATE_SUB(NOW(), INTERVAL 6 DAY)),
('DH1002', 2,    2, 50000,  'chuyen_khoan', 'hoan_thanh', DATE_SUB(NOW(), INTERVAL 6 DAY)),
('DH1003', NULL, 1, 0,      'tien_mat',     'hoan_thanh', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('DH1004', 3,    2, 0,      'the',          'hoan_thanh', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('DH1005', 4,    2, 100000, 'tien_mat',     'hoan_thanh', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('DH1006', 5,    1, 0,      'chuyen_khoan', 'hoan_thanh', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('DH1007', 6,    2, 0,      'tien_mat',     'hoan_thanh', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('DH1008', NULL, 2, 0,      'tien_mat',     'hoan_thanh', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('DH1009', 7,    1, 0,      'the',          'hoan_thanh', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('DH1010', 8,    2, 50000,  'chuyen_khoan', 'hoan_thanh', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('DH1011', 9,    2, 0,      'tien_mat',     'hoan_thanh', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('DH1012', 10,   1, 0,      'tien_mat',     'hoan_thanh', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('DH1013', 11,   2, 0,      'chuyen_khoan', 'hoan_thanh', NOW()),
('DH1014', 12,   2, 0,      'tien_mat',     'hoan_thanh', NOW()),
('DH1015', 1,    1, 0,      'the',          'hoan_thanh', NOW());

-- Chi tiết đơn hàng (don_gia = giá bán hiện tại của sản phẩm theo id)
-- Mỗi lệnh dùng SELECT lồng để lấy id đơn theo ma_don và lấy gia_ban trực tiếp từ bảng san_pham
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1001'), id, 2, gia_ban, gia_ban*2 FROM san_pham WHERE id=11;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1001'), id, 1, gia_ban, gia_ban*1 FROM san_pham WHERE id=1;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1002'), id, 1, gia_ban, gia_ban*1 FROM san_pham WHERE id=6;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1002'), id, 2, gia_ban, gia_ban*2 FROM san_pham WHERE id=9;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1003'), id, 3, gia_ban, gia_ban*3 FROM san_pham WHERE id=30;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1004'), id, 1, gia_ban, gia_ban*1 FROM san_pham WHERE id=16;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1004'), id, 1, gia_ban, gia_ban*1 FROM san_pham WHERE id=19;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1005'), id, 1, gia_ban, gia_ban*1 FROM san_pham WHERE id=38;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1006'), id, 2, gia_ban, gia_ban*2 FROM san_pham WHERE id=33;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1006'), id, 3, gia_ban, gia_ban*3 FROM san_pham WHERE id=34;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1007'), id, 5, gia_ban, gia_ban*5 FROM san_pham WHERE id=43;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1008'), id, 1, gia_ban, gia_ban*1 FROM san_pham WHERE id=26;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1009'), id, 1, gia_ban, gia_ban*1 FROM san_pham WHERE id=8;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1010'), id, 4, gia_ban, gia_ban*4 FROM san_pham WHERE id=5;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1010'), id, 1, gia_ban, gia_ban*1 FROM san_pham WHERE id=4;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1011'), id, 1, gia_ban, gia_ban*1 FROM san_pham WHERE id=21;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1012'), id, 3, gia_ban, gia_ban*3 FROM san_pham WHERE id=48;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1012'), id, 1, gia_ban, gia_ban*1 FROM san_pham WHERE id=50;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1013'), id, 1, gia_ban, gia_ban*1 FROM san_pham WHERE id=2;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1014'), id, 2, gia_ban, gia_ban*2 FROM san_pham WHERE id=12;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1015'), id, 1, gia_ban, gia_ban*1 FROM san_pham WHERE id=39;
INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien)
SELECT (SELECT id FROM don_hang WHERE ma_don='DH1015'), id, 2, gia_ban, gia_ban*2 FROM san_pham WHERE id=51;

-- Cập nhật tong_tien của mỗi đơn = tổng thành tiền các dòng chi tiết (COALESCE để tránh NULL)
UPDATE don_hang d SET tong_tien = (SELECT COALESCE(SUM(thanh_tien),0) FROM chi_tiet_don_hang c WHERE c.don_hang_id=d.id);
-- Tính thành tiền = tổng tiền - giảm giá; GREATEST(0, ...) đảm bảo không bao giờ âm
UPDATE don_hang SET thanh_tien = GREATEST(0, tong_tien - giam_gia);

-- =============================================================================
-- PHIẾU NHẬP MẪU
-- =============================================================================
-- Chèn phiếu nhập mẫu; ngày tạo lùi về quá khứ bằng DATE_SUB; tong_tien tính ở lệnh cuối
INSERT INTO phieu_nhap (ma_phieu, nha_cung_cap_id, nguoi_dung_id, ghi_chu, ngay_tao) VALUES
('PN1001', 1, 1, 'Nhập vợt & cầu lông từ ShopVNB', DATE_SUB(NOW(), INTERVAL 8 DAY)),
('PN1002', 2, 1, 'Nhập bóng từ Thiên Trường Sport', DATE_SUB(NOW(), INTERVAL 4 DAY));

-- Chi tiết phiếu nhập: lấy id phiếu theo ma_phieu và gia_nhap từ bảng san_pham bằng SELECT lồng
INSERT INTO chi_tiet_phieu_nhap (phieu_nhap_id, san_pham_id, so_luong, gia_nhap, thanh_tien)
SELECT (SELECT id FROM phieu_nhap WHERE ma_phieu='PN1001'), id, 10, gia_nhap, gia_nhap*10 FROM san_pham WHERE id=1;
INSERT INTO chi_tiet_phieu_nhap (phieu_nhap_id, san_pham_id, so_luong, gia_nhap, thanh_tien)
SELECT (SELECT id FROM phieu_nhap WHERE ma_phieu='PN1001'), id, 20, gia_nhap, gia_nhap*20 FROM san_pham WHERE id=5;
INSERT INTO chi_tiet_phieu_nhap (phieu_nhap_id, san_pham_id, so_luong, gia_nhap, thanh_tien)
SELECT (SELECT id FROM phieu_nhap WHERE ma_phieu='PN1002'), id, 30, gia_nhap, gia_nhap*30 FROM san_pham WHERE id=11;
INSERT INTO chi_tiet_phieu_nhap (phieu_nhap_id, san_pham_id, so_luong, gia_nhap, thanh_tien)
SELECT (SELECT id FROM phieu_nhap WHERE ma_phieu='PN1002'), id, 15, gia_nhap, gia_nhap*15 FROM san_pham WHERE id=16;

-- Cập nhật tong_tien mỗi phiếu nhập = tổng thành tiền các dòng chi tiết (COALESCE tránh NULL)
UPDATE phieu_nhap p SET tong_tien = (SELECT COALESCE(SUM(thanh_tien),0) FROM chi_tiet_phieu_nhap c WHERE c.phieu_nhap_id=p.id);
