import { useEffect, useState } from 'react';
export function useSeasonalClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        let timer;
        const update = () => {
            const next = new Date();
            setNow(next);
            clearTimeout(timer);
            timer = setTimeout(update, 60000 - (next.getTime() % 60000));
        };
        update();
        window.addEventListener('focus', update);
        document.addEventListener('visibilitychange', update);
        return () => { clearTimeout(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
    }, []);
    return now;
}
