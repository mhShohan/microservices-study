import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        status: 'failure',
        statusCode: 401,
        success: false,
        message: 'Unauthorized',
      });
    }

    const token = authHeader?.split(' ')[1];
    const { data, status } = await axios.post(
      process.env.AUTH_SERVICE_URL + '/auth/verify-token',
      {
        accessToken: token,
      },
      {
        headers: {
          origin: 'http://localhost:8081',
          'user-agent': req.headers['user-agent'] || '',
          ip: req.ip,
        },
      },
    );

    if (status !== 200) {
      return res.status(401).json({
        status: 'failure',
        statusCode: 401,
        success: false,
        message: 'Unauthorized',
      });
    }

    req.headers['x-user-id'] = data.data.id;
    req.headers['x-user-email'] = data.data.email;
    req.headers['x-user-name'] = data.data.name;
    req.headers['x-user-role'] = data.data.role;

    next();
  } catch (error: any) {
    console.log('[auth-middleware]', error.message);

    return res.status(401).json({
      status: 'failure',
      statusCode: 401,
      success: false,
      message: 'Unauthorized',
    });
  }
};

const middlewares = { auth };
export default middlewares;
