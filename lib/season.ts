// The home scene follows the Korean seasons, echoing the brand story: winter sleep, then each person's own spring.
export type Season='spring'|'summer'|'autumn'|'winter';
export function seasonOf(date=new Date()):Season{
 const m=date.getMonth()+1;
 return m>=3&&m<=5?'spring':m>=6&&m<=8?'summer':m>=9&&m<=11?'autumn':'winter';
}
export const seasons:Record<Season,{name:string;image:string;line:string;alt:string}>={
 spring:{name:'봄',image:'/seasons/spring.webp',line:'꽃잎 내리는 연못',alt:'벚꽃과 튤립이 핀 봄 연못의 잎사귀 집에서 손을 흔드는 개구리'},
 summer:{name:'여름',image:'/seasons/summer.webp',line:'햇살 아래 첨벙',alt:'튜브를 끼고 연못에서 물장구치는 여름 개구리'},
 autumn:{name:'가을',image:'/seasons/autumn.webp',line:'따뜻한 차 한 잔',alt:'단풍잎 지붕 아래에서 스카프를 두르고 따뜻한 차를 마시는 가을 개구리'},
 winter:{name:'겨울',image:'/seasons/winter.webp',line:'봄을 기다리는 겨울잠',alt:'눈 덮인 굴속에서 단풍잎 이불을 덮고 겨울잠을 자는 개구리'},
};
