import type {CapacitorConfig} from '@capacitor/cli';

// The iOS app is a shell around the production site, so web deploys reach it without a new build.
// CAP_SERVER_URL points the shell at a local dev server (http://localhost:3000) for checks in the simulator.
const local=process.env.CAP_SERVER_URL;
const config:CapacitorConfig={
 appId:'io.github.oheadyonsei.poljjak',
 appName:'폴짝',
 webDir:'native/www',
 appendUserAgent:'PoljjakApp',
 backgroundColor:'#ffffff',
 server:{url:local||'https://jump-up-chi.vercel.app',cleartext:!!local,errorPath:'offline.html'},
 ios:{contentInset:'never',allowsLinkPreview:false},
};
export default config;
