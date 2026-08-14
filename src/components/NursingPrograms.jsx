import React, { useEffect, useMemo, useRef, useState } from 'react';
import './NursingPrograms.css';

const PAGE_SIZE = 18;

const PROGRAMS_FULL_URL =
  'https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/nursing-programs.min.json';
const PROGRAMS_FIRST_URL =
  'https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/nursing-programs.first.min.json';
const PROGRAMS_IMAGES_URL =
  'https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/nursing-programs.images.min.json';

// The source images are full-size Webflow CMS assets — ~420 KB each, with no
// responsive variants generated. Rendering them raw would cost several MB for a
// single screen of cards, so every URL goes through a resizing transform first.
//
//   proxy   — third-party resizer. Only "wsrv" is wired up; it is a free service
//             with no SLA, so treat it as a prototype/staging default and switch
//             to a paid resizer (Cloudinary/imgix/Bunny) before relying on it.
//   webflow — append Webflow's own "-p-500" responsive variant suffix. Zero
//             third-party dependency, but 403s unless the variants actually
//             exist for the asset (bulk-imported assets do not have them).
//   direct  — original URL, unresized. Correct only for already-small images.
function buildThumbUrl(url, mode, width) {
  if (!url) return '';
  if (mode === 'direct') return url;
  if (mode === 'webflow') {
    const dot = url.lastIndexOf('.');
    if (dot === -1) return url;
    return `${url.slice(0, dot)}-p-${width}${url.slice(dot)}`;
  }
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&fit=cover&output=webp&q=80`;
}

// Curated display names for the known degree slugs. Anything not listed falls
// back to slugToTitle() so new degree types still render sensibly.
const DEGREE_LABELS = {
  'bachelor-of-science-nursing': 'Bachelor of Science in Nursing',
  'master-of-science-nursing': 'Master of Science in Nursing',
  'doctor-of-nursing': 'Doctor of Nursing',
  'post-graduate-aprn': 'Post-Graduate APRN',
  'nurse-practitioner-residency': 'Nurse Practitioner Residency',
  'employee-based-entry-to-practice-residency':
    'Employee-Based Entry-to-Practice Residency',
  'federally-funded-traineeship-residency':
    'Federally Funded Traineeship Residency',
};

function slugToTitle(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function degreeLabel(slug) {
  return DEGREE_LABELS[slug] || slugToTitle(slug);
}

function stateLabel(slug) {
  return slugToTitle(slug);
}

// City slugs look like "akron-oh" — the trailing 2-char segment is the state
// abbreviation. Strip it, title-case the rest, and append ", OH".
function cityStateCode(citySlug) {
  if (!citySlug) return '';
  const parts = citySlug.split('-');
  const tail = parts[parts.length - 1];
  return tail && tail.length === 2 ? tail.toUpperCase() : '';
}

function formatCity(citySlug) {
  if (!citySlug) return '';
  const code = cityStateCode(citySlug);
  const suffix = code ? `-${code.toLowerCase()}` : '';
  const bare =
    suffix && citySlug.endsWith(suffix)
      ? citySlug.slice(0, -suffix.length)
      : citySlug;
  const name = bare
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return code ? `${name}, ${code}` : name;
}

function readInitialParams() {
  if (typeof window === 'undefined') {
    return {
      states: new Set(),
      cities: new Set(),
      degrees: new Set(),
      query: '',
      sort: '',
      visible: PAGE_SIZE,
    };
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
    degrees: new Set((p.get('degrees') || '').split(',').filter(Boolean)),
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
    <div className={`np-dropdown${open ? ' is-open' : ''}`} ref={ref}>
      <div
        className="np-dropdown__toggle"
        onClick={() => (open ? onClose() : onOpen())}
      >
        <div className="np-dropdown__toggle-label">
          {label}
          {selected.size > 0 ? ` (${selected.size})` : ''}
        </div>
        <div className="np-dropdown__arrow"></div>
      </div>
      <div className={`np-dropdown__panel${open ? '' : ' is-hidden'}`}>
        <div className="np-refinement__search">
          <input
            className="np-input"
            type="search"
            placeholder="Search..."
            value={innerQuery}
            onChange={(e) => setInnerQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        <ul className="np-refinement__list">
          {filtered.map((o) => {
            const checked = selected.has(o.value);
            return (
              <li
                key={o.value}
                className="np-refinement__item"
                onClick={() => onToggle(o.value)}
              >
                <div className={`np-checkbox${checked ? ' is-checked' : ''}`}></div>
                <div className="np-refinement__label">{o.label}</div>
                <div className="np-refinement__count">({o.count})</div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="np-refinement__item np-refinement__item--empty">
              No matches
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default function NursingPrograms({
  heading = '',
  linkBase = '/nursing-programs/',
  dataUrl = PROGRAMS_FULL_URL,
  dataFirstUrl = PROGRAMS_FIRST_URL,
  showImages = true,
  imageMode = 'proxy',
  imagesUrl = PROGRAMS_IMAGES_URL,
}) {
  const [programs, setPrograms] = useState([]);
  const [imagesBySlug, setImagesBySlug] = useState(null);
  const [imagesFailed, setImagesFailed] = useState(false);
  const [visible, setVisible] = useState(() => readInitialParams().visible);
  const [status, setStatus] = useState('loading');

  const [selectedStates, setSelectedStates] = useState(() => readInitialParams().states);
  const [selectedCities, setSelectedCities] = useState(() => readInitialParams().cities);
  const [selectedDegrees, setSelectedDegrees] = useState(() => readInitialParams().degrees);
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
    if (selectedDegrees.size) p.set('degrees', [...selectedDegrees].join(','));
    if (debouncedQuery.trim()) p.set('q', debouncedQuery.trim());
    if (sort === 'za') p.set('sort', sort);
    if (visible > PAGE_SIZE) p.set('shown', String(visible));
    const qs = p.toString();
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', next);
  }, [selectedStates, selectedCities, selectedDegrees, debouncedQuery, sort, visible]);

  const fullyLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const unpack = ({ k, r }) =>
      r
        .map((row) => Object.fromEntries(k.map((key, i) => [key, row[i]])))
        .map((p) => ({
          name: p.name || '',
          slug: p.slug || '',
          city: p.city || '',
          state: p.state || '',
          degrees: Array.isArray(p.degrees) ? p.degrees : [],
        }))
        .filter((p) => p.name && p.slug);

    const hasUrlFilters =
      selectedStates.size > 0 ||
      selectedCities.size > 0 ||
      selectedDegrees.size > 0 ||
      debouncedQuery.trim().length > 0;

    const fullPromise = fetch(dataUrl)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        fullyLoadedRef.current = true;
        setPrograms(unpack(data));
        setStatus('ready');
      });

    if (!hasUrlFilters && dataFirstUrl) {
      fetch(dataFirstUrl)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled || fullyLoadedRef.current) return;
          setPrograms(unpack(data));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl, dataFirstUrl]);

  // Images live in their own file so the card text paints without waiting on
  // ~270 KB of URL hashes. A failure here is silent by design: the list is
  // fully usable without thumbnails.
  useEffect(() => {
    if (!showImages || !imagesUrl) {
      setImagesBySlug(null);
      return undefined;
    }
    let cancelled = false;
    setImagesFailed(false);
    fetch(imagesUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ k, r }) => {
        if (cancelled) return;
        const slugIdx = k.indexOf('slug');
        const imageIdx = k.indexOf('image');
        const altIdx = k.indexOf('imageAlt');
        const map = new Map();
        for (const row of r) {
          if (!row[slugIdx] || !row[imageIdx]) continue;
          map.set(row[slugIdx], { url: row[imageIdx], alt: altIdx === -1 ? '' : row[altIdx] || '' });
        }
        setImagesBySlug(map);
      })
      // Collapse the placeholder tiles rather than leaving every card with an
      // empty box the images will never fill.
      .catch(() => {
        if (!cancelled) setImagesFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [showImages, imagesUrl]);

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        states: [...selectedStates].sort(),
        cities: [...selectedCities].sort(),
        degrees: [...selectedDegrees].sort(),
        q: debouncedQuery.trim(),
        sort,
      }),
    [selectedStates, selectedCities, selectedDegrees, debouncedQuery, sort]
  );
  const prevFiltersKeyRef = useRef(filtersKey);
  useEffect(() => {
    if (prevFiltersKeyRef.current === filtersKey) return;
    prevFiltersKeyRef.current = filtersKey;
    setVisible(PAGE_SIZE);
  }, [filtersKey]);

  // Per-dimension predicates so option counts can cross-filter (a state's count
  // reflects the currently selected cities + degrees, and so on).
  const matchesStates = (p) => !selectedStates.size || selectedStates.has(p.state);
  const matchesCities = (p) => !selectedCities.size || selectedCities.has(p.city);
  const matchesDegrees = (p) =>
    !selectedDegrees.size || p.degrees.some((d) => selectedDegrees.has(d));

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let result = programs.filter(
      (p) => matchesStates(p) && matchesCities(p) && matchesDegrees(p)
    );
    if (q) {
      result = result.filter((p) => {
        if ((p.name || '').toLowerCase().includes(q)) return true;
        if (formatCity(p.city).toLowerCase().includes(q)) return true;
        if (stateLabel(p.state).toLowerCase().includes(q)) return true;
        if ((p.state || '').includes(q)) return true;
        if (p.degrees.some((d) => degreeLabel(d).toLowerCase().includes(q))) return true;
        return false;
      });
    }
    if (sort === 'za') result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    else result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programs, selectedStates, selectedCities, selectedDegrees, debouncedQuery, sort]);

  const stateOptions = useMemo(() => {
    const counts = new Map();
    for (const p of programs) {
      if (!p.state) continue;
      if (!matchesCities(p) || !matchesDegrees(p)) continue;
      counts.set(p.state, (counts.get(p.state) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: stateLabel(value), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programs, selectedCities, selectedDegrees]);

  const cityOptions = useMemo(() => {
    const counts = new Map();
    for (const p of programs) {
      if (!p.city) continue;
      if (!matchesStates(p) || !matchesDegrees(p)) continue;
      counts.set(p.city, (counts.get(p.city) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: formatCity(value), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programs, selectedStates, selectedDegrees]);

  const degreeOptions = useMemo(() => {
    const counts = new Map();
    for (const p of programs) {
      if (!matchesStates(p) || !matchesCities(p)) continue;
      for (const d of p.degrees) {
        counts.set(d, (counts.get(d) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: degreeLabel(value), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programs, selectedStates, selectedCities]);

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
    setSelectedDegrees(new Set());
    setQuery('');
    setDebouncedQuery('');
  };

  const hasRefinements =
    selectedStates.size > 0 ||
    selectedCities.size > 0 ||
    selectedDegrees.size > 0 ||
    query.trim();

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const showEmptyState = status === 'ready' && shown.length === 0;

  const buildHref = (slug) => {
    const base = linkBase || '';
    if (!base) return undefined;
    return `${base.replace(/\/+$/, '')}/${slug}`;
  };

  return (
    <div className="np-root">
      <section className="np-hero">
        <div className="np-hero__inner">
          {heading && <h1 className="np-heading">{heading}</h1>}
          <div className="np-dropdown-row">
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
            <Dropdown
              label="Nursing Degree"
              options={degreeOptions}
              selected={selectedDegrees}
              onToggle={toggleSetValue(setSelectedDegrees)}
              open={openDropdown === 'degree'}
              onOpen={() => setOpenDropdown('degree')}
              onClose={() => setOpenDropdown((d) => (d === 'degree' ? null : d))}
            />
          </div>
          <div className="np-search-row">
            <div className="np-search-row__header">
              <label className="np-search-row__label">Search for anything</label>
              <button
                type="button"
                className="np-clear-btn"
                disabled={!hasRefinements}
                onClick={clearAll}
              >
                {hasRefinements ? 'Clear Filters' : 'No Filters'}
              </button>
            </div>
            <input
              className="np-input"
              type="search"
              placeholder="Search for University, City, State, or Degree..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck="false"
              aria-label="Search"
            />
            <div className="np-filter-header">
              <div className="np-filter-header__label">Filtering by:</div>
              <select
                className="np-sort-select"
                aria-label="Sort results by"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="az">Alphabetical A-Z</option>
                <option value="za">Alphabetical Z-A</option>
              </select>
              <div className="np-current-refinements">
                <ul className="np-tags">
                  {[...selectedStates].map((slug) => (
                    <li key={`state-${slug}`} className="np-tag">
                      <span className="np-tag__label">State:</span>
                      <span className="np-tag__text">{stateLabel(slug)}</span>
                      <button
                        type="button"
                        className="np-tag__delete"
                        onClick={() => toggleSetValue(setSelectedStates)(slug)}
                        aria-label={`Remove ${stateLabel(slug)} filter`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                  {[...selectedCities].map((slug) => (
                    <li key={`city-${slug}`} className="np-tag">
                      <span className="np-tag__label">City:</span>
                      <span className="np-tag__text">{formatCity(slug)}</span>
                      <button
                        type="button"
                        className="np-tag__delete"
                        onClick={() => toggleSetValue(setSelectedCities)(slug)}
                        aria-label={`Remove ${formatCity(slug)} filter`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                  {[...selectedDegrees].map((slug) => (
                    <li key={`degree-${slug}`} className="np-tag">
                      <span className="np-tag__label">Degree:</span>
                      <span className="np-tag__text">{degreeLabel(slug)}</span>
                      <button
                        type="button"
                        className="np-tag__delete"
                        onClick={() => toggleSetValue(setSelectedDegrees)(slug)}
                        aria-label={`Remove ${degreeLabel(slug)} filter`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="np-container">
        {status === 'loading' && <div className="np-status">Loading…</div>}
        {status === 'error' && <div className="np-status">Failed to load nursing programs.</div>}
        {status === 'ready' && (
          <>
            <div className="np-grid">
              {shown.map((p) => {
                const href = buildHref(p.slug);
                // City already carries the state abbreviation (e.g. "Akron, OH"),
                // so prefer it; fall back to the full state name when city is blank.
                const location = formatCity(p.city) || stateLabel(p.state);
                const media = imagesBySlug && imagesBySlug.get(p.slug);
                const inner = (
                  <>
                    {showImages && !imagesFailed && (
                      <div className="np-card__media">
                        {media && (
                          <img
                            className="np-card__img"
                            src={buildThumbUrl(media.url, imageMode, 500)}
                            srcSet={
                              imageMode === 'proxy'
                                ? `${buildThumbUrl(media.url, imageMode, 500)} 500w, ${buildThumbUrl(
                                    media.url,
                                    imageMode,
                                    800,
                                  )} 800w`
                                : undefined
                            }
                            sizes="(max-width: 640px) 100vw, 320px"
                            alt={media.alt || p.name}
                            loading="lazy"
                            decoding="async"
                            // Degrade to the plain placeholder tile rather than a
                            // broken-image icon if the resizer is unreachable.
                            onError={(e) => {
                              const wrap = e.currentTarget.parentElement;
                              if (wrap) wrap.classList.add('is-failed');
                            }}
                          />
                        )}
                      </div>
                    )}
                    <h4 className="np-card__name">{p.name}</h4>
                    {location && <p className="np-card__location">{location}</p>}
                    {p.degrees.length > 0 && (
                      <div className="np-card__badges">
                        {p.degrees.map((d) => (
                          <span key={d} className="np-card__badge">
                            {degreeLabel(d)}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                );
                return href ? (
                  <a key={p.slug} className="np-card" href={href}>
                    {inner}
                  </a>
                ) : (
                  <div key={p.slug} className="np-card np-card--static">
                    {inner}
                  </div>
                );
              })}
              {showEmptyState && (
                <div className="np-empty">No programs match your filters.</div>
              )}
            </div>
            {hasMore && (
              <button
                type="button"
                className="np-load-more"
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
