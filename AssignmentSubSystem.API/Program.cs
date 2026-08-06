using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure PostgreSQL Database Context
builder.Services.AddDbContext<AssignmentSubSystem.API.Data.AssignmentSubDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Configure JWT Authentication & Authorization
var jwtSecret = builder.Configuration["Jwt:Secret"] 
    ?? throw new InvalidOperationException("JWT Secret is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => 
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero 
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers(); 

// 3. Configure OpenAPI/Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 4. Automatically Apply Database Migrations safely with Retry logic
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
            var dbContext = services.GetRequiredService<AssignmentSubSystem.API.Data.AssignmentSubDbContext>();
            
            logger.LogInformation("Attempting to apply database migrations...");
            
            dbContext.Database.Migrate(); 
            
            logger.LogInformation("Database migration applied successfully.");
            break; 
        }
        catch (Exception ex)
        {
            retryCount++;
            logger.LogWarning(ex, $"Database migration failed. Retrying in 5 seconds... (Attempt {retryCount}/{maxRetries})");
            System.Threading.Thread.Sleep(5000); 
            
            if (retryCount == maxRetries)
            {
                logger.LogError(ex, "Could not apply database migrations after maximum attempts.");
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
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AssignmentSystem.API v1");
    });
}
else
{
    // Production / External HTTPS handling (Optional)
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();