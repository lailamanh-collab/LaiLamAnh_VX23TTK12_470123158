# Lại Lâm Anh_VX23TTK12_470123158
# Xây Dựng website đặt dịch vụ sửa chữa nhà cửa - HomeFix

> **Xây Dựng website đặt dịch vụ sửa chữa nhà cửa - HomeFix**  
> Đồ án tốt nghiệp Công nghệ thông tin · Kiến trúc phân tầng ASP.NET Core 9 Web API & React 19 SPA · Microsoft SQL Server

---

## 1. Giới thiệu tổng quan

**HomeFix** là giải pháp phần mềm toàn diện phục vụ hoạt động đặt lịch, điều phối kỹ thuật viên và quản lý dịch vụ sửa chữa nhà cửa tận nơi. Hệ thống số hóa trọn vẹn quy trình dịch vụ gia đình: từ khi khách hàng tìm kiếm dịch vụ (Điện, Nước, Điều hòa, Thiết bị gia dụng, Bảo trì nhà cửa), nhập địa chỉ nhà, chọn khung giờ phục vụ, đến khi quản trị viên duyệt và điều phối thợ theo khu vực, kỹ thuật viên di chuyển đến tận nhà kiểm tra, báo giá thực tế, tiến hành sửa chữa, bàn giao nghiệm thu và nhận đánh giá chất lượng từ khách hàng.

### Điểm đặc sắc về nghiệp vụ
- **Chuyên biệt cho dịch vụ sửa chữa tại nhà**: Một lượt đặt lịch có thể đăng ký nhiều dịch vụ thuộc nhóm dịch vụ tương ứng, đi kèm địa chỉ nhà cụ thể (Số nhà/đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố) và mô tả sự cố thực tế.
- **Mô hình định giá kép minh bạch (Dual Pricing Model)**:
  - `FixedPrice` (Giá cố định niêm yết): Dành cho các dịch vụ chuẩn hóa như vệ sinh điều hòa, thay vòi sen, nạp gas, thay ổ cắm.
  - `InspectionRequired` (Khảo sát & báo giá tận nhà): Dành cho các sự cố phức tạp cần thợ đến đo đạc trực tiếp như chập điện âm tường, rò rỉ đường ống nước trong tường, máy lạnh không hoạt động. Kỹ thuật viên sau khi kiểm tra tại nhà sẽ cập nhật chi phí thực tế minh bạch.
- **Quản lý khung giờ & Chống quá tải phục vụ (Slot & Capacity Management)**: Khách hàng chọn các khung giờ hệ thống cung cấp (08:00 - 17:30). Backend tự động kiểm tra công suất tiếp nhận theo từng khu vực và ngày phục vụ, ngăn chặn tình trạng quá tải hoặc trùng giờ.
- **Phân quyền và bảo mật nghiêm ngặt (Role-based Security)**:
  - Khách hàng (Customer) chỉ quản lý và theo dõi lịch hẹn của chính mình.
  - Kỹ thuật viên (Technician) chỉ xem và thao tác trên các ca sửa chữa được phân công theo khu vực công tác.
  - Quản trị viên (Admin) nắm toàn quyền điều phối, phân công thợ, quản lý danh mục dịch vụ, bảng giá và giám sát hệ thống.
- **Quy trình trạng thái chuẩn dịch vụ tại nhà (State Workflow)**:
  - Lịch hẹn tuân thủ workflow tuần tự 7 bước:  
    `Pending` (Chờ xác nhận) ➜ `Confirmed` (Đã xác nhận) ➜ `Assigned` (Đã phân công) ➜ `OnTheWay` (Đang di chuyển đến nhà) ➜ `Inspecting` (Đang kiểm tra & chẩn đoán) ➜ `Repairing` (Đang sửa chữa) ➜ `Completed` (Hoàn thành nghiệm thu).  
    Hỗ trợ trạng thái `Cancelled` (Đã hủy) khi khách hàng hoặc quản trị viên hủy lịch hợp lệ.
- **Đánh giá dịch vụ minh bạch**: Khách hàng chỉ có thể đánh giá và chấm điểm sao đối với các ca sửa chữa đã hoàn thành thực tế (`Completed`).

