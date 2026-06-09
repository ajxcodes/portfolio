import React from 'react';
import { render } from '@testing-library/react';
import * as Icons from '../icons';

describe('Icons Component', () => {
  it('renders all exported icon components without throwing errors', () => {
    const iconKeys = Object.keys(Icons) as Array<keyof typeof Icons>;
    
    iconKeys.forEach((key) => {
      const IconComponent = Icons[key];
      const { container } = render(<IconComponent data-testid={key} className="h-6 w-6" />);
      
      const svgEl = container.querySelector('svg');
      expect(svgEl).toBeInTheDocument();
      expect(svgEl).toHaveClass('h-6 w-6');
    });
  });
});
