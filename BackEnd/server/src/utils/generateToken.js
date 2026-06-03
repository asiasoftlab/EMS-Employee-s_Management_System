import jwt from 'jsonwebtoken';

const generateToken = (res, id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.SAME_SITE || 'lax',
    maxAge: (process.env.COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000,
  };

  res.cookie('jwt', token, cookieOptions);

  return token;
};

export default generateToken;
