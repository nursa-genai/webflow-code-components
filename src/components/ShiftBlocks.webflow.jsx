import { declareComponent } from '@webflow/react';
import { props } from '@webflow/data-types';
import ShiftBlocks from './ShiftBlocks';

export default declareComponent(ShiftBlocks, {
  name: 'Shift Blocks',
  description: 'Fetches and displays shift blocks from the Nursa API',
  props: {
    page: props.Number({
      name: 'Page',
      defaultValue: 0,
    }),
    limit: props.Number({
      name: 'Limit',
      defaultValue: 20,
    }),
    shiftLicense: props.Text({
      name: 'Shift License',
      defaultValue: '',
    }),
    specialty: props.Text({
      name: 'Specialty',
      defaultValue: '',
    }),
    facilityId: props.Text({
      name: 'Facility ID',
      defaultValue: '',
    }),
    state: props.Text({
      name: 'State',
      defaultValue: '',
    }),
    city: props.Text({
      name: 'City',
      defaultValue: '',
    }),
    fromDate: props.Text({
      name: 'From Date',
      defaultValue: '',
    }),
    toDate: props.Text({
      name: 'To Date',
      defaultValue: '',
    }),
    columns: props.Variant({
      name: 'Columns',
      defaultValue: '3',
      options: ['1', '2', '3', '4'],
    }),
    cardLayout: props.Variant({
      name: 'Card Layout',
      defaultValue: 'facility',
      options: ['stateCities', 'facility', 'specialtyCredentials'],
    }),
    loadMoreLabel: props.Text({
      name: 'Load More Button Text',
      defaultValue: '',
    }),
  },
});
