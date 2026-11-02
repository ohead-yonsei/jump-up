import type {Metadata} from 'next';
import {cookies,headers} from 'next/headers';
import {storeFromEnv,type Cohort} from '@/lib/cohort-store';
import {participantSummary,cohortStage,formatCode,seoulDay,type ParticipantRecords} from '@/lib/cohort';
import {opsKey,readSession,OPS_COOKIE} from '@/lib/cohort-server';
import {OpsLogin,LogoutButton,CreateCohort,RotateOperatorCode,CopyButton} from '@/components/ops-forms';
import './ops.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'폴짝 운영',robots:{index:false,follow:false}};
const md=(day:string)=>{const [,m,d]=day.split('-');return `${Number(m)}/${Number(d)}`;};
const when=(at:string|null)=>at?new Date(at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit'}):'아직 없음';
const mind=(p:ReturnType<typeof participantSummary>)=>{const f=p.firstCheckin,l=p.lastCheckin;if(!f)return '아직 없음';const pair=(a?:number,b?:number)=>l?`${a??'-'}→${b??'-'}`:`${a??'-'}`;return `편안함 ${pair(f.calm,l?.calm)} · 대화 ${pair(f.talk,l?.talk)} · 바깥 ${pair(f.outside,l?.outside)}`;};
function Shell({children,role}:{children:React.ReactNode;role?:string}){return <div className="ops"><header className="ops-bar"><a href="/ops" className="ops-brand">폴짝 운영</a>{role&&<span className="ops-role">{role}</span>}{role&&<LogoutButton/>}</header><main className="ops-main">{children}</main></div>;}
async function origin(){const h=await headers();return `${h.get('x-forwarded-proto')??'http'}://${h.get('x-forwarded-host')??h.get('host')}`;}
function People({people}:{people:ParticipantRecords[]}){
 if(!people.length)return <p className="ops-empty">아직 함께하는 사람이 없어요. 위의 참여 링크나 기수 코드를 기관 담당자에게 전해 주세요.</p>;
 const now=new Date();
 return <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>참여 코드</th><th>함께한 날</th><th>마지막으로 받은 때</th><th>연 날</th><th>활동한 날</th><th>최근 7일 활동</th><th>마음 체크 (처음→최근)</th><th>연락 버튼</th><th>한마디</th></tr></thead>
  <tbody>{people.map(p=>{const s=participantSummary(p,now);return <tr key={p.id}><th scope="row">{p.code}</th><td>{md(seoulDay(p.joinedAt))}</td><td>{when(p.lastSyncAt)}</td><td>{s.visitDays}일</td><td>{s.activeDays}일</td><td>{s.recentActiveDays}일</td><td className="ops-mind">{mind(s)}</td><td>{s.contactTaps}번</td><td>{s.notes}개</td></tr>;})}</tbody></table></div>;
}
function CohortView({cohort,people,link,admin}:{cohort:Cohort;people:ParticipantRecords[];link:string;admin:boolean}){
 return <>
  {admin&&<a className="ops-back" href="/ops">← 모든 기수</a>}
  <section className="ops-head"><span className="ops-stage">{cohortStage(cohort)}</span><h1>{cohort.name}</h1><p>{cohort.org||'기관 미정'} · {md(cohort.startsOn)} ~ {md(cohort.endsOn)}</p></section>
  <section className="ops-invite" aria-label="참여 안내">
   <div><span>기수 코드</span><strong>{formatCode(cohort.joinCode)}</strong><CopyButton text={formatCode(cohort.joinCode)}/></div>
   <div><span>참여 링크</span><code>{link}</code><CopyButton text={link}/></div>
   <p>링크를 열면 앱의 ‘기록’ 탭에 기수 코드가 채워져 있어요. 참여자가 무엇이 전달되는지 읽고 동의해야 참여가 시작돼요.</p>
  </section>
  <section className="ops-people"><div className="ops-section-top"><h2>함께하는 사람 {people.length}명</h2>{people.length>0&&<a className="secondary" href={`/api/ops/cohorts?id=${cohort.id}`}>CSV 내려받기</a>}</div>
   <People people={people}/>
   <p className="ops-note">참여자는 가명인 참여 코드로만 보여요. 실제 참여자와 참여 코드는 기관에서 따로 이어서 관리해 주세요. 기수에서 나간 사람의 기록은 바로 지워져요. 날짜는 한국 시간 기준이에요.</p></section>
  {admin&&<section className="ops-people"><h2>운영자 코드</h2><p className="ops-note">기관 담당자는 운영자 코드로 이 기수만 볼 수 있어요. 코드를 잃어버렸다면 새로 만들어 주세요.</p><RotateOperatorCode id={cohort.id}/></section>}
 </>;
}
export default async function OpsPage({searchParams}:{searchParams:Promise<{cohort?:string}>}){
 const key=opsKey(process.env);const store=await storeFromEnv();
 if(!key||!store)return <Shell><section className="ops-head"><h1>운영자 화면을 준비해 주세요</h1><p>배포 환경변수를 먼저 설정해야 열려요. 순서는 README의 ‘기수 운영’에 있어요.</p></section>
  <ul className="ops-setup">{!store&&<li><code>SUPABASE_URL</code>, <code>SUPABASE_SECRET_KEY</code>: 기수와 기록을 담는 Supabase 프로젝트</li>}{!key&&<li><code>OPS_ADMIN_KEY</code>: 팀 관리자 키(12자 이상). 운영자 로그인 서명에도 쓰여요.</li>}</ul></Shell>;
 const session=readSession((await cookies()).get(OPS_COOKIE)?.value,key);
 if(!session)return <Shell><OpsLogin/></Shell>;
 const admin=session.role==='admin';const selected=admin?(await searchParams).cohort:session.cohortId;
 try{
  if(selected){const cohort=await store.cohort(selected);const people=cohort?await store.cohortRecords(cohort.id):[];const link=cohort?`${await origin()}/?join=${cohort.joinCode}`:'';
   return <Shell role={admin?'폴짝 팀':'기관 담당자'}>{cohort?<CohortView cohort={cohort} people={people} link={link} admin={admin}/>:<section className="ops-head"><h1>기수를 찾지 못했어요</h1><p>{admin?<a href="/ops">모든 기수 보기</a>:'기수가 정리되었을 수 있어요. 폴짝 팀에 물어봐 주세요.'}</p></section>}</Shell>;}
  const cohorts=await store.listCohorts();const today=seoulDay();
  return <Shell role="폴짝 팀"><section className="ops-head"><h1>기수</h1><p>{store.kind==='file'?'로컬 개발용 파일(.data/cohorts.json)에 저장 중이에요.':'Supabase에 저장 중이에요.'}</p></section>
   <CreateCohort today={today}/>
   {cohorts.length?<div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>기수</th><th>기관</th><th>기간</th><th>상태</th><th>함께하는 사람</th><th>기수 코드</th></tr></thead>
    <tbody>{cohorts.map(c=><tr key={c.id}><th scope="row"><a href={`/ops?cohort=${c.id}`}>{c.name}</a></th><td>{c.org||'-'}</td><td>{md(c.startsOn)} ~ {md(c.endsOn)}</td><td>{cohortStage(c,today)}</td><td>{c.participants}명</td><td><code>{formatCode(c.joinCode)}</code></td></tr>)}</tbody></table></div>
   :<p className="ops-empty">아직 연 기수가 없어요. 위에서 첫 기수를 열어 보세요.</p>}</Shell>;
 }catch{return <Shell role={admin?'폴짝 팀':'기관 담당자'}><section className="ops-head"><h1>지금은 불러오기 어려워요</h1><p>저장소에 연결하지 못했어요. 잠시 후 새로고침해 주세요.</p></section></Shell>;}
}
