import jwt from 'jsonwebtoken';
import { ExpressContextFunctionArgument } from '@apollo/server/express4';
import { AuthenticationError } from 'apollo-server-errors';
import dotenv from 'dotenv';

dotenv.config();

interface JwtPayload {
  _id: string;
  username: string;
  email: string;
}

export const authMiddleware = async ({ req }: ExpressContextFunctionArgument) => {
  let token = req.headers.authorization;

  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7);
    try {
      const secretKey = process.env.JWT_SECRET_KEY || 'defaultsecret';
      const user = jwt.verify(token, secretKey) as JwtPayload; 
      return { user };
    } catch (err) {
      console.error('Invalid token:', err);
      throw new AuthenticationError('Invalid or expired token');
    }
  }
  throw new AuthenticationError('Authorization token must be provided');
};

export const signToken = (username: string, email: string, _id: string) => {
  const payload = { username, email, _id };
  const secretKey = process.env.JWT_SECRET_KEY || 'defaultsecret';
  return jwt.sign(payload, secretKey, { expiresIn: '2h' });
};