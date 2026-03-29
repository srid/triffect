/**
 * Compute sunrise and sunset hours for a given date and location.
 * Based on NOAA solar calculations (simplified).
 * Returns fractional hours in local time (e.g. 6.5 = 6:30 AM).
 */
export function sunTimes(
  date: Date,
  lat: number,
  lng: number,
): { sunrise: number; sunset: number } {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );

  // Solar declination
  const decl = -23.45 * Math.cos(rad * (360 / 365) * (dayOfYear + 10));

  // Hour angle for sunrise/sunset (when sun is at -0.833° below horizon)
  const cosH =
    (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(decl * rad)) /
    (Math.cos(lat * rad) * Math.cos(decl * rad));

  // Clamp for polar regions (midnight sun / polar night)
  if (cosH < -1) return { sunrise: 0, sunset: 24 }; // midnight sun
  if (cosH > 1) return { sunrise: 12, sunset: 12 }; // polar night

  const hourAngle = Math.acos(cosH) / rad;

  // Solar noon in hours (approximate, based on longitude)
  const tzOffset = -date.getTimezoneOffset() / 60;
  const solarNoon = 12 - lng / 15 + tzOffset;

  const sunrise = solarNoon - hourAngle / 15;
  const sunset = solarNoon + hourAngle / 15;

  return { sunrise, sunset };
}

/** Format fractional hour as "H:MM AM/PM" */
export function formatHour(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  const h12 = hours % 12 || 12;
  const ampm = hours < 12 ? "a" : "p";
  return mins === 0
    ? `${h12}${ampm}`
    : `${h12}:${String(mins).padStart(2, "0")}${ampm}`;
}
