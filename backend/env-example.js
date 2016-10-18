var config = {
  port: 8080,
  secret: "somesecret",
  redisPort: 6379,
  redisUrl: "redis.bounded.buzz",
  serverId: "first_testserver",
  mongoDbUrl: "mongodb.bounded.buzz",
  rabbitMqUrl: "rabbitmq.bounded.buzz",
  rabbitMqUser: "tobias",
  rabbitMqPassword: "*******",
  elasticsearchUrl: "elasticsearch.bounded.buzz",
  elasticsearchPrefix: "test",
  environmentName: "test_env",
  converterQueueName: 'bounded_buzz_converter_queue_test',
  routes: {
    login: '/index.html#/login',
    logout: '/account/logout',
    register: '/account/register',
//    chat: '/chat',
    chat: '/index.html#/chat',
    
    facebookAuth: '/auth/facebook',
    facebookAuthCallback: '/auth/facebook/callback'
  },
  host: "bounded.buzz:8080",
  facebook: {
    appID: "",
    appSecret: "",
  },
  crypto: {
    workFactor: 5000,
    keylen: 32,
    randomSize: 256
  }
};


module.exports = config;
