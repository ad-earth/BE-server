const express = require('express');
const app = express();
const port = 3005;

app.get('/', (req, res) => {
  res.send('hello adEarth');
});

app.listen(port, () => console.log(`http://localhost:${port}`));

module.exports = app;
