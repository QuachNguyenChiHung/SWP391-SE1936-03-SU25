using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using DataLabeling.Core.Enums;
namespace DataLabeling.Application.DTOs.Projects
{
    public class ProjectDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = default!;
        public string? Description { get; set; }
        public ProjectType Type { get; set; }
        public ProjectStatus Status { get; set; }
        public DateOnly? Deadline { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Creator info
        public int CreatedById { get; set; }
        public string CreatedByName { get; set; } = default!;

        // Related entities
        public bool HasDataset { get; set; }
        public bool HasGuideline { get; set; }
        public int LabelCount { get; set; }
        public int TaskCount { get; set; }
    }
}
