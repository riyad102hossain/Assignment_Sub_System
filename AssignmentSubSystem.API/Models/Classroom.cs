namespace AssignmentSubSystem.API.Models;
public class ClassRoom
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // e.g., Class 10, Batch A
    public string Section { get; set; } = string.Empty;

    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}