import { declareComponent } from '@webflow/react';
import { props } from '@webflow/data-types';
import FacilitiesList from './FacilitiesList';

export default declareComponent(FacilitiesList, {
  name: 'Facilities List',
  description: 'Paginated list of facilities loaded from /facilities.min.json',
  props: {
    heading: props.Text({
      name: 'Heading',
      defaultValue:
        'Browse facilities to find shifts or claim and manage your facility profile',
    }),
  },
});
