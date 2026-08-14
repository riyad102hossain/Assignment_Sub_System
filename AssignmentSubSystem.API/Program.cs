using AssignmentSubSystem.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Filters; 
using System.Text;
using AssignmentSubSystem.API.Middlewares;

var builder = WebApplication.CreateBuilder(args);
// 1. Configure PostgreSQL Database Context
builder.Services.AddDbContext<AssignmentSubDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    
    // Suppress pending model changes warnings for EF Core 9/10 compatibility
    options.ConfigureWarnings(warnings => 
        warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// 2. Configure JWT Authentication & Authorization
var jwtSecret = builder.Configuration["Jwt:Secret"] 
    ?? throw new InvalidOperationException("JWT Secret is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => 
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero ,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = System.Security.Claims.ClaimTypes.NameIdentifier
        };
    });

builder.Services.AddAuthorization();


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
builder.Services.AddControllers();

// 3. Configure Swagger/OpenAPI with JWT Authentication Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AssignmentSubSystem API", Version = "v1" });

    // Define standard HTTP Bearer authentication scheme
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Input your JWT token in this format: Bearer {your token here}"
    });

    // Apply security globally so EVERY protected endpoint requires this scheme
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 4. Automatically Apply Database Migrations and Seed Initial Data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var retryCount = 0;
    const int maxRetries = 5;

    while (retryCount < maxRetries)
    {
        try
        {
            var dbContext = services.GetRequiredService<AssignmentSubDbContext>();
            
            logger.LogInformation("Attempting to apply database migrations and seed data...");
            
            // Runs migrations and seeds default users with dynamic BCrypt hashes
            DbInitializer.Initialize(dbContext); 
            
            logger.LogInformation("Database migrations and data seeding completed successfully.");
            break; 
        }
        catch (Exception ex)
        {
            retryCount++;
            logger.LogWarning(ex, $"Database migration or seeding failed. Retrying in 5 seconds... (Attempt {retryCount}/{maxRetries})");
            System.Threading.Thread.Sleep(5000); 
            
            if (retryCount == maxRetries)
            {
                logger.LogError(ex, "Could not apply database migrations or seeding after maximum attempts.");
            }
        }
    }
}

// // 5. Configure Pipeline
// if (app.Environment.IsDevelopment())
// {
//     app.UseSwagger();
//     app.UseSwaggerUI(c =>
//     {
//         c.SwaggerEndpoint("/swagger/v1/swagger.json", "AssignmentSubSystem API v1");
//     });
// }

// else
// {
//     app.UseHttpsRedirection();
// }

// Enable Swagger in all environments (including Production/Render)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "AssignmentSubSystem API v1");
    c.RoutePrefix = "swagger"; 
});

app.UseCors("AllowNextJs");
app.UseMiddleware<ExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();