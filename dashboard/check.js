const fs = require('fs');
const html = fs.readFileSync('hopvan-diagnostic.html', 'utf8');
const lines = html.split('\n');
let script = [];
let capture = false;
for (let line of lines) {
    if (line.includes('<script type="module">')) {
        capture = true;
        continue;
    }
    if (line.includes('</script>') && capture) {
        capture = false;
        break;
    }
    if (capture) {
        script.push(line);
    }
}
fs.writeFileSync('test_syntax.mjs', script.join('\n'));
console.log('Done');
