import { Timer, Play, Pause, Square } from 'lucide-react';
import { useStudyTimer } from '@/contexts/StudyTimerContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function StudyTimerButton() {
  const { status, elapsed, start, pause, resume, stop } = useStudyTimer();
  const isActive = status !== 'idle';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-full p-2 text-muted-foreground hover:bg-secondary transition-colors">
          <Timer size={20} />
          {isActive && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Cronômetro de Estudos</p>
        <p className="text-3xl font-mono font-bold text-foreground text-center my-4 tabular-nums">
          {formatTime(elapsed)}
        </p>
        <div className="flex items-center justify-center gap-2">
          {status === 'idle' && (
            <Button onClick={start} size="sm" className="bg-emerald hover:bg-emerald-hover text-primary-foreground gap-1.5">
              <Play size={14} /> Iniciar
            </Button>
          )}
          {status === 'running' && (
            <>
              <Button onClick={pause} size="sm" variant="secondary" className="gap-1.5">
                <Pause size={14} /> Pausar
              </Button>
              <Button onClick={stop} size="sm" variant="destructive" className="gap-1.5">
                <Square size={14} /> Encerrar
              </Button>
            </>
          )}
          {status === 'paused' && (
            <>
              <Button onClick={resume} size="sm" className="bg-emerald hover:bg-emerald-hover text-primary-foreground gap-1.5">
                <Play size={14} /> Retomar
              </Button>
              <Button onClick={stop} size="sm" variant="destructive" className="gap-1.5">
                <Square size={14} /> Encerrar
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
