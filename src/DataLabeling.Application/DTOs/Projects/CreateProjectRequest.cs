using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using DataLabeling.Core.Enums;
namespace DataLabeling.Application.DTOs.Projects
{
    public class CreateProjectRequest
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = default!;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        public ProjectType Type { get; set; }

        public DateOnly? Deadline { get; set; }
    }
}
