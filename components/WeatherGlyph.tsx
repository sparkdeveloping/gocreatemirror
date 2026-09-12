type Props = { code?: number; className?: string };

export function WeatherGlyph({ code = 0, className }: Props) {
  const rainy = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
  const snowy = [71, 73, 75, 77, 85, 86].includes(code);
  const cloudy = [2, 3, 45, 48].includes(code);

  if (rainy) {
    return (
      <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
        <path d="M28 61h42c10 0 18-7 18-17s-8-17-18-17c-2 0-4 0-6 1C59 18 50 12 39 12 24 12 12 24 12 39c0 2 0 4 1 6C7 48 4 53 4 59c0 10 8 18 18 18h48" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
        <path d="M28 73l-5 10M47 73l-5 10M66 73l-5 10" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
      </svg>
    );
  }

  if (snowy) {
    return (
      <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
        <path d="M28 58h42c10 0 18-7 18-17s-8-17-18-17c-2 0-4 0-6 1C59 15 50 9 39 9 24 9 12 21 12 36c0 2 0 4 1 6C7 45 4 50 4 56c0 10 8 18 18 18" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
        <path d="M29 76v14M22 83h14M47 76v14M40 83h14M65 76v14M58 83h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    );
  }

  if (cloudy) {
    return (
      <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
        <circle cx="30" cy="30" r="16" fill="none" stroke="currentColor" strokeWidth="4" opacity=".6"/>
        <path d="M29 67h43c11 0 19-8 19-18s-8-18-19-18c-3 0-6 1-8 2-6-9-15-14-26-14-17 0-31 14-31 31v2C3 55 1 59 1 64c0 10 8 18 18 18h53" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
      <circle cx="48" cy="48" r="20" fill="none" stroke="currentColor" strokeWidth="5"/>
      <path d="M48 8v13M48 75v13M8 48h13M75 48h13M20 20l9 9M67 67l9 9M76 20l-9 9M29 67l-9 9" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  );
}