---

## 2. Công nghệ sử dụng

- **Frontend**:
  - React 19, TypeScript
  - Vite 8, Tailwind CSS v4, Vanilla CSS Custom Design System
  - React Router DOM v7
  - Lucide React Icons
- **Backend**:
  - ASP.NET Core 9 Web API (.NET 9)
  - Entity Framework Core 9 (Code-First Migrations)
  - Microsoft SQL Server
  - ASP.NET Core Identity & JWT Authentication (Bearer Tokens)
  - Swashbuckle Swagger UI (API Documentation)
- **Kiến trúc**:
  - Phân tầng Clean Architecture (Controllers, Services, DTOs, Domain Entities, Data/DbContext, Middleware, Validators)
  - Global Exception Handling Middleware

---

## 3. Hướng dẫn Cài đặt & Khởi chạy Hệ thống

### 3.1. Yêu cầu môi trường (Prerequisites)
1. **Hệ điều hành**: Windows 10/11 (khuyến nghị), macOS hoặc Linux.
2. **.NET SDK**: Phiên bản **.NET 9.0 SDK** (kiểm tra bằng `dotnet --version`).
3. **Node.js**: Phiên bản **Node.js 20.x hoặc 22.x LTS** kèm `npm` (kiểm tra bằng `node -v`).
4. **Cơ sở dữ liệu**: **Microsoft SQL Server** (bản Developer, Express, Standard) hoặc LocalDB.
5. **Entity Framework Core CLI**: Cài đặt công cụ toàn cục nếu chưa có:
   ```bash
   dotnet tool install --global dotnet-ef
   ```

---

### 3.2. Cấu hình Cơ sở dữ liệu (Microsoft SQL Server)
Mở file cấu hình `src/backend/HomeRepairBooking.Api/appsettings.json` và kiểm tra chuỗi kết nối `DefaultConnection`:

* **Trường hợp 1 (Windows Authentication / Mặc định)**:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=HomeRepairBooking;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
  }
  ```
* **Trường hợp 2 (SQL Server Authentication với tài khoản `sa`)**:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=HomeRepairBooking;User Id=sa;Password=MatKhauCuaBan;TrustServerCertificate=True;MultipleActiveResultSets=True"
  }
  ```
* **Trường hợp 3 (SQL Server Express named instance)**:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=HomeRepairBooking;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
  }
  ```

---

### 3.3. Chạy Migration & Khởi tạo Dữ liệu Mẫu (Seed Data)
Mở terminal tại thư mục gốc của dự án và chạy lệnh sau để tự động tạo cơ sở dữ liệu và nạp dữ liệu ban đầu:
```bash
dotnet ef database update --project src/backend/HomeRepairBooking.Api
```
> **Dữ liệu được nạp tự động bao gồm**:
> - 5 Nhóm dịch vụ chính: Điện dân dụng, Nước & Đường ống, Điện lạnh & Điều hòa, Thiết bị gia dụng, Sửa chữa & Bảo trì nhà cửa.
> - 23 Dịch vụ sửa chữa chi tiết kèm đơn giá niêm yết và phân loại giá.
> - 8 Khu vực phục vụ & trạm kỹ thuật tại Hà Nội, TP.HCM, Đà Nẵng (Quận 1, Quận 3, Cầu Giấy, Đống Đa, Hai Bà Trưng...).
> - Đội ngũ kỹ thuật viên kèm lịch trực tuần.
> - Lịch hẹn mẫu đa trạng thái và đánh giá trải nghiệm thực tế.

---

### 3.4. Khởi chạy Backend API (.NET 9)
Từ thư mục gốc dự án hoặc thư mục backend:
```bash
dotnet run --project src/backend/HomeRepairBooking.Api
```
Backend API sẽ khởi động và lắng nghe tại các địa chỉ:
* **API Base URL**: `http://localhost:5088`
* **Swagger UI (Tài liệu API tương tác)**: `http://localhost:5088/swagger`
* **Health Check Endpoint**: `http://localhost:5088/api/health`

---

