using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PhoneRepairBooking.Api.Domain;
using PhoneRepairBooking.Api.Services;

namespace PhoneRepairBooking.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var roles = services.GetRequiredService<RoleManager<IdentityRole>>();
        var users = services.GetRequiredService<UserManager<ApplicationUser>>();
        var db = services.GetRequiredService<AppDbContext>();

        foreach (var role in AppRoles.All)
        {
            if (!await roles.RoleExistsAsync(role))
            {
                await roles.CreateAsync(new IdentityRole(role));
            }
        }

        // Demo Accounts (Supports both homerepair.local and phonerepair.local)
        await EnsureUserAsync(users, "admin@homerepair.local", "Quản trị viên hệ thống", "0901000001", "Admin@12345", AppRoles.Admin);
        await EnsureUserAsync(users, "technician@homerepair.local", "Nguyễn Văn Nam (KTV Điện Nước)", "0901000002", "Tech@12345", AppRoles.Technician);
        await EnsureUserAsync(users, "technician2@homerepair.local", "Trần Đình Quang (KTV Điện Lạnh)", "0901000004", "Tech2@12345", AppRoles.Technician);
        await EnsureUserAsync(users, "customer@homerepair.local", "Lê Hoàng Phúc", "0901000003", "Customer@12345", AppRoles.Customer);

        // Aliases for previous credentials
        await EnsureUserAsync(users, "admin@phonerepair.local", "Quản trị viên hệ thống", "0901000001", "Admin@12345", AppRoles.Admin);
        await EnsureUserAsync(users, "technician@phonerepair.local", "Nguyễn Văn Nam (KTV Điện Nước)", "0901000002", "Tech@12345", AppRoles.Technician);
        await EnsureUserAsync(users, "technician2@phonerepair.local", "Trần Đình Quang (KTV Điện Lạnh)", "0901000004", "Tech2@12345", AppRoles.Technician);
        await EnsureUserAsync(users, "customer@phonerepair.local", "Lê Hoàng Phúc", "0901000003", "Customer@12345", AppRoles.Customer);

        await SeedServiceAreasAndTechniciansAsync(db, users);
        await SeedCatalogAsync(db);
        await SeedSampleBookingsAsync(db, users);
    }

    private static async Task SeedServiceAreasAndTechniciansAsync(AppDbContext db, UserManager<ApplicationUser> users)
    {
        var existingNames = await db.ServiceAreas.Select(b => b.Name).ToListAsync();
        var areas = new List<ServiceArea>
        {
            NewArea("Khu vực Quận 1 & Quận 3", "TP. Hồ Chí Minh", "12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM", "028 1111 0001"),
            NewArea("Khu vực Bình Thạnh & Phú Nhuận", "TP. Hồ Chí Minh", "207 Phan Đăng Lưu, Phường 1, Bình Thạnh, TP.HCM", "028 1111 0021"),
            NewArea("Khu vực Quận 7 & Nhà Bè", "TP. Hồ Chí Minh", "45 Nguyễn Văn Linh, Tân Phong, Quận 7, TP.HCM", "028 1111 0007"),
            NewArea("Khu vực Gò Vấp & Tân Bình", "TP. Hồ Chí Minh", "598 Quang Trung, Phường 11, Gò Vấp, TP.HCM", "028 1111 0022"),
            NewArea("Khu vực Cầu Giấy & Nam Từ Liêm", "Hà Nội", "123 Cầu Giấy, Quan Hoa, Cầu Giấy, Hà Nội", "024 1234 5678"),
            NewArea("Khu vực Đống Đa & Ba Đình", "Hà Nội", "456 Xã Đàn, Nam Đồng, Đống Đa, Hà Nội", "024 2345 6789"),
            NewArea("Khu vực Thanh Xuân & Hà Đông", "Hà Nội", "321 Nguyễn Trãi, Thanh Xuân, Hà Nội", "024 3456 1122"),
            NewArea("Khu vực Hải Châu & Thanh Khê", "Đà Nẵng", "152 Hàm Nghi, Thạc Gián, Hải Châu, Đà Nẵng", "0236 3888 123")
        };

        var toAdd = areas.Where(a => !existingNames.Contains(a.Name)).ToList();
        if (toAdd.Count > 0)
        {
            db.ServiceAreas.AddRange(toAdd);
            await db.SaveChangesAsync();
        }

        var tech1 = await users.FindByEmailAsync("technician@homerepair.local") ?? await users.FindByEmailAsync("technician@phonerepair.local");
        var tech2 = await users.FindByEmailAsync("technician2@homerepair.local") ?? await users.FindByEmailAsync("technician2@phonerepair.local");

        var a1 = await db.ServiceAreas.FirstOrDefaultAsync(a => a.Name.Contains("Quận 1") || a.Name.Contains("Cầu Giấy"));
        var a2 = await db.ServiceAreas.FirstOrDefaultAsync(a => a.Name.Contains("Bình Thạnh") || a.Name.Contains("Đống Đa"));

        if (tech1 is not null && a1 is not null && !await db.Technicians.AnyAsync(t => t.UserId == tech1.Id))
        {
            db.Technicians.Add(NewTechnician(tech1.Id, a1.Id, "Kỹ thuật viên Điện Nước chuyên nghiệp"));
        }

        if (tech2 is not null && a2 is not null && !await db.Technicians.AnyAsync(t => t.UserId == tech2.Id))
        {
            db.Technicians.Add(NewTechnician(tech2.Id, a2.Id, "Kỹ thuật viên Điện Lạnh & Điều hòa"));
        }

        await db.SaveChangesAsync();
    }

    private static ServiceArea NewArea(string name, string city, string address, string phone)
    {
        var area = new ServiceArea
        {
            Name = name,
            City = city,
            Address = address,
            Phone = phone,
            CapacityPerSlot = 4,
            SlotMinutes = 60,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var hour in BranchService.DefaultHours())
        {
            area.OpeningHours.Add(new ServiceAreaOpeningHour
            {
                DayOfWeek = hour.DayOfWeek,
                IsOpen = hour.IsOpen,
                OpenTime = TimeOnly.Parse(hour.OpenTime),
                CloseTime = TimeOnly.Parse(hour.CloseTime)
            });
        }

        return area;
    }

    private static Technician NewTechnician(string userId, int areaId, string specialty)
    {
        var technician = new Technician
        {
            UserId = userId,
            ServiceAreaId = areaId,
            Specialty = specialty,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        foreach (DayOfWeek day in Enum.GetValues<DayOfWeek>())
        {
            technician.Schedules.Add(new TechnicianSchedule
            {
                DayOfWeek = day,
                IsWorking = day != DayOfWeek.Sunday,
                StartTime = new TimeOnly(8, 0),
                EndTime = new TimeOnly(18, 0)
            });
        }

        return technician;
    }

    private static async Task SeedCatalogAsync(AppDbContext db)
    {
        if (await db.ServiceCategories.AnyAsync())
        {
            return;
        }

        var catDien = new ServiceCategory
        {
            Name = "Sửa chữa Điện",
            Slug = "sua-chua-dien",
            IconName = "⚡",
            Description = "Xử lý sự cố chập điện, nhảy CB aptomat, thay công tắc, ổ cắm, lắp đèn chiếu sáng và tủ điện gia đình.",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var catNuoc = new ServiceCategory
        {
            Name = "Sửa chữa Nước",
            Slug = "sua-chua-nuoc",
            IconName = "🚰",
            Description = "Khắc phục rò rỉ đường ống nước, thay vòi sen tắm, sửa bồn cầu rỉ nước, thông tắc chậu rửa và thoát sàn.",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var catDieuHoa = new ServiceCategory
        {
            Name = "Điện lạnh & Điều hòa",
            Slug = "dieu-hoa-dien-lanh",
            IconName = "❄️",
            Description = "Vệ sinh bảo dưỡng máy lạnh định kỳ, nạp gas, xử lý điều hòa chảy nước, sửa máy giặt, tủ lạnh tại nhà.",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var catGiaDung = new ServiceCategory
        {
            Name = "Thiết bị gia dụng",
            Slug = "thiet-bi-gia-dung",
            IconName = "🧺",
            Description = "Sửa bình nóng lạnh không nóng / rò điện, máy lọc nước RO, bếp từ, quạt hút mùi và thiết bị gia đình.",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var catBaoTri = new ServiceCategory
        {
            Name = "Bảo trì & Sửa chữa nhà",
            Slug = "bao-tri-nha-cua",
            IconName = "🛠️",
            Description = "Chống thấm dột trần tường, sửa chữa cửa đi, thay ổ khóa an toàn, vá thạch cao và bảo trì tổng thể nhà.",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        db.ServiceCategories.AddRange(catDien, catNuoc, catDieuHoa, catGiaDung, catBaoTri);
        await db.SaveChangesAsync();

        var services = new List<RepairService>
        {
            // ĐIỆN
            NewService(catDien, "Lắp đặt & thay mới công tắc, ổ cắm điện", 120000, PricingType.FixedPrice, "30 - 45 phút", "Kiểm tra, đấu nối an toàn và thay mới ổ cắm, công tắc âm tường chất lượng cao."),
            NewService(catDien, "Thay thế Aptomat / CB tổng gia đình", 250000, PricingType.FixedPrice, "30 - 60 phút", "Thay mới aptomat chống giật, chống quá tải, kiểm tra tải dây nguồn an toàn."),
            NewService(catDien, "Xử lý sự cố chập điện âm tường / nhảy CB liên tục", null, PricingType.InspectionRequired, "60 - 90 phút", "Dò tìm điểm chập bằng thiết bị chuyên dụng, cách ly sự cố và phục hồi nguồn điện an toàn."),
            NewService(catDien, "Lắp đặt đèn LED, đèn trang trí trần & rọi tranh", 150000, PricingType.FixedPrice, "30 - 60 phút", "Lắp đặt hệ thống đèn chiếu sáng gia đình, đi dây gọn gàng, thẩm mỹ."),
            NewService(catDien, "Nâng cấp và cải tạo đường dây điện nguồn sinh hoạt", null, PricingType.InspectionRequired, "90 - 180 phút", "Khảo sát phụ tải, tư vấn tiết diện dây và thi công hệ thống điện đạt chuẩn PCCC."),

            // NƯỚC
            NewService(catNuoc, "Thay vòi nước, vòi sen tắm, xi phông chậu rửa", 150000, PricingType.FixedPrice, "30 - 45 phút", "Thay mới phụ kiện vòi nước rò rỉ, han gỉ, lắp đặt kín nước 100%."),
            NewService(catNuoc, "Sửa chữa rò rỉ đường ống cấp & thoát nước", null, PricingType.InspectionRequired, "45 - 90 phút", "Xử lý bục vỡ ống nước âm tường hoặc lộ thiên, hàn ống nhiệt PPR, dán keo PVC chuẩn."),
            NewService(catNuoc, "Thông tắc chậu rửa bát, lavabo, thoát sàn", 250000, PricingType.FixedPrice, "30 - 60 phút", "Sử dụng máy lò xo chuyên dụng đánh tan cặn mỡ, rác hữu cơ, thông thoát nhanh chóng."),
            NewService(catNuoc, "Sửa bộ xả bồn cầu, bồn cầu rỉ nước liên tục", 200000, PricingType.FixedPrice, "30 - 45 phút", "Thay thế gioăng cao su, cọc cấp, cọc xả, căn chỉnh mức nước chống thất thoát nước sạch."),
            NewService(catNuoc, "Lắp đặt bồn cầu, bồn rửa chén bát mới", 350000, PricingType.FixedPrice, "60 - 90 phút", "Lắp đặt bồn cầu chuẩn kỹ thuật, dán keo silicon hoặc trát xi măng trắng chống hôi."),

            // ĐIỀU HÒA
            NewService(catDieuHoa, "Vệ sinh bảo dưỡng điều hòa treo tường (1.0 - 2.5 HP)", 200000, PricingType.FixedPrice, "45 - 60 phút", "Vệ sinh dàn nóng, dàn lạnh bằng máy xịt áp lực, thông ống thoát nước, khử mùi vi khuẩn."),
            NewService(catDieuHoa, "Vệ sinh điều hòa âm trần / cassette văn phòng", 400000, PricingType.FixedPrice, "60 - 90 phút", "Tháo mặt nạ, vệ sinh máng nước ngưng, rửa sạch lưới lọc và dàn tản nhiệt."),
            NewService(catDieuHoa, "Khắc phục điều hòa chảy nước ngược vào phòng", 250000, PricingType.FixedPrice, "30 - 60 phút", "Thông ống thoát nước ngưng, bọc lại bảo ôn ống đồng và căn chỉnh độ nghiêng máng nước."),
            NewService(catDieuHoa, "Kiểm tra rò rỉ & nạp gas điều hòa (R22 / R32 / R410A)", 350000, PricingType.FixedPrice, "45 - 60 phút", "Đo áp suất gas hút, kiểm tra giắc co và nạp bổ sung gas chính hãng đúng định mức."),
            NewService(catDieuHoa, "Sửa điều hòa không mát, báo lỗi bo mạch", null, PricingType.InspectionRequired, "60 - 90 phút", "Kiểm tra tụ quạt, block máy nén, cảm biến nhiệt độ và khắc phục bo mạch."),
            NewService(catDieuHoa, "Sửa máy giặt không vắt, kêu to, rung lắc mạnh", null, PricingType.InspectionRequired, "45 - 90 phút", "Kiểm tra thụt giảm xóc, dây curoa, hộp số và bo mạch điều khiển máy giặt."),
            NewService(catDieuHoa, "Sửa tủ lạnh không đông đá, hỏng block, hở cánh", null, PricingType.InspectionRequired, "60 - 90 phút", "Kiểm tra sò lạnh, điện trở sấy tuyết, rơ le nhiệt và quạt dàn lạnh."),

            // GIA DỤNG
            NewService(catGiaDung, "Bảo dưỡng & sục rửa bình nóng lạnh", 250000, PricingType.FixedPrice, "45 - 60 phút", "Súc rửa cặn canxi đáy bình, thay thanh magie chống ăn mòn thanh đốt gia nhiệt."),
            NewService(catGiaDung, "Sửa bình nóng lạnh không nóng / rò rỉ nước", null, PricingType.InspectionRequired, "45 - 60 phút", "Khắc phục hỏng rơ le nhiệt, thủng bình, rò điện ELCB bảo đảm an toàn tính mạng."),
            NewService(catGiaDung, "Bảo dưỡng & thay lõi lọc nước máy RO tại nhà", 200000, PricingType.FixedPrice, "30 - 45 phút", "Kiểm tra chỉ số TDS, đo áp lực bơm, thay lõi lọc thô 1-2-3 và màng lọc RO."),
            NewService(catGiaDung, "Sửa bếp từ không nhận nồi, chập nguồn không lên", null, PricingType.InspectionRequired, "45 - 60 phút", "Kiểm tra sò công suất IGBT, cầu chì, cảm biến nhiệt mâm từ."),

            // BẢO TRÌ NHÀ
            NewService(catBaoTri, "Xử lý chống thấm sàn vệ sinh, ban công, tường nứt", null, PricingType.InspectionRequired, "120 - 240 phút", "Quét màng chống thấm polyurethane / sika thẩm thấu, xử lý triệt để ngấm dột."),
            NewService(catBaoTri, "Sửa chữa, căn chỉnh & thay mới khóa cửa các loại", 180000, PricingType.FixedPrice, "30 - 45 phút", "Thay ổ khóa gạt, khóa tròn, căn chỉnh bản lề cửa gỗ, cửa nhôm kính bị xệ.")
        };

        db.RepairServices.AddRange(services);
        await db.SaveChangesAsync();
    }

    private static RepairService NewService(ServiceCategory category, string name, decimal? basePrice, PricingType pricingType, string duration, string description) => new()
    {
        ServiceCategoryId = category.Id,
        ServiceCategory = category,
        Name = name,
        Slug = Slugger.Make(name),
        BasePrice = basePrice,
        PricingType = pricingType,
        EstimatedDuration = duration,
        Description = description,
        IsActive = true,
        CreatedAt = DateTime.UtcNow
    };

    private static async Task SeedSampleBookingsAsync(AppDbContext db, UserManager<ApplicationUser> users)
    {
        if (await db.Bookings.AnyAsync())
        {
            return;
        }

        var customer = await users.FindByEmailAsync("customer@homerepair.local") ?? await users.FindByEmailAsync("customer@phonerepair.local");
        var tech = await db.Technicians.Include(t => t.User).FirstOrDefaultAsync();
        var area = await db.ServiceAreas.FirstOrDefaultAsync();
        var allServices = await db.RepairServices.ToListAsync();

        if (customer is null || area is null || allServices.Count == 0)
        {
            return;
        }

        var sVesinh = allServices.FirstOrDefault(s => s.Name.Contains("Vệ sinh bảo dưỡng điều hòa")) ?? allServices[0];
        var sThayVoi = allServices.FirstOrDefault(s => s.Name.Contains("Thay vòi nước")) ?? allServices[1];
        var sChapDien = allServices.FirstOrDefault(s => s.Name.Contains("chập điện")) ?? allServices[2];
        var sBinhNong = allServices.FirstOrDefault(s => s.Name.Contains("bình nóng lạnh")) ?? allServices[3];

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // 1. Completed Booking with Review
        var b1 = new Booking
        {
            BookingCode = $"HRS-{today.AddDays(-2):yyyyMMdd}-001",
            CustomerId = customer.Id,
            CustomerName = customer.FullName,
            CustomerPhone = customer.PhoneNumber ?? "0901000003",
            AddressLine = "Căn hộ 802, Tháp A, Chung cư Masteri Thảo Điền",
            Ward = "Phường Thảo Điền",
            District = "TP. Thủ Đức",
            City = "TP. Hồ Chí Minh",
            ServiceAreaId = area.Id,
            TechnicianId = tech?.Id,
            AppointmentDate = today.AddDays(-2),
            SlotStart = new TimeOnly(9, 0),
            SlotEnd = new TimeOnly(10, 0),
            Status = BookingStatus.Completed,
            ProblemDescription = "Điều hòa phòng ngủ chính chạy yếu, có mùi hôi và chảy nước nhẹ xuống sàn gỗ.",
            EstimatedTotal = sVesinh.BasePrice ?? 200000,
            ActualCost = 250000,
            Diagnosis = "Dàn lạnh bám nhiều bụi bẩn, máng nước ngưng bị tắc màng nhầy hữu cơ gây tràn.",
            RepairNotes = "Đã thông ống thoát nước, xịt rửa sạch dàn tản nhiệt, kiểm tra áp suất gas 75 PSI đạt chuẩn.",
            RepairSolution = "Vệ sinh chuyên sâu xịt áp lực và thông thông ống dẫn nước thải.",
            OnTheWayAt = DateTime.UtcNow.AddDays(-2).AddHours(1),
            InspectionStartedAt = DateTime.UtcNow.AddDays(-2).AddHours(1).AddMinutes(20),
            RepairStartedAt = DateTime.UtcNow.AddDays(-2).AddHours(1).AddMinutes(35),
            CompletedAt = DateTime.UtcNow.AddDays(-2).AddHours(2).AddMinutes(30),
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            Services =
            [
                new BookingServiceLine
                {
                    RepairServiceId = sVesinh.Id,
                    ServiceName = sVesinh.Name,
                    PricingType = sVesinh.PricingType,
                    UnitPrice = sVesinh.BasePrice
                }
            ],
            StatusHistory =
            [
                new BookingStatusHistory { ToStatus = BookingStatus.Pending, Note = "Khách đặt lịch trực tuyến.", ChangedByUserId = customer.Id, ChangedAt = DateTime.UtcNow.AddDays(-3) },
                new BookingStatusHistory { FromStatus = BookingStatus.Pending, ToStatus = BookingStatus.Confirmed, Note = "Admin xác nhận.", ChangedByUserId = "system", ChangedAt = DateTime.UtcNow.AddDays(-2) },
                new BookingStatusHistory { FromStatus = BookingStatus.Confirmed, ToStatus = BookingStatus.Assigned, Note = "Admin phân công kỹ thuật viên.", ChangedByUserId = "system", ChangedAt = DateTime.UtcNow.AddDays(-2) },
                new BookingStatusHistory { FromStatus = BookingStatus.Assigned, ToStatus = BookingStatus.OnTheWay, Note = "Thợ đang di chuyển đến nhà.", ChangedByUserId = tech?.UserId, ChangedAt = DateTime.UtcNow.AddDays(-2).AddHours(1) },
                new BookingStatusHistory { FromStatus = BookingStatus.OnTheWay, ToStatus = BookingStatus.Inspecting, Note = "Thợ đã đến nơi kiểm tra.", ChangedByUserId = tech?.UserId, ChangedAt = DateTime.UtcNow.AddDays(-2).AddHours(1).AddMinutes(20) },
                new BookingStatusHistory { FromStatus = BookingStatus.Inspecting, ToStatus = BookingStatus.Repairing, Note = "Tiến hành vệ sinh máy.", ChangedByUserId = tech?.UserId, ChangedAt = DateTime.UtcNow.AddDays(-2).AddHours(1).AddMinutes(35) },
                new BookingStatusHistory { FromStatus = BookingStatus.Repairing, ToStatus = BookingStatus.Completed, Note = "Hoàn thành và bàn giao.", ChangedByUserId = tech?.UserId, ChangedAt = DateTime.UtcNow.AddDays(-2).AddHours(2).AddMinutes(30) }
            ],
            Review = new Review
            {
                CustomerId = customer.Id,
                Rating = 5,
                Comment = "Thợ đến rất đúng giờ, mang đầy đủ bạt che và máy xịt áp lực không làm bẩn phòng ngủ. Máy lạnh sau khi vệ sinh chạy rất êm và mát sâu!",
                CreatedAt = DateTime.UtcNow.AddDays(-2).AddHours(3)
            }
        };

        // 2. Active Job (Repairing)
        var b2 = new Booking
        {
            BookingCode = $"HRS-{today:yyyyMMdd}-002",
            CustomerId = customer.Id,
            CustomerName = customer.FullName,
            CustomerPhone = customer.PhoneNumber ?? "0901000003",
            AddressLine = "142/5 Nguyễn Thị Minh Khai",
            Ward = "Phường 6",
            District = "Quận 3",
            City = "TP. Hồ Chí Minh",
            ServiceAreaId = area.Id,
            TechnicianId = tech?.Id,
            AppointmentDate = today,
            SlotStart = new TimeOnly(14, 0),
            SlotEnd = new TimeOnly(15, 0),
            Status = BookingStatus.Repairing,
            ProblemDescription = "Vòi nước bồn rửa bát bị gãy ren trong, nước rò rỉ mạnh dưới hộc tủ bếp.",
            EstimatedTotal = sThayVoi.BasePrice ?? 150000,
            ActualCost = 220000,
            Diagnosis = "Đoạn ren chân vòi bị oxy hóa gãy kẹt sâu trong co nối tường.",
            RepairNotes = "Đang dùng đầu trích ren ngược để lấy ren gãy, chuẩn bị thay vòi inox 304 mới.",
            RepairSolution = "Trích ren gãy và thay vòi gạt đồng tâm chất lượng cao.",
            OnTheWayAt = DateTime.UtcNow.AddHours(-2),
            InspectionStartedAt = DateTime.UtcNow.AddHours(-1).AddMinutes(-40),
            RepairStartedAt = DateTime.UtcNow.AddHours(-1),
            CreatedAt = DateTime.UtcNow.AddHours(-6),
            Services =
            [
                new BookingServiceLine
                {
                    RepairServiceId = sThayVoi.Id,
                    ServiceName = sThayVoi.Name,
                    PricingType = sThayVoi.PricingType,
                    UnitPrice = sThayVoi.BasePrice
                }
            ],
            StatusHistory =
            [
                new BookingStatusHistory { ToStatus = BookingStatus.Pending, Note = "Khách đặt lịch gấp.", ChangedByUserId = customer.Id, ChangedAt = DateTime.UtcNow.AddHours(-6) },
                new BookingStatusHistory { FromStatus = BookingStatus.Pending, ToStatus = BookingStatus.Confirmed, Note = "Admin duyệt lịch.", ChangedByUserId = "system", ChangedAt = DateTime.UtcNow.AddHours(-3) },
                new BookingStatusHistory { FromStatus = BookingStatus.Confirmed, ToStatus = BookingStatus.Assigned, Note = "Phân công kỹ thuật viên.", ChangedByUserId = "system", ChangedAt = DateTime.UtcNow.AddHours(-3) },
                new BookingStatusHistory { FromStatus = BookingStatus.Assigned, ToStatus = BookingStatus.OnTheWay, Note = "Thợ đang di chuyển đến nhà.", ChangedByUserId = tech?.UserId, ChangedAt = DateTime.UtcNow.AddHours(-2) },
                new BookingStatusHistory { FromStatus = BookingStatus.OnTheWay, ToStatus = BookingStatus.Inspecting, Note = "Khảo sát sự cố rò rỉ nước.", ChangedByUserId = tech?.UserId, ChangedAt = DateTime.UtcNow.AddHours(-1).AddMinutes(-40) },
                new BookingStatusHistory { FromStatus = BookingStatus.Inspecting, ToStatus = BookingStatus.Repairing, Note = "Bắt đầu trích ren gãy và lắp vòi mới.", ChangedByUserId = tech?.UserId, ChangedAt = DateTime.UtcNow.AddHours(-1) }
            ]
        };

        // 3. Pending Booking
        var b3 = new Booking
        {
            BookingCode = $"HRS-{today.AddDays(1):yyyyMMdd}-003",
            CustomerId = customer.Id,
            CustomerName = "Trần Minh Quân",
            CustomerPhone = "0912345678",
            AddressLine = "Số 48 Ngõ 175 Cầu Giấy",
            Ward = "Phường Quan Hoa",
            District = "Cầu Giấy",
            City = "Hà Nội",
            ServiceAreaId = area.Id,
            AppointmentDate = today.AddDays(1),
            SlotStart = new TimeOnly(10, 0),
            SlotEnd = new TimeOnly(11, 0),
            Status = BookingStatus.Pending,
            ProblemDescription = "Aptomat tầng 2 liên tục nhảy khi bật bình nóng lạnh và quạt sưởi cùng lúc.",
            EstimatedTotal = 0,
            CreatedAt = DateTime.UtcNow.AddHours(-1),
            Services =
            [
                new BookingServiceLine
                {
                    RepairServiceId = sChapDien.Id,
                    ServiceName = sChapDien.Name,
                    PricingType = sChapDien.PricingType,
                    UnitPrice = null
                }
            ],
            StatusHistory =
            [
                new BookingStatusHistory { ToStatus = BookingStatus.Pending, Note = "Khách hàng tạo lịch hẹn kiểm tra sự cố chập điện.", ChangedByUserId = customer.Id, ChangedAt = DateTime.UtcNow.AddHours(-1) }
            ]
        };

        db.Bookings.AddRange(b1, b2, b3);
        await db.SaveChangesAsync();
    }

    private static async Task EnsureUserAsync(
        UserManager<ApplicationUser> users,
        string email,
        string fullName,
        string phone,
        string password,
        string role)
    {
        var user = await users.FindByEmailAsync(email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = fullName,
                PhoneNumber = phone,
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            var created = await users.CreateAsync(user, password);
            if (!created.Succeeded)
            {
                throw new InvalidOperationException($"Cannot seed user {email}: {string.Join(", ", created.Errors.Select(e => e.Description))}");
            }
        }

        if (!await users.IsInRoleAsync(user, role))
        {
            await users.AddToRoleAsync(user, role);
        }
    }
}
