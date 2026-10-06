/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C2B33',        // chữ chính
        mist: '#F3F6F7',       // nền vùng làm việc
        line: '#D8E1E4',       // viền
        ambient: '#B45309',    // 常温
        chilled: '#0F7490',    // 冷蔵 – màu chủ đạo
        frozen: '#4338CA',     // 冷凍
        block: '#B42318',
        pass: '#15724A',
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Hiragino Sans"', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
