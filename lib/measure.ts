// Reading a recording before playing it: where it really begins and ends, and how loud it is. Shared by the small sounds,
// the music and the keeper's voice, and plain arithmetic so it can be tested without a device.
/** A quiet take may be turned up at most this much; more would mostly turn up the hiss under it. */
export const MAX_BOOST=14;
/** Where a recording really begins and ends, and how much to turn it up or down so its loudest moment sits at `level`.
 * Generated takes often start late or come out faint; this is what makes every file answer a touch at once and at the level given. */
export function measure(channels:ArrayLike<number>[],sampleRate:number,level:number){
 let peak=0;const n=channels[0]?.length??0;for(const ch of channels)for(let i=0;i<n;i++){const v=Math.abs(ch[i]);if(v>peak)peak=v;}
 if(!(peak>0)||!n)return {from:0,to:n/Math.max(1,sampleRate),gain:0,peak:0};
 const floor=Math.max(.003,peak*.06);const loud=(i:number)=>channels.some(ch=>Math.abs(ch[i])>floor);
 let first=0;while(first<n&&!loud(first))first++;let last=n-1;while(last>first&&!loud(last))last--;
 // a breath before the first sound so it does not click, and the tail left to ring out
 const from=Math.max(0,first/sampleRate-.004),to=Math.min(n/sampleRate,last/sampleRate+.25);
 return {from,to,gain:Math.min(MAX_BOOST,level/peak),peak};
}
