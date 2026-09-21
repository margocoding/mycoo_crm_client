import Workspace from "../components/shared/dashboard/main/Workspace";
import { useLaunchStore } from '@/store/launch.store';

export default function DashboardPage() {
  const workspaceId = useLaunchStore(s => s.workspace?.id);
  return <Workspace key={workspaceId} />;
}