### 3.5. Cài đặt Thư viện & Khởi chạy Frontend Web App (React 19)
Mở một cửa sổ terminal mới và di chuyển vào thư mục frontend:
```bash
cd src/frontend
npm install
npm run dev
```
Mở trình duyệt web và truy cập hệ thống tại:
* **Web Application**: `http://localhost:5173`

---

## 4. Tài khoản Demo Sẵn sàng Thử nghiệm

Hệ thống đã chuẩn bị sẵn các tài khoản demo đại diện cho cả 3 vai trò:

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn & Trách nhiệm |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@homerepair.local` | `Admin@12345` | Toàn quyền quản trị hệ thống: Dashboard chỉ huy, duyệt lịch hẹn, phân công thợ theo khu vực, quản lý nhóm dịch vụ, dịch vụ, bảng giá, trạm kỹ thuật, khách hàng, duyệt đánh giá và báo cáo doanh thu. |
| **Kỹ thuật viên 1 (Technician)** | `technician@homerepair.local` | `Tech@12345` | KTV Chuyên trách Điện Nước (Khu vực Quận 1 / Hà Nội). Nhận việc được phân công, di chuyển đến nhà khách hàng, kiểm tra, cập nhật chi phí thực tế và hoàn thành ca sửa. |
| **Kỹ thuật viên 2 (Technician)** | `technician2@homerepair.local` | `Tech2@12345` | KTV Chuyên trách Điện Lạnh & Điều hòa (Khu vực Cầu Giấy / Đống Đa). Tiếp nhận ca sửa điều hòa, máy giặt tận nhà. |
| **Khách hàng (Customer)** | `customer@homerepair.local` | `Customer@12345` | Khách hàng mẫu đã có sẵn lịch sử đặt hẹn, địa chỉ nhà lưu sẵn và thiết bị gia đình. Có thể đặt thêm lịch hẹn mới tại nhà. |

*Lưu ý: Người dùng cũng có thể bấm nút **Đăng ký** trên thanh điều hướng để tạo tài khoản Khách hàng mới bất kỳ lúc nào.*

---

## 5. Kịch bản Kiểm thử Nghiệp vụ Mẫu

### Kịch bản 1: Khách hàng Đặt lịch Sửa chữa Tại Nhà & Theo dõi Tiến độ
1. Truy cập `http://localhost:5173`, bấm nút **"Đặt lịch ngay"** (hoặc đăng nhập tài khoản Khách hàng).
2. **Bước 1 (Chọn dịch vụ)**: Chọn nhóm dịch vụ (ví dụ: *Điện dân dụng*) -> Chọn dịch vụ (*Xử lý chập điện & nhảy CB*, *Thay ổ cắm âm tường*).
3. **Bước 2 (Mô tả sự cố)**: Nhập thông tin sự cố (ví dụ: *Ổ cắm sau tivi có mùi khét, nhảy aptomat liên tục*).
4. **Bước 3 (Địa chỉ sửa chữa)**: Nhập họ tên, số điện thoại người liên hệ, địa chỉ nhà chi tiết (Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố).
5. **Bước 4 (Ngày & Khung giờ)**: Chọn ngày cần thợ đến và khung giờ còn trống (Slot). Hệ thống tự động kiểm tra công suất phục vụ theo khu vực.
6. **Bước 5 (Xác nhận)**: Kiểm tra bảng tóm tắt chi phí dự kiến, địa chỉ đến sửa và xác nhận đặt lịch. Hệ thống cấp mã lịch hẹn duy nhất (ví dụ: `HRB-20261015-0001`).
7. Chuyển sang mục **"Lịch của tôi"** để theo dõi timeline tiến độ phục vụ theo thời gian thực.

