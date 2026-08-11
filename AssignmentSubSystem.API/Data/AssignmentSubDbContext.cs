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

        // 1. One-to-Many: ClassRoom -> User (Students)
        modelBuilder.Entity<User>()
            .HasOne(u => u.ClassRoom)
            .WithMany()
            .HasForeignKey(u => u.ClassRoomId)
            .OnDelete(DeleteBehavior.SetNull);

        // 2. One-to-Many: ClassRoom -> Subjects
        modelBuilder.Entity<Subject>()
            .HasOne(s => s.ClassRoom)
            .WithMany(c => c.Subjects)
            .HasForeignKey(s => s.ClassRoomId)
            .OnDelete(DeleteBehavior.Cascade);

        // 3. Many-to-Many: Subject <-> Teacher (via SubjectTeacher)
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

        // 4. Relationships for Assignment
        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Teacher)
            .WithMany(u => u.CreatedAssignments)
            .HasForeignKey(a => a.TeacherId)
            .OnDelete(DeleteBehavior.Restrict); // Keep Restrict to avoid multiple cascade paths

        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.ClassRoom)
            .WithMany(c => c.Assignments)
            .HasForeignKey(a => a.ClassRoomId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Subject)
            .WithMany(s => s.Assignments)
            .HasForeignKey(a => a.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        // 5. Relationships for Submission
        modelBuilder.Entity<Submission>()
            .HasOne(s => s.Assignment)
            .WithMany(a => a.Submissions)
            .HasForeignKey(s => s.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Submission>()
            .HasOne(s => s.Student)
            .WithMany(u => u.Submissions)
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Restrict); // Cascade থেকে Restrict করা হয়েছে Multiple Cascade Path আটকানোর জন্য

    }
}