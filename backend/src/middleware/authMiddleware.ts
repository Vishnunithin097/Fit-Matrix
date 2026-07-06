import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { JWT_SECRET } from '../config/jwt.js';

// Add custom types to Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        full_name?: string;
        is_onboarded?: boolean;
        squad_id?: string | null;
      };
    }
  }
}

export async function protect(req: Request, res: Response, next: NextFunction): Promise<any> {
  let token = '';

  // 1. Check HttpOnly cookies first
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Check Authorization Header as fallback
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated. Access denied.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    
    // Fetch user details from database or memory fallback
    const result = await query('SELECT id, email, full_name, is_onboarded, squad_id FROM users WHERE id = $1', [decoded.id]);
    
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'User associated with this token no longer exists.' });
    }

    const user = result.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_onboarded: user.is_onboarded,
      squad_id: user.squad_id
    };

    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(401).json({ error: 'Invalid token. Authorization failed.' });
  }
}
