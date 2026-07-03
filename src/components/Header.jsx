import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Link } from 'react-router-dom';

const MotionLink = m(Link);

const navLinks = [
  { label: 'Home',  to: '/#home', key: 'home' },
  { label: 'Work',  to: '/#work', key: 'work' },
  { label: 'About', to: '/about', key: 'about' },
];

/* ── Liquid glass displacement map ────────────────────────────
   Canvas-generated PNG encoding per-pixel refraction offsets:
   R channel = x displacement, G = y, 128 = neutral. Uses the
   signed-distance field of the pill's rounded rect — inside the
   splay band, pixels sample inward along the edge normal with a
   t² falloff, giving the convex-lens bend that hugs the edge and
   bends radially around the capsule ends. Single feImage: multi-
   feImage composition inside backdrop-filter is unreliable in
   Chromium (the later images never composite).                  */
function buildLensMap(w, h, radius) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const r = Math.min(radius, h / 2);
  const band = Math.min(16, h * 0.24);   // splay: how far the bend reaches inward

  // Signed distance to the rounded-rect edge (negative inside)
  const sd = (x, y) => {
    const qx = Math.abs(x - w / 2) - (w / 2 - r);
    const qy = Math.abs(y - h / 2) - (h / 2 - r);
    return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
  };

  // Chromium converts the map to linearRGB before feDisplacementMap, so
  // encode with the sRGB transfer: the decoded LINEAR value carries the
  // intended displacement (0.5 = neutral). Plain 128 would decode to
  // ~0.22 and shift the whole backdrop.
  const srgb = (u) => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
  const encode = (f) => Math.round(255 * srgb(Math.min(1, Math.max(0, f))));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const d = -sd(x + 0.5, y + 0.5);   // distance from edge, inward positive
      let fx = 0.5, fy = 0.5;            // linear-space displacement fractions
      if (d < band) {
        const t = 1 - Math.max(d, 0) / band;
        const nx = sd(x + 1.5, y + 0.5) - sd(x - 0.5, y + 0.5);   // edge normal (outward)
        const ny = sd(x + 0.5, y + 1.5) - sd(x + 0.5, y - 0.5);
        const len = Math.hypot(nx, ny) || 1;
        const k = t * t * 0.5;           // quadratic falloff toward the edge
        fx = 0.5 - (nx / len) * k;
        fy = 0.5 - (ny / len) * k;
      }
      img.data[i] = encode(fx);
      img.data[i + 1] = encode(fy);
      img.data[i + 2] = 0;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

/* Chromium-only lens filter (Safari ignores backdrop-filter: url()
   on the refraction layer and falls back to plain frosted glass).
   The map is sized to the pill's measured pixels — feImage doesn't
   stretch percentage-sized images inside backdrop-filter contexts. */
