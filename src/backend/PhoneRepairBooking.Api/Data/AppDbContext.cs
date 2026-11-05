using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PhoneRepairBooking.Api.Domain;

namespace PhoneRepairBooking.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();

    public DbSet<RepairService> RepairServices => Set<RepairService>();

    public DbSet<ServiceArea> ServiceAreas => Set<ServiceArea>();

    public DbSet<ServiceAreaOpeningHour> ServiceAreaOpeningHours => Set<ServiceAreaOpeningHour>();

    public DbSet<Technician> Technicians => Set<Technician>();

    public DbSet<TechnicianSchedule> TechnicianSchedules => Set<TechnicianSchedule>();

    public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();

    public DbSet<Booking> Bookings => Set<Booking>();

    public DbSet<BookingServiceLine> BookingServiceLines => Set<BookingServiceLine>();

    public DbSet<BookingStatusHistory> BookingStatusHistories => Set<BookingStatusHistory>();

    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ServiceCategory>(entity =>
        {
            entity.Property(item => item.Name).HasMaxLength(120).IsRequired();
            entity.Property(item => item.Slug).HasMaxLength(140).IsRequired();
            entity.Property(item => item.IconName).HasMaxLength(60);
            entity.Property(item => item.ImageUrl).HasMaxLength(500);
            entity.Property(item => item.Description).HasMaxLength(1000);
            entity.HasIndex(item => item.Name).IsUnique();
            entity.HasIndex(item => item.Slug).IsUnique();
        });

        builder.Entity<RepairService>(entity =>
        {
            entity.Property(item => item.Name).HasMaxLength(180).IsRequired();
            entity.Property(item => item.Slug).HasMaxLength(200).IsRequired();
            entity.Property(item => item.Description).HasMaxLength(2000);
            entity.Property(item => item.BasePrice).HasColumnType("decimal(18,0)");
            entity.Property(item => item.EstimatedDuration).HasMaxLength(60);
            entity.Property(item => item.ImageUrl).HasMaxLength(500);
            entity.Property(item => item.PricingType).HasConversion<string>().HasMaxLength(40);
            entity.HasIndex(item => item.Name).IsUnique();
            entity.HasIndex(item => item.Slug).IsUnique();

            entity.HasOne(item => item.ServiceCategory)
                .WithMany(cat => cat.Services)
                .HasForeignKey(item => item.ServiceCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<ServiceArea>(entity =>
        {
            entity.Property(item => item.Name).HasMaxLength(150).IsRequired();
            entity.Property(item => item.City).HasMaxLength(100).IsRequired();
            entity.Property(item => item.Address).HasMaxLength(300).IsRequired();
            entity.Property(item => item.Phone).HasMaxLength(30).IsRequired();
        });

        builder.Entity<ServiceAreaOpeningHour>(entity =>
        {
            entity.HasIndex(item => new { item.ServiceAreaId, item.DayOfWeek }).IsUnique();
            entity.HasOne(item => item.ServiceArea)
                .WithMany(item => item.OpeningHours)
                .HasForeignKey(item => item.ServiceAreaId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CustomerAddress>(entity =>
        {
            entity.Property(item => item.FullName).HasMaxLength(100).IsRequired();
            entity.Property(item => item.Phone).HasMaxLength(30).IsRequired();
            entity.Property(item => item.Province).HasMaxLength(100).IsRequired();
            entity.Property(item => item.District).HasMaxLength(100).IsRequired();
            entity.Property(item => item.Ward).HasMaxLength(100).IsRequired();
            entity.Property(item => item.AddressLine).HasMaxLength(250).IsRequired();
            entity.Property(item => item.Note).HasMaxLength(500);

            entity.HasOne(item => item.Customer)
                .WithMany()
                .HasForeignKey(item => item.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Technician>(entity =>
        {
            entity.Property(item => item.Specialty).HasMaxLength(150);
            entity.HasIndex(item => item.UserId).IsUnique();
            entity.HasOne(item => item.User)
                .WithMany()
                .HasForeignKey(item => item.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.ServiceArea)
                .WithMany(item => item.Technicians)
                .HasForeignKey(item => item.ServiceAreaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<TechnicianSchedule>(entity =>
        {
            entity.HasIndex(item => new { item.TechnicianId, item.DayOfWeek }).IsUnique();
            entity.HasOne(item => item.Technician)
                .WithMany(item => item.Schedules)
                .HasForeignKey(item => item.TechnicianId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Booking>(entity =>
        {
            entity.Property(item => item.BookingCode).HasMaxLength(40).IsRequired();
            entity.Property(item => item.CustomerName).HasMaxLength(100).IsRequired();
            entity.Property(item => item.CustomerPhone).HasMaxLength(30).IsRequired();
            entity.Property(item => item.AddressLine).HasMaxLength(250).IsRequired();
            entity.Property(item => item.Ward).HasMaxLength(100);
            entity.Property(item => item.District).HasMaxLength(100);
            entity.Property(item => item.City).HasMaxLength(100);
            entity.Property(item => item.ProblemDescription).HasMaxLength(2000);
            entity.Property(item => item.Diagnosis).HasMaxLength(2000);
            entity.Property(item => item.RepairNotes).HasMaxLength(2000);
            entity.Property(item => item.RepairSolution).HasMaxLength(2000);
            entity.Property(item => item.CancelReason).HasMaxLength(500);
            entity.Property(item => item.EstimatedTotal).HasColumnType("decimal(18,0)");
            entity.Property(item => item.ActualCost).HasColumnType("decimal(18,0)");
            entity.Property(item => item.Status).HasConversion<string>().HasMaxLength(30);

            entity.HasIndex(item => item.BookingCode).IsUnique();
            entity.HasIndex(item => new { item.ServiceAreaId, item.AppointmentDate, item.SlotStart });

            entity.HasOne(item => item.Customer)
                .WithMany()
                .HasForeignKey(item => item.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(item => item.ServiceArea)
                .WithMany()
                .HasForeignKey(item => item.ServiceAreaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(item => item.Technician)
                .WithMany()
                .HasForeignKey(item => item.TechnicianId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<BookingServiceLine>(entity =>
        {
            entity.Property(item => item.ServiceName).HasMaxLength(180).IsRequired();
            entity.Property(item => item.UnitPrice).HasColumnType("decimal(18,0)");
            entity.Property(item => item.PricingType).HasConversion<string>().HasMaxLength(40);

            entity.HasOne(item => item.Booking)
                .WithMany(item => item.Services)
                .HasForeignKey(item => item.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(item => item.RepairService)
                .WithMany()
                .HasForeignKey(item => item.RepairServiceId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<BookingStatusHistory>(entity =>
        {
            entity.Property(item => item.FromStatus).HasConversion<string>().HasMaxLength(30);
            entity.Property(item => item.ToStatus).HasConversion<string>().HasMaxLength(30);
            entity.Property(item => item.Note).HasMaxLength(1000);

            entity.HasOne(item => item.Booking)
                .WithMany(item => item.StatusHistory)
                .HasForeignKey(item => item.BookingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Review>(entity =>
        {
            entity.Property(item => item.Comment).HasMaxLength(2000);
            entity.HasIndex(item => item.BookingId).IsUnique();

            entity.HasOne(item => item.Booking)
                .WithOne(item => item.Review)
                .HasForeignKey<Review>(item => item.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(item => item.Customer)
                .WithMany()
                .HasForeignKey(item => item.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
