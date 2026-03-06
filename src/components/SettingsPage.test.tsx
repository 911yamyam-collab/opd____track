import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SettingsPage from './SettingsPage';

describe('SettingsPage', () => {
  it('renders settings options', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Auto Launch')).toBeInTheDocument();
    expect(screen.getByText('Show Overlay')).toBeInTheDocument();
    expect(screen.getByText('Toxic Player Alerts')).toBeInTheDocument();
  });

  it('toggles a setting when clicked', async () => {
    render(<SettingsPage />);
    const autoLaunchBtn = screen.getAllByRole('button')[0];
    // Initially on
    expect(autoLaunchBtn).toHaveClass('bg-accent-cyan/50');
    fireEvent.click(autoLaunchBtn);
    // Now off
    await waitFor(() => {
      expect(screen.getAllByRole('button')[0]).toHaveClass('bg-slate-700');
    });
  });

  it('updates opacity range', () => {
    render(<SettingsPage />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '50' } });
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
