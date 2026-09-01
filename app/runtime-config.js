(()=>{'use strict';
/*
 * HPOS runtime source configuration.
 * Public configuration only: never place API keys or user secrets here.
 *
 * Parqet, Quotes and Search route through Supabase hpos-api.
 */
window.HPOS_RUNTIME=Object.freeze({
  version:'8.7.5',
  integration:Object.freeze({
    enabled:true,
    mode:'SUPABASE_PARQET_QUOTES_SEARCH',
    baseUrl:'https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api',
    parqetBaseUrl:'https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api'
  }),
  publicSources:Object.freeze({
    frankfurter:'https://api.frankfurter.app',
    openfigi:'https://api.openfigi.com'
  })
});
})();
