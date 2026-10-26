'use client';
import {useEffect, useState} from 'react';
import {ArrowDownToLine, Check, Share, PlusSquare, Smartphone, WifiOff} from 'lucide-react';
type InstallEvent = Event & {prompt: () => Promise<void>; userChoice: Promise<{outcome: string}>};
export function useAppPlatform() {
  const [online, setOnline] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const mq = matchMedia('(display-mode: standalone)');
    const update = () => {setOnline(navigator.onLine);setInstalled(mq.matches || !!(navigator as Navigator & {standalone?: boolean}).standalone);};
    const before = (e: Event) => {e.preventDefault();setInstallEvent(e as InstallEvent);};
    const added = () => {setInstalled(true);setInstallEvent(null);};
    update(); window.addEventListener('online',update);window.addEventListener('offline',update);window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',added);mq.addEventListener('change',update);
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => {window.removeEventListener('online',update);window.removeEventListener('offline',update);window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',added);mq.removeEventListener('change',update);};
  }, []);
  async function install() {if (!installEvent) return;try {await installEvent.prompt();await installEvent.userChoice;} finally {setInstallEvent(null);}}
  return {online,installed,canInstall: !!installEvent,install};
}
export function InstallGuide({platform}: {platform: ReturnType<typeof useAppPlatform>}) {
  return <><span className="dialog-symbol"><Smartphone/></span><span className="eyebrow">ALWAYS A LITTLE CLOSER</span><h2>나의 홈 화면에<br/>폴짝을 놓아두세요.</h2><p>아이콘을 누르면 앱 화면으로 바로 시작해요. 앱스토어 설치는 필요하지 않아요.</p>
    {platform.installed ? <div className="inline-success"><Check size={18}/>앱 화면으로 이용 중이에요.</div> : platform.canInstall ? <button className="primary full" onClick={()=>void platform.install()}><ArrowDownToLine size={18}/>앱 설치하기</button> : null}
    <div className="install-steps"><h3>iPhone · Safari</h3><ol><li><Share size={18}/>브라우저의 공유 버튼을 눌러요.</li><li><PlusSquare size={18}/>‘홈 화면에 추가’를 선택해요.</li><li><Check size={18}/>‘웹 앱으로 열기’가 보이면 켜고 추가해요.</li></ol><h3>Android · Chrome</h3><p>브라우저 메뉴 ⋮ → ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택해요.</p></div>
    <p className="fine-print">Safari·Chrome 등 기기의 기본 브라우저에서 열어주세요. 저장한 기록은 사용한 브라우저에 남으며 다른 기기와 동기화되지 않아요.</p>
  </>;
}
export function OfflineNotice(){return <div className="offline-notice" role="status"><WifiOff size={16}/>연결이 잠시 끊겼어요. 열린 화면의 예시 연습은 계속할 수 있어요.</div>}
