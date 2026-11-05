using Microsoft.EntityFrameworkCore;
using PhoneRepairBooking.Api.Data;
using PhoneRepairBooking.Api.Domain;
using PhoneRepairBooking.Api.DTOs;

namespace PhoneRepairBooking.Api.Services;

public class CatalogService
{
    private readonly AppDbContext _db;

    public CatalogService(AppDbContext db)
    {
        _db = db;
    }

    // SERVICE CATEGORIES
    public async Task<List<ServiceCategoryDto>> GetCategoriesAsync(bool includeInactive, string? search)
    {
        var query = _db.ServiceCategories.AsNoTracking().AsQueryable();
        if (!includeInactive)
        {
            query = query.Where(item => item.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(item => item.Name.Contains(term) || (item.Description != null && item.Description.Contains(term)));
        }

        return await query
            .OrderBy(item => item.Name)
            .Select(item => new ServiceCategoryDto(
                item.Id,
                item.Name,
                item.Slug,
                item.Description,
                item.IconName,
                item.ImageUrl,
                item.IsActive,
                item.Services.Count(s => includeInactive || s.IsActive)))
            .ToListAsync();
    }

    public async Task<(ServiceCategoryDto? Data, ApiError? Error, int Status)> CreateCategoryAsync(CategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return (null, new ApiError { Message = "Tên nhóm dịch vụ không được trống." }, StatusCodes.Status400BadRequest);
        }

        var trimmed = request.Name.Trim();
        var exists = await _db.ServiceCategories.AnyAsync(item => item.Name == trimmed);
        if (exists)
        {
            return (null, new ApiError { Message = "Tên nhóm dịch vụ đã tồn tại." }, StatusCodes.Status409Conflict);
        }

        var entity = new ServiceCategory
        {
            Name = trimmed,
            Slug = Slugger.Make(trimmed),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            IconName = string.IsNullOrWhiteSpace(request.IconName) ? null : request.IconName.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _db.ServiceCategories.Add(entity);
        await _db.SaveChangesAsync();

        var dto = new ServiceCategoryDto(entity.Id, entity.Name, entity.Slug, entity.Description, entity.IconName, entity.ImageUrl, entity.IsActive, 0);
        return (dto, null, StatusCodes.Status201Created);
    }

    public async Task<(ServiceCategoryDto? Data, ApiError? Error, int Status)> UpdateCategoryAsync(int id, CategoryRequest request)
    {
        var entity = await _db.ServiceCategories.Include(item => item.Services).FirstOrDefaultAsync(item => item.Id == id);
        if (entity is null)
        {
            return (null, new ApiError { Message = "Không tìm thấy nhóm dịch vụ." }, StatusCodes.Status404NotFound);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return (null, new ApiError { Message = "Tên nhóm dịch vụ không được trống." }, StatusCodes.Status400BadRequest);
        }

        var trimmed = request.Name.Trim();
        var exists = await _db.ServiceCategories.AnyAsync(item => item.Id != id && item.Name == trimmed);
        if (exists)
        {
            return (null, new ApiError { Message = "Tên nhóm dịch vụ đã tồn tại." }, StatusCodes.Status409Conflict);
        }

        entity.Name = trimmed;
        entity.Slug = Slugger.Make(trimmed);
        entity.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        entity.IconName = string.IsNullOrWhiteSpace(request.IconName) ? null : request.IconName.Trim();
        entity.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        entity.IsActive = request.IsActive;

        await _db.SaveChangesAsync();

        var dto = new ServiceCategoryDto(
            entity.Id,
            entity.Name,
            entity.Slug,
            entity.Description,
            entity.IconName,
            entity.ImageUrl,
            entity.IsActive,
            entity.Services.Count(s => s.IsActive));

        return (dto, null, StatusCodes.Status200OK);
    }

    public async Task<(bool Ok, ApiError? Error, int Status)> DeleteCategoryAsync(int id)
    {
        var entity = await _db.ServiceCategories.Include(item => item.Services).FirstOrDefaultAsync(item => item.Id == id);
        if (entity is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy nhóm dịch vụ." }, StatusCodes.Status404NotFound);
        }

        if (entity.Services.Count > 0)
        {
            return (false, new ApiError { Message = "Không thể xóa nhóm dịch vụ khi còn các dịch vụ trực thuộc." }, StatusCodes.Status400BadRequest);
        }

        _db.ServiceCategories.Remove(entity);
        await _db.SaveChangesAsync();
        return (true, null, StatusCodes.Status204NoContent);
    }

    // REPAIR SERVICES
    public async Task<List<RepairServiceDto>> GetServicesAsync(bool includeInactive, int? categoryId, string? search, PricingType? pricingType)
    {
        var query = _db.RepairServices.AsNoTracking().Include(item => item.ServiceCategory).AsQueryable();
        if (!includeInactive)
        {
            query = query.Where(item => item.IsActive && item.ServiceCategory.IsActive);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(item => item.ServiceCategoryId == categoryId.Value);
        }

        if (pricingType is not null)
        {
            query = query.Where(item => item.PricingType == pricingType);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(item => item.Name.Contains(term) || item.ServiceCategory.Name.Contains(term));
        }

        return await query
            .OrderBy(item => item.ServiceCategory.Name)
            .ThenBy(item => item.Name)
            .Select(item => ToServiceDto(item))
            .ToListAsync();
    }

    public async Task<(RepairServiceDto? Data, ApiError? Error, int Status)> SaveServiceAsync(int? id, RepairServiceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return (null, new ApiError { Message = "Tên dịch vụ không được để trống." }, StatusCodes.Status400BadRequest);
        }

        var category = await _db.ServiceCategories.FirstOrDefaultAsync(item => item.Id == request.ServiceCategoryId);
        if (category is null)
        {
            return (null, new ApiError { Message = "Nhóm dịch vụ không tồn tại." }, StatusCodes.Status400BadRequest);
        }

        var trimmedName = request.Name.Trim();
        var exists = await _db.RepairServices.AnyAsync(item => item.Id != (id ?? 0) && item.Name == trimmedName);
        if (exists)
        {
            return (null, new ApiError { Message = "Tên dịch vụ đã tồn tại." }, StatusCodes.Status409Conflict);
        }

        if (request.PricingType == PricingType.FixedPrice && (!request.BasePrice.HasValue || request.BasePrice.Value < 0))
        {
            return (null, new ApiError { Message = "Dịch vụ giá cố định phải có giá cơ sở hợp lệ." }, StatusCodes.Status400BadRequest);
        }

        RepairService service;
        if (id.HasValue && id.Value > 0)
        {
            var existing = await _db.RepairServices.Include(item => item.ServiceCategory).FirstOrDefaultAsync(item => item.Id == id.Value);
            if (existing is null)
            {
                return (null, new ApiError { Message = "Không tìm thấy dịch vụ." }, StatusCodes.Status404NotFound);
            }
            service = existing;
            service.ServiceCategoryId = request.ServiceCategoryId;
            service.Name = trimmedName;
            service.Slug = Slugger.Make(trimmedName);
            service.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
            service.BasePrice = request.PricingType == PricingType.FixedPrice ? request.BasePrice : null;
            service.PricingType = request.PricingType;
            service.EstimatedDuration = string.IsNullOrWhiteSpace(request.EstimatedDuration) ? null : request.EstimatedDuration.Trim();
            service.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
            service.IsActive = request.IsActive;
        }
        else
        {
            service = new RepairService
            {
                ServiceCategoryId = request.ServiceCategoryId,
                Name = trimmedName,
                Slug = Slugger.Make(trimmedName),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                BasePrice = request.PricingType == PricingType.FixedPrice ? request.BasePrice : null,
                PricingType = request.PricingType,
                EstimatedDuration = string.IsNullOrWhiteSpace(request.EstimatedDuration) ? null : request.EstimatedDuration.Trim(),
                ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };
            _db.RepairServices.Add(service);
        }

        await _db.SaveChangesAsync();

        // Reload category if needed
        service.ServiceCategory = category;
        return (ToServiceDto(service), null, id.HasValue ? StatusCodes.Status200OK : StatusCodes.Status201Created);
    }

