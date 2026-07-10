import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AnalyticsPage from '../page';

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <div />,
  BarChart3: () => <div />,
  Eye: () => <div />,
  MousePointerClick: () => <div />,
  TrendingUp: () => <div />,
  Globe: () => <div />,
  AlertCircle: () => <div />,
  Bot: () => <div />
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => <div />,
  Cell: () => <div />
}));

jest.mock('@/lib/supabaseBrowser', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } })
    }
  }
}));

const mockSummary = {
  totalPageViews: 100,
  uniquePageViews: 50,
  recentPageViews: [
    {
      id: '1',
      viewedAt: '2023-01-01T12:00:00Z',
      referrerSource: 'Direct',
      userAgent: 'Googlebot/2.1',
      country: 'USA',
      city: 'NY',
      pagePath: '/resume'
    },
    {
      id: '2',
      viewedAt: '2023-01-01T12:05:00Z',
      referrerSource: 'Google',
      userAgent: 'Mozilla/5.0',
      country: 'USA',
      city: 'LA',
      pagePath: '/admin/dashboard'
    }
  ],
  recentLinkClicks: [],
  totalAiQueries: 10,
  uniqueAiQueries: 5,
  recentAiQueries: [
    {
      id: '1',
      queriedAt: '2023-01-01T12:10:00Z',
      queryText: 'Test AI Query',
      visitorSessionId: 'session123'
    }
  ]
};

describe('AnalyticsPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockSummary)
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders AI Queries tab and data', async () => {
    render(<AnalyticsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('traffic_telemetry')).toBeInTheDocument();
    });

    const aiQueriesTab = screen.getByRole('button', { name: /AI Queries/i });
    fireEvent.click(aiQueriesTab);

    expect(screen.getByText('Test AI Query')).toBeInTheDocument();
    expect(screen.getByText('Session: session123')).toBeInTheDocument();
  });

  it('renders loading state initially', async () => {
    // Delay resolution to capture loading state
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: () => Promise.resolve(mockSummary),
    }), 100)));

    render(<AnalyticsPage />);
    
    // Check for AdminSkeleton classes
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows error state when fetching fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: jest.fn().mockResolvedValue('Failed to load analytics'),
    });
    
    render(<AnalyticsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics/i)).toBeInTheDocument();
    });
  });

  it('displays BOT badge for bot user agents in visitor journeys', async () => {
    render(<AnalyticsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('traffic_telemetry')).toBeInTheDocument();
    });

    const journeysTab = screen.getByRole('button', { name: /Visitor Journeys/i });
    fireEvent.click(journeysTab);

    // Googlebot triggers BOT badge
    expect(screen.getByText('BOT')).toBeInTheDocument();
  });

  it('filters out admin views by default and toggles them', async () => {
    render(<AnalyticsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('traffic_telemetry')).toBeInTheDocument();
    });

    // Default: 1 filtered view
    expect(screen.getByText('(1 filtered)')).toBeInTheDocument();

    const toggle = screen.getByLabelText('Show /admin views');
    fireEvent.click(toggle);

    // After toggle: 2 filtered views
    expect(screen.getByText('(2 filtered)')).toBeInTheDocument();
  });
});
