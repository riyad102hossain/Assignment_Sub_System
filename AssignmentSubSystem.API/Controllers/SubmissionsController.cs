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

// submission
[HttpPost]
[Authorize(Roles = "Student")]
public async Task<IActionResult> Submit([FromBody] CreateSubmissionDto dto)
{
    var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value;
    if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

    var submission = new Submission
    {
        AssignmentId = dto.AssignmentId,
        StudentId = int.Parse(userIdClaim),
        AnswerContent = dto.AnswerContent,
        SubmittedAt = DateTime.UtcNow
    };

    _context.Submissions.Add(submission);
    await _context.SaveChangesAsync();

    return Ok(submission);
}


// Update submission before deadline
[HttpPut("{id}")]
[Authorize(Roles = "Student")]
public async Task<IActionResult> UpdateSubmission(int id, [FromBody] CreateSubmissionDto dto)
{
    var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value;
    if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

    var submission = await _context.Submissions
        .Include(s => s.Assignment)
        .FirstOrDefaultAsync(s => s.Id == id && s.StudentId == int.Parse(userIdClaim));

    if (submission == null) 
        return NotFound(new { message = "Submission not found." });

    // Check deadline
    if (submission.Assignment != null && submission.Assignment.Deadline < DateTime.UtcNow)
    {
        return BadRequest(new { message = "Cannot update submission. Deadline has passed." });
    }

    submission.AnswerContent = dto.AnswerContent;
    submission.SubmittedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();
    return Ok(new { message = "Submission updated successfully.", submission });
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

        // Validate obtained marks do not exceed assignment max marks
        if (submission.Assignment != null && dto.ObtainedMarks > submission.Assignment.MaxMarks)
        {
            return BadRequest(new { message = "Obtained marks cannot exceed assignment max marks." });
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