import { BlogPost, ResumeData } from '@/lib/data';
import { toSlug } from '@/lib/slugUtils';

export interface TerminalHistoryItem {
  type: 'input' | 'output';
  text: string;
}

export interface CommandContext {
  blogPosts: BlogPost[];
  resume: ResumeData;
  routerPush: (path: string) => void;
  clearHistory: () => void;
}

export interface CommandHandler {
  execute(arg: string | undefined, context: CommandContext): TerminalHistoryItem[];
}

export const helpHandler: CommandHandler = {
  execute() {
    return [
      { type: 'output', text: 'Available commands:' },
      { type: 'output', text: '  ls                   List available directories (blog, experience, contact)' },
      { type: 'output', text: '  ls [dir]             List records inside a folder (e.g. ls blog, ls experience)' },
      { type: 'output', text: '  cat [file/path]      Display record details (e.g. cat contact, cat blog/setting-up-pi-hole)' },
      { type: 'output', text: '  open blog/[slug]     Open article page directly in current tab' },
      { type: 'output', text: '  clear                Clear terminal output history' },
      { type: 'output', text: '  help                 Show this help manual' }
    ];
  }
};

export const lsHandler: CommandHandler = {
  execute(arg, context) {
    if (!arg) {
      return [{ type: 'output', text: 'blog/  experience/  contact' }];
    }
    const dir = arg.toLowerCase();
    if (dir === 'blog') {
      if (context.blogPosts && context.blogPosts.length > 0) {
        return [{ type: 'output', text: context.blogPosts.map((p) => p.slug).join('  ') }];
      }
      return [{ type: 'output', text: 'No articles found in blog/' }];
    }
    if (dir === 'experience') {
      const experiences = [
        ...(context.resume.experience || []),
        ...(context.resume.previousExperience || [])
      ];
      if (experiences.length > 0) {
        return [{
          type: 'output',
          text: experiences.map((e) => toSlug(e.company)).join('  ')
        }];
      }
      return [{ type: 'output', text: 'No experience records found.' }];
    }
    if (dir === 'contact') {
      return [{ type: 'output', text: 'contact is a file. Type "cat contact" to read.' }];
    }
    return [{ type: 'output', text: `ls: no such directory: ${arg}` }];
  }
};

export const catHandler: CommandHandler = {
  execute(arg, context) {
    if (!arg) {
      return [{ type: 'output', text: 'cat: missing path. Usage: cat [file/path] (e.g. cat contact)' }];
    }
    const target = arg.toLowerCase();
    if (target === 'contact') {
      return [
        { type: 'output', text: `email    : ${context.resume.contact?.email || 'N/A'}` },
        { type: 'output', text: `github   : ${context.resume.contact?.github || 'N/A'}` },
        { type: 'output', text: `linkedin : ${context.resume.contact?.linkedin || 'N/A'}` },
        { type: 'output', text: `calendar : ${context.resume.contact?.calendar || 'N/A'}` }
      ];
    }
    if (target.startsWith('blog/')) {
      const slug = arg.substring(5);
      const post = context.blogPosts.find((p) => p.slug === slug);
      if (post) {
        return [
          { type: 'output', text: `title   : ${post.title}` },
          { type: 'output', text: `summary : ${post.summary}` },
          { type: 'output', text: `command : Type "open blog/${post.slug}" to open full post page.` }
        ];
      }
      return [{ type: 'output', text: `cat: blog post not found: ${slug}` }];
    }
    if (target.startsWith('experience/')) {
      const compSlug = arg.substring(11);
      const experiences = [
        ...(context.resume.experience || []),
        ...(context.resume.previousExperience || [])
      ];
      const exp = experiences.find((e) => toSlug(e.company) === compSlug);

      if (exp) {
        const result: TerminalHistoryItem[] = [
          { type: 'output', text: `company : ${exp.company}` },
          { type: 'output', text: `role    : ${exp.role}` },
          { type: 'output', text: `period  : ${exp.period}` }
        ];
        if ('results' in exp && exp.results && exp.results.length > 0) {
          result.push({ type: 'output', text: 'highlights:' });
          exp.results.forEach((h) => result.push({ type: 'output', text: `  - ${h}` }));
        }
        return result;
      }
      return [{ type: 'output', text: `cat: experience record not found: ${compSlug}` }];
    }
    return [{ type: 'output', text: `cat: no such file or directory: ${arg}` }];
  }
};

export const openHandler: CommandHandler = {
  execute(arg, context) {
    if (!arg || !arg.toLowerCase().startsWith('blog/')) {
      return [{ type: 'output', text: 'open: invalid target. Usage: open blog/[slug]' }];
    }
    const slug = arg.substring(5);
    const post = context.blogPosts.find((p) => p.slug === slug);
    if (post) {
      context.routerPush(`/blog/${slug}`);
      return [{ type: 'output', text: `Navigating to: /blog/${slug}...` }];
    }
    return [{ type: 'output', text: `open: blog post not found: ${slug}` }];
  }
};

export const CommandRegistry: Record<string, CommandHandler> = {
  help: helpHandler,
  ls: lsHandler,
  cat: catHandler,
  open: openHandler
};
