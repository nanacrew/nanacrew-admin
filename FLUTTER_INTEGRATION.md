# Flutter 앱 연동 가이드

## 📱 NanaCrew Admin과 Flutter 앱 연동

배포된 어드민: https://admin-nanacrew.vercel.app

---

## 1️⃣ 패키지 추가

`pubspec.yaml`에 필요한 패키지를 추가하세요:

```yaml
dependencies:
  http: ^1.1.0
  package_info_plus: ^5.0.1
```

```bash
flutter pub get
```

---

## 2️⃣ 버전 체크 서비스 생성

`lib/services/version_check_service.dart` 파일을 생성하세요:

```dart
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'dart:convert';
import 'dart:io';

class VersionCheckService {
  static const String baseUrl = 'https://admin-nanacrew.vercel.app';

  /// 앱 시작 시 버전 체크 및 통계 전송
  static Future<Map<String, dynamic>?> checkVersionAndTrack() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final platform = Platform.isAndroid ? 'android' : 'ios';

      // 1. 통계 전송 (백그라운드에서 실행)
      trackAnalytics(
        packageInfo.packageName,
        packageInfo.version,
        platform
      ).catchError((e) {
        print('Analytics track error: $e');
      });

      // 2. 버전 체크
      final versionCheck = await checkVersion(
        packageInfo.packageName,
        packageInfo.version,
        platform
      );

      return versionCheck;
    } catch (e) {
      print('Version check and track error: $e');
      return null;
    }
  }

  /// 버전 체크 API 호출
  static Future<Map<String, dynamic>> checkVersion(
    String packageName,
    String currentVersion,
    String platform
  ) async {
    try {
      final url = Uri.parse(
        '$baseUrl/api/version-check'
        '?packageName=$packageName'
        '&currentVersion=$currentVersion'
        '&platform=$platform'
      );

      print('🔍 Version check: $url');

      final response = await http.get(url).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Version check timeout');
        }
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ Version check success: $data');
        return data;
      } else if (response.statusCode == 404) {
        print('⚠️ App not registered in admin system');
        return {};
      } else {
        print('❌ Version check failed: ${response.statusCode}');
        return {};
      }
    } catch (e) {
      print('❌ Version check error: $e');
      return {};
    }
  }

  /// 통계 추적 API 호출
  static Future<void> trackAnalytics(
    String packageName,
    String version,
    String platform
  ) async {
    try {
      final url = Uri.parse('$baseUrl/api/analytics/track');

      print('📊 Tracking analytics: $packageName $version $platform');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'packageName': packageName,
          'platform': platform,
          'version': version,
        }),
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Analytics track timeout');
        }
      );

      if (response.statusCode == 200) {
        print('✅ Analytics tracked successfully');
      } else {
        print('⚠️ Analytics track failed: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Analytics track error: $e');
    }
  }
}
```

---

## 3️⃣ 업데이트 다이얼로그 생성

`lib/widgets/update_dialog.dart` 파일을 생성하세요:

```dart
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class UpdateDialog extends StatelessWidget {
  final Map<String, dynamic> versionInfo;

  const UpdateDialog({Key? key, required this.versionInfo}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final bool forceUpdate = versionInfo['force_update'] ?? false;
    final String latestVersion = versionInfo['latest_version'] ?? '';
    final String message = versionInfo['update_message'] ?? '새로운 버전이 출시되었습니다.';
    final List<dynamic> features = versionInfo['features'] ?? [];
    final String downloadUrl = versionInfo['download_url'] ?? '';

    return WillPopScope(
      onWillPop: () async => !forceUpdate, // 강제 업데이트 시 뒤로가기 막기
      child: AlertDialog(
        title: Row(
          children: [
            Icon(
              forceUpdate ? Icons.warning : Icons.info_outline,
              color: forceUpdate ? Colors.red : Colors.blue,
            ),
            const SizedBox(width: 8),
            Text(forceUpdate ? '필수 업데이트' : '업데이트 알림'),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                message,
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 16),
              Text(
                '최신 버전: $latestVersion',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (features.isNotEmpty) ...[
                const SizedBox(height: 12),
                const Text(
                  '업데이트 내용:',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                ...features.map((feature) => Padding(
                  padding: const EdgeInsets.only(left: 8, bottom: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• ', style: TextStyle(fontSize: 14)),
                      Expanded(
                        child: Text(
                          feature.toString(),
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                )),
              ],
            ],
          ),
        ),
        actions: [
          if (!forceUpdate)
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('나중에'),
            ),
          ElevatedButton(
            onPressed: () async {
              if (downloadUrl.isNotEmpty) {
                final uri = Uri.parse(downloadUrl);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
              }
            },
            child: const Text('업데이트'),
          ),
        ],
      ),
    );
  }
}
```

