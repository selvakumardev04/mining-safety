import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const clientUrls = (process.env.CLIENT_URL ?? 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production.');
}

export const env = {
  port: Number(process.env.PORT ?? 5001),
  mongoUri: process.env.MONGODB_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'demo-jwt-secret-for-local-development',
  clientUrl: clientUrls.join(','),
  clientUrls,
  roboflowInferenceUrl: process.env.ROBOFLOW_INFERENCE_URL ?? '',
  roboflowApiKey: process.env.ROBOFLOW_API_KEY ?? '',
};
