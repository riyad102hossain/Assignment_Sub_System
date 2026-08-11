using AssignmentSubSystem.API.Data;
using AssignmentSubSystem.API.DTOs;
using AssignmentSubSystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSubSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")] // Only Admins can manage classrooms
public class ClassRoomsController : ControllerBase
{
    private readonly AssignmentSubDbContext _context;

    public ClassRoomsController(AssignmentSubDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous] // Teachers and Students also need to view classrooms
    public async Task<ActionResult<IEnumerable<ClassRoomResponseDto>>> GetClassRooms()
    {
        var classrooms = await _context.ClassRooms
            .Select(c => new ClassRoomResponseDto(c.Id, c.Name, c.Section))
            .ToListAsync();

        return Ok(classrooms);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClassRoomResponseDto>> GetClassRoom(int id)
    {
        var classroom = await _context.ClassRooms.FindAsync(id);

        if (classroom == null)
            return NotFound(new { message = "Classroom not found." });

        return Ok(new ClassRoomResponseDto(classroom.Id, classroom.Name, classroom.Section));
    }

    [HttpPost]
    public async Task<ActionResult<ClassRoomResponseDto>> CreateClassRoom([FromBody] CreateClassRoomDto dto)
    {
        var classroom = new ClassRoom
        {
            Name = dto.Name,
            Section = dto.Section
        };

        _context.ClassRooms.Add(classroom);
        await _context.SaveChangesAsync();

        var response = new ClassRoomResponseDto(classroom.Id, classroom.Name, classroom.Section);
        return CreatedAtAction(nameof(GetClassRoom), new { id = classroom.Id }, response);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateClassRoom(int id, [FromBody] UpdateClassRoomDto dto)
    {
        var classroom = await _context.ClassRooms.FindAsync(id);

        if (classroom == null)
            return NotFound(new { message = "Classroom not found." });

        classroom.Name = dto.Name;
        classroom.Section = dto.Section;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClassRoom(int id)
    {
        var classroom = await _context.ClassRooms.FindAsync(id);

        if (classroom == null)
            return NotFound(new { message = "Classroom not found." });

        _context.ClassRooms.Remove(classroom);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}