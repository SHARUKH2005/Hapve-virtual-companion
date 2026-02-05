module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        accentStart: '#00d0ff',
        accentMid: '#7a5cff', 
        accentEnd: '#ff42b8',
        bg: '#ffffff',
        fg: '#0b0b0b',
        muted: '#9aa0a6',
        glass: 'rgba(255,255,255,0.06)'
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      transitionTimingFunction: {
        'std': 'cubic-bezier(.22,.9,.34,1)'
      },
      borderRadius: {
        'md': '12px'
      }
    }
  },
  plugins: []
}
