using System.ComponentModel.DataAnnotations;

namespace AssignmentSubSystem.API.DTOs;

public class CreateSubmissionDto
{
    [Required]
    public int AssignmentId { get; set; }

    [Required]
    public string AnswerContent { get; set; } = string.Empty;
    public IFormFile? File { get; set; }
}

public class ReviewSubmissionDto
{
    [Range(0, 1000)]
    public decimal ObtainedMarks { get; set; }

    public string? TeacherFeedback { get; set; }
}

public class SubmissionResponseDto
{
    public int Id { get; set; }
    public int AssignmentId { get; set; }
    public string AssignmentTitle { get; set; } = string.Empty;
    
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    
    public string AnswerContent { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    
    public decimal? ObtainedMarks { get; set; }
    public string? TeacherFeedback { get; set; }
    public int? ReviewedByTeacherId { get; set; }
    public DateTime? ReviewedAt { get; set; }
}