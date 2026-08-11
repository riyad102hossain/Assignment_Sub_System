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

    // Admin (View All), Teacher (View Own Created), Student (View Published for Class)
    [HttpGet]
    [Authorize(Roles = "Admin,Teacher,Student")]
    public async Task<IActionResult> GetAll()
    {
        var userRole = User.FindFirstValue(ClaimTypes.Role);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var query = _context.Assignments
            .Include(a => a.Teacher)
            .Include(a => a.ClassRoom)
            .Include(a => a.Subject)
            .AsQueryable();

        if (userRole == UserRole.Student.ToString())
        {
            var student = await _context.Users.FindAsync(userId);
            if (student?.ClassRoomId == null)
            {
                return BadRequest(new { message = "Student is not assigned to any classroom." });
            }
            query = query.Where(a => a.ClassRoomId == student.ClassRoomId && a.Status == AssignmentStatus.Published);
        }
        else if (userRole == UserRole.Teacher.ToString())
        {
            query = query.Where(a => a.TeacherId == userId);
        }
        // Admin role without any filters sees all assignments

        var result = await query.Select(a => new AssignmentResponseDto
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
        }).ToListAsync();

        return Ok(result);
    }

    // Only Teacher can create assignments
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
            Status = dto.Status,
            TeacherId = teacherId
        };

        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Assignment created successfully.", assignmentId = assignment.Id });
    }

    // Only Teacher can change status (Publish / Draft)
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> ChangeStatus(int id, [FromBody] AssignmentStatus status)
    {
        var teacherId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var assignment = await _context.Assignments.FindAsync(id);
        if (assignment == null) return NotFound(new { message = "Assignment not found." });

        // Ensure teacher can only modify their own assignment
        if (assignment.TeacherId != teacherId)
        {
            return Forbid();
        }

        assignment.Status = status;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Assignment status updated to {status}." });
    }
}