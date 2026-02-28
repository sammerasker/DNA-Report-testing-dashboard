/**
 * Unit tests for ControlPanel component
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ControlPanel from '../../../components/dna-report-test/ControlPanel';

describe('ControlPanel', () => {
  const mockCallbacks = {
    onGenerate: jest.fn(),
    onProviderChange: jest.fn(),
    onModelChange: jest.fn(),
    onEnrichmentToggle: jest.fn(),
    onArchitectureChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders control panel with title', () => {
    render(<ControlPanel {...mockCallbacks} />);
    expect(screen.getByText('Control Panel')).toBeInTheDocument();
  });

  test('renders API provider dropdown', () => {
    render(<ControlPanel {...mockCallbacks} provider="openrouter" />);
    const select = screen.getByLabelText('API Provider');
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('openrouter');
  });

  test('calls onProviderChange when provider is changed', () => {
    render(<ControlPanel {...mockCallbacks} provider="openrouter" />);
    const select = screen.getByLabelText('API Provider');
    fireEvent.change(select, { target: { value: 'huggingface' } });
    expect(mockCallbacks.onProviderChange).toHaveBeenCalledWith('huggingface');
  });

  test('renders model selector', () => {
    render(<ControlPanel {...mockCallbacks} provider="openrouter" model="openrouter/free" />);
    const select = screen.getByLabelText('Model');
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('openrouter/free');
  });

  test('calls onModelChange when model is changed', () => {
    render(<ControlPanel {...mockCallbacks} provider="openrouter" model="openrouter/free" />);
    const select = screen.getByLabelText('Model');
    fireEvent.change(select, { target: { value: 'meta-llama/llama-3.1-8b-instruct:free' } });
    expect(mockCallbacks.onModelChange).toHaveBeenCalledWith('meta-llama/llama-3.1-8b-instruct:free');
  });

  test('renders enrichment toggle', () => {
    render(<ControlPanel {...mockCallbacks} enrichmentEnabled={true} />);
    const checkbox = screen.getByRole('checkbox', { name: /Enable Data Enrichment/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  test('calls onEnrichmentToggle when enrichment is toggled', () => {
    render(<ControlPanel {...mockCallbacks} enrichmentEnabled={true} />);
    const checkbox = screen.getByRole('checkbox', { name: /Enable Data Enrichment/i });
    fireEvent.click(checkbox);
    expect(mockCallbacks.onEnrichmentToggle).toHaveBeenCalledWith(false);
  });

  test('renders architecture mode selector', () => {
    render(<ControlPanel {...mockCallbacks} architecture="chunked" />);
    const select = screen.getByLabelText('Architecture Mode');
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('chunked');
  });

  test('calls onArchitectureChange when architecture is changed', () => {
    render(<ControlPanel {...mockCallbacks} architecture="chunked" />);
    const select = screen.getByLabelText('Architecture Mode');
    fireEvent.change(select, { target: { value: 'monolithic' } });
    expect(mockCallbacks.onArchitectureChange).toHaveBeenCalledWith('monolithic');
  });

  test('renders generate button', () => {
    render(<ControlPanel {...mockCallbacks} status="idle" />);
    const button = screen.getByRole('button', { name: /Generate Report/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  test('calls onGenerate when generate button is clicked', () => {
    render(<ControlPanel {...mockCallbacks} status="idle" />);
    const button = screen.getByRole('button', { name: /Generate Report/i });
    fireEvent.click(button);
    expect(mockCallbacks.onGenerate).toHaveBeenCalled();
  });

  test('disables controls when generating', () => {
    render(<ControlPanel {...mockCallbacks} status="generating" />);
    
    const providerSelect = screen.getByLabelText('API Provider');
    const modelSelect = screen.getByLabelText('Model');
    const enrichmentCheckbox = screen.getByRole('checkbox', { name: /Enable Data Enrichment/i });
    const architectureSelect = screen.getByLabelText('Architecture Mode');
    const generateButton = screen.getByRole('button', { name: /Generating.../i });

    expect(providerSelect).toBeDisabled();
    expect(modelSelect).toBeDisabled();
    expect(enrichmentCheckbox).toBeDisabled();
    expect(architectureSelect).toBeDisabled();
    expect(generateButton).toBeDisabled();
  });

  test('displays status indicator', () => {
    render(<ControlPanel {...mockCallbacks} status="complete" />);
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  test('displays token count', () => {
    render(<ControlPanel {...mockCallbacks} tokenCount={5000} />);
    expect(screen.getByText('5,000')).toBeInTheDocument();
  });

  test('displays elapsed time', () => {
    render(<ControlPanel {...mockCallbacks} elapsedTime={2500} />);
    expect(screen.getByText('2.50s')).toBeInTheDocument();
  });

  test('displays error message when status is error', () => {
    render(<ControlPanel {...mockCallbacks} status="error" errorMessage="API request failed" />);
    expect(screen.getByText(/API request failed/i)).toBeInTheDocument();
  });

  test('displays success message when status is complete', () => {
    render(<ControlPanel {...mockCallbacks} status="complete" />);
    expect(screen.getByText(/Report generated successfully/i)).toBeInTheDocument();
  });
});
