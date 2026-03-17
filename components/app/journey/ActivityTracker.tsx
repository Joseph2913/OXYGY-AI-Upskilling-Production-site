import React from 'react';
import { BookOpen, Wrench, Users, Target } from 'lucide-react';

interface ActivityTrackerProps {
  elearningDone: boolean;
  toolkitDone: boolean;
  workshopDone: boolean;
  projectDone: boolean;
  accentColor: string;
  accentDark: string;
}

const ACTIVITIES = [
  { icon: BookOpen, label: 'E-Learning', key: 'elearning' },
  { icon: Wrench, label: 'Toolkit', key: 'toolkit' },
  { icon: Users, label: 'Workshop', key: 'workshop' },
  { icon: Target, label: 'Project', key: 'project' },
];

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({
  elearningDone,
  toolkitDone,
  workshopDone,
  projectDone,
  accentColor,
  accentDark,
}) => {
  const states = [elearningDone, toolkitDone, workshopDone, projectDone];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 12 }}>
      {ACTIVITIES.map((act, i) => {
        const done = states[i];
        const Icon = act.icon;
        return (
          <div
            key={act.key}
            title={act.label}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: done ? accentColor : 'transparent',
              border: done ? 'none' : '1.5px solid #E2E8F0',
            }}
          >
            <Icon size={12} color={done ? accentDark : '#CBD5E0'} />
          </div>
        );
      })}
    </div>
  );
};
