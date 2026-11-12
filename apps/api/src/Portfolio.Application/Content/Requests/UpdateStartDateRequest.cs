namespace Portfolio.Application.Content.Requests;

/// <summary>
/// Payload for the dedicated project start-date endpoint. A <c>null</c> value clears the date.
/// </summary>
public class UpdateStartDateRequest
{
    public DateTime? StartDate { get; set; }
}
