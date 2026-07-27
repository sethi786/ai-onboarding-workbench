type Tone = 'neutral' | 'electric' | 'trust' | 'success' | 'warning' | 'danger' | 'outline';

export function stageTone(status: string): Tone {
  switch (status) {
    case 'Complete':
      return 'success';
    case 'In Progress':
      return 'electric';
    case 'Blocked':
      return 'danger';
    case 'Skipped':
      return 'neutral';
    default:
      return 'outline';
  }
}
