import jwt from 'jsonwebtoken';
console.log('SIGN SECRET:', process.env.JWT_SECRET);
console.log('VERIFY SECRET:', process.env.JWT_SECRET);
export function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
}

export function verifyAccessToken(token) {
  console.log('AUTH HEADER:', req.headers.authorization);
console.log('VERIFY SECRET:', process.env.JWT_SECRET);
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function verifyRefreshToken(token) {
  console.log('Refresh AUTH HEADER:', req.headers.authorization);
console.log('Refresh VERIFY SECRET:', process.env.JWT_SECRET);
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}