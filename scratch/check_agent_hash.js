const bcrypt = require('bcryptjs');

const hash = '$2b$10$sQFni8s/BHKno4mYUVH2cev2mYN921ou9UxdxMTPFtkNQmVlrrpku';
const password = 'password123';

const isMatch = bcrypt.compareSync(password, hash);
console.log(`Agent hash matches password123: ${isMatch}`);
