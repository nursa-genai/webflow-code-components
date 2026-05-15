import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import './SearchJobs.css';

const LICENSE_CONFIG = {
  rn: {
    display: 'RN',
    urlPrefix: '/rn/',
    badgeColor: '#16a34a',
    badgeBgLight: 'rgba(22,163,74,0.08)',
    badgeBgDark: 'rgba(22,163,74,0.2)',
  },
  qmap: {
    display: 'QMAP',
    urlPrefix: '/qmap/',
    badgeColor: '#5924b0',
    badgeBgLight: 'rgba(89,36,176,0.08)',
    badgeBgDark: 'rgba(89,36,176,0.2)',
  },
  'rn-icu': {
    display: 'RN ICU',
    urlPrefix: '/jobs/prn/registered-nurse/rn-icu/',
    badgeColor: '#2563eb',
    badgeBgLight: 'rgba(37,99,235,0.08)',
    badgeBgDark: 'rgba(37,99,235,0.2)',
  },
  'rn icu': {
    display: 'RN ICU',
    urlPrefix: '/jobs/prn/registered-nurse/rn-icu/',
    badgeColor: '#2563eb',
    badgeBgLight: 'rgba(37,99,235,0.08)',
    badgeBgDark: 'rgba(37,99,235,0.2)',
  },
  cna: {
    display: 'CNA',
    urlPrefix: '/cna/',
    badgeColor: '#ea580c',
    badgeBgLight: 'rgba(234,88,12,0.08)',
    badgeBgDark: 'rgba(234,88,12,0.2)',
  },
  lpn: {
    display: 'LPN',
    urlPrefix: '/lpn/',
    badgeColor: '#d946ef',
    badgeBgLight: 'rgba(217,70,239,0.08)',
    badgeBgDark: 'rgba(217,70,239,0.2)',
  },
  lvn: {
    display: 'LVN',
    urlPrefix: '/lvn/',
    badgeColor: '#f59e0b',
    badgeBgLight: 'rgba(245,158,11,0.08)',
    badgeBgDark: 'rgba(245,158,11,0.2)',
  },
  rt: {
    display: 'RT',
    urlPrefix: '/rt/',
    badgeColor: '#0891b2',
    badgeBgLight: 'rgba(8,145,178,0.08)',
    badgeBgDark: 'rgba(8,145,178,0.2)',
  },
  cma: {
    display: 'CMA',
    urlPrefix: '/cma/',
    badgeColor: '#e11d48',
    badgeBgLight: 'rgba(225,29,72,0.08)',
    badgeBgDark: 'rgba(225,29,72,0.2)',
  },
  crma: {
    display: 'CRMA',
    urlPrefix: '/crma/',
    badgeColor: '#ca8a04',
    badgeBgLight: 'rgba(202,138,4,0.08)',
    badgeBgDark: 'rgba(202,138,4,0.2)',
  },
  gna: {
    display: 'GNA',
    urlPrefix: '/gna/',
    badgeColor: '#059669',
    badgeBgLight: 'rgba(5,150,105,0.08)',
    badgeBgDark: 'rgba(5,150,105,0.2)',
  },
  'ma-c': {
    display: 'MA-C',
    urlPrefix: '/ma-c/',
    badgeColor: '#7c3aed',
    badgeBgLight: 'rgba(124,58,237,0.08)',
    badgeBgDark: 'rgba(124,58,237,0.2)',
  },
  cg: {
    display: 'CG',
    urlPrefix: '/caregiver/',
    badgeColor: '#0d9488',
    badgeBgLight: 'rgba(13,148,136,0.08)',
    badgeBgDark: 'rgba(13,148,136,0.2)',
  },
  'cna-med-surg': {
    display: 'CNA Med Surg',
    urlPrefix: '/jobs/prn/certified-nursing-assistant/cna-med-surg/',
    badgeColor: '#0e7490',
    badgeBgLight: 'rgba(14,116,144,0.08)',
    badgeBgDark: 'rgba(14,116,144,0.2)',
  },
  'cna med surg': {
    display: 'CNA Med Surg',
    urlPrefix: '/jobs/prn/certified-nursing-assistant/cna-med-surg/',
    badgeColor: '#0e7490',
    badgeBgLight: 'rgba(14,116,144,0.08)',
    badgeBgDark: 'rgba(14,116,144,0.2)',
  },
  'cna-er': {
    display: 'CNA ER',
    urlPrefix: '/jobs/prn/certified-nursing-assistant/cna-er/',
    badgeColor: '#dc2626',
    badgeBgLight: 'rgba(220,38,38,0.08)',
    badgeBgDark: 'rgba(220,38,38,0.2)',
  },
  'cna er': {
    display: 'CNA ER',
    urlPrefix: '/jobs/prn/certified-nurse/cna-er/',
    badgeColor: '#dc2626',
    badgeBgLight: 'rgba(220,38,38,0.08)',
    badgeBgDark: 'rgba(220,38,38,0.2)',
  },
  'cna-icu': {
    display: 'CNA ICU',
    urlPrefix: '/jobs/prn/certified-nursing-assistant/cna-icu/',
    badgeColor: '#1d4ed8',
    badgeBgLight: 'rgba(29,78,216,0.08)',
    badgeBgDark: 'rgba(29,78,216,0.2)',
  },
  'cna icu': {
    display: 'CNA ICU',
    urlPrefix: '/jobs/prn/certified-nurse/cna-icu/',
    badgeColor: '#1d4ed8',
    badgeBgLight: 'rgba(29,78,216,0.08)',
    badgeBgDark: 'rgba(29,78,216,0.2)',
  },
  'rn-med-surg': {
    display: 'RN Med Surg',
    urlPrefix: '/jobs/prn/registered-nurse/rn-med-surg/',
    badgeColor: '#15803d',
    badgeBgLight: 'rgba(21,128,61,0.08)',
    badgeBgDark: 'rgba(21,128,61,0.2)',
  },
  'rn med surg': {
    display: 'RN Med Surg',
    urlPrefix: '/jobs/prn/registered-nurse/rn-med-surg/',
    badgeColor: '#15803d',
    badgeBgLight: 'rgba(21,128,61,0.08)',
    badgeBgDark: 'rgba(21,128,61,0.2)',
  },
  'rn-er': {
    display: 'RN ER',
    urlPrefix: '/jobs/prn/registered-nurse/rn-er/',
    badgeColor: '#b91c1c',
    badgeBgLight: 'rgba(185,28,28,0.08)',
    badgeBgDark: 'rgba(185,28,28,0.2)',
  },
  'rn er': {
    display: 'RN ER',
    urlPrefix: '/jobs/prn/registered-nurse/rn-er/',
    badgeColor: '#b91c1c',
    badgeBgLight: 'rgba(185,28,28,0.08)',
    badgeBgDark: 'rgba(185,28,28,0.2)',
  },
  'rn-tele': {
    display: 'RN Tele',
    urlPrefix: '/jobs/prn/registered-nurse/rn-tele/',
    badgeColor: '#9333ea',
    badgeBgLight: 'rgba(147,51,234,0.08)',
    badgeBgDark: 'rgba(147,51,234,0.2)',
  },
  'rn tele': {
    display: 'RN Tele',
    urlPrefix: '/jobs/prn/registered-nurse/rn-tele/',
    badgeColor: '#9333ea',
    badgeBgLight: 'rgba(147,51,234,0.08)',
    badgeBgDark: 'rgba(147,51,234,0.2)',
  },
};

