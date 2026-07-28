const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            walk(p, callback);
        } else if (p.endsWith('.svelte')) {
            callback(p);
        }
    }
}

let changed = 0;
walk('src', (file) => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<title>') && (content.includes('Launchpad') || content.includes('ProgetaLMS') || content.includes('Instructor Portal'))) {
    // Replace title
    content = content.replace(/<title>(.*?)Launchpad(.*?)<\/title>/g, '<title>$1{APP_NAME}$2</title>');
    content = content.replace(/<title>(.*?)ProgetaLMS(.*?)<\/title>/g, '<title>$1{APP_NAME}$2</title>');
    content = content.replace(/<title>(.*?)Instructor Portal(.*?)<\/title>/g, '<title>$1{APP_NAME} Instructor</title>');

    // Add import if missing
    if (content.includes('APP_NAME') && !content.includes("import { APP_NAME }")) {
      const importStmt = `\n\timport { APP_NAME } from '$lib/shared/constants';`;
      if (content.includes('<script lang="ts">')) {
        content = content.replace('<script lang="ts">', `<script lang="ts">${importStmt}`);
      } else if (content.includes('<script>')) {
        content = content.replace('<script>', `<script>${importStmt}`);
      } else {
        content = `<script lang="ts">${importStmt}\n</script>\n\n` + content;
      }
    }

    fs.writeFileSync(file, content);
    changed++;
    console.log(`Updated ${file}`);
  }
});
console.log(`Updated ${changed} files.`);
