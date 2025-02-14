module.exports = {
  apps: [
    {
      name: 'streamfund-manta',
      script: './dist/main.js',
      instances: '1',
      exec_mode: 'cluster',
      watch: false,
      ignore_watch: ['node_modules'],
    },
  ],
};
