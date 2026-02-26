# Data Labeling Support System

A comprehensive web application for managing image labeling workflows for machine learning datasets.

## Tech Stack

- **Backend**: ASP.NET Core 8 Web API
- **Database**: SQL Server 2022
- **ORM**: Entity Framework Core 8
- **Authentication**: JWT Bearer Token

## Project Structure

```
DataLabelingSystem/
├── src/
│   ├── DataLabeling.API/            # Web API Layer
│   ├── DataLabeling.Core/           # Domain Layer (Entities, Enums)
│   ├── DataLabeling.Application/    # Application Layer (Services, DTOs)
│   └── DataLabeling.Infrastructure/ # Infrastructure Layer (DbContext, Repositories)
├── docs/                            # Documentation
└── DataLabelingSystem.sln           # Solution file
```

## Getting Started

### Prerequisites

- .NET 8 SDK
- SQL Server 2022 (or SQL Server Express/LocalDB)
- Visual Studio 2022 or VS Code

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DataLabelingSystem
   ```

2. **Update connection string**
   
   Edit `src/DataLabeling.API/appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=DataLabelingDb;Trusted_Connection=True;TrustServerCertificate=True;"
     }
   }
   ```

3. **Restore packages**
   ```bash
   dotnet restore
   ```

4. **Create database migration**
   ```bash
   dotnet ef migrations add InitialCreate -p src/DataLabeling.Infrastructure -s src/DataLabeling.API
   ```

5. **Apply migration**
   ```bash
   dotnet ef database update -p src/DataLabeling.Infrastructure -s src/DataLabeling.API
   ```

6. **Run the application**
   ```bash
   dotnet run --project src/DataLabeling.API
   ```

7. **Open Swagger UI**
   
   Navigate to: https://localhost:7001/swagger

## Key Actors

| Role | Description |
|------|-------------|
| Admin | System administration, user management |
| Manager | Create projects, upload datasets, assign tasks |
| Annotator | Label images (draw bounding boxes, polygons) |
| Reviewer | Review and approve/reject annotations |

## Database Entities

- User, Project, Dataset, DataItem
- Label, Guideline, AnnotationTask, TaskItem
- Annotation, Review, ErrorType, ReviewErrorType
- Notification, ActivityLog

## API Documentation

See `docs/API.md` for detailed API documentation.

## License

This project is proprietary software.
