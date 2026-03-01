/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LimitsCounter from '../../../components/dna-report-test/LimitsCounter';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key) => {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('LimitsCounter Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Rendering', () => {
    test('renders with default state', () => {
      render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      expect(screen.getByText('API Usage Limits (Free Tier)')).toBeInTheDocument();
    });

    test('renders all three providers', async () => {
      render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        expect(screen.getByText('OpenRouter')).toBeInTheDocument();
        expect(screen.getByText('Hugging Face')).toBeInTheDocument();
        expect(screen.getByText('Moonshot')).toBeInTheDocument();
      });
    });

    test('highlights active provider', async () => {
      const { container } = render(<LimitsCounter currentProvider="huggingface" requestsUsed={0} />);
      
      await waitFor(() => {
        const activeBadge = screen.getByText('Active');
        expect(activeBadge).toBeInTheDocument();
        
        // Check that the active badge is in the Hugging Face section
        const huggingFaceSection = activeBadge.closest('.providerSection');
        expect(huggingFaceSection).toHaveClass('active');
      });
    });

    test('shows daily, weekly, and monthly usage for each provider', async () => {
      render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        // Should have 3 providers × 3 periods = 9 usage rows
        const dailyLabels = screen.getAllByText('Daily');
        const weeklyLabels = screen.getAllByText('Weekly');
        const monthlyLabels = screen.getAllByText('Monthly');
        
        expect(dailyLabels).toHaveLength(3);
        expect(weeklyLabels).toHaveLength(3);
        expect(monthlyLabels).toHaveLength(3);
      });
    });
  });

  describe('Collapsible Behavior', () => {
    test('starts expanded by default', async () => {
      render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        expect(screen.getByText('OpenRouter')).toBeInTheDocument();
      });
    });

    test('collapses when header is clicked', async () => {
      render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        expect(screen.getByText('OpenRouter')).toBeInTheDocument();
      });
      
      const header = screen.getByText('API Usage Limits (Free Tier)').closest('button');
      fireEvent.click(header);
      
      await waitFor(() => {
        expect(screen.queryByText('OpenRouter')).not.toBeInTheDocument();
      });
    });

    test('expands again when header is clicked twice', async () => {
      render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      const header = screen.getByText('API Usage Limits (Free Tier)').closest('button');
      
      // Collapse
      fireEvent.click(header);
      await waitFor(() => {
        expect(screen.queryByText('OpenRouter')).not.toBeInTheDocument();
      });
      
      // Expand
      fireEvent.click(header);
      await waitFor(() => {
        expect(screen.getByText('OpenRouter')).toBeInTheDocument();
      });
    });
  });

  describe('Usage Tracking', () => {
    test('initializes with zero usage', async () => {
      render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        // Check for "0 / 50" pattern (OpenRouter daily limit)
        expect(screen.getByText(/0 \/ 50/)).toBeInTheDocument();
      });
    });

    test('updates usage when requestsUsed changes', async () => {
      const { rerender } = render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        expect(screen.getByText(/0 \/ 50/)).toBeInTheDocument();
      });
      
      // Simulate 5 requests used
      rerender(<LimitsCounter currentProvider="openrouter" requestsUsed={5} />);
      
      await waitFor(() => {
        expect(screen.getByText(/5 \/ 50/)).toBeInTheDocument();
      });
    });

    test('persists usage data to localStorage', async () => {
      const { rerender } = render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        expect(screen.getByText(/0 \/ 50/)).toBeInTheDocument();
      });
      
      // Simulate 10 requests used
      rerender(<LimitsCounter currentProvider="openrouter" requestsUsed={10} />);
      
      await waitFor(() => {
        const savedData = JSON.parse(localStorage.getItem('api_usage_data'));
        expect(savedData.openrouter.daily).toBe(10);
      });
    });

    test('tracks usage separately for each provider', async () => {
      const { rerender } = render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        expect(screen.getByText(/0 \/ 50/)).toBeInTheDocument();
      });
      
      // Use 5 requests on OpenRouter
      rerender(<LimitsCounter currentProvider="openrouter" requestsUsed={5} />);
      
      await waitFor(() => {
        const savedData = JSON.parse(localStorage.getItem('api_usage_data'));
        expect(savedData.openrouter.daily).toBe(5);
      });
      
      // Switch to HuggingFace and use 10 requests
      rerender(<LimitsCounter currentProvider="huggingface" requestsUsed={10} />);
      
      await waitFor(() => {
        const savedData = JSON.parse(localStorage.getItem('api_usage_data'));
        expect(savedData.openrouter.daily).toBe(5);
        expect(savedData.huggingface.daily).toBe(10);
      });
    });
  });

  describe('Progress Bars', () => {
    test('shows green color for low usage (<70%)', async () => {
      const { container, rerender } = render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        expect(screen.getByText(/0 \/ 50/)).toBeInTheDocument();
      });
      
      // Use 30 requests (60% of 50)
      rerender(<LimitsCounter currentProvider="openrouter" requestsUsed={30} />);
      
      await waitFor(() => {
        const progressBars = container.querySelectorAll('.usageProgress');
        const openrouterDailyBar = progressBars[0]; // First progress bar is OpenRouter daily
        expect(openrouterDailyBar.style.backgroundColor).toBe('rgb(76, 175, 80)'); // #4caf50
      });
    });

    test('shows orange color for medium usage (70-90%)', async () => {
      const { container, rerender } = render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        expect(screen.getByText(/0 \/ 50/)).toBeInTheDocument();
      });
      
      // Use 40 requests (80% of 50)
      rerender(<LimitsCounter currentProvider="openrouter" requestsUsed={40} />);
      
      await waitFor(() => {
        const progressBars = container.querySelectorAll('.usageProgress');
        const openrouterDailyBar = progressBars[0];
        expect(openrouterDailyBar.style.backgroundColor).toBe('rgb(255, 152, 0)'); // #ff9800
      });
    });

    test('shows red color for high usage (>90%)', async () => {
      const { container, rerender } = render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        expect(screen.getByText(/0 \/ 50/)).toBeInTheDocument();
      });
      
      // Use 46 requests (92% of 50)
      rerender(<LimitsCounter currentProvider="openrouter" requestsUsed={46} />);
      
      await waitFor(() => {
        const progressBars = container.querySelectorAll('.usageProgress');
        const openrouterDailyBar = progressBars[0];
        expect(openrouterDailyBar.style.backgroundColor).toBe('rgb(244, 67, 54)'); // #f44336
      });
    });
  });

  describe('Reset Timers', () => {
    test('shows time until daily reset', async () => {
      render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        // Should show "Resets in Xh" for daily
        expect(screen.getAllByText(/Resets in \d+h/)).toHaveLength(3); // One for each provider
      });
    });

    test('shows time until weekly reset', async () => {
      render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        // Should show "Resets in Xd" for weekly
        expect(screen.getAllByText(/Resets in \d+d/)).toHaveLength(6); // 2 for each provider (weekly + monthly)
      });
    });
  });

  describe('Provider Limits', () => {
    test('shows correct limits for OpenRouter', async () => {
      render(<LimitsCounter currentProvider="openrouter" requestsUsed={0} />);
      
      await waitFor(() => {
        expect(screen.getByText(/0 \/ 50/)).toBeInTheDocument();    // Daily
        expect(screen.getByText(/0 \/ 350/)).toBeInTheDocument();   // Weekly
        expect(screen.getByText(/0 \/ 1500/)).toBeInTheDocument();  // Monthly (using comma separator: 1,500)
      });
    });

    test('shows correct limits for Hugging Face', async () => {
      render(<LimitsCounter currentProvider="huggingface" requestsUsed={0} />);
      
      await waitFor(() => {
        expect(screen.getByText(/0 \/ 1000/)).toBeInTheDocument();   // Daily
        expect(screen.getByText(/0 \/ 7000/)).toBeInTheDocument();   // Weekly
        expect(screen.getByText(/0 \/ 30000/)).toBeInTheDocument();  // Monthly
      });
    });

    test('shows correct limits for Moonshot', async () => {
      render(<LimitsCounter currentProvider="moonshot" requestsUsed={0} />);
      
      await waitFor(() => {
        expect(screen.getByText(/0 \/ 200/)).toBeInTheDocument();    // Daily
        expect(screen.getByText(/0 \/ 1400/)).toBeInTheDocument();  // Weekly
        expect(screen.getByText(/0 \/ 6000/)).toBeInTheDocument();  // Monthly
      });
    });
  });
});
