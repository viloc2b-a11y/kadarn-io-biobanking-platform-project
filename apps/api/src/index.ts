// Kadarn API server — entry point (not imported by tests)
import { app, API_PREFIX } from './app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`\n  Kadarn API v1.0.0-beta`);
  console.log(`  ─────────────────────`);
  console.log(`  Marketplace  : http://localhost:${PORT}${API_PREFIX}/marketplace`);
  console.log(`  Workspace    : http://localhost:${PORT}${API_PREFIX}/workspace`);
  console.log(`  Operations   : http://localhost:${PORT}${API_PREFIX}/operations`);
  console.log(`  Health       : http://localhost:${PORT}/health\n`);
});
