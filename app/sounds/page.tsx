import type {Metadata} from 'next';
import {SoundBoard} from '@/components/sound-board';
// A page for the team to listen to every sound in one place. It is not linked from the app and is kept out of search.
export const metadata:Metadata={title:'폴짝 소리 듣기',robots:{index:false,follow:false}};
export default function SoundsPage(){return <SoundBoard/>;}
