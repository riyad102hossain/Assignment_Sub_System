using System.Security.Claims;
using AssignmentSubSystem.API.Controllers;
using AssignmentSubSystem.API.Data;
using AssignmentSubSystem.API.DTOs;
using AssignmentSubSystem.API.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AssignmentSubSystem.Tests;

public class SubmissionReviewTests
{
    private AssignmentSubDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AssignmentSubDbContext>()
            .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
            .Options;

        return new AssignmentSubDbContext(options);
    }

    [Fact]
    public async Task Review_Fails_WhenObtainedMarksExceedMax()
    {
        using var context = CreateInMemoryContext();

        var teacherId = 10;
        var assignment = new Assignment { Id = 1, Title = "A", MaxMarks = 50m, TeacherId = teacherId };
        context.Assignments.Add(assignment);

        var submission = new Submission { Id = 1, AssignmentId = assignment.Id, StudentId = 2, AnswerContent = "Ans", Assignment = assignment };
        context.Submissions.Add(submission);

        await context.SaveChangesAsync();

        var controller = new SubmissionsController(context);
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, teacherId.ToString()), new Claim(ClaimTypes.Role, UserRole.Teacher.ToString()) }));
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = user } };

        var dto = new ReviewSubmissionDto { ObtainedMarks = 60m, TeacherFeedback = "Too many" };

        var result = await controller.Review(submission.Id, dto);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Review_ValidSubmission_UpdatesStatusAndMarks()
    {
        using var context = CreateInMemoryContext();

        var teacherId = 20;
        var assignment = new Assignment { Id = 2, Title = "B", MaxMarks = 100m, TeacherId = teacherId };
        context.Assignments.Add(assignment);

        var submission = new Submission { Id = 2, AssignmentId = assignment.Id, StudentId = 3, AnswerContent = "Ans", Assignment = assignment };
        context.Submissions.Add(submission);

        await context.SaveChangesAsync();

        var controller = new SubmissionsController(context);
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, teacherId.ToString()), new Claim(ClaimTypes.Role, UserRole.Teacher.ToString()) }));
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = user } };

        var dto = new ReviewSubmissionDto { ObtainedMarks = 85m, TeacherFeedback = "Good work" };

        var result = await controller.Review(submission.Id, dto);

        Assert.IsType<OkObjectResult>(result);

        var updated = await context.Submissions.FindAsync(submission.Id);
        Assert.NotNull(updated);
        Assert.Equal(SubmissionStatus.Reviewed, updated!.Status);
        Assert.Equal(dto.ObtainedMarks, updated.ObtainedMarks);
    }
}
