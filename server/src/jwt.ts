import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET ?? 'dev-only-change-me';

export type JwtPayload = { sub: string; cid: string };

export function signToken(userId: string, companyId: string, expiresIn: jwt.SignOptions['expiresIn'] = '30d') {
  return jwt.sign({ sub: userId, cid: companyId }, secret, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  const p = jwt.verify(token, secret) as jwt.JwtPayload & JwtPayload;
  return { sub: p.sub, cid: p.cid };
}
