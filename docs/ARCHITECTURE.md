# ARCHITECTURE.md - Data Labeling System Architecture

## Overview

This project follows **Clean Architecture** principles with 4 main layers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
│                           (DataLabeling.API)                                │
│                    Controllers, Middlewares, Filters                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                               │
│                        (DataLabeling.Application)                           │
│                   Services, DTOs, Validators, Mappings                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                DOMAIN LAYER                                  │
│                          (DataLabeling.Core)                                │
│                  Entities, Enums, Interfaces, Exceptions                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            INFRASTRUCTURE LAYER                              │
│                       (DataLabeling.Infrastructure)                         │
│               DbContext, Repositories, External Services                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Layer Details

### 1. DataLabeling.Core (Domain Layer)

**Purpose:** Contains enterprise business rules. No dependencies on other layers.

```
DataLabeling.Core/
├── Entities/
│   ├── BaseEntity.cs
│   ├── User.cs
│   ├── Project.cs
│   ├── Dataset.cs
│   ├── DataItem.cs
│   ├── Label.cs
│   ├── Guideline.cs
│   ├── Task.cs
│   ├── TaskItem.cs
│   ├── Annotation.cs
│   ├── Review.cs
│   ├── ErrorType.cs
│   ├── ReviewErrorType.cs
│   ├── Notification.cs
│   └── ActivityLog.cs
│
├── Enums/
│   ├── UserRole.cs
│   ├── UserStatus.cs
│   ├── ProjectType.cs
│   ├── ProjectStatus.cs
│   ├── DataItemStatus.cs
│   ├── TaskStatus.cs
│   ├── TaskItemStatus.cs
│   ├── ReviewDecision.cs
│   ├── NotificationType.cs
│   └── ActivityAction.cs
│
├── Interfaces/
│   ├── Repositories/
│   │   ├── IRepository.cs
│   │   ├── IUserRepository.cs
│   │   ├── IProjectRepository.cs
│   │   └── ... (one per entity)
│   └── IUnitOfWork.cs
│
└── Exceptions/
    ├── NotFoundException.cs
    ├── ValidationException.cs
    ├── UnauthorizedException.cs
    └── ForbiddenException.cs
```

**Key Classes:**

```csharp
// BaseEntity.cs
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

// IRepository.cs
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
    Task<bool> ExistsAsync(int id);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);
}

// IUnitOfWork.cs
public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IProjectRepository Projects { get; }
    IDatasetRepository Datasets { get; }
    IDataItemRepository DataItems { get; }
    ILabelRepository Labels { get; }
    IGuidelineRepository Guidelines { get; }
    ITaskRepository Tasks { get; }
    ITaskItemRepository TaskItems { get; }
    IAnnotationRepository Annotations { get; }
    IReviewRepository Reviews { get; }
    IErrorTypeRepository ErrorTypes { get; }
    INotificationRepository Notifications { get; }
    IActivityLogRepository ActivityLogs { get; }
    
    Task<int> SaveChangesAsync();
}
```

---

### 2. DataLabeling.Application (Application Layer)

**Purpose:** Contains application business rules. Orchestrates data flow.

```
DataLabeling.Application/
├── DTOs/
│   ├── Auth/
│   │   ├── LoginRequest.cs
│   │   ├── LoginResponse.cs
│   │   └── RefreshTokenRequest.cs
│   ├── Users/
│   │   ├── UserDto.cs
│   │   ├── CreateUserRequest.cs
│   │   ├── UpdateUserRequest.cs
│   │   └── UserListResponse.cs
│   ├── Projects/
│   │   ├── ProjectDto.cs
│   │   ├── CreateProjectRequest.cs
│   │   ├── UpdateProjectRequest.cs
│   │   └── ProjectStatisticsDto.cs
│   ├── DataItems/
│   │   ├── DataItemDto.cs
│   │   └── UploadResultDto.cs
│   ├── Annotations/
│   │   ├── AnnotationDto.cs
│   │   ├── CreateAnnotationRequest.cs
│   │   └── BatchAnnotationRequest.cs
│   ├── Reviews/
│   │   ├── ReviewDto.cs
│   │   └── CreateReviewRequest.cs
│   ├── Tasks/
│   │   ├── TaskDto.cs
│   │   └── CreateTaskRequest.cs
│   └── Common/
│       ├── ApiResponse.cs
│       └── PaginatedResponse.cs
│
├── Interfaces/
│   ├── IAuthService.cs
│   ├── IUserService.cs
│   ├── IProjectService.cs
│   ├── IDatasetService.cs
│   ├── IAnnotationService.cs
│   ├── IReviewService.cs
│   ├── ITaskService.cs
│   ├── INotificationService.cs
│   ├── IStatisticsService.cs
│   └── IFileStorageService.cs
│
├── Services/
│   ├── AuthService.cs
│   ├── UserService.cs
│   ├── ProjectService.cs
│   ├── DatasetService.cs
│   ├── AnnotationService.cs
│   ├── ReviewService.cs
│   ├── TaskService.cs
│   ├── NotificationService.cs
│   └── StatisticsService.cs
│
├── Validators/
│   ├── LoginRequestValidator.cs
│   ├── CreateUserRequestValidator.cs
│   ├── CreateProjectRequestValidator.cs
│   └── ... (one per request DTO)
│
└── Mappings/
    └── MappingProfile.cs
```