### Kịch bản 2: Quản trị viên Điều phối & Kỹ thuật viên Thực hiện Tác nghiệp
1. Đăng nhập tài khoản **Admin** (`admin@homerepair.local` / `Admin@12345`).
2. Vào **Quản lý Lịch hẹn** (`/admin/bookings`), bấm xác nhận lịch hẹn mới và phân công kỹ thuật viên phù hợp với khu vực phục vụ.
3. Đăng xuất và đăng nhập tài khoản **Technician** được gán việc (`technician@homerepair.local` / `Tech@12345`).
4. Vào Bàn làm việc KTV (`/technician`), chọn ca sửa chữa và cập nhật trạng thái tác nghiệp tận nhà tuần tự:
   * **Bắt đầu di chuyển (`OnTheWay`)**: Báo khách hàng thợ đang đến địa chỉ.
   * **Đang kiểm tra (`Inspecting`)**: Thợ đến nhà, kiểm tra sự cố, cập nhật chẩn đoán kỹ thuật và chi phí thực tế.
   * **Bắt đầu sửa chữa (`Repairing`)**: Tiến hành thay thế linh kiện, xử lý sự cố.
   * **Hoàn thành sửa chữa (`Completed`)**: Khách hàng nghiệm thu thiết bị hoạt động tốt và thanh toán.
5. Sau khi hoàn thành, Khách hàng vào lại mục **"Lịch của tôi"** -> Tab **"Đánh giá"** để chấm điểm sao và gửi nhận xét dịch vụ.

---

## 6. Các phân hệ chức năng chính

### 1. Phân hệ Khách hàng (Customer Portal)
- **Trang chủ dịch vụ**: Giới thiệu các nhóm dịch vụ sửa nhà, quy trình phục vụ 4 bước tại nhà, bảng cam kết chất lượng, mạng lưới khu vực và đánh giá từ khách hàng thực tế.
- **Danh mục Dịch vụ & Bảng giá**: Tra cứu bảng giá minh bạch theo từng nhóm dịch vụ (Điện, Nước, Điều hòa, Thiết bị gia dụng, Bảo trì).
- **Khu vực phục vụ (Service Areas)**: Danh sách các trạm điều phối thợ hỗ trợ theo quận huyện tại Hà Nội, TP.HCM, Đà Nẵng.
- **Trung tâm hỗ trợ**: Chính sách bảo hành, quy trình xử lý sự cố khẩn cấp và giải đáp thắc mắc thường gặp (FAQ).
- **Xác thực người dùng**: Đăng ký tài khoản, đăng nhập JWT, quản lý hồ sơ cá nhân và đổi mật khẩu an toàn.
- **Booking Wizard 5 bước**: Quy trình đặt lịch thông minh kèm xác thực địa chỉ nhà và kiểm tra slot thời gian thực.
- **Trang Lịch của tôi & Chi tiết lịch hẹn**: Timeline 7 trạng thái trực quan, theo dõi thông tin thợ phụ trách, chi phí dự kiến, chi phí thực tế sau kiểm tra và ghi chú kỹ thuật.
- **Hủy lịch hẹn**: Cho phép khách hàng hủy lịch khi đơn chưa được xử lý.
- **Đánh giá & Chấm điểm sao**: Gửi đánh giá đối với các ca sửa chữa đã hoàn thành.

### 2. Phân hệ Kỹ thuật viên (Technician Portal)
- **Bàn làm việc Kỹ thuật viên (`/technician`)**:
  - Dashboard chỉ số: Số ca được giao, ca đang đến, ca đang kiểm tra, ca đang sửa, ca hoàn thành, đánh giá sao trung bình.
  - Danh sách công việc theo ngày và theo trạng thái kèm bộ lọc nhanh.
- **Chi tiết ca sửa chữa tại nhà**:
  - Xem thông tin khách hàng, số điện thoại liên hệ, địa chỉ nhà chi tiết kèm ghi chú đường đi.
  - Cập nhật quy trình tác nghiệp tuần tự: Đang di chuyển ➜ Đang kiểm tra ➜ Đang sửa chữa ➜ Hoàn thành.
  - Cập nhật chẩn đoán sự cố, giải pháp khắc phục, ghi chú kỹ thuật và cập nhật chi phí thực tế (`ActualPrice`).
- **Lịch trực tuần**: Xem lịch phân ca làm việc trong tuần theo khu vực phụ trách.
- **Lịch sử công việc**: Tra cứu các ca sửa chữa đã hoàn tất và doanh thu mang lại.

