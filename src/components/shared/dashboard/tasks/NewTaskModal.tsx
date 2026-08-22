import { useState } from 'react';
import { useTasks, Task } from '../../../../context/TasksContext';
import { IconX, IconCheck } from '../../../icons';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const priorityOptions = [
  { value: 'low', label: 'Низкий', color: 'var(--color-ok)' },
  { value: 'medium', label: 'Средний', color: 'var(--color-warn)' },
  { value: 'high', label: 'Высокий', color: 'var(--color-crit)' },
] as const;

export default function NewTaskModal({ isOpen, onClose }: NewTaskModalProps) {
  const { addTask, generateSuccessCriteria } = useTasks();
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAISuggestion, setShowAISuggestion] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignee.trim() || !dueDate) return;

    addTask({
      title: title.trim(),
      assignee: assignee.trim(),
      dueDate,
      priority,
      successCriteria: successCriteria.trim() || 'Результат должен быть подтверждён',
      status: 'backlog',
    });

    // Reset form
    setTitle('');
    setAssignee('');
    setDueDate('');
    setPriority('medium');
    setSuccessCriteria('');
    setShowAISuggestion(false);
    onClose();
  };

  const handleGenerateCriteria = async () => {
    if (!title.trim()) return;
    setIsGenerating(true);
    try {
      const criteria = await generateSuccessCriteria(title);
      setSuccessCriteria(criteria);
      setShowAISuggestion(true);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-void/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg glass corner rounded-xl p-6 step-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-bold text-snow">Новая задача</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-fog/60 hover:text-snow hover:bg-hull/50 transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Название */}
          <div>
            <label className="block mono-label text-fog/70 mb-2">Название</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Подготовить коммерческое предложение"
              className="w-full rounded-md border border-line bg-hull/30 px-4 py-2.5 text-mist placeholder-fog/40 focus:border-flux focus:outline-none focus:ring-1 focus:ring-flux/30 transition-colors"
              required
            />
          </div>

          {/* Ответственный и Срок */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mono-label text-fog/70 mb-2">Ответственный</label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Иван"
                className="w-full rounded-md border border-line bg-hull/30 px-4 py-2.5 text-mist placeholder-fog/40 focus:border-flux focus:outline-none focus:ring-1 focus:ring-flux/30 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block mono-label text-fog/70 mb-2">Срок</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-line bg-hull/30 px-4 py-2.5 text-mist focus:border-flux focus:outline-none focus:ring-1 focus:ring-flux/30 transition-colors"
                required
              />
            </div>
          </div>

          {/* Приоритет */}
          <div>
            <label className="block mono-label text-fog/70 mb-2">Приоритет</label>
            <div className="flex gap-2">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value as typeof priority)}
                  className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-all ${
                    priority === opt.value
                      ? 'border-flux bg-flux/10 text-snow'
                      : 'border-line bg-hull/20 text-fog hover:border-line/70'
                  }`}
                  style={priority === opt.value ? { borderColor: opt.color } : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Критерий результата */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block mono-label text-fog/70">Критерий результата</label>
              {title.trim() && !isGenerating && (
                <button
                  type="button"
                  onClick={handleGenerateCriteria}
                  className="mono-label text-[10px] text-ion hover:text-flux transition-colors flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-ion animate-pulse" />
                  AI-помощник
                </button>
              )}
            </div>
            <textarea
              value={successCriteria}
              onChange={(e) => setSuccessCriteria(e.target.value)}
              placeholder="КП отправлено клиенту и получена обратная связь"
              rows={3}
              className="w-full rounded-md border border-line bg-hull/30 px-4 py-2.5 text-mist placeholder-fog/40 focus:border-flux focus:outline-none focus:ring-1 focus:ring-flux/30 transition-colors resize-none"
            />
            
            {showAISuggestion && (
              <p className="mt-2 mono-label text-[10px] text-ion/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ion" />
                Предложено AI на основе названия задачи
              </p>
            )}
            
            {isGenerating && (
              <p className="mt-2 mono-label text-[10px] text-flux/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-flux animate-pulse" />
                Генерирую критерий...
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 btn-primary rounded-md bg-flux px-5 py-3 text-sm font-bold text-void shadow-[0_0_26px_-8px_rgba(56,189,248,0.7)] hover:bg-ice transition-all"
            >
              Создать задачу
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-line px-5 py-3 text-sm font-semibold text-fog hover:border-warn/50 hover:text-warn transition-all"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
