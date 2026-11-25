import {
  ConnectionState,
  ParticipantEvent,
  RoomEvent,
  Track,
  type Room,
  type TrackPublication,
} from "livekit-client";
import type { MediaChoices } from "./LiveMeetingLobby";

export function rememberMediaState(
  room: Room,
  onChange: (update: Partial<MediaChoices>) => void,
) {
  const participant = room.localParticipant;
  const changed = (publication: TrackPublication) => {
    if (room.state !== ConnectionState.Connected) return;
    // Update only the affected device: camera and microphone publish independently.
    if (publication.source === Track.Source.Microphone)
      onChange({ audioEnabled: !publication.isMuted });
    else if (publication.source === Track.Source.Camera)
      onChange({ videoEnabled: !publication.isMuted });
  };
  const deviceChanged = (kind: MediaDeviceKind, deviceId: string) => {
    if (kind === "audioinput") onChange({ audioDeviceId: deviceId });
    else if (kind === "videoinput") onChange({ videoDeviceId: deviceId });
  };
  participant.on(ParticipantEvent.LocalTrackPublished, changed);
  participant.on(ParticipantEvent.TrackMuted, changed);
  participant.on(ParticipantEvent.TrackUnmuted, changed);
  room.on(RoomEvent.ActiveDeviceChanged, deviceChanged);
  return () => {
    participant.off(ParticipantEvent.LocalTrackPublished, changed);
    participant.off(ParticipantEvent.TrackMuted, changed);
    participant.off(ParticipantEvent.TrackUnmuted, changed);
    room.off(RoomEvent.ActiveDeviceChanged, deviceChanged);
  };
}
