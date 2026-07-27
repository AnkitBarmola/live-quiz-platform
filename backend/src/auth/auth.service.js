const bcrypt = require('bcrypt');

module.exports = {
  hashPassword: async (password) => {
    return bcrypt.hash(password, 10);
  },

  comparePassword: async (password, hash) => {
    return bcrypt.compare(password, hash);
  },
};
