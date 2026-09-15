import { NextResponse } from "next/server";
import { MIRROR_CONFIG } from "@/lib/mirror-config";
import { WEATHER_LABELS, type WeatherData } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET() {
  const query = new URLSearchParams({
    latitude: String(MIRROR_CONFIG.latitude),
    longitude: String(MIRROR_CONFIG.longitude),
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: MIRROR_CONFIG.timezone,
    forecast_days: "1",
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);

    const data = await response.json();
    const code = Number(data.current.weather_code);
    const weather: WeatherData = {
      temperature: Math.round(data.current.temperature_2m),
      apparent: Math.round(data.current.apparent_temperature),
      wind: Math.round(data.current.wind_speed_10m),
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      code,
      label: WEATHER_LABELS[code] || "Current conditions",
      observedAt: data.current.time,
    };

    return NextResponse.json(weather, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Weather proxy failed:", error);
    return NextResponse.json(
      { error: "Weather unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
