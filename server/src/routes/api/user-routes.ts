import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user: {
    _id: string;
    username: string;
    email: string;
  };
}

export const authenticateRestRoute = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token = req.body.token || req.query.token || req.headers.authorization;

  if (req.headers.authorization) {
    token = token.split(' ').pop()?.trim();
  }

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET_KEY || '') as {
      _id: string;
      username: string;
      email: string;
    };
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  return;
};

export const userRoutes = (_app: any) => {};