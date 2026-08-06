namespace AssignmentSubSystem.API.Models;
public class Subject
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // e.g., Mathematics, Physics
    public int ClassRoomId { get; set; }
    public ClassRoom? ClassRoom { get; set; }

    public ICollection<SubjectTeacher> SubjectTeachers { get; set; } = new List<SubjectTeacher>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}