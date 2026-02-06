const config = {
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:4004',
  emailServiceUrl: process.env.EMAIL_SERVICE_URL || 'http://localhost:4005',
};

export default config;
