// /src/config/swagger.config.js

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Klab Program Manager API',
      version: '1.0.0',
      description: 'API documentation for the Klab Program Manager backend, providing endpoints for managing programs, users, attendance, and more.',
      contact: {
        name: 'Klab Dev Team',
        email: 'dev@klab.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
        description: 'Development Server'
      }
    ],
    // This is crucial for enabling JWT authentication in the Swagger UI
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // This tells swagger-jsdoc where to look for your annotated routes
  apis: ['./src/api/routes/v1/*.js'],
};

export default swaggerOptions;