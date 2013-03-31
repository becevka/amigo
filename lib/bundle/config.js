module.exports = {
    mongodb: {
        server: 'localhost',
        port: 27017,
        db: 'local',
        //autoReconnect: automatically reconnect if connection is lost
        autoReconnect: true,
        //poolSize: size of connection pool (number of connections to use)
        poolSize: 4
    },
    site: {
        port: 8081,
        cookieSecret: 'cookiesecret',
        sessionSecret: 'sessionsecret'
    }
};