const US_STATES = {
  al: 'alabama', ak: 'alaska', az: 'arizona', ar: 'arkansas', ca: 'california',
  co: 'colorado', ct: 'connecticut', de: 'delaware', fl: 'florida', ga: 'georgia',
  hi: 'hawaii', id: 'idaho', il: 'illinois', in: 'indiana', ia: 'iowa',
  ks: 'kansas', ky: 'kentucky', la: 'louisiana', me: 'maine', md: 'maryland',
  ma: 'massachusetts', mi: 'michigan', mn: 'minnesota', ms: 'mississippi',
  mo: 'missouri', mt: 'montana', ne: 'nebraska', nv: 'nevada', nh: 'new hampshire',
  nj: 'new jersey', nm: 'new mexico', ny: 'new york', nc: 'north carolina',
  nd: 'north dakota', oh: 'ohio', ok: 'oklahoma', or: 'oregon', pa: 'pennsylvania',
  ri: 'rhode island', sc: 'south carolina', sd: 'south dakota', tn: 'tennessee',
  tx: 'texas', ut: 'utah', vt: 'vermont', va: 'virginia', wa: 'washington',
  wv: 'west virginia', wi: 'wisconsin', wy: 'wyoming', dc: 'district of columbia',
};

const SEARCHJOBS_URL =
  'https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/searchjobs.min.json';
