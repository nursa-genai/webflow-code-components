import { declareComponent } from '@webflow/react';
import { props } from '@webflow/data-types';
import SearchJobs from './SearchJobs';

export default declareComponent(SearchJobs, {
  name: 'Search Jobs Component',
  description:
    'Searchable list of PRN job locations grouped by license. Data is bundled into a single JSON file served from jsDelivr (rebuilt from CSVs in public/searchjobs-csv/ via the update-searchjobs skill).',
  group: 'Analytics',
  props: {
    title: props.Text({
      name: 'Title',
      defaultValue: 'Find Locations',
    }),
    subtitle: props.Text({
      name: 'Subtitle',
      defaultValue:
        "Select your license and the location you want to work in, and we'll show you the best PRN jobs available nearby.",
    }),
    placeholder: props.Text({
      name: 'Placeholder',
      defaultValue: 'Search by city, state, or zip code...',
    }),
    maxResults: props.Number({
      name: 'Max Results',
      defaultValue: 26,
      min: 1,
      max: 100,
    }),
    variant: props.Variant({
      name: 'Theme',
      options: ['Light', 'Dark'],
      defaultValue: 'Light',
    }),
    showSuggestions: props.Boolean({
      name: 'Show Suggestions',
      defaultValue: true,
      trueLabel: 'Show',
      falseLabel: 'Hide',
      tooltip:
        'Show pre-search location cards based on geolocation or popular locations',
    }),
    trackingUrl: props.Text({
      name: 'Tracking URL',
      defaultValue: '',
      group: 'Analytics',
    }),
    popularLocations: props.Text({
      name: 'Popular Locations',
      defaultValue: '',
      tooltip:
        'Comma-separated URLs for fallback popular locations, e.g. /rn/salt-lake-city, /cna/denver',
      group: 'Data Sources',
    }),
    dataUrl: props.Text({
      name: 'Data URL (full)',
      defaultValue:
        'https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/searchjobs.min.json',
      tooltip:
        'Full minified dataset. Override to point at a staging branch or a local file during development.',
      group: 'Data Sources',
    }),
    dataFirstUrl: props.Text({
      name: 'Data URL (first paint)',
      defaultValue:
        'https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/searchjobs.first.min.json',
      tooltip:
        'Small priming file (~8 KB, all licenses represented) loaded first so the UI paints before the full file arrives.',
      group: 'Data Sources',
    }),
  },
});
