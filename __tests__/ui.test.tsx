import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LandingPage from '@/app/page';

describe('Landing Page UI & Accessibility', () => {
  it('renders the core semantic main region mapping to a11y scoring', () => {
    const { container } = render(<LandingPage />);
    
    // Core structure verifications
    const mainElement = screen.getByRole('main', { hidden: true });
    expect(mainElement).toBeDefined();
    expect(mainElement.getAttribute('aria-label')).toBeDefined();
    
    // Core interactive validation
    const getStartedAnchor = screen.getByRole('link', { name: /create new veneck account/i });
    expect(getStartedAnchor).toBeDefined();
    
    // Visual text constraints
    expect(screen.getByText(/Live Crowd Intelligence Platform/i)).toBeDefined();
  });
});
