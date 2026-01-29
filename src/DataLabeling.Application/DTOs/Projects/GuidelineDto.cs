using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataLabeling.Application.DTOs.Projects
{
    public class GuidelineDto
    {

        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string? Content { get; set; }
        public string? FileName { get; set; }
        public long? FileSize { get; set; }
        public string? ContentType { get; set; }
        public string? FileUrl { get; set; }
        public int Version { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }  // ✅ Đảm bảo là nullable
    }
}
