/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0B1020",
          surface: "#10172A",
          panel: "#151D32",
          card: "#151D32",
          cardElevated: "#1A233B",
          cardHover: "#1E2945",
          border: "rgba(255, 255, 255, 0.08)",
          borderHover: "rgba(255, 255, 255, 0.16)",
          borderGlow: "rgba(99, 102, 241, 0.4)"
        },
        light: {
          bg: "#F7F9FC",
          surface: "#FFFFFF",
          card: "#FFFFFF",
          cardElevated: "#FFFFFF",
          cardHover: "#F8FAFD",
          border: "#E4E8F0",
          textPrimary: "#172033",
          textSecondary: "#5D677A",
          textMuted: "#8A94A6"
        },
        brand: {
          indigo: "#4F46E5",
          violet: "#7C3AED",
          cyan: "#06B6D4",
          blue: "#3B82F6",
          emerald: "#10B981",
          amber: "#F59E0B",
          coral: "#EF4444"
        },
        accent: {
          cyan: "#06B6D4",
          emerald: "#10B981",
          amber: "#F59E0B",
          coral: "#EF4444",
          rose: "#F43F5E",
          violet: "#7C3AED",
          indigo: "#4F46E5"
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-primary': '0 0 30px -5px rgba(99, 102, 241, 0.35)',
        'glow-indigo': '0 0 30px -5px rgba(79, 70, 229, 0.35)',
        'glow-violet': '0 0 30px -5px rgba(124, 58, 237, 0.35)',
        'glow-cyan': '0 0 30px -5px rgba(6, 182, 212, 0.35)',
        'glow-emerald': '0 0 30px -5px rgba(16, 185, 129, 0.35)',
        'glass': '0 12px 40px 0 rgba(0, 0, 0, 0.35)',
        'card-light': '0 4px 20px -2px rgba(23, 32, 51, 0.06)'
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite linear',
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}
