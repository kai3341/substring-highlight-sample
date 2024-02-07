module.exports = {
  port: 3000,
  mappings: [
    {
      match: "^/(.*)",
      cwd: "build",
      file: "./$1",
      "ignore-if-not-found": true,
    },
    { match: ".*", cwd: "build", file: "index.html" },
  ],
};
