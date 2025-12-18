import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('React Package', () => {
  it('should be in jsdom environment', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  it('should render a basic component', () => {
    render(<div data-testid="test">Hello</div>);
    expect(screen.getByTestId('test')).toHaveTextContent('Hello');
  });
});