const SEARCHJOBS_FIRST_URL =
  'https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/searchjobs.first.min.json';

function unpackMin(data) {
  if (!data || !Array.isArray(data.k) || !Array.isArray(data.r)) return [];
  const keys = data.k;
  return data.r.map((row) => {
    const obj = {};
    for (let i = 0; i < keys.length; i++) obj[keys[i]] = row[i];
    return obj;
  });
}

function isZipCode(q) {
  return /^\d{5}$/.test(q.trim());
}

function createRateLimiter(maxActions, windowMs) {
  const timestamps = [];
  return {
    canProceed() {
      const now = Date.now();
      while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
        timestamps.shift();
      }
      if (timestamps.length >= maxActions) return false;
      timestamps.push(now);
      return true;
    },
  };
}

function getBadgeStyle(license, isDark) {
  const key = Object.keys(LICENSE_CONFIG).find((k) => LICENSE_CONFIG[k].display === license);
  const fallback = {
    color: '#5924b0',
    background: isDark ? 'rgba(89,36,176,0.2)' : 'rgba(89,36,176,0.08)',
  };
  if (!key) return fallback;
  const cfg = LICENSE_CONFIG[key];
  return { color: cfg.badgeColor, background: isDark ? cfg.badgeBgDark : cfg.badgeBgLight };
}

function ItemCard({ item, isDark, onClickTrack }) {
  const badge = getBadgeStyle(item.license, isDark);
  const href = `${item.urlPrefix}${item.slug}`;
  return (
    <a
      href={href}
      className="sj-card"
      onMouseDown={(e) => {
        e.preventDefault();
        if (onClickTrack) onClickTrack(href);
      }}
    >
      <div className="sj-card__body">
        <div className="sj-card__name">{item.name}</div>
        <span
          className="sj-card__badge"
          style={{ color: badge.color, background: badge.background }}
        >
          {item.license}
        </span>
      </div>
      <div className="sj-card__pay-wrap">
        <div className="sj-card__pay">${item.pay.toFixed(2)}</div>
        <div className="sj-card__pay-unit">avg/hr</div>
      </div>
    </a>
  );
}

