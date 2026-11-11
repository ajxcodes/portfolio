using Bogus;
using Portfolio.Domain.Content;

namespace Portfolio.Faker.Blog;

public static class PostFaker
{
    public static IEnumerable<BlogPost> Generate(int count = 1) =>
        new Faker<BlogPost>()
            .RuleFor(p => p.Id, f => Guid.CreateVersion7())
            .RuleFor(p => p.Title, f => string.Join(" ", f.Lorem.Words(3)))
            .RuleFor(p => p.Content, f => f.Lorem.Paragraphs(2))
            .RuleFor(p => p.Visible, _ => true)
            .RuleFor(p => p.Slug, f => f.Lorem.Slug())
            .RuleFor(p => p.DatePosted, f => DateTime.UtcNow)
            .RuleFor(p => p.ResumeProfileId, f => Guid.CreateVersion7())
            .Generate(count);
}
