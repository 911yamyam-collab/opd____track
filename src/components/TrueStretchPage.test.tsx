import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TrueStretchPage from './TrueStretchPage';

describe('TrueStretchPage', () => {
  it('renders initial resolution', () => {
    render(<TrueStretchPage />);
    expect(screen.getByText('1920x1080')).toBeInTheDocument();
  });

  it('changes stretch type to custom and allows setting custom resolution', () => {
    render(<TrueStretchPage />);
    fireEvent.click(screen.getByText('custom'));
    
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2); // width and height
    
    fireEvent.change(inputs[0], { target: { value: '1440' } });
    fireEvent.change(inputs[1], { target: { value: '1080' } });
    
    fireEvent.click(screen.getByText('Apply Stretch'));
    expect(screen.getByText('1440x1080')).toBeInTheDocument();
  });

  it('applies preset resolution', () => {
    render(<TrueStretchPage />);
    // "1024x768" is present once in the preset list
    fireEvent.click(screen.getByText('1024x768'));
    // After clicking, it should be present twice (in preset list and current resolution)
    expect(screen.getAllByText('1024x768')).toHaveLength(2);
  });
});
