import type {FrogColor} from '@/lib/character';
/* eslint-disable @next/next/no-img-element */
export function FrogMark({size=32,color='leaf'}:{size?:number;color?:FrogColor}){return <img className="frog-mark" src={`/art/face-${color}.png`} width={size} height={size} alt="" aria-hidden="true" draggable={false}/>}
export function BrandLogo({height=28,className=''}:{height?:number;className?:string}){return <img className={'brand-logo '+className} src="/brand/logo.webp" alt="폴짝" height={height} style={{height,width:'auto'}} draggable={false}/>}
export function Splash(){return <div className="splash" aria-hidden="true"><img className="splash-mark" src="/brand/mark.png" alt="" width={112} height={104}/><BrandLogo height={46} className="splash-logo"/><span>저마다의 봄, 나만의 속도.</span></div>}
