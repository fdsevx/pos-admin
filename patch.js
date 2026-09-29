const fs = require('fs');
const file = 'src/app/(auth)/login/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'if (!response.ok || !data.success) {',
  'if (!response.ok) {'
);

content = content.replace(
  'if (data.data?.token) {',
  'if (data.tokens?.access_token) {'
);

content = content.replace(
  'setAuthToken(data.data.token);',
  'setAuthToken(data.tokens.access_token);'
);

fs.writeFileSync(file, content);
