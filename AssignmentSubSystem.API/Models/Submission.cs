
namespace AssignmentSubSystem.API.Models;
public class Submission
{
    public int Id { get; set; }
    public string AnswerContent { get; set; } = string.Empty; // Text or file link
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    
    // Grading fields (Filled by Teacher)
    public decimal? ObtainedMarks { get; set; }
    public string? TeacherFeedback { get; set; }
    public int? ReviewedByTeacherId { get; set; }
    public DateTime? ReviewedAt { get; set; }

    // Foreign Keys
    public int AssignmentId { get; set; }
    public Assignment? Assignment { get; set; }
    public int StudentId { get; set; }
    public User? Student { get; set; }
}