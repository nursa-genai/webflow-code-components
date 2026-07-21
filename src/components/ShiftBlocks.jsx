import React, { useEffect, useMemo, useState } from 'react';
import './ShiftBlocks.css';

const API_BASE = 'https://backend.prod.nursa.com/webflow/api';
const SHIFT_BLOCKS_PATH = '/shifts/shift-blocks';

const LICENSE_FULL_NAME = {
  RN: 'Registered Nurse',
  LPN: 'Licensed Practical Nurse',
  LVN: 'Licensed Vocational Nurse',
  CNA: 'Certified Nursing Assistant',
  CMA: 'Certified Medication Aide',
  STNA: 'State Tested Nursing Assistant',
  QMAP: 'Qualified Medication Administration Person',
  NP: 'Nurse Practitioner',
  RT: 'Respiratory Therapist',
};

const STATE_FULL_BY_ABBR = {
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

const STATE_SLUG_BY_ABBR = {
  AL: 'alabama', AK: 'alaska', AZ: 'arizona', AR: 'arkansas', CA: 'california',
  CO: 'colorado', CT: 'connecticut', DE: 'delaware', DC: 'district-of-columbia',
  FL: 'florida', GA: 'georgia', HI: 'hawaii', ID: 'idaho', IL: 'illinois',
  IN: 'indiana', IA: 'iowa', KS: 'kansas', KY: 'kentucky', LA: 'louisiana',
  ME: 'maine', MD: 'maryland', MA: 'massachusetts', MI: 'michigan', MN: 'minnesota',
  MS: 'mississippi', MO: 'missouri', MT: 'montana', NE: 'nebraska', NV: 'nevada',
  NH: 'new-hampshire', NJ: 'new-jersey', NM: 'new-mexico', NY: 'new-york',
  NC: 'north-carolina', ND: 'north-dakota', OH: 'ohio', OK: 'oklahoma', OR: 'oregon',
  PA: 'pennsylvania', RI: 'rhode-island', SC: 'south-carolina', SD: 'south-dakota',
  TN: 'tennessee', TX: 'texas', UT: 'utah', VT: 'vermont', VA: 'virginia',
  WA: 'washington', WV: 'west-virginia', WI: 'wisconsin', WY: 'wyoming',
};

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildShiftSlug(block) {
  const license = block.requiredLicense || '';
  const specialties = (block.facility && block.facility.specialties) || [];
  const city = (block.location && block.location.city) || '';
  const stateAbbr = (block.location && block.location.state) || '';
  const facilityName = (block.facility && block.facility.name) || '';
  const shiftId = Array.isArray(block.shiftIds) ? block.shiftIds[0] || '' : '';

  const stateSlug = STATE_SLUG_BY_ABBR[stateAbbr] || slugify(stateAbbr);
  const specialtySlug = specialties.length ? slugify(specialties.join(' ')) : '';

  const shiftIdSegment = shiftId ? `si-${String(shiftId).toLowerCase()}` : '';

  return [
    slugify(license),
    specialtySlug,
    slugify(city),
    stateSlug,
    slugify(facilityName),
    shiftIdSegment,
  ]
    .filter(Boolean)
    .join('-');
}

function formatDateRange(range) {
  if (!range || !range.start) return '';
  const opts = { month: 'short', day: 'numeric' };
  const start = new Date(range.start);
  const startStr = isNaN(start) ? range.start : start.toLocaleDateString(undefined, opts);
  if (!range.end || range.end === range.start) return startStr;
  const end = new Date(range.end);
  const endStr = isNaN(end) ? range.end : end.toLocaleDateString(undefined, opts);
  return `${startStr} – ${endStr}`;
}

function formatLongDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatHourlyRate(rate) {
  if (!rate) return '';
  const value = typeof rate.min === 'number' ? rate.min : rate.max;
  if (typeof value !== 'number') return '';
  return `$${value.toFixed(2)}`;
}

function formatEstimatedTotal(value) {
  if (typeof value !== 'number') return '';
  return `$${value.toFixed(2)}`;
}

function formatHourlyRateRounded(rate) {
  if (!rate) return '';
  const value = typeof rate.min === 'number' ? rate.min : rate.max;
  if (typeof value !== 'number') return '';
  return `$${Math.round(value)}`;
}

function formatEstimatedTotalRounded(value) {
  if (typeof value !== 'number') return '';
  return `$${Math.round(value)}`;
}

function formatPayRange(rate) {
  if (!rate) return '';
  if (rate.min === rate.max) return `$${rate.min}/hr`;
  return `$${rate.min}–$${rate.max}/hr`;
}

const LOAD_MORE_LABEL = {
  default: 'Load more',
  compact: 'Load more',
  facility: 'Load more shifts',
  specialtyCredentials: 'Load jobs with this credential',
  stateCities: 'Load more cities',
};

// Accepts epoch milliseconds (e.g. "1782252000000"), a YYYY-MM-DD string, or any
// Date-parseable string. Returns epoch ms, or null if empty/invalid.
function parseDateMs(value) {
  if (value == null || value === '') return null;
  const str = String(value).trim();
  if (!str) return null;
  if (/^\d+$/.test(str)) return Number(str); // already epoch ms
  const ms = Date.parse(str);
  return Number.isNaN(ms) ? null : ms;
}

// Treats Webflow Variant strings ('on'/'off'), booleans, and empty values
// uniformly: only an explicit "on" (or boolean true) turns a filter on.
function isOn(value) {
  return value === true || value === 'on' || value === 'true';
}

function buildApiUrl({
  page,
  limit,
  shiftLicense,
  specialty,
  facilityId,
  state,
  city,
  fromDate,
  toDate,
  weekendsOnly,
  nightShifts,
}) {
  const params = new URLSearchParams();
  params.set('page', String(page ?? 0));
  params.set('limit', String(limit ?? 20));

  const searchQuery = [city, state].filter((v) => v && String(v).trim()).join(' ').trim();
  if (searchQuery) params.set('searchQuery', searchQuery);

  if (shiftLicense) params.append('shiftLicenses[]', shiftLicense);
  if (specialty) params.append('specialties[]', specialty);
  if (facilityId) params.append('facilityIds[]', facilityId);

  // Weekend = Sat(6) + Sun(7), ISO day numbering. Omitted entirely when off.
  if (isOn(weekendsOnly)) params.set('weekDays', '6,7');
  // Night shifts: NOC is the canonical night-family label. Omitted when off.
  if (isOn(nightShifts)) params.set('timePeriods', 'NOC');

  // Default lower bound: 2h from now (hides shifts already starting). A provided
  // fromDate prop overrides it so callers can target a specific window.
  const fromMs = parseDateMs(fromDate) ?? Date.now() + 2 * 60 * 60 * 1000;
  params.set('fromDate', String(fromMs));

  const toMs = parseDateMs(toDate);
  if (toMs != null) params.set('toDate', String(toMs));

  return `${API_BASE}${SHIFT_BLOCKS_PATH}?${params.toString()}`;
}

function ShiftCard({ block, layout }) {
  const href = `/jobs/shifts/${buildShiftSlug(block)}`;
  const facility = block.facility || {};
  const location = block.location || {};
  const details = block.shiftDetails || {};
  const specialties = facility.specialties || [];

  const dateRange = formatDateRange(details.dateRange);
  const payRange = formatPayRange(block.hourlyPayRate);
  const locationLabel = [location.city, location.state].filter(Boolean).join(', ');

  if (layout === 'specialtyCredentials') {
    const license = block.requiredLicense || '';
    const licenseFull = LICENSE_FULL_NAME[license] || '';
    const firstSpecialty = (specialties && specialties[0]) || '';
    const hourlyRateExact = formatHourlyRate(block.hourlyPayRate);
    const hourlyRateRounded = formatHourlyRateRounded(block.hourlyPayRate);
    const estTotalRounded = formatEstimatedTotalRounded(block.estimatedTotal);
    const longDate = formatLongDate(details.fromDateISO);
    const titleLeft = [licenseFull, license].filter(Boolean).join(' ');
    const titleLine1 = firstSpecialty ? `${titleLeft} – ${firstSpecialty}` : titleLeft;
    const titleLine2 = hourlyRateExact ? `${hourlyRateExact} per hour` : '';
    const facilityLine = [facility.name, [location.city, location.state].filter(Boolean).join(', ')]
      .filter(Boolean)
      .join(', ');
    const county = (location && (location.county || location.countyName)) || '';
    const countyLabel = county
      ? /county$/i.test(String(county).trim())
        ? county
        : `${county} County`
      : '';

    return (
      <a className="button-job sb-card sb-card--specCreds" href={href}>
        <div className="sb-fac__title">
          {titleLine1 && <span>{titleLine1}</span>}
          {titleLine2 && <span> {titleLine2}</span>}
        </div>
        <div className="sb-fac__divider" />
        <div className="sb-fac__row">
          <div className="sb-fac__when">
            {longDate && <div className="sb-fac__date">{longDate}</div>}
            {details.shiftTimes && (
              <div className="sb-fac__time">{details.shiftTimes}</div>
            )}
          </div>
          <div className="sb-fac__rates">
            {hourlyRateRounded && (
              <div className="sb-fac__rate">
                <span className="sb-fac__rate-amount">{hourlyRateRounded}</span>
                <span className="sb-fac__rate-unit">/hour</span>
              </div>
            )}
            {estTotalRounded && (
              <div className="sb-fac__total">
                <span className="sb-fac__total-amount">{estTotalRounded}</span>
                <span className="sb-fac__total-unit">/est. total</span>
              </div>
            )}
          </div>
        </div>
        {(facilityLine || countyLabel) && (
          <div className="sb-spc__where">
            {facilityLine && (
              <div className="sb-spc__facility">{facilityLine}</div>
            )}
            {countyLabel && (
              <div className="sb-spc__county">{countyLabel}</div>
            )}
          </div>
        )}
        <div className="sb-fac__actions">
          {license && <span className="sb-fac__license-pill">{license}</span>}
          <span className="sb-fac__cta">View Shift</span>
        </div>
      </a>
    );
  }

  if (layout === 'facility') {
    const license = block.requiredLicense || '';
    const licenseFull = LICENSE_FULL_NAME[license] || '';
    const firstSpecialty = (specialties && specialties[0]) || '';
    const hourlyRateExact = formatHourlyRate(block.hourlyPayRate);
    const hourlyRateRounded = formatHourlyRateRounded(block.hourlyPayRate);
    const estTotalRounded = formatEstimatedTotalRounded(block.estimatedTotal);
    const longDate = formatLongDate(details.fromDateISO);
    const titleLeft = [licenseFull, license].filter(Boolean).join(' ');
    const titleLine1 = firstSpecialty ? `${titleLeft} – ${firstSpecialty}` : titleLeft;
    const titleLine2 = hourlyRateExact ? `${hourlyRateExact} per hour` : '';

    return (
      <a className="button-job sb-card sb-card--facility" href={href}>
        <div className="sb-fac__title">
          {titleLine1 && <span>{titleLine1}</span>}
          {titleLine2 && <span> {titleLine2}</span>}
        </div>
        <div className="sb-fac__divider" />
        <div className="sb-fac__row">
          <div className="sb-fac__when">
            {longDate && <div className="sb-fac__date">{longDate}</div>}
            {details.shiftTimes && (
              <div className="sb-fac__time">{details.shiftTimes}</div>
            )}
          </div>
          <div className="sb-fac__rates">
            {hourlyRateRounded && (
              <div className="sb-fac__rate">
                <span className="sb-fac__rate-amount">{hourlyRateRounded}</span>
                <span className="sb-fac__rate-unit">/hour</span>
              </div>
            )}
            {estTotalRounded && (
              <div className="sb-fac__total">
                <span className="sb-fac__total-amount">{estTotalRounded}</span>
                <span className="sb-fac__total-unit">/est. total</span>
              </div>
            )}
          </div>
        </div>
        <div className="sb-fac__actions">
          {license && <span className="sb-fac__license-pill">{license}</span>}
          <span className="sb-fac__cta">View Shift</span>
        </div>
      </a>
    );
  }

  if (layout === 'stateCities') {
    const license = block.requiredLicense || '';
    const licenseFull = LICENSE_FULL_NAME[license] || '';
    const hourlyRate = formatHourlyRate(block.hourlyPayRate);
    const longDate = formatLongDate(details.fromDateISO);
    const stateFull = STATE_FULL_BY_ABBR[location.state] || location.state || '';
    const facilityLine = [facility.name, [location.city, location.state].filter(Boolean).join(', ')]
      .filter(Boolean)
      .join(', ');
    const cityStateLong = [location.city, stateFull].filter(Boolean).join(', ');
    const estTotal = formatEstimatedTotal(block.estimatedTotal);
    const titleParts = [licenseFull, license].filter(Boolean).join(' ');
    const title = hourlyRate ? `${titleParts} – ${hourlyRate} per hour` : titleParts;

    return (
      <div className='sb-card-wrapper sb-card--stateCitiesWrapper'>
        <a className="button-job sb-card sb-card--stateCities" href={href}>
          <div className="sb-state__title">{title}</div>
          <div className="sb-state__when">
            <div className="sb-state__date">{longDate}</div>
            {details.shiftTimes && (
              <div className="sb-state__time">{details.shiftTimes}</div>
            )}
          </div>
          <div className="sb-state__where">
            <div className="sb-state__facility">{facilityLine}</div>
            {cityStateLong && (
              <div className="sb-state__citystate">{cityStateLong}</div>
            )}
          </div>
          <div className="sb-state__pay">
            {hourlyRate && (
              <div className="sb-state__rate">
                <span className="sb-state__rate-amount">{hourlyRate}</span>
                <span className="sb-state__rate-unit">/hour</span>
              </div>
            )}
            {estTotal && (
              <div className="sb-state__total">{estTotal}<span className="sb-state__total-label"> est. total</span></div>
            )}
          </div>
        </a>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <a className="button-job sb-card sb-card--compact" href={href}>
        <div className="sb-card__compact-main">
          <h4 className="sb-card__name">{facility.name}</h4>
          <p className="sb-card__location">{locationLabel}</p>
          <p className="sb-card__meta">
            {dateRange}
            {details.shiftTimes ? ` · ${details.shiftTimes}` : ''}
          </p>
        </div>
        <div className="sb-card__compact-pay">
          <div className="sb-card__pay">{payRange}</div>
          {block.requiredLicense && (
            <div className="sb-card__license">{block.requiredLicense}</div>
          )}
        </div>
      </a>
    );
  }

  return (
    <a className="button-job sb-card" href={href}>
      {facility.image && (
        <div className="sb-card__image">
          <img src={facility.image} alt={facility.name || ''} loading="lazy" />
          {block.isLastMinute && (
            <span className="sb-card__badge sb-card__badge--urgent">Last minute</span>
          )}
        </div>
      )}
      <div className="sb-card__body">
        <div className="sb-card__header">
          <h4 className="sb-card__name">{facility.name}</h4>
          {block.requiredLicense && (
            <span className="sb-card__license">{block.requiredLicense}</span>
          )}
        </div>
        <p className="sb-card__location">{locationLabel}</p>
        {specialties.length > 0 && (
          <ul className="sb-card__tags">
            {specialties.slice(0, 3).map((s) => (
              <li key={s} className="sb-card__tag">{s}</li>
            ))}
          </ul>
        )}
        <div className="sb-card__details">
          {details.type && <span className="sb-card__detail">{details.type}</span>}
          {dateRange && <span className="sb-card__detail">{dateRange}</span>}
          {details.shiftTimes && <span className="sb-card__detail">{details.shiftTimes}</span>}
        </div>
        <div className="sb-card__footer">
          <div className="sb-card__pay">{payRange}</div>
          {typeof block.estimatedTotal === 'number' && (
            <div className="sb-card__total">Est. ${block.estimatedTotal}</div>
          )}
        </div>
      </div>
    </a>
  );
}

export default function ShiftBlocks({
  page = 0,
  limit = 100,
  shiftLicense = '',
  specialty = '',
  facilityId = '',
  state = '',
  city = '',
  columns = '3',
  cardLayout = 'default',
  loadMoreLabel = '',
  fromDate = '',
  toDate = '',
  weekendsOnly = '',
  nightShifts = '',
}) {
  const [blocks, setBlocks] = useState([]);
  const [status, setStatus] = useState('loading');
  const [currentPage, setCurrentPage] = useState(page);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(null);

  const filterKey = useMemo(
    () => JSON.stringify({ shiftLicense, specialty, facilityId, state, city, limit, page, fromDate, toDate, weekendsOnly, nightShifts }),
    [shiftLicense, specialty, facilityId, state, city, limit, page, fromDate, toDate, weekendsOnly, nightShifts]
  );

  useEffect(() => {
    setBlocks([]);
    setCurrentPage(page);
    setHasMore(false);
    setTotal(null);
    setStatus('loading');

    let cancelled = false;
    const url = buildApiUrl({ page, limit, shiftLicense, specialty, facilityId, state, city, fromDate, toDate, weekendsOnly, nightShifts });

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const next = Array.isArray(data && data.blocks) ? data.blocks : [];
        const totalCount =
          (data && (typeof data.total === 'number' ? data.total : null)) ??
          (data && data.pagination && typeof data.pagination.total === 'number'
            ? data.pagination.total
            : null);
        const more =
          typeof totalCount === 'number'
            ? next.length + page * limit < totalCount
            : next.length === limit;
        setBlocks(next);
        setTotal(totalCount);
        setHasMore(more);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    if (status === 'loading-more' || !hasMore) return;
    const nextPage = currentPage + 1;
    setStatus('loading-more');
    const url = buildApiUrl({
      page: nextPage,
      limit,
      shiftLicense,
      specialty,
      facilityId,
      state,
      city,
      fromDate,
      toDate,
      weekendsOnly,
      nightShifts,
    });

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const next = Array.isArray(data && data.blocks) ? data.blocks : [];
        const newBlocks = [...blocks, ...next];
        const more =
          typeof total === 'number'
            ? newBlocks.length < total
            : next.length === limit;
        setBlocks(newBlocks);
        setCurrentPage(nextPage);
        setHasMore(more);
        setStatus('ready');
      })
      .catch(() => {
        setStatus('ready');
        setHasMore(false);
      });
  };

  useEffect(() => {
    if (status === 'ready' && blocks.length === 0) {
      const el = document.querySelector('[data-notifyme-wrapper]');
      if (el) el.classList.remove('display-none');
    }
  }, [status, blocks.length]);

  const colCount = Math.max(1, Math.min(4, parseInt(columns, 10) || 3));

  return (
    <div
      className={`sb-root sb-root--cols-${colCount} sb-root--layout-${cardLayout}`}
    >
      {status === 'loading' && <div className="sb-status">Loading shifts…</div>}
      {status === 'error' && <div className="sb-status">Failed to load shifts.</div>}
      {status === 'ready' && blocks.length === 0 && (
        <div className="sb-status">No shifts available.</div>
      )}
      {blocks.length > 0 && (
        <>
          <div className="sb-grid">
            {blocks.map((block) => (
              <ShiftCard
                key={block.blockId}
                block={block}
                layout={cardLayout}
              />
            ))}
          </div>
          {hasMore && (
            <div className="sb-loadmore-wrap">
              <button
                type="button"
                className={`sb-loadmore sb-loadmore--${cardLayout}`}
                onClick={loadMore}
                disabled={status === 'loading-more'}
              >
                {status === 'loading-more'
                  ? 'Loading…'
                  : loadMoreLabel || LOAD_MORE_LABEL[cardLayout] || LOAD_MORE_LABEL.default}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
