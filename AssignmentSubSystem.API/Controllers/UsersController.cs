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
public class UsersController : ControllerBase
{
    private readonly AssignmentSubDbContext _context;

    public UsersController(AssignmentSubDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetUsers()
    {
        var users = await _context.Users
            .Select(u => new UserResponseDto(u.Id, u.Name, u.Email, u.Role.ToString(), u.ClassRoomId, u.CreatedAt))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost]
    public async Task<ActionResult<UserResponseDto>> CreateUser([FromBody] CreateUserDto dto)
    {
        var emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
        if (emailExists)
            return BadRequest(new { message = "Email is already registered." });

        if (dto.Role == UserRole.Student && dto.ClassRoomId.HasValue)
        {
            var classExists = await _context.ClassRooms.AnyAsync(c => c.Id == dto.ClassRoomId.Value);
            if (!classExists)
                return BadRequest(new { message = "Invalid ClassRoomId." });
        }

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            ClassRoomId = dto.Role == UserRole.Student ? dto.ClassRoomId : null,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var response = new UserResponseDto(user.Id, user.Name, user.Email, user.Role.ToString(), user.ClassRoomId, user.CreatedAt);
        return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found." });

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}