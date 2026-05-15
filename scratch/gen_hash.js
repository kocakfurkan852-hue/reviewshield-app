const bcrypt = require('bcryptjs');
const password = 'Admin12345!';
bcrypt.hash(password, 10).then(hash => {
    console.log(hash);
});
