const fs = require('fs');
const content = fs.readFileSync('src/hooks/__tests__/useAiChat.test.ts', 'utf8');
const modified = content.replace(
  "expect(result.current.messages.length).toBe(2);",
  "console.log('MESSAGES:', JSON.stringify(result.current.messages, null, 2));\n    expect(result.current.messages.length).toBe(2);"
);
fs.writeFileSync('src/hooks/__tests__/useAiChat.test.ts', modified);