**Key Classes:**

```csharp
// ApiResponse.cs
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> SuccessResponse(T data, string? message = null)
        => new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> ErrorResponse(string message, List<string>? errors = null)
        => new() { Success = false, Message = message, Errors = errors };
}

// PaginatedResponse.cs
public class PaginatedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}

// IAuthService.cs
public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RefreshTokenAsync(string token);
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}

// Example Service
public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IAuthService _authService;

    public UserService(IUnitOfWork unitOfWork, IMapper mapper, IAuthService authService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _authService = authService;
    }

    public async Task<UserDto> CreateUserAsync(CreateUserRequest request, int createdById)
    {
        // Check if email exists
        var existingUser = await _unitOfWork.Users.GetByEmailAsync(request.Email);
        if (existingUser != null)
            throw new ValidationException("Email already exists");

        // Create user
        var user = _mapper.Map<User>(request);
        user.PasswordHash = _authService.HashPassword(request.Password);

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<UserDto>(user);
    }
}
```

---

### 3. DataLabeling.Infrastructure (Infrastructure Layer)

**Purpose:** Contains implementation details. Database, external services.

```
DataLabeling.Infrastructure/
├── Data/
│   ├── ApplicationDbContext.cs
│   ├── Configurations/
│   │   ├── UserConfiguration.cs
│   │   ├── ProjectConfiguration.cs
│   │   ├── DatasetConfiguration.cs
│   │   ├── DataItemConfiguration.cs
│   │   ├── LabelConfiguration.cs
│   │   ├── GuidelineConfiguration.cs
│   │   ├── TaskConfiguration.cs
│   │   ├── TaskItemConfiguration.cs
│   │   ├── AnnotationConfiguration.cs
│   │   ├── ReviewConfiguration.cs
│   │   ├── ErrorTypeConfiguration.cs
│   │   ├── ReviewErrorTypeConfiguration.cs
│   │   ├── NotificationConfiguration.cs
│   │   └── ActivityLogConfiguration.cs
│   └── DbSeeder.cs
│
├── Repositories/
│   ├── Repository.cs
│   ├── UserRepository.cs
│   ├── ProjectRepository.cs
│   ├── DatasetRepository.cs
│   ├── DataItemRepository.cs
│   ├── LabelRepository.cs
│   ├── GuidelineRepository.cs
│   ├── TaskRepository.cs
│   ├── TaskItemRepository.cs
│   ├── AnnotationRepository.cs
│   ├── ReviewRepository.cs
│   ├── ErrorTypeRepository.cs
│   ├── NotificationRepository.cs
│   ├── ActivityLogRepository.cs
│   └── UnitOfWork.cs
│
├── Services/
│   ├── FileStorageService.cs
│   └── EmailService.cs
│
├── Migrations/
│   └── (EF Core migrations)
│
└── DependencyInjection.cs
```

**Key Classes:**

```csharp
// ApplicationDbContext.cs
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Dataset> Datasets => Set<Dataset>();
    // ... other DbSets

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}

// Repository.cs
public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(int id)
        => await _dbSet.FindAsync(id);

    public virtual async Task<IEnumerable<T>> GetAllAsync()
        => await _dbSet.ToListAsync();

    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        => await _dbSet.Where(predicate).ToListAsync();

    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    public virtual Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }

    public virtual Task DeleteAsync(T entity)
    {
        _dbSet.Remove(entity);
        return Task.CompletedTask;
    }

    public virtual async Task<bool> ExistsAsync(int id)
        => await _dbSet.AnyAsync(e => e.Id == id);

    public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
        => predicate == null 
            ? await _dbSet.CountAsync() 
            : await _dbSet.CountAsync(predicate);
}

// UnitOfWork.cs
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        Users = new UserRepository(_context);
        Projects = new ProjectRepository(_context);
        // ... initialize other repositories
    }

    public IUserRepository Users { get; }
    public IProjectRepository Projects { get; }
    // ... other repositories

    public async Task<int> SaveChangesAsync()
        => await _context.SaveChangesAsync();

    public void Dispose()
        => _context.Dispose();
}

// Entity Configuration Example
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("User");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.Role)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(u => u.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(UserStatus.Active);
    }
}
```

