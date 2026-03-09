import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MotionLink = motion(Link);

const WEATHER_CACHE_KEY = 'header-weather-v1';
const WEATHER_TTL_MS = 10 * 60 * 1000;

function mapWeatherCode(weatherCode) {
  if (weatherCode === 0) return 'Clear';
  if (weatherCode <= 3) return 'Cloudy';
  if (weatherCode <= 67) return 'Rainy';
  if (weatherCode <= 77) return 'Snowy';
  return 'Stormy';
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

function writeWeatherCache(temperature, condition) {
  try {
    window.localStorage.setItem(
      WEATHER_CACHE_KEY,
      JSON.stringify({ temperature, condition, ts: Date.now() })
    );
  } catch {
    // Ignore storage errors in private mode/quota limits.
  }
}

function Header({ navActive }) {
  const [time, setTime] = useState('');
  const [weather, setWeather] = useState('Cloudy');
  const [temperature, setTemperature] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        setTemperature(temp);
        setWeather(condition);
        writeWeatherCache(temp, condition);
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
    { label: 'Home', to: '/#home', key: 'home' },
    { label: 'Work', to: '/#work', key: 'work' },
  ];

  return (
    <header className={`header${mobileMenuOpen ? ' header-open' : ''}`}>
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            <Link to="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>
              Toby Cheng
            </Link>
            <p className="location">
              London (GMT+0) {time}
              {temperature !== '' ? `, ${temperature}°C ${weather}` : ''}
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

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
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
    </header>
  );
}

export default Header;
