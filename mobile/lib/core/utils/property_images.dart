import 'dart:convert';

const String kPropertyStorageBase = 'https://rental.oweru.com';

/// Build a public storage URL for a relative image path.
String resolvePropertyImageUrl(String? path) {
  if (path == null || path.trim().isEmpty) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  final clean = path.replaceFirst(RegExp(r'^/+'), '');
  if (clean.startsWith('storage/')) return '$kPropertyStorageBase/$clean';
  return '$kPropertyStorageBase/storage/$clean';
}

String _pathFromImageEntry(dynamic entry) {
  if (entry == null) return '';
  if (entry is String && entry.trim().isNotEmpty) return entry.trim();
  if (entry is Map) {
    final path = entry['image_path'] ??
        entry['path'] ??
        entry['url'] ??
        entry['src'] ??
        entry['image'] ??
        '';
    return path.toString().trim();
  }
  return '';
}

/// Best thumbnail for list cards — supports public `thumbnail`, relations, and legacy `images`.
String getPropertyImageUrl(Map<String, dynamic> property) {
  for (final key in ['thumbnail', 'cover_image', 'image', 'main_image']) {
    final direct = property[key];
    if (direct != null && direct.toString().trim().isNotEmpty) {
      return resolvePropertyImageUrl(direct.toString());
    }
  }

  for (final key in ['property_images', 'propertyImages']) {
    final images = property[key];
    if (images is List && images.isNotEmpty) {
      final primary = images.cast<dynamic>().firstWhere(
            (i) =>
                i is Map &&
                (i['is_primary'] == 1 || i['is_primary'] == true),
            orElse: () => images[0],
          );
      final path = _pathFromImageEntry(primary);
      if (path.isNotEmpty) return resolvePropertyImageUrl(path);
    }
  }

  var imgs = property['images'];
  if (imgs is String) {
    try {
      imgs = jsonDecode(imgs);
    } catch (_) {
      imgs = imgs.trim().isNotEmpty ? [imgs] : null;
    }
  }
  if (imgs is List && imgs.isNotEmpty) {
    final primary = imgs.cast<dynamic>().firstWhere(
          (entry) =>
              entry is Map &&
              (entry['is_primary'] == 1 || entry['is_primary'] == true),
          orElse: () => imgs![0],
        );
    final path = _pathFromImageEntry(primary);
    if (path.isNotEmpty) return resolvePropertyImageUrl(path);
  }

  return '';
}

/// All gallery URLs for a property detail view (thumbnail + relations + legacy fields).
List<String> getPropertyImageUrls(Map<String, dynamic> property) {
  final urls = <String>[];
  final seen = <String>{};

  void addRaw(String? path) {
    final url = resolvePropertyImageUrl(path);
    if (url.isNotEmpty && seen.add(url)) urls.add(url);
  }

  for (final key in ['property_images', 'propertyImages']) {
    final list = property[key];
    if (list is List) {
      for (final entry in list) {
        addRaw(_pathFromImageEntry(entry));
      }
    }
  }

  var imgs = property['images'];
  if (imgs is String) {
    try {
      imgs = jsonDecode(imgs);
    } catch (_) {
      if (imgs.trim().isNotEmpty) addRaw(imgs);
      imgs = null;
    }
  }
  if (imgs is List) {
    for (final entry in imgs) {
      addRaw(_pathFromImageEntry(entry));
    }
  }

  if (urls.isEmpty) {
    for (final key in ['thumbnail', 'cover_image', 'image', 'main_image']) {
      addRaw(property[key]?.toString());
    }
  } else {
    for (final key in ['thumbnail', 'cover_image']) {
      final thumb = resolvePropertyImageUrl(property[key]?.toString());
      if (thumb.isNotEmpty && !seen.contains(thumb)) {
        urls.insert(0, thumb);
        seen.add(thumb);
      }
    }
  }

  return urls;
}
