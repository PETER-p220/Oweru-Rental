<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class RegistrationEmail implements ValidationRule
{
    /** @var list<string> */
    private const DISPOSABLE_DOMAINS = [
        'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com',
        'grr.la', 'tempmail.com', 'temp-mail.org', '10minutemail.com', 'yopmail.com',
        'throwaway.email', 'getnada.com', 'maildrop.cc', 'fakeinbox.com', 'trashmail.com',
        'dispostable.com', 'mintemail.com', 'emailondeck.com', 'tempail.com',
        'example.com', 'example.org', 'example.net', 'test.com', 'localhost',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $email = is_string($value) ? strtolower(trim($value)) : '';

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $fail('Enter a valid email address (e.g. name@gmail.com).');

            return;
        }

        if (! preg_match('/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i', $email)) {
            $fail('Enter a valid email address with a real domain.');

            return;
        }

        $parts = explode('@', $email, 2);
        $domain = $parts[1] ?? '';

        if (in_array($domain, self::DISPOSABLE_DOMAINS, true)) {
            $fail('Temporary or disposable email addresses are not allowed. Use Gmail, Outlook, Yahoo, or your work email.');

            return;
        }

        if (str_contains($domain, '..') || str_starts_with($domain, '.') || str_ends_with($domain, '.')) {
            $fail('The email domain looks invalid.');

            return;
        }
    }
}
