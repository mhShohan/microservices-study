import { Application, Request, Response } from 'express';
import servicesConfig from './config.json';
import axios from 'axios';
import middlewares from './middlewares';

const createRequestHandler = (hostName: string, path: string, method: string) => {
  return async (req: Request, res: Response) => {
    try {
      let url = `${hostName}${path}`;
      req.params &&
        Object.keys(req.params).forEach((param) => {
          url = url.replace(`:${param}`, req.params[param]);
        });

      const { data } = await axios({
        method,
        url,
        data: req.body,
        headers: {
          origin: 'http://localhost:8081',
          'x-user-id': req.headers['x-user-id'] || '',
          'x-user-email': req.headers['x-user-email'] || '',
          'x-user-name': req.headers['x-user-name'] || '',
          'x-user-role': req.headers['x-user-role'] || '',
          'user-agent': req.headers['user-agent'] || '',
        },
      });

      return res.json(data);
    } catch (error) {
      if (error instanceof axios.AxiosError) {
        const { response } = error;
        if (response) {
          return res.status(response?.status).json(response?.data);
        }
      }

      return res.status(500).json({
        status: 'failure',
        statusCode: 500,
        success: false,
        message: 'Internal server error.',
      });
    }
  };
};

export const getMiddlewares = (middlewareNames: string[]) => {
  return middlewareNames.map((name) => middlewares[name]);
};

export const configureRoutes = (app: Application) => {
  Object.entries(servicesConfig.services).forEach(([_name, service]) => {
    const hostName = service.url;

    service.routes.forEach((route) => {
      route.methods.forEach((method) => {
        const endpoint = `/api${route.path}`;
        const routeMiddlewares = getMiddlewares(route.middlewares || []);

        const handler = createRequestHandler(hostName, route.path, method);
        app[method](endpoint, ...routeMiddlewares, handler);
      });
    });
  });
};
