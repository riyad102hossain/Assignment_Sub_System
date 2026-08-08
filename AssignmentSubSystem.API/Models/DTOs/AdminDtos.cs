using System.ComponentModel.DataAnnotations;
using AssignmentSubSystem.API.Models;

namespace AssignmentSubSystem.API.DTOs;

// --- ClassRoom DTOs ---
public record CreateClassRoomDto(
    [Required] string Name,
    [Required] string Section
);

public record UpdateClassRoomDto(
    [Required] string Name,
    [Required] string Section
);

public record ClassRoomResponseDto(
    int Id,
    string Name,
    string Section
);

// --- Subject DTOs ---
public record CreateSubjectDto(
    [Required] string Name,
    [Required] int ClassRoomId
);

public record SubjectResponseDto(
    int Id,
    string Name,
    int ClassRoomId,
    string? ClassRoomName
);

public record AssignTeacherDto(
    [Required] int TeacherId,
    [Required] int SubjectId
);

// --- User Management DTOs ---
public record CreateUserDto(
    [Required] string Name,
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password,
    [Required] UserRole Role,
    int? ClassRoomId
);

public record UserResponseDto(
    int Id,
    string Name,
    string Email,
    string Role,
    int? ClassRoomId,
    DateTime CreatedAt
);