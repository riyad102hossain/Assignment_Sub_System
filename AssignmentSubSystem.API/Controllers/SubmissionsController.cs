using System.Security.Claims;
using AssignmentSubSystem.API.Data;
using AssignmentSubSystem.API.DTOs;
using AssignmentSubSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSubSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly AssignmentSubDbContext _context;

    public SubmissionsController(AssignmentSubDbContext context)
    {
        _context = context;
    }

    // Only Student can submit / resubmit answers
    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Submit([FromBody] CreateSubmissionDto dto)
    {
        var studentId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var assignment = await _context.Assignments.FindAsync(dto.AssignmentId);
        if (assignment == null || assignment.Status != AssignmentStatus.Published)
        {
            return BadRequest(new { message = "Assignment is invalid or not published." });
        }

        if (DateTime.UtcNow > assignment.Deadline)
        {
            return BadRequest(new { message = "Deadline has passed for this assignment." });
        }

        var existingSubmission = await _context.Submissions
            .FirstOrDefaultAsync(s => s.AssignmentId == dto.AssignmentId && s.StudentId == studentId);

        if (existingSubmission != null)
        {
            existingSubmission.AnswerContent = dto.AnswerContent;
            existingSubmission.SubmittedAt = DateTime.UtcNow;
            existingSubmission.Status = SubmissionStatus.Resubmitted;
        }
        else
        {
            var submission = new Submission
            {
                AssignmentId = dto.AssignmentId,
                StudentId = studentId,
                AnswerContent = dto.AnswerContent,
                Status = SubmissionStatus.Submitted,
                SubmittedAt = DateTime.UtcNow
            };
            _context.Submissions.Add(submission);
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Assignment submitted successfully." });
    }

    // Only Teacher can grade/review submissions
    [HttpPut("{id}/review")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Review(int id, [FromBody] ReviewSubmissionDto dto)
    {
        var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var submission = await _context.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null) return NotFound(new { message = "Submission not found." });

        // Ensure teacher can only grade submissions for their own assignment
        if (submission.Assignment?.TeacherId != teacherId)
        {
            return Forbid();
        }

        submission.ObtainedMarks = dto.ObtainedMarks;
        submission.TeacherFeedback = dto.TeacherFeedback;
        submission.ReviewedByTeacherId = teacherId;
        submission.ReviewedAt = DateTime.UtcNow;
        submission.Status = SubmissionStatus.Reviewed;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Submission reviewed successfully." });
    }

    // Admin (View All), Teacher (View for Created Assignments), Student (View Own Submissions)
    [HttpGet]
    [Authorize(Roles = "Admin,Teacher,Student")]
    public async Task<IActionResult> GetAll()
    {
        var userRole = User.FindFirstValue(ClaimTypes.Role);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var query = _context.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .AsQueryable();

        if (userRole == UserRole.Student.ToString())
        {
            query = query.Where(s => s.StudentId == userId);
        }
        else if (userRole == UserRole.Teacher.ToString())
        {
            query = query.Where(s => s.Assignment!.TeacherId == userId);
        }
        // Admin sees all submissions without filters

        var result = await query.Select(s => new SubmissionResponseDto
        {
            Id = s.Id,
            AssignmentId = s.AssignmentId,
            AssignmentTitle = s.Assignment != null ? s.Assignment.Title : "",
            StudentId = s.StudentId,
            StudentName = s.Student != null ? s.Student.Name : "",
            AnswerContent = s.AnswerContent,
            Status = s.Status.ToString(),
            SubmittedAt = s.SubmittedAt,
            ObtainedMarks = s.ObtainedMarks,
            TeacherFeedback = s.TeacherFeedback,
            ReviewedByTeacherId = s.ReviewedByTeacherId,
            ReviewedAt = s.ReviewedAt
        }).ToListAsync();

        return Ok(result);
    }
}