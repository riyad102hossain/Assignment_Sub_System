using AssignmentSubSystem.API.Data;
using AssignmentSubSystem.API.DTOs;
using AssignmentSubSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSubSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class SubjectsController : ControllerBase
{
    private readonly AssignmentSubDbContext _context;

    public SubjectsController(AssignmentSubDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<SubjectResponseDto>>> GetSubjects()
    {
        var subjects = await _context.Subjects
            .Include(s => s.ClassRoom)
            .Select(s => new SubjectResponseDto(s.Id, s.Name, s.ClassRoomId, s.ClassRoom.Name))
            .ToListAsync();

        return Ok(subjects);
    }

    [HttpPost]
    public async Task<ActionResult<SubjectResponseDto>> CreateSubject([FromBody] CreateSubjectDto dto)
    {
        var classExists = await _context.ClassRooms.AnyAsync(c => c.Id == dto.ClassRoomId);
        if (!classExists)
            return BadRequest(new { message = "Invalid ClassRoomId." });

        var subject = new Subject
        {
            Name = dto.Name,
            ClassRoomId = dto.ClassRoomId
        };

        _context.Subjects.Add(subject);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSubjects), new { id = subject.Id }, 
            new SubjectResponseDto(subject.Id, subject.Name, subject.ClassRoomId, null));
    }

    [HttpPost("assign-teacher")]
    public async Task<IActionResult> AssignTeacher([FromBody] AssignTeacherDto dto)
    {
        var teacher = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.TeacherId && u.Role == UserRole.Teacher);
        if (teacher == null)
            return BadRequest(new { message = "Teacher not found or user is not a teacher." });

        var subjectExists = await _context.Subjects.AnyAsync(s => s.Id == dto.SubjectId);
        if (!subjectExists)
            return BadRequest(new { message = "Subject not found." });

        var exists = await _context.SubjectTeachers
            .AnyAsync(st => st.TeacherId == dto.TeacherId && st.SubjectId == dto.SubjectId);

        if (exists)
            return BadRequest(new { message = "Teacher is already assigned to this subject." });

        var subjectTeacher = new SubjectTeacher
        {
            TeacherId = dto.TeacherId,
            SubjectId = dto.SubjectId
        };

        _context.SubjectTeachers.Add(subjectTeacher);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Teacher assigned to subject successfully." });
    }
}