### 3. Phân hệ Quản trị viên (Admin Portal)
- **Admin Dashboard (`/admin/dashboard`)**:
  - 8 thẻ chỉ số KPI thời gian thực (Lịch hôm nay, Chờ duyệt, Đã phân công, Đang sửa, Hoàn thành, Tổng khách hàng, Đội ngũ KTV, Tổng doanh thu).
  - 6 biểu đồ phân tích trực quan: Lịch theo ngày, Phân bố trạng thái, Top dịch vụ được đặt nhiều nhất, Top nhóm dịch vụ phổ biến, Lịch theo khu vực phục vụ, Doanh thu theo tháng.
- **Quản lý Lịch hẹn (`/admin/bookings`)**: Tìm kiếm theo mã lịch/tên khách, lọc theo trạng thái/ngày/khu vực/KTV, duyệt lịch hẹn, điều phối phân công kỹ thuật viên theo khu vực, cập nhật tình trạng.
- **Quản lý Danh mục & Dịch vụ (`/admin/catalog`)**: CRUD Nhóm dịch vụ (Service Categories) và Dịch vụ sửa chữa (Repair Services), cấu hình đơn giá cơ sở và loại giá (`FixedPrice` / `InspectionRequired`).
- **Quản lý Khu vực & Kỹ thuật viên (`/admin/operations`)**: Quản lý khu vực phục vụ, cấu hình công suất tiếp nhận mỗi slot, tạo tài khoản KTV, gán khu vực công tác và cấu hình lịch trực tuần.
- **Quản lý Khách hàng (`/admin/customers`)**: Danh sách khách hàng, lịch sử đặt hẹn, kích hoạt/khóa tài khoản.
- **Quản lý Đánh giá (`/admin/reviews`)**: Thống kê điểm sao trung bình, lọc đánh giá, kiểm duyệt ẩn/hiện phản hồi trên trang chủ.
- **Báo cáo Thống kê Chuyên sâu (`/admin/reports`)**: Lọc theo khoảng ngày tùy biến hoặc preset nhanh (Hôm nay, 7 ngày, 30 ngày, Tháng này), lọc theo khu vực/KTV/trạng thái; bảng xếp hạng năng suất KTV, hiệu suất khu vực, báo cáo dịch vụ và báo cáo nhóm dịch vụ.

---

## 7. Cấu trúc thư mục mã nguồn

```text
Home Repair System/
├── README.md                           # Tài liệu hướng dẫn sử dụng và triển khai dự án
├── src/
│   ├── backend/
│   │   ├── HomeRepairBooking.sln       # Solution .NET 9
│   │   └── HomeRepairBooking.Api/
│   │       ├── Controllers/            # API Endpoints (Auth, Bookings, TechJobs, Admin, Catalog, Reports...)
│   │       ├── Data/                   # ApplicationDbContext & DbSeeder
│   │       ├── DTOs/                   # Data Transfer Objects
│   │       ├── Domain/                 # Domain Entities (Booking, ServiceCategory, RepairService, ServiceArea...)
│   │       ├── Enums/                  # BookingStatus, PricingType, WeekDay
│   │       ├── Middleware/             # ExceptionHandlingMiddleware
│   │       ├── Migrations/             # EF Core Code-First Migrations
│   │       ├── Services/               # Business Logic & Rules Implementation
│   │       ├── Validators/             # Input & Business Validation Rules
│   │       └── Program.cs              # DI, JWT, Middleware & App Startup
│   └── frontend/
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
│           ├── api/                    # Typed API Client Services
│           ├── auth/                   # AuthContext, AuthModal & Token Management
│           ├── components/             # UI Components (SiteHeader, SiteFooter, Modals, Cards)
│           ├── pages/                  # Page Views (Home, Services, Pricing, BookingWizard, Tech, Admin...)
│           ├── index.css               # Design System & Responsive Styles
│           └── App.tsx                 # Routing, Guards & Layout Providers
└── releases/                           # Thư mục lưu trữ các bản phát hành ZIP của từng Phase
```

---

## 8. Giấy phép & Thông tin liên hệ

- **Tác giả**: Đồ án tốt nghiệp Công nghệ thông tin
- **Bản quyền**: © 2026 HomeFix - Dịch vụ Sửa chữa Nhà cửa Tại nhà.
- **Hỗ trợ**: `hotro@homerepair.local` | Hotline: `1900 8899`
