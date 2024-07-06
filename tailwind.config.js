module.exports = {
  content: [
    "./src/*.{html,js,css} ",
    "./views/index.ejs",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    {
      tailwindcss: {},
      autoprefixer: {},
    },
  ],
};