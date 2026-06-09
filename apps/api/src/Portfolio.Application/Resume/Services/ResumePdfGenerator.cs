using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Portfolio.Domain.Resume;

namespace Portfolio.Application.Resume.Services;

public class ResumePdfGenerator : IResumePdfGenerator
{
    static ResumePdfGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GeneratePdf(ResumeProfile profile, List<SkillCategory> skillCategories)
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
                        contactParts.Add(emailLink.Url.Replace("mailto:", ""));
                    }

                    // Add Phone / Other links
                    var phoneLink = profile.Links.FirstOrDefault(l => 
                        l.LinkType?.KeyIdentifier == "phone" || l.LinkType?.Name?.Equals("Phone", StringComparison.OrdinalIgnoreCase) == true);
                    if (phoneLink != null)
                    {
                        contactParts.Add(phoneLink.Url);
                    }

                    // Add LinkedIn
                    var linkedinLink = profile.Links.FirstOrDefault(l => 
                        l.LinkType?.KeyIdentifier == "linkedin" || l.LinkType?.Name?.Equals("LinkedIn", StringComparison.OrdinalIgnoreCase) == true);
                    if (linkedinLink != null)
                    {
                        contactParts.Add(linkedinLink.Url.Replace("https://", "").Replace("www.", ""));
                    }

                    // Add GitHub
                    var githubLink = profile.Links.FirstOrDefault(l => 
                        l.LinkType?.KeyIdentifier == "github" || l.LinkType?.Name?.Equals("GitHub", StringComparison.OrdinalIgnoreCase) == true);
                    if (githubLink != null)
                    {
                        contactParts.Add(githubLink.Url.Replace("https://", "").Replace("www.", ""));
                    }

                    // Add Portfolio / Website Link
                    var websiteLink = profile.Links.FirstOrDefault(l => 
                        l.LinkType?.KeyIdentifier == "website" || l.LinkType?.Name?.Equals("Website", StringComparison.OrdinalIgnoreCase) == true);
                    if (websiteLink != null)
                    {
                        contactParts.Add(websiteLink.Url.Replace("https://", "").Replace("www.", ""));
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

                    // 4. Skills
                    if (skillCategories != null && skillCategories.Any())
                    {
                        column.Item().Column(skillsCol =>
                        {
                            skillsCol.Spacing(4);
                            skillsCol.Item().Text("AREAS OF EXPERTISE & SKILLS").Bold().FontSize(11).FontColor(Colors.Black);

                            foreach (var cat in skillCategories)
                            {
                                var skills = cat.Skills.OrderBy(s => s.DisplayOrder).Select(s => s.SkillName);
                                if (skills.Any())
                                {
                                    skillsCol.Item().Text(text =>
                                    {
                                        text.DefaultTextStyle(x => x.LineHeight(1.15f));
                                        text.Span($"{cat.CategoryName}: ").Bold();
                                        text.Span(string.Join(", ", skills));
                                    });
                                }
                            }
                        });
                    }

                    // 5. Professional Experience
                    var activeExperiences = profile.WorkExperiences
                        .Where(we => !we.IsPrevious)
                        .OrderBy(we => we.DisplayOrder)
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
                                    jobCol.Spacing(3);
                                    
                                    // Job Title Line (Role, Company, Location on Left, Period on Right)
                                    jobCol.Item().Row(row =>
                                    {
                                        row.RelativeItem().Text(text =>
                                        {
                                            text.Span($"{exp.Role}").Bold().FontColor(Colors.Black);
                                            text.Span(" | ").FontColor(Colors.Grey.Darken1);
                                            text.Span($"{exp.Company}").SemiBold().FontColor(Colors.Grey.Darken3);
                                            if (!string.IsNullOrEmpty(exp.Location))
                                            {
                                                text.Span($" — {exp.Location}").Italic().FontColor(Colors.Grey.Darken2);
                                            }
                                        });
                                        row.ConstantItem(120).AlignRight().Text(exp.Period).SemiBold().FontColor(Colors.Grey.Darken3);
                                    });

                                    // Bullet Points
                                    var sortedHighlights = exp.Highlights.OrderBy(h => h.DisplayOrder).ToList();
                                    foreach (var hl in sortedHighlights)
                                    {
                                        jobCol.Item().Row(bulletRow =>
                                        {
                                            bulletRow.ConstantItem(12).AlignLeft().Text("•").FontSize(10);
                                            bulletRow.RelativeItem().Text(hl.ResultText).LineHeight(1.2f).FontSize(9.5f);
                                        });
                                    }
                                });
                            }
                        });
                    }

                    // 6. Previous Experience
                    var prevExperiences = profile.WorkExperiences
                        .Where(we => we.IsPrevious)
                        .OrderBy(we => we.DisplayOrder)
                        .ToList();

                    if (prevExperiences.Any())
                    {
                        column.Item().Column(prevCol =>
                        {
                            prevCol.Spacing(6);
                            prevCol.Item().Text("PREVIOUS EXPERIENCE").Bold().FontSize(11).FontColor(Colors.Black);

                            foreach (var exp in prevExperiences)
                            {
                                prevCol.Item().Row(row =>
                                {
                                    row.RelativeItem().Text(text =>
                                    {
                                        text.Span($"{exp.Role}").Bold();
                                        text.Span(" | ").FontColor(Colors.Grey.Darken1);
                                        text.Span($"{exp.Company}").FontColor(Colors.Grey.Darken3);
                                        if (!string.IsNullOrEmpty(exp.Location))
                                        {
                                            text.Span($" ({exp.Location})").FontColor(Colors.Grey.Darken2);
                                        }
                                    });
                                    row.ConstantItem(120).AlignRight().Text(exp.Period).FontColor(Colors.Grey.Darken3);
                                });
                            }
                        });
                    }
                });

                // Footer with page numbering
                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        }).GeneratePdf();
    }
}
