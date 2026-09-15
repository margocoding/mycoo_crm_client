import { Link } from 'react-router-dom';
import { LuUsers } from 'react-icons/lu';
import { useTeam } from './TeamProvider';
import { ROLE_LABELS } from '@/types/team.types';

export default function DepartmentPlaceholder() {
  const { data, loading, error, reload } = useTeam();
  return <section className="rounded-xl border border-line bg-hull/20 p-6 md:p-10">
    <LuUsers className="h-9 w-9 text-flux" />
    <h1 className="mt-5 font-display text-2xl font-bold text-snow">Вы в команде</h1>
    <p className="mt-3 max-w-xl text-sm leading-relaxed text-fog">Здесь появятся задачи и показатели ваших департаментов. Сейчас доступен раздел команды.</p>
    {loading && <p role="status" className="mt-4 text-fog">Загрузка департаментов…</p>}
    {error && <div className="mt-4 text-sm text-crit" role="alert">{error}
      <button className="ml-3 text-flux" onClick={() => void reload()}>Повторить</button></div>}
    <div className="mt-6 flex flex-wrap gap-3">
      {data?.departments.map((d) => <Link key={d.id} to={'/dashboard/team/' + d.id}
        className="rounded-lg border border-line bg-hull/40 px-4 py-3 text-sm text-snow hover:border-flux/50">
        {d.name}{d.myRole && <span className="mt-1 block text-xs text-fog">{ROLE_LABELS[d.myRole]}</span>}
      </Link>)}
    </div>
  </section>;
}
