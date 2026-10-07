import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { demoUsers } from '../data/demoData';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
  assignedMines: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function protect(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized. Missing or invalid token.' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub?: string; email?: string; role?: string; name?: string; assignedMines?: string[] };
    const user = demoUsers.find((item) => item.id === payload.sub);

    if (!user) {
      res.status(401).json({ message: 'Unauthorized. User not found.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      assignedMines: user.assignedMines,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized. Token expired or invalid.' });
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
      return;
    }

    next();
  };
}
