import fs from 'fs';
const content = fs.readFileSync('src/hooks/__tests__/useAiChat.test.ts', 'utf8');
fs.writeFileSync('src/hooks/__tests__/useAiChat.test.ts', content.replace(
  "expect(result.current.messages.length).toBe(2);",
  "if(result.current.messages.length!==2) console.log(JSON.stringify(result.current.messages, null, 2));\n    expect(result.current.messages.length).toBe(2);"
));
