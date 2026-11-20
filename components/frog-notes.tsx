'use client';
import {Leaf} from 'lucide-react';
import {activityDays,growthOf,growthStages,nextGrowth,type CharacterGame} from '@/lib/character';
import {frogStories,pondPromises,storiesOpen} from '@/lib/frog-lore';
import {josa} from '@/lib/josa';
import {FrogStill} from './frog-3d';
/**
 * 개구리 수첩: how the friend grows, and what real frogs do at each of those times.
 * What is still ahead stays a silhouette or ‘???’, like the gifts in the closet: something to look forward to, never a task list.
 */
export function FrogNotes({game}:{game:CharacterGame}){
 const character=game.character!;const growth=growthOf(game);const at=growthStages.findIndex(s=>s.id===growth.id);const next=nextGrowth(game);const open=new Set(storiesOpen(growth.id).map(s=>s.id));
 return <section className="frog-notes" aria-label="개구리 수첩">
  <span className="step-label">개구리 수첩</span><h2>{character.name}{josa(character.name,'은','는')} 지금, {growth.name}</h2>
  <p className="notes-now">함께한 날 {activityDays(game)}일 · {next?`앞으로 ${next.days}일이면 다음 모습을 만나요`:'다 자란 모습이에요'}</p>
  <ol className="notes-path" aria-label="자라는 다섯 모습">{growthStages.map((s,i)=><li key={s.id} className={i===at?'now':i<at?'past':'ahead'} aria-label={i<=at?`${s.name}, ${i===at?'지금 모습':'지나온 모습'}`:`${s.name}, 아직 만나지 못한 모습. 함께한 지 ${s.days}일째에 만나요`}>
   <FrogStill character={character} equipped={i===at?game.equipped:{}} growth={s.id} framing="full"/>
   <span aria-hidden="true">{s.name}</span><small aria-hidden="true">{i<at?'지나왔어요':i===at?'지금':`${s.days}일째`}</small></li>)}</ol>
  <h3>연못의 약속</h3>
  <ul className="notes-promises">{pondPromises.map(p=><li key={p.rule}><small>{p.from}에서</small><strong>{p.rule}</strong><span>{p.means}</span></li>)}</ul>
  <h3>진짜 개구리 이야기<small>{open.size}/{frogStories.length}</small></h3>
  <ul className="notes-stories">{frogStories.map(s=>{const stage=growthStages.find(g=>g.id===s.stage)!;return open.has(s.id)
   ?<li key={s.id}><span className="story-stage">{stage.name}</span><h4>{s.title}</h4><p>{s.fact}</p><p className="story-link"><Leaf size={13}/><span>{s.link}</span></p><small>자료: {s.source}</small></li>
   :<li key={s.id} className="locked"><span className="story-stage">{stage.name}</span><h4 aria-hidden="true">???</h4><p>{stage.name}{josa(stage.name,'이','가')} 되면 열리는 이야기</p></li>})}</ul>
  <p className="notes-foot">이야기는 동물원·박물관·국립공원이 알려주는 내용을 바탕으로 썼어요. 개구리마다 사는 방법은 조금씩 달라요.</p>
 </section>;
}
