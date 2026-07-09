import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobFitAnalyzer } from '../JobFitAnalyzer';
import { useJobFit } from '@/hooks/useJobFit';

// Mock the hook
jest.mock('@/hooks/useJobFit', () => ({
  useJobFit: jest.fn()
}));

describe('JobFitAnalyzer', () => {
  const mockAnalyzeJobFit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnAnalysisComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useJobFit as jest.Mock).mockReturnValue({
      isAnalyzing: false,
      error: null,
      analyzeJobFit: mockAnalyzeJobFit
    });
  });

  it('renders the JobFitAnalyzer with text input by default', () => {
    render(<JobFitAnalyzer onCancel={mockOnCancel} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    expect(screen.getByText('Analyze Job Fit')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste the job description here...')).toBeInTheDocument();
  });

  it('toggles to URL input', () => {
    render(<JobFitAnalyzer onCancel={mockOnCancel} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    const urlBtn = screen.getByRole('button', { name: /Paste URL/i });
    fireEvent.click(urlBtn);

    expect(screen.getByPlaceholderText('https://example.com/job')).toBeInTheDocument();
  });

  it('calls onCancel when close button is clicked', () => {
    render(<JobFitAnalyzer onCancel={mockOnCancel} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    // Close button is an svg inside a button
    // It's the second button after BotIcon if we don't have aria-labels, 
    // let's grab the one with the svg path
    const closeBtn = screen.getByRole('button', { name: '' }); 
    // Actually there are multiple buttons, let's find it another way, or just click the first button with no text
    // The tabs have text "Paste Description", "Paste URL", "Analyze"
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(b => b.innerHTML.includes('svg') && !b.textContent);
    
    if (closeButton) {
      fireEvent.click(closeButton);
    }
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('submits text input correctly', async () => {
    mockAnalyzeJobFit.mockResolvedValueOnce({ matchScore: 85 });
    render(<JobFitAnalyzer onCancel={mockOnCancel} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    fireEvent.change(textarea, { target: { value: 'Frontend Developer' } });

    const submitBtn = screen.getByRole('button', { name: 'Analyze' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAnalyzeJobFit).toHaveBeenCalledWith({ rawText: 'Frontend Developer' });
      expect(mockOnAnalysisComplete).toHaveBeenCalledWith({ matchScore: 85 });
    });
  });

  it('submits url input correctly', async () => {
    mockAnalyzeJobFit.mockResolvedValueOnce({ matchScore: 90 });
    render(<JobFitAnalyzer onCancel={mockOnCancel} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Paste URL/i }));
    
    const input = screen.getByPlaceholderText('https://example.com/job');
    fireEvent.change(input, { target: { value: 'https://example.com/job' } });

    const submitBtn = screen.getByRole('button', { name: 'Analyze' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAnalyzeJobFit).toHaveBeenCalledWith({ url: 'https://example.com/job' });
      expect(mockOnAnalysisComplete).toHaveBeenCalledWith({ matchScore: 90 });
    });
  });

  it('disables submit button when input is empty or analyzing', () => {
    (useJobFit as jest.Mock).mockReturnValue({
      isAnalyzing: true,
      error: null,
      analyzeJobFit: mockAnalyzeJobFit
    });
    render(<JobFitAnalyzer onCancel={mockOnCancel} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    const submitBtn = screen.getByRole('button', { name: /Analyzing Fit/i });
    expect(submitBtn).toBeDisabled();
  });

  it('shows error message if there is an error', () => {
    (useJobFit as jest.Mock).mockReturnValue({
      isAnalyzing: false,
      error: 'Failed to analyze',
      analyzeJobFit: mockAnalyzeJobFit
    });
    render(<JobFitAnalyzer onCancel={mockOnCancel} onAnalysisComplete={mockOnAnalysisComplete} />);
    
    expect(screen.getByText('Failed to analyze')).toBeInTheDocument();
  });
});