export default function SearchJobs({
  title = 'Find Locations',
  subtitle = "Select your license and the location you want to work in, and we'll show you the best PRN jobs available nearby.",
  placeholder = 'Search by city, state, or zip code...',
  variant = 'Light',
  maxResults = 6,
  trackingUrl = '',
  popularLocations = '',
  showSuggestions = true,
  dataUrl = SEARCHJOBS_URL,
  dataFirstUrl = SEARCHJOBS_FIRST_URL,
}) {
  const isDark = variant === 'Dark';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [geoLabel, setGeoLabel] = useState('');
  const [sortMode, setSortMode] = useState('default');
  const [zipResults, setZipResults] = useState([]);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipTotalCount, setZipTotalCount] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [fullyLoaded, setFullyLoaded] = useState(false);

  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);
  const geoAttempted = useRef(false);
  const userGeoCity = useRef('');
  const userGeoState = useRef('');
  const zipCache = useRef({});
  const zipAbortRef = useRef(null);
  const rateLimiter = useRef(createRateLimiter(30, 60000));
  const fullyLoadedRef = useRef(false);

  // Load data from CDN. The first-N file usually arrives well before the full
  // file, so we render the small one immediately and let the full replace it
  // when it's ready. If the full file wins the race, we ignore the first.
  useEffect(() => {
    if (!dataUrl && !dataFirstUrl) return;
    let cancelled = false;
    setLoading(true);

    const fullPromise = dataUrl
      ? fetch(dataUrl)
          .then((res) => res.json())
          .then((data) => {
            if (cancelled) return;
            fullyLoadedRef.current = true;
            setCsvData(unpackMin(data));
            setFullyLoaded(true);
            setLoading(false);
          })
          .catch(() => {
            if (!cancelled) setLoading(false);
          })
      : Promise.resolve();

    if (dataFirstUrl) {
      fetch(dataFirstUrl)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled || fullyLoadedRef.current) return;
          setCsvData(unpackMin(data));
          setLoading(false);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      // ensure fullPromise's references aren't held longer than needed
      void fullPromise;
    };
  }, [dataUrl, dataFirstUrl]);

  // Fast first-paint suggestions: as soon as ANY data is loaded (the first-N
  // file usually wins), show popular/random cards so the user sees something
  // immediately. Geo matching happens later, against the full dataset.
  const fastSuggestionsRef = useRef(false);
  useEffect(() => {
    if (!showSuggestions || csvData.length === 0 || fastSuggestionsRef.current) return;
    fastSuggestionsRef.current = true;

    function getRandomItems(data, count) {
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      const seen = new Set();
      const result = [];
      for (const item of shuffled) {
        if (!seen.has(item.name) && result.length < count) {
          seen.add(item.name);
          result.push(item);
        }
      }
      return result;
    }

    if (popularLocations && popularLocations.trim()) {
      const urls = popularLocations
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
      const matched = [];
      for (const url of urls) {
        const normalizedUrl = url.replace(/\/+$/, '');
        const found = csvData.find((d) => {
          const itemUrl = `${d.urlPrefix}${d.slug}`.replace(/\/+$/, '');
          return itemUrl === normalizedUrl;
        });
        if (found && !matched.some((m) => m.name === found.name && m.license === found.license)) {
          matched.push(found);
        }
      }
      if (matched.length > 0) {
        setSuggestedItems(matched);
        setGeoLabel('Popular locations');
        return;
      }
    }
    setSuggestedItems(getRandomItems(csvData, 12));
    setGeoLabel('Popular locations');
  }, [csvData, showSuggestions, popularLocations]);

  // Geolocation-based suggestions: only run once the FULL dataset has loaded,
  // otherwise the user would get geo-matched suggestions from the tiny first-N
  // sample that never refresh when the real data arrives.
  useEffect(() => {
    if (!showSuggestions || !fullyLoaded || geoAttempted.current) return;
    geoAttempted.current = true;

    function matchByCity(cityName, stateName, data, count) {
      const city = cityName.toLowerCase();
      const state = stateName.toLowerCase();
      let matches = data.filter((d) => d.name.toLowerCase().includes(city));
      if (matches.length === 0 && state) {
        matches = data.filter((d) => d.name.toLowerCase().includes(state));
      }
      const seen = new Set();
      const result = [];
      for (const item of matches) {
        if (!seen.has(item.name) && result.length < count) {
          seen.add(item.name);
          result.push(item);
        }
      }
      return result;
    }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
        )
          .then((res) => res.json())
          .then((data) => {
            const city =
              (data && data.address && (data.address.city || data.address.town || data.address.village || data.address.county)) ||
              '';
            const state = (data && data.address && data.address.state) || '';
            userGeoCity.current = city;
            userGeoState.current = state;
            if (city) {
              const matched = matchByCity(city, state, csvData, 12);
              if (matched.length > 0) {
                setSuggestedItems(matched);
                setGeoLabel(`Near ${city}`);
                return;
              }
            }
            if (state) {
              const matched = matchByCity('', state, csvData, 12);
              if (matched.length > 0) {
                setSuggestedItems(matched);
                setGeoLabel(`In ${state}`);
                return;
              }
            }
          })
          .catch(() => {});
      },
      () => {},
      { timeout: 5000 },
    );
  }, [fullyLoaded, csvData, showSuggestions]);

  // Match zip lookup results against CSV data
  const matchZipToItems = useCallback((city, state, stateAbbr, data, licenseFilter, max) => {
    const cityLower = city.toLowerCase();
    const stateLower = state.toLowerCase();
    const allMatches = data
      .filter((d) => {
        if (licenseFilter !== 'All' && d.license !== licenseFilter) return false;
        const nameLower = d.name.toLowerCase();
        if (cityLower && nameLower.includes(cityLower)) return true;
        if (stateLower && nameLower.includes(stateLower)) return true;
        if (stateAbbr) {
          const slugParts = d.slug.split('-');
          const slugState = slugParts[slugParts.length - 1] && slugParts[slugParts.length - 1].toLowerCase();
          if (slugState === stateAbbr) return true;
        }
        return false;
      })
      .sort((a, b) => {
        const aCity = cityLower ? a.name.toLowerCase().includes(cityLower) : false;
        const bCity = cityLower ? b.name.toLowerCase().includes(cityLower) : false;
        if (aCity && !bCity) return -1;
        if (!aCity && bCity) return 1;
        return 0;
      });
    return { items: allMatches.slice(0, max), totalCount: allMatches.length };
  }, []);

  // Zip code lookup via Zippopotam.us
  useEffect(() => {
    const trimmed = query.trim();
    if (!isZipCode(trimmed)) {
      setZipResults([]);
      setZipLoading(false);
      return;
    }

    if (zipCache.current[trimmed] !== undefined) {
      const cached = zipCache.current[trimmed];
      if (!cached) {
        setZipResults([]);
        setZipTotalCount(0);
        setZipLoading(false);
        return;
      }
      const { items, totalCount } = matchZipToItems(
        cached.city, cached.state, cached.stateAbbr, csvData, filter, maxResults,
      );
      setZipResults(items);
      setZipTotalCount(totalCount);
      setZipLoading(false);
      return;
    }

    if (zipAbortRef.current) zipAbortRef.current.abort();
    const controller = new AbortController();
    zipAbortRef.current = controller;

    if (!rateLimiter.current.canProceed()) {
      setZipResults([]);
      setZipTotalCount(0);
      setZipLoading(false);
      setRateLimited(true);
      return;
    }
    setRateLimited(false);

    setZipLoading(true);
    setZipResults([]);
    setZipTotalCount(0);

    const timeout = setTimeout(() => {
      fetch(`https://api.zippopotam.us/us/${trimmed}`, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error('not found');
          return res.json();
        })
        .then((data) => {
          const place = data && data.places && data.places[0];
          if (!place) {
            zipCache.current[trimmed] = null;
            setZipResults([]);
            setZipTotalCount(0);
            setZipLoading(false);
            return;
          }
          const city = place['place name'] || '';
          const state = place['state'] || '';
          const stateAbbr = (place['state abbreviation'] && place['state abbreviation'].toLowerCase()) || '';
          zipCache.current[trimmed] = { city, state, stateAbbr };
          const { items, totalCount } = matchZipToItems(city, state, stateAbbr, csvData, filter, maxResults);
          setZipResults(items);
          setZipTotalCount(totalCount);
          setZipLoading(false);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            zipCache.current[trimmed] = null;
            setZipResults([]);
            setZipTotalCount(0);
            setZipLoading(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, csvData, filter, maxResults, matchZipToItems]);

  const allLicenses = useMemo(() => {
    const set = new Set(csvData.map((d) => d.license));
    return ['All', ...Array.from(set).sort()];
  }, [csvData]);

  const displayedSuggested = useMemo(() => {
    if (filter === 'All') return suggestedItems;
    return suggestedItems.filter((d) => d.license === filter);
  }, [suggestedItems, filter]);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    if (isZipCode(query.trim())) return zipResults;
    const q = query.toLowerCase();
    return csvData
      .filter((d) => {
        if (filter !== 'All' && d.license !== filter) return false;
        if (d.name.toLowerCase().includes(q)) return true;
        const slugParts = d.slug.split('-');
        const stateAbbr = slugParts[slugParts.length - 1] && slugParts[slugParts.length - 1].toLowerCase();
        if (stateAbbr && stateAbbr.length === 2) {
          if (stateAbbr === q) return true;
          const fullState = US_STATES[stateAbbr];
          if (fullState && fullState.includes(q)) return true;
        }
        return false;
      })
      .slice(0, maxResults);
  }, [query, maxResults, filter, csvData, zipResults]);

  const trackSearch = useCallback(
    (q, f, count) => {
      if (!trackingUrl || !q.trim()) return;
      if (!rateLimiter.current.canProceed()) return;
      const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
      fetch(trackingUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'search',
          query: q.trim(),
          filter: f,
          resultsCount: count,
          clickedUrl: '',
          pageUrl,
        }),
      }).catch(() => {});
    },
    [trackingUrl],
  );

  const trackClick = useCallback(
    (clickedUrl) => {
      if (!trackingUrl) return;
      if (!rateLimiter.current.canProceed()) return;
      const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
      fetch(trackingUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'click',
          query: query.trim(),
          filter,
          resultsCount: filtered.length,
          clickedUrl,
          pageUrl,
        }),
      }).catch(() => {});
    },
    [trackingUrl, query, filter, filtered.length],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) return;
    debounceRef.current = setTimeout(() => {
      if (isZipCode(query.trim())) {
        trackSearch(query, filter, zipTotalCount);
        return;
      }
      const q = query.toLowerCase();
      const count = csvData.filter((d) => {
        if (filter !== 'All' && d.license !== filter) return false;
        if (d.name.toLowerCase().includes(q)) return true;
        const slugParts = d.slug.split('-');
        const stateAbbr = slugParts[slugParts.length - 1] && slugParts[slugParts.length - 1].toLowerCase();
        if (stateAbbr && stateAbbr.length === 2) {
          if (stateAbbr === q) return true;
          const fullState = US_STATES[stateAbbr];
          if (fullState && fullState.includes(q)) return true;
        }
        return false;
      }).length;
      trackSearch(query, filter, count);
    }, 1500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filter, csvData, trackSearch, zipTotalCount]);

  const sortItems = useCallback(
    (items) => {
      if (sortMode !== 'nearby') return items;
      const city = userGeoCity.current.toLowerCase();
      const state = userGeoState.current.toLowerCase();
      if (!city && !state) return items;
      return [...items].sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aCity = city ? aName.includes(city) : false;
        const bCity = city ? bName.includes(city) : false;
        if (aCity && !bCity) return -1;
        if (!aCity && bCity) return 1;
        const aState = state ? aName.includes(state) : false;
        const bState = state ? bName.includes(state) : false;
        if (aState && !bState) return -1;
        if (!aState && bState) return 1;
        return 0;
      });
    },
    [sortMode],
  );

  const hasGeo = !!(userGeoCity.current || userGeoState.current);

  const PinIcon = ({ color, size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );

  return (
    <div className="sj-root" data-theme={isDark ? 'dark' : 'light'}>
      {title && <h2 className="sj-title">{title}</h2>}
      {subtitle && <p className="sj-subtitle">{subtitle}</p>}

      <div className="sj-controls">
        {allLicenses.length > 2 && (
          <div
            ref={dropdownRef}
            className="sj-dropdown-wrap"
            tabIndex={0}
            onBlur={(e) => {
              if (
                e.relatedTarget &&
                !(
                  dropdownRef.current?.contains(e.relatedTarget) ||
                  e.relatedTarget.classList?.contains('sj-dropdown-wrap')
                )
              ) {
                setDropdownOpen(false);
              }
            }}
          >
            <button
              type="button"
              className="sj-dropdown-toggle"
              onClick={() => setDropdownOpen((o) => !o)}
            >
              <span className="sj-dropdown-toggle__label">
                {filter === 'All' ? 'All Licenses' : filter}
              </span>
              <svg
                className={`sj-dropdown-toggle__arrow${dropdownOpen ? ' is-open' : ''}`}
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
              >
                <path d="M1 1L5 5L9 1" stroke="#5924b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="sj-dropdown-panel">
                {allLicenses.map((l) => (
                  <div
                    key={l}
                    className={`sj-dropdown-option${filter === l ? ' is-active' : ''}`}
                    onClick={() => {
                      setFilter(l);
                      setDropdownOpen(false);
                    }}
                  >
                    {l === 'All' ? 'All Licenses' : l}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="sj-search-wrap">
          <svg
            className="sj-search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--sj-sub)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="sj-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      </div>

      {loading && <div className="sj-status">Loading locations…</div>}
      {zipLoading && <div className="sj-status">Looking up zip code…</div>}
      {rateLimited && (
        <div className="sj-status">Too many searches — please wait a moment and try again.</div>
      )}

      {!loading &&
        showSuggestions &&
        hasGeo &&
        (displayedSuggested.length > 0 || filtered.length > 0) && (
          <div className="sj-sort-row">
            {(['default', 'nearby']).map((mode) => {
              const active = sortMode === mode;
              const iconColor = active ? '#ffffff' : '#5924b0';
              return (
                <button
                  key={mode}
                  type="button"
                  className={`sj-sort-btn${active ? ' is-active' : ''}`}
                  onClick={() => setSortMode(mode)}
                >
                  {mode === 'nearby' && (
                    <span style={{ marginRight: 4, display: 'inline-flex' }}>
                      <PinIcon color={iconColor} />
                    </span>
                  )}
                  {mode === 'default' ? 'Default' : 'Nearby'}
                </button>
              );
            })}
          </div>
        )}

      {!loading && showSuggestions && !query.trim() && displayedSuggested.length > 0 && (
        <>
          <div className="sj-suggested-label">
            <PinIcon color="#5924b0" />
            {geoLabel}
          </div>
          <div className="sj-results">
            {sortItems(displayedSuggested).map((item, i) => (
              <ItemCard
                key={`s-${i}`}
                item={item}
                isDark={isDark}
                onClickTrack={trackClick}
              />
            ))}
          </div>
        </>
      )}

      {filtered.length > 0 && (
        <div className="sj-results">
          {sortItems(filtered).map((item, i) => (
            <ItemCard key={i} item={item} isDark={isDark} onClickTrack={trackClick} />
          ))}
        </div>
      )}
    </div>
  );
}
