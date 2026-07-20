import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Play, Pause, Square, Loader2 } from 'lucide-react';
import { useStudyTimer } from '@/contexts/StudyTimerContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function StudyTimerButton() {
  const {
    status, elapsed, selectedActivity, todayActivities, loadingActivities,
    setSelectedActivity, fetchTodayActivities, start, startFree, pause, resume, stop,
  } = useStudyTimer();
  const navigate = useNavigate();
  const isActive = status !== 'idle';

  useEffect(() => {
    fetchTodayActivities();
  }, [fetchTodayActivities]);

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
      <PopoverContent align="end" className="w-72 p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Cronômetro de Estudos</p>
        <p className="text-3xl font-mono font-bold text-foreground text-center my-4 tabular-nums">
          {formatTime(elapsed)}
        </p>

        {status === 'idle' && (
          <div className="space-y-3">
            {loadingActivities ? (
              <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : todayActivities.length === 0 ? (
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">Nenhuma atividade programada para hoje.</p>
                <Button
                  onClick={startFree}
                  size="sm"
                  className="w-full bg-emerald hover:bg-emerald-hover text-primary-foreground gap-1.5"
                >
                  <Play size={14} /> Iniciar estudo livre
                </Button>
                <Button variant="link" size="sm" className="text-emerald" onClick={() => navigate('/app/schedule')}>
                  Ver cronograma
                </Button>
              </div>
            ) : (
              <>
                <Select
                  value={selectedActivity?.id ?? ''}
                  onValueChange={(id) => {
                    const act = todayActivities.find(a => a.id === id);
                    setSelectedActivity(act ?? null);
                  }}
                >
                  <SelectTrigger className="border-border text-sm">
                    <SelectValue placeholder="Selecione uma atividade" />
                  </SelectTrigger>
                  <SelectContent>
                    {todayActivities.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.subject} ({a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={start}
                  size="sm"
                  disabled={!selectedActivity}
                  className="w-full bg-emerald hover:bg-emerald-hover text-primary-foreground gap-1.5"
                >
                  <Play size={14} /> Iniciar
                </Button>
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={startFree}>
                  ou iniciar estudo livre
                </Button>
              </>
            )}
          </div>
        )}

        {status === 'running' && (
          <div className="space-y-2">
            {selectedActivity && (
              <p className="text-xs text-center text-muted-foreground">{selectedActivity.subject}</p>
            )}
            <div className="flex items-center justify-center gap-2">
              <Button onClick={pause} size="sm" variant="secondary" className="gap-1.5">
                <Pause size={14} /> Pausar
              </Button>
              <Button onClick={stop} size="sm" variant="destructive" className="gap-1.5">
                <Square size={14} /> Encerrar
              </Button>
            </div>
          </div>
        )}

        {status === 'paused' && (
          <div className="space-y-2">
            {selectedActivity && (
              <p className="text-xs text-center text-muted-foreground">{selectedActivity.subject}</p>
            )}
            <div className="flex items-center justify-center gap-2">
              <Button onClick={resume} size="sm" className="bg-emerald hover:bg-emerald-hover text-primary-foreground gap-1.5">
                <Play size={14} /> Retomar
              </Button>
              <Button onClick={stop} size="sm" variant="destructive" className="gap-1.5">
                <Square size={14} /> Encerrar
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
