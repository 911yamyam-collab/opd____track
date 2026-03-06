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

  it('Apply Stretch uses correct preset for selected stretch type', () => {
    render(<TrueStretchPage />);
    // Select 5:4 stretch type from the ratio buttons
    const ratioButtons = screen.getAllByRole('button');
    const btn54 = ratioButtons.find(b => b.textContent === '5:4');
    expect(btn54).toBeDefined();
    fireEvent.click(btn54!);
    fireEvent.click(screen.getByText('Apply Stretch'));
    // 5:4 preset is 1280x1024, should appear in current resolution display
    expect(screen.getAllByText('1280x1024')).toHaveLength(2);
  });

  it('Apply Stretch uses 16:10 preset when selected', () => {
    render(<TrueStretchPage />);
    // Select 16:10 stretch type from the ratio buttons
    const ratioButtons = screen.getAllByRole('button');
    const btn1610 = ratioButtons.find(b => b.textContent === '16:10');
    expect(btn1610).toBeDefined();
    fireEvent.click(btn1610!);
    fireEvent.click(screen.getByText('Apply Stretch'));
    // 16:10 preset is 1680x1050
    expect(screen.getAllByText('1680x1050')).toHaveLength(2);
  });
});
