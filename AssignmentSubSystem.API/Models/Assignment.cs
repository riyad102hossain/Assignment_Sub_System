namespace AssignmentSubSystem.API.Models;

public class Assignment
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public decimal MaxMarks { get; set; }
    public AssignmentStatus Status { get; set; } = AssignmentStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign Keys
    public int TeacherId { get; set; }
    public User? Teacher { get; set; }
    public int ClassRoomId { get; set; }
    public ClassRoom? ClassRoom { get; set; }
    public int SubjectId { get; set; }
    public Subject? Subject { get; set; }

    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}