class PaymentDurationOption {
  final int value;
  final String label;

  const PaymentDurationOption({required this.value, required this.label});
}

const paymentDurationOptions = <PaymentDurationOption>[
  PaymentDurationOption(value: 1, label: '1 month (monthly)'),
  PaymentDurationOption(value: 3, label: '3 months (quarterly)'),
  PaymentDurationOption(value: 6, label: '6 months (semi-annual)'),
  PaymentDurationOption(value: 12, label: '12 months (annual)'),
];

int paymentDurationMonths(dynamic raw) {
  if (raw is int) return raw > 0 ? raw : 1;
  if (raw is num) return raw.toInt() > 0 ? raw.toInt() : 1;
  if (raw is String) {
    final parsed = int.tryParse(raw);
    if (parsed != null && parsed > 0) return parsed;
  }
  return 1;
}

String formatPaymentDuration(int? months) {
  final m = months ?? 1;
  for (final opt in paymentDurationOptions) {
    if (opt.value == m) return opt.label;
  }
  return '$m month${m == 1 ? '' : 's'}';
}

String formatPaymentPeriodLabel(int? months) {
  final m = months ?? 1;
  if (m == 1) return 'per month';
  return 'for $m months';
}

num periodRentTotal(num monthlyRent, int? months) {
  return monthlyRent * (months ?? 1);
}

String formatPriceSuffix(Map<String, dynamic> property) {
  final months = paymentDurationMonths(property['payment_duration_months']);
  if (months > 1) return formatPaymentPeriodLabel(months);
  final priceType = property['price_type']?.toString() ?? '';
  if (priceType == 'yearly') return '/yr';
  if (priceType == 'sale') return '';
  return '/mo';
}
