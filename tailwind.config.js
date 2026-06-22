/** @type {import('tailwindcss').Config} */
export default {
  // Ajuste os caminhos abaixo conforme a estrutura da sua pasta no VS Code (ex: vite, next.js)
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 1. PALETA DE CORES "CINEMA NOIR"
      // No seu código React você poderá usar: bg-noir-base, text-noir-gold, border-noir-panel...
      colors: {
        noir: {
          base: '#131315',       // Grafite quente profundo (Fundo da tela principal)
          panel: '#1a1a1e',      // Grafite um pouco mais claro (Sidebars e Cards)
          shadow: '#0d0d0f',     // Escuridão total (Para simular sombras da lombada 3D)
          gold: '#d4af37',       // Ouro envelhecido (Destaques, ícones ativos, bordas metálicas)
          champagne: '#ebdcb9',  // Tom de papel antigo/champagne (Títulos e textos de destaque)
        }
      },
      
      // 2. TIPOGRAFIA EDITORIAL
      // Requer importação no seu index.css ou layout principal (ex: Google Fonts)
      fontFamily: {
        sans: ['Inter', 'sans-serif'],                       // Para descrições e textos longos
        serif: ['Playfair Display', 'Merriweather', 'serif'], // Para Títulos Elegantes e logo
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],   // Para metadados, datas e badges
      },

      // 3. ANIMAÇÕES MECÂNICAS E 3D
      animation: {
        'spin-slow': 'spin-reel 25s linear infinite',
        'spin-medium': 'spin-reel 15s linear infinite',
        'spin-fast': 'spin-reel 8s linear infinite',
        'spin-3d': 'spin-3d 14s ease-in-out infinite',
      },
      
      keyframes: {
        // Rotação suave contínua para os carretéis e aros do painel de estatísticas
        'spin-reel': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        // A animação de vitrine do "Memory Card" de PS2 para as caixas das mídias
        'spin-3d': {
          '0%': { transform: 'rotateY(0deg) rotateX(2deg) translateY(0px)' },
          '50%': { transform: 'rotateY(180deg) rotateX(8deg) translateY(-8px)' },
          '100%': { transform: 'rotateY(360deg) rotateX(2deg) translateY(0px)' },
        }
      }
    },
  },
  plugins: [
    // Se precisar de plugins como o @tailwindcss/line-clamp ou forms, adicione aqui
  ],
}