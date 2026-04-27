module.exports = {
  apps: [
    {
      name: "word-guessing",
      script: "server/index.js",
      cwd: __dirname,
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: "6670"
      },
      max_memory_restart: "300M",
      time: true
    }
  ]
};
