namespace AssignmentSubSystem.API.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Student-এর জন্য ClassRoom Foreign Key (Nullable, কারণ Admin/Teacher-দের ClassRoomId লাগবে না)
    public int? ClassRoomId { get; set; }
    public ClassRoom? ClassRoom { get; set; }

    // Navigation Properties
    public ICollection<SubjectTeacher> SubjectTeachers { get; set; } = new List<SubjectTeacher>();
    public ICollection<Assignment> CreatedAssignments { get; set; } = new List<Assignment>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}