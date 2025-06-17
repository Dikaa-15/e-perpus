/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs", "./public/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#FFF1CA',
          DEFAULT: '#FFB823',
        }
      },
    },
  },
  plugins: [],
}