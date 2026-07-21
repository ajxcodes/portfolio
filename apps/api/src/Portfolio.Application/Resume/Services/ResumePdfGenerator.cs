using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Portfolio.Application.Resume.Contracts.Responses;

namespace Portfolio.Application.Resume.Services;

public class ResumePdfGenerator : IResumePdfGenerator
{
    static ResumePdfGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GeneratePdf(ResumeProfileResponse profile, List<SkillCategoryResponse> skillCategories)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.Letter);
                page.Margin(36, Unit.Point); // 0.5 inch margins for ATS spacing
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontFamily(Fonts.Arial).FontSize(10).FontColor(Colors.Grey.Darken4));

                page.Content().Column(column =>
                {
                    column.Spacing(12);

                    // 1. Header (Name, Title)
                    column.Item().Column(header =>
                    {
                        header.Spacing(2);
                        header.Item().Text(profile.Name).Bold().FontSize(20).FontColor(Colors.Black);
                        header.Item().Text(profile.Title).SemiBold().FontSize(12).FontColor(Colors.Grey.Darken2);
                    });

                    // 2. Contact Links
                    var contactParts = new List<string>();
                    
                    // Add Email
                    var emailLink = profile.Links.FirstOrDefault(l => 
                        l.LinkType?.KeyIdentifier == "email" || l.LinkType?.Name?.Equals("Email", StringComparison.OrdinalIgnoreCase) == true);
                    if (emailLink != null)
                    {
                        contactParts.Add(FormatContactUrl(emailLink.Url, "email"));
                    }

                    // Add Phone / Other links
                    var phoneLink = profile.Links.FirstOrDefault(l => 
                        l.LinkType?.KeyIdentifier == "phone" || l.LinkType?.Name?.Equals("Phone", StringComparison.OrdinalIgnoreCase) == true);
                    if (phoneLink != null)
                    {
                        contactParts.Add(FormatContactUrl(phoneLink.Url, "phone"));
                    }

                    // Add LinkedIn
                    var linkedinLink = profile.Links.FirstOrDefault(l => 
                        l.LinkType?.KeyIdentifier == "linkedin" || l.LinkType?.Name?.Equals("LinkedIn", StringComparison.OrdinalIgnoreCase) == true);
                    if (linkedinLink != null)
                    {
                        contactParts.Add(FormatContactUrl(linkedinLink.Url, "linkedin"));
                    }

                    // Add GitHub
                    var githubLink = profile.Links.FirstOrDefault(l => 
                        l.LinkType?.KeyIdentifier == "github" || l.LinkType?.Name?.Equals("GitHub", StringComparison.OrdinalIgnoreCase) == true);
                    if (githubLink != null)
                    {
                        contactParts.Add(FormatContactUrl(githubLink.Url, "github"));
                    }

                    // Add Portfolio / Website Link
                    var websiteLink = profile.Links.FirstOrDefault(l => 
                        l.LinkType?.KeyIdentifier == "website" || l.LinkType?.Name?.Equals("Website", StringComparison.OrdinalIgnoreCase) == true);
                    if (websiteLink != null)
                    {
                        contactParts.Add(FormatContactUrl(websiteLink.Url, "website"));
                    }

                    if (contactParts.Any())
                    {
                        column.Item().Text(string.Join("   |   ", contactParts)).FontSize(9).FontColor(Colors.Grey.Darken3);
                        column.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten1);
                    }

                    // 3. Professional Summary
                    if (!string.IsNullOrEmpty(profile.Intro))
                    {
                        column.Item().Column(summaryCol =>
                        {
                            summaryCol.Spacing(4);
                            summaryCol.Item().Text("PROFESSIONAL SUMMARY").Bold().FontSize(11).FontColor(Colors.Black);
                            summaryCol.Item().Text(profile.Intro).LineHeight(1.2f);
                        });
                    }

                    // 4. Skills & Technologies
                    if (skillCategories != null && skillCategories.Any())
                    {
                        column.Item().Column(skillsCol =>
                        {
                            skillsCol.Spacing(4);
                            skillsCol.Item().Text("SKILLS & TECHNOLOGIES").Bold().FontSize(11).FontColor(Colors.Black);

                            foreach (var cat in skillCategories.OrderBy(c => c.DisplayOrder))
                            {
                                if (cat.Skills != null && cat.Skills.Any())
                                {
                                    var skillNames = string.Join(", ", cat.Skills.OrderBy(s => s.DisplayOrder).Select(s => s.SkillName));
                                    skillsCol.Item().Text(text =>
                                    {
                                        text.Span($"{cat.CategoryName}: ").Bold();
                                        text.Span(skillNames);
                                    });
                                }
                            }
                        });
                    }

                    // 5. Work Experience
                    var activeExperiences = profile.WorkExperiences
                        .Where(w => !w.IsPrevious)
                        .OrderBy(w => w.DisplayOrder)
                        .ToList();

                    if (activeExperiences.Any())
                    {
                        column.Item().Column(expCol =>
                        {
                            expCol.Spacing(8);
                            expCol.Item().Text("PROFESSIONAL EXPERIENCE").Bold().FontSize(11).FontColor(Colors.Black);

                            foreach (var exp in activeExperiences)
                            {
                                expCol.Item().Column(jobCol =>
                                {
                                    jobCol.Spacing(2);

                                    jobCol.Item().Row(row =>
                                    {
                                        row.RelativeItem().Text(text =>
                                        {
                                            text.Span(exp.Role).Bold();
                                            text.Span($" | {exp.Company}").SemiBold();
                                            if (!string.IsNullOrEmpty(exp.Location))
                                            {
                                                text.Span($" ({exp.Location})").Italic().FontColor(Colors.Grey.Darken1);
                                            }
                                        });
                                        row.ConstantItem(150).AlignRight().Text(exp.Period).FontSize(9).FontColor(Colors.Grey.Darken2);
                                    });

                                    if (exp.Highlights != null && exp.Highlights.Any())
                                    {
                                        foreach (var highlight in exp.Highlights.OrderBy(h => h.DisplayOrder))
                                        {
                                            jobCol.Item().PaddingLeft(8).Text($"• {highlight.ResultText}").LineHeight(1.15f);
                                        }
                                    }
                                });
                            }
                        });
                    }

                    // 6. Additional / Previous Experience
                    var prevExperiences = profile.WorkExperiences
                        .Where(w => w.IsPrevious)
                        .OrderBy(w => w.DisplayOrder)
                        .ToList();

                    if (prevExperiences.Any())
                    {
                        column.Item().Column(prevCol =>
                        {
                            prevCol.Spacing(6);
                            prevCol.Item().Text("ADDITIONAL EXPERIENCE").Bold().FontSize(11).FontColor(Colors.Black);

                            foreach (var exp in prevExperiences)
                            {
                                prevCol.Item().Row(row =>
                                {
                                    row.RelativeItem().Text(text =>
                                    {
                                        text.Span(exp.Role).Bold();
                                        text.Span($" | {exp.Company}");
                                    });
                                    row.ConstantItem(150).AlignRight().Text(exp.Period).FontSize(9).FontColor(Colors.Grey.Darken2);
                                });
                            }
                        });
                    }
                });
            });
        }).GeneratePdf();
    }

    private static string FormatContactUrl(string rawUrl, string type)
    {
        if (string.IsNullOrWhiteSpace(rawUrl)) return string.Empty;

        var cleaned = rawUrl.Trim();
        cleaned = cleaned.Replace("https://", "").Replace("http://", "").Replace("mailto:", "").Replace("tel:", "");
        if (cleaned.EndsWith("/")) cleaned = cleaned.TrimEnd('/');

        return cleaned;
    }
}
