using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DataLabeling.Core.Enums;
using System.ComponentModel.DataAnnotations;
namespace DataLabeling.Application.DTOs.Projects
{
   public class UpdateProjectRequest
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = default!;

        [MaxLength(1000)]
        public string? Description { get; set; }

        public DateOnly? Deadline { get; set; }
    }
}
