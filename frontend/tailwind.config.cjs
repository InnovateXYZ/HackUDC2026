module.exports = {
    content: [
        './index.html',
        './src/**/*.{js,jsx,ts,tsx}'
    ],
    darkMode: 'media', // respect user's OS preference, similar to previous setup
    theme: {
        extend: {
            colors: {
                // Semantic Color Palette (Denodo)
                denodo: '#f0514a',              // Red/orange for actions & buttons
                accent: '#006699',              // Blue for secondary actions
                base: '#143244',                // Dark blue for main background
                'surface-dark0': '#112533',     // Darker blue for components & cards
                'surface-light0': '#ffffff',    // White for surfaces
                text: '#ffffff',                // White for primary text
                'text-alt': '#006699',          // Blue for secondary text & titles
                'overlay-light0': '#f3f4f5',    // Light gray for inputs & secondary areas
            },
        },
    },
    plugins: [],
}
