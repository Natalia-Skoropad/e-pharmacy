import { app } from './app';
import { env } from './config/env';

//===============================================================

app.listen(env.PORT, () => {
  console.log(`API is running on http://localhost:${env.PORT}`);
});
