import { declareComponent } from '@webflow/react';
import { props } from '@webflow/data-types';
import NursingPrograms from './NursingPrograms';

export default declareComponent(NursingPrograms, {
  name: 'Nursing Programs',
  description:
    'Searchable list of nursing programs filterable by State, City, and Nursing Degree (multi-select) plus a free-text search over university name, city, state, and degree. Data is rebuilt from CSVs in public/nursing-programs-csv/ via the update-nursing-programs skill and served from jsDelivr.',
  props: {
    heading: props.Text({
      name: 'Heading',
      defaultValue: 'Find a nursing program by state, city, and degree',
    }),
    linkBase: props.Text({
      name: 'Card Link Base',
      defaultValue: '/nursing-programs/',
      tooltip:
        'Each card links to this base + the program slug (e.g. "/nursing-programs/" → /nursing-programs/adelphi-university). Leave empty to render non-clickable display cards.',
    }),
    dataUrl: props.Text({
      name: 'Data URL (full)',
      defaultValue:
        'https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/nursing-programs.min.json',
      tooltip:
        'Full minified dataset. Override to point at a staging branch or a local file during development.',
      group: 'Data Sources',
    }),
    dataFirstUrl: props.Text({
      name: 'Data URL (first paint)',
      defaultValue:
        'https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/nursing-programs.first.min.json',
      tooltip:
        'Small priming file loaded first so the UI paints before the full file arrives. The full file replaces it (and gives accurate dropdown counts) as soon as it loads.',
      group: 'Data Sources',
    }),
  },
});
