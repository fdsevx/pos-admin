const fs = require('fs');
const file = 'src/app/(auth)/login/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const msg = data.message || data.error || 'Login gagal. Periksa kembali username dan password Anda.';",
  "const msg = data.message || (typeof data.error === 'string' ? data.error : data.error?.message) || 'Login gagal. Periksa kembali username dan password Anda.';"
);

fs.writeFileSync(file, content);
