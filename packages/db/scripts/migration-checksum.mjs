import crypto from 'node:crypto';
import fs from 'node:fs';

const file = process.argv[2];
const content = fs.readFileSync(file, 'utf8');
const hash = crypto.createHash('sha256').update(content).digest('hex');
console.log(hash);
