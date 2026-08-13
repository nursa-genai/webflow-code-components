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
    showImages: props.Boolean({
      name: 'Show Card Images',
      defaultValue: true,
      tooltip:
        'Renders the university photo from the CMS on each card. Turn off to ship a text-only list and skip the image data fetch entirely.',
      group: 'Images',
    }),
    imageMode: props.Variant({
      name: 'Image Sizing Mode',
      options: ['proxy', 'webflow', 'direct'],
      defaultValue: 'proxy',
      tooltip:
        'How the full-size CMS image is shrunk for the card. "proxy" resizes via wsrv.nl (free, NO SLA — fine for staging, swap for a paid resizer before relying on it in production). "webflow" appends Webflow\'s own -p-500 variant suffix — no third party, but only works once those variants exist for the asset. "direct" serves the original ~420 KB file and will make this page very heavy.',
      group: 'Images',
    }),
    imagesUrl: props.Text({
      name: 'Image Data URL',
      defaultValue:
        'https://cdn.jsdelivr.net/gh/nursa-genai/webflow-code-components@master/public/nursing-programs.images.min.json',
      tooltip:
        'Slug-to-image-URL map, kept out of the main dataset because the URL hashes do not compress. Loaded after first paint; if it fails, cards simply render without photos.',
      group: 'Images',
    }),
  },
});
