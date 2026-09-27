const bundle = require('./app.bundle.js');
const app = bundle.app || bundle.default || bundle;

module.exports = app;
