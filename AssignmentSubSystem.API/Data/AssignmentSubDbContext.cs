using Microsoft.EntityFrameworkCore;
using AssignmentSubSystem.API.Models;

namespace AssignmentSubSystem.API.Data;
public class AssignmentSubDbContext : DbContext
{
    public AssignmentSubDbContext(DbContextOptions<AssignmentSubDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<ClassRoom> ClassRooms { get; set; }
    public DbSet<Subject> Subjects { get; set; }
    public DbSet<SubjectTeacher> SubjectTeachers { get; set; }
    public DbSet<Assignment> Assignments { get; set; }
    public DbSet<Submission> Submissions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. One-to-Many: ClassRoom -> Subjects
        modelBuilder.Entity<Subject>()
            .HasOne(s => s.ClassRoom)
            .WithMany(c => c.Subjects)
            .HasForeignKey(s => s.ClassRoomId)
            .OnDelete(DeleteBehavior.Cascade);

        // 2. Many-to-Many: Subject <-> Teacher (via SubjectTeacher)
        modelBuilder.Entity<SubjectTeacher>()
            .HasOne(st => st.Teacher)
            .WithMany(t => t.SubjectTeachers)
            .HasForeignKey(st => st.TeacherId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SubjectTeacher>()
            .HasOne(st => st.Subject)
            .WithMany(s => s.SubjectTeachers)
            .HasForeignKey(st => st.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // 3. One-to-Many: Assignment 
        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Teacher)
            .WithMany(u => u.CreatedAssignments)
            .HasForeignKey(a => a.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        // 4. One-to-Many: Submission 
        modelBuilder.Entity<Submission>()
            .HasOne(s => s.Assignment)
            .WithMany(a => a.Submissions)
            .HasForeignKey(s => s.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Submission>()
            .HasOne(s => s.Student)
            .WithMany(u => u.Submissions)
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // --- DATA SEEDING (Demo Data for Testing) ---
        
        // Demo User Seed (Password: Admin123, Teacher123, Student123)
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Name = "System Admin", Email = "admin@school.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123"), Role = UserRole.Admin },
            new User { Id = 2, Name = "Mr. John (Teacher)", Email = "teacher@school.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Teacher123"), Role = UserRole.Teacher },
            new User { Id = 3, Name = "Rahim (Student)", Email = "student@school.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student123"), Role = UserRole.Student }
        );

        // Demo ClassRoom Seed
        modelBuilder.Entity<ClassRoom>().HasData(
            new ClassRoom { Id = 1, Name = "Class 10", Section = "A" }
        );

        // Demo Subject Seed
        modelBuilder.Entity<Subject>().HasData(
            new Subject { Id = 1, Name = "Mathematics", ClassRoomId = 1 }
        );

        // Demo SubjectTeacher Seed
        modelBuilder.Entity<SubjectTeacher>().HasData(
            new SubjectTeacher { Id = 1, TeacherId = 2, SubjectId = 1 }
        );
    }
}