function GlassLensFilter({ width, height, radius }) {
  const map = React.useMemo(
    () => (width && height ? buildLensMap(width, height, radius) : null),
    [width, height, radius]
  );
  if (!map) return null;
  return (
    <svg className="glass-filter-defs" aria-hidden="true" focusable="false">
      <defs>
        <filter
          id="glass-lens"
          filterUnits="userSpaceOnUse"
          primitiveUnits="userSpaceOnUse"
          x="0" y="0" width={width} height={height}
        >
          <feImage href={map} x="0" y="0" width={width} height={height} result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale="64" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

const WEATHER_CACHE_KEY = 'header-weather-v2';
const WEATHER_TTL_MS = 10 * 60 * 1000;

function mapWeatherCode(code) {
  if (code <= 1)  return 'Clear';   // 0 = Clear sky, 1 = Mainly clear
  if (code <= 3)  return 'Cloudy';  // 2 = Partly cloudy, 3 = Overcast
  if (code <= 48) return 'Cloudy';  // fog / overcast codes
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  return 'Stormy';
}

/* Google Material Symbols (Rounded, 20px) weather glyphs — Apache 2.0 */
const WEATHER_ICON_PATHS = {
  clearDay: 'M480.21-768q-15.21 0-25.71-10.32-10.5-10.33-10.5-25.59v-71.83q0-15.26 10.29-25.76 10.29-10.5 25.5-10.5t25.71 10.32q10.5 10.33 10.5 25.59v71.83q0 15.26-10.29 25.76-10.29 10.5-25.5 10.5ZM684-684q-11-9.86-11-24.64 0-14.78 11-25.54l49.9-51.07Q744.59-796 759.3-796q14.7 0 25.7 11t11 25.5q0 14.5-11 25.5l-51 50q-11 11-25 11t-25-11Zm120.26 240q-15.26 0-25.76-10.29-10.5-10.29-10.5-25.5t10.32-25.71q10.33-10.5 25.59-10.5h71.83q15.26 0 25.76 10.29 10.5 10.29 10.5 25.5t-10.32 25.71Q891.35-444 876.09-444h-71.83ZM480.21-48Q465-48 454.5-58.32 444-68.65 444-83.91v-71.83q0-15.26 10.29-25.76 10.29-10.5 25.5-10.5t25.71 10.32q10.5 10.33 10.5 25.59v71.83Q516-69 505.71-58.5 495.42-48 480.21-48ZM225.82-684l-51.07-50.24Q164-745 164-759.5q0-14.5 11-25.5 11-10 25.5-10.5T226-785l50 51q11 11 11 25t-11 25q-10.75 11-25.09 11-14.33 0-25.09-11ZM734-175l-50-51q-11-11-11-25t11-25q11-11 25-11t25 11l51.22 50.15Q796-216 796-201q0 15-10.52 26-11.48 11-25.98 11T734-175ZM84.26-444Q69-444 58.5-454.29 48-464.58 48-479.79t10.32-25.71Q68.65-516 83.91-516h71.83q15.26 0 25.76 10.29 10.5 10.29 10.5 25.5t-10.32 25.71Q171.35-444 156.09-444H84.26ZM175-175.48Q164-186 164-200.5t11-25.5l51-50q11-10 25.18-10 14.19 0 24.5 10.04Q286-265 286-251t-10 25l-50.24 51.06Q215-164 200.5-164q-14.5 0-25.5-11.48ZM480-240q-100 0-170-70t-70-170q0-100 70-170t170-70q100 0 170 70t70 170q0 100-70 170t-170 70Zm0-72q70 0 119-49t49-119q0-70-49-119t-119-49q-70 0-119 49t-49 119q0 70 49 119t119 49Zm0-168Z',
  clearNight: 'M531.11-48q-80.49 0-150.92-30.66-70.42-30.66-122.65-82.88-52.22-52.23-82.88-122.65Q144-354.62 144-435.11 144-575 232-682.5T460-816q-17 99 11.5 188T569-470q67 67 158 95t185 11q-24 138-132.5 227T531.11-48Zm-.11-72q88 0 164-45t115-122q-83-5-158.5-39.5T517-420q-60-60-94-135t-40-159q-77 41-122 116.18-45 75.19-45 162.82 0 131.25 91.88 223.12Q399.75-120 531-120Zm-14-300Z',
  cloud: 'M240-192q-80 0-136-56T48-384q0-76 52-131.5T227-576q23-85 92.5-138.5T480-768q103 0 179 69.5T744-528q70 0 119 49t49 119q0 70-49 119t-119 49H240Zm0-72h504q40 0 68-28t28-68q0-40-28-68t-68-28h-66l-6-65q-7-74-62-124.5T480-696q-64 0-115 38.5T297-556l-14 49-51 3q-48 3-80 37.5T120-384q0 50 35 85t85 35Zm240-216Z',
  rainy: 'M550-100q-14 7-27.5 2.5T502-116l-60-120q-7-14-2.5-27.5T458-284q13-7 27-2.5t21 18.5l60 120q7 14 2.5 27.5T550-100Zm198 0q-14 7-28 2.5T699-116l-60-120q-7-14-2-27.5t19-20.5q14-7 27.5-2.5T704-268l60 120q7 14 2.5 27.5T748-100Zm-396 0q-14 7-28 2.5T303-116l-60-120q-7-14-2-27.5t19-20.5q14-7 27.5-2.5T308-268l60 120q7 14 2.5 27.5T352-100Zm-57-236q-85 0-142-61.5T96-545q0-77 52.5-132.5T278-743q30-56 84.5-88.5T480-864q85 0 148 54.5T705-672q67 2 113 52t46 116q0 70-49 119t-119 49H295Zm5-72h396q40 0 68-28t28-68q0-40-28-68t-68-28h-53l-9-60q-8-57-52-94.5T480-792q-46 0-84 25t-58 67l-14 28h-24q-55 0-93.5 38.5T168-540q0 55 38.5 93.5T300-408Zm180-192Z',
  snowy: 'M264.11-240Q244-240 230-253.89q-14-13.88-14-34Q216-308 229.89-322q13.88-14 34-14Q284-336 298-322.11q14 13.88 14 34Q312-268 298.11-254q-13.88 14-34 14Zm120 144Q364-96 350-109.89q-14-13.88-14-34Q336-164 349.89-178q13.88-14 34-14Q404-192 418-178.11q14 13.88 14 34Q432-124 418.11-110q-13.88 14-34 14Zm120-144Q484-240 470-253.89q-14-13.88-14-34Q456-308 469.89-322q13.88-14 34-14Q524-336 538-322.11q14 13.88 14 34Q552-268 538.11-254q-13.88 14-34 14Zm240 0Q724-240 710-253.89q-14-13.88-14-34Q696-308 709.89-322q13.88-14 34-14Q764-336 778-322.11q14 13.88 14 34Q792-268 778.11-254q-13.88 14-34 14Zm-120 144Q604-96 590-109.89q-14-13.88-14-34Q576-164 589.89-178q13.88-14 34-14Q644-192 658-178.11q14 13.88 14 34Q672-124 658.11-110q-13.88 14-34 14ZM295-384q-85 0-142-61.27Q96-506.55 96-593q0-77 52.41-132.57Q200.82-781.14 278-791q31-55 85-88t116.57-33q85.33 0 148.38 54t76.71 138.13Q772-714 818-666.24q46 47.75 46 114.24 0 70-49 119t-119 49H295Zm2-72h399q40.32 0 68.16-28.5Q792-513 792-553t-27.84-68.5Q736.32-650 696-650h-53v-40q0-64-47.5-107T483-840q-54 0-95.5 33.5T324-723q-62 2-109 38t-47 95q0 55 37.5 94.5T297-456Zm183-97Z',
  storm: 'm524-60 44-51-46-27q-15-9-17.5-25.5T514-193l77-85q5-5 12-8t15-3q24 0 33.5 22t-7.5 39l-47 50 45 25q15 8 17.5 25T651-98l-72 85q-5 6-12 9t-15 3q-23 0-33-21t5-38Zm-240 0 44-51-46-27q-15-9-17.5-25.5T274-193l77-85q5-5 12-8t15-3q24 0 33.5 22t-7.5 39l-47 50 45 25q15 8 17.5 25T411-98l-72 85q-5 6-12 9t-15 3q-23 0-33-21t5-38Zm11-276q-85 0-142-61.5T96-545q0-77 52.5-132.5T278-743q30-56 84.5-88.5T480-864q85 0 148 54.5T705-672q67 2 113 52t46 116q0 70-49 119t-119 49H295Zm5-72h396q40 0 68-28t28-68q0-40-28-68t-68-28h-53l-9-60q-8-57-52-94.5T480-792q-46 0-84 25t-58 67l-14 28h-24q-55 0-93.5 38.5T168-540q0 55 38.5 93.5T300-408Zm180-192Z',
};

function WeatherIcon({ condition, isDay }) {
  const key =
    condition === 'Clear'  ? (isDay ? 'clearDay' : 'clearNight') :
    condition === 'Rainy'  ? 'rainy' :
    condition === 'Snowy'  ? 'snowy' :
    condition === 'Stormy' ? 'storm'  : 'cloud';
  return (
    <svg width="14" height="14" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d={WEATHER_ICON_PATHS[key]} />
    </svg>
  );
}

function readWeatherCache() {
  try {
    const cached = window.localStorage.getItem(WEATHER_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (!parsed || typeof parsed.temperature !== 'number' || !parsed.condition || !parsed.ts) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeWeatherCache(temperature, condition, isDay) {
  try {
    window.localStorage.setItem(
      WEATHER_CACHE_KEY,
      JSON.stringify({ temperature, condition, isDay, ts: Date.now() })
    );
  } catch {
    // Ignore storage errors in private mode/quota limits.
  }
}

function Header({ navActive }) {
  const [time, setTime] = useState('');
  const [weather, setWeather] = useState('Cloudy');
  const [isDay, setIsDay] = useState(true);
  const [temperature, setTemperature] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pill size drives the lens displacement map (must match exact pixels)
  const pillRef = useRef(null);
  const [pillSize, setPillSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;
    const measure = () => {
      const r = pill.getBoundingClientRect();
      setPillSize(prev =>
        (Math.round(r.width) !== prev.w || Math.round(r.height) !== prev.h)
          ? { w: Math.round(r.width), h: Math.round(r.height) }
          : prev
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(pill);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const londonTime = now.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      setTime(londonTime);
    };

    let mounted = true;

    const fetchWeather = async () => {
      try {
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current_weather=true'
        );
        if (!response.ok) throw new Error('Failed to fetch weather');

        const data = await response.json();
        if (!mounted || !data?.current_weather) return;

        const temp = Math.round(data.current_weather.temperature);
        const condition = mapWeatherCode(data.current_weather.weathercode);
        const day = data.current_weather.is_day !== 0;

        setTemperature(temp);
        setWeather(condition);
        setIsDay(day);
        writeWeatherCache(temp, condition, day);
      } catch {
        if (!mounted) return;

        setWeather('Cloudy');
        setTemperature('');
      }
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 60 * 1000);

    const cached = readWeatherCache();
    if (cached) {
      setTemperature(cached.temperature);
      setWeather(cached.condition);
      if (typeof cached.isDay === 'boolean') setIsDay(cached.isDay);
    }

    if (!cached || Date.now() - cached.ts > WEATHER_TTL_MS) {
      fetchWeather();
    }

    const weatherInterval = setInterval(fetchWeather, WEATHER_TTL_MS);

    return () => {
      mounted = false;
      clearInterval(timeInterval);
      clearInterval(weatherInterval);
    };
  }, []);

  return (
    <>
      {/* ── Floating liquid-glass pill ───────────────────────────
          One rounded lens holds the header bar and (on mobile) the
          expanding menu. Radius relaxes from capsule to rounded
          rect as the menu opens; height animates via the menu's
          height: 0 ↔ auto wrapper.                                */}
      <GlassLensFilter width={pillSize.w} height={pillSize.h} radius={mobileMenuOpen ? 28 : 48} />
      <header className="header">
        <div className="container">
          <m.div
            ref={pillRef}
            className="glass-pill"
            animate={{ borderRadius: mobileMenuOpen ? 28 : 48 }}
            transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
          >
          <div className="glass-pill-blur" aria-hidden="true" />
          <div className="glass-pill-refract" aria-hidden="true" />
          <div className="header-content">
            <div className="header-left">
              <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
                Toby Cheng
              </Link>
              <p className="location">
                London {time}
                {temperature !== '' && (
                  <>, {temperature}°C <span className="header-weather-condition">
                    {weather}
                    <WeatherIcon condition={weather} isDay={isDay} />
                  </span></>
                )}
              </p>
            </div>

            <nav className="nav-desktop">
              {navLinks.map((link) => (
                <MotionLink
                  key={link.key}
                  to={link.to}
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={navActive === link.key ? { color: '#000000' } : {}}
                >
                  {link.label}
                </MotionLink>
              ))}
              <MotionLink
                to="/#connect"
                className="btn-connect"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400 }}
                style={{ textDecoration: 'none' }}
              >
                Connect!
              </MotionLink>
            </nav>

            <button
              className={`mobile-menu-btn${mobileMenuOpen ? ' open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="icn-bar icn-bar-top" />
              <div className="icn-bar icn-bar-middle" />
              <div className="icn-bar icn-bar-bottom" />
            </button>
          </div>

          {/* Mobile menu — expands the pill downward */}
          <AnimatePresence initial={false}>
            {mobileMenuOpen && (
              <m.div
                className="nav-mobile-wrap"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
              >
                <nav className="nav-mobile">
                  <div className="nav-mobile-links">
                    {navLinks.map((link) => (
                      <Link
                        key={link.key}
                        to={link.to}
                        onClick={() => setMobileMenuOpen(false)}
                        style={navActive === link.key ? { color: '#000000' } : {}}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <Link
                    to="/#connect"
                    className="btn-connect btn-connect-full"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ textDecoration: 'none', textAlign: 'center' }}
                  >
                    Connect!
                  </Link>
                </nav>
              </m.div>
            )}
          </AnimatePresence>
          </m.div>
        </div>
      </header>
    </>
  );
}

export default Header;