    public async Task<(bool Ok, ApiError? Error, int Status)> DeleteServiceAsync(int id)
    {
        var service = await _db.RepairServices.FirstOrDefaultAsync(item => item.Id == id);
        if (service is null)
        {
            return (false, new ApiError { Message = "Không tìm thấy dịch vụ." }, StatusCodes.Status404NotFound);
        }

        var inUse = await _db.BookingServiceLines.AnyAsync(item => item.RepairServiceId == id);
        if (inUse)
        {
            service.IsActive = false;
            await _db.SaveChangesAsync();
            return (true, null, StatusCodes.Status200OK);
        }

        _db.RepairServices.Remove(service);
        await _db.SaveChangesAsync();
        return (true, null, StatusCodes.Status204NoContent);
    }

    // SEARCH
    public async Task<List<CatalogSearchItemDto>> SearchAsync(string? q, int? categoryId, PricingType? pricingType)
    {
        var query = _db.RepairServices.AsNoTracking().Include(item => item.ServiceCategory).Where(item => item.IsActive && item.ServiceCategory.IsActive);

        if (categoryId.HasValue)
        {
            query = query.Where(item => item.ServiceCategoryId == categoryId.Value);
        }

        if (pricingType is not null)
        {
            query = query.Where(item => item.PricingType == pricingType);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(item =>
                item.Name.ToLower().Contains(term) ||
                (item.Description != null && item.Description.ToLower().Contains(term)) ||
                item.ServiceCategory.Name.ToLower().Contains(term));
        }

        return await query
            .OrderBy(item => item.ServiceCategory.Name)
            .ThenBy(item => item.Name)
            .Select(item => new CatalogSearchItemDto(
                item.Id,
                item.Name,
                item.Slug,
                item.ServiceCategoryId,
                item.ServiceCategory.Name,
                item.BasePrice,
                item.PricingType,
                item.Description))
            .ToListAsync();
    }

