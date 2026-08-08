using AssignmentSubSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSubSystem.API.Data;

public static class DbInitializer
{
    public static void Initialize(AssignmentSubDbContext context)
    {
        // ডাটাবেজ টেবিলগুলো তৈরি না থাকলে তৈরি করবে
        context.Database.Migrate();

        // যদি ডাটাবেজে ইউজার না থাকে তবেই সিড ডাটা যোগ করবে
        if (!context.Users.Any())
        {
            var users = new User[]
            {
                new User
                {
                    Name = "System Admin",
                    Email = "admin@school.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123"),
                    Role = UserRole.Admin,
                    CreatedAt = DateTime.UtcNow
                },
                new User
                {
                    Name = "Mr. John (Teacher)",
                    Email = "teacher@school.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Teacher123"),
                    Role = UserRole.Teacher,
                    CreatedAt = DateTime.UtcNow
                },
                new User
                {
                    Name = "Rahim (Student)",
                    Email = "student@school.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student123"),
                    Role = UserRole.Student,
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.Users.AddRange(users);
            context.SaveChanges();
        }
    }
}