import { Application, Request, Response } from "express";
import servicesConfig from './config.json'
import axios from "axios";

const createRequestHandler = (hostName: string, path: string, method: string) => {
  return async (req: Request, res: Response) => {
    try {
      const { data } = await axios({
        method,
        url: `${hostName}${path}`,
        data: req.body
      })

      return res.status(data.statusCode).json({
        ...data
      })
    } catch (error) {
      if (error instanceof axios.AxiosError) {
        const { response } = error
        if (response) {
          return res.status(response?.status).json(response?.data)
        }
      }

      return res.status(500).json({
        status: 'failure',
        statusCode: 500,
        success: false,
        message: 'Internal server error.'
      })
    }
  }
}

export const configureRoutes = (app: Application) => {
  Object.entries(servicesConfig.services).forEach(([ _name, service ]) => {
    const hostName = service.url

    service.routes.forEach((route) => {
      route.methods.forEach((method) => {
        const handler = createRequestHandler(hostName, route.path, method)
        app[ method ](`/api${route.path}`, handler)
      })
    })
  })
}