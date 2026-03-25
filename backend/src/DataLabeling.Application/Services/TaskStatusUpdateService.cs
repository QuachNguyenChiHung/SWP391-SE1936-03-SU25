using DataLabeling.Core.Enums;
using DataLabeling.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DataLabeling.Application.Services;

/// <summary>
/// Background service that periodically checks and updates task statuses.
/// Marks tasks as Overdue if their deadline has passed.
/// </summary>
public class TaskStatusUpdateService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TaskStatusUpdateService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(15); // Check every 15 minutes

    public TaskStatusUpdateService(
        IServiceProvider serviceProvider,
        ILogger<TaskStatusUpdateService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TaskStatusUpdateService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await UpdateOverdueTasksAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating overdue tasks");
            }

            // Wait for the next check interval
            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("TaskStatusUpdateService stopped");
    }

    private async Task UpdateOverdueTasksAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        try
        {
            // Get all tasks that are not completed/submitted and have a deadline
            var allTasks = await unitOfWork.AnnotationTasks.GetAllAsync(cancellationToken);
            
            var now = DateTime.UtcNow;
            var tasksToUpdate = allTasks
                .Where(t => 
                    t.Deadline.HasValue &&
                    t.Deadline.Value.Date < now.Date && // Deadline has passed
                    (t.Status == AnnotationTaskStatus.Assigned || t.Status == AnnotationTaskStatus.InProgress) // Only update active tasks
                )
                .ToList();

            if (tasksToUpdate.Any())
            {
                _logger.LogInformation($"Found {tasksToUpdate.Count} tasks to mark as overdue");

                foreach (var task in tasksToUpdate)
                {
                    task.Status = AnnotationTaskStatus.Overdue;
                    task.UpdatedAt = DateTime.UtcNow;
                    unitOfWork.AnnotationTasks.Update(task);
                }

                await unitOfWork.SaveChangesAsync(cancellationToken);
                _logger.LogInformation($"Successfully marked {tasksToUpdate.Count} tasks as overdue");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating overdue tasks");
            throw;
        }
    }
}
