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

// Resolve a license input (display name like "RN ICU", config key like
// "rn-icu", or empty) to the canonical display value the filter state expects.
// Returns 'All' for empty / unknown inputs.
function resolveLicense(input) {
  if (!input) return 'All';
  const lower = String(input).toLowerCase().trim();
  if (LICENSE_CONFIG[lower]) return LICENSE_CONFIG[lower].display;
  for (const key of Object.keys(LICENSE_CONFIG)) {
    if (LICENSE_CONFIG[key].display.toLowerCase() === lower) {
      return LICENSE_CONFIG[key].display;
    }
  }
  return 'All';
}

function hasCookieConsent() {
  if (typeof document === 'undefined') return false;
  const match = document.cookie.match(/(?:^|;\s*)cookie-consent=([^;]+)/);
  return match ? match[1].toLowerCase() === 'true' : false;
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
  defaultState = '',
  defaultCity = '',
  defaultZip = '',
  defaultLicense = '',
}) {
  const isDark = variant === 'Dark';
  // Pre-fill priority: zip beats city beats state. License is a separate
  // dropdown so it's set independently. These initial values only apply on
  // mount — the user can still edit the search box / dropdown afterward.
  const [query, setQuery] = useState(
    () => String(defaultZip || defaultCity || defaultState || '').trim(),
  );
  const [filter, setFilter] = useState(() => resolveLicense(defaultLicense));
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [geoLabel, setGeoLabel] = useState('Popular locations');
  const [sortMode, setSortMode] = useState('default');
  const [zipResults, setZipResults] = useState([]);
  const [zipLoading, setZipLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [fullyLoaded, setFullyLoaded] = useState(false);

  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);
  // Geolocation is opt-in. The user must click the "Nearby" sort button to
  // trigger the browser permission prompt and the reverse-geocode lookup;
  // nothing fires on mount. States: 'idle' | 'requesting' | 'granted' | 'denied'.
  const [geoStatus, setGeoStatus] = useState('idle');
  const [userGeoCity, setUserGeoCity] = useState('');
  const [userGeoState, setUserGeoState] = useState('');
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

  // Curated suggestions: only populated if the host passed `popularLocations`
  // with URLs that match items in the dataset. When set, the suggestions grid
  // shows exactly these items (and Load More is meaningless because it's a
  // hand-picked list). When empty, filteredPool falls back to the full csvData
  // so Load More can page through the whole dataset.
  const curatedDoneRef = useRef(false);
  useEffect(() => {
    if (!showSuggestions || csvData.length === 0 || curatedDoneRef.current) return;
    if (!popularLocations || !popularLocations.trim()) return;
    curatedDoneRef.current = true;

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
    }
  }, [csvData, showSuggestions, popularLocations]);

  // Opt-in geolocation: requests browser permission and reverse-geocodes via
  // Nominatim. Triggered by the user clicking the "Nearby" sort button.
  // Gated on the site's cookie-consent cookie — we do not prompt for browser
  // location until the user has accepted cookies.
  const requestGeo = useCallback(() => {
    if (!hasCookieConsent()) {
      setGeoStatus('denied');
      return;
    }
    if (!rateLimiter.current.canProceed()) {
      setRateLimited(true);
      return;
    }
    setRateLimited(false);

    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('requesting');
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
            setUserGeoCity(city);
            setUserGeoState(state);
            setGeoStatus('granted');
            if (city) setGeoLabel(`Near ${city}`);
            else if (state) setGeoLabel(`In ${state}`);
          })
          .catch(() => setGeoStatus('denied'));
      },
      () => setGeoStatus('denied'),
      { timeout: 5000 },
    );
  }, []);

  // One-time Fisher–Yates shuffle of the dataset. Re-runs only when csvData
  // itself changes (first-N → full file). Everything downstream that doesn't
  // have a specific ordering signal (license, geo, search relevance) iterates
  // this shuffled view, so users see a varied selection on each fresh load
  // instead of "Aabc, Abbey, Aberdeen…" every time. Declared early so the zip
  // useEffect and filteredPool useMemo can reference it without a TDZ error.
  const shuffledData = useMemo(() => {
    if (csvData.length === 0) return [];
    const arr = [...csvData];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [csvData]);

  // Match zip lookup results against CSV data — returns the full sorted list
  // so the search-results Load More button can page through every match.
  const matchZipToItems = useCallback((city, state, stateAbbr, data, licenseFilter) => {
    const cityLower = city.toLowerCase();
    const stateLower = state.toLowerCase();
    return data
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
        setZipLoading(false);
        return;
      }
      setZipResults(matchZipToItems(cached.city, cached.state, cached.stateAbbr, shuffledData, filter));
      setZipLoading(false);
      return;
    }

    if (zipAbortRef.current) zipAbortRef.current.abort();
    const controller = new AbortController();
    zipAbortRef.current = controller;

    if (!rateLimiter.current.canProceed()) {
      setZipResults([]);
      setZipLoading(false);
      setRateLimited(true);
      return;
    }
    setRateLimited(false);

    setZipLoading(true);
    setZipResults([]);

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
            setZipLoading(false);
            return;
          }
          const city = place['place name'] || '';
          const state = place['state'] || '';
          const stateAbbr = (place['state abbreviation'] && place['state abbreviation'].toLowerCase()) || '';
          zipCache.current[trimmed] = { city, state, stateAbbr };
          setZipResults(matchZipToItems(city, state, stateAbbr, shuffledData, filter));
          setZipLoading(false);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            zipCache.current[trimmed] = null;
            setZipResults([]);
            setZipLoading(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, shuffledData, filter, matchZipToItems]);

  const allLicenses = useMemo(() => {
    const set = new Set(csvData.map((d) => d.license));
    return ['All', ...Array.from(set).sort()];
  }, [csvData]);

  // Full pool of suggestion candidates for the current filter:
  // - filter === 'All': use whatever the geo/popular effect produced (curated)
  // - filter === <license>: pull every item of that license from the full
  //   dataset, sorted with geo preference first, then alphabetical. This is
  //   what fixes "I pick CG and see zero results" — the 12-item curated cache
  //   rarely contained items of every license.
  const filteredPool = useMemo(() => {
    // Curated popular-locations override: only honor when the user hasn't
    // narrowed by license (otherwise we'd be hiding hundreds of valid matches).
    if (filter === 'All' && suggestedItems.length > 0) return suggestedItems;

    const pool =
      filter === 'All' ? shuffledData : shuffledData.filter((d) => d.license === filter);
    if (pool.length === 0) return [];

    // No geo signal → return the shuffled order as-is so users see variety.
    const city = userGeoCity.toLowerCase();
    const state = userGeoState.toLowerCase();
    if (!city && !state) return pool;

    // Stable sort: items tied on geo-match level keep their shuffled order.
    return [...pool].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aCity = city && aName.includes(city) ? 1 : 0;
      const bCity = city && bName.includes(city) ? 1 : 0;
      if (aCity !== bCity) return bCity - aCity;
      const aState = state && aName.includes(state) ? 1 : 0;
      const bState = state && bName.includes(state) ? 1 : 0;
      if (aState !== bState) return bState - aState;
      return 0;
    });
  }, [shuffledData, filter, suggestedItems, userGeoCity, userGeoState]);

  // Shared pagination counter for both suggestions and search results. Reset
  // any time the inputs change so the user starts at the top of a fresh list.
  const [shownCount, setShownCount] = useState(maxResults);
  useEffect(() => {
    setShownCount(maxResults);
  }, [filter, query, maxResults]);

  const displayedSuggested = useMemo(
    () => filteredPool.slice(0, shownCount),
    [filteredPool, shownCount],
  );
  const hasMoreSuggestions = filteredPool.length > displayedSuggested.length;

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    if (isZipCode(query.trim())) return zipResults;
    const q = query.toLowerCase().trim();
    // 2-char queries are almost always a state abbreviation. Restrict to
    // exact slug-suffix matches so "UT" doesn't sweep in "Authority", "South…",
    // or Connecticut (whose name contains "ut").
    const isStateAbbrQuery = q.length === 2;
    return shuffledData.filter((d) => {
      if (filter !== 'All' && d.license !== filter) return false;
      const slugParts = d.slug.split('-');
      const stateAbbr =
        slugParts[slugParts.length - 1] && slugParts[slugParts.length - 1].toLowerCase();
      if (isStateAbbrQuery) {
        return stateAbbr === q;
      }
      if (d.name.toLowerCase().includes(q)) return true;
      if (stateAbbr && stateAbbr.length === 2) {
        const fullState = US_STATES[stateAbbr];
        if (fullState === q) return true;
      }
      return false;
    });
  }, [query, filter, shuffledData, zipResults]);

  const displayedFiltered = useMemo(
    () => filtered.slice(0, shownCount),
    [filtered, shownCount],
  );
  const hasMoreFiltered = filtered.length > displayedFiltered.length;

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
        trackSearch(query, filter, zipResults.length);
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
  }, [query, filter, csvData, trackSearch, zipResults.length]);

  const sortItems = useCallback(
    (items) => {
      if (sortMode !== 'nearby') return items;
      const city = userGeoCity.toLowerCase();
      const state = userGeoState.toLowerCase();
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
    [sortMode, userGeoCity, userGeoState],
  );

  const hasGeo = !!(userGeoCity || userGeoState);

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
        (displayedSuggested.length > 0 || filtered.length > 0) && (
          <>
            <div className="sj-sort-row">
              {(['default', 'nearby']).map((mode) => {
                const active = sortMode === mode;
                const iconColor = active ? '#ffffff' : '#5924b0';
                const isNearby = mode === 'nearby';
                const isRequesting = isNearby && geoStatus === 'requesting';
                return (
                  <button
                    key={mode}
                    type="button"
                    className={`sj-sort-btn${active ? ' is-active' : ''}`}
                    disabled={isRequesting}
                    onClick={() => {
                      if (isNearby && geoStatus !== 'granted') {
                        // First-time click on "Nearby": fire the permission
                        // prompt + lookup. We'll flip sortMode after success.
                        requestGeo();
                      }
                      setSortMode(mode);
                    }}
                  >
                    {isNearby && (
                      <span style={{ marginRight: 4, display: 'inline-flex' }}>
                        <PinIcon color={iconColor} />
                      </span>
                    )}
                    {mode === 'default'
                      ? 'Default'
                      : isRequesting
                        ? 'Locating…'
                        : 'Nearby'}
                  </button>
                );
              })}
            </div>
            {sortMode === 'nearby' && geoStatus === 'denied' && (
              <div className="sj-status sj-status--inline">
                Location unavailable.{' '}
                {!hasCookieConsent()
                  ? 'Accept cookies to enable location-based sorting.'
                  : 'Allow location access in your browser to enable nearby sorting.'}
              </div>
            )}
          </>
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
          {hasMoreSuggestions && (
            <button
              type="button"
              className="sj-load-more"
              onClick={() => setShownCount((c) => c + maxResults)}
            >
              Load more
            </button>
          )}
        </>
      )}

      {displayedFiltered.length > 0 && (
        <>
          <div className="sj-results">
            {sortItems(displayedFiltered).map((item, i) => (
              <ItemCard key={i} item={item} isDark={isDark} onClickTrack={trackClick} />
            ))}
          </div>
          {hasMoreFiltered && (
            <button
              type="button"
              className="sj-load-more"
              onClick={() => setShownCount((c) => c + maxResults)}
            >
              Load more
            </button>
          )}
        </>
      )}
    </div>
  );
}
