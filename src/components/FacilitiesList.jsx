import React, { useEffect, useMemo, useRef, useState } from 'react';

const PAGE_SIZE = 20;

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
    return { states: new Set(), cities: new Set(), query: '', sort: 'az' };
  }
  const p = new URLSearchParams(window.location.search);
  return {
    states: new Set((p.get('states') || '').split(',').filter(Boolean)),
    cities: new Set((p.get('cities') || '').split(',').filter(Boolean)),
    query: p.get('q') || '',
    sort: p.get('sort') === 'za' ? 'za' : 'az',
  };
}

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
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
    <div className="custom-filter-dropdown" ref={ref}>
      <div
        className="custom-filter-dropdown-toggle"
        onClick={() => (open ? onClose() : onOpen())}
      >
        <div className="text-color-purple">{label}</div>
        <div className="arrow-purple w-icon-dropdown-toggle"></div>
      </div>
      <div className={`custom-filter-dropdown-list${open ? '' : ' hide-dropdown'}`}>
        <div className="ais-RefinementList">
          <div className="ais-RefinementList-searchBox">
            <div className="ais-SearchBox">
              <form
                role="search"
                className="ais-SearchBox-form"
                noValidate
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  className="ais-SearchBox-input"
                  type="search"
                  placeholder="Search..."
                  value={innerQuery}
                  onChange={(e) => setInnerQuery(e.target.value)}
                  autoComplete="off"
                  spellCheck="false"
                />
              </form>
            </div>
          </div>
          <ul className="ais-RefinementList-list">
            {filtered.map((o) => {
              const checked = selected.has(o.value);
              return (
                <li
                  key={o.value}
                  className={`ais-RefinementList-item${checked ? ' ais-RefinementList-item--selected' : ''}`}
                  onClick={() => onToggle(o.value)}
                >
                  <div>
                    <div className="dropdown-item-parent">
                      <div className={`algolia-checkbox${checked ? ' algolia-checkbox--checked' : ''}`}></div>
                      <div>{o.label}</div>
                      <div className="wf-refinmentlist-count">({o.count})</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function FacilitiesList({ heading = '' }) {
  const [facilities, setFacilities] = useState([]);
  const [visible, setVisible] = useState(PAGE_SIZE);
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
    const qs = p.toString();
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', next);
  }, [selectedStates, selectedCities, debouncedQuery, sort]);

  const fullyLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const unpack = ({ k, r }) =>
      r.map((row) => Object.fromEntries(k.map((key, i) => [key, row[i]])));

    const hasUrlFilters =
      selectedStates.size > 0 ||
      selectedCities.size > 0 ||
      debouncedQuery.trim().length > 0;

    const fullPromise = fetch('/facilities.min.json')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        fullyLoadedRef.current = true;
        setFacilities(unpack(data));
        setStatus('ready');
      });

    if (!hasUrlFilters) {
      fetch('/facilities.first.min.json')
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

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [selectedStates, selectedCities, debouncedQuery, sort]);

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

  return (
    <>
      <section className="section-filter-top relative algolia-hero-section">
        <div className="container">
          {heading && (
            <h1 className="heading-style-h2 is-centred text-color-white">{heading}</h1>
          )}
          <div className="w-layout-grid filter-grid facilities">
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
          <div className="modul search algolia-modul gap-1-rem">
            <div className="flex distribute-end-to-end">
              <label className="text-span custom-text-span">Search for anything</label>
              <a
                href="#"
                className="clear-refinements w-inline-block"
                onClick={(e) => {
                  e.preventDefault();
                  clearAll();
                }}
              >
                <div className="ais-ClearRefinements wf-clear-refinement-root">
                  <button
                    type="button"
                    className={`ais-ClearRefinements-button wf-clear-refinement-button${
                      hasRefinements ? '' : ' ais-ClearRefinements-button--disabled wf-clear-refinement-disabled'
                    }`}
                    disabled={!hasRefinements}
                  >
                    <span>{hasRefinements ? 'Clear Filters' : 'No Filters'}</span>
                  </button>
                </div>
              </a>
            </div>
            <div className="search-box">
              <div className="ais-SearchBox">
                <form
                  role="search"
                  className="ais-SearchBox-form"
                  noValidate
                  onSubmit={(e) => e.preventDefault()}
                >
                  <input
                    className="ais-SearchBox-input"
                    type="search"
                    placeholder="Search for Facility, City, State..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                    aria-label="Search"
                  />
                </form>
              </div>
            </div>
            <div className="filter-header-flex algolia-tags no-margin">
              <div className="algolia-filter-by">Filtering by:</div>
              <div className="sortby-wrapper">
                <div className="ais-SortBy MyCustomSortBy">
                  <select
                    className="ais-SortBy-select dropdown border"
                    aria-label="Sort results by"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="az">Alphabetical A-Z</option>
                    <option value="za">Alphabetical Z-A</option>
                  </select>
                </div>
              </div>
              <div id="current-filters" className="tags">
                <div
                  className={`ais-CurrentRefinements${
                    hasRefinements ? '' : ' ais-CurrentRefinements--noRefinement'
                  }`}
                >
                  <ul className="ais-CurrentRefinements-list wf-current-refinement-list">
                    {[...selectedStates].map((code) => (
                      <li
                        key={`state-${code}`}
                        className="ais-CurrentRefinements-item wf-current-refinement-item"
                      >
                        <span className="ais-CurrentRefinements-label wf-label">State: </span>
                        <span className="ais-CurrentRefinements-category filter-tag">
                          <span className="ais-CurrentRefinements-categoryLabel">
                            {US_STATES[code] || code}
                          </span>
                          <button
                            type="button"
                            className="ais-CurrentRefinements-delete wf-current-refinement-delete"
                            onClick={() => toggleSetValue(setSelectedStates)(code)}
                            aria-label={`Remove ${US_STATES[code] || code} filter`}
                          >
                            ✕
                          </button>
                        </span>
                      </li>
                    ))}
                    {[...selectedCities].map((slug) => {
                      const code = slug.slice(-2).toUpperCase();
                      const label = `${formatCity(slug, code)}, ${code}`;
                      return (
                        <li
                          key={`city-${slug}`}
                          className="ais-CurrentRefinements-item wf-current-refinement-item"
                        >
                          <span className="ais-CurrentRefinements-label wf-label">City: </span>
                          <span className="ais-CurrentRefinements-category filter-tag">
                            <span className="ais-CurrentRefinements-categoryLabel">{label}</span>
                            <button
                              type="button"
                              className="ais-CurrentRefinements-delete wf-current-refinement-delete"
                              onClick={() => toggleSetValue(setSelectedCities)(slug)}
                              aria-label={`Remove ${label} filter`}
                            >
                              ✕
                            </button>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className='fn-section larger-top-padding'>
      <div className="fn-container-2">
        {status === 'loading' && <div>Loading…</div>}
        {status === 'error' && <div>Failed to load facilities.</div>}
        {status === 'ready' && (
          <>
            <div className="facilities-list">
              {shown.map((f) => (
                <div key={f.Slug} className="facilities-item w-dyn-item">
                  <a
                    className="facility-link w-inline-block"
                    href={`/facilities/${f.Slug}`}
                  >
                    <h4 className="fn-h4-style text-purple margin-bot-xxs">{f.Name}</h4>
                    <p className="facility-info-wrapper no-gutter">
                      {formatCity(f.City, f.stateCode)}, {f.stateCode}
                    </p>
                  </a>
                </div>
              ))}
              {shown.length === 0 && (
                <div className="facilities-list__empty">No facilities match your filters.</div>
              )}
            </div>
            {hasMore && (
              <button
                type="button"
                className="facilities-search-load-more-button w-button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Show more
              </button>
            )}
          </>
        )}
      </div>
      </section>

    </>
  );
}
