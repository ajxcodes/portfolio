-- Insert Pi-hole blog post
INSERT INTO "Post" (
    "Id",
    "Slug",
    "Title",
    "Summary",
    "Content",
    "DatePosted",
    "PostedBy",
    "DateModified",
    "ModifiedBy",
    "Visible"
)
VALUES (
    '8a514d48-18e3-4b95-a20d-034870c538cb',
    'setting-up-pi-hole',
    'Setting up Pi-hole at home to block ads',
    'A step-by-step guide to reclaiming your network and blocking advertisements on all your devices with Pi-hole.',
    'Pi-hole is a DNS sinkhole that protects your devices from unwanted content, without installing any client-side software. In this guide, we will set up Pi-hole on a local network using Docker/Podman, configure DNS settings on the router, and enjoy ad-free browsing across all devices.',
    '2026-06-01 08:00:00+00',
    'ajxcodes',
    NULL,
    NULL,
    true
);

-- Insert Next.js vs Blazor blog post
INSERT INTO "Post" (
    "Id",
    "Slug",
    "Title",
    "Summary",
    "Content",
    "DatePosted",
    "PostedBy",
    "DateModified",
    "ModifiedBy",
    "Visible"
)
VALUES (
    '3f7de188-f5bc-425b-ae03-b0ee693b4a24',
    'nextjs-vs-blazor',
    'Next.js vs Blazor: A .NET Developer''s Perspective',
    'Comparing two powerful frameworks for building modern web applications from the viewpoint of a seasoned C# developer.',
    'For years, .NET developers relied on ASP.NET MVC, WebForms, and later SPAs like Angular or React with a C# web API backend. With the introduction of Blazor, developers can now build interactive web UIs using C# instead of JavaScript. Meanwhile, Next.js has emerged as the premier React framework for server-side rendering and static site generation. Let''s compare their architectural differences, developer experience, and performance.',
    '2026-06-02 09:30:00+00',
    'ajxcodes',
    NULL,
    NULL,
    true
);

-- Insert .NET 10 News blog post
INSERT INTO "Post" (
    "Id",
    "Slug",
    "Title",
    "Summary",
    "Content",
    "DatePosted",
    "PostedBy",
    "DateModified",
    "ModifiedBy",
    "Visible"
)
VALUES (
    'f9202027-e439-4d69-8d7b-944510ee4dbe',
    'dotnet-10-news',
    'What''s New in .NET 10?',
    'A look into the future of the .NET ecosystem and the most anticipated features in the upcoming .NET 10 release.',
    '.NET 10 continues the evolution of modern C# and dotNET. Key areas of focus include enhanced cloud-native performance, deeper integration with AI tools, improved JIT compiler optimizations, and further updates to .NET MAUI. In this post, we explore the preview features and what they mean for production enterprise apps.',
    '2026-06-03 11:00:00+00',
    'ajxcodes',
    NULL,
    NULL,
    true
);