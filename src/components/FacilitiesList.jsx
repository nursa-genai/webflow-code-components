import React, { useEffect, useMemo, useRef, useState } from 'react';
import './FacilitiesList.css';

const PAGE_SIZE = 20;

const FACILITIES_FULL_URL =
  'https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/facilities.min.json';
const FACILITIES_FIRST_URL =
  'https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/facilities.first.min.json';

const US_STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

function formatCity(citySlug, stateCode) {
  if (!citySlug) return '';
  const suffix = `-${String(stateCode || '').toLowerCase()}`;
  const bare = citySlug.endsWith(suffix)
    ? citySlug.slice(0, -suffix.length)
    : citySlug;
  return bare
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function readInitialParams() {
  if (typeof window === 'undefined') {
    return { states: new Set(), cities: new Set(), query: '', sort: 'az', visible: PAGE_SIZE };
  }
  const p = new URLSearchParams(window.location.search);
  const shownRaw = parseInt(p.get('shown') || '', 10);
  const visible =
    Number.isFinite(shownRaw) && shownRaw >= PAGE_SIZE
      ? Math.ceil(shownRaw / PAGE_SIZE) * PAGE_SIZE
      : PAGE_SIZE;
  return {
    states: new Set((p.get('states') || '').split(',').filter(Boolean)),
    cities: new Set((p.get('cities') || '').split(',').filter(Boolean)),
    query: p.get('q') || '',
    sort: p.get('sort') === 'za' ? 'za' : 'az',
    visible,
  };
}

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handle(e) {
      if (!ref.current) return;
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const inside = path.includes(ref.current) || ref.current.contains(e.target);
      if (!inside) onOutside();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onOutside]);
}

