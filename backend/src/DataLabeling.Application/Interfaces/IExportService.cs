using DataLabeling.Application.DTOs.Export;

namespace DataLabeling.Application.Interfaces;

/// <summary>
/// Service interface for exporting annotations in various formats.
/// </summary>
public interface IExportService
{
    /// <summary>
    /// Exports project annotations to the specified format.
    /// Creates a ZIP file containing annotations and optionally images.
    /// </summary>
    /// <param name="projectId">The project ID to export.</param>
    /// <param name="request">Export options.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Export result with download URL and statistics.</returns>
    Task<ExportResultDto> ExportProjectAsync(
        int projectId,
        ExportRequestDto request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the file stream for an exported file.
    /// </summary>
    /// <param name="fileName">The export file name.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>File stream for the export file.</returns>
    Task<Stream> GetExportFileAsync(
        string fileName,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if an export file exists.
    /// </summary>
    /// <param name="fileName">The export file name.</param>
    /// <returns>True if the file exists.</returns>
    bool ExportFileExists(string fileName);

    /// <summary>
    /// Deletes an export file.
    /// </summary>
    /// <param name="fileName">The export file name.</param>
    Task DeleteExportFileAsync(string fileName);
}
