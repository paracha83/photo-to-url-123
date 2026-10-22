import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { apiRouter } from '../../src/server/api';
import { imageResolverHandler } from '../../src/server/imageResolver';

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use('/api', apiRouter);
app.get('/i/:id', imageResolverHandler);

// Fallback for Netlify redirects
app.use('/.netlify/functions/api', apiRouter);
app.get('/.netlify/functions/api/i/:id', imageResolverHandler);

export const handler = serverless(app);
export default app;
