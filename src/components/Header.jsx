import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MotionLink = motion(Link);

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

function WeatherIcon({ condition, isDay }) {
  const shared = { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none', 'aria-hidden': true, style: { flexShrink: 0 } };
  if (condition === 'Clear' && !isDay) {
    return (
      <svg {...shared}>
        <path d="M11.5 8.5A5.5 5.5 0 1 1 5.5 2.5a4 4 0 1 0 6 6z" fill="currentColor" />
      </svg>
    );
  }
  if (condition === 'Clear') {
    return (
      <svg {...shared}>
        <circle cx="7" cy="7" r="2.2" fill="currentColor" />
        <path d="M7 1.5v1M7 11.5v1M1.5 7h1M11.5 7h1M3.4 3.4l.7.7M9.9 9.9l.7.7M10.6 3.4l-.7.7M4.1 9.9l-.7.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (condition === 'Rainy') {
    return (
      <svg {...shared}>
        <path d="M3.5 9a2.5 2.5 0 0 1 0-5 3.5 3.5 0 0 1 6.5 1H11a2 2 0 0 1 0 4H3.5z" fill="currentColor" />
        <path d="M5 11l-.5 1.5M8 11l-.5 1.5M11 11l-.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (condition === 'Snowy') {
    return (
      <svg {...shared}>
        <path d="M3.5 8.5a2.5 2.5 0 0 1 0-5 3.5 3.5 0 0 1 6.5 1H11a2 2 0 0 1 0 4H3.5z" fill="currentColor" />
        <circle cx="5" cy="11" r="0.8" fill="currentColor" />
        <circle cx="7.5" cy="12" r="0.8" fill="currentColor" />
        <circle cx="10" cy="11" r="0.8" fill="currentColor" />
      </svg>
    );
  }
  if (condition === 'Stormy') {
    return (
      <svg {...shared}>
        <path d="M3.5 8a2.5 2.5 0 0 1 0-5 3.5 3.5 0 0 1 6.5 1H11a2 2 0 0 1 0 4H3.5z" fill="currentColor" />
        <path d="M7 10l-1.5 3H8L6.5 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // Cloudy (default)
  return (
    <svg {...shared}>
      <path d="M3.5 10a2.5 2.5 0 0 1 0-5 3.5 3.5 0 0 1 6.5 1H11a2 2 0 0 1 0 4H3.5z" fill="currentColor" />
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

  // Heights for the single shared glass backdrop
  const headerRef = useRef(null);
  const navRef    = useRef(null);
  const [headerH, setHeaderH] = useState(56);   // fallback ≈ mobile header
  const [navH,    setNavH]    = useState(0);

  // Measure header height before first paint and on resize
  useLayoutEffect(() => {
    const update = () => {
      if (!headerRef.current) return;
      const h = headerRef.current.offsetHeight;
      setHeaderH(h);
      document.documentElement.style.setProperty('--header-h', `${h}px`);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Measure nav height synchronously after it mounts / unmounts
  useLayoutEffect(() => {
    if (mobileMenuOpen && navRef.current) {
      setNavH(navRef.current.offsetHeight);
    } else {
      setNavH(0);
    }
  }, [mobileMenuOpen]);

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

  const navLinks = [
    { label: 'Home',  to: '/#home', key: 'home' },
    { label: 'Work',  to: '/#work', key: 'work' },
    { label: 'About', to: '/about', key: 'about' },
  ];

  return (
    <>
      {/* ── Single shared glass backdrop ─────────────────────────
          One backdrop-filter covers both the header bar and the
          mobile nav — no seam, no separate blur regions.          */}
      <motion.div
        className="glass-backdrop"
        animate={{
          height:       mobileMenuOpen ? headerH + navH : headerH,
          borderRadius: mobileMenuOpen ? '0 0 24px 24px' : '0 0 0 0',
        }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Spacer: pushes nav content below the header bar area */}
        <div style={{ height: headerH, flexShrink: 0 }} aria-hidden="true" />

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              ref={navRef}
              className="nav-mobile"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            >
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
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Sticky header bar ────────────────────────────────────
          Transparent — sits above the glass backdrop (z-index 100)
          so the backdrop's blur shows through underneath.         */}
      <header ref={headerRef} className="header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
                Toby Cheng
              </Link>
              <p className="location">
                London (GMT+0) {time}
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
        </div>
      </header>
    </>
  );
}

export default Header;
