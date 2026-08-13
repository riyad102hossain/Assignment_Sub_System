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
public class AssignmentsController : ControllerBase
{
    private readonly AssignmentSubDbContext _context;

    public AssignmentsController(AssignmentSubDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Teacher,Student")]
    public async Task<IActionResult> GetAll()
    {
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirst("role")?.Value;
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst("id")?.Value;

        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized(new { message = "Invalid token or user ID missing." });
        }

        var query = _context.Assignments
            .Include(a => a.Teacher)
            .Include(a => a.ClassRoom)
            .Include(a => a.Subject)
            .AsQueryable();

        // Check role strings flexibly (Case-insensitive check)
        bool isStudent = string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase) || userRole == UserRole.Student.ToString();
        bool isTeacher = string.Equals(userRole, "Teacher", StringComparison.OrdinalIgnoreCase) || userRole == UserRole.Teacher.ToString();

        if (isStudent)
        {
            var student = await _context.Users.FindAsync(userId);

            if (student == null || student.ClassRoomId == null)
            {
                return Ok(new List<object>()); 
            }

            query = query.Where(a => a.ClassRoomId == student.ClassRoomId && a.Status == AssignmentStatus.Published);
        }
        else if (isTeacher)
        {
            query = query.Where(a => a.TeacherId == userId);
        }

        var assignments = await query.ToListAsync();

        if (isStudent)
        {
            var studentSubmissions = await _context.Submissions
                .Where(s => s.StudentId == userId)
                .ToListAsync();

            var studentResult = assignments.Select(a => {
                var sub = studentSubmissions.FirstOrDefault(s => s.AssignmentId == a.Id);
                return new
                {
                    id = a.Id,
                    title = a.Title,
                    description = a.Description,
                    deadline = a.Deadline,
                    maxMarks = a.MaxMarks,
                    status = a.Status.ToString(),
                    teacherName = a.Teacher != null ? a.Teacher.Name : "",
                    classRoomName = a.ClassRoom != null ? a.ClassRoom.Name : "",
                    subjectName = a.Subject != null ? a.Subject.Name : "",
                    
                    // JSON lowerCamelCase camelCase naming for JS compatibility
                    isSubmitted = sub != null,
                    submissionId = sub?.Id,
                    submittedContent = sub?.AnswerContent,
                    marksObtained = sub?.ObtainedMarks,
                    teacherFeedback = sub?.TeacherFeedback
                };
            });

            return Ok(studentResult);
        }

        var result = assignments.Select(a => new AssignmentResponseDto
        {
            Id = a.Id,
            Title = a.Title,
            Description = a.Description,
            Deadline = a.Deadline,
            MaxMarks = a.MaxMarks,
            Status = a.Status.ToString(),
            CreatedAt = a.CreatedAt,
            TeacherId = a.TeacherId,
            TeacherName = a.Teacher != null ? a.Teacher.Name : "",
            ClassRoomId = a.ClassRoomId,
            ClassRoomName = a.ClassRoom != null ? a.ClassRoom.Name : "",
            SubjectId = a.SubjectId,
            SubjectName = a.Subject != null ? a.Subject.Name : ""
        });

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Create([FromBody] CreateAssignmentDto dto)
    {
        var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var assignment = new Assignment
        {
            Title = dto.Title,
            Description = dto.Description,
            Deadline = dto.Deadline,
            MaxMarks = dto.MaxMarks,
            ClassRoomId = dto.ClassRoomId,
            SubjectId = dto.SubjectId,
            Status = dto.Status == 0 ? AssignmentStatus.Published : dto.Status,
            TeacherId = teacherId
        };

        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Assignment created successfully.", assignmentId = assignment.Id });
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> ChangeStatus(int id, [FromBody] AssignmentStatus status)
    {
        var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var assignment = await _context.Assignments.FindAsync(id);
        if (assignment == null) return NotFound(new { message = "Assignment not found." });

        if (assignment.TeacherId != teacherId)
        {
            return Forbid();
        }

        assignment.Status = status;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Assignment status updated to {status}." });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAssignmentDto dto)
    {
        var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var assignment = await _context.Assignments.FindAsync(id);
        if (assignment == null) return NotFound(new { message = "Assignment not found." });

        if (assignment.TeacherId != teacherId)
        {
            return Forbid();
        }

        assignment.Title = dto.Title;
        assignment.Description = dto.Description;
        assignment.Deadline = dto.Deadline;
        assignment.MaxMarks = dto.MaxMarks;
        assignment.ClassRoomId = dto.ClassRoomId;
        assignment.SubjectId = dto.SubjectId;
        assignment.Status = dto.Status == 0 ? AssignmentStatus.Published : dto.Status;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Assignment updated successfully." });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Delete(int id)
    {
        var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var assignment = await _context.Assignments.FindAsync(id);
        if (assignment == null) return NotFound(new { message = "Assignment not found." });

        if (assignment.TeacherId != teacherId)
        {
            return Forbid();
        }

        // Check if there are any submissions for this assignment
        var hasSubmissions = await _context.Submissions.AnyAsync(s => s.AssignmentId == id);
        if (hasSubmissions)
        {
            return BadRequest(new { message = "Cannot delete assignment with existing submissions." });
        }

        _context.Assignments.Remove(assignment);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Assignment deleted successfully." });
    }
}
