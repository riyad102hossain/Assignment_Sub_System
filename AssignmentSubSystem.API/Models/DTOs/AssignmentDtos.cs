using System.ComponentModel.DataAnnotations;
using AssignmentSubSystem.API.Models;

namespace AssignmentSubSystem.API.DTOs;

public class CreateAssignmentDto
{
    [Required]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime Deadline { get; set; }

    [Range(1, 1000)]
    public decimal MaxMarks { get; set; } = 100;

    [Required]
    public int ClassRoomId { get; set; }

    [Required]
    public int SubjectId { get; set; }

    public AssignmentStatus Status { get; set; } = AssignmentStatus.Draft;
}

public class UpdateAssignmentDto : CreateAssignmentDto { }

public class AssignmentResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public decimal MaxMarks { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    public int TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    
    public int ClassRoomId { get; set; }
    public string ClassRoomName { get; set; } = string.Empty;
    
    public int SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
}