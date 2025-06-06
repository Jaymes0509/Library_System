// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  
  devtools: { enabled: true },

  ssr: false,
  
  modules: ['@nuxtjs/google-fonts'],
  
  css: ['@/assets/css/main.css'],
  
  components:true,

  googleFonts: {
    families: {
      'Hachi Maru Pop': true, // 這裡指定你要的 Google Font
    },
    display: 'swap'
  }, 

  compatibilityDate: '2025-05-15',

})
