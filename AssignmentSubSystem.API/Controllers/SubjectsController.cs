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

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSubject(int id, [FromBody] UpdateSubjectDto dto)
    {
        var subject = await _context.Subjects.FindAsync(id);
        if (subject == null)
            return NotFound(new { message = "Subject not found." });

        var classExists = await _context.ClassRooms.AnyAsync(c => c.Id == dto.ClassRoomId);
        if (!classExists)
            return BadRequest(new { message = "Invalid ClassRoomId." });

        subject.Name = dto.Name;
        subject.ClassRoomId = dto.ClassRoomId;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Subject updated successfully." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSubject(int id)
    {
        var subject = await _context.Subjects.FindAsync(id);
        if (subject == null)
            return NotFound(new { message = "Subject not found." });

        // Check if there are any assignments for this subject
        var hasAssignments = await _context.Assignments.AnyAsync(a => a.SubjectId == id);
        if (hasAssignments)
        {
            return BadRequest(new { message = "Cannot delete subject with existing assignments." });
        }

        // Remove teacher assignments for this subject
        var teacherAssignments = await _context.SubjectTeachers.Where(st => st.SubjectId == id).ToListAsync();
        _context.SubjectTeachers.RemoveRange(teacherAssignments);

        _context.Subjects.Remove(subject);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Subject deleted successfully." });
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

    [HttpDelete("unassign-teacher")]
    public async Task<IActionResult> UnassignTeacher([FromBody] AssignTeacherDto dto)
    {
        var subjectTeacher = await _context.SubjectTeachers
            .FirstOrDefaultAsync(st => st.TeacherId == dto.TeacherId && st.SubjectId == dto.SubjectId);

        if (subjectTeacher == null)
            return NotFound(new { message = "Teacher assignment not found." });

        _context.SubjectTeachers.Remove(subjectTeacher);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Teacher unassigned from subject successfully." });
    }
}
