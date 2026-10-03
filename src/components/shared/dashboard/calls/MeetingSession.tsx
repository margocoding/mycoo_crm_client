import { useState } from 'react';
import type { Meeting, MeetingPerson } from '@/types/meetings.types';
import MeetingDetail from './MeetingDetail';
import MeetingLobby, { type JoinSettings } from './MeetingLobby';
import MeetingRoom from './MeetingRoom';
import NewMeetingModal from './NewMeetingModal';

// Mount a separate session for each meeting so browser navigation clears call state.
export default function MeetingSession({
  meeting,
  people,
  initialLobby,
  onBack,
  onUpdate,
}: {
  meeting: Meeting;
  people: MeetingPerson[];
  initialLobby: boolean;
  onBack: () => void;
  onUpdate: (patch: Partial<Meeting>) => void;
}) {
  const [phase, setPhase] = useState<'details' | 'lobby' | 'room'>(
    initialLobby ? 'lobby' : 'details',
  );
  const [joinSettings, setJoinSettings] = useState<JoinSettings | null>(null);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const open = meeting.status === 'scheduled' || meeting.status === 'live';

  function leave() {
    setPhase('details');
    setJoinSettings(null);
  }

  if (open && phase === 'room' && joinSettings) {
    return (
      <MeetingRoom
        meeting={meeting}
        people={people}
        settings={joinSettings}
        onRoles={(participants) => onUpdate({ participants })}
        onLeave={leave}
        onEnd={() => {
          onUpdate({ status: 'completed', endedAt: new Date().toISOString() });
          leave();
        }}
      />
    );
  }
  if (open && phase === 'lobby') {
    return (
      <MeetingLobby
        meeting={meeting}
        people={people}
        onBack={leave}
        onJoin={(settings) => {
          onUpdate({
            status: 'live',
            startedAt: meeting.startedAt || new Date().toISOString(),
          });
          setJoinSettings(settings);
          setNotice('');
          setPhase('room');
        }}
      />
    );
  }
  return (
    <>
      <MeetingDetail
        meeting={meeting}
        people={people}
        onBack={onBack}
        onJoin={() => setPhase('lobby')}
        onEdit={() => setEditing(true)}
        onCancel={() => onUpdate({ status: 'cancelled' })}
        onNotes={(notes) => onUpdate({ notes })}
      />
      <p role="status" className="text-sm text-flux">
        {notice}
      </p>
      {editing && meeting.status === 'scheduled' && (
        <NewMeetingModal
          meeting={meeting}
          people={people}
          onClose={() => setEditing(false)}
          onSubmit={(draft) => {
            onUpdate(draft);
            setEditing(false);
            setNotice('Изменения сохранены в этом браузере.');
          }}
        />
      )}
    </>
  );
}
