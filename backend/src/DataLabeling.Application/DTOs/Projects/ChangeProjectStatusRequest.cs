using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using DataLabeling.Core.Enums;
namespace DataLabeling.Application.DTOs.Projects
{
   public class ChangeProjectStatusRequest
    {
        [Required]
        public ProjectStatus Status { get; set; }
    }
}
