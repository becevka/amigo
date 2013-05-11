module.exports ={ mongodb: 
   { server: 'localhost',
     port: 27017,
     db: 'local',
     autoReconnect: true,
     poolSize: 4 },
  site: 
   { port: 8081,
     cookieSecret: 'cookiesecret',
     sessionSecret: 'sessionsecret' } };