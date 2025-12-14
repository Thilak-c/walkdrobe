module.exports = {
  apps: [
    {
      name: "walkdrobe",
      script: "npm",
      args: "start",
      cwd: "/home/walkdrobe",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
  ],
};
