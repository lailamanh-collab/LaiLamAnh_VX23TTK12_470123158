using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace HomeRepairBooking.Api.Services;

public static class Slugger
{
    public static string Make(string value)
    {
        var text = value.Trim().ToLowerInvariant().Replace('đ', 'd');
        var normalized = text.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();
        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        var slug = Regex.Replace(builder.ToString().Normalize(NormalizationForm.FormC), @"[^a-z0-9]+", "-");
        return slug.Trim('-');
    }
}