---

### 4. DataLabeling.API (Presentation Layer)

**Purpose:** Entry point. Handles HTTP requests/responses.

```
DataLabeling.API/
├── Controllers/
│   ├── AuthController.cs
│   ├── UsersController.cs
│   ├── ProjectsController.cs
│   ├── DatasetsController.cs
│   ├── DataItemsController.cs
│   ├── LabelsController.cs
│   ├── GuidelinesController.cs
│   ├── TasksController.cs
│   ├── AnnotationsController.cs
│   ├── ReviewsController.cs
│   ├── NotificationsController.cs
│   ├── StatisticsController.cs
│   └── ErrorTypesController.cs
│
├── Middlewares/
│   ├── ExceptionHandlingMiddleware.cs
│   └── RequestLoggingMiddleware.cs
│
├── Filters/
│   └── ValidationFilter.cs
│
├── Extensions/
│   ├── ServiceCollectionExtensions.cs
│   └── ApplicationBuilderExtensions.cs
│
├── appsettings.json
├── appsettings.Development.json
└── Program.cs
```

**Key Classes:**

```csharp
// BaseController.cs
[ApiController]
[Route("api/[controller]")]
public abstract class BaseController : ControllerBase
{
    protected int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    protected string CurrentUserRole => User.FindFirstValue(ClaimTypes.Role)!;

    protected IActionResult ApiOk<T>(T data, string? message = null)
        => Ok(ApiResponse<T>.SuccessResponse(data, message));

    protected IActionResult ApiCreated<T>(T data, string? message = null)
        => StatusCode(201, ApiResponse<T>.SuccessResponse(data, message));

    protected IActionResult ApiError(string message, List<string>? errors = null)
        => BadRequest(ApiResponse<object>.ErrorResponse(message, errors));
}

// UsersController.cs
[Authorize]
public class UsersController : BaseController
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll([FromQuery] UserQueryParams queryParams)
    {
        var result = await _userService.GetAllAsync(queryParams);
        return ApiOk(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _userService.GetByIdAsync(id);
        return ApiOk(user);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var user = await _userService.CreateUserAsync(request, CurrentUserId);
        return ApiCreated(user, "User created successfully");
    }
}

// ExceptionHandlingMiddleware.cs
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = exception switch
        {
            NotFoundException => StatusCodes.Status404NotFound,
            ValidationException => StatusCodes.Status400BadRequest,
            UnauthorizedException => StatusCodes.Status401Unauthorized,
            ForbiddenException => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status500InternalServerError
        };

        _logger.LogError(exception, "An error occurred: {Message}", exception.Message);

        var response = ApiResponse<object>.ErrorResponse(exception.Message);
        
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(response);
    }
}

// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add layers
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

// Add authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]!))
        };
    });

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DbSeeder.SeedAsync(context);
}

app.Run();
```

---

## Dependency Flow

```
API → Application → Core ← Infrastructure
         ↓            ↑
    (uses DTOs)  (implements interfaces)
```

**Rules:**
1. Core has NO dependencies
2. Application depends only on Core
3. Infrastructure depends on Core (implements interfaces)
4. API depends on Application and Infrastructure (for DI registration)

---

## NuGet Packages by Project

### DataLabeling.Core
```xml
<!-- No external packages - pure domain -->
```

### DataLabeling.Application
```xml
<PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.0.1" />
<PackageReference Include="FluentValidation.AspNetCore" Version="11.3.0" />
<PackageReference Include="BCrypt.Net-Next" Version="4.0.3" />
```

### DataLabeling.Infrastructure
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.0" />
```

### DataLabeling.API
```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
```

---

## Project References

```
DataLabeling.API
├── references DataLabeling.Application
└── references DataLabeling.Infrastructure

DataLabeling.Application
└── references DataLabeling.Core

DataLabeling.Infrastructure
└── references DataLabeling.Core
```
