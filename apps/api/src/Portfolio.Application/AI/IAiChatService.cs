namespace Portfolio.Application.AI;

/// <summary>
/// Abstracts the underlying AI provider (e.g., local Ollama or cloud Gemini)
/// for resume-related chat interactions.
/// </summary>
public interface IAiChatService
{
    /// <summary>
    /// Streams the response from the AI model token-by-token.
    /// </summary>
    /// <param name="systemPrompt">The strictly bounded RAG context and instructions.</param>
    /// <param name="userMessage">The user's query.</param>
    /// <param name="cancellationToken">Cancellation token to abort the stream mid-flight.</param>
    /// <returns>An asynchronous stream of text chunks.</returns>
    IAsyncEnumerable<string> AskQuestionStreamAsync(string systemPrompt, string userMessage, CancellationToken cancellationToken = default);
    Task<string> AskQuestionAsync(string systemPrompt, string userMessage, CancellationToken cancellationToken = default);
}
