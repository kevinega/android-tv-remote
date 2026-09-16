import app from './server.js';

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TV Remote server listening on http://0.0.0.0:${PORT}`);
});