function Dropdown({ label, options, selected, onToggle, open, onOpen, onClose }) {
  const ref = useRef(null);
  const [innerQuery, setInnerQuery] = useState('');
  useClickOutside(ref, onClose);

  const filtered = useMemo(() => {
    const q = innerQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, innerQuery]);

  return (
    <div className={`fl-dropdown${open ? ' is-open' : ''}`} ref={ref}>
      <div
        className="fl-dropdown__toggle"
        onClick={() => (open ? onClose() : onOpen())}
      >
        <div className="fl-dropdown__toggle-label">{label}</div>
        <div className="fl-dropdown__arrow"></div>
      </div>
      <div className={`fl-dropdown__panel${open ? '' : ' is-hidden'}`}>
        <div className="fl-refinement__search">
          <input
            className="fl-input"
            type="search"
            placeholder="Search..."
            value={innerQuery}
            onChange={(e) => setInnerQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        <ul className="fl-refinement__list">
          {filtered.map((o) => {
            const checked = selected.has(o.value);
            return (
              <li
                key={o.value}
                className="fl-refinement__item"
                onClick={() => onToggle(o.value)}
              >
                <div className={`fl-checkbox${checked ? ' is-checked' : ''}`}></div>
                <div className="fl-refinement__label">{o.label}</div>
                <div className="fl-refinement__count">({o.count})</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function FacilitiesList({ heading = '' }) {
  const [facilities, setFacilities] = useState([]);
  const [visible, setVisible] = useState(() => readInitialParams().visible);
  const [status, setStatus] = useState('loading');

  const [selectedStates, setSelectedStates] = useState(() => readInitialParams().states);
  const [selectedCities, setSelectedCities] = useState(() => readInitialParams().cities);
  const [query, setQuery] = useState(() => readInitialParams().query);
  const [debouncedQuery, setDebouncedQuery] = useState(() => readInitialParams().query);
  const [sort, setSort] = useState(() => readInitialParams().sort);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams();
    if (selectedStates.size) p.set('states', [...selectedStates].join(','));
    if (selectedCities.size) p.set('cities', [...selectedCities].join(','));
    if (debouncedQuery.trim()) p.set('q', debouncedQuery.trim());
    if (sort && sort !== 'az') p.set('sort', sort);
    if (visible > PAGE_SIZE) p.set('shown', String(visible));
    const qs = p.toString();
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', next);
  }, [selectedStates, selectedCities, debouncedQuery, sort, visible]);

  const fullyLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const unpack = ({ k, r }) =>
      r
        .map((row) => Object.fromEntries(k.map((key, i) => [key, row[i]])))
        .map((f) => {
          if (!f.stateCode && typeof f.City === 'string') {
            const tail = f.City.split('-').pop();
            if (tail && tail.length === 2) f.stateCode = tail.toUpperCase();
          }
          return f;
        })
        .filter((f) => f.stateCode && US_STATES[f.stateCode]);

    const hasUrlFilters =
      selectedStates.size > 0 ||
      selectedCities.size > 0 ||
      debouncedQuery.trim().length > 0;

    const fullPromise = fetch(FACILITIES_FULL_URL)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        fullyLoadedRef.current = true;
        setFacilities(unpack(data));
        setStatus('ready');
      });

    if (!hasUrlFilters) {
      fetch(FACILITIES_FIRST_URL)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled || fullyLoadedRef.current) return;
          setFacilities(unpack(data));
          setStatus('ready');
        })
        .catch(() => {});
    }

    fullPromise.catch(() => {
      if (!cancelled) setStatus('error');
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        states: [...selectedStates].sort(),
        cities: [...selectedCities].sort(),
        q: debouncedQuery.trim(),
        sort,
      }),
    [selectedStates, selectedCities, debouncedQuery, sort]
  );
  const prevFiltersKeyRef = useRef(filtersKey);
  useEffect(() => {
    if (prevFiltersKeyRef.current === filtersKey) return;
    prevFiltersKeyRef.current = filtersKey;
    setVisible(PAGE_SIZE);
  }, [filtersKey]);

  const filteredByStateAndCity = useMemo(() => {
    return facilities.filter((f) => {
      if (selectedStates.size && !selectedStates.has(f.stateCode)) return false;
      if (selectedCities.size && !selectedCities.has(f.City)) return false;
      return true;
    });
  }, [facilities, selectedStates, selectedCities]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let result = filteredByStateAndCity;
    if (q) {
      result = result.filter((f) => {
        const name = (f.Name || '').toLowerCase();
        const city = formatCity(f.City, f.stateCode).toLowerCase();
        const stateName = (US_STATES[f.stateCode] || '').toLowerCase();
        return (
          name.includes(q) ||
          city.includes(q) ||
          f.stateCode.toLowerCase().includes(q) ||
          stateName.includes(q)
        );
      });
    }
    if (sort === 'az') result = [...result].sort((a, b) => a.Name.localeCompare(b.Name));
    else if (sort === 'za') result = [...result].sort((a, b) => b.Name.localeCompare(a.Name));
    return result;
  }, [filteredByStateAndCity, debouncedQuery, sort]);

  const stateOptions = useMemo(() => {
    const counts = new Map();
    const baseForStates = facilities.filter((f) =>
      selectedCities.size ? selectedCities.has(f.City) : true
    );
    for (const f of baseForStates) {
      counts.set(f.stateCode, (counts.get(f.stateCode) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([code, count]) => ({
        value: code,
        label: US_STATES[code] || code,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [facilities, selectedCities]);

  const cityOptions = useMemo(() => {
    const counts = new Map();
    const baseForCities = facilities.filter((f) =>
      selectedStates.size ? selectedStates.has(f.stateCode) : true
    );
    for (const f of baseForCities) {
      counts.set(f.City, (counts.get(f.City) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([citySlug, count]) => {
        const stateCode = citySlug.slice(-2).toUpperCase();
        return {
          value: citySlug,
          label: `${formatCity(citySlug, stateCode)}, ${stateCode}`,
          count,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [facilities, selectedStates]);

  const toggleSetValue = (setSet) => (value) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const clearAll = () => {
    setSelectedStates(new Set());
    setSelectedCities(new Set());
    setQuery('');
    setDebouncedQuery('');
  };

  const hasRefinements = selectedStates.size > 0 || selectedCities.size > 0 || query.trim();

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const showEmptyState = status === 'ready' && shown.length === 0;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('empty-state');
    if (!el) return;
    el.classList.toggle('display-none', !showEmptyState);
    return () => {
      el.classList.add('display-none');
    };
  }, [showEmptyState]);

  return (
    <div className="fl-root">
      <section className="fl-hero">
        <div className="fl-hero__inner">
          {heading && <h1 className="fl-heading">{heading}</h1>}
          <div className="fl-dropdown-row">
            <Dropdown
              label="State"
              options={stateOptions}
              selected={selectedStates}
              onToggle={toggleSetValue(setSelectedStates)}
              open={openDropdown === 'state'}
              onOpen={() => setOpenDropdown('state')}
              onClose={() => setOpenDropdown((d) => (d === 'state' ? null : d))}
            />
            <Dropdown
              label="City"
              options={cityOptions}
              selected={selectedCities}
              onToggle={toggleSetValue(setSelectedCities)}
              open={openDropdown === 'city'}
              onOpen={() => setOpenDropdown('city')}
              onClose={() => setOpenDropdown((d) => (d === 'city' ? null : d))}
            />
          </div>
          <div className="fl-search-row">
            <div className="fl-search-row__header">
              <label className="fl-search-row__label">Search for anything</label>
              <button
                type="button"
                className="fl-clear-btn"
                disabled={!hasRefinements}
                onClick={clearAll}
              >
                {hasRefinements ? 'Clear Filters' : 'No Filters'}
              </button>
            </div>
            <input
              className="fl-input"
              type="search"
              placeholder="Search for Facility, City, State..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck="false"
              aria-label="Search"
            />
            <div className="fl-filter-header">
              <div className="fl-filter-header__label">Filtering by:</div>
              <select
                className="fl-sort-select"
                aria-label="Sort results by"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="az">Alphabetical A-Z</option>
                <option value="za">Alphabetical Z-A</option>
              </select>
              <div className="fl-current-refinements">
                <ul className="fl-tags">
                  {[...selectedStates].map((code) => (
                    <li key={`state-${code}`} className="fl-tag">
                      <span className="fl-tag__label">State:</span>
                      <span className="fl-tag__text">{US_STATES[code] || code}</span>
                      <button
                        type="button"
                        className="fl-tag__delete"
                        onClick={() => toggleSetValue(setSelectedStates)(code)}
                        aria-label={`Remove ${US_STATES[code] || code} filter`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                  {[...selectedCities].map((slug) => {
                    const code = slug.slice(-2).toUpperCase();
                    const label = `${formatCity(slug, code)}, ${code}`;
                    return (
                      <li key={`city-${slug}`} className="fl-tag">
                        <span className="fl-tag__label">City:</span>
                        <span className="fl-tag__text">{label}</span>
                        <button
                          type="button"
                          className="fl-tag__delete"
                          onClick={() => toggleSetValue(setSelectedCities)(slug)}
                          aria-label={`Remove ${label} filter`}
                        >
                          ✕
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fl-container">
        {status === 'loading' && <div className="fl-status">Loading…</div>}
        {status === 'error' && <div className="fl-status">Failed to load facilities.</div>}
        {status === 'ready' && (
          <>
            <div className="fl-grid">
              {shown.map((f) => (
                <a
                  key={f.Slug}
                  className="fl-card"
                  href={`/facilities/${f.Slug}`}
                >
                  <h4 className="fl-card__name">{f.Name}</h4>
                  <p className="fl-card__location">
                    {formatCity(f.City, f.stateCode)}, {f.stateCode}
                  </p>
                </a>
              ))}
            </div>
            {hasMore && (
              <button
                type="button"
                className="fl-load-more"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Show more results
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
