const bcrypt = require('bcryptjs');

const hash = '$2b$10$2X/hJZf4S6a.2IZs1lExHuUAROOfw.Z.jJus1kqyNYH3COzOaqKsW';
const password = 'password123';

const isMatch = bcrypt.compareSync(password, hash);
console.log(`Hash matches password123: ${isMatch}`);
