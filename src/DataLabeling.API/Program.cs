using DataLabeling.Infrastructure;
using DataLabeling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ==================== Add Services ====================

// Add Infrastructure Layer (DbContext, Repositories, UnitOfWork)
builder.Services.AddInfrastructure(builder.Configuration);

// Add Controllers
builder.Services.AddControllers();

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Data Labeling System API",
        Version = "v1",
        Description = "API for Data Labeling Support System"
    });
});

// TODO: Add Authentication (JWT)
// TODO: Add Application Services

var app = builder.Build();

// ==================== Configure Pipeline ====================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Data Labeling API v1");
    });
}

app.UseHttpsRedirection();

// TODO: Add Authentication Middleware
// app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ==================== Initialize Database ====================
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    // Apply migrations automatically in development
    if (app.Environment.IsDevelopment())
    {
        dbContext.Database.Migrate();
    }
}

app.Run();
