/** 받침이 있으면 a, 없으면 b(‘이/가’, ‘와/과’는 a=과·b=와, ‘으로/로’). A word that does not end in Hangul gets b.
 * ‘으로’ also takes ‘로’ after ㄹ. */
export function josa(word:string,a:string,b:string){const c=word.charCodeAt(word.length-1)-0xac00;if(c<0||c>11171)return b;const end=c%28;return end===0||(a==='으로'&&end===8)?b:a;}