**url_launcher 패키지 추가:**
```yaml
dependencies:
  url_launcher: ^6.2.1
```

---

## 4️⃣ main.dart에서 사용

```dart
import 'package:flutter/material.dart';
import 'services/version_check_service.dart';
import 'widgets/update_dialog.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Your App',
      home: const SplashScreen(),
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    // 버전 체크 및 통계 전송
    final versionInfo = await VersionCheckService.checkVersionAndTrack();

    if (versionInfo != null && versionInfo['needs_update'] == true) {
      // 업데이트 다이얼로그 표시
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: !(versionInfo['force_update'] ?? false),
          builder: (context) => UpdateDialog(versionInfo: versionInfo),
        );
      }
    }

    // 메인 화면으로 이동 (강제 업데이트가 아닌 경우)
    if (versionInfo == null || versionInfo['force_update'] != true) {
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const HomeScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: const Center(child: Text('Welcome!')),
    );
  }
}
```

---

## 5️⃣ 어드민에서 앱 등록

1. https://admin-nanacrew.vercel.app 접속
2. **앱 관리** → **+ 새 앱 등록** 클릭
3. 앱 정보 입력:
   - 앱 이름: `Your App Name`
   - 패키지명: `com.yourcompany.yourapp` (Flutter의 applicationId)
   - 플랫폼: Android, iOS 선택
4. **버전 등록**:
   - 버전: `1.0.0`
   - 최소 버전: `1.0.0`
   - 다운로드 URL: Play Store / App Store URL
   - 업데이트 메시지 및 주요 기능 입력

---

## 6️⃣ 테스트

### 로컬 테스트:
```bash
flutter run
```

앱이 시작되면:
1. 버전 체크 API 호출됨
2. 통계 API 호출됨
3. 어드민 로그 페이지에서 로그 확인 가능

### 어드민에서 확인:
- **대시보드**: 오늘 접속자 수 확인
- **앱 관리 → 앱 선택**: 버전별 통계 확인
- **통계**: 앱별 상세 통계
- **로그**: API 호출 내역 확인

---

## 🎯 주요 시나리오

### 1. 일반 업데이트 (선택)
```dart
// 어드민에서 설정:
// - 버전: 1.1.0
// - 최소 버전: 1.0.0
// - 강제 업데이트: OFF

// 결과: 다이얼로그 표시, "나중에" 버튼 있음
```

### 2. 강제 업데이트
```dart
// 어드민에서 설정:
// - 버전: 2.0.0
// - 최소 버전: 2.0.0
// - 강제 업데이트: ON

// 결과: 다이얼로그 표시, 업데이트 필수, 앱 사용 불가
```

### 3. 최신 버전
```dart
// 현재 버전 == 최신 버전
// 결과: 다이얼로그 없음, 정상 실행
```

---

## 📊 데이터 흐름

```
Flutter 앱 실행
    ↓
버전 체크 API 호출
    ↓
통계 API 호출
    ↓
어드민에 로그 기록
    ↓
대시보드/통계/로그에서 확인
```

---

## 🔒 보안 참고사항

- API는 Public이므로 누구나 호출 가능
- 민감한 정보는 전송하지 마세요
- 필요시 API Key 인증 추가 가능

---

## 🆘 문제 해결

### API 호출 실패
- 네트워크 연결 확인
- Vercel URL 확인: https://admin-nanacrew.vercel.app
- 어드민에서 앱이 등록되었는지 확인

### 로그가 보이지 않음
- Supabase에서 `api_logs` 테이블 생성 확인
- 환경 변수가 Vercel에 설정되었는지 확인

### 통계가 0으로 표시됨
- 앱을 실제로 실행해서 API 호출이 발생했는지 확인
- 어드민 로그 페이지에서 API 호출 확인
