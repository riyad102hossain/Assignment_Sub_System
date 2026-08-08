using AssignmentSubSystem.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models; // Required for OpenApi models
using Swashbuckle.AspNetCore.Filters; // Add for SecurityRequirementsOperationFilter
using System.Text;

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
            ClockSkew = TimeSpan.Zero 
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// 3. Configure Swagger with Full Inline Namespaces (No ambiguous using directives)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "AssignmentSystem API", Version = "v1" });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token in the format: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
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
    
    // Enable operation filter to apply security to individual endpoints
    options.OperationFilter<SecurityRequirementsOperationFilter>();
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

// 5. Configure Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AssignmentSubSystem API v1");
    });
}
else
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();