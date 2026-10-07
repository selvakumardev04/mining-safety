import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 5001),
  mongoUri: process.env.MONGODB_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'demo-jwt-secret-for-local-development',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  roboflowInferenceUrl: process.env.ROBOFLOW_INFERENCE_URL ?? '',
  roboflowApiKey: process.env.ROBOFLOW_API_KEY ?? '',
};
