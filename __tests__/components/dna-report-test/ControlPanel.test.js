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
    onMonolithicEnrichmentToggle: jest.fn(),
    onArchitectureChange: jest.fn(),
    onSystemPromptChange: jest.fn(),
    onTimeoutChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders control panel with title', () => {
    render(<ControlPanel {...mockCallbacks} />);
    expect(screen.getByText('Control Panel')).toBeInTheDocument();
  });

  test('renders API provider dropdown', () => {
    render(<ControlPanel {...mockCallbacks} provider="huggingface" />);
    const select = screen.getByLabelText('API Provider');
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('huggingface');
  });

  test('calls onProviderChange when provider is changed', () => {
    render(<ControlPanel {...mockCallbacks} provider="huggingface" />);
    const select = screen.getByLabelText('API Provider');
    fireEvent.change(select, { target: { value: 'moonshot' } });
    expect(mockCallbacks.onProviderChange).toHaveBeenCalledWith('moonshot');
  });

  test('renders model selector', () => {
    render(<ControlPanel {...mockCallbacks} provider="huggingface" model="openai/gpt-oss-20b" />);
    const select = screen.getByLabelText('Model');
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('openai/gpt-oss-20b');
  });

  test('calls onModelChange when model is changed', () => {
    render(<ControlPanel {...mockCallbacks} provider="huggingface" model="openai/gpt-oss-20b" />);
    const select = screen.getByLabelText('Model');
    fireEvent.change(select, { target: { value: 'mistralai/Mistral-7B-Instruct-v0.2' } });
    expect(mockCallbacks.onModelChange).toHaveBeenCalledWith('mistralai/Mistral-7B-Instruct-v0.2');
  });

  test('renders enrichment toggle', () => {
    render(<ControlPanel {...mockCallbacks} monolithicEnrichmentEnabled={true} />);
    const checkbox = screen.getByRole('checkbox', { name: /Use Enriched Context/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  test('calls onMonolithicEnrichmentToggle when enrichment is toggled', () => {
    render(<ControlPanel {...mockCallbacks} monolithicEnrichmentEnabled={true} />);
    const checkbox = screen.getByRole('checkbox', { name: /Use Enriched Context/i });
    fireEvent.click(checkbox);
    expect(mockCallbacks.onMonolithicEnrichmentToggle).toHaveBeenCalledWith(false);
  });

  test.skip('renders architecture mode selector', () => {
    // Architecture selector is currently commented out in ControlPanel.js
    render(<ControlPanel {...mockCallbacks} architecture="chunked" />);
    const select = screen.getByLabelText('Architecture Mode');
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('chunked');
  });

  test.skip('calls onArchitectureChange when architecture is changed', () => {
    // Architecture selector is currently commented out in ControlPanel.js
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
    const enrichmentCheckbox = screen.getByRole('checkbox', { name: /Use Enriched Context/i });
    // const architectureSelect = screen.getByLabelText('Architecture Mode'); // Commented out in component
    const generateButton = screen.getByRole('button', { name: /Generating.../i });

    expect(providerSelect).toBeDisabled();
    expect(modelSelect).toBeDisabled();
    expect(enrichmentCheckbox).toBeDisabled();
    // expect(architectureSelect).toBeDisabled();
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
