export type ThemeId = 'slate' | 'warm' | 'obsidian' | 'daylight';

export interface ThemePalette {
  id: ThemeId;
  label: string;
  description: string;
  swatchBg: string;
  swatchAccent: string;
  tvTheme: 'dark' | 'light';
  chartBg: string;
  chartText: string;
  chartGrid: string;
  crosshair: string;
  crosshairLabel: string;
  border: string;
  bull: string;
  bear: string;
  amber: string;
  ema9: string;
  ema21: string;
  volUp: string;
  volDown: string;
  needle: string;
  muted: string;
  themeColorMeta: string;
}

export const THEMES: ThemePalette[] = [
  {
    id: 'slate',
    label: 'Slate',
    description: 'Low-glare charcoal slate (default)',
    swatchBg: '#151820',
    swatchAccent: '#34B889',
    tvTheme: 'dark',
    chartBg: '#0E1015',
    chartText: '#9AA3B2',
    chartGrid: 'rgba(38, 43, 54, 0.42)',
    crosshair: 'rgba(230, 233, 239, 0.22)',
    crosshairLabel: '#262B36',
    border: '#262B36',
    bull: '#34B889',
    bear: '#DF6A73',
    amber: '#DBA54C',
    ema9: '#5CC8A1',
    ema21: '#73A8E8',
    volUp: 'rgba(52, 184, 137, 0.28)',
    volDown: 'rgba(223, 106, 115, 0.28)',
    needle: '#E6E9EF',
    muted: '#6F7889',
    themeColorMeta: '#0E1015',
  },
  {
    id: 'warm',
    label: 'Warm',
    description: 'Soft espresso dark — easiest on eyes',
    swatchBg: '#1C1916',
    swatchAccent: '#D9A154',
    tvTheme: 'dark',
    chartBg: '#141210',
    chartText: '#A89F94',
    chartGrid: 'rgba(48, 43, 38, 0.48)',
    crosshair: 'rgba(236, 230, 220, 0.22)',
    crosshairLabel: '#302B26',
    border: '#302B26',
    bull: '#52A883',
    bear: '#D67067',
    amber: '#D9A154',
    ema9: '#75C09F',
    ema21: '#7EA7CC',
    volUp: 'rgba(82, 168, 131, 0.28)',
    volDown: 'rgba(214, 112, 103, 0.28)',
    needle: '#ECE6DC',
    muted: '#7D7469',
    themeColorMeta: '#141210',
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    description: 'High-contrast institutional terminal',
    swatchBg: '#09090B',
    swatchAccent: '#10B981',
    tvTheme: 'dark',
    chartBg: '#09090B',
    chartText: '#A1A1AA',
    chartGrid: 'rgba(39, 39, 42, 0.45)',
    crosshair: 'rgba(250, 250, 250, 0.25)',
    crosshairLabel: '#27272A',
    border: '#27272A',
    bull: '#10B981',
    bear: '#EF4444',
    amber: '#F59E0B',
    ema9: '#34D399',
    ema21: '#60A5FA',
    volUp: 'rgba(16, 185, 129, 0.32)',
    volDown: 'rgba(239, 68, 68, 0.32)',
    needle: '#FAFAFA',
    muted: '#71717A',
    themeColorMeta: '#09090B',
  },
  {
    id: 'daylight',
    label: 'Daylight',
    description: 'Crisp warm-paper light mode',
    swatchBg: '#F4F5F7',
    swatchAccent: '#0D9468',
    tvTheme: 'light',
    chartBg: '#FFFFFF',
    chartText: '#525B6C',
    chartGrid: 'rgba(209, 215, 226, 0.65)',
    crosshair: 'rgba(20, 24, 33, 0.28)',
    crosshairLabel: '#1E2430',
    border: '#DCE1EA',
    bull: '#0D9468',
    bear: '#C93B48',
    amber: '#B87A14',
    ema9: '#0D9468',
    ema21: '#2563EB',
    volUp: 'rgba(13, 148, 104, 0.24)',
    volDown: 'rgba(201, 59, 72, 0.24)',
    needle: '#181E29',
    muted: '#6B7485',
    themeColorMeta: '#F4F5F7',
  },
];

export const THEME_MAP: Record<ThemeId, ThemePalette> = {
  slate: THEMES[0],
  warm: THEMES[1],
  obsidian: THEMES[2],
  daylight: THEMES[3],
};

const THEME_STORAGE_KEY = 'ant_war_room_theme_v1';

export function getInitialTheme(): ThemeId {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'slate' || saved === 'warm' || saved === 'obsidian' || saved === 'daylight') {
      return saved;
    }
  } catch {
    // Ignore storage access errors
  }
  return 'slate';
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.setAttribute('data-theme', id);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', THEME_MAP[id].themeColorMeta);
  }
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // Ignore
  }
}
