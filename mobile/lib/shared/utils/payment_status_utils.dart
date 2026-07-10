/// Parse payment status from tenant API poll responses.
String parsePaymentStatus(Map<String, dynamic>? response) {
  if (response == null) return 'pending';

  final data = response['data'];
  final Map<String, dynamic> payload = data is Map<String, dynamic>
      ? Map<String, dynamic>.from(data)
      : Map<String, dynamic>.from(response);

  final raw = (payload['status'] ??
          payload['payment_status'] ??
          payload['rent_payment_status'] ??
          '')
      .toString()
      .toLowerCase();

  if (['paid', 'completed', 'success', 'successful'].contains(raw)) {
    return 'paid';
  }
  if (['failed', 'cancelled', 'canceled', 'error', 'declined'].contains(raw)) {
    return 'failed';
  }
  return 'pending';
}

String paymentConfirmationMessage(String type, String status) {
  if (status == 'paid') {
    switch (type) {
      case 'site_visit':
        return 'Site visit fee confirmed! The agent will contact you to schedule a visit.';
      case 'rent':
        return 'Rent payment confirmed! You can now proceed with your contract.';
      default:
        return 'Payment confirmed successfully.';
    }
  }
  if (status == 'failed') {
    return 'Payment was not completed. Please try again.';
  }
  return 'Waiting for payment confirmation on your phone...';
}
