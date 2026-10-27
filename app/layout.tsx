import type {Metadata, Viewport} from 'next';
import './globals.css';
import './poljjak.css';
import './onboarding.css';
import './character.css';
import './frog.css';
import './app.css';
export const metadata: Metadata = {
 title:'폴짝 | 저마다의 봄, 나만의 속도.',
 description:'우리에게도 저마다의 봄이 와요. 지금의 상태와 목표에 맞는 미션으로, 준비되면 다음으로 폴짝.',
 manifest:'/manifest.webmanifest',
 applicationName:'폴짝',
 appleWebApp:{capable:true,statusBarStyle:'default',title:'폴짝'},
 icons:{icon:'/icons/favicon-64.png',apple:'/icons/icon-180.png'},
};
export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#ffffff'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
