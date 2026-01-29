using AutoMapper;
using DataLabeling.Application.DTOs.Label;
using DataLabeling.Application.DTOs.User;
using DataLabeling.Core.Entities;

namespace DataLabeling.Application.Mappings;

/// <summary>
/// AutoMapper profile for mapping between entities and DTOs.
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<User, UserDto>();
        CreateMap<User, PendingUserDto>();
        CreateMap<CreateUserRequest, User>()
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email.ToLowerInvariant()));

        // Label mappings
        CreateMap<Label, LabelDto>();
        CreateMap<CreateLabelRequest, Label>();
    }
}