    private static RepairServiceDto ToServiceDto(RepairService item) => new(
        item.Id,
        item.ServiceCategoryId,
        item.ServiceCategory?.Name ?? string.Empty,
        item.Name,
        item.Slug,
        item.Description,
        item.BasePrice,
        item.PricingType,
        item.EstimatedDuration,
        item.ImageUrl,
        item.IsActive);

    // BACKWARD COMPATIBILITY HELPERS
    public async Task<List<BrandDto>> GetBrandsAsync(bool includeInactive, string? search)
    {
        var cats = await GetCategoriesAsync(includeInactive, search);
        return cats.Select(c => new BrandDto(c.Id, c.Name, c.Slug, c.Description, c.IsActive, c.ServicesCount)).ToList();
    }

    public Task<(BrandDto? Data, ApiError? Error, int Status)> CreateBrandAsync(BrandRequest request) =>
        CreateCategoryAsync(request).ContinueWith(t => (
            t.Result.Data != null ? new BrandDto(t.Result.Data.Id, t.Result.Data.Name, t.Result.Data.Slug, t.Result.Data.Description, t.Result.Data.IsActive, 0) : null,
            t.Result.Error,
            t.Result.Status));

    public Task<(BrandDto? Data, ApiError? Error, int Status)> UpdateBrandAsync(int id, BrandRequest request) =>
        UpdateCategoryAsync(id, request).ContinueWith(t => (
            t.Result.Data != null ? new BrandDto(t.Result.Data.Id, t.Result.Data.Name, t.Result.Data.Slug, t.Result.Data.Description, t.Result.Data.IsActive, 0) : null,
            t.Result.Error,
            t.Result.Status));

    public Task<(bool Ok, ApiError? Error, int Status)> DeleteBrandAsync(int id) => DeleteCategoryAsync(id);

    public Task<List<RepairServiceDto>> GetServicesAsync(bool includeInactive, string? search, PricingType? pricingType) =>
        GetServicesAsync(includeInactive, null, search, pricingType);
}
