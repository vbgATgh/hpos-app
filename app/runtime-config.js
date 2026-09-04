(()=>{'use strict';
/*
 * HPOS runtime source configuration.
 * Public configuration only: never place API keys or user secrets here.
 *
 * Parqet, Quotes and Search route through Supabase hpos-api.
 */
try{
  const profileSchema='3';
  if(localStorage.getItem('hpos_profile_schema')!==profileSchema){
    localStorage.removeItem('hpos_asset_profiles_v2');
    localStorage.setItem('hpos_profile_schema',profileSchema);
  }
}catch{}
window.HPOS_RUNTIME=Object.freeze({
  version:'8.7.10',
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
