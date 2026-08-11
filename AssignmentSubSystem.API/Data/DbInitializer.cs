using AssignmentSubSystem.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSubSystem.API.Data;

public static class DbInitializer
{
    public static void Initialize(AssignmentSubDbContext context)
    {
        context.Database.Migrate();

        // 1. ClassRooms
        if (!context.ClassRooms.Any())
        {
            context.ClassRooms.Add(new ClassRoom { Name = "Class 10", Section = "A" });
            context.SaveChanges();
        }
        var classRoom = context.ClassRooms.First();

        // 2. Subjects
        if (!context.Subjects.Any())
        {
            context.Subjects.Add(new Subject { Name = "Mathematics", ClassRoomId = classRoom.Id });
            context.SaveChanges();
        }
        var subject = context.Subjects.First();

        // 3. Users
        if (!context.Users.Any())
        {
            var admin = new User
            {
                Name = "System Admin",
                Email = "admin@school.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123"),
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            };

            var teacher = new User
            {
                Name = "Mr. John",
                Email = "teacher@school.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Teacher123"),
                Role = UserRole.Teacher,
                CreatedAt = DateTime.UtcNow
            };

            var student = new User
            {
                Name = "Rahim Student",
                Email = "student@school.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student123"),
                Role = UserRole.Student,
                ClassRoomId = classRoom.Id,
                CreatedAt = DateTime.UtcNow
            };

            context.Users.AddRange(admin, teacher, student);
            context.SaveChanges();
        }

        var teacherUser = context.Users.FirstOrDefault(u => u.Role == UserRole.Teacher);
        var studentUser = context.Users.FirstOrDefault(u => u.Role == UserRole.Student);

        // 4. SubjectTeacher Mapping
        if (!context.SubjectTeachers.Any() && teacherUser != null)
        {
            context.SubjectTeachers.Add(new SubjectTeacher
            {
                TeacherId = teacherUser.Id,
                SubjectId = subject.Id
            });
            context.SaveChanges();
        }

        // 5. Assignments
        if (!context.Assignments.Any() && teacherUser != null)
        {
            context.Assignments.Add(new Assignment
            {
                Title = "Algebra Chapter 1 Assignment",
                Description = "Solve exercises 1.1 to 1.5 from the textbook.",
                Deadline = DateTime.UtcNow.AddDays(7),
                MaxMarks = 100,
                Status = AssignmentStatus.Published,
                TeacherId = teacherUser.Id,
                ClassRoomId = classRoom.Id,
                SubjectId = subject.Id,
                CreatedAt = DateTime.UtcNow
            });
            context.SaveChanges();
        }

        var assignment = context.Assignments.FirstOrDefault();

        // 6. Submissions
        if (!context.Submissions.Any() && assignment != null && studentUser != null)
        {
            context.Submissions.Add(new Submission
            {
                AssignmentId = assignment.Id,
                StudentId = studentUser.Id,
                AnswerContent = "https://drive.google.com/file/d/sample-assignment-solution",
                Status = SubmissionStatus.Submitted,
                SubmittedAt = DateTime.UtcNow
            });
            context.SaveChanges();
            Console.WriteLine("--> Submission seed data added successfully!");
        }
    }
